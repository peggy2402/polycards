"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, Tag, FileText, Check, AlertCircle, Calculator } from "lucide-react";
import { ProductCategory, Animal } from "@/types/animal";
import { updatePackCode, PackCodeItem } from "@/lib/pack-codes-store";
import {
  calculatePricing,
  calculatePackOriginalPrice,
  sanitizeDiscountPercent,
  formatVnd,
} from "@/lib/pricing";

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

  // Cấu hình giá và thẻ lẻ
  const [cardsCount, setCardsCount] = useState<number>(30);
  const [singleCardPrice, setSingleCardPrice] = useState<number>(10000);
  const [isManualPrice, setIsManualPrice] = useState<boolean>(false);
  const [originalPrice, setOriginalPrice] = useState<number>(300000);
  const [discountPercent, setDiscountPercent] = useState<number>(17);
  const [salePrice, setSalePrice] = useState<number>(249000);

  useEffect(() => {
    if (pack) {
      setCode(pack.code);
      setName(pack.name);
      setSelectedCategorySlug(pack.categorySlug || "hanh-dong");
      setDescription(pack.description || "");

      const matchedCount = productsList.filter(
        (p) => p.packCode && p.packCode.trim().toUpperCase() === pack.code.trim().toUpperCase()
      ).length;

      const initialCardsCount = pack.cardsCount || (matchedCount > 0 ? matchedCount : 30);
      const initialSinglePrice = pack.singleCardPrice || 10000;
      const initialIsManual = Boolean(pack.isManualPrice);

      const calculatedOrig = initialIsManual && pack.originalPrice
        ? pack.originalPrice
        : calculatePackOriginalPrice(initialSinglePrice, initialCardsCount);

      const initialSale = pack.salePrice || 249000;
      const initialPct = pack.discountPercent !== undefined
        ? pack.discountPercent
        : calculatedOrig > 0
        ? Math.max(0, Math.round(((calculatedOrig - initialSale) / calculatedOrig) * 100))
        : 17;

      setCardsCount(initialCardsCount);
      setSingleCardPrice(initialSinglePrice);
      setIsManualPrice(initialIsManual);
      setOriginalPrice(calculatedOrig);
      setDiscountPercent(initialPct);
      setSalePrice(initialSale);
    }
  }, [pack, productsList]);

  if (!isOpen || !pack) return null;

  const matchedCardsCount = productsList.filter(
    (p) => p.packCode && p.packCode.trim().toUpperCase() === pack.code.trim().toUpperCase()
  ).length;

  const isPriceInvalid = originalPrice > 0 && salePrice > originalPrice;

  // Xử lý khi thay đổi số thẻ hoặc đơn giá thẻ lẻ
  const handleCardUnitChange = (newSinglePrice: number, newCount: number) => {
    setSingleCardPrice(newSinglePrice);
    setCardsCount(newCount);

    if (!isManualPrice) {
      const newOrig = calculatePackOriginalPrice(newSinglePrice, newCount);
      const calculated = calculatePricing({
        originalPrice: newOrig,
        discountPercent,
        sourceField: "originalPrice",
      });
      setOriginalPrice(calculated.originalPrice);
      setSalePrice(calculated.salePrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isPriceInvalid) return;

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
        cardsCount,
        singleCardPrice,
        isManualPrice,
        originalPrice,
        discountPercent,
        salePrice,
      };

      // Gửi cập nhật lên API MongoDB
      await fetch("/api/pack-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      }).catch(() => {});

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
      <div className="bg-stone-900 border border-amber-400/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl shadow-amber-950/40 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                Cấu Hình Bộ Thẻ & Giá Bán Ưu Đãi
              </h3>
              <p className="text-[11px] text-stone-400">
                Mã hiện tại: <strong className="font-mono text-amber-300">{pack.code}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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

          {/* CẤU HÌNH GIÁ THEO THẺ LẺ */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                <Calculator className="h-4 w-4" />
                <span>Quy Tắc Tính Giá Bộ Từ Thẻ Lẻ</span>
              </span>

              {/* Toggle Tự tính vs Nhập tay */}
              <div className="flex items-center gap-2 bg-stone-950 px-2 py-1 rounded-lg border border-white/10">
                <span className={`text-[11px] font-bold ${!isManualPrice ? "text-amber-400" : "text-stone-400"}`}>
                  Tự tính theo thẻ lẻ
                </span>
                <input
                  type="checkbox"
                  checked={isManualPrice}
                  onChange={(e) => {
                    const manual = e.target.checked;
                    setIsManualPrice(manual);
                    if (!manual) {
                      const newOrig = calculatePackOriginalPrice(singleCardPrice, cardsCount);
                      const calculated = calculatePricing({
                        originalPrice: newOrig,
                        discountPercent,
                        sourceField: "originalPrice",
                      });
                      setOriginalPrice(calculated.originalPrice);
                      setSalePrice(calculated.salePrice);
                    }
                  }}
                  className="rounded text-amber-500 cursor-pointer"
                />
                <span className={`text-[11px] font-bold ${isManualPrice ? "text-amber-400" : "text-stone-400"}`}>
                  Nhập tay giá bộ
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Số lượng thẻ trong bộ:
                </label>
                <input
                  type="number"
                  min="1"
                  value={cardsCount}
                  onChange={(e) => handleCardUnitChange(singleCardPrice, Number(e.target.value) || 1)}
                  className="w-full bg-stone-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Đơn giá 1 thẻ lẻ (VNĐ):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={singleCardPrice}
                  onChange={(e) => handleCardUnitChange(Number(e.target.value) || 0, cardsCount)}
                  className="w-full bg-stone-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold font-mono focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            {/* BỘ 3 Ô TÍNH GIÁ ĐỒNG BỘ 2 CHIỀU */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 mb-1">
                    Giá Gốc Niêm Yết:
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!isManualPrice}
                    value={originalPrice || ""}
                    onChange={(e) => {
                      const newOrig = Number(e.target.value) || 0;
                      const calculated = calculatePricing({
                        originalPrice: newOrig,
                        discountPercent,
                        sourceField: "originalPrice",
                      });
                      setOriginalPrice(calculated.originalPrice);
                      setSalePrice(calculated.salePrice);
                    }}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-hidden ${
                      !isManualPrice
                        ? "bg-stone-900 border-white/10 text-stone-400 cursor-not-allowed"
                        : "bg-stone-950 border-white/20 text-white focus:border-amber-400"
                    }`}
                  />
                  {!isManualPrice && (
                    <span className="text-[9px] text-amber-400 font-medium">
                      = {cardsCount} x {formatVnd(singleCardPrice)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-400 mb-1">
                    % Khuyến Mãi (0 - 99%):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={discountPercent}
                    onChange={(e) => {
                      const newPct = sanitizeDiscountPercent(e.target.value);
                      setDiscountPercent(newPct);
                      const calculated = calculatePricing({
                        originalPrice,
                        discountPercent: newPct,
                        sourceField: "discountPercent",
                      });
                      setSalePrice(calculated.salePrice);
                    }}
                    className="w-full bg-stone-950 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-amber-400 font-bold font-mono focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-400 mb-1">
                    Giá Bán Ưu Đãi (VNĐ):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={salePrice || ""}
                    onChange={(e) => {
                      const newSale = Number(e.target.value) || 0;
                      setSalePrice(newSale);
                      const calculated = calculatePricing({
                        originalPrice,
                        salePrice: newSale,
                        sourceField: "salePrice",
                      });
                      setDiscountPercent(calculated.discountPercent);
                    }}
                    className={`w-full bg-stone-950 border rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono focus:outline-hidden ${
                      isPriceInvalid
                        ? "border-rose-500 text-rose-400 focus:border-rose-500"
                        : "border-white/20 text-emerald-400 focus:border-emerald-400"
                    }`}
                  />
                </div>
              </div>

              {isPriceInvalid && (
                <p className="text-[11px] text-rose-400 font-medium">
                  Cảnh báo: Giá bán ưu đãi ({formatVnd(salePrice)}) không được lớn hơn Giá gốc ({formatVnd(originalPrice)}).
                </p>
              )}
            </div>
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
              className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !code.trim() || isPriceInvalid}
              className={`py-2 px-4 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 ${
                isSubmitting || !code.trim() || isPriceInvalid
                  ? "bg-stone-700 text-stone-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 active:scale-95 cursor-pointer"
              }`}
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
