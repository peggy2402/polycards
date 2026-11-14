import { COMBO_PACKS } from "@/data/combos";
import {
  InventoryItem,
  InventoryTransaction,
  InventoryTransactionType,
  InventoryStats,
} from "@/types/inventory";
import { getMongoDb } from "@/lib/mongodb";

function cleanMongoDoc<T>(doc: any): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest as T;
}

// Khởi tạo mặc định 10 Bộ Thành Phẩm Poly Cards (Tổng 300 thẻ)
// Đợt 1 đã xuất xưởng 10 hộp thành phẩm đóng gói hoàn chỉnh
const INITIAL_INVENTORY_ITEMS: InventoryItem[] = COMBO_PACKS.map((pack, idx) => ({
  id: pack.id,
  packCode: pack.packCode,
  name: pack.name,
  categoryName: pack.categoryName,
  categorySlug: pack.categorySlug,
  languageType: pack.languageType || "en-vi",
  cardsCount: pack.cardsCount || 30,
  price: pack.price || 300000,
  unitCost: 85000, // Giá vốn sản xuất mẫu
  imageSrc: pack.imageSrc || "/images/cards/butterfly-card.png",
  badge: pack.badge,
  description: pack.description,
  // Khởi điểm: Đã xuất xưởng 10 hộp đợt 1 (mỗi loại 1 hộp mẫu thực tế ban đầu)
  onHand: idx < 10 ? 1 : 0, 
  backorderCount: 0,
  available: idx < 10 ? 1 : 0,
  allowBackorder: true, // Luôn bật cho phép khách đặt trước khi hết kho
  minAlertLevel: 3,     // Dưới 3 bộ thì cảnh báo cần in gấp
  updatedAt: new Date().toISOString(),
}));

// In-Memory Fallback Store
interface InMemoryInventoryStore {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  initialized: boolean;
}

const g = global as unknown as { __POLYCARDS_INVENTORY__?: InMemoryInventoryStore };
if (!g.__POLYCARDS_INVENTORY__) {
  g.__POLYCARDS_INVENTORY__ = {
    items: JSON.parse(JSON.stringify(INITIAL_INVENTORY_ITEMS)),
    transactions: [
      {
        id: "tx-init-001",
        packCode: "ALL-10-PACKS",
        packName: "Lô 10 Hộp Thành Phẩm Đầu Tiên Xuất Xưởng",
        type: "STOCK_IN",
        quantity: 10,
        beforeOnHand: 0,
        afterOnHand: 10,
        unitCost: 85000,
        totalValue: 850000,
        note: "Xuất xưởng thành phẩm đóng hộp 10 bộ đầu tiên (300 thẻ AR)",
        createdAt: new Date().toISOString(),
      },
    ],
    initialized: true,
  };
}

function getMemoryStore(): InMemoryInventoryStore {
  return g.__POLYCARDS_INVENTORY__!;
}

// 1. LẤY DANH SÁCH 10 BỘ TỒN KHO
export async function getInventoryItems(): Promise<InventoryItem[]> {
  const db = await getMongoDb();
  if (db) {
    const col = db.collection<InventoryItem>("inventory_items");
    const count = await col.countDocuments();
    if (count === 0) {
      // Khởi tạo an toàn không lo race condition bằng Bulk Upsert
      const ops = INITIAL_INVENTORY_ITEMS.map((item) => ({
        updateOne: {
          filter: { packCode: item.packCode },
          update: { $setOnInsert: item },
          upsert: true,
        },
      }));
      try {
        await col.createIndex({ packCode: 1 }, { unique: true });
        await col.bulkWrite(ops);
      } catch {}
      return INITIAL_INVENTORY_ITEMS;
    }
    const docs = await col.find({}).toArray();
    // Luôn deduplicate theo packCode để đảm bảo dữ liệu chuẩn mực tuyệt đối
    const uniqueMap = new Map<string, InventoryItem>();
    for (const d of docs) {
      const clean = cleanMongoDoc<InventoryItem>(d);
      if (clean && clean.packCode && !uniqueMap.has(clean.packCode.toUpperCase())) {
        uniqueMap.set(clean.packCode.toUpperCase(), clean);
      }
    }
    return Array.from(uniqueMap.values());
  }

  const memoryMap = new Map<string, InventoryItem>();
  for (const it of getMemoryStore().items) {
    if (it && it.packCode && !memoryMap.has(it.packCode.toUpperCase())) {
      memoryMap.set(it.packCode.toUpperCase(), it);
    }
  }
  return Array.from(memoryMap.values());
}

// 2. LẤY LỊCH SỬ GIAO DỊCH KHO
export async function getInventoryTransactions(limit = 50): Promise<InventoryTransaction[]> {
  const db = await getMongoDb();
  if (db) {
    const col = db.collection<InventoryTransaction>("inventory_transactions");
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(cleanMongoDoc<InventoryTransaction>);
  }

  return [...getMemoryStore().transactions].reverse().slice(0, limit);
}

