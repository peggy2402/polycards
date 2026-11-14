import { siteConfig } from "@/config/site";

/**
 * Định dạng số tiền sang chuẩn Việt Nam Đồng (VND)
 * Ví dụ: 249000 -> "249.000 đ"
 */
export function formatVndCurrency(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  })
    .format(amount)
    .replace("₫", "đ");
}

/**
 * Tạo URL kết quả AR cho sản phẩm
 */
export function buildProductArUrl(slug: string): string {
  const cleanSlug = encodeURIComponent(slug.trim().toLowerCase());
  return `${siteConfig.url}/ar/${cleanSlug}`;
}

/**
 * Tạo URL quét QR có mục tiêu con vật định sẵn
 */
export function buildTargetScanUrl(slug: string): string {
  const cleanSlug = encodeURIComponent(slug.trim().toLowerCase());
  return `/scan?expect=${cleanSlug}`;
}

/**
 * Phân tích timestamp chính xác từ đơn hàng để sắp xếp theo thời gian mới nhất
 */
export function parseOrderTimestamp(order: { createdAt?: string; id?: string; code?: string }): number {
  // 1. Thử lấy từ id hoặc code nếu có chứa chuỗi millisecond (ví dụ: order-onl-1794622974909, INV-1794593640283)
  if (order.id) {
    const match = order.id.match(/\d{12,14}/);
    if (match) {
      const ts = Number(match[0]);
      if (!isNaN(ts) && ts > 1000000000000) return ts;
    }
  }

  // 2. Thử phân tích chuỗi createdAt
  if (order.createdAt) {
    const d = new Date(order.createdAt).getTime();
    if (!isNaN(d) && d > 0) return d;

    // Định dạng HH:mm:ss dd/MM/yyyy hoặc HH:mm dd/MM/yyyy
    const parts = order.createdAt.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?.*?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (parts) {
      const [, hh, mm, ss = "0", day, month, year] = parts;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hh), Number(mm), Number(ss)).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }

  return 0;
}

/**
 * Định dạng ngày giờ chuẩn: HH:mm:ss dd/MM/yyyy
 * Ví dụ: 12:36:30 14/11/2026
 */
export function formatOrderDateTime(createdAt?: string, orderId?: string): string {
  let ts = 0;
  if (createdAt) {
    const d = new Date(createdAt).getTime();
    if (!isNaN(d) && d > 0) ts = d;
  }

  if (!ts && orderId) {
    const match = orderId.match(/\d{12,14}/);
    if (match) {
      const val = Number(match[0]);
      if (!isNaN(val) && val > 1000000000000) ts = val;
    }
  }

  if (!ts && createdAt) {
    const parts = createdAt.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?.*?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (parts) {
      const [, hh, mm, ss = "00", day, month, year] = parts;
      const pad = (v: string | number) => v.toString().padStart(2, "0");
      return `${pad(hh)}:${pad(mm)}:${pad(ss)} ${pad(day)}/${pad(month)}/${year}`;
    }
    return createdAt;
  }

  if (!ts) return "Vừa xong";

  const date = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

