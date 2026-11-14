export type InventoryTransactionType =
  | "STOCK_IN"             // Nhập kho lô mới từ xưởng in ấn
  | "STOCK_OUT"            // Xuất kho thủ công (tặng, kiểm thử, hàng mẫu)
  | "ORDER_SALE"           // Xuất bán khi có đơn hàng (hoặc ghi nhận nợ đơn khi hết kho)
  | "ORDER_CANCEL_RETURN"  // Hoàn nhập kho khi đơn hàng bị hủy hoặc khách trả hàng
  | "ADJUSTMENT";          // Điều chỉnh kiểm kê thực tế

export interface InventoryItem {
  id: string;               // Ví dụ: pack-dongvat-envi-30
  packCode: string;         // Ví dụ: POLY30-DONGVAT-ENVI
  name: string;             // Tên bộ: Bộ 30 Thẻ AR Động Vật Hoang Dã (Anh - Việt)
  categoryName: string;     // Danh mục: Động Vật
  categorySlug: string;     // dong-vat
  languageType: string;     // en-vi | zh-vi
  cardsCount: number;       // 30
  price: number;            // Giá bán lẻ niêm yết (300.000 đ)
  unitCost?: number;        // Giá vốn sản xuất / in ấn dự kiến (ví dụ: 85.000 đ)
  imageSrc: string;         // Ảnh đại diện hộp thẻ
  badge?: string;           // Nhãn: Song Ngữ Anh - Việt
  description?: string;

  // --- TRẠNG THÁI TỒN KHO THỰC TẾ ---
  onHand: number;           // Số lượng hộp vật lý thực tế trong kho (khởi điểm: 10 bộ)
  backorderCount: number;   // Số lượng khách đang đặt nhưng kho chưa có hàng (đang nợ đơn)
  available: number;        // Tồn khả dụng = onHand - backorderCount (có thể âm nếu đang nợ khách)
  
  // --- CẤU HÌNH BÁN HÀNG & CẢNH BÁO ---
  allowBackorder: boolean;  // Cho phép khách đặt trước khi hết kho (Luôn bật để không chặn đơn)
  minAlertLevel: number;    // Ngưỡng cảnh báo sắp hết hàng (mặc định: 3 bộ)
  updatedAt: string;        // Thời gian cập nhật
}

export interface InventoryTransaction {
  id: string;               // tx-173155...
  packCode: string;
  packName: string;
  type: InventoryTransactionType;
  quantity: number;         // Số lượng thay đổi (dương khi nhập/hoàn, âm khi xuất)
  beforeOnHand: number;
  afterOnHand: number;
  orderCode?: string;       // Mã đơn hàng nếu phát sinh từ đơn bán lẻ
  customerName?: string;    // Tên khách hàng
  unitCost?: number;        // Đơn giá sản xuất nếu là phiếu nhập
  totalValue?: number;      // Tổng giá trị giao dịch
  note: string;             // Ghi chú diễn giải
  createdAt: string;
}

export interface InventoryStats {
  totalPacksCount: number;        // Tổng số bộ quản lý (10 bộ)
  totalCardsCount: number;        // Tổng số thẻ quản lý (300 thẻ)
  totalOnHand: number;            // Tổng hộp thực tế đang có trong kho
  totalBackordered: number;       // Tổng số hộp đang nợ đơn khách (Chờ xưởng in)
  totalAvailable: number;         // Tổng khả dụng
  outOfStockCount: number;        // Số bộ đang hết hàng / nợ đơn
  lowStockCount: number;          // Số bộ sắp hết (dưới ngưỡng cảnh báo)
}

