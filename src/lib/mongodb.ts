import { MongoClient, Db, Document, OptionalUnlessRequiredId } from "mongodb";
import { Animal, ProductCategory } from "@/types/animal";
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  SeedOrderItem,
  SeedCustomerItem,
} from "@/data/seed-data";

const DB_NAME = process.env.MONGODB_DB_NAME || "polycards";

interface InMemoryStore {
  products: Animal[];
  categories: ProductCategory[];
  orders: SeedOrderItem[];
  customers: SeedCustomerItem[];
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoSeeded: boolean | undefined;
  var _inMemoryStore: InMemoryStore | undefined;
}

function getInMemoryStore(): InMemoryStore {
  if (!globalThis._inMemoryStore) {
    globalThis._inMemoryStore = {
      products: structuredClone(INITIAL_PRODUCTS),
      categories: structuredClone(INITIAL_CATEGORIES),
      orders: structuredClone(INITIAL_ORDERS),
      customers: structuredClone(INITIAL_CUSTOMERS),
    };
  }
  return globalThis._inMemoryStore;
}

export function isMongoConfigured(): boolean {
  const uri = process.env.MONGODB_URI?.trim();
  return Boolean(
    uri &&
      (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")) &&
      !uri.includes("<username>") &&
      !uri.includes("<password>")
  );
}

export async function getMongoDb(): Promise<Db | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  const uri = process.env.MONGODB_URI!.trim();

  try {
    if (!globalThis._mongoClientPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 10000,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });
      globalThis._mongoClientPromise = client.connect();
    }

    const client = await globalThis._mongoClientPromise;
    const db = client.db(DB_NAME);

    // Tự động seed dữ liệu ban đầu nếu các collection trên MongoDB Atlas đang rỗng
    if (!globalThis._mongoSeeded) {
      globalThis._mongoSeeded = true;
      await autoSeedDatabaseIfEmpty(db);
    }

    return db;
  } catch (err) {
    console.error("[MongoDB Atlas] Không thể kết nối, chuyển sang bộ nhớ đệm an toàn:", err);
    globalThis._mongoClientPromise = undefined;
    return null;
  }
}

async function autoSeedDatabaseIfEmpty(db: Db): Promise<void> {
  try {
    const productsCol = db.collection<Animal>("products");
    const categoriesCol = db.collection<ProductCategory>("categories");
    const ordersCol = db.collection<SeedOrderItem>("orders");
    const customersCol = db.collection<SeedCustomerItem>("customers");

    const [prodCount, catCount, ordCount, custCount] = await Promise.all([
      productsCol.countDocuments(),
      categoriesCol.countDocuments(),
      ordersCol.countDocuments(),
      customersCol.countDocuments(),
    ]);

    if (prodCount === 0 && INITIAL_PRODUCTS.length > 0) {
      await productsCol.insertMany(
        INITIAL_PRODUCTS.map((item) => ({ ...item })) as OptionalUnlessRequiredId<Animal>[]
      );
      await productsCol.createIndex({ slug: 1 }, { unique: true }).catch(() => {});
      await productsCol.createIndex({ id: 1 }).catch(() => {});
    }

    if (catCount === 0 && INITIAL_CATEGORIES.length > 0) {
      await categoriesCol.insertMany(
        INITIAL_CATEGORIES.map((item) => ({ ...item })) as OptionalUnlessRequiredId<ProductCategory>[]
      );
      await categoriesCol.createIndex({ slug: 1 }, { unique: true }).catch(() => {});
    }

    if (ordCount === 0 && INITIAL_ORDERS.length > 0) {
      await ordersCol.insertMany(
        INITIAL_ORDERS.map((item) => ({ ...item })) as OptionalUnlessRequiredId<SeedOrderItem>[]
      );
      await ordersCol.createIndex({ code: 1 }, { unique: true }).catch(() => {});
    }

    if (custCount === 0 && INITIAL_CUSTOMERS.length > 0) {
      await customersCol.insertMany(
        INITIAL_CUSTOMERS.map((item) => ({ ...item })) as OptionalUnlessRequiredId<SeedCustomerItem>[]
      );
    }
  } catch (seedErr) {
    console.warn("[MongoDB Atlas] Bỏ qua auto-seed:", seedErr);
  }
}

