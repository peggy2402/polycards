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
