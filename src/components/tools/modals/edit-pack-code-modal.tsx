"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, Tag, FileText, Check, AlertCircle } from "lucide-react";
import { ProductCategory, Animal } from "@/types/animal";
import { updatePackCode, PackCodeItem } from "@/lib/pack-codes-store";

interface EditPackCodeModalProps {
  isOpen: boolean;
  pack: PackCodeItem | null;
  categoriesList: ProductCategory[];
  productsList?: Animal[];
  onClose: () => void;
  onUpdated: (updatedPack: PackCodeItem) => void;
}

export function EditPackCodeModal({
  isOpen,
  pack,
  categoriesList,
  productsList = [],
  onClose,
  onUpdated,
}: EditPackCodeModalProps) {
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("hanh-dong");
  const [description, setDescription] = useState<string>("");
  const [syncCards, setSyncCards] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (pack) {
      setCode(pack.code);
      setName(pack.name);
      setSelectedCategorySlug(pack.categorySlug || "hanh-dong");
      setDescription(pack.description || "");
    }
  }, [pack]);

  if (!isOpen || !pack) return null;

  const matchedCardsCount = productsList.filter(
    (p) => p.packCode && p.packCode.trim().toUpperCase() === pack.code.trim().toUpperCase()
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    try {
      const cleanNewCode = code.trim().toUpperCase().replace(/\s+/g, "-");
      const matchedCategory = categoriesList.find((c) => c.slug === selectedCategorySlug);
      const categoryName = matchedCategory ? matchedCategory.name : pack.categoryName || "Khác";

      const updatedFields: Partial<PackCodeItem> = {
        code: cleanNewCode,
        name: name.trim() || `Bộ Thẻ ${cleanNewCode}`,
        categorySlug: selectedCategorySlug,
        categoryName,
        description: description.trim() || undefined,
      };

      const updatedList = updatePackCode(pack.code, updatedFields);
      const found = updatedList.find((p) => p.code === cleanNewCode) || {
        ...pack,
        ...updatedFields,
        code: cleanNewCode,
      };

      // Đồng bộ sang các thẻ bài trong kho nếu mã code thay đổi và người dùng chọn syncCards
      if (syncCards && cleanNewCode !== pack.code && matchedCardsCount > 0) {
        const matchingCards = productsList.filter(
          (p) => p.packCode && p.packCode.trim().toUpperCase() === pack.code.trim().toUpperCase()
        );

        for (const card of matchingCards) {
          try {
            await fetch(`/api/products/${card.slug}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...card,
                packCode: cleanNewCode,
              }),
            });
          } catch {
            // bỏ qua lỗi từng card để không chặn lưu
          }
        }
      }

      onUpdated(found);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-400/40 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-amber-950/40 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                Chỉnh Sửa Mã Bộ Sản Phẩm
              </h3>
              <p className="text-[11px] text-stone-400">
                Mã hiện tại: <strong className="font-mono text-amber-300">{pack.code}</strong>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Mã Bộ Code */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-300">
              Mã bộ sản phẩm (viết hoa, không dấu) *:
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-500" />
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: POLY30-DONGVAT, POLY30-HANHDONG..."
                className="w-full bg-stone-950 border border-white/20 rounded-xl pl-9 pr-3 py-2 text-xs text-amber-300 font-mono font-bold placeholder-stone-600 focus:outline-hidden focus:border-amber-400 uppercase"
              />
            </div>
          </div>

          {/* Tên Bộ Hiển Thị */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-300">
              Tên gọi bộ thẻ hiển thị:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Bộ 30 Thẻ AR Động Vật Hoang Dã"
              className="w-full bg-stone-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Danh mục */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-300">
              Danh mục tương ứng:
            </label>
            <select
              value={selectedCategorySlug}
              onChange={(e) => setSelectedCategorySlug(e.target.value)}
              className="w-full bg-stone-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
            >
              {categoriesList.map((cat) => (
                <option key={cat.id || cat.slug} value={cat.slug} className="bg-stone-900">
                  {cat.name} ({cat.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Mô tả */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-300">
              Mô tả ngắn:
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-500" />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả số lượng thẻ, chủ đề hoặc đặc điểm in ấn..."
                className="w-full bg-stone-950 border border-white/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400 resize-none"
              />
            </div>
          </div>

          {/* Thông tin số thẻ đang liên kết */}
          {matchedCardsCount > 0 && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="h-4 w-4 text-purple-400 shrink-0" />
                <span>Đang có {matchedCardsCount} thẻ bài trong kho mang mã này.</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-stone-300 font-normal">
                <input
                  type="checkbox"
                  checked={syncCards}
                  onChange={(e) => setSyncCards(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>Tự động cập nhật mã mới cho tất cả {matchedCardsCount} thẻ bài trên.</span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? "Đang Lưu..." : "Lưu Thay Đổi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

