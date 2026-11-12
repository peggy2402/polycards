"use client";

export interface PackCodeItem {
  code: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  description?: string;
  cardsCount?: number;
  singleCardPrice?: number;
  originalPrice?: number;
  discountPercent?: number;
  salePrice?: number;
  isManualPrice?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const PACK_CODES_UPDATED_EVENT = "poly_pack_codes_updated";

export const DEFAULT_PACK_CODES: PackCodeItem[] = [
  {
    code: "POLY30-XECO-ZHVI",
    name: "Bộ 30 Thẻ AR Phương Tiện ZHVI",
    categorySlug: "xe-co",
    categoryName: "Xe Cộ & Giao Thông",
    description: "Bộ 30 thẻ bài phương tiện giao thông song ngữ Trung - Việt",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-XECO-ENVI",
    name: "Bộ 30 Thẻ AR Phương Tiện ENVI",
    categorySlug: "xe-co",
    categoryName: "Xe Cộ & Giao Thông",
    description: "Bộ 30 thẻ bài phương tiện giao thông song ngữ Anh - Việt",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-NGHENGHIEP",
    name: "Bộ 30 Thẻ AR Nghề Nghiệp",
    categorySlug: "nghe-nghiep",
    categoryName: "Nghề Nghiệp",
    description: "Bộ 30 thẻ các ngành nghề tương tác 3D WebAR",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-DONGVAT-ZHVI",
    name: "Bộ 30 Thẻ AR ĐỘNG VẬT ZH VI",
    categorySlug: "dong-vat",
    categoryName: "Động Vật",
    description: "Bộ thẻ động vật song ngữ Trung - Việt tương tác WebAR 3D",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-DONGVAT-ENVI",
    name: "Bộ 30 Thẻ AR ĐỘNG VẬT EN VI",
    categorySlug: "dong-vat",
    categoryName: "Động Vật",
    description: "Bộ thẻ động vật song ngữ Anh - Việt tương tác WebAR 3D",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-DONGVAT",
    name: "Bộ 30 Thẻ AR Động Vật",
    categorySlug: "dong-vat",
    categoryName: "Động Vật",
    description: "Bộ sưu tập 30 loài động vật tương tác 3D WebAR",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-HANHDONG",
    name: "Bộ 30 Thẻ AR Hành Động",
    categorySlug: "hanh-dong",
    categoryName: "Hành Động",
    description: "Bộ 30 thẻ động từ hành động tiếng Anh tương tác sống động",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-XECO",
    name: "Bộ 30 Thẻ AR Xe Cộ",
    categorySlug: "xe-co",
    categoryName: "Xe Cộ",
    description: "Bộ 30 phương tiện giao thông và máy bay tương tác AR",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY30-HOAQUA",
    name: "Bộ 30 Thẻ AR Hoa Quả",
    categorySlug: "hoa-qua",
    categoryName: "Hoa Quả",
    description: "Bộ 30 loại trái cây và thực vật bổ ích",
    createdAt: "2026-10-25",
  },
  {
    code: "POLY120-COMBOVIP",
    name: "Trọn Bộ VIP 120 Thẻ Học AR",
    categorySlug: "combo-vip",
    categoryName: "Combo VIP",
    description: "Trọn bộ 4 chủ đề 120 thẻ bài AR 3D cao cấp",
    createdAt: "2026-10-25",
  },
];

const PACK_CODES_STORAGE_KEY = "poly_pack_codes_v1";

// Cache in-memory trên client
let cachedPackCodes: PackCodeItem[] | null = null;
let isFetchingFromServer = false;

/**
 * Tải danh sách mã bộ trực tiếp từ Database MongoDB Atlas qua API
 * Sau đó đồng bộ vào memory cache và localStorage để dùng offline.
 */
export async function fetchPackCodesFromApi(): Promise<PackCodeItem[]> {
  if (typeof window === "undefined") {
    return DEFAULT_PACK_CODES;
  }

  try {
    isFetchingFromServer = true;
    const res = await fetch("/api/pack-codes", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      cachedPackCodes = json.data;
      try {
        localStorage.setItem(PACK_CODES_STORAGE_KEY, JSON.stringify(json.data));
      } catch {
        // bỏ qua nếu quota storage đầy
      }
      window.dispatchEvent(
        new CustomEvent(PACK_CODES_UPDATED_EVENT, { detail: json.data })
      );
      return json.data;
    }
  } catch (err) {
    console.warn("[pack-codes-store] Không thể lấy từ MongoDB API, dùng cache:", err);
  } finally {
    isFetchingFromServer = false;
  }

  return getStoredPackCodes();
}

/**
 * Lấy danh sách mã bộ hiện tại.
 * Ưu tiên Cache Memory -> LocalStorage -> Default, và tự động gọi API ngầm để sync MongoDB.
 */
export function getStoredPackCodes(): PackCodeItem[] {
  if (typeof window === "undefined") {
    return DEFAULT_PACK_CODES;
  }

  if (cachedPackCodes && cachedPackCodes.length > 0) {
    return cachedPackCodes;
  }

  let result = DEFAULT_PACK_CODES;
  try {
    const raw = localStorage.getItem(PACK_CODES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        result = parsed;
      }
    }
  } catch {
    result = DEFAULT_PACK_CODES;
  }

  cachedPackCodes = result;

  // Tự động kích hoạt sync từ MongoDB Atlas âm thầm nếu chưa fetch
  if (!isFetchingFromServer) {
    fetchPackCodesFromApi().catch(() => {});
  }

