/**
 * Poly Cards License & Activation Manager
 * Quản lý phân quyền bản quyền thẻ bài AR theo từng Bộ Thể Loại (30 thẻ / 1 bộ).
 * Nguyên tắc cốt lõi:
 * - Khách hàng mua Bộ nào (ví dụ: Bộ Hoa Quả) được mở khóa các thẻ thuộc Bộ đó.
 * - Hỗ trợ chuẩn hóa Mã Bộ Cơ Sở (Base Pack Code) và biến thể ngôn ngữ:
 *   Ví dụ: POLY30-HOAQUA (in trên hộp/thẻ) tương đương và mở khóa trọn vẹn POLY30-HOAQUA-ENVI / POLY30-HOAQUA-ZHVI.
 */

export const FREE_DEMO_SLUGS: string[] = ["polycards", "butterfly"];

export const COMBO_6_SLUGS = ["cat", "dog", "deer", "lion", "elephant", "panda"];

const ALL_ANIMAL_SLUGS = [
  "cat",
  "lion",
  "dog",
  "deer",
  "elephant",
  "panda",
  "jump",
  "walk",
  "strawberry",
];

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
 * Chuẩn hóa Mã Bộ: Bóc tách các hậu tố biến thể ngôn ngữ (-ENVI, -ZHVI, -VI, -EN)
 * để lấy Mã Bộ Cơ Sở (Base Pack Code).
 * Ví dụ:
 * - "POLY30-HOAQUA-ENVI" -> "POLY30-HOAQUA"
 * - "POLY30-HOAQUA-ZHVI" -> "POLY30-HOAQUA"
 * - "POLY30-HOAQUA"      -> "POLY30-HOAQUA"
 * - "POLY30-XECO-ENVI"   -> "POLY30-XECO"
 */
export function normalizePackCode(raw?: string | null): string {
  if (!raw) return "";
  const clean = raw.trim().toUpperCase();
  return clean.replace(/-(ENVI|ZHVI|VI|EN)$/i, "");
}

/**
 * So khớp xem 2 mã bộ có thuộc về cùng một chủ đề hay không
 */
