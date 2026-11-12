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

export interface DynamicPackPricing {
  cardsCount: number;
  originalPrice: number;
  price: number;
  discountPercent: number;
  isCustomized: boolean;
}

/**
 * Tính toán giá của Bộ Thẻ động dựa trên các thẻ lẻ con thực tế trong kho:
 * - originalPrice: Tổng giá gốc của tất cả các thẻ con (hoặc giá cấu hình thủ công)
 * - price (salePrice):
 *   + Nếu cấu hình pack có isManualPrice: dùng salePrice thủ công
 *   + Nếu có cấu hình % KM riêng: tính theo % KM của bộ
 *   + Nếu không: tính bằng tổng giá bán của các thẻ lẻ con
 * - discountPercent: Tính chuẩn 2 chiều
 */
export function computePackDynamicPricing(
  packCode: string,
  packConfig?: {
    originalPrice?: number;
    salePrice?: number;
    discountPercent?: number;
    isManualPrice?: boolean;
    cardsCount?: number;
  } | null,
  allCards: Array<{ packCode?: string; price?: number; originalPrice?: number }> = []
): DynamicPackPricing {
  const codeClean = (packCode || "").trim().toUpperCase();
  const matchingCards = allCards.filter(
    (c) => c.packCode && c.packCode.trim().toUpperCase() === codeClean
  );

  if (matchingCards.length > 0) {
    const cardsCount = matchingCards.length;

    // Tổng giá gốc từ các thẻ con
    const sumOriginal = matchingCards.reduce(
      (sum, c) => sum + (c.originalPrice && c.originalPrice > 0 ? c.originalPrice : (c.price || 10000)),
      0
    );

    // Tổng giá bán thực tế từ các thẻ con
    const sumSale = matchingCards.reduce(
      (sum, c) => sum + (c.price !== undefined ? c.price : 10000),
      0
    );

    // Xác định originalPrice của bộ
    let originalPrice = packConfig?.originalPrice && packConfig.originalPrice > 0
      ? packConfig.originalPrice
      : (packConfig?.isManualPrice && packConfig?.originalPrice
        ? packConfig.originalPrice
        : (sumOriginal > 0 && sumOriginal <= cardsCount * 25000 ? sumOriginal : cardsCount * 10000));

    // Xác định price (salePrice) của bộ
    let price = 0;
    let discountPercent = 0;

    if (packConfig?.discountPercent !== undefined && packConfig.discountPercent === 0) {
      // Khi % khuyến mãi được thiết lập về 0: Giá bán bằng giá gốc niêm yết
      discountPercent = 0;
      price = packConfig.salePrice && packConfig.salePrice > 0 ? packConfig.salePrice : originalPrice;
    } else if (packConfig?.salePrice && packConfig.salePrice > 0) {
      price = packConfig.salePrice;
      discountPercent = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
    } else if (packConfig?.discountPercent !== undefined && packConfig.discountPercent > 0) {
      discountPercent = packConfig.discountPercent;
      price = roundPrice(originalPrice * (1 - discountPercent / 100));
    } else if (sumSale > 0 && sumSale <= cardsCount * 25000) {
      // Chỉ dùng tổng giá thẻ con nếu giá thẻ con là giá thông thường (<= 25.000đ/thẻ)
      price = sumSale;
      discountPercent = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
    } else {
      // Giá chuẩn mặc định cho bộ 30 thẻ là 300.000đ
      price = cardsCount === 30 ? 300000 : roundPrice(cardsCount * 10000);
      discountPercent = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
    }

    return {
      cardsCount,
      originalPrice,
      price,
      discountPercent,
      isCustomized: true,
    };
  }

  // Khi không tìm thấy thẻ con nào khớp với mã bộ
  // Nếu đã nạp allCards từ DB mà không có thẻ nào khớp -> chắc chắn là bộ rỗng (cardsCount = 0)
  const cardsCount = packConfig?.cardsCount !== undefined
    ? packConfig.cardsCount
    : (allCards.length > 0 ? 0 : 30);

  if (cardsCount === 0) {
    return {
      cardsCount: 0,
      originalPrice: 0,
      price: 0,
      discountPercent: 0,
      isCustomized: false,
    };
  }

  const originalPrice = packConfig?.originalPrice || (cardsCount * 10000);
  let price = packConfig?.salePrice || (cardsCount * 10000);
  let discountPercent = packConfig?.discountPercent !== undefined
    ? packConfig.discountPercent
    : (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

  if (discountPercent === 0) {
    price = packConfig?.salePrice && packConfig.salePrice > 0 ? packConfig.salePrice : originalPrice;
  }

  return {
    cardsCount,
    originalPrice,
    price,
    discountPercent,
    isCustomized: false,
  };
}

