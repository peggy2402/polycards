/**
 * Poly Cards License & Activation Manager
 * Quản lý phân quyền bản quyền thẻ bài AR theo từng Bộ Thể Loại (30 thẻ / 1 bộ).
 * Nguyên tắc cốt lõi:
 * - Khách hàng mua Bộ nào (ví dụ: Bộ Hành Động) chỉ được mở khóa các thẻ thuộc Bộ đó.
 * - Tuyệt đối không dùng mã của Bộ này để mở khóa sang Bộ khác (Động vật, Phương tiện, Hoa quả...).
 */

export const FREE_DEMO_SLUGS: string[] = [];

export const COMBO_6_SLUGS = ["cat", "dog", "deer", "lion", "elephant", "panda"];

const ALL_ANIMAL_SLUGS = ["cat", "lion", "dog", "deer", "elephant", "panda", "jump", "walk"];

// Mã VIP chỉ dành riêng cho Admin kiểm thử toàn hệ thống
const VIP_ACTIVATION_CODES = ["POLYCARDS-ADMIN-VIP", "POLY-VIP-ALL"];

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
  isWrongCategory?: boolean;
}

/**
 * Chuẩn hóa slug danh mục để luôn khớp chính xác giữa Hóa đơn (orders) và Thẻ bài (products)
 */
export function normalizeCategorySlug(raw?: string | null): string {
  if (!raw) return "dong-vat";
  const clean = raw
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "");

  if (clean.includes("hanhdong") || clean.includes("action")) {
    return "hanh-dong";
  }
  if (
    clean.includes("xeco") ||
    clean.includes("phuongtien") ||
    clean.includes("vehicle") ||
    clean.includes("giaothong")
  ) {
    return "xe-co";
  }
  if (clean.includes("hoaqua") || clean.includes("traicay") || clean.includes("fruit")) {
    return "hoa-qua";
  }
  if (clean.includes("dongvat") || clean.includes("animal")) {
    return "dong-vat";
  }

  return raw
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryDisplayName(catSlug: string): string {
  const norm = normalizeCategorySlug(catSlug);
  switch (norm) {
    case "dong-vat":
      return "Bộ 30 Thẻ Động Vật";
    case "hanh-dong":
      return "Bộ 30 Thẻ Hành Động";
    case "xe-co":
      return "Bộ 30 Thẻ Phương Tiện & Xe Cộ";
    case "hoa-qua":
      return "Bộ 30 Thẻ Hoa Quả & Trái Cây";
    default:
      return `Bộ Thẻ ${catSlug}`;
  }
}

/**
 * Kiểm tra xem một thẻ bài cụ thể có được mở khóa tính năng AR hay không
 * Chỉ mở khóa khi khách đã kích hoạt đúng Bộ Danh Mục (categorySlug) của thẻ đó.
 */
export function isAnimalUnlocked(slug: string, categorySlug?: string): boolean {
  if (typeof window === "undefined") return false;

  const cleanSlug = slug.toLowerCase().trim();

  // 1. Khách hàng có mã Admin VIP mở khóa toàn bộ
  if (localStorage.getItem(STORAGE_KEY_ALL) === "true") {
    return true;
  }

  // 2. Kiểm tra chính xác theo Bộ Danh Mục (Category Pack) mà thẻ này trực thuộc
  if (categorySlug) {
    const normCat = normalizeCategorySlug(categorySlug);
    if (localStorage.getItem(`polycards_unlocked_category_${normCat}`) === "true") {
      return true;
    }
  }

  // 3. Mở khóa theo từng thẻ cụ thể (nếu cùng bộ đã được kích hoạt)
  if (localStorage.getItem(`${STORAGE_KEY_PREFIX}${cleanSlug}`) === "true") {
    return true;
  }

  return false;
}

/**
 * Lấy danh sách các thẻ đã mở khóa trên thiết bị hiện tại
 */
