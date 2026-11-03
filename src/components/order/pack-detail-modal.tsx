"use client";

import React from "react";
import Image from "next/image";
import { CardComboPack } from "@/data/combos";
import { formatVndCurrency } from "@/lib/formatters";
import {
  X,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Languages,
  Layers,
  Plus,
  Check,
} from "lucide-react";

interface PackDetailModalProps {
  pack: CardComboPack | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAndAdd: (pack: CardComboPack) => void;
  isAlreadySelected: boolean;
}

export function PackDetailModal({
  pack,
  isOpen,
  onClose,
  onSelectAndAdd,
  isAlreadySelected,
}: PackDetailModalProps) {
  if (!isOpen || !pack) return null;

  const isVip = pack.cardsCount >= 120;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border-2 border-amber-300 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-stone-100 p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50/50">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                isVip
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {pack.badge}
            </span>
            <span className="rounded-md bg-white border border-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-700">
              {pack.cardsCount} Thẻ AR
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-stone-200 text-stone-500 hover:text-stone-900 active:scale-90 transition-transform cursor-pointer"
            aria-label="Đóng chi tiết"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Mockup Card Banner */}
          <div className="relative aspect-16/9 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 via-sky-50 to-emerald-100 border border-amber-200/60 flex items-center justify-center p-3">
            <div className="relative h-full w-48 rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105 duration-300">
              <Image
                src={pack.imageSrc || "/images/cards/butterfly-card.png"}
                alt={pack.name}
                fill
                className="object-cover rounded-xl"
              />
            </div>
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-black text-amber-900 border border-amber-200 shadow-xs">
              Mã QR WebAR Tương Tác 3D
            </div>
          </div>

          {/* Title & Price */}
          <div>
            <h2 className="text-lg sm:text-xl font-black text-stone-950 leading-snug">
              {pack.name}
            </h2>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-700">
                {formatVndCurrency(pack.price)}
              </span>
              {pack.originalPrice && (
                <span className="text-xs text-stone-400 line-through">
                  {formatVndCurrency(pack.originalPrice)}
                </span>
              )}
              {pack.discountPercent > 0 && (
                <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                  Tiết kiệm {pack.discountPercent}%
                </span>
              )}
            </div>
          </div>

          {/* Ngôn ngữ & Chủ đề */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-stone-600">
            <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1">
              <Languages className="h-3.5 w-3.5 text-amber-600" />
              <span>
                {pack.languageType === "zh-vi"
                  ? "Song ngữ Trung - Việt"
                  : pack.languageType === "en-vi"
                  ? "Song ngữ Anh - Việt"
                  : "Đa ngữ Quốc tế"}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>Chủ đề: {pack.categoryName}</span>
            </span>
          </div>

          {/* Description */}
          <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3.5 text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
            {pack.description}
          </div>

          {/* Highlights */}
          {pack.highlights && pack.highlights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-stone-500 tracking-wider">
                Điểm nổi bật của bộ thẻ:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 font-semibold">
                {pack.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cam kết chất lượng */}
          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium pt-1 border-t border-stone-100">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Thẻ in sắc nét, chống nước, công nghệ AR tương tác 3D không giới hạn.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectAndAdd(pack);
              onClose();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs sm:text-sm font-black text-stone-950 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            {isAlreadySelected ? (
              <>
                <Check className="h-4 w-4" />
                <span>Đã Có Trong Giỏ (+ Thêm 1)</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Thêm Vào Giỏ Hàng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

