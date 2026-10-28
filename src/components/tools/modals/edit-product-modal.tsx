"use client";

import React from "react";
import {
  Edit3,
  X,
  RefreshCw,
  Check,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Tên Tiếng Việt <span className="text-rose-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={editProductForm.nameVi}
                onChange={(e) => onChangeForm({ nameVi: e.target.value })}
                className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Tên Tiếng Anh <span className="text-rose-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={editProductForm.nameEn}
                onChange={(e) => onChangeForm({ nameEn: e.target.value })}
                className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Tên Tiếng Trung (Kèm Pinyin):
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  placeholder="Chữ Hán: 跳"
                  value={editProductForm.nameZh}
                  onChange={(e) => onChangeForm({ nameZh: e.target.value })}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
                <input
                  type="text"
                  placeholder="Pinyin: tiào"
                  value={editProductForm.pinyinZh}
                  onChange={(e) => onChangeForm({ pinyinZh: e.target.value })}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Phiên Âm Quốc Tế (IPA):
              </label>
              <input
                type="text"
                placeholder="/dʒʌmp/"
                value={editProductForm.ipa}
                onChange={(e) => onChangeForm({ ipa: e.target.value })}
                className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-400"
              />
            </div>

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
                Huy Hiệu (Badge):
              </label>
              <input
                type="text"
                value={editProductForm.badge}
                onChange={(e) => onChangeForm({ badge: e.target.value })}
                placeholder="Mới ra mắt, Bán chạy..."
                className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
              />
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
            onChangeModelUrl={(url) => onChangeForm({ modelUrl: url })}
            onChangeIosModelUrl={(url) => onChangeForm({ iosModelUrl: url })}
            onChangeTargetUrl={(url) => onChangeForm({ targetUrl: url })}
            onChangeAudioUrl={(url) => onChangeForm({ audioUrl: url })}
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
