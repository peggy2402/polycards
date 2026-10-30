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
  Languages,
  Star,
  PackageCheck,
} from "lucide-react";
import { ProductCategory } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";
import { ProductFormData } from "../types";
import { ArResourcePanel } from "../widgets/ar-resource-panel";
import { getPackCodeForCategory, getStoredPackCodes } from "@/lib/pack-codes-store";

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
  const storedPackCodes = getStoredPackCodes();

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
                onChange={(e) => {
                  const newCatName = e.target.value;
                  const matchedCat = categoriesList.find((c) => c.name === newCatName);
                  const newPackCode = getPackCodeForCategory(matchedCat?.slug || newCatName);
                  onChangeForm({ category: newCatName, packCode: newPackCode });
                }}
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

            {/* 1.1 GẮN MÃ BỘ BẢN QUYỀN (PACK CODE - THAM SỐ &code=) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-black/60 border border-white/15 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <PackageCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Mã Bộ Bản Quyền (Tham số &code= trên QR)</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                  Tự động theo danh mục
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-stone-400 font-bold mb-1">
                    Chọn nhanh mã bộ có sẵn:
                  </label>
                  <select
                    value={productForm.packCode || ""}
                    onChange={(e) => onChangeForm({ packCode: e.target.value })}
                    className="w-full bg-stone-900 border border-white/20 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-hidden focus:border-amber-400 cursor-pointer"
                  >
                    <option value="" className="text-stone-400">
                      -- Để trống (Chưa gắn mã) --
                    </option>
                    {storedPackCodes.map((p) => (
                      <option key={p.code} value={p.code} className="text-white">
                        {p.code} ({p.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-stone-400 font-bold mb-1">
                    Hoặc nhập mã tùy chỉnh:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: POLY30-HOAQUA, POLY30-DONGVAT..."
                    value={productForm.packCode || ""}
                    onChange={(e) => onChangeForm({ packCode: e.target.value.toUpperCase().trim() })}
                    className="w-full bg-stone-900 border border-white/20 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-amber-300 placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[10px] text-stone-400">
                <span>Tham số nhúng vào QR:</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-400/30 text-amber-300 font-mono font-bold">
                  {productForm.packCode ? `&code=${productForm.packCode}` : "(Không có tham số code)"}
                </span>
              </div>
            </div>

            {/* 2. CHẾ ĐỘ SONG NGỮ (TOGGLE ANH - VIỆT & TRUNG - VIỆT) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-950/90 border border-white/15 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Cấu Hình Chế Độ Song Ngữ Hiển Thị Trên WebAR</span>
                </span>
                <span className="text-[10px] text-stone-400 font-semibold">
                  Bật 1 hoặc cả 2 chế độ
                </span>
              </div>

              {/* Toggle 1: Song Ngữ Anh - Việt */}
              <div
                className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                  productForm.enableEnVi
                    ? "bg-amber-500/10 border-amber-400/50"
                    : "bg-black/40 border-white/10 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <span>Song Ngữ Anh - Việt (EN - VI)</span>
                    </div>
                    <p className="text-[10px] text-stone-400">
                      Hiển thị nút phát âm Tiếng Anh & Tiếng Việt trên màn hình quét WebAR
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={productForm.enableEnVi}
                    onClick={() => {
                      const nextVal = !productForm.enableEnVi;
                      if (!nextVal && !productForm.enableZhVi) {
                        onShowToast("Phải bật ít nhất 1 chế độ song ngữ (Anh - Việt hoặc Trung - Việt)!", "warning");
                        return;
                      }
                      onChangeForm({ enableEnVi: nextVal });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      productForm.enableEnVi ? "bg-amber-400" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-stone-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                        productForm.enableEnVi ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {productForm.enableEnVi && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-amber-400/20 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-200 mb-1">
                        1. Từ vựng Tiếng Anh (EN) *:
                      </label>
                      <input
                        type="text"
                        required={productForm.enableEnVi}
                        placeholder="VD: Run, Lion..."
                        value={productForm.nameEn}
                        onChange={(e) => onChangeForm({ nameEn: e.target.value })}
                        className="w-full bg-black/80 border border-amber-400/40 rounded-xl px-2.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                        2. Từ Tiếng Việt (VI) *:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Chạy bộ, Sư tử..."
                        value={productForm.nameVi}
                        onChange={(e) => onChangeForm({ nameVi: e.target.value })}
                        className="w-full bg-black/80 border border-emerald-400/40 rounded-xl px-2.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-300 mb-1">
                        3. Phiên âm (IPA):
                      </label>
                      <input
                        type="text"
                        placeholder="VD: /rʌn/, /ˈlaɪ.ən/..."
                        value={productForm.ipa}
                        onChange={(e) => onChangeForm({ ipa: e.target.value })}
                        className="w-full bg-black/80 border border-white/20 rounded-xl px-2.5 py-2 text-xs font-mono text-amber-300 placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle 2: Song Ngữ Trung - Việt */}
              <div
                className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                  productForm.enableZhVi
                    ? "bg-rose-500/10 border-rose-400/50"
                    : "bg-black/40 border-white/10 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                      <span>Song Ngữ Trung - Việt (ZH - VI)</span>
                    </div>
                    <p className="text-[10px] text-stone-400">
                      Hiển thị nút phát âm Tiếng Trung & Tiếng Việt trên màn hình quét WebAR
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={productForm.enableZhVi}
                    onClick={() => {
                      const nextVal = !productForm.enableZhVi;
                      if (!nextVal && !productForm.enableEnVi) {
                        onShowToast("Phải bật ít nhất 1 chế độ song ngữ (Anh - Việt hoặc Trung - Việt)!", "warning");
                        return;
                      }
                      onChangeForm({ enableZhVi: nextVal });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      productForm.enableZhVi ? "bg-rose-400" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-stone-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                        productForm.enableZhVi ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {productForm.enableZhVi && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-rose-400/20 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10px] font-bold text-rose-300 mb-1">
                        1. Từ vựng Tiếng Trung (ZH) *:
                      </label>
                      <input
                        type="text"
                        required={productForm.enableZhVi}
                        placeholder="VD: 跑步, 狮子, 马..."
                        value={productForm.nameZh}
                        onChange={(e) => onChangeForm({ nameZh: e.target.value })}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text/plain");
                          if (pasted) {
                            e.preventDefault();
                            onChangeForm({ nameZh: pasted.trim() });
                          }
                        }}
                        style={{
                          fontFamily:
                            '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif',
                        }}
                        className="w-full bg-black/80 border border-rose-400/40 rounded-xl px-2.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-rose-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                        2. Từ Tiếng Việt (VI) *:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Chạy bộ, Sư tử..."
                        value={productForm.nameVi}
                        onChange={(e) => onChangeForm({ nameVi: e.target.value })}
                        className="w-full bg-black/80 border border-emerald-400/40 rounded-xl px-2.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-300 mb-1">
                        3. Phiên âm (Pinyin):
                      </label>
                      <input
                        type="text"
                        placeholder="VD: pǎo bù, shī zi, mǎ..."
                        value={productForm.pinyinZh}
                        onChange={(e) => onChangeForm({ pinyinZh: e.target.value })}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text/plain");
                          if (pasted) {
                            e.preventDefault();
                            onChangeForm({ pinyinZh: pasted.trim() });
                          }
                        }}
                        style={{
                          fontFamily:
                            '"Inter", "PingFang SC", "Arial", sans-serif',
                        }}
                        className="w-full bg-black/80 border border-white/20 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-300 placeholder-stone-500 focus:outline-hidden focus:border-rose-400"
                      />
                    </div>
                  </div>
                )}
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

            {/* 4. HUY HIỆU (BADGE) & SLUG AR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Huy hiệu nổi bật (Badge góc phải trên ảnh thẻ):
                </label>
                <input
                  type="text"
                  value={productForm.badge}
                  onChange={(e) => onChangeForm({ badge: e.target.value })}
                  placeholder="Nhập tùy ý (Để trống để ẩn Badge)..."
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  {["Mới ra mắt", "Bán chạy", "Hot", "Yêu thích nhất"].map((presetBadge) => (
                    <button
                      key={presetBadge}
                      type="button"
                      onClick={() => onChangeForm({ badge: presetBadge })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        productForm.badge === presetBadge
                          ? "bg-amber-400 text-stone-950 border-amber-300"
                          : "bg-white/5 text-stone-400 border-white/10 hover:text-white"
                      }`}
                    >
                      {presetBadge}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => onChangeForm({ badge: "" })}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      productForm.badge === ""
                        ? "bg-rose-500/20 text-rose-300 border-rose-400/40"
                        : "bg-white/5 text-stone-400 border-white/10 hover:text-rose-300"
                    }`}
                  >
                    Ẩn badge
                  </button>
                </div>
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

            {/* 5. TÙY CHỌN GHIM LÊN TRANG CHỦ #PRODUCTS & ẢNH THẺ CANVAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                className={`p-2.5 sm:p-3 rounded-xl border transition-colors space-y-1 ${
                  productForm.showOnHome
                    ? "bg-emerald-500/15 border-emerald-400/50"
                    : "bg-black/40 border-white/10"
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-black text-emerald-300">
                  <input
                    type="checkbox"
                    checked={productForm.showOnHome}
                    onChange={(e) => onChangeForm({ showOnHome: e.target.checked })}
                    className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-400 h-4 w-4"
                  />
                  <Star className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Ghim lên hàng 4 thẻ Trang Chủ (#products)</span>
                </label>
                <p className="text-[10px] text-stone-400 pl-6">
                  Hiển thị trực tiếp ở hàng 4 thẻ nhỏ nổi bật trên trang chủ.
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-200">
                  <input
                    type="checkbox"
                    checked={productForm.useCompositeCardImage}
                    onChange={(e) => onChangeForm({ useCompositeCardImage: e.target.checked })}
                    className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 h-4 w-4"
                  />
                  <span>Sử dụng ảnh thẻ thành phẩm từ Canvas</span>
                </label>
                <p className="text-[10px] text-stone-400 pl-6">
                  Nếu bỏ tích, hệ thống giữ nguyên ảnh mẫu gốc (chưa ghép QR).
                </p>
              </div>
            </div>

            {/* 6. CẤU HÌNH & TẢI LÊN TÀI NGUYÊN 3D / AR / ÂM THANH (DRY REUSABLE WIDGET) */}
            <ArResourcePanel
              slug={slug}
              modelUrl={productForm.modelUrl}
              iosModelUrl={productForm.iosModelUrl}
              targetUrl={productForm.targetUrl}
              audioUrl={productForm.audioUrl}
              audioEnUrl={productForm.audioEnUrl}
              audioViUrl={productForm.audioViUrl}
              audioZhUrl={productForm.audioZhUrl}
              enableEnVi={productForm.enableEnVi}
              enableZhVi={productForm.enableZhVi}
              onChangeModelUrl={(url) => onChangeForm({ modelUrl: url })}
              onChangeIosModelUrl={(url) => onChangeForm({ iosModelUrl: url })}
              onChangeTargetUrl={(url) => onChangeForm({ targetUrl: url })}
              onChangeAudioUrl={(url) => onChangeForm({ audioUrl: url })}
              onChangeAudioEnUrl={(url) => onChangeForm({ audioEnUrl: url })}
              onChangeAudioViUrl={(url) => onChangeForm({ audioViUrl: url })}
              onChangeAudioZhUrl={(url) => onChangeForm({ audioZhUrl: url })}
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

            {/* 7. THÔNG TIN NÂNG CAO (MÔ TẢ CHI TIẾT) */}
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/30">
              <button
                type="button"
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                className="w-full flex items-center justify-between p-3 bg-stone-800/40 hover:bg-stone-800/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Mô Tả Chi Tiết Thẻ Học (Tùy Chọn)</span>
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
