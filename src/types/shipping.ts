export type ShippingFreeshipCondition = "always_free" | "min_packs" | "min_amount";

export interface ShippingConfig {
  enabled: boolean;
  standardFee: number; // VNĐ (ví dụ: 30000)
  condition: ShippingFreeshipCondition;
  minPacksCount: number; // Ví dụ: 2 bộ
  minOrderAmount: number; // Ví dụ: 300000 VNĐ
  freeshipLabel: string; // Ví dụ: "FREESHIP"
  shippingNote: string; // Ví dụ: "Giao hàng nhanh 2–3 ngày, kiểm tra trước khi nhận"
  updatedAt?: string;
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  enabled: true,
  standardFee: 30000,
  condition: "min_packs",
  minPacksCount: 2, // Đơn từ 2 bộ trở lên được Freeship, dưới 2 bộ phí 30.000 đ
  minOrderAmount: 300000,
  freeshipLabel: "FREESHIP",
  shippingNote: "Giao hàng nhanh 2–3 ngày, kiểm tra trước khi nhận",
  updatedAt: new Date().toISOString(),
};

export interface ShippingCalculationResult {
  fee: number;
  isFree: boolean;
  label: string;
  reason: string;
  upsellPrompt?: string;
}

/**
 * Tính toán phí vận chuyển linh hoạt theo cấu hình Admin
 * @param packsCount Tổng số lượng bộ thẻ trong giỏ/đơn
 * @param subtotal Tổng tiền hàng sau combo (VNĐ)
 * @param config Cấu hình phí ship từ MongoDB
 */
export function computeShippingFee(
  packsCount: number,
  subtotal: number,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): ShippingCalculationResult {
  if (!config.enabled) {
    return {
      fee: 0,
      isFree: true,
      label: config.freeshipLabel || "FREESHIP",
      reason: "Miễn phí vận chuyển toàn quốc",
    };
  }

  // 1. Luôn luôn miễn phí
  if (config.condition === "always_free") {
    return {
      fee: 0,
      isFree: true,
      label: config.freeshipLabel || "FREESHIP",
      reason: "Miễn phí vận chuyển toàn quốc",
    };
  }

  // 2. Theo số lượng bộ thẻ tối thiểu
  if (config.condition === "min_packs") {
    const minPacks = Math.max(1, Number(config.minPacksCount) || 1);
    if (packsCount >= minPacks) {
      return {
        fee: 0,
        isFree: true,
        label: config.freeshipLabel || "FREESHIP",
        reason: `Miễn phí toàn quốc (Đơn từ ${minPacks} bộ)`,
      };
    }

    const diff = minPacks - packsCount;
    return {
      fee: Number(config.standardFee) || 0,
      isFree: false,
      label: `${(Number(config.standardFee) || 0).toLocaleString("vi-VN")} ₫`,
      reason: `Phí vận chuyển (${(Number(config.standardFee) || 0).toLocaleString("vi-VN")} ₫)`,
      upsellPrompt: `Mua thêm ${diff} bộ nữa để được FREESHIP toàn quốc!`,
    };
  }

  // 3. Theo tổng giá trị đơn hàng tối thiểu
  if (config.condition === "min_amount") {
    const minAmount = Math.max(0, Number(config.minOrderAmount) || 0);
    if (subtotal >= minAmount) {
      return {
        fee: 0,
        isFree: true,
        label: config.freeshipLabel || "FREESHIP",
        reason: `Miễn phí toàn quốc (Đơn từ ${minAmount.toLocaleString("vi-VN")} ₫)`,
      };
    }

    const diffAmount = minAmount - subtotal;
    return {
      fee: Number(config.standardFee) || 0,
      isFree: false,
      label: `${(Number(config.standardFee) || 0).toLocaleString("vi-VN")} ₫`,
      reason: `Phí vận chuyển (${(Number(config.standardFee) || 0).toLocaleString("vi-VN")} ₫)`,
      upsellPrompt: `Mua thêm ${diffAmount.toLocaleString("vi-VN")} ₫ để được FREESHIP toàn quốc!`,
    };
  }

  return {
    fee: Number(config.standardFee) || 0,
    isFree: false,
    label: `${(Number(config.standardFee) || 0).toLocaleString("vi-VN")} ₫`,
    reason: "Phí vận chuyển tiêu chuẩn",
  };
}

