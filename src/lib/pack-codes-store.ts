"use client";

import { ProductCategory } from "@/types/animal";

export interface PackCodeItem {
  code: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  description?: string;
  cardsCount?: number;
  createdAt: string;
}

export const PACK_CODES_UPDATED_EVENT = "poly_pack_codes_updated";

export const DEFAULT_PACK_CODES: PackCodeItem[] = [
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

export function getStoredPackCodes(): PackCodeItem[] {
  if (typeof window === "undefined") {
    return DEFAULT_PACK_CODES;
  }
  try {
    const raw = localStorage.getItem(PACK_CODES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PACK_CODES_STORAGE_KEY, JSON.stringify(DEFAULT_PACK_CODES));
      return DEFAULT_PACK_CODES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PACK_CODES;
  } catch {
    return DEFAULT_PACK_CODES;
  }
}

export function saveNewPackCode(item: Omit<PackCodeItem, "createdAt">): PackCodeItem[] {
  if (typeof window === "undefined") return DEFAULT_PACK_CODES;
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

  localStorage.setItem(PACK_CODES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(PACK_CODES_UPDATED_EVENT, { detail: updated }));
  return updated;
}

export function deleteStoredPackCode(code: string): PackCodeItem[] {
  if (typeof window === "undefined") return DEFAULT_PACK_CODES;
  const current = getStoredPackCodes();
  const updated = current.filter((p) => p.code.toUpperCase() !== code.trim().toUpperCase());
  localStorage.setItem(PACK_CODES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(PACK_CODES_UPDATED_EVENT, { detail: updated }));
  return updated;
}