export function getUnlockedAnimals(): string[] {
  if (typeof window === "undefined") return [];

  if (localStorage.getItem(STORAGE_KEY_ALL) === "true") {
    return [...ALL_ANIMAL_SLUGS];
  }

  const unlocked: string[] = [];
  ALL_ANIMAL_SLUGS.forEach((slug) => {
    if (localStorage.getItem(`${STORAGE_KEY_PREFIX}${slug}`) === "true" && !unlocked.includes(slug)) {
      unlocked.push(slug);
    }
  });

  return unlocked;
}

/**
 * Áp dụng mở khóa cho đúng 1 Bộ Danh Mục và kiểm tra thẻ hiện tại có thuộc Bộ đó không
 */
function applyCategoryUnlock(
  code: string,
  targetCategorySlug: string,
  packTitle: string,
  currentCategorySlug?: string
): ActivationResult {
  const normTarget = normalizeCategorySlug(targetCategorySlug);
  const normCurrent = currentCategorySlug ? normalizeCategorySlug(currentCategorySlug) : normTarget;

  // Chỉ mở khóa duy nhất danh mục của mã bộ này
  localStorage.setItem(`polycards_unlocked_category_${normTarget}`, "true");
  localStorage.setItem(STORAGE_KEY_CODE, code);
  notifyActivationChanged();

  if (currentCategorySlug && normCurrent !== normTarget) {
    const currentDisplay = getCategoryDisplayName(normCurrent);
    return {
      success: false,
      tier: "pack",
      unlockedCategory: normTarget,
      isWrongCategory: true,
      message: `Mã [${code}] thuộc về "${packTitle}", KHÔNG áp dụng cho "${currentDisplay}". Bạn đã được mở khóa "${packTitle}", vui lòng quét thẻ thuộc đúng bộ đã mua!`,
    };
  }

  return {
    success: true,
    tier: "pack",
    unlockedCategory: normTarget,
    message: `Chúc mừng bạn! Mã hóa đơn [${code}] đã mở khóa thành công trọn bộ "${packTitle}"!`,
  };
}

/**
 * Kích hoạt bản quyền đồng bộ (Dựa trên cấu trúc mã bộ POLY30-<CAT>-XXXX)
 */
