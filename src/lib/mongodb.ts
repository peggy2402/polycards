import { MongoClient, Db, Document, OptionalUnlessRequiredId } from "mongodb";
import { Animal, ProductCategory } from "@/types/animal";
import { CardComboPack, DEFAULT_FEATURED_COMBO } from "@/data/combos";
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  SeedOrderItem,
  SeedCustomerItem,
} from "@/data/seed-data";

const DB_NAME = process.env.MONGODB_DB_NAME || "polycards";

export interface DbPackCodeItem {
  code: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  description?: string;
  cardsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export const INITIAL_PACK_CODES: DbPackCodeItem[] = [
  {
    code: "POLY30-XECO-ZHVI",
    name: "Bộ 30 Thẻ AR Phương Tiện ZHVI",
    categorySlug: "xe-co",
    categoryName: "Xe Cộ & Giao Thông",
    description: "Bộ 30 thẻ bài phương tiện giao thông song ngữ Trung - Việt",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-XECO-ENVI",
    name: "Bộ 30 Thẻ AR Phương Tiện ENVI",
    categorySlug: "xe-co",
    categoryName: "Xe Cộ & Giao Thông",
    description: "Bộ 30 thẻ bài phương tiện giao thông song ngữ Anh - Việt",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-NGHENGHIEP",
    name: "Bộ 30 Thẻ AR Nghề Nghiệp",
    categorySlug: "nghe-nghiep",
    categoryName: "Nghề Nghiệp",
    description: "Bộ 30 thẻ các ngành nghề tương tác 3D WebAR",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-DONGVAT-ZHVI",
    name: "Bộ 30 Thẻ AR ĐỘNG VẬT ZH VI",
    categorySlug: "dong-vat",
    categoryName: "Động Vật",
    description: "Bộ thẻ động vật song ngữ Trung - Việt tương tác WebAR 3D",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-DONGVAT-ENVI",
    name: "Bộ 30 Thẻ AR ĐỘNG VẬT EN VI",
    categorySlug: "dong-vat",
    categoryName: "Động Vật",
    description: "Bộ thẻ động vật song ngữ Anh - Việt tương tác WebAR 3D",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-DONGVAT",
    name: "Bộ 30 Thẻ AR Động Vật",
    categorySlug: "dong-vat",
    categoryName: "Động Vật",
    description: "Bộ sưu tập 30 loài động vật tương tác 3D WebAR",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-HANHDONG",
    name: "Bộ 30 Thẻ AR Hành Động",
    categorySlug: "hanh-dong",
    categoryName: "Hành Động",
    description: "Bộ 30 thẻ động từ hành động tiếng Anh tương tác sống động",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-XECO",
    name: "Bộ 30 Thẻ AR Xe Cộ",
    categorySlug: "xe-co",
    categoryName: "Xe Cộ",
    description: "Bộ 30 phương tiện giao thông và máy bay tương tác AR",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-HOAQUA",
    name: "Bộ 30 Thẻ AR Hoa Quả",
    categorySlug: "hoa-qua",
    categoryName: "Hoa Quả",
    description: "Bộ 30 loại trái cây và thực vật bổ ích",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY120-COMBOVIP",
    name: "Trọn Bộ VIP 120 Thẻ Học AR",
    categorySlug: "combo-vip",
    categoryName: "Combo VIP",
    description: "Trọn bộ 4 chủ đề 120 thẻ bài AR 3D cao cấp",
    createdAt: "2026-10-25",
  },
];

interface InMemoryStore {
  products: Animal[];
  categories: ProductCategory[];
  orders: SeedOrderItem[];
  customers: SeedCustomerItem[];
  featuredCombo: CardComboPack;
  packCodes: DbPackCodeItem[];
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
      featuredCombo: structuredClone(DEFAULT_FEATURED_COMBO),
      packCodes: structuredClone(INITIAL_PACK_CODES),
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

    // Tự động seed và đồng bộ collection pack_codes
    await autoSeedPackCodes(db);
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

export async function dbDeleteProducts(idsOrSlugs: string[]): Promise<number> {
  const cleanList = idsOrSlugs.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  if (cleanList.length === 0) return 0;

  const mem = getInMemoryStore();
  const beforeMemCount = mem.products.length;
  mem.products = mem.products.filter(
    (p) => !idsOrSlugs.includes(p.id) && !cleanList.includes(p.slug.toLowerCase())
  );
  let deletedCount = beforeMemCount - mem.products.length;

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<Animal>("products");
    const res = await col.deleteMany({
      $or: [
        { id: { $in: idsOrSlugs } },
        { slug: { $in: cleanList } },
        { slug: { $in: idsOrSlugs } },
      ],
    });
    deletedCount = res.deletedCount;
  }

