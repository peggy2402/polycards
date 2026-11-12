import { getMongoDb, isMongoConfigured } from "../src/lib/mongodb";
import { normalizePhoneNumber } from "../src/lib/pricing";

async function runMigration() {
  console.log("=== BẮT ĐẦU MIGRATION DỮ LIỆU CŨ POLY CARDS ===");

  if (!isMongoConfigured()) {
    console.log("ℹ️ MongoDB URI không cấu hình, bỏ qua kết nối database từ xa.");
    return;
  }

  const db = await getMongoDb();
  if (!db) {
    console.log("❌ Không thể kết nối MongoDB Atlas.");
    return;
  }

  // 1. Cập nhật hóa đơn cũ
  const ordersCol = db.collection("orders");
  const unupdatedOrders = await ordersCol
    .find({
      $or: [
        { orderStatus: { $exists: false } },
        { deliveryMethod: { $exists: false } },
      ],
    })
    .toArray();

  console.log(`Tìm thấy ${unupdatedOrders.length} hóa đơn cần cập nhật trường trạng thái & giao nhận.`);

  for (const ord of unupdatedOrders) {
    const isOnline = ord.customerType === "ONLINE";
    const defaultStatus = isOnline ? "CHO_DUYET" : "DA_NHAN";
    const defaultDelivery = isOnline ? "CPN_COD" : "TRUC_TIEP";

    await ordersCol.updateOne(
      { _id: ord._id },
      {
        $set: {
          orderStatus: ord.orderStatus || defaultStatus,
          deliveryMethod: ord.deliveryMethod || defaultDelivery,
          source: ord.source || (isOnline ? "ONLINE" : "POS"),
          customerPhone: normalizePhoneNumber(ord.customerPhone) || ord.customerPhone,
        },
      }
    );
  }
  console.log(`✅ Đã cập nhật xong ${unupdatedOrders.length} hóa đơn.`);

  // 2. Chuẩn hóa SĐT khách hàng cũ & gán mã KHxxxx nếu thiếu
  const custCol = db.collection("customers");
  const customers = await custCol.find({}).toArray();
  console.log(`Kiểm tra ${customers.length} khách hàng trong database...`);

  let custIdx = 1;
  for (const c of customers) {
    const normalized = normalizePhoneNumber(c.phone);
    const updates: Record<string, any> = {};

    if (normalized && normalized !== c.phone) {
      updates.phone = normalized;
    }

    if (!c.id || c.id.startsWith("CUST-")) {
      updates.id = `KH${String(1000 + custIdx).padStart(4, "0")}`;
    }

    if (Object.keys(updates).length > 0) {
      await custCol.updateOne({ _id: c._id }, { $set: updates });
    }
    custIdx++;
  }

  console.log(`✅ Đã hoàn tất chuẩn hóa khách hàng!`);
  console.log("=== MIGRATION HOÀN TẤT THÀNH CÔNG ===");
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Lỗi migration:", err);
  process.exit(1);
});