  return result;
}

/**
 * Thêm mới mã bộ: Lưu đồng thời vào MongoDB Atlas và cập nhật ngay lập tức giao diện
 */
export function saveNewPackCode(item: Omit<PackCodeItem, "createdAt">): PackCodeItem[] {
  const current = getStoredPackCodes();
  const cleanCode = item.code.trim().toUpperCase();
  const existingIdx = current.findIndex((p) => p.code.toUpperCase() === cleanCode);

  const newItem: PackCodeItem = {
    ...item,
    code: cleanCode,
    createdAt: new Date().toLocaleDateString("vi-VN"),
  };

  let updated: PackCodeItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = newItem;
  } else {
    updated = [newItem, ...current];
  }

  cachedPackCodes = updated;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PACK_CODES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent(PACK_CODES_UPDATED_EVENT, { detail: updated }));

    // Gửi lưu vĩnh viễn lên Database MongoDB Atlas
    fetch("/api/pack-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    }).catch((err) => {
      console.error("[pack-codes-store] Lỗi lưu mã bộ lên MongoDB Atlas:", err);
    });
  }

  return updated;
}

/**
 * Cập nhật thông tin mã bộ: Lưu vào MongoDB Atlas và cập nhật giao diện
 */
export function updatePackCode(
  oldCode: string,
  updatedData: Partial<PackCodeItem>
): PackCodeItem[] {
  const current = getStoredPackCodes();
  const cleanOld = oldCode.trim().toUpperCase();
  const existingIdx = current.findIndex((p) => p.code.toUpperCase() === cleanOld);

  if (existingIdx === -1) {
    return current;
  }

  const existing = current[existingIdx];
  const newCode = (updatedData.code || existing.code).trim().toUpperCase();

  const updatedItem: PackCodeItem = {
    ...existing,
    ...updatedData,
    code: newCode,
    updatedAt: new Date().toISOString(),
  };

  const updated = [...current];
  updated[existingIdx] = updatedItem;

  cachedPackCodes = updated;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PACK_CODES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent(PACK_CODES_UPDATED_EVENT, { detail: updated }));

    // Gửi lưu vĩnh viễn lên Database MongoDB Atlas
    fetch("/api/pack-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedItem),
    }).catch((err) => {
      console.error("[pack-codes-store] Lỗi update mã bộ lên MongoDB Atlas:", err);
    });
  }

  return updated;
}

/**
 * Xóa mã bộ: Xóa trên MongoDB Atlas và đồng bộ giao diện
 */
export function deleteStoredPackCode(code: string): PackCodeItem[] {
  const cleanCode = code.trim().toUpperCase();
  const current = getStoredPackCodes();
  const updated = current.filter((p) => p.code.toUpperCase() !== cleanCode);

  cachedPackCodes = updated;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PACK_CODES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent(PACK_CODES_UPDATED_EVENT, { detail: updated }));

    // Gửi xóa trên Database MongoDB Atlas
    fetch(`/api/pack-codes?code=${encodeURIComponent(cleanCode)}`, {
      method: "DELETE",
    }).catch((err) => {
      console.error("[pack-codes-store] Lỗi xóa mã bộ trên MongoDB Atlas:", err);
    });
  }

  return updated;
}

/**
 * Tự động tìm mã bộ tương ứng với danh mục thẻ bài
 */
export function getPackCodeForCategory(categorySlugOrName?: string): string {
  if (!categorySlugOrName) return "POLY30-DONGVAT-ENVI";
  const raw = categorySlugOrName.trim().toLowerCase();

  // 1. Kiểm tra nhanh các chủ đề phổ biến
  if (
    raw.includes("hoa-qua") ||
    raw.includes("hoa qua") ||
    raw.includes("trái cây") ||
    raw.includes("trai cay") ||
    raw.includes("thực vật") ||
    raw.includes("thuc vat")
  ) {
    return "POLY30-HOAQUA";
  }
  if (
    raw.includes("nghe-nghiep") ||
    raw.includes("nghe nghiep") ||
    raw.includes("nghề nghiệp") ||
    raw.includes("nghề")
  ) {
    return "POLY30-NGHENGHIEP";
  }
  if (
    raw.includes("dong-vat") ||
    raw.includes("dong vat") ||
    raw.includes("động vật") ||
    raw.includes("thu cung")
  ) {
    return "POLY30-DONGVAT-ENVI";
  }
  if (
    raw.includes("hanh-dong") ||
    raw.includes("hanh dong") ||
    raw.includes("hành động") ||
    raw.includes("dong tu")
  ) {
    return "POLY30-HANHDONG";
  }
  if (
    raw.includes("xe-co") ||
    raw.includes("xe co") ||
    raw.includes("giao thông") ||
    raw.includes("giao thong") ||
    raw.includes("phương tiện")
  ) {
    return "POLY30-XECO-ENVI";
  }

  // 2. Tra cứu trong danh sách mã bộ đã lưu trữ trong Database
  const stored = getStoredPackCodes();
  const found = stored.find(
    (p) =>
      p.categorySlug.toLowerCase() === raw ||
      p.categoryName.toLowerCase() === raw ||
      p.name.toLowerCase().includes(raw)
  );
  if (found) return found.code;

  // 3. Fallback theo chuẩn POLY30-[SLUG]
  const clean = raw.replace(/[^a-z0-9]/g, "");
  return clean ? `POLY30-${clean.toUpperCase()}` : "POLY30-DONGVAT-ENVI";
}
