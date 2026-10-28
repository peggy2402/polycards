/**
 * Poly Cards License & Activation Manager
 * Quản lý phân quyền bản quyền thẻ bài AR: Mua Lẻ (Single) vs Combo 6 vs Trọn Bộ VIP.
 */

export const FREE_DEMO_SLUGS = ["dog"]; // Con vật được mở khóa trải nghiệm 100% miễn phí

export const COMBO_6_SLUGS = ["cat", "dog", "deer", "lion", "elephant", "panda"];

const ALL_ANIMAL_SLUGS = ["cat", "lion", "dog", "deer", "elephant", "panda"];

// Danh sách các mã VIP mặc định
const VIP_ACTIVATION_CODES = [
  "POLYCARDS",
  "POLY-VIP",
  "POLY-2026",
  "VIP2026",
  "POLY-DEMO",
];

const STORAGE_KEY_ALL = "polycards_unlocked_all";
const STORAGE_KEY_PREFIX = "polycards_unlocked_";
const STORAGE_KEY_CODE = "polycards_activation_code";

export type LicenseTier = "free" | "single" | "combo6" | "pack" | "vip";

export interface ActivationResult {
  success: boolean;
  message: string;
  tier?: LicenseTier;
  unlockedSlug?: string;
  unlockedSlugs?: string[];
  unlockedCategory?: string;
}

/**
 * Kiểm tra xem một con vật cụ thể có được mở khóa toàn bộ tính năng AR hay không
 */
export function isAnimalUnlocked(slug: string, categorySlug?: string): boolean {
  if (typeof window === "undefined") return false;

  const cleanSlug = slug.toLowerCase().trim();

  // 1. Con vật thuộc danh mục miễn phí trải nghiệm
  if (FREE_DEMO_SLUGS.includes(cleanSlug)) {
    return true;
  }

  // 2. Khách hàng đã sở hữu gói VIP / Mở khóa toàn bộ
  if (localStorage.getItem(STORAGE_KEY_ALL) === "true") {
    return true;
  }

  // 3. Khách hàng đã mở khóa danh mục / bộ này
  if (categorySlug) {
    const cleanCat = categorySlug.toLowerCase().trim();
    if (localStorage.getItem(`polycards_unlocked_category_${cleanCat}`) === "true") {
      return true;
    }
  }

  // 4. Khách hàng đã mở khóa con vật cụ thể này (mua lẻ hoặc nằm trong Combo)
  if (localStorage.getItem(`${STORAGE_KEY_PREFIX}${cleanSlug}`) === "true") {
    return true;
  }

  return false;
}

/**
 * Lấy danh sách toàn bộ các con vật đã được mở khóa trên thiết bị hiện tại
 */
export function getUnlockedAnimals(): string[] {
  if (typeof window === "undefined") return [...FREE_DEMO_SLUGS];

  if (localStorage.getItem(STORAGE_KEY_ALL) === "true") {
    return [...ALL_ANIMAL_SLUGS];
  }

  const unlocked: string[] = [...FREE_DEMO_SLUGS];
  ALL_ANIMAL_SLUGS.forEach((slug) => {
    if (localStorage.getItem(`${STORAGE_KEY_PREFIX}${slug}`) === "true" && !unlocked.includes(slug)) {
      unlocked.push(slug);
    }
  });

  return unlocked;
}

/**
 * Kích hoạt bản quyền qua Mã Kích Hoạt (Activation Code / Hóa Đơn Bán Hàng)
 * Hỗ trợ phân quyền:
 * - Kích hoạt theo Bộ 30 Thẻ (POLY30-DONGVAT-XXXX, HD-DIR-DONGVAT-XXXX, HD-DONGVAT-XXXX...)
 * - Mua lẻ 1 con: POLY-[SLUG]-XXXX (POLY-CAT-8921, POLY-LION-4412...)
 * - Mua combo 6: POLY-COMBO6-XXXX hoặc COMBO6-XXXX
 * - Mua VIP trọn bộ: POLY-VIP-XXXX hoặc POLYCARDS
 */
