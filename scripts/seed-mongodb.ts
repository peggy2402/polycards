import { MongoClient } from "mongodb";
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
} from "../src/data/seed-data";

async function seedMongoDb() {
  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB_NAME || "polycards";

  if (!uri || uri.includes("<username>") || uri.includes("<password>")) {
    console.error(
      "[Seed MongoDB] Vui lòng cấu hình biến môi trường MONGODB_URI hợp lệ trong file .env trước khi chạy lệnh này."
    );
    process.exit(1);
  }

  console.log(`[Seed MongoDB] Đang kết nối tới MongoDB Atlas (Database: ${dbName})...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // 1. Seed Categories
    const categoriesCol = db.collection("categories");
    for (const cat of INITIAL_CATEGORIES) {
      await categoriesCol.updateOne({ slug: cat.slug }, { $set: cat }, { upsert: true });
    }
    console.log(`[OK] Đã đồng bộ ${INITIAL_CATEGORIES.length} danh mục vào collection 'categories'.`);

    // 2. Seed Products
    const productsCol = db.collection("products");
    for (const prod of INITIAL_PRODUCTS) {
      await productsCol.updateOne({ slug: prod.slug }, { $set: prod }, { upsert: true });
    }
    console.log(`[OK] Đã đồng bộ ${INITIAL_PRODUCTS.length} thẻ bài vào collection 'products'.`);

    // 3. Seed Orders
    const ordersCol = db.collection("orders");
    for (const ord of INITIAL_ORDERS) {
      await ordersCol.updateOne({ code: ord.code }, { $set: ord }, { upsert: true });
    }
    console.log(`[OK] Đã đồng bộ ${INITIAL_ORDERS.length} đơn hàng mẫu vào collection 'orders'.`);

    // 4. Seed Customers
    const customersCol = db.collection("customers");
    for (const cust of INITIAL_CUSTOMERS) {
      await customersCol.updateOne({ id: cust.id }, { $set: cust }, { upsert: true });
    }
    console.log(`[OK] Đã đồng bộ ${INITIAL_CUSTOMERS.length} khách hàng mẫu vào collection 'customers'.`);

    console.log("\n[HOÀN TẤT] Toàn bộ dữ liệu Poly Cards đã sẵn sàng trên MongoDB Atlas!");
  } finally {
    await client.close();
  }
}

seedMongoDb().catch((err) => {
  console.error("[Seed MongoDB Error]:", err);
  process.exit(1);
});

