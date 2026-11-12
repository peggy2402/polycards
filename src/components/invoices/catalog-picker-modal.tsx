"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  PackageCheck,
  Layers,
  Plus,
  Check,
  ShoppingCart,
  Filter,
  Eye,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Animal, ProductCategory } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";
import { computePackDynamicPricing } from "@/lib/pricing";
import { PackCodeItem } from "@/lib/pack-codes-store";

export interface InvoiceCartItem {
  id: string;
  type: "PACK" | "SINGLE";
  name: string;
  categorySlug: string;
  categoryName?: string;
  packCode?: string;
  slug?: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  image?: string;
}

interface CatalogPickerModalProps {
  isOpen: boolean;
  categoriesList: ProductCategory[];
  productsCatalog: Animal[];
  packCodesList?: PackCodeItem[];
  cartItems: InvoiceCartItem[];
  onClose: () => void;
  onAddToCart: (item: Omit<InvoiceCartItem, "quantity">, qty?: number) => void;
}

export function CatalogPickerModal({
  isOpen,
  categoriesList,
  productsCatalog,
  packCodesList = [],
  cartItems,
  onClose,
  onAddToCart,
}: CatalogPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"PACKS" | "SINGLES">("PACKS");
  const [searchCardQuery, setSearchCardQuery] = useState<string>("");
  const [filterCardCategory, setFilterCardCategory] = useState<string>("all");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  // Đếm số lượng sản phẩm đang có trong giỏ hàng theo id
  const getItemQtyInCart = (id: string): number => {
    const found = cartItems.find((it) => it.id === id);
    return found ? found.quantity : 0;
  };

  // Lọc thẻ lẻ
  const filteredSingleCards = productsCatalog.filter((card) => {
    if (filterCardCategory !== "all" && card.categorySlug !== filterCardCategory) {
      return false;
    }
    if (searchCardQuery.trim()) {
      const q = searchCardQuery.toLowerCase();
      const matchName = (card.nameVi || "").toLowerCase().includes(q);
      const matchEn = (card.nameEn || "").toLowerCase().includes(q);
      const matchSlug = card.slug.toLowerCase().includes(q);
      if (!matchName && !matchEn && !matchSlug) return false;
    }
    return true;
  });

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  // Nhóm các pack code theo danh mục (chỉ lấy các bộ thực sự có thẻ trong kho, loại bỏ triệt để các mã bộ rỗng 0 thẻ)
  const getPacksForCategory = (catSlug: string) => {
    const matches = packCodesList.filter((p) => {
      if (p.categorySlug !== catSlug) return false;
      const count = productsCatalog.filter(
        (c) => (c.packCode || "").toUpperCase() === (p.code || "").toUpperCase()
      ).length;
      const effectiveCount = productsCatalog.length > 0 ? count : (p.cardsCount ?? 0);
      return effectiveCount > 0;
    });
    if (matches.length > 0) return matches;

    // Fallback: chỉ tạo nếu danh mục này thực sự có thẻ lẻ trong kho
    const cardsInCat = productsCatalog.filter(
      (c) => c.categorySlug === catSlug || c.category === catSlug
    );
    if (cardsInCat.length === 0) return [];

    const cat = categoriesList.find((c) => c.slug === catSlug);
    const catUpper = catSlug.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return [
      {
        code: `POLY30-${catUpper}-ENVI`,
        name: `Bộ 30 Thẻ AR ${cat?.name || "Chủ đề"} (Anh - Việt)`,
        categorySlug: catSlug,
        categoryName: cat?.name || "Chủ đề",
        cardsCount: cardsInCat.length,
        salePrice: 300000,
        originalPrice: 300000,
        createdAt: "2026-10-25",
      },
    ];
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-400/40 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-amber-950/40 overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  Kho Hàng Hóa Poly Cards
                </h3>
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Đã chọn: {totalCartCount} món
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Cấu trúc phân cấp 3 tầng: Danh Mục &gt; Bộ Thẻ Bản Quyền &gt; Thẻ Bài Lẻ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thanh chuyển tab: Chọn Theo Bộ vs Chọn Thẻ Lẻ */}
        <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-white/10 flex items-center gap-2 bg-stone-900/90">
          <button
            type="button"
            onClick={() => setActiveTab("PACKS")}
            className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "PACKS"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                : "text-stone-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <PackageCheck className="h-4 w-4" />
            <span>1. Chọn Theo Danh Mục &amp; Bộ Thẻ ({categoriesList.length} danh mục)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SINGLES")}
            className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "SINGLES"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                : "text-stone-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>2. Chọn Thẻ Bài Lẻ ({productsCatalog.length} thẻ trong kho)</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: PHÂN CẤP CHUẨN: DANH MỤC -> CÁC BỘ THẺ -> THẺ LẺ
           ======================================================== */}
        {activeTab === "PACKS" && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
              <strong>Phân cấp chuẩn:</strong> Chọn Danh mục để xem các bộ thẻ ngôn ngữ (Anh - Việt, Trung - Việt). Khi thêm bộ thẻ vào giỏ, hệ thống tự động áp dụng combo tốt nhất (giảm 10%, 33%, 34%).
            </div>

            <div className="space-y-3">
              {categoriesList.map((cat) => {
                const packsForCat = getPacksForCategory(cat.slug);
                const countCardsInCat = productsCatalog.filter(
                  (p) => p.categorySlug === cat.slug || p.category === cat.name
                ).length;

                // Nếu danh mục không có thẻ lẻ và không có bộ thẻ nào có hàng thì bỏ qua
                if (packsForCat.length === 0 && countCardsInCat === 0) return null;

                const isExpanded = expandedCategory === cat.slug || categoriesList.length <= 3;

                // Tìm 1 ảnh tiêu biểu
                const sampleCard =
                  productsCatalog.find(
                    (p) => p.categorySlug === cat.slug || p.category === cat.name
                  ) || productsCatalog[0];
                const thumb =
                  sampleCard?.posterUrl ||
                  sampleCard?.images?.[0] ||
                  "/images/cards/butterfly-card.png";

                return (
                  <div
                    key={cat.id || cat.slug}
                    className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden transition-all"
                  >
                    {/* CẤP 1: HEADER DANH MỤC */}
                    <div
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.slug)}
                      className="p-3.5 sm:p-4 bg-stone-950/70 hover:bg-stone-950 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-400/30 overflow-hidden shrink-0 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb} alt={cat.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-white">{cat.name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white/10 text-stone-300">
                              {countCardsInCat} thẻ trong kho
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            Gồm {packsForCat.length} bộ thẻ bản quyền
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-stone-400">
                        <span className="text-xs font-bold hidden sm:inline">
                          {isExpanded ? "Thu gọn" : "Xem các bộ"}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    {/* CẤP 2: DANH SÁCH CÁC BỘ THẺ THUỘC DANH MỤC */}
                    {isExpanded && (
                      <div className="p-3 sm:p-4 bg-stone-900/60 border-t border-white/5 space-y-2.5 animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {packsForCat.map((pack) => {
                            const itemId = `pack-${pack.code.toLowerCase()}`;
                            const inCartQty = getItemQtyInCart(itemId);
                            const isZh = pack.code.includes("ZHVI");

                            // Tính toán số lượng thẻ và giá động chuẩn xác theo danh sách thẻ lẻ thực tế
                            const dynamic = computePackDynamicPricing(pack.code, pack, productsCatalog);
                            const displayCardCount = dynamic.cardsCount;
                            const computedOriginal = dynamic.originalPrice;
                            const unitPrice = dynamic.price;

                            return (
                              <div
                                key={pack.code}
                                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                  inCartQty > 0
                                    ? "bg-amber-500/15 border-amber-400/80 shadow-md shadow-amber-500/10"
                                    : "bg-stone-950/80 border-white/10 hover:border-white/20"
                                }`}
                              >
                                <div className="min-w-0 space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                        isZh
                                          ? "bg-purple-500/20 text-purple-300"
                                          : "bg-emerald-500/20 text-emerald-300"
                                      }`}
                                    >
                                      {isZh ? "Trung - Việt" : "Anh - Việt"}
                                    </span>
                                    <h5 className="text-xs font-black text-white truncate">
                                      {displayCardCount === 0 && pack.name.includes("30")
                                        ? pack.name.replace(/Bộ 30 Thẻ( AR)?/i, "Bộ Thẻ AR")
                                        : pack.name}
                                    </h5>
                                  </div>

                                  <div className="text-[11px] text-stone-400 font-mono">
                                    Mã: <strong className="text-amber-300">{pack.code}</strong> •{" "}
                                    {displayCardCount > 0 ? (
                                      <span>{displayCardCount} Thẻ AR</span>
                                    ) : (
                                      <span className="text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30">
                                        0 Thẻ Đang Gắn
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-baseline gap-2 pt-0.5">
                                    <span className="font-mono text-xs font-black text-emerald-400">
                                      {formatVndCurrency(unitPrice)}
                                    </span>
                                    {computedOriginal > unitPrice && (
                                      <span className="font-mono text-[10px] text-stone-500 line-through">
                                        {formatVndCurrency(computedOriginal)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {inCartQty > 0 && (
                                    <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-950">
                                      x{inCartQty}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAddToCart({
                                        id: itemId,
                                        type: "PACK",
                                        name: pack.name,
                                        categorySlug: cat.slug,
                                        categoryName: cat.name,
                                        packCode: pack.code,
                                        unitPrice,
                                        originalPrice: computedOriginal,
                                        image: thumb,
                                      })
                                    }
                                    className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>{inCartQty > 0 ? "Thêm" : "Chọn bộ"}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: CHỌN THẺ BÀI LẺ (TỪNG THẺ RIÊNG BIỆT)
           ======================================================== */}
        {activeTab === "SINGLES" && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {/* Bộ lọc & Tìm kiếm thẻ lẻ */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Tìm thẻ lẻ theo tên tiếng Việt hoặc tiếng Anh..."
                  value={searchCardQuery}
                  onChange={(e) => setSearchCardQuery(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <select
                value={filterCardCategory}
                onChange={(e) => setFilterCardCategory(e.target.value)}
                className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-stone-300 font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer w-full sm:w-auto"
              >
                <option value="all">Tất cả danh mục</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id || cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Danh sách thẻ lẻ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filteredSingleCards.map((card) => {
                const itemId = `single-${card.slug}`;
                const inCartQty = getItemQtyInCart(itemId);
                const thumb =
                  card.posterUrl ||
                  card.images?.[0] ||
                  "/images/cards/butterfly-card.png";
                const unitPrice = card.price || 10000;

                return (
                  <div
                    key={card.id || card.slug}
                    className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                      inCartQty > 0
                        ? "bg-amber-500/15 border-amber-400/80 shadow-md"
                        : "bg-black/40 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt={card.nameVi}
                          className="h-full w-full object-cover"
                        />
                        {inCartQty > 0 && (
                          <span className="absolute top-1.5 right-1.5 font-mono text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 shadow-xs">
                            x{inCartQty}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h5 className="text-xs font-black text-white truncate">
                          {card.nameVi}
                        </h5>
                        <p className="text-[10px] text-stone-400 truncate">
                          {card.nameEn}
                        </p>
                        <span className="font-mono text-xs font-bold text-amber-300 block mt-0.5">
                          {formatVndCurrency(unitPrice)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onAddToCart({
                          id: itemId,
                          type: "SINGLE",
                          name: `Thẻ AR: ${card.nameVi} (${card.nameEn})`,
                          categorySlug: card.categorySlug || "khac",
                          categoryName: card.category || "Thẻ Lẻ",
                          packCode: card.packCode || `SINGLE-${card.slug.toUpperCase()}`,
                          slug: card.slug,
                          unitPrice,
                          image: thumb,
                        })
                      }
                      className="mt-2 w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{inCartQty > 0 ? "Thêm tiếp" : "Chọn thẻ"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Modal */}
        <div className="p-4 border-t border-white/10 bg-stone-950 flex items-center justify-between">
          <div className="text-xs text-stone-400">
            Tổng cộng trong đơn hiện tại:{" "}
            <strong className="text-amber-400 font-mono text-sm">{totalCartCount}</strong> sản phẩm
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Xong &amp; Về Hóa Đơn
          </button>
        </div>
      </div>
    </div>
  );
}
