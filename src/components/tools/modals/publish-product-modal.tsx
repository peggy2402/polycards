"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  X,
  Tag,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { ProductCategory } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";
import { ProductFormData } from "../types";
import { ArResourcePanel } from "../widgets/ar-resource-panel";

interface PublishProductModalProps {
  isOpen: boolean;
  slug: string;
  productForm: ProductFormData;
  categoriesList: ProductCategory[];
  isPublishing: boolean;
  onClose: () => void;
  onChangeSlug: (slug: string) => void;
  onChangeForm: (data: Partial<ProductFormData>) => void;
  onOpenCategoryModal: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onShowToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export function PublishProductModal({
  isOpen,
  slug,
  productForm,
  categoriesList,
  isPublishing,
  onClose,
  onChangeSlug,
  onChangeForm,
  onOpenCategoryModal,
  onSubmit,
  onShowToast,
}: PublishProductModalProps) {
  const [showAdvancedFields, setShowAdvancedFields] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="max-w-xl w-full max-h-[92dvh] sm:max-h-[86vh] bg-stone-900 border-2 border-amber-400/60 rounded-2xl sm:rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden ring-1 ring-amber-400/20">
        {/* STICKY HEADER */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 shrink-0 bg-stone-900/95 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shrink-0">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm md:text-base font-black text-amber-300 truncate">
                Cập Nhật Thẻ Vào #products Trang Chủ
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">
                Bắt buộc chọn danh mục để thẻ bài hiển thị đúng vị trí
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors shrink-0 ml-2"
            title="Đóng modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* FORM CONTAINER WITH FLEX LAYOUT */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin scrollbar-thumb-stone-700">
            {/* 1. BẮT BUỘC CHỌN DANH MỤC */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Danh Mục Sản Phẩm (Bắt buộc) *</span>
                </label>

                <button
                  type="button"
                  onClick={onOpenCategoryModal}
                  className="text-[10px] sm:text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 transition-colors shrink-0 cursor-pointer"
                >
                  <Sliders className="h-3 w-3" />
                  <span>Quản Lý Danh Mục</span>
                </button>
              </div>

              <select
                required
                value={productForm.category}
                onChange={(e) => onChangeForm({ category: e.target.value })}
                className="w-full bg-black/80 border border-amber-400/60 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-amber-300 focus:outline-hidden focus:border-amber-300 cursor-pointer"
              >
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.name} className="bg-stone-900 text-white">
                    Danh mục: {cat.name} ({cat.slug})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-stone-400">
                Thẻ bài sẽ được xuất bản đồng thời lên Trang chủ <code className="text-amber-300">#products</code> và Kho Thẻ Bài <code className="text-amber-300">/products</code>.
              </p>
            </div>

            {/* 2. THÔNG TIN CỐT LÕI (EN & VI) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Tên tiếng Anh (EN) *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lion, Cat, Jump..."
                  value={productForm.nameEn}
                  onChange={(e) => onChangeForm({ nameEn: e.target.value })}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Tên tiếng Việt (VI) *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sư Tử Vàng, Con Mèo..."
                  value={productForm.nameVi}
                  onChange={(e) => onChangeForm({ nameVi: e.target.value })}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 font-bold"
                />
              </div>
            </div>

            {/* 3. GIÁ TIỀN ƯU ĐÃI & GIÁ GỐC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-stone-300">
                    Giá bán ưu đãi (VNĐ) *:
                  </label>
                  <span className="text-[10px] font-bold text-emerald-400">
                    {formatVndCurrency(productForm.price)}
                  </span>
                </div>
                <input
                  type="number"
                  required
                  step="1000"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => onChangeForm({ price: Number(e.target.value) })}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-stone-300">
                    Giá gốc niêm yết:
                  </label>
                  <span className="text-[10px] text-stone-400 line-through">
                    {formatVndCurrency(productForm.originalPrice)}
                  </span>
                </div>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={productForm.originalPrice}
                  onChange={(e) => onChangeForm({ originalPrice: Number(e.target.value) })}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-stone-300 line-through focus:outline-hidden focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {/* 4. HUY HIỆU & SLUG AR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Huy hiệu nổi bật (Badge):
                </label>
                <select
                  value={productForm.badge}
                  onChange={(e) => onChangeForm({ badge: e.target.value })}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400 cursor-pointer"
                >
                  <option value="Mới ra mắt">Mới ra mắt</option>
                  <option value="Bán chạy">Bán chạy</option>
                  <option value="Yêu thích nhất">Yêu thích nhất</option>
                  <option value="Hot">Hot</option>
                  <option value="Thân thiện">Thân thiện</option>
                  <option value="Combo tiết kiệm">Combo tiết kiệm</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Slug AR (Trang mở 3D):
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => onChangeSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            {/* 5. TÙY CHỌN ẢNH THẺ TỪ CANVAS */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-200">
                <input
                  type="checkbox"
                  checked={productForm.useCompositeCardImage}
                  onChange={(e) => onChangeForm({ useCompositeCardImage: e.target.checked })}
                  className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <span>Sử dụng ảnh thẻ thành phẩm từ Canvas (Đã gắn QR chuẩn in)</span>
              </label>
              <p className="text-[10px] text-stone-400 pl-6">
                Nếu bỏ tích, hệ thống sẽ sử dụng ảnh thẻ mẫu gốc (chưa ghép QR).
              </p>
            </div>

            {/* 6. CẤU HÌNH & TẢI LÊN TÀI NGUYÊN 3D / AR / ÂM THANH (DRY REUSABLE WIDGET) */}
            <ArResourcePanel
              slug={slug}
              modelUrl={productForm.modelUrl}
              iosModelUrl={productForm.iosModelUrl}
              targetUrl={productForm.targetUrl}
              audioUrl={productForm.audioUrl}
              onChangeModelUrl={(url) => onChangeForm({ modelUrl: url })}
              onChangeIosModelUrl={(url) => onChangeForm({ iosModelUrl: url })}
              onChangeTargetUrl={(url) => onChangeForm({ targetUrl: url })}
              onChangeAudioUrl={(url) => onChangeForm({ audioUrl: url })}
              onSelectPreset={(preset) => {
                onChangeForm({
                  modelPresetId: preset.id,
                  modelUrl: preset.modelUrl,
                  iosModelUrl: preset.iosModelUrl,
                  targetUrl: preset.targetUrl,
                });
              }}
              onShowToast={onShowToast}
            />

            {/* 7. THÔNG TIN NÂNG CAO (ACCORDION THU GỌN / MỞ RỘNG) */}
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/30">
              <button
                type="button"
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                className="w-full flex items-center justify-between p-3 bg-stone-800/40 hover:bg-stone-800/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Thông Tin Nâng Cao (Tiếng Trung, IPA & Mô Tả)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-stone-400 font-medium">
                  <span>{showAdvancedFields ? "Thu gọn" : "Mở rộng"}</span>
                  {showAdvancedFields ? (
                    <ChevronUp className="h-3.5 w-3.5 text-stone-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                  )}
                </div>
              </button>

              {showAdvancedFields && (
                <div className="p-3 border-t border-white/10 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-300 mb-1">
                        Tên tiếng Trung (ZH) - Tùy chọn:
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 狮子, 小猫, 跳..."
                        value={productForm.nameZh}
                        onChange={(e) => onChangeForm({ nameZh: e.target.value })}
                        className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-300 mb-1">
                        Phiên âm IPA - Tùy chọn:
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: /ˈlaɪ.ən/, /kæt/..."
                        value={productForm.ipa}
                        onChange={(e) => onChangeForm({ ipa: e.target.value })}
                        className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Mô tả chi tiết thẻ học:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả công dụng hoặc kiến thức trên thẻ..."
                      value={productForm.description}
                      onChange={(e) => onChangeForm({ description: e.target.value })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-400 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STICKY FOOTER ACTION BUTTONS */}
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-white/10 shrink-0 bg-stone-900/95 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 sm:h-11 px-4 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isPublishing}
              className="h-10 sm:h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm active:scale-95 transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
            >
              <Check className="h-4 w-4 text-stone-950 shrink-0" />
              <span>
                {isPublishing ? "Đang Xuất Bản..." : "Xác Nhận Xuất Bản Thẻ Bài"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