  return deletedCount;
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

const MOCK_ORDER_IDS = new Set(["ORD-505718", "ORD-001", "ORD-002", "SEED-001"]);
const MOCK_CUSTOMER_IDS = new Set(["CUST-001", "CUST-002"]);

export async function dbGetOrders(): Promise<SeedOrderItem[]> {
  const db = await getMongoDb();
  if (!db) {
    return getInMemoryStore().orders.filter((o) => !MOCK_ORDER_IDS.has(o.id));
  }

  const docs = await db.collection<SeedOrderItem>("orders").find({}).toArray();
  return docs
    .map((d) => stripMongoId(d))
    .filter((o) => !MOCK_ORDER_IDS.has(o.id) && !o.code.startsWith("SEED-"));
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
        : existing.totalSpent + (order.totalPrice || order.creditAmount || 0);
      const updatedAddress = order.customerAddress || existing.address || "";
      await col.updateOne(
        { _id: existing._id },
        { $set: { orders: updatedOrders, totalSpent: updatedSpent, address: updatedAddress } }
      );
    } else {
      await col.insertOne({ ...targetCust, address: order.customerAddress || "" });
    }
  }
}

export async function dbGetCustomers(): Promise<SeedCustomerItem[]> {
  const db = await getMongoDb();
  if (!db) {
    return getInMemoryStore().customers.filter((c) => !MOCK_CUSTOMER_IDS.has(c.id));
  }
  const col = db.collection<SeedCustomerItem>("customers");
  const list = await col.find({}).sort({ createdAt: -1 }).toArray();
  return list
    .map((doc) => {
      const { _id, ...rest } = doc as any;
      return rest as SeedCustomerItem;
    })
    .filter((c) => !MOCK_CUSTOMER_IDS.has(c.id));
}

export async function dbUpsertCustomer(customer: SeedCustomerItem): Promise<SeedCustomerItem> {
  const mem = getInMemoryStore();
  const idx = mem.customers.findIndex((c) => c.id === customer.id || (customer.phone && c.phone === customer.phone));
  if (idx >= 0) {
    mem.customers[idx] = { ...mem.customers[idx], ...customer };
  } else {
    mem.customers.push(customer);
  }

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<SeedCustomerItem>("customers");
    await col.updateOne(
      { $or: [{ id: customer.id }, ...(customer.phone ? [{ phone: customer.phone }] : [])] },
      { $set: customer },
      { upsert: true }
    );
  }

  return customer;
}

export async function dbDeleteCustomer(id: string): Promise<number> {
  const mem = getInMemoryStore();
  mem.customers = mem.customers.filter((c) => c.id !== id);

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<SeedCustomerItem>("customers");
    await col.deleteOne({ id });
    return await col.countDocuments();
  }

  return mem.customers.length;
}

// ============================================================================
// 5. FEATURED COMBO BANNER REPOSITORY (#products Home Page)
// ============================================================================

export async function dbGetFeaturedCombo(): Promise<CardComboPack> {
  const db = await getMongoDb();
  if (!db) {
    return getInMemoryStore().featuredCombo || DEFAULT_FEATURED_COMBO;
  }

  try {
    const doc = await db
      .collection<{ key: string; data: CardComboPack }>("settings")
      .findOne({ key: "featured_combo" });
    if (doc && doc.data) {
      return doc.data;
    }
  } catch (err) {
    console.warn("[MongoDB] Không thể đọc featured_combo:", err);
  }
  return getInMemoryStore().featuredCombo || DEFAULT_FEATURED_COMBO;
}