function stripMongoId<T extends Document>(doc: T): Omit<T, "_id"> {
  const { _id, ...rest } = doc as T & { _id?: unknown };
  void _id;
  return rest;
}

// ============================================================================
// 1. PRODUCTS REPOSITORY (MongoDB Atlas + Fallback)
// ============================================================================

export async function dbGetProducts(): Promise<Animal[]> {
  const db = await getMongoDb();
  if (!db) {
    return getInMemoryStore().products;
  }

  const docs = await db.collection<Animal>("products").find({}).toArray();
  return docs.map((d) => stripMongoId(d));
}

export async function dbGetProductBySlug(slug: string): Promise<Animal | undefined> {
  const cleanSlug = slug.toLowerCase().trim();
  const db = await getMongoDb();
  if (!db) {
    return getInMemoryStore().products.find((p) => p.slug.toLowerCase() === cleanSlug);
  }

  const doc = await db.collection<Animal>("products").findOne({
    slug: { $regex: new RegExp(`^${cleanSlug}$`, "i") },
  });
  return doc ? stripMongoId(doc) : undefined;
}

export async function dbUpsertProduct(product: Animal): Promise<Animal> {
  const cleanProduct = stripMongoId(product as Animal & { _id?: unknown });
  const db = await getMongoDb();

  // Luôn cập nhật đồng bộ cả bộ nhớ đệm trong tiến trình
  const mem = getInMemoryStore();
  const idx = mem.products.findIndex(
    (p) => p.id === cleanProduct.id || p.slug.toLowerCase() === cleanProduct.slug.toLowerCase()
  );
  if (idx >= 0) {
    mem.products[idx] = cleanProduct;
  } else {
    mem.products.unshift(cleanProduct);
  }

  if (db) {
    await db.collection<Animal>("products").updateOne(
      {
        $or: [
          { slug: cleanProduct.slug },
          { id: cleanProduct.id },
        ],
      },
      { $set: cleanProduct },
      { upsert: true }
    );
  }

  return cleanProduct;
}

export async function dbDeleteProduct(idOrSlug: string): Promise<Animal | null> {
  const clean = idOrSlug.trim().toLowerCase();
  const mem = getInMemoryStore();
  const targetInMem =
    mem.products.find((p) => p.id === idOrSlug || p.slug.toLowerCase() === clean) || null;
  mem.products = mem.products.filter(
    (p) => p.id !== idOrSlug && p.slug.toLowerCase() !== clean
  );

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<Animal>("products");
    const existing = await col.findOne({
      $or: [
        { id: idOrSlug },
        { slug: clean },
        { slug: idOrSlug },
      ],
    });
    if (existing) {
      await col.deleteOne({ _id: existing._id });
      return stripMongoId(existing);
    }
  }

  return targetInMem;
}

// ============================================================================
// 2. CATEGORIES REPOSITORY (MongoDB Atlas + Fallback)
// ============================================================================

export async function dbGetCategories(): Promise<ProductCategory[]> {
  const db = await getMongoDb();
  if (!db) {
    return getInMemoryStore().categories;
  }

  const docs = await db.collection<ProductCategory>("categories").find({}).toArray();
  return docs.map((d) => stripMongoId(d));
}

export async function dbUpsertCategory(category: ProductCategory): Promise<ProductCategory> {
  const cleanCategory = stripMongoId(category as ProductCategory & { _id?: unknown });
  const mem = getInMemoryStore();
  const idx = mem.categories.findIndex(
    (c) => c.id === cleanCategory.id || c.slug === cleanCategory.slug
  );
  if (idx >= 0) {
    mem.categories[idx] = cleanCategory;
  } else {
    mem.categories.push(cleanCategory);
  }

  const db = await getMongoDb();
  if (db) {
    await db.collection<ProductCategory>("categories").updateOne(
      {
        $or: [{ id: cleanCategory.id }, { slug: cleanCategory.slug }],
      },
      { $set: cleanCategory },
      { upsert: true }
    );
  }

  return cleanCategory;
}

