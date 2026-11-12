import { MongoClient, Db, Document, OptionalUnlessRequiredId } from "mongodb";
import { Animal, ProductCategory, DbComboRule, OrderStatus, DeliveryMethod } from "@/types/animal";
import { CardComboPack, DEFAULT_FEATURED_COMBO } from "@/data/combos";
import { DEFAULT_COMBO_RULES } from "@/lib/combo-engine";
import { normalizePhoneNumber } from "@/lib/pricing";
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
  singleCardPrice?: number;
  originalPrice?: number;
  discountPercent?: number;
  salePrice?: number;
  isManualPrice?: boolean;
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
    code: "POLY30-HOAQUA-ENVI",
    name: "Bộ 30 Thẻ AR Hoa Quả & Trái Cây (Anh - Việt)",
    categorySlug: "hoa-qua",
    categoryName: "Hoa Quả & Trái Cây",
    description: "Bộ 30 thẻ hoa quả song ngữ Anh - Việt",
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
  combos: DbComboRule[];
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
      combos: structuredClone(DEFAULT_COMBO_RULES),
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

    // Tự động seed collection combos nếu chưa có
    const combosCol = db.collection<DbComboRule>("combos");
    const comboCount = await combosCol.countDocuments();
    if (comboCount === 0) {
      await combosCol.insertMany(
        DEFAULT_COMBO_RULES.map((rule) => ({
          ...rule,
          createdAt: new Date().toISOString(),
        })) as OptionalUnlessRequiredId<DbComboRule>[]
      );
      await combosCol.createIndex({ id: 1 }, { unique: true }).catch(() => {});
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

export async function dbSyncCustomerFromOrder(order: SeedOrderItem): Promise<SeedCustomerItem | null> {
  if (!order.customerName) return null;

  const normalizedPhone = normalizePhoneNumber(order.customerPhone);
  const mem = getInMemoryStore();
  const spentAmount = order.totalPrice || order.creditAmount || 0;

  // Tìm trong in-memory store
  const custIdx = mem.customers.findIndex((c) => {
    if (normalizedPhone && normalizePhoneNumber(c.phone) === normalizedPhone) return true;
    return c.name.toLowerCase().trim() === order.customerName.toLowerCase().trim();
  });

  let targetCust: SeedCustomerItem;

  if (custIdx >= 0) {
    targetCust = { ...mem.customers[custIdx] };
    if (!targetCust.orders.includes(order.id)) {
      targetCust.orders = [...targetCust.orders, order.id];
      targetCust.totalSpent = (targetCust.totalSpent || 0) + spentAmount;
    }
    if (order.customerAddress) {
      targetCust.address = order.customerAddress;
    }
    if (normalizedPhone) {
      targetCust.phone = normalizedPhone;
    }
    mem.customers[custIdx] = targetCust;
  } else {
    // Sinh mã KHxxxx chuẩn mực (ví dụ KH1001, KH1002...)
    const currentCount = mem.customers.length;
    const khCode = `KH${String(1001 + currentCount).padStart(4, "0")}`;

    targetCust = {
      id: khCode,
      name: order.customerName.trim(),
      phone: normalizedPhone || order.customerPhone || "",
      address: order.customerAddress || "",
      type: order.customerType || "ONLINE",
      orders: [order.id],
      totalSpent: spentAmount,
      createdAt: new Date().toLocaleString("vi-VN"),
    };
    mem.customers.push(targetCust);
  }

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<SeedCustomerItem>("customers");
    const filterQuery = normalizedPhone
      ? { $or: [{ phone: normalizedPhone }, { phone: order.customerPhone }, { name: order.customerName }] }
      : { name: order.customerName };

    const existing = await col.findOne(filterQuery);

    if (existing) {
      const updatedOrders = existing.orders.includes(order.id)
        ? existing.orders
        : [...existing.orders, order.id];
      const updatedSpent = existing.orders.includes(order.id)
        ? existing.totalSpent
        : (existing.totalSpent || 0) + spentAmount;
      const updatedAddress = order.customerAddress || existing.address || "";
      const updatedPhone = normalizedPhone || existing.phone || "";

      await col.updateOne(
        { _id: existing._id },
        {
          $set: {
            orders: updatedOrders,
            totalSpent: updatedSpent,
            address: updatedAddress,
            phone: updatedPhone,
          },
        }
      );
      targetCust = {
        ...stripMongoId(existing),
        orders: updatedOrders,
        totalSpent: updatedSpent,
        address: updatedAddress,
        phone: updatedPhone,
      };
    } else {
      const totalDbCusts = await col.countDocuments();
      const khCode = `KH${String(1001 + totalDbCusts).padStart(4, "0")}`;
      targetCust.id = khCode;
      await col.insertOne({ ...targetCust });
    }
  }

  return targetCust;
}

