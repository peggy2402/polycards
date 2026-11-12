"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { CardComboPack } from "@/data/combos";
import { formatVndCurrency } from "@/lib/formatters";
import {
  X,
  Search,
  Check,
  Plus,
  Info,
  Layers,
  Sparkles,
  RotateCcw,
  Languages,
} from "lucide-react";

interface OrderPackSheetProps {
  isOpen: boolean;
  onClose: () => void;
  availablePacks: CardComboPack[];
  selectedPackIds: string[];
  onToggleSelectPack: (pack: CardComboPack) => void;
  onOpenDetail: (pack: CardComboPack) => void;
}

const CATEGORY_TABS = [
  { id: "all", name: "Tất cả các bộ" },
  { id: "all-vip", name: "Trọn Bộ VIP" },
  { id: "dong-vat", name: "Động Vật" },
  { id: "hanh-dong", name: "Hành Động" },
  { id: "phuong-tien", name: "Phương Tiện" },
  { id: "trai-cay", name: "Hoa Quả" },
  { id: "nghe-nghiep", name: "Nghề Nghiệp" },
];

const LANGUAGE_FILTERS = [
  { id: "all", name: "Tất cả ngôn ngữ" },
  { id: "en-vi", name: "Anh - Việt" },
  { id: "zh-vi", name: "Trung - Việt" },
];

export function OrderPackSheet({
  isOpen,
  onClose,
  availablePacks,
  selectedPackIds,
  onToggleSelectPack,
  onOpenDetail,
}: OrderPackSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeLanguage, setActiveLanguage] = useState("all");

  // Lọc danh sách bộ thẻ
  const filteredPacks = useMemo(() => {
    return availablePacks.filter((pack) => {
      const matchCat =
        activeCategory === "all" || pack.categorySlug === activeCategory;

      const matchLang =
        activeLanguage === "all" ||
        pack.languageType === "all" ||
        pack.languageType === activeLanguage;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        pack.name.toLowerCase().includes(q) ||
        pack.description.toLowerCase().includes(q) ||
        pack.categoryName.toLowerCase().includes(q);

      return matchCat && matchLang && matchQuery;
    });
  }, [availablePacks, activeCategory, activeLanguage, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Bottom Sheet Container (Slide up on mobile, Modal on desktop) */}
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-3xl overflow-hidden bg-white shadow-2xl border-t-2 sm:border-2 border-amber-300 flex flex-col z-10 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
        {/* Handle bar on mobile */}
        <div className="sm:hidden mx-auto my-2.5 h-1.5 w-12 rounded-full bg-stone-300" />

        {/* Header Sheet */}
        <div className="flex items-center justify-between border-b border-stone-100 px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/50 rounded-t-[2rem] sm:rounded-t-3xl">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-950 flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600" />
              <span>Chọn Thêm Bộ Thẻ AR Vào Giỏ</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500 font-medium">
              Đang có {availablePacks.length} bộ thẻ AR (270 thẻ) sẵn sàng xếp vào thùng hàng
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 active:scale-90 transition-transform cursor-pointer"
            aria-label="Đóng bảng chọn bộ"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Thanh Tìm Kiếm & Bộ Lọc Nhanh */}
        <div className="p-3 sm:p-4 border-b border-stone-100 space-y-2.5 bg-stone-50/60">
          {/* Ô Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bộ thẻ (Động vật, Xe cộ, Hoa quả, VIP...)"
              className="w-full rounded-2xl border border-stone-200 bg-white pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Lọc Chủ Đề Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-2.5 py-1 rounded-xl font-bold shrink-0 transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? "bg-amber-400 text-stone-950 font-black shadow-xs"
                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Lọc Ngôn Ngữ */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px] font-semibold text-stone-600">
            <span className="flex items-center gap-1 text-stone-400 shrink-0">
              <Languages className="h-3 w-3" />
              <span>Ngôn ngữ:</span>
            </span>
            {LANGUAGE_FILTERS.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setActiveLanguage(lang.id)}
                className={`px-2 py-0.5 rounded-lg shrink-0 transition-all cursor-pointer ${
                  activeLanguage === lang.id
                    ? "bg-emerald-600 text-white font-black"
                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Danh Sách Bộ Thẻ Theo Hàng (Compact List Rows) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-stone-100">
          {filteredPacks.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500 space-y-2">
              <p className="font-bold">Không tìm thấy bộ thẻ nào phù hợp.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  setActiveLanguage("all");
                }}
                className="text-amber-700 font-black underline cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            filteredPacks.map((pack) => {
              const isSelected = selectedPackIds.includes(pack.id);
              const isVip = pack.cardsCount >= 120;

              return (
                <div
                  key={pack.id}
                  className={`pt-2.5 first:pt-0 flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 rounded-2xl transition-all ${
                    isSelected
                      ? "bg-amber-50/80 border border-amber-300 shadow-xs"
                      : "bg-white hover:bg-stone-50/80 border border-transparent"
                  }`}
                >
                  {/* Thumbnail nhỏ & Thông tin hàng */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Ảnh mockup nhỏ */}
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-amber-50">
                      <Image
                        src={pack.imageSrc || "/images/cards/butterfly-card.png"}
                        alt={pack.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Header + Badge + Giá tiền */}
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
                        {pack.discountPercent > 0 && (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1 rounded-sm">
                            -{pack.discountPercent}%
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-black text-stone-900 truncate mt-0.5 leading-snug">
                        {pack.name}
                      </h3>

                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xs sm:text-sm font-black text-amber-700">
                          {formatVndCurrency(pack.price)}
                        </span>
                        {pack.originalPrice && (
                          <span className="text-[10px] text-stone-400 line-through">
                            {formatVndCurrency(pack.originalPrice === 299000 ? 300000 : pack.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bên Phải: Nút "Xem chi tiết" + Nút "Chọn/Bỏ" */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(pack)}
                      className="px-2 py-1.5 rounded-xl border border-stone-200 text-[11px] font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Info className="h-3 w-3 text-stone-400" />
                      <span>Xem chi tiết</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleSelectPack(pack)}
                      className={`h-9 px-3 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-amber-500 text-stone-950 shadow-xs ring-1 ring-amber-600/40"
                          : "bg-stone-900 text-white hover:bg-stone-800"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                          <span>Đã chọn</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Chọn bộ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Sheet: Đóng và Hoàn tất */}
        <div className="border-t border-stone-200/80 p-3 sm:p-4 bg-white flex items-center justify-between gap-3 rounded-b-none sm:rounded-b-3xl">
          <div className="text-xs text-stone-600">
            Đã xếp <strong>{selectedPackIds.length}</strong> bộ vào thùng hàng
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-toy-3d px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-xs sm:text-sm font-black text-stone-950 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Hoàn Tất ({selectedPackIds.length} Bộ)
          </button>
        </div>
      </div>
    </div>
  );
}