export function activateWithCode(code: string, currentCategorySlug?: string): ActivationResult {
  if (typeof window === "undefined") {
    return { success: false, message: "Môi trường trình duyệt không hợp lệ" };
  }

  const clean = code.trim().toUpperCase();
  if (!clean || clean.length < 4) {
    return {
      success: false,
      message: "Vui lòng nhập mã kích hoạt hợp lệ từ hóa đơn hoặc tem cào Poly Cards.",
    };
  }

  // TRƯỜNG HỢP 1: Kích hoạt Trọn Bộ VIP (Combo Toàn Bộ Thẻ)
  const isVipCode =
    VIP_ACTIVATION_CODES.includes(clean) ||
    clean.startsWith("POLY-VIP") ||
    clean.startsWith("POLY-ALL") ||
    clean.startsWith("VIP-");

  if (isVipCode) {
    localStorage.setItem(STORAGE_KEY_ALL, "true");
    localStorage.setItem(STORAGE_KEY_CODE, clean);
    ALL_ANIMAL_SLUGS.forEach((s) => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${s}`, "true");
    });
    notifyActivationChanged();

    return {
      success: true,
      tier: "vip",
      unlockedSlugs: ALL_ANIMAL_SLUGS,
      message: "Chúc mừng bạn! Mã bản quyền VIP đã mở khóa vĩnh viễn TOÀN BỘ bộ sưu tập thẻ bài AR Poly Cards.",
    };
  }

  // TRƯỜNG HỢP 2: Kích hoạt THEO BỘ DANH MỤC (Ví dụ: POLY30-DONGVAT-XXXX, HD-DIR-DONGVAT-XXXX...)
  const PACK_MAPPINGS: Record<string, { catSlug: string; name: string }> = {
    DONGVAT: { catSlug: "dong-vat", name: "Động Vật" },
    HANHDONG: { catSlug: "hanh-dong", name: "Hành Động" },
    XECO: { catSlug: "xe-co", name: "Xe Cộ & Giao Thông" },
    HOAQUA: { catSlug: "hoa-qua", name: "Hoa Quả & Trái Cây" },
  };

  for (const [key, pack] of Object.entries(PACK_MAPPINGS)) {
    if (clean.includes(key) || clean.includes(pack.catSlug.toUpperCase().replace(/-/g, ""))) {
      localStorage.setItem(`polycards_unlocked_category_${pack.catSlug}`, "true");
      localStorage.setItem(STORAGE_KEY_CODE, clean);
      notifyActivationChanged();

      const isCurrentCardMatch = currentCategorySlug
        ? currentCategorySlug.toLowerCase() === pack.catSlug
        : true;

      return {
        success: true,
        tier: "pack",
        unlockedCategory: pack.catSlug,
        message: isCurrentCardMatch
          ? `Chúc mừng bạn! Mã đã mở khóa thành công toàn bộ Bộ 30 Thẻ [${pack.name}]!`
          : `Mã hợp lệ cho [Bộ 30 Thẻ ${pack.name}]. Thẻ hiện tại thuộc bộ khác nên bạn hãy chọn thẻ thuộc bộ ${pack.name} để quét nhé!`,
      };
    }
  }

  // TRƯỜNG HỢP 3: Kích hoạt Combo 6 Thẻ Cơ Bản (Hoặc Mã Hóa Đơn Trực Tiếp Chung)
  const isCombo6Code =
    clean.startsWith("POLY-COMBO6") ||
    clean.startsWith("COMBO6") ||
    clean.startsWith("POLY-6") ||
    clean.startsWith("HD-DIR-") ||
    clean.startsWith("HD-") ||
    clean.startsWith("HOADON-") ||
    clean.startsWith("ORDER-");

  if (isCombo6Code) {
    localStorage.setItem(STORAGE_KEY_CODE, clean);
    localStorage.setItem("polycards_unlocked_category_dong-vat", "true");
    COMBO_6_SLUGS.forEach((s) => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${s}`, "true");
    });
    notifyActivationChanged();

    return {
      success: true,
      tier: "combo6",
      unlockedSlugs: COMBO_6_SLUGS,
      message: "Chúc mừng bạn! Đã mở khóa thành công Bộ Thẻ AR Động Vật (Mèo, Chó, Hươu, Sư Tử, Voi, Gấu Trúc)!",
    };
  }

  // TRƯỜNG HỢP 4: Kích hoạt Mua Lẻ 1 Thẻ Duy Nhất (Single Card)
  // Format: POLY-[SLUG]-XXXX (ví dụ: POLY-CAT-8812, POLY-LION-3391, ORD-CAT-7712...)
  for (const slug of ALL_ANIMAL_SLUGS) {
    const slugUpper = slug.toUpperCase();
    if (
      clean.includes(`-${slugUpper}-`) ||
      clean.startsWith(`POLY-${slugUpper}`) ||
      clean.startsWith(`${slugUpper}-`) ||
      clean === slugUpper
    ) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, "true");
      localStorage.setItem(STORAGE_KEY_CODE, clean);
      notifyActivationChanged();

      return {
        success: true,
        tier: "single",
        unlockedSlug: slug,
        message: `Kích hoạt thành công thẻ AR bản quyền riêng cho thẻ: ${slug.toUpperCase()}!`,
      };
    }
  }

  // TRƯỜNG HỢP 4: Mã đơn hàng hợp lệ tổng quát (ORD-XXXX / POLY-XXXX)
  if (clean.startsWith("POLY-") || clean.startsWith("ORD-")) {
    // Mặc định mở khóa toàn bộ nếu là mã đơn hàng chính thức
    localStorage.setItem(STORAGE_KEY_ALL, "true");
    localStorage.setItem(STORAGE_KEY_CODE, clean);
    ALL_ANIMAL_SLUGS.forEach((s) => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${s}`, "true");
    });
    notifyActivationChanged();

    return {
      success: true,
      tier: "vip",
      unlockedSlugs: ALL_ANIMAL_SLUGS,
      message: "Mã đơn hàng hợp lệ! Đã mở khóa toàn bộ hệ thống thẻ bài AR Poly Cards.",
    };
  }

  return {
    success: false,
    message: "Mã bản quyền không tồn tại hoặc chưa chính xác. Vui lòng kiểm tra lại thẻ cào bên trong hộp thẻ Poly Cards.",
  };
}

/**
 * Mở khóa thủ công riêng 1 con vật
 */
export function unlockSingleAnimal(slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug.toLowerCase()}`, "true");
  notifyActivationChanged();
}

/**
 * Xóa kích hoạt (phục vụ mục đích kiểm thử / reset bản quyền)
 */
export function resetActivationForTesting(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_ALL);
  localStorage.removeItem(STORAGE_KEY_CODE);
  ALL_ANIMAL_SLUGS.forEach((s) => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${s}`);
  });
  notifyActivationChanged();
}

/**
 * Phát sự kiện thông báo cập nhật bản quyền trên toàn bộ giao diện
 */
function notifyActivationChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("polycards_activated"));
  }
}
