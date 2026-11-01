"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  ChevronDown,
  X,
  Check,
  Box,
  Layers,
  Sparkles,
} from "lucide-react";
import { Animal } from "@/types/animal";

interface SearchableCardSelectProps {
  products: Animal[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Loại bỏ dấu tiếng Việt để tìm kiếm không dấu linh hoạt (ví dụ: "dau tay" tìm thấy "Dâu tây")
 */
function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function SearchableCardSelect({
  products,
  selectedSlug,
  onSelect,
  placeholder = "-- Chọn thẻ bài trong kho --",
  disabled = false,
}: SearchableCardSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCard = useMemo(
    () => products.find((p) => p.slug === selectedSlug) || null,
    [products, selectedSlug]
  );

  // Đóng dropdown khi nhấp chuột ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tự động focus vào ô tìm kiếm khi mở popover
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Lọc thẻ bài thời gian thực
  const filteredProducts = useMemo(() => {
    const q = removeVietnameseTones(searchQuery.trim());
    if (!q) return products;

    return products.filter((p) => {
      const matchVi = removeVietnameseTones(p.nameVi || "").includes(q);
      const matchEn = (p.nameEn || "").toLowerCase().includes(q);
      const matchSlug = (p.slug || "").toLowerCase().includes(q);
      const matchCat = removeVietnameseTones(p.category || "").includes(q);
      const matchPack = (p.packCode || "").toLowerCase().includes(q);
      return matchVi || matchEn || matchSlug || matchCat || matchPack;
    });
  }, [products, searchQuery]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 px-3.5 rounded-xl bg-stone-900 border text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer select-none text-left ${
          isOpen
            ? "border-amber-400 ring-2 ring-amber-400/20"
            : "border-stone-800 hover:border-stone-700 hover:bg-stone-850"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedCard ? (
            <>
              {selectedCard.images?.[0] || selectedCard.rawImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedCard.images?.[0] || selectedCard.rawImageUrl}
                  alt={selectedCard.nameVi}
                  className="w-6 h-6 rounded-md object-cover border border-stone-700 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0 text-amber-400">
                  <Box className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="truncate flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-stone-100 truncate">{selectedCard.nameVi}</span>
                <span className="text-stone-400 font-normal truncate">({selectedCard.nameEn})</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0 hidden sm:inline-block">
                  {selectedCard.slug}
                </span>
              </div>
            </>
          ) : (
            <span className="text-stone-400 truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-amber-400" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown với Ô Tìm Kiếm */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-stone-900 border border-stone-700 shadow-2xl shadow-black/60 overflow-hidden flex flex-col animate-in fade-in duration-150">
          {/* Ô Input Search */}
          <div className="p-2.5 border-b border-stone-800 bg-stone-950/60 sticky top-0 z-10 flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Gõ tên tiếng Việt, tiếng Anh hoặc slug..."
              className="w-full bg-transparent text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-md text-stone-400 hover:text-stone-100 hover:bg-stone-800"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Danh sách Thẻ Bài */}
          <div className="max-h-60 overflow-y-auto divide-y divide-stone-800/50 p-1">
            {filteredProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500">
                Không tìm thấy thẻ nào khớp với &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = p.slug === selectedSlug;
                return (
                  <button
                    key={p.id || p.slug}
                    type="button"
                    onClick={() => {
                      onSelect(p.slug);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2.5 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-200"
                        : "hover:bg-stone-800/70 text-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {p.images?.[0] || p.rawImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images?.[0] || p.rawImageUrl}
                          alt={p.nameVi}
                          className="w-7 h-7 rounded-lg object-cover border border-stone-700/80 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0 text-stone-400">
                          <Box className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-stone-100">{p.nameVi}</span>
                          <span className="text-stone-400 text-[11px]">({p.nameEn})</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono">
                          <span>{p.slug}</span>
                          {p.category && (
                            <>
                              <span>•</span>
                              <span className="text-stone-400">{p.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer nhỏ đếm số thẻ */}
          <div className="px-3 py-1.5 bg-stone-950/80 border-t border-stone-800/80 text-[10px] text-stone-400 flex items-center justify-between">
            <span>Hiển thị {filteredProducts.length} / {products.length} thẻ bài</span>
            <span className="text-stone-500">Poly Cards Studio</span>
          </div>
        </div>
      )}
    </div>
  );
}
