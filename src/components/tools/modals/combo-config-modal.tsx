"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Upload,
  Check,
  RefreshCw,
  Layers,
  Tag,
  Link2,
} from "lucide-react";
import { CardComboPack, DEFAULT_FEATURED_COMBO } from "@/data/combos";
import { formatVndCurrency } from "@/lib/formatters";

interface ComboConfigModalProps {
  isOpen: boolean;
  comboData: CardComboPack;
  isSaving: boolean;
  onClose: () => void;
  onSave: (updatedCombo: CardComboPack) => Promise<void>;
  onShowToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export function ComboConfigModal({
  isOpen,
  comboData,
  isSaving,
  onClose,
  onSave,
  onShowToast,
}: ComboConfigModalProps) {
  const [form, setForm] = useState<CardComboPack>(comboData || DEFAULT_FEATURED_COMBO);
  const [highlightsText, setHighlightsText] = useState<string>(
    (comboData?.highlights || DEFAULT_FEATURED_COMBO.highlights).join(", ")
  );
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && comboData) {
      setForm(comboData);
      setHighlightsText(
        Array.isArray(comboData.highlights) ? comboData.highlights.join(", ") : ""
      );
    }
  }, [isOpen, comboData]);

  if (!isOpen) return null;

  const handleUploadCoverImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onShowToast("Vui lòng chọn tệp ảnh hợp lệ (JPG, PNG, WEBP).", "warning");
      return;
    }
    try {
      setIsUploadingImage(true);
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("originalFileName", file.name);
      fd.append("type", "image");

      const res = await fetch("/api/tools/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (res.ok && json.success && json.url) {
        setForm((prev) => ({ ...prev, imageSrc: json.url }));
        onShowToast(`Đã tải ảnh bìa Combo "${file.name}" thành công!`, "success");
      } else {
        onShowToast(json.message || "Tải ảnh bìa Combo thất bại.", "error");
      }
    } catch {
      onShowToast("Lỗi kết nối khi tải ảnh bìa Combo.", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedHighlights = highlightsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const price = Number(form.price) || 0;
    const originalPrice = Number(form.originalPrice) || price;
    const discountPercent =
      originalPrice > price && originalPrice > 0
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    await onSave({
      ...form,
      price,
      originalPrice,
      discountPercent,
      cardsCount: Number(form.cardsCount) || 120,
      highlights: parsedHighlights.length > 0 ? parsedHighlights : DEFAULT_FEATURED_COMBO.highlights,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="max-w-2xl w-full max-h-[92dvh] bg-stone-900 border-2 border-amber-400/60 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden ring-1 ring-amber-400/20">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-stone-900/95 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300">
                Tùy Chỉnh Khối Combo Lớn Tại Trang Chủ (#products)
              </h3>
              <p className="text-[11px] text-stone-400">
                Chỉnh sửa tiêu đề, huy hiệu (Badge), giá bán, ảnh bìa và đường dẫn điều hướng của khối Combo dưới 4 thẻ nhỏ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 1. Tên Combo & Mã Bộ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Tiêu đề Khối Combo Lớn *:
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="VD: Combo Trọn Bộ VIP 4-in-1 (120 Thẻ AR)"
                className="w-full bg-black/75 border border-amber-400/40 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Mã Bộ (Pack Code) *:
              </label>
              <input
                type="text"
                required
                value={form.packCode}
                onChange={(e) => setForm((p) => ({ ...p, packCode: e.target.value.toUpperCase() }))}
                placeholder="POLY120-COMBOVIP"
                className="w-full bg-black/75 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          {/* 2. Hệ thống Badges (4 vị trí rõ ràng) */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/35 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider">
              <Tag className="h-3.5 w-3.5 text-amber-400" />
              <span>Hệ Thống Huy Hiệu (Badges) Hiển Thị Trên Khối Combo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-amber-200 mb-1">
                  1. Badge góc trên bên trái ảnh (Nhãn gói):
                </label>
                <input
                  type="text"
                  value={form.categoryName}
                  onChange={(e) => setForm((p) => ({ ...p, categoryName: e.target.value }))}
                  placeholder="VD: TRỌN BỘ VIP"
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                  2. Số lượng thẻ (Badge xanh cạnh nhãn gói):
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.cardsCount}
                  onChange={(e) => setForm((p) => ({ ...p, cardsCount: Number(e.target.value) }))}
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-2.5 py-2 text-xs font-mono text-emerald-300 focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-200 mb-1">
                  3. Badge nổi bật góc dưới phải ảnh (Để trống để ẩn):
                </label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                  placeholder="VD: Tiết Kiệm 397K • Hộp Quà VIP"
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-200 mb-1">
                  4. Huy hiệu phụ phía trên tiêu đề (Để trống để ẩn):
                </label>
                <input
                  type="text"
                  value={form.subBadge ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, subBadge: e.target.value }))}
                  placeholder="VD: Gói Combo Đại Gia Đình Toàn Diện Nhất"
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* 3. Giá bán & Giá gốc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-stone-300">
                  Giá ưu đãi Combo (VNĐ) *:
                </label>
                <span className="text-[10px] font-bold text-emerald-400">
                  {formatVndCurrency(form.price)}
                </span>
              </div>
              <input
                type="number"
                required
                step={1000}
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                className="w-full bg-black/75 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-stone-300">
                  Giá gốc niêm yết (VNĐ):
                </label>
                <span className="text-[10px] text-stone-400 line-through">
                  {formatVndCurrency(form.originalPrice)}
                </span>
              </div>
              <input
                type="number"
                step={1000}
                value={form.originalPrice}
                onChange={(e) => setForm((p) => ({ ...p, originalPrice: Number(e.target.value) }))}
                className="w-full bg-black/75 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-stone-300 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          {/* 4. Ảnh bìa & Upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-stone-300">
                Ảnh đại diện Khối Combo:
              </label>
              <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 hover:text-stone-950 bg-amber-500/20 hover:bg-amber-400 px-2.5 py-1 rounded-lg border border-amber-400/40 transition-colors cursor-pointer">
                <Upload className="h-3 w-3" />
                <span>{isUploadingImage ? "Đang tải ảnh..." : "Tải ảnh mới"}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadCoverImage(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <input
              type="text"
              value={form.imageSrc}
              onChange={(e) => setForm((p) => ({ ...p, imageSrc: e.target.value }))}
              placeholder="/images/cards/lion-cards.jpg"
              className="w-full bg-black/75 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* 5. Đường dẫn khi bấm vào Combo & Slug thử AR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-stone-300 mb-1 flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5 text-amber-400" />
                <span>Trang đích khi bấm vào thẻ/chữ Combo:</span>
              </label>
              <input
                type="text"
                value={form.targetUrl || "/products"}
                onChange={(e) => setForm((p) => ({ ...p, targetUrl: e.target.value }))}
                placeholder="/products"
                className="w-full bg-black/75 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-300 mb-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Slug thẻ mẫu khi bấm nút "Thử AR 3D":</span>
              </label>
              <input
                type="text"
                value={form.sampleSlug}
                onChange={(e) => setForm((p) => ({ ...p, sampleSlug: e.target.value.trim().toLowerCase() }))}
                placeholder="lion, jump, run..."
                className="w-full bg-black/75 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-hidden focus:border-emerald-400"
              />
            </div>
          </div>

          {/* 6. Mô tả & Ưu điểm nổi bật */}
          <div>
            <label className="block text-[11px] font-bold text-stone-300 mb-1">
              Mô tả chi tiết gói Combo:
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full bg-black/75 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-300 mb-1">
              Các điểm nổi bật (phân cách bằng dấu phẩy `,`):
            </label>
            <input
              type="text"
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              placeholder="Trọn bộ 120 Thẻ AR, Hộp quà cứng cao cấp, Bảo hành bản quyền trọn đời"
              className="w-full bg-black/75 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Lưu Khối Combo Trang Chủ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