// 3. TÍNH TOÁN CHỈ SỐ THỐNG KÊ KHO
export async function getInventoryStats(): Promise<InventoryStats> {
  const items = await getInventoryItems();

  let totalOnHand = 0;
  let totalBackordered = 0;
  let totalAvailable = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;

  items.forEach((it) => {
    totalOnHand += it.onHand || 0;
    totalBackordered += it.backorderCount || 0;
    totalAvailable += (it.onHand || 0) - (it.backorderCount || 0);

    const avail = (it.onHand || 0) - (it.backorderCount || 0);
    if (avail <= 0) {
      outOfStockCount++;
    } else if (avail <= (it.minAlertLevel || 3)) {
      lowStockCount++;
    }
  });

  return {
    totalPacksCount: items.length,
    totalCardsCount: items.reduce((acc, cur) => acc + (cur.cardsCount || 30), 0),
    totalOnHand,
    totalBackordered,
    totalAvailable,
    outOfStockCount,
    lowStockCount,
  };
}

// 4. GHI NHẬN BIẾN ĐỘNG KHO (NHẬP KHO, XUẤT KHO, ĐIỀU CHỈNH)
export async function recordInventoryTransaction(params: {
  packCode: string;
  type: InventoryTransactionType;
  quantity: number; // Dương khi nhập/hoàn, âm hoặc dương tuỳ loại
  orderCode?: string;
  customerName?: string;
  unitCost?: number;
  note: string;
}): Promise<{ success: boolean; item?: InventoryItem; message?: string }> {
  const items = await getInventoryItems();
  const target = items.find((i) => i.packCode.toUpperCase() === params.packCode.toUpperCase());

  if (!target) {
    return { success: false, message: `Không tìm thấy mã bộ sản phẩm: ${params.packCode}` };
  }

  const beforeOnHand = target.onHand || 0;
  let delta = Number(params.quantity) || 0;
  if (params.type === "STOCK_OUT" && delta > 0) {
    delta = -delta;
  }

  const afterOnHand = beforeOnHand + delta;
  
  // Tính toán lại trạng thái nợ khách (backorder)
  let newBackorder = target.backorderCount || 0;
  if (params.type === "STOCK_IN" && delta > 0) {
    // Nếu nhập kho lô mới từ xưởng in, tự động cấn trừ số lượng đang nợ khách
    newBackorder = Math.max(0, newBackorder - delta);
  } else if (params.type === "ORDER_SALE" && delta < 0) {
    // Nếu xuất bán mà kho bị âm thì ghi nhận nợ khách
    const needed = Math.abs(delta);
    if (beforeOnHand < needed) {
      newBackorder += (needed - Math.max(0, beforeOnHand));
    }
  }

  const updatedItem: InventoryItem = {
    ...target,
    onHand: afterOnHand,
    backorderCount: newBackorder,
    available: afterOnHand - newBackorder,
    unitCost: params.unitCost !== undefined ? params.unitCost : target.unitCost,
    updatedAt: new Date().toISOString(),
  };

  const newTx: InventoryTransaction = {
    id: `tx-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    packCode: target.packCode,
    packName: target.name,
    type: params.type,
    quantity: delta,
    beforeOnHand,
    afterOnHand,
    orderCode: params.orderCode,
    customerName: params.customerName,
    unitCost: params.unitCost,
    totalValue: params.unitCost ? Math.abs(delta) * params.unitCost : undefined,
    note: params.note,
    createdAt: new Date().toISOString(),
  };

  // Lưu vào Database
  const db = await getMongoDb();
  if (db) {
    const colItems = db.collection<InventoryItem>("inventory_items");
    await colItems.updateOne(
      { packCode: target.packCode },
      { $set: updatedItem },
      { upsert: true }
    );

    const colTx = db.collection<InventoryTransaction>("inventory_transactions");
    await colTx.insertOne(newTx);
  } else {
    // In-memory
    const mem = getMemoryStore();
    const idx = mem.items.findIndex((i) => i.packCode.toUpperCase() === params.packCode.toUpperCase());
    if (idx >= 0) mem.items[idx] = updatedItem;
    mem.transactions.push(newTx);
  }

  return { success: true, item: updatedItem };
}

// 5. CẬP NHẬT CẤU HÌNH BỘ THẺ (CHO PHÉP BACKORDER, MỨC CẢNH BÁO)
export async function updateInventoryConfig(
  packCode: string,
  updates: Partial<Pick<InventoryItem, "allowBackorder" | "minAlertLevel" | "unitCost" | "onHand">>
): Promise<InventoryItem | null> {
  const items = await getInventoryItems();
  const target = items.find((i) => i.packCode.toUpperCase() === packCode.toUpperCase());
  if (!target) return null;

  const onHand = updates.onHand !== undefined ? Math.max(0, updates.onHand) : target.onHand;
  const backorderCount = target.backorderCount || 0;

  const updated: InventoryItem = {
    ...target,
    ...updates,
    onHand,
    available: onHand - backorderCount,
    updatedAt: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    const col = db.collection<InventoryItem>("inventory_items");
    await col.updateOne({ packCode: target.packCode }, { $set: updated }, { upsert: true });
  } else {
    const mem = getMemoryStore();
    const idx = mem.items.findIndex((i) => i.packCode.toUpperCase() === packCode.toUpperCase());
    if (idx >= 0) mem.items[idx] = updated;
  }

  return updated;
}
