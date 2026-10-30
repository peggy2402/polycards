"use client";

import React, { useState } from "react";
import { X, PackageCheck, Plus, Tag, FileText } from "lucide-react";
import { ProductCategory } from "@/types/animal";
import { saveNewPackCode, PackCodeItem } from "@/lib/pack-codes-store";

interface AddPackCodeModalProps {
  isOpen: boolean;
  categoriesList: ProductCategory[];
  onClose: () => void;
  onCreated: (newPack: PackCodeItem) => void;
}

export function AddPackCodeModal({
  isOpen,
  categoriesList,
  onClose,
  onCreated,
}: AddPackCodeModalProps) {
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(
    categoriesList[0]?.slug || "hanh-dong"
  );
  const [description, setDescription] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "-");
    const matchedCategory = categoriesList.find((c) => c.slug === selectedCategorySlug);
    const categoryName = matchedCategory ? matchedCategory.name : "Khác";

    const newPack: Omit<PackCodeItem, "createdAt"> = {
      code: cleanCode,
      name: name.trim() || `Bộ Thẻ ${cleanCode}`,
      categorySlug: selectedCategorySlug,
      categoryName,
      description: description.trim() || undefined,
    };

    const updated = saveNewPackCode(newPack);
    const found = updated.find((p) => p.code === cleanCode) || {
      ...newPack,
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };

    onCreated(found);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-purple-400/40 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-purple-950/40 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-black">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                Thêm Mã Bộ Sản Phẩm Mới
              </h3>
              <p className="text-[11px] text-stone-400">
                Tạo mã bộ trong kho để gán thẻ và lập phiếu bán hàng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Mã Bộ */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              Mã Bộ (Pack Code) *:
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ví dụ: POLY30-HANHDONG-02, POLY30-CONTRUNG..."
              className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-purple-300 font-mono font-bold placeholder-stone-600 focus:outline-hidden focus:border-purple-400"
            />
            <span className="text-[10px] text-stone-500 mt-1 block">
              Mã này sẽ được nhúng vào QR của các thẻ thuộc bộ này.
            </span>
          </div>

          {/* Tên Bộ Thẻ */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              Tên Bộ Thẻ Sản Phẩm:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Bộ 30 Thẻ AR Côn Trùng & Sinh Vật..."
              className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-purple-400"
            />
          </div>

          {/* Danh mục tương ứng */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              Thuộc Danh Mục:
            </label>
            <select
              value={selectedCategorySlug}
              onChange={(e) => setSelectedCategorySlug(e.target.value)}
              className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400 cursor-pointer"
            >
              {categoriesList.map((cat) => (
                <option key={cat.id || cat.slug} value={cat.slug} className="bg-stone-900 text-white">
                  {cat.name} ({cat.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              Ghi Chú / Mô Tả (tùy chọn):
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Đợt in ấn xưởng tháng 10/2026, quà tặng..."
              className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-purple-400"
            />
          </div>

          {/* Nút hành động */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 text-xs font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-black shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tạo &amp; Lưu Mã Bộ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

