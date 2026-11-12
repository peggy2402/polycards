import { DbComboRule } from "@/types/animal";
import { roundPrice, sanitizeCurrency } from "./pricing";

export interface ComboEvaluationItem {
  id?: string;
  packCode: string;
  categorySlug?: string;
  quantity: number;
  salePrice: number;
  originalPrice?: number;
}

export interface AppliedComboResult {
  rule: DbComboRule | null;
  discountAmount: number;
  finalPrice: number;
  subtotal: number;
  totalPacksCount: number;
  message?: string;
  nextSuggestion?: {
    rule: DbComboRule;
    neededPacks: number;
    message: string;
  };
}

/**
 * Danh sách combo mặc định chuẩn mực hệ thống Poly Cards
 */
export const DEFAULT_COMBO_RULES: DbComboRule[] = [
  {
    id: "combo-9-in-1",
    name: "Siêu Combo Trọn Bộ 9-in-1 (Toàn Bộ 270 Thẻ AR)",
    description: "Áp dụng khi chọn từ 9 bộ thẻ trở lên: Tặng hộp quà sơn mài & bảo hành VIP trọn đời.",
    minPacksCount: 9,
    discountType: "percent",
    discountValue: 34,
    scope: "all",
    isActive: true,
    priority: 1,
    badge: "Tiết Kiệm 751K • Bản Giới Hạn",
  },
  {
    id: "combo-4-in-1",
    name: "Combo Trọn Bộ VIP 4-in-1 (120 Thẻ AR)",
    description: "Áp dụng khi chọn từ 4 bộ thẻ trở lên: Tặng kèm hộp quà cứng cao cấp.",
    minPacksCount: 4,
    discountType: "percent",
    discountValue: 33,
    scope: "all",
    isActive: true,
    priority: 2,
    badge: "Tiết Kiệm 397K • Hộp Quà VIP",
  },
  {
    id: "combo-2-in-1",
    name: "Combo Song Bộ Khám Phá (2 Bộ Thẻ Bất Kỳ)",
    description: "Áp dụng khi chọn từ 2 bộ thẻ trở lên: Giảm ngay 10% tổng tiền.",
    minPacksCount: 2,
    discountType: "percent",
    discountValue: 10,
    scope: "all",
    isActive: true,
    priority: 3,
    badge: "Ưu Đãi Mua Kèm 2 Bộ",
  },
];

/**
 * Đánh giá giỏ hàng để tìm Combo Rule có mức giảm giá cao nhất (Best Combo)
 */
export function evaluateBestCombo(
  items: ComboEvaluationItem[],
  rules: DbComboRule[] = DEFAULT_COMBO_RULES
): AppliedComboResult {
  // Lọc lấy các rule đang bật
  const activeRules = rules
    .filter((r) => r.isActive)
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  let totalPacksCount = 0;
  let subtotal = 0;

  for (const item of items) {
    const qty = Math.max(0, item.quantity);
    totalPacksCount += qty;
    subtotal += sanitizeCurrency(item.salePrice) * qty;
  }

  if (totalPacksCount === 0 || subtotal === 0) {
    return {
      rule: null,
      discountAmount: 0,
      finalPrice: 0,
      subtotal: 0,
      totalPacksCount: 0,
    };
  }

  let bestRule: DbComboRule | null = null;
  let maxDiscount = 0;

  for (const rule of activeRules) {
    // Kiểm tra điều kiện áp dụng
    let applicablePacksCount = 0;
    let applicableSubtotal = 0;

    for (const item of items) {
      let isEligible = false;
      if (rule.scope === "all") {
        isEligible = true;
      } else if (rule.scope === "packs" && rule.applicableSlugs?.includes(item.packCode)) {
        isEligible = true;
      } else if (
        rule.scope === "categories" &&
        item.categorySlug &&
        rule.applicableSlugs?.includes(item.categorySlug)
      ) {
        isEligible = true;
      }

      if (isEligible) {
        applicablePacksCount += item.quantity;
        applicableSubtotal += sanitizeCurrency(item.salePrice) * item.quantity;
      }
    }

    if (applicablePacksCount >= rule.minPacksCount) {
      let discount = 0;
      if (rule.discountType === "percent") {
        discount = roundPrice((applicableSubtotal * rule.discountValue) / 100);
      } else {
        discount = Math.min(applicableSubtotal, sanitizeCurrency(rule.discountValue));
      }

      if (discount > maxDiscount) {
        maxDiscount = discount;
        bestRule = rule;
      }
    }
  }

  // Tìm combo kế tiếp để gợi ý upsell nếu chưa đạt
  let nextSuggestion: AppliedComboResult["nextSuggestion"] = undefined;

  // Lọc các rule có minPacksCount > totalPacksCount, lấy rule gần nhất
  const upcomingRules = activeRules
    .filter((r) => r.minPacksCount > totalPacksCount)
    .sort((a, b) => a.minPacksCount - b.minPacksCount);

  if (upcomingRules.length > 0) {
    const nextRule = upcomingRules[0];
    const needed = nextRule.minPacksCount - totalPacksCount;
    const discountText =
      nextRule.discountType === "percent"
        ? `giảm ${nextRule.discountValue}%`
        : `tiết kiệm ${nextRule.discountValue.toLocaleString("vi-VN")} ₫`;

    nextSuggestion = {
      rule: nextRule,
      neededPacks: needed,
      message: `Mua thêm ${needed} bộ thẻ nữa để kích hoạt ${nextRule.name} (${discountText})!`,
    };
  }

  const finalPrice = Math.max(0, subtotal - maxDiscount);

  let message: string | undefined;
  if (bestRule && maxDiscount > 0) {
    message = `Đã tự động áp dụng: ${bestRule.name} - Tiết kiệm thêm ${maxDiscount.toLocaleString("vi-VN")} ₫!`;
  }

  return {
    rule: bestRule,
    discountAmount: maxDiscount,
    finalPrice,
    subtotal,
    totalPacksCount,
    message,
    nextSuggestion,
  };
}