export async function dbDeleteCategory(id: string): Promise<boolean> {
  const mem = getInMemoryStore();
  mem.categories = mem.categories.filter((c) => c.id !== id);

  const db = await getMongoDb();
  if (db) {
    const res = await db.collection<ProductCategory>("categories").deleteOne({ id });
    return res.deletedCount > 0;
  }
  return true;
}

// ============================================================================
// 3. ORDERS & CUSTOMERS REPOSITORY (MongoDB Atlas + Fallback)
// ============================================================================

export async function dbGetOrders(): Promise<SeedOrderItem[]> {
  const db = await getMongoDb();
  if (!db) {
    return getInMemoryStore().orders;
  }

  const docs = await db.collection<SeedOrderItem>("orders").find({}).toArray();
  return docs.map((d) => stripMongoId(d));
}

export async function dbUpsertOrder(order: SeedOrderItem): Promise<SeedOrderItem> {
  const cleanOrder = stripMongoId(order as SeedOrderItem & { _id?: unknown });
  const mem = getInMemoryStore();
  const idx = mem.orders.findIndex(
    (o) => o.code === cleanOrder.code || o.id === cleanOrder.id
  );
  if (idx >= 0) {
    mem.orders[idx] = cleanOrder;
  } else {
    mem.orders.unshift(cleanOrder);
  }

  const db = await getMongoDb();
  if (db) {
    await db.collection<SeedOrderItem>("orders").updateOne(
      {
        $or: [{ code: cleanOrder.code }, { id: cleanOrder.id }],
      },
      { $set: cleanOrder },
      { upsert: true }
    );
  }

  return cleanOrder;
}

export async function dbDeleteOrder(id?: string | null, code?: string | null): Promise<number> {
  const mem = getInMemoryStore();
  mem.orders = mem.orders.filter((o) => (id ? o.id !== id : o.code !== code));

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<SeedOrderItem>("orders");
    if (id) {
      await col.deleteOne({ id });
    } else if (code) {
      await col.deleteOne({ code });
    }
    return await col.countDocuments();
  }

  return mem.orders.length;
}

export async function dbSyncCustomerFromOrder(order: SeedOrderItem): Promise<void> {
  if (!order.customerName) return;

  const mem = getInMemoryStore();
  const custIdx = mem.customers.findIndex(
    (c) =>
      (order.customerPhone && c.phone === order.customerPhone) ||
      c.name === order.customerName
  );

  let targetCust: SeedCustomerItem;
  if (custIdx >= 0) {
    targetCust = { ...mem.customers[custIdx] };
    if (!targetCust.orders.includes(order.id)) {
      targetCust.orders = [...targetCust.orders, order.id];
      targetCust.totalSpent += order.totalPrice || 0;
    }
    mem.customers[custIdx] = targetCust;
  } else {
    targetCust = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      name: order.customerName,
      phone: order.customerPhone || "",
      type: order.customerType,
      orders: [order.id],
      totalSpent: order.totalPrice || 0,
      createdAt: new Date().toLocaleString("vi-VN"),
    };
    mem.customers.push(targetCust);
  }

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<SeedCustomerItem>("customers");
    const existing = await col.findOne(
      order.customerPhone
        ? { $or: [{ phone: order.customerPhone }, { name: order.customerName }] }
        : { name: order.customerName }
    );

    if (existing) {
      const updatedOrders = existing.orders.includes(order.id)
        ? existing.orders
        : [...existing.orders, order.id];
      const updatedSpent = existing.orders.includes(order.id)
        ? existing.totalSpent
        : existing.totalSpent + (order.totalPrice || 0);
      await col.updateOne(
        { _id: existing._id },
        { $set: { orders: updatedOrders, totalSpent: updatedSpent } }
      );
    } else {
      await col.insertOne({ ...targetCust });
    }
  }
}