export function isPackCodeMatched(codeA?: string | null, codeB?: string | null): boolean {
  if (!codeA || !codeB) return false;
  const cleanA = codeA.trim().toUpperCase();
  const cleanB = codeB.trim().toUpperCase();
  if (cleanA === cleanB) return true;

  const baseA = normalizePackCode(cleanA);
  const baseB = normalizePackCode(cleanB);
  if (baseA && baseB && baseA === baseB) return true;

  return false;
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
  if (clean.includes("nghenghiep") || clean.includes("career") || clean.includes("job")) {
    return "nghe-nghiep";
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
 * Hỗ trợ kiểm tra theo: Thẻ miễn phí demo, Mã VIP, Mã Danh mục, Mã Bộ Cơ Sở hoặc Từng thẻ.
 */
export function isAnimalUnlocked(
  slug: string,
  categorySlug?: string,
  packCode?: string
): boolean {
  if (typeof window === "undefined") return false;

  const cleanSlug = slug.toLowerCase().trim();

  // 1. Thẻ mẫu miễn phí demo hệ thống
  if (FREE_DEMO_SLUGS.includes(cleanSlug)) {
    return true;
  }

  // 2. Khách hàng có mã Admin VIP mở khóa toàn bộ
  if (localStorage.getItem(STORAGE_KEY_ALL) === "true") {
    return true;
  }

  // 3. Kiểm tra theo Mã Bộ (Pack Code)
  if (packCode) {
    const cleanPack = packCode.trim().toUpperCase();
    const basePack = normalizePackCode(cleanPack);

    if (
      localStorage.getItem(`polycards_unlocked_pack_${cleanPack}`) === "true" ||
      localStorage.getItem(`polycards_unlocked_pack_${basePack}`) === "true"
    ) {
      return true;
    }
  }

  // 4. Kiểm tra chính xác theo Bộ Danh Mục (Category Pack) mà thẻ này trực thuộc
  if (categorySlug) {
    const normCat = normalizeCategorySlug(categorySlug);
    if (localStorage.getItem(`polycards_unlocked_category_${normCat}`) === "true") {
      return true;
    }
  }

  // 5. Mở khóa theo từng thẻ cụ thể
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
 * Áp dụng mở khóa cho đúng 1 Bộ Danh Mục và lưu đồng bộ Mã Bộ
 */
function applyCategoryUnlock(
  code: string,
  targetCategorySlug: string,
  packTitle: string,
  currentCategorySlug?: string,
  currentPackCode?: string
): ActivationResult {
  const normTarget = normalizeCategorySlug(targetCategorySlug);
  const normCurrent = currentCategorySlug ? normalizeCategorySlug(currentCategorySlug) : normTarget;

  const cleanCode = code.trim().toUpperCase();
  const baseCode = normalizePackCode(cleanCode);

  // Mở khóa danh mục và mở khóa cả mã bộ cơ sở
  localStorage.setItem(`polycards_unlocked_category_${normTarget}`, "true");
  localStorage.setItem(`polycards_unlocked_pack_${cleanCode}`, "true");
  if (baseCode) {
    localStorage.setItem(`polycards_unlocked_pack_${baseCode}`, "true");
  }
  localStorage.setItem(STORAGE_KEY_CODE, cleanCode);
  notifyActivationChanged();

  // Kiểm tra tương thích mã bộ hoặc danh mục
  const packMatched = currentPackCode ? isPackCodeMatched(cleanCode, currentPackCode) : false;

  if (currentCategorySlug && normCurrent !== normTarget && !packMatched) {
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
    message: `Chúc mừng bạn! Mã [${code}] đã mở khóa thành công trọn bộ "${packTitle}"!`,
  };
}

/**
 * Kích hoạt bản quyền đồng bộ (Dựa trên cấu trúc mã bộ POLY30-<CAT>-XXXX)
 */
export function activateWithCode(
  code: string,
  currentCategorySlug?: string,
  currentCardSlug?: string,
  currentPackCode?: string
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

  // 3. Kiểm tra mã Bộ Danh Mục theo tiền tố chuẩn (POLY30-DONGVAT, POLY30-HOAQUA, POLY30-XECO, etc.)
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
    {
      keywords: ["NGHENGHIEP", "NGHE-NGHIEP", "CAREER", "JOB"],
      catSlug: "nghe-nghiep",
      title: "Bộ 30 Thẻ AR Nghề Nghiệp",
    },
    {
      keywords: ["COMBOVIP", "VIP120", "POLY120"],
      catSlug: "dong-vat",
      title: "Trọn Bộ Siêu Combo 120 Thẻ Poly Cards",
    },
  ];

  for (const pack of PACK_MAPPINGS) {
    if (pack.keywords.some((kw) => clean.includes(kw))) {
      return applyCategoryUnlock(clean, pack.catSlug, pack.title, currentCategorySlug, currentPackCode);
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
 */
export async function activateWithCodeAsync(
  code: string,
  currentCategorySlug?: string,
  currentCardSlug?: string,
  codeParent?: string,
  currentPackCode?: string
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

  // 1. Tra cứu trực tiếp mã hóa đơn trên MongoDB Atlas qua API /api/orders
  try {
    const queryUrl = `/api/orders?code=${encodeURIComponent(clean)}${
      cleanParent ? `&codeParent=${encodeURIComponent(cleanParent)}` : ""
    }`;
    const res = await fetch(queryUrl);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const order = json.data;

        if (cleanParent || order.codeParent) {
          localStorage.setItem("polycards_parent_code", cleanParent || order.codeParent);
        }

        // XỬ LÝ MÃ THẺ ĐƠN LẺ (SINGLE)
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

        // XỬ LÝ MÃ BỘ DANH MỤC
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
        return applyCategoryUnlock(clean, allowedCat, packTitle, currentCategorySlug, currentPackCode);
      }
    }
  } catch (err) {
    console.warn("[Activation] Fallback kiểm tra cấu trúc mã bộ:", err);
  }

  // 2. Fallback kiểm tra theo cấu trúc mã bộ
  return activateWithCode(clean, currentCategorySlug, currentCardSlug, currentPackCode);
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
  ["dong-vat", "hanh-dong", "xe-co", "hoa-qua", "nghe-nghiep"].forEach((cat) => {
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
