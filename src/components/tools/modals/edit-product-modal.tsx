"use client";

import React, { useState, useRef } from "react";
import {
  Edit3,
  X,
  RefreshCw,
  Check,
  Languages,
  Star,
  PackageCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Animal, ProductCategory } from "@/types/animal";
import { EditProductFormData } from "../types";
import { ArResourcePanel } from "../widgets/ar-resource-panel";
import { BilingualConfigSection } from "../widgets/bilingual-config-section";
import {
  getPackCodeForCategory,
  getStoredPackCodes,
  fetchPackCodesFromApi,
  PackCodeItem,
  PACK_CODES_UPDATED_EVENT,
} from "@/lib/pack-codes-store";

import { calculatePricing, sanitizeDiscountPercent } from "@/lib/pricing";

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
  const [isAssetUploading, setIsAssetUploading] = useState<boolean>(false);
  const [showModalAbortConfirm, setShowModalAbortConfirm] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const abortUploadRef = useRef<(() => void) | null>(null);

  const [packCodes, setPackCodes] = useState<PackCodeItem[]>(() => getStoredPackCodes());

  React.useEffect(() => {
    if (isOpen) {
      setPackCodes(getStoredPackCodes());
      fetchPackCodesFromApi().then((data) => {
        if (data && data.length > 0) {
          setPackCodes(data);
        }
      });
    }

    const handleUpdate = (e: CustomEvent<PackCodeItem[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPackCodes(e.detail);
      }
    };

    window.addEventListener(PACK_CODES_UPDATED_EVENT, handleUpdate as EventListener);
    return () => {
      window.removeEventListener(PACK_CODES_UPDATED_EVENT, handleUpdate as EventListener);
    };
  }, [isOpen]);

  if (!isOpen || !editingProduct) return null;

  const handleAutoTranslate = async (text: string, sourceLang: "vi" | "en" | "zh") => {
    if (!text || !text.trim()) {
      onShowToast("Vui lòng nhập từ khóa trước khi tự động sinh dữ liệu.", "warning");
      return;
    }
    setIsTranslating(true);
    try {
      const res = await fetch("/api/tools/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), sourceLang }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updates: Partial<EditProductFormData> = {};
        if (data.nameVi) updates.nameVi = data.nameVi;
        if (data.nameEn) updates.nameEn = data.nameEn;
        if (data.ipa) updates.ipa = data.ipa;
        if (data.nameZh) updates.nameZh = data.nameZh;
        if (data.pinyinZh) updates.pinyinZh = data.pinyinZh;
        onChangeForm(updates);
        onShowToast("Đã tự động dịch & sinh phiên âm IPA / Pinyin thành công!", "success");
      } else {
        onShowToast(data.message || "Không thể tự động dịch, bạn hãy điền thủ công.", "warning");
      }
    } catch (err) {
      console.warn("Lỗi dịch tự động:", err);
      onShowToast("Không thể kết nối API dịch tự động.", "warning");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleModalClose = () => {
    if (isAssetUploading) {
      setShowModalAbortConfirm(true);
    } else {
      onClose();
    }
  };

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
            onClick={handleModalClose}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
            title={isAssetUploading ? "Đang tải tệp lên..." : "Đóng"}
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

            {/* Khối cấu hình Song Ngữ Anh-Việt & Trung-Việt (Tách Component chuẩn Clean Architecture & DRY) */}
            <BilingualConfigSection
              data={{
                enableEnVi: editProductForm.enableEnVi,
                nameEn: editProductForm.nameEn,
                nameVi: editProductForm.nameVi,
                ipa: editProductForm.ipa,
                enableZhVi: editProductForm.enableZhVi,
                nameZh: editProductForm.nameZh,
                pinyinZh: editProductForm.pinyinZh,
              }}
              onChange={(updates) => {
                if (updates.enableEnVi !== undefined && !updates.enableEnVi && !editProductForm.enableZhVi) {
                  onShowToast("Phải bật ít nhất 1 chế độ song ngữ (Anh - Việt hoặc Trung - Việt)!", "warning");
                  return;
                }
                if (updates.enableZhVi !== undefined && !updates.enableZhVi && !editProductForm.enableEnVi) {
                  onShowToast("Phải bật ít nhất 1 chế độ song ngữ (Anh - Việt hoặc Trung - Việt)!", "warning");
                  return;
                }
                onChangeForm(updates);
              }}
              onAutoTranslate={handleAutoTranslate}
              isTranslating={isTranslating}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Danh Mục Sản Phẩm <span className="text-rose-400">*</span>:
              </label>
              <select
                value={editProductForm.category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  const newPack = getPackCodeForCategory(newCat);
                  onChangeForm({ category: newCat, packCode: newPack });
                }}
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

            {/* BỘ 3 Ô TÍNH GIÁ ĐỒNG BỘ 2 CHIỀU */}
            <div className="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                  Bảng Tính Giá & Khuyến Mãi (Tự Động 2 Chiều)
                </span>
                {editProductForm.originalPrice > 0 && editProductForm.price > editProductForm.originalPrice && (
                  <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30">
                    Lỗi: Giá bán vượt quá Giá gốc!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Giá Gốc Niêm Yết (VNĐ):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editProductForm.originalPrice || ""}
                    onChange={(e) => {
                      const newOrig = Number(e.target.value) || 0;
                      const currentPct = editProductForm.originalPrice > 0
                        ? Math.max(0, Math.round(((editProductForm.originalPrice - editProductForm.price) / editProductForm.originalPrice) * 100))
                        : 0;
                      const calculated = calculatePricing({
                        originalPrice: newOrig,
                        discountPercent: currentPct,
                        sourceField: "originalPrice",
                      });
                      onChangeForm({
                        originalPrice: calculated.originalPrice,
                        price: calculated.salePrice,
                      });
                    }}
                    placeholder="VD: 300000"
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-stone-300 font-mono focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    % Khuyến Mãi (0 - 99%):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={
                      (() => {
                        const pct = editProductForm.originalPrice > 0
                          ? Math.max(0, Math.round(((editProductForm.originalPrice - editProductForm.price) / editProductForm.originalPrice) * 100))
                          : 0;
                        return pct === 0 ? "" : pct;
                      })()
                    }
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, "");
                      const newPct = raw === "" ? 0 : sanitizeDiscountPercent(raw);
                      const calculated = calculatePricing({
                        originalPrice: editProductForm.originalPrice || editProductForm.price,
                        discountPercent: newPct,
                        sourceField: "discountPercent",
                      });
                      onChangeForm({
                        originalPrice: calculated.originalPrice,
                        price: calculated.salePrice,
                      });
                    }}
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold font-mono focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Giá Bán Ưu Đãi (VNĐ):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editProductForm.price || ""}
                    onChange={(e) => {
                      const newSale = Number(e.target.value) || 0;
                      const calculated = calculatePricing({
                        originalPrice: editProductForm.originalPrice,
                        salePrice: newSale,
                        sourceField: "salePrice",
                      });
                      onChangeForm({
                        price: newSale,
                      });
                    }}
                    placeholder="VD: 249000"
                    className={`w-full bg-black/70 border rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-hidden ${
                      editProductForm.originalPrice > 0 && editProductForm.price > editProductForm.originalPrice
                        ? "border-rose-500 text-rose-400 focus:border-rose-500"
                        : "border-white/20 text-emerald-400 focus:border-emerald-400"
                    }`}
                  />
                </div>
              </div>

              {editProductForm.originalPrice > 0 && editProductForm.price > editProductForm.originalPrice && (
                <p className="text-[11px] text-rose-400 font-medium">
                  Cảnh báo: Giá bán ưu đãi ({editProductForm.price.toLocaleString("vi-VN")} ₫) không được lớn hơn Giá gốc ({editProductForm.originalPrice.toLocaleString("vi-VN")} ₫). Vui lòng điều chỉnh lại trước khi lưu.
                </p>
              )}
            </div>
          </div>

          {/* MÃ BỘ BẢN QUYỀN (PACK CODE - &code=) */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-500/10 border border-purple-400/40 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <PackageCheck className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span>Mã Bộ Bản Quyền (Pack Code - Tham số &code=)</span>
              </label>
              <span className="text-[10px] text-stone-400">Đồng bộ từ Database</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-stone-400 font-bold mb-1">
                  Chọn mã bộ từ Database:
                </label>
                <select
                  value={editProductForm.packCode || ""}
                  onChange={(e) => onChangeForm({ packCode: e.target.value })}
                  className="w-full bg-stone-900 border border-purple-400/40 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-purple-300 focus:outline-hidden focus:border-purple-400 cursor-pointer"
                >
                  <option value="" className="text-stone-400">
                    -- Để trống (Chưa gắn mã) --
                  </option>
                  {packCodes.map((p) => (
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
                  placeholder="VD: POLY30-XECO-ZHVI..."
                  value={editProductForm.packCode || ""}
                  onChange={(e) => onChangeForm({ packCode: e.target.value.toUpperCase().trim() })}
                  className="w-full bg-stone-900 border border-purple-400/40 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-purple-300 placeholder-stone-500 focus:outline-hidden focus:border-purple-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5 text-[10px] text-stone-400">
              <span>Tham số nhúng vào QR:</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-400/30 text-purple-300 font-mono font-bold">
                {editProductForm.packCode ? `&code=${editProductForm.packCode}` : "(Không có tham số code)"}
              </span>
              {editProductForm.packCode && (
                <button
                  type="button"
                  onClick={() => onChangeForm({ packCode: "" })}
                  className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  Xóa mã
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
            audioUrlEn={editProductForm.audioUrlEn}
            audioUrlZh={editProductForm.audioUrlZh}
            audioEnUrl={editProductForm.audioEnUrl}
            audioViUrl={editProductForm.audioViUrl}
            audioZhUrl={editProductForm.audioZhUrl}
            enableEnVi={editProductForm.enableEnVi}
            enableZhVi={editProductForm.enableZhVi}
            onChangeModelUrl={(url) => onChangeForm({ modelUrl: url })}
            onChangeIosModelUrl={(url) => onChangeForm({ iosModelUrl: url })}
            onChangeTargetUrl={(url) => onChangeForm({ targetUrl: url })}
            onChangeAudioUrl={(url) => onChangeForm({ audioUrl: url })}
            onChangeAudioUrlEn={(url) => onChangeForm({ audioUrlEn: url })}
            onChangeAudioUrlZh={(url) => onChangeForm({ audioUrlZh: url })}
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
            onUploadingChange={(uploading, cancelFn) => {
              setIsAssetUploading(uploading);
              if (cancelFn) abortUploadRef.current = cancelFn;
            }}
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
              onClick={handleModalClose}
              disabled={isAssetUploading}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-colors ${
                isAssetUploading
                  ? "bg-white/5 text-stone-500 cursor-not-allowed opacity-50"
                  : "bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white cursor-pointer"
              }`}
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isSaving || isAssetUploading || (editProductForm.originalPrice > 0 && editProductForm.price > editProductForm.originalPrice)}
              className={`py-2.5 px-5 rounded-xl font-black text-xs shadow-lg flex items-center gap-1.5 transition-all ${
                isSaving || isAssetUploading || (editProductForm.originalPrice > 0 && editProductForm.price > editProductForm.originalPrice)
                  ? "bg-amber-400/50 text-stone-900 cursor-not-allowed opacity-60 shadow-none"
                  : "bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-amber-500/20 active:scale-95 cursor-pointer"
              }`}
            >
              {isAssetUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-stone-950" />
                  <span>Đang Tải Tệp Lên...</span>
                </>
              ) : isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-stone-950" />
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

        {/* Modal Xác Nhận Hủy Khi Người Dùng Bấm Nút Đóng Modal Trong Khi Đang Tải Lên */}
        {showModalAbortConfirm && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in">
            <div className="max-w-sm w-full bg-stone-900 border-2 border-rose-500/80 rounded-2xl p-4 text-white shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h4 className="text-sm font-black text-white">Xác Nhận Hủy Tiến Trình?</h4>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Tệp tài nguyên đang được truyền tải lên Cloudflare R2 CDN. Bạn có chắc chắn muốn hủy tải lên và đóng cửa sổ này không?
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModalAbortConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-stone-300 hover:text-white transition-colors cursor-pointer"
                >
                  Tiếp Tục Tải
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (abortUploadRef.current) abortUploadRef.current();
                    setShowModalAbortConfirm(false);
                    setIsAssetUploading(false);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-md transition-colors cursor-pointer"
                >
                  Hủy Tải Lên & Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