export async function dbSearchCustomerByPhone(phoneQuery: string): Promise<SeedCustomerItem | null> {
  const normalized = normalizePhoneNumber(phoneQuery);
  if (!normalized || normalized.length < 4) return null;

  const mem = getInMemoryStore();
  const localMatch = mem.customers.find((c) => {
    const p = normalizePhoneNumber(c.phone);
    return p && (p === normalized || p.includes(normalized));
  });

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<SeedCustomerItem>("customers");
    const doc = await col.findOne({
      $or: [
        { phone: normalized },
        { phone: phoneQuery },
        { phone: { $regex: normalized, $options: "i" } },
      ],
    });
    if (doc) return stripMongoId(doc);
  }

  return localMatch ? { ...localMatch } : null;
}

export async function dbUpdateOrderStatus(orderId: string, orderStatus: OrderStatus): Promise<SeedOrderItem | null> {
  const mem = getInMemoryStore();
  const idx = mem.orders.findIndex((o) => o.id === orderId || o.code === orderId);
  if (idx >= 0) {
    mem.orders[idx].orderStatus = orderStatus;
    if (orderStatus === "DA_NHAN") {
      mem.orders[idx].status = "PAID";
    } else if (orderStatus === "DA_HUY") {
      mem.orders[idx].status = "CANCELLED";
    }
  }

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<SeedOrderItem>("orders");
    const statusUpdate: Record<string, unknown> = { orderStatus };
    if (orderStatus === "DA_NHAN") statusUpdate.status = "PAID";
    if (orderStatus === "DA_HUY") statusUpdate.status = "CANCELLED";

    await col.updateOne(
      { $or: [{ id: orderId }, { code: orderId }] },
      { $set: statusUpdate }
    );
    const doc = await col.findOne({ $or: [{ id: orderId }, { code: orderId }] });
    if (doc) return stripMongoId(doc);
  }

  return idx >= 0 ? mem.orders[idx] : null;
}

export async function dbUpdateOrderDelivery(
  orderId: string,
  deliveryMethod: DeliveryMethod,
  codAmount?: number
): Promise<SeedOrderItem | null> {
  const mem = getInMemoryStore();
  const idx = mem.orders.findIndex((o) => o.id === orderId || o.code === orderId);
  if (idx >= 0) {
    mem.orders[idx].deliveryMethod = deliveryMethod;
    if (deliveryMethod === "CPN_COD") {
      mem.orders[idx].codAmount = codAmount || 0;
    }
  }

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<SeedOrderItem>("orders");
    const updateObj: Record<string, unknown> = { deliveryMethod };
    if (deliveryMethod === "CPN_COD") {
      updateObj.codAmount = codAmount || 0;
    }
    await col.updateOne({ $or: [{ id: orderId }, { code: orderId }] }, { $set: updateObj });
    const doc = await col.findOne({ $or: [{ id: orderId }, { code: orderId }] });
    if (doc) return stripMongoId(doc);
  }

  return idx >= 0 ? mem.orders[idx] : null;
}

// ==========================================
// QUẢN LÝ DYNAMIC COMBO RULES TRONG MONGODB
// ==========================================

export async function dbGetComboRules(): Promise<DbComboRule[]> {
  const db = await getMongoDb();
  if (!db) {
    return getInMemoryStore().combos.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  }

  const docs = await db
    .collection<DbComboRule>("combos")
    .find({})
    .sort({ priority: 1 })
    .toArray();

  if (docs.length === 0) {
    // Khởi tạo combo rules mặc định nếu chưa có
    await db.collection<DbComboRule>("combos").insertMany(
      DEFAULT_COMBO_RULES.map((rule) => ({
        ...rule,
        createdAt: new Date().toISOString(),
      })) as OptionalUnlessRequiredId<DbComboRule>[]
    );
    return DEFAULT_COMBO_RULES;
  }

  return docs.map((d) => stripMongoId(d));
}

export async function dbUpsertComboRule(rule: DbComboRule): Promise<DbComboRule> {
  const cleanRule = stripMongoId(rule as DbComboRule & { _id?: unknown });
  const mem = getInMemoryStore();
  const idx = mem.combos.findIndex((r) => r.id === cleanRule.id);
  if (idx >= 0) {
    mem.combos[idx] = cleanRule;
  } else {
    mem.combos.push(cleanRule);
  }

  const db = await getMongoDb();
  if (db) {
    await db.collection<DbComboRule>("combos").updateOne(
      { id: cleanRule.id },
      { $set: { ...cleanRule, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  }

  return cleanRule;
}

export async function dbDeleteComboRule(id: string): Promise<boolean> {
  const mem = getInMemoryStore();
  mem.combos = mem.combos.filter((r) => r.id !== id);

  const db = await getMongoDb();
  if (db) {
    const res = await db.collection<DbComboRule>("combos").deleteOne({ id });
    return res.deletedCount > 0;
  }

  return true;
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

