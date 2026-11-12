"use client";

import React from "react";
import Image from "next/image";
import { CardComboPack } from "@/data/combos";
import { formatVndCurrency } from "@/lib/formatters";
import {
  PackageOpen,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Layers,
  ShoppingBag,
} from "lucide-react";

export interface SelectedPackItem {
  pack: CardComboPack;
  quantity: number;
}

interface SelectedPacksStackProps {
  items: SelectedPackItem[];
  onOpenSheet: () => void;
  onUpdateQuantity: (packId: string, delta: number) => void;
  onRemoveItem: (packId: string) => void;
}

export function SelectedPacksStack({
  items,
  onOpenSheet,
  onUpdateQuantity,
  onRemoveItem,
}: SelectedPacksStackProps) {
  const totalCards = items.reduce((acc, item) => acc + item.pack.cardsCount * item.quantity, 0);

  return (
    <div className="rounded-3xl border-2 border-amber-300/80 bg-white shadow-md overflow-hidden">
      {/* Header Khối Thùng Hàng Stack */}
      <div className="flex items-center justify-between border-b border-amber-100 p-4 sm:p-5 bg-gradient-to-r from-amber-100/70 via-orange-50/50 to-amber-50/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-stone-950 font-black shadow-xs">
            <PackageOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-stone-950 leading-tight">
              Hàng Hóa Poly Cards Của Bạn
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-600 font-medium">
              {items.length === 0
                ? "Chưa có bộ thẻ nào trong thùng hàng"
                : `Đang có ${items.length} bộ thẻ (${totalCards} thẻ AR) được xếp trong thùng`}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onOpenSheet}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-black text-amber-900 shadow-xs hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden xs:inline">Thêm Bộ Thẻ</span>
            <span className="xs:hidden">Thêm</span>
          </button>
        )}
      </div>

      {/* Body Thùng Hàng */}
      <div className="p-3 sm:p-5">
        {items.length === 0 ? (
          /* Trạng thái THÙNG RỖNG */
          <div className="py-8 sm:py-12 px-4 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/30 text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <PackageOpen className="h-8 w-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-stone-900">
                Thùng hàng đang trống
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Bấm vào nút bên dưới để mở danh sách 9 bộ thẻ AR (270 thẻ) và chọn bộ bạn yêu thích xếp vào thùng.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSheet}
              className="btn-toy-3d inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-xs sm:text-sm font-black text-stone-950 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Mở Bảng Chọn Bộ Thẻ AR Ngay</span>
            </button>
          </div>
        ) : (
          /* Danh sách các bộ được XẾP VÀO STACK */
          <div className="space-y-3">
            {items.map(({ pack, quantity }, idx) => {
              const packTotal = pack.price * quantity;
              const isVip = pack.cardsCount >= 120;

              return (
                <div
                  key={pack.id}
                  className="relative flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border-2 border-amber-200/80 bg-white hover:border-amber-300 shadow-xs transition-all"
                >
                  {/* Left: Thumbnail & Thông tin */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-amber-50">
                      <Image
                        src={pack.imageSrc || "/images/cards/butterfly-card.png"}
                        alt={pack.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`rounded-md px-1.5 py-0.2 text-[9px] font-black uppercase ${
                            isVip
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {pack.badge}
                        </span>
                        <span className="text-[10px] font-bold text-stone-500">
                          {pack.cardsCount} Thẻ
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-black text-stone-900 truncate mt-0.5 leading-snug">
                        {pack.name}
                      </h3>

                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xs sm:text-sm font-black text-amber-700">
                          {formatVndCurrency(packTotal)}
                        </span>
                        {quantity > 1 && (
                          <span className="text-[10px] text-stone-500">
                            ({formatVndCurrency(pack.price)} / bộ)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Điều chỉnh số lượng & Nút Xóa */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50 p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(pack.id, -1)}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-stone-600 hover:bg-white active:scale-90 transition-transform cursor-pointer"
                        aria-label={`Giảm số lượng ${pack.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 sm:w-7 text-center text-xs sm:text-sm font-black text-stone-900 font-mono">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(pack.id, 1)}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-stone-600 hover:bg-white active:scale-90 transition-transform cursor-pointer"
                        aria-label={`Tăng số lượng ${pack.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(pack.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-all cursor-pointer"
                      title="Xóa bộ thẻ khỏi thùng"
                      aria-label="Xóa bộ thẻ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Nút to thêm bộ thẻ khác vào thùng */}
            <button
              type="button"
              onClick={onOpenSheet}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 text-xs sm:text-sm font-black text-amber-900 active:scale-98 transition-all cursor-pointer mt-2"
            >
              <Plus className="h-4 w-4 text-amber-700" />
              <span>Chọn Thêm Bộ Thẻ Khác</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

