"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CardComboPack } from "@/data/combos";
import { Animal } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";
import { formatVnd } from "@/lib/pricing";
import {
  X,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Languages,
  Layers,
  Plus,
  Check,
  CreditCard,
  Eye,
} from "lucide-react";

interface PackDetailModalProps {
  pack: CardComboPack | null;
  isOpen: boolean;
  cardsList?: Animal[];
  onClose: () => void;
  onSelectAndAdd: (pack: CardComboPack) => void;
  isAlreadySelected?: boolean;
}

export function PackDetailModal({
  pack,
  isOpen,
  cardsList = [],
  onClose,
  onSelectAndAdd,
  isAlreadySelected = false,
}: PackDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "cards">("cards");

  if (!isOpen || !pack) return null;

  const isVip = pack.cardsCount >= 120;

  // Lọc các thẻ lẻ thuộc bộ này
  const packCards = cardsList.filter((card) => {
    if (!card.packCode) return false;
    const cCode = card.packCode.trim().toUpperCase();
    const pCode = pack.packCode.trim().toUpperCase();
    return cCode === pCode || (pCode.includes("ALLVIP") && card.categorySlug);
  });

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border-2 border-amber-300 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-stone-100 p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50/50 shrink-0">
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

        {/* Tabs: Danh Sách Thẻ Lẻ & Tổng Quan */}
        <div className="flex items-center gap-2 px-5 pt-3 bg-stone-50 border-b border-stone-200/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("cards")}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
              activeTab === "cards"
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Danh Sách Thẻ Lẻ Trong Bộ ({packCards.length > 0 ? packCards.length : pack.cardsCount} thẻ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Thông Tin &amp; Ưu Đãi
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Header Thông tin Bộ */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-950 leading-snug">
                {pack.name}
              </h2>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                Mã bộ: <strong>{pack.packCode}</strong> • Chủ đề: {pack.categoryName}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-lg sm:text-xl font-black text-amber-700">
                {formatVndCurrency(pack.price)}
              </div>
              {pack.originalPrice && (
                <div className="text-[11px] text-stone-400 line-through">
                  {formatVndCurrency(pack.originalPrice)}
                </div>
              )}
            </div>
          </div>

          {activeTab === "cards" ? (
            /* TAB 1: DANH SÁCH THẺ LẺ */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>
                  Đơn giá tính theo thẻ lẻ:{" "}
                  <strong className="text-amber-700 font-mono">10.000 ₫ / thẻ</strong>
                </span>
                <span className="text-[11px] text-stone-500">
                  {packCards.length} thẻ bài đã sẵn sàng
                </span>
              </div>

              {packCards.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-200 space-y-1.5">
                  <Layers className="h-8 w-8 text-stone-400 mx-auto" />
                  <p className="text-xs text-stone-600 font-bold">
                    Bộ thẻ gồm {pack.cardsCount} thẻ bài AR 3D tương tác.
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Bao gồm đầy đủ các thẻ chủ đề {pack.categoryName} theo giáo trình chuẩn quốc tế.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {packCards.map((card, idx) => (
                    <div
                      key={card.id || card.slug || idx}
                      className="p-2.5 rounded-2xl bg-stone-50 hover:bg-amber-50/60 border border-stone-200/80 transition-all flex flex-col justify-between space-y-2 group"
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-stone-200/60 flex items-center justify-center">
                        <Image
                          src={card.images?.[0] || card.posterUrl || "/images/cards/butterfly-card.png"}
                          alt={card.nameVi}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 bg-stone-900/80 text-white text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h5 className="text-xs font-black text-stone-900 truncate">
                          {card.nameVi}
                        </h5>
                        <p className="text-[10px] text-stone-500 truncate font-medium">
                          {card.nameEn} {card.nameZh ? `• ${card.nameZh}` : ""}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px]">
                          <span className="text-stone-400">Đơn giá lẻ:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {formatVndCurrency(card.price || 10000)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: THÔNG TIN & ƯU ĐÃI */
            <div className="space-y-4">
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
              <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium pt-2 border-t border-stone-100">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Thẻ in ép bóng chống nước 100%, bảo hành mã kích hoạt WebAR trọn đời.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-end gap-2 shrink-0">
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
                <span>Đã Có Trong Thùng Hàng (+1)</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Chọn Mua Bộ Thẻ Này</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
