"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { CardComboPack } from "@/data/combos";
import { formatVndCurrency } from "@/lib/formatters";
import { calculatePricing, sanitizeDiscountPercent } from "@/lib/pricing";
import {
  X,
  Upload,
  Link as LinkIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";

interface EditPackModalProps {
  pack: CardComboPack | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedPack: CardComboPack) => void;
}

export function EditPackModal({
  pack,
  isOpen,
  onClose,
  onSaveSuccess,
}: EditPackModalProps) {
  const [imageSrc, setImageSrc] = useState("");
  const [originalPrice, setOriginalPrice] = useState(300000);
  const [discountPercent, setDiscountPercent] = useState(17);
  const [salePrice, setSalePrice] = useState(249000);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (pack) {
      setImageSrc(pack.imageSrc || "");
      const orig = pack.originalPrice || (pack.cardsCount ? pack.cardsCount * 10000 : 300000);
      const sale = pack.price || 249000;
      setOriginalPrice(orig);
      setSalePrice(sale);
      const pct = pack.discountPercent !== undefined && pack.discountPercent >= 0
        ? pack.discountPercent
        : (orig > sale ? Math.round(((orig - sale) / orig) * 100) : 0);
      setDiscountPercent(pct);
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [pack, isOpen]);

  if (!isOpen || !pack) return null;

  // Xử lý upload ảnh
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", `pack-${pack.packCode.toLowerCase()}-${Date.now()}.png`);

      const res = await fetch("/api/tools/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.fileUrl) {
        setImageSrc(data.fileUrl);
      } else {
        setErrorMsg(data.error || "Không thể tải ảnh lên. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi upload ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  // Lưu cấu hình
  const handleSave = async () => {
    if (salePrice > originalPrice) {
      setErrorMsg("Giá bán ưu đãi không được lớn hơn giá gốc niêm yết!");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        code: pack.packCode,
        originalPrice,
        salePrice,
        discountPercent,
        isManualPrice: true,
        imageSrc: imageSrc.trim() || undefined,
      };

      const res = await fetch("/api/pack-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Lưu cấu hình bộ thẻ thành công!");
        const updated: CardComboPack = {
          ...pack,
          originalPrice,
          price: salePrice,
          discountPercent,
          imageSrc: imageSrc.trim() || pack.imageSrc,
        };
        setTimeout(() => {
          onSaveSuccess(updated);
          onClose();
        }, 600);
      } else {
        setErrorMsg(data.error || "Lỗi cập nhật cấu hình bộ thẻ.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối máy chủ.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-amber-400/50 shadow-2xl overflow-hidden flex flex-col text-stone-100 animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Cấu Hình Bộ Thẻ AR
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                Mã bộ: <strong className="text-amber-300">{pack.packCode}</strong> • {pack.cardsCount} Thẻ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nội dung Form */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 text-xs font-semibold text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2.5 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tên bộ thẻ */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              Tên Bộ Sản Phẩm:
            </label>
            <div className="px-3.5 py-2 rounded-xl bg-stone-950 border border-white/10 text-xs font-bold text-white">
              {pack.name}
            </div>
          </div>

          {/* Cấu hình Ảnh Thumbnail */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-300">
              Ảnh Thumbnail Bộ Thẻ:
            </label>

            <div className="flex items-center gap-4">
              <div className="relative h-20 w-28 rounded-xl overflow-hidden bg-stone-950 border border-white/20 shrink-0">
                <img
                  src={imageSrc || pack.imageSrc || "/images/cards/butterfly-card.png"}
                  alt={pack.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2">
                {/* Dán URL */}
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={imageSrc}
                    onChange={(e) => setImageSrc(e.target.value)}
                    placeholder="Dán đường dẫn ảnh URL..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-950 border border-white/20 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 font-mono"
                  />
                </div>

                {/* Upload File */}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-bold transition-all cursor-pointer border border-white/10">
                  <Upload className="h-3.5 w-3.5 text-amber-400" />
                  <span>{isUploading ? "Đang tải ảnh lên..." : "Tải ảnh từ máy tính"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Bảng Tính Giá 2 Chiều */}
          <div className="rounded-2xl bg-stone-950/70 border border-white/10 p-4 space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span>Bảng Định Giá & Khuyến Mãi (Tự Động 2 Chiều)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Giá gốc */}
              <div>
                <label className="block text-[11px] font-bold text-stone-400 mb-1">
                  Giá Gốc Niêm Yết:
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={originalPrice || ""}
                  onChange={(e) => {
                    const orig = Number(e.target.value) || 0;
                    setOriginalPrice(orig);
                    const calc = calculatePricing({
                      originalPrice: orig,
                      discountPercent,
                      sourceField: "originalPrice",
                    });
                    setSalePrice(calc.salePrice);
                  }}
                  className="w-full bg-stone-900 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-hidden focus:border-amber-400"
                />
                <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                  {formatVndCurrency(originalPrice)}
                </span>
              </div>

              {/* % Khuyến mãi */}
              <div>
                <label className="block text-[11px] font-bold text-stone-400 mb-1">
                  % Khuyến Mãi (0 - 99%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={discountPercent === 0 ? "" : discountPercent}
                  placeholder="0"
                  onChange={(e) => {
                    const raw = e.target.value.replace(/^0+(?=\d)/, "");
                    const pct = raw === "" ? 0 : sanitizeDiscountPercent(raw);
                    setDiscountPercent(pct);
                    const calc = calculatePricing({
                      originalPrice,
                      discountPercent: pct,
                      sourceField: "discountPercent",
                    });
                    setSalePrice(calc.salePrice);
                  }}
                  className="w-full bg-stone-900 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-hidden focus:border-amber-400"
                />
                <span className="text-[10px] text-amber-300/80 font-mono mt-1 block">
                  Tiết kiệm: {discountPercent}%
                </span>
              </div>

              {/* Giá bán ưu đãi */}
              <div>
                <label className="block text-[11px] font-bold text-stone-400 mb-1">
                  Giá Ưu Đãi (VNĐ):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={salePrice || ""}
                  onChange={(e) => {
                    const sale = Number(e.target.value) || 0;
                    setSalePrice(sale);
                    const calc = calculatePricing({
                      originalPrice,
                      salePrice: sale,
                      sourceField: "salePrice",
                    });
                    setDiscountPercent(calc.discountPercent);
                  }}
                  className="w-full bg-stone-900 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-black text-emerald-400 focus:outline-hidden focus:border-emerald-400"
                />
                <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                  {formatVndCurrency(salePrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4 bg-stone-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Đang lưu..." : "Lưu Cấu Hình"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
