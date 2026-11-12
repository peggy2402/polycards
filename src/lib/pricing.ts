/**
 * Poly Cards - Unified Pricing & Discount Calculation Engine
 * 
 * Rules:
 * - Currency: VND integer.
 * - Rounding: Default VND integer (step = 1). Configurable step (e.g. 1000).
 * - Discount Percent: [0 .. 99]. No negative, no > 99, no division by zero.
 * - Validation: salePrice <= originalPrice.
 */

// Cấu hình đơn vị làm tròn (mặc định 1đ, có thể đổi thành 1000đ khi cần)
export const ROUNDING_STEP = 1;

/**
 * Làm tròn tiền theo cấu hình ROUNDING_STEP
 */
export function roundPrice(amount: number, step = ROUNDING_STEP): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (step <= 1) return Math.round(amount);
  return Math.round(amount / step) * step;
}

/**
 * Chuẩn hóa số nguyên tiền VND không âm
 */
export function sanitizeCurrency(value: unknown): number {
  const num = typeof value === "number" ? value : Number(String(value || "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num);
}

/**
 * Chuẩn hóa phần trăm khuyến mãi [0 .. 99], tối đa 2 chữ số thập phân
 */
export function sanitizeDiscountPercent(value: unknown): number {
  const num = typeof value === "number" ? value : Number(String(value || "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(num) || num < 0) return 0;
  if (num > 99) return 99;
  return Math.round(num * 100) / 100;
}

export type PricingSourceField = "originalPrice" | "discountPercent" | "salePrice";

export interface PricingInput {
  originalPrice?: number;
  discountPercent?: number;
  salePrice?: number;
  sourceField: PricingSourceField;
  step?: number;
}

export interface PricingResult {
  originalPrice: number;
  discountPercent: number;
  salePrice: number;
  discountAmount: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Tính toán giá bán 2 chiều giữa:
 * - Giá gốc niêm yết (originalPrice)
 * - % Khuyến mãi (discountPercent)
 * - Giá bán ưu đãi (salePrice)
 */
export function calculatePricing({
  originalPrice: rawOriginal = 0,
  discountPercent: rawPercent = 0,
  salePrice: rawSale = 0,
  sourceField,
  step = ROUNDING_STEP,
}: PricingInput): PricingResult {
  let orig = sanitizeCurrency(rawOriginal);
  let pct = sanitizeDiscountPercent(rawPercent);
  let sale = sanitizeCurrency(rawSale);

  let errorMessage: string | undefined;

  switch (sourceField) {
    case "originalPrice":
    case "discountPercent": {
      // Nhập Giá gốc + % KM -> Giá bán ưu đãi = Giá gốc * (1 - %KM/100)
      if (orig === 0) {
        sale = 0;
      } else {
        const calculatedSale = orig * (1 - pct / 100);
        sale = roundPrice(calculatedSale, step);
      }
      break;
    }

    case "salePrice": {
      // Nhập Giá gốc + Giá bán ưu đãi -> % KM = round((1 - Giá bán / Giá gốc) * 100)
      if (orig <= 0) {
        // Nếu chưa có giá gốc, tạm đặt giá gốc = giá bán (0% KM)
        orig = sale;
        pct = 0;
      } else if (sale > orig) {
        errorMessage = `Giá bán ưu đãi (${sale.toLocaleString("vi-VN")} ₫) không được lớn hơn Giá gốc niêm yết (${orig.toLocaleString("vi-VN")} ₫).`;
        pct = 0;
      } else {
        const rawCalculatedPct = ((orig - sale) / orig) * 100;
        pct = sanitizeDiscountPercent(rawCalculatedPct);
      }
      break;
    }
  }

  // Kiểm tra tính hợp lệ toàn diện
  if (sale > orig && orig > 0) {
    errorMessage = `Giá bán ưu đãi (${sale.toLocaleString("vi-VN")} ₫) không được lớn hơn Giá gốc niêm yết (${orig.toLocaleString("vi-VN")} ₫).`;
  }

  const discountAmount = Math.max(0, orig - sale);

  return {
    originalPrice: orig,
    discountPercent: pct,
    salePrice: sale,
    discountAmount,
    isValid: !errorMessage,
    errorMessage,
  };
}

/**
 * Nhập % KM + Giá bán -> tính ngược ra Giá gốc
 * Giá gốc = round(Giá bán / (1 - %KM/100))
 */
export function calculateOriginalFromSaleAndPercent(
  salePrice: number,
  discountPercent: number,
  step = ROUNDING_STEP
): PricingResult {
  const sale = sanitizeCurrency(salePrice);
  const pct = sanitizeDiscountPercent(discountPercent);

  if (pct >= 99) {
    return {
      originalPrice: sale,
      discountPercent: 99,
      salePrice: sale,
      discountAmount: 0,
      isValid: false,
      errorMessage: "% khuyến mãi tối đa là 99%.",
    };
  }

  const orig = roundPrice(sale / (1 - pct / 100), step);
  return {
    originalPrice: orig,
    discountPercent: pct,
    salePrice: sale,
    discountAmount: orig - sale,
    isValid: true,
  };
}

/**
 * Tính giá gốc của bộ thẻ từ thẻ lẻ:
 * Giá gốc = Đơn giá thẻ lẻ x Số thẻ trong bộ
 */
export function calculatePackOriginalPrice(singleCardPrice: number, cardsCount: number): number {
  const cardPrice = sanitizeCurrency(singleCardPrice);
  const count = Math.max(0, Math.round(cardsCount || 0));
  return cardPrice * count;
}

/**
 * Chuẩn hóa số điện thoại Việt Nam:
 * - Loại bỏ khoảng trắng, dấu gạch nối, dấu chấm
 * - Chuyển +84 hoặc 84 ở đầu thành 0
 * - Chỉ giữ lại ký tự số
 */
export function normalizePhoneNumber(rawPhone: string | undefined | null): string {
  if (!rawPhone) return "";
  let cleaned = String(rawPhone).replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+84")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("84") && cleaned.length >= 10) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned.replace(/\D/g, "");
}

/**
 * Định dạng tiền tệ VND chuẩn: 300.000 ₫
 */
export function formatVnd(amount: number | undefined | null): string {
  const val = sanitizeCurrency(amount);
  return `${val.toLocaleString("vi-VN")} ₫`;
}