export async function dbSaveFeaturedCombo(combo: CardComboPack): Promise<CardComboPack> {
  const mem = getInMemoryStore();
  mem.featuredCombo = combo;

  const db = await getMongoDb();
  if (db) {
    await db
      .collection<{ key: string; data: CardComboPack; updatedAt: string }>("settings")
      .updateOne(
        { key: "featured_combo" },
        { $set: { key: "featured_combo", data: combo, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
  }
  return combo;
}

// ============================================================================
// 6. PACK CODES REPOSITORY (MongoDB Atlas + Fallback)
// ============================================================================

async function autoSeedPackCodes(db: Db): Promise<void> {
  try {
    const col = db.collection<DbPackCodeItem>("pack_codes");
    await col.createIndex({ code: 1 }, { unique: true }).catch(() => {});

    // 1. Quét collection products để tìm tất cả các packCode đang được sử dụng
    const productsCol = db.collection<Animal>("products");
    const productsWithPack = await productsCol
      .find({ packCode: { $exists: true, $ne: "" } })
      .project({ packCode: 1, category: 1, categorySlug: 1 })
      .toArray();

    // 2. Lập danh sách kết hợp giữa INITIAL_PACK_CODES và packCode từ products
    const packMap = new Map<string, DbPackCodeItem>();
    INITIAL_PACK_CODES.forEach((item) => packMap.set(item.code.toUpperCase(), { ...item }));

    productsWithPack.forEach((p) => {
      if (p.packCode && p.packCode.trim()) {
        const codeUpper = p.packCode.trim().toUpperCase();
        if (!packMap.has(codeUpper)) {
          packMap.set(codeUpper, {
            code: codeUpper,
            name: `Bộ Thẻ ${codeUpper}`,
            categorySlug: p.categorySlug || "khac",
            categoryName: p.category || "Khác",
            description: "Mã bộ được gắn trực tiếp trên thẻ bài trong kho",
            createdAt: new Date().toLocaleDateString("vi-VN"),
          });
        }
      }
    });

    for (const item of packMap.values()) {
      await col.updateOne(
        { code: item.code },
        {
          $setOnInsert: {
            code: item.code,
            name: item.name,
            categorySlug: item.categorySlug,
            categoryName: item.categoryName,
            description: item.description,
            createdAt: item.createdAt,
          },
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn("[MongoDB Atlas] Lỗi autoSeedPackCodes:", err);
  }
}

export async function dbGetPackCodes(): Promise<DbPackCodeItem[]> {
  const db = await getMongoDb();
  if (!db) {
    return getInMemoryStore().packCodes || INITIAL_PACK_CODES;
  }

  try {
    const col = db.collection<DbPackCodeItem>("pack_codes");
    let docs = await col.find({}).sort({ createdAt: -1 }).toArray();

    // Nếu collection rỗng, seed ngay
    if (docs.length === 0) {
      await autoSeedPackCodes(db);
      docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    }

    // Đếm số lượng thẻ thực tế cho mỗi mã bộ từ collection products
    const productsCol = db.collection<Animal>("products");
    const counts = await productsCol
      .aggregate<{ _id: string; count: number }>([
        { $match: { packCode: { $exists: true, $ne: "" } } },
        { $group: { _id: { $toUpper: "$packCode" }, count: { $sum: 1 } } },
      ])
      .toArray();

    const countMap = new Map<string, number>();
    counts.forEach((c) => {
      if (c._id) countMap.set(c._id, c.count);
    });

    return docs.map((d) => {
      const clean = stripMongoId(d);
      return {
        ...clean,
        cardsCount: countMap.get(clean.code.toUpperCase()) || 0,
      };
    });
  } catch (err) {
    console.error("[MongoDB] Lỗi dbGetPackCodes:", err);
    return getInMemoryStore().packCodes || INITIAL_PACK_CODES;
  }
}

export async function dbUpsertPackCode(
  item: Partial<DbPackCodeItem> & { code: string }
): Promise<DbPackCodeItem> {
  const cleanCode = item.code.trim().toUpperCase();
  const now = new Date().toLocaleDateString("vi-VN");

  const packData: DbPackCodeItem = {
    code: cleanCode,
    name: item.name?.trim() || `Bộ Thẻ ${cleanCode}`,
    categorySlug: item.categorySlug || "khac",
    categoryName: item.categoryName || "Khác",
    description: item.description?.trim() || undefined,
    createdAt: item.createdAt || now,
    updatedAt: new Date().toISOString(),
  };

  const mem = getInMemoryStore();
  const existingIdx = mem.packCodes.findIndex((p) => p.code.toUpperCase() === cleanCode);
  if (existingIdx >= 0) {
    mem.packCodes[existingIdx] = { ...mem.packCodes[existingIdx], ...packData };
  } else {
    mem.packCodes.unshift(packData);
  }

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<DbPackCodeItem>("pack_codes");
    await col.updateOne(
      { code: cleanCode },
      { $set: packData },
      { upsert: true }
    );
  }

  return packData;
}

export async function dbDeletePackCode(code: string): Promise<number> {
  const cleanCode = code.trim().toUpperCase();
  const mem = getInMemoryStore();
  mem.packCodes = mem.packCodes.filter((p) => p.code.toUpperCase() !== cleanCode);

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<DbPackCodeItem>("pack_codes");
    await col.deleteOne({ code: cleanCode });
    return await col.countDocuments();
  }

  return mem.packCodes.length;
}

