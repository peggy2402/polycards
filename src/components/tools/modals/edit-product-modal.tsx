"use client";

import React from "react";
import {
  Edit3,
  X,
  RefreshCw,
  Check,
  Languages,
  Star,
  PackageCheck,
} from "lucide-react";
import { Animal, ProductCategory } from "@/types/animal";
import { EditProductFormData } from "../types";
import { ArResourcePanel } from "../widgets/ar-resource-panel";

interface EditProductModalProps {
  isOpen: boolean;
  editingProduct: Animal | null;
  editProductForm: EditProductFormData;
  categoriesList: ProductCategory[];
  isSaving: boolean;
  onClose: () => void;
  onChangeForm: (data: Partial<EditProductFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onShowToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export function EditProductModal({
  isOpen,
  editingProduct,
  editProductForm,
  categoriesList,
  isSaving,
  onClose,
  onChangeForm,
  onSubmit,
  onShowToast,
}: EditProductModalProps) {
  if (!isOpen || !editingProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="max-w-xl w-full max-h-[92dvh] bg-stone-900 border-2 border-amber-400/60 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-stone-900/95 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300">
                Chỉnh Sửa Thông Tin Thẻ Bài
              </h3>
              <p className="text-[11px] text-stone-400">
                Cập nhật chi tiết thẻ: {editingProduct.nameVi} ({editingProduct.slug})
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

        {/* Form Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* CHẾ ĐỘ SONG NGỮ (TOGGLE ANH - VIỆT & TRUNG - VIỆT) */}
          <div className="p-3.5 rounded-2xl bg-stone-950/90 border border-white/15 space-y-3">
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
                editProductForm.enableEnVi
                  ? "bg-amber-500/10 border-amber-400/50"
                  : "bg-black/40 border-white/10 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-black text-amber-300">
                    Song Ngữ Anh - Việt (EN - VI)
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Hiển thị nút phát âm Tiếng Anh & Tiếng Việt trên WebAR
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={editProductForm.enableEnVi}
                  onClick={() => {
                    const nextVal = !editProductForm.enableEnVi;
                    if (!nextVal && !editProductForm.enableZhVi) {
                      onShowToast("Phải bật ít nhất 1 chế độ song ngữ (Anh - Việt hoặc Trung - Việt)!", "warning");
                      return;
                    }
                    onChangeForm({ enableEnVi: nextVal });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    editProductForm.enableEnVi ? "bg-amber-400" : "bg-stone-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-stone-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                      editProductForm.enableEnVi ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {editProductForm.enableEnVi && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-amber-400/20 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-200 mb-1">
                      1. Từ vựng Tiếng Anh (EN) *:
                    </label>
                    <input
                      type="text"
                      required={editProductForm.enableEnVi}
                      placeholder="VD: Run, Lion..."
                      value={editProductForm.nameEn}
                      onChange={(e) => onChangeForm({ nameEn: e.target.value })}
                      className="w-full bg-black/80 border border-amber-400/40 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400 font-bold"
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
                      value={editProductForm.nameVi}
                      onChange={(e) => onChangeForm({ nameVi: e.target.value })}
                      className="w-full bg-black/80 border border-emerald-400/40 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-300 mb-1">
                      3. Phiên âm (IPA):
                    </label>
                    <input
                      type="text"
                      placeholder="/rʌn/"
                      value={editProductForm.ipa}
                      onChange={(e) => onChangeForm({ ipa: e.target.value })}
                      className="w-full bg-black/80 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-mono focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Toggle 2: Song Ngữ Trung - Việt */}
            <div
              className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                editProductForm.enableZhVi
                  ? "bg-rose-500/10 border-rose-400/50"
                  : "bg-black/40 border-white/10 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-black text-rose-300">
                    Song Ngữ Trung - Việt (ZH - VI)
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Hiển thị nút phát âm Tiếng Trung & Tiếng Việt trên WebAR
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={editProductForm.enableZhVi}
                  onClick={() => {
                    const nextVal = !editProductForm.enableZhVi;
                    if (!nextVal && !editProductForm.enableEnVi) {
                      onShowToast("Phải bật ít nhất 1 chế độ song ngữ (Anh - Việt hoặc Trung - Việt)!", "warning");
                      return;
                    }
                    onChangeForm({ enableZhVi: nextVal });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    editProductForm.enableZhVi ? "bg-rose-400" : "bg-stone-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-stone-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                      editProductForm.enableZhVi ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {editProductForm.enableZhVi && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-rose-400/20 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[10px] font-bold text-rose-300 mb-1">
                      1. Từ vựng Tiếng Trung (ZH) *:
                    </label>
                    <input
                      type="text"
                      required={editProductForm.enableZhVi}
                      placeholder="Chữ Hán: 跑步"
                      value={editProductForm.nameZh}
                      onChange={(e) => onChangeForm({ nameZh: e.target.value })}
                      className="w-full bg-black/80 border border-rose-400/40 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-rose-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                      2. Từ Tiếng Việt (VI) *:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Chạy bộ..."
                      value={editProductForm.nameVi}
                      onChange={(e) => onChangeForm({ nameVi: e.target.value })}
                      className="w-full bg-black/80 border border-emerald-400/40 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-300 mb-1">
                      3. Phiên âm (Pinyin):
                    </label>
                    <input
                      type="text"
                      placeholder="Pinyin: pǎo bù"
                      value={editProductForm.pinyinZh}
                      onChange={(e) => onChangeForm({ pinyinZh: e.target.value })}
                      className="w-full bg-black/80 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-rose-300 font-mono focus:outline-hidden focus:border-rose-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Danh Mục Sản Phẩm <span className="text-rose-400">*</span>:
              </label>
              <select
                value={editProductForm.category}
                onChange={(e) => onChangeForm({ category: e.target.value })}
                className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
              >
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.name} className="bg-stone-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Huy Hiệu Nổi Bật (Badge góc phải trên ảnh thẻ):
              </label>
              <input
                type="text"
                value={editProductForm.badge}
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
                      editProductForm.badge === presetBadge
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
                    editProductForm.badge === ""
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
                Giá Bán Ưu Đãi (VNĐ):
              </label>
              <input
                type="number"
                value={editProductForm.price}
                onChange={(e) => onChangeForm({ price: Number(e.target.value) })}
                className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold font-mono focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Giá Gốc Niêm Yết (VNĐ):
              </label>
              <input
                type="number"
                value={editProductForm.originalPrice}
                onChange={(e) => onChangeForm({ originalPrice: Number(e.target.value) })}
                className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-stone-400 font-mono focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          {/* MÃ BỘ BẢN QUYỀN (PACK CODE - &code=) */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-500/10 border border-purple-400/40 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <PackageCheck className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span>Mã Bộ Bản Quyền (Pack Code - Tham số &code=)</span>
              </label>
              <span className="text-[10px] text-stone-400">Tùy chọn</span>
            </div>
            <input
              type="text"
              placeholder="VD: POLY30-HANHDONG, POLY30-DONGVAT... (Để trống nếu Chưa có)"
              value={editProductForm.packCode || ""}
              onChange={(e) => onChangeForm({ packCode: e.target.value.toUpperCase() })}
              className="w-full bg-black/80 border border-purple-400/50 rounded-xl px-3 py-2 text-xs font-mono font-bold text-purple-300 placeholder-stone-500 focus:outline-hidden focus:border-purple-300"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-stone-400">Gợi ý nhanh:</span>
              {[
                { label: "Động Vật", code: "POLY30-DONGVAT" },
                { label: "Hành Động", code: "POLY30-HANHDONG" },
                { label: "Xe Cộ", code: "POLY30-XECO" },
                { label: "Hoa Quả", code: "POLY30-HOAQUA" },
                { label: "Combo VIP", code: "POLY120-COMBOVIP" },
              ].map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => onChangeForm({ packCode: preset.code })}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono transition-colors cursor-pointer ${
                    editProductForm.packCode === preset.code
                      ? "bg-purple-500 text-white border-purple-400 shadow-sm"
                      : "bg-white/5 text-purple-300 border-purple-400/20 hover:bg-purple-500/20"
                  }`}
                >
                  {preset.code}
                </button>
              ))}
              {editProductForm.packCode && (
                <button
                  type="button"
                  onClick={() => onChangeForm({ packCode: "" })}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  Xóa (Chưa có)
                </button>
              )}
            </div>
          </div>

          {/* TÙY CHỌN GHIM THẺ LÊN HÀNG 4 THẺ TRANG CHỦ (#PRODUCTS) */}
          <div
            className={`p-3 rounded-xl border transition-colors space-y-1 ${
              editProductForm.showOnHome
                ? "bg-emerald-500/15 border-emerald-400/50"
                : "bg-black/40 border-white/10"
            }`}
          >
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-black text-emerald-300">
              <input
                type="checkbox"
                checked={editProductForm.showOnHome}
                onChange={(e) => onChangeForm({ showOnHome: e.target.checked })}
                className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-400 h-4 w-4"
              />
              <Star className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Ghim thẻ này lên hàng 4 thẻ nổi bật tại Trang Chủ (#products)</span>
            </label>
            <p className="text-[10px] text-stone-400 pl-6">
              Bật để đưa thẻ lên hàng 4 thẻ nhỏ nổi bật phía trên Khối Combo Lớn tại trang chủ.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-300 mb-1">
              Đường Dẫn Ảnh Thẻ (Poster URL):
            </label>
            <input
              type="text"
              value={editProductForm.imageUrl}
              onChange={(e) => onChangeForm({ imageUrl: e.target.value })}
              placeholder="/images/cards/... hoặc URL ảnh tĩnh"
              className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* KHỐI NÂNG CẤP: CẤU HÌNH & TẢI LÊN TÀI NGUYÊN 3D / AR / ÂM THANH (DRY REUSABLE WIDGET) */}
          <ArResourcePanel
            slug={editingProduct.slug}
            modelUrl={editProductForm.modelUrl}
            iosModelUrl={editProductForm.iosModelUrl}
            targetUrl={editProductForm.targetUrl}
            audioUrl={editProductForm.audioUrl}
            audioEnUrl={editProductForm.audioEnUrl}
            audioViUrl={editProductForm.audioViUrl}
            audioZhUrl={editProductForm.audioZhUrl}
            enableEnVi={editProductForm.enableEnVi}
            enableZhVi={editProductForm.enableZhVi}
            onChangeModelUrl={(url) => onChangeForm({ modelUrl: url })}
            onChangeIosModelUrl={(url) => onChangeForm({ iosModelUrl: url })}
            onChangeTargetUrl={(url) => onChangeForm({ targetUrl: url })}
            onChangeAudioUrl={(url) => onChangeForm({ audioUrl: url })}
            onChangeAudioEnUrl={(url) => onChangeForm({ audioEnUrl: url })}
            onChangeAudioViUrl={(url) => onChangeForm({ audioViUrl: url })}
            onChangeAudioZhUrl={(url) => onChangeForm({ audioZhUrl: url })}
            onSelectPreset={(preset) => {
              onChangeForm({
                modelUrl: preset.modelUrl,
                iosModelUrl: preset.iosModelUrl,
                targetUrl: preset.targetUrl,
              });
            }}
            onShowToast={onShowToast}
          />

          <div>
            <label className="block text-[11px] font-bold text-stone-300 mb-1">
              Mô Tả Sản Phẩm:
            </label>
            <textarea
              rows={3}
              value={editProductForm.description}
              onChange={(e) => onChangeForm({ description: e.target.value })}
              placeholder="Mô tả nội dung thẻ học..."
              className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400 resize-none"
            />
          </div>

          {/* Footer Buttons */}
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
                  <span>Lưu Thay Đổi Thẻ Bài</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