export function activateWithCode(
  code: string,
  currentCategorySlug?: string,
  currentCardSlug?: string
): ActivationResult {
  if (typeof window === "undefined") {
    return { success: false, message: "Môi trường trình duyệt không hợp lệ" };
  }

  const clean = code.trim().toUpperCase();
  if (!clean || clean.length < 4) {
    return {
      success: false,
      message: "Vui lòng nhập mã hóa đơn / mã bộ hợp lệ từ hộp thẻ Poly Cards.",
    };
  }

  // 1. Mã Admin VIP đặc biệt
  if (VIP_ACTIVATION_CODES.includes(clean)) {
    localStorage.setItem(STORAGE_KEY_ALL, "true");
    localStorage.setItem(STORAGE_KEY_CODE, clean);
    notifyActivationChanged();
    return {
      success: true,
      tier: "vip",
      unlockedSlugs: ALL_ANIMAL_SLUGS,
      message: "Đã kích hoạt mã Admin VIP mở khóa toàn bộ danh mục!",
    };
  }

  // 2. Kiểm tra mã Thẻ Lẻ Đơn (SINGLE-{{slug}}-{{cat}}-{{cust}}-{{inv}})
  if (clean.startsWith("SINGLE-")) {
    const parts = clean.split("-");
    const targetSlug = parts[1]?.toLowerCase();
    if (targetSlug) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${targetSlug}`, "true");
      localStorage.setItem(STORAGE_KEY_CODE, clean);
      notifyActivationChanged();

      if (currentCardSlug && currentCardSlug.toLowerCase() !== targetSlug) {
        return {
          success: false,
          tier: "single",
          unlockedSlug: targetSlug,
          message: `Mã [${code}] chỉ kích hoạt cho thẻ bài "${targetSlug.toUpperCase()}". Thẻ bài hiện tại chưa được kích hoạt!`,
        };
      }

      return {
        success: true,
        tier: "single",
        unlockedSlug: targetSlug,
        message: `Kích hoạt thành công thẻ bài "${targetSlug.toUpperCase()}"!`,
      };
    }
  }

  // 3. Kiểm tra mã Bộ Danh Mục theo tiền tố chuẩn (POLY30-DONGVAT-XXXX, POLY30-HANHDONG-XXXX, PACK-...)
  const PACK_MAPPINGS: Array<{ keywords: string[]; catSlug: string; title: string }> = [
    {
      keywords: ["DONGVAT", "DONG-VAT", "ANIMAL"],
      catSlug: "dong-vat",
      title: "Bộ 30 Thẻ AR Động Vật",
    },
    {
      keywords: ["HANHDONG", "HANH-DONG", "ACTION"],
      catSlug: "hanh-dong",
      title: "Bộ 30 Thẻ AR Hành Động",
    },
    {
      keywords: ["XECO", "XE-CO", "PHUONGTIEN", "PHUONG-TIEN", "VEHICLE"],
      catSlug: "xe-co",
      title: "Bộ 30 Thẻ AR Phương Tiện & Xe Cộ",
    },
    {
      keywords: ["HOAQUA", "HOA-QUA", "TRAICAY", "TRAI-CAY", "FRUIT"],
      catSlug: "hoa-qua",
      title: "Bộ 30 Thẻ AR Hoa Quả & Trái Cây",
    },
  ];

  for (const pack of PACK_MAPPINGS) {
    if (pack.keywords.some((kw) => clean.includes(kw))) {
      return applyCategoryUnlock(clean, pack.catSlug, pack.title, currentCategorySlug);
    }
  }

  return {
    success: false,
    message:
      "Mã hóa đơn không tồn tại hoặc không hợp lệ. Vui lòng kiểm tra lại mã bộ trên hóa đơn mua hàng Poly Cards.",
  };
}

/**
 * Kích hoạt bản quyền có đối chiếu trực tiếp với Database MongoDB Atlas (bảng orders)
 * Đảm bảo:
 * 1. Mọi mã hóa đơn tạo từ POS / Tools đều được xác thực chuẩn xác trên hệ thống.
 * 2. Phân loại chuẩn xác:
 *    - SINGLE: Mở khóa đúng 1 thẻ duy nhất (unlockedSlug).
 *    - MULTI: Mở khóa đúng danh sách các thẻ mua (unlockedSlugs).
 *    - PACK: Mở khóa toàn bộ thẻ thuộc danh mục (allowedCategorySlug).
 */
export async function activateWithCodeAsync(
  code: string,
  currentCategorySlug?: string,
  currentCardSlug?: string,
  codeParent?: string
): Promise<ActivationResult> {
  if (typeof window === "undefined") {
    return { success: false, message: "Môi trường trình duyệt không hợp lệ" };
  }

  const clean = (code || codeParent || "").trim().toUpperCase();
  const cleanParent = codeParent ? codeParent.trim().toUpperCase() : undefined;

  if (!clean && !cleanParent) {
    return {
      success: false,
      message: "Vui lòng nhập mã hóa đơn / mã bộ hợp lệ từ hộp thẻ Poly Cards.",
    };
  }

  // 1. Tra cứu trực tiếp mã hóa đơn trên MongoDB Atlas qua API /api/orders?code=...&codeParent=...
  try {
    const queryUrl = `/api/orders?code=${encodeURIComponent(clean)}${
      cleanParent ? `&codeParent=${encodeURIComponent(cleanParent)}` : ""
    }`;
    const res = await fetch(queryUrl);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const order = json.data;

        // Nếu đơn hàng có mã cha, lưu vào localStorage
        if (cleanParent || order.codeParent) {
          localStorage.setItem("polycards_parent_code", cleanParent || order.codeParent);
        }

        // A. XỬ LÝ MÃ THẺ ĐƠN LẺ (SINGLE)
        if (order.codeType === "SINGLE" || clean.startsWith("SINGLE-")) {
          const targetSlug = (order.unlockedSlug || clean.split("-")[1] || "").toLowerCase().trim();
          if (targetSlug) {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${targetSlug}`, "true");
            localStorage.setItem(STORAGE_KEY_CODE, cleanParent || clean);
            notifyActivationChanged();

            if (currentCardSlug && currentCardSlug.toLowerCase() !== targetSlug) {
              return {
                success: false,
                tier: "single",
                unlockedSlug: targetSlug,
                message: `Mã [${code}] chỉ kích hoạt cho thẻ bài "${targetSlug.toUpperCase()}". Thẻ bài hiện tại chưa được kích hoạt!`,
              };
            }

            return {
              success: true,
              tier: "single",
              unlockedSlug: targetSlug,
              message: `Chúc mừng bạn! Mã hóa đơn [${code}] đã mở khóa thành công thẻ bài "${targetSlug.toUpperCase()}"!`,
            };
          }
        }

        // B. XỬ LÝ MÃ NHIỀU THẺ (MULTI)
        if (order.codeType === "MULTI" || clean.startsWith("MULTI-")) {
          const allowedSlugs: string[] = Array.isArray(order.unlockedSlugs)
            ? order.unlockedSlugs.map((s: string) => s.toLowerCase().trim())
            : [];

          allowedSlugs.forEach((s) => {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${s}`, "true");
          });
          localStorage.setItem(STORAGE_KEY_CODE, cleanParent || clean);
          notifyActivationChanged();

          if (currentCardSlug && !allowedSlugs.includes(currentCardSlug.toLowerCase().trim())) {
            return {
              success: false,
              tier: "combo6",
              unlockedSlugs: allowedSlugs,
              message: `Mã [${code}] gồm ${allowedSlugs.length} thẻ bài, nhưng KHÔNG bao gồm thẻ hiện tại!`,
            };
          }

          return {
            success: true,
            tier: "combo6",
            unlockedSlugs: allowedSlugs,
            message: `Chúc mừng bạn! Mã [${code}] đã mở khóa thành công gói ${allowedSlugs.length} thẻ bài tương tác AR!`,
          };
        }

        // C. XỬ LÝ MÃ BỘ DANH MỤC (PACK HOẶC NHIỀU BỘ COMBO CÓ MÃ CHA CODEPARENT)
        if (Array.isArray(order.allowedCategorySlugs) && order.allowedCategorySlugs.length > 0) {
          order.allowedCategorySlugs.forEach((cat: string) => {
            const normalized = normalizeCategorySlug(cat);
            localStorage.setItem(`polycards_unlocked_category_${normalized}`, "true");
          });
          localStorage.setItem(STORAGE_KEY_CODE, cleanParent || clean);
          notifyActivationChanged();

          const normalizedCurrent = currentCategorySlug ? normalizeCategorySlug(currentCategorySlug) : "";
          const isAllowed =
            !normalizedCurrent ||
            order.allowedCategorySlugs.some((c: string) => normalizeCategorySlug(c) === normalizedCurrent);

          if (!isAllowed) {
            return {
              success: false,
              tier: "pack",
              unlockedCategory: order.allowedCategorySlugs[0],
              isWrongCategory: true,
              message: `Mã [${code}] gồm ${order.allowedCategorySlugs.length} bộ thẻ, nhưng không bao gồm danh mục hiện tại!`,
            };
          }

          return {
            success: true,
            tier: "pack",
            unlockedCategory: normalizedCurrent || order.allowedCategorySlugs[0],
            message: `Chúc mừng bạn! Mã [${code}] đã mở khóa thành công ${order.allowedCategorySlugs.length} bộ thẻ bài tương tác WebAR!`,
          };
        }

        const allowedCat = normalizeCategorySlug(
          order.allowedCategorySlug || order.packCode || "dong-vat"
        );
        const packTitle = order.packTitle || getCategoryDisplayName(allowedCat);
        return applyCategoryUnlock(clean, allowedCat, packTitle, currentCategorySlug);
      }
    }
  } catch (err) {
    console.warn("[Activation] Không thể kết nối API kiểm tra đơn hàng, dùng bộ kiểm tra mẫu mã:", err);
  }

  // 2. Fallback kiểm tra theo cấu trúc mã bộ hoặc mã single
  return activateWithCode(clean, currentCategorySlug, currentCardSlug);
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
  ["dong-vat", "hanh-dong", "xe-co", "hoa-qua"].forEach((cat) => {
    localStorage.removeItem(`polycards_unlocked_category_${cat}`);
  });
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
