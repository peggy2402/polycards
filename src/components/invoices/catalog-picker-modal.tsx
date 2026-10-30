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
} from "lucide-react";
import { Animal, ProductCategory } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";

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
  image?: string;
}

interface CatalogPickerModalProps {
  isOpen: boolean;
  categoriesList: ProductCategory[];
  productsCatalog: Animal[];
  cartItems: InvoiceCartItem[];
  onClose: () => void;
  onAddToCart: (item: Omit<InvoiceCartItem, "quantity">, qty?: number) => void;
}

export function CatalogPickerModal({
  isOpen,
  categoriesList,
  productsCatalog,
  cartItems,
  onClose,
  onAddToCart,
}: CatalogPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"PACKS" | "SINGLES">("PACKS");
  const [searchCardQuery, setSearchCardQuery] = useState<string>("");
  const [filterCardCategory, setFilterCardCategory] = useState<string>("all");

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

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-400/40 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-amber-950/40 overflow-hidden">
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
                Chọn các bộ thẻ bài hoặc thẻ lẻ để thêm vào phiếu hóa đơn bán hàng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
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
            <span>1. Chọn Theo Bộ Thẻ Trọn Gói ({categoriesList.length} bộ)</span>
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
            TAB 1: CHỌN THEO BỘ THẺ TRỌN GÓI (30 THẺ / BỘ)
           ======================================================== */}
        {activeTab === "PACKS" && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
              <strong>Mẹo bán hàng:</strong> Khách hàng có thể mua cùng lúc nhiều bộ thẻ khác nhau (ví dụ: 2 bộ Động Vật, 1 bộ Hành Động, 1 bộ Nghề Nghiệp). Hệ thống sẽ cấp chung 1 mã bản quyền mở khóa trọn gói toàn bộ các bộ thẻ này cho khách!
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {categoriesList.map((cat) => {
                const countCards = productsCatalog.filter(
                  (p) => p.categorySlug === cat.slug || p.category === cat.name
                ).length;
                const itemId = `pack-${cat.slug}`;
                const inCartQty = getItemQtyInCart(itemId);

                // Tìm 1 ảnh tiêu biểu của danh mục
                const sampleCard =
                  productsCatalog.find(
                    (p) => p.categorySlug === cat.slug || p.category === cat.name
                  ) || productsCatalog[0];
                const thumb =
                  sampleCard?.posterUrl ||
                  sampleCard?.images?.[0] ||
                  "/images/cards/lion-template.jpg";

                return (
                  <div
                    key={cat.id || cat.slug}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      inCartQty > 0
                        ? "bg-amber-500/15 border-amber-400/80 shadow-lg shadow-amber-500/10"
                        : "bg-black/40 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-14 w-11 rounded-xl bg-stone-800 overflow-hidden shrink-0 border border-white/15 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt={cat.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white truncate">
                            Bộ 30 Thẻ {cat.name}
                          </h4>
                          {inCartQty > 0 && (
                            <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-950">
                              x{inCartQty}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {countCards > 0 ? `${countCards} thẻ trong kho` : "Trọn gói 30 thẻ AR"}
                        </p>
                        <span className="font-mono text-xs font-black text-amber-300 block mt-1">
                          {formatVndCurrency(249000)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onAddToCart({
                          id: itemId,
                          type: "PACK",
                          name: `Bộ 30 Thẻ AR ${cat.name}`,
                          categorySlug: cat.slug,
                          categoryName: cat.name,
                          packCode: `POLY30-${cat.slug.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
                          unitPrice: 249000,
                          image: thumb,
                        })
                      }
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{inCartQty > 0 ? "Thêm tiếp" : "Chọn bộ"}</span>
                    </button>
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

            {/* Lưới thẻ lẻ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredSingleCards.slice(0, 30).map((card) => {
                const itemId = `card-${card.slug}`;
                const inCartQty = getItemQtyInCart(itemId);
                const img =
                  card.posterUrl ||
                  (Array.isArray(card.images) && card.images[0]) ||
                  "/images/cards/lion-template.jpg";

                return (
                  <div
                    key={card.slug}
                    onClick={() =>
                      onAddToCart({
                        id: itemId,
                        type: "SINGLE",
                        name: `Thẻ ${card.nameVi || card.nameEn}`,
                        categorySlug: card.categorySlug || "dong-vat",
                        categoryName: card.category || "Động Vật",
                        slug: card.slug,
                        unitPrice: card.price || 219000,
                        image: img,
                      })
                    }
                    className={`rounded-2xl border overflow-hidden transition-all flex flex-col cursor-pointer group ${
                      inCartQty > 0
                        ? "bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10"
                        : "bg-black/40 border-white/10 hover:border-amber-400/40"
                    }`}
                  >
                    <div className="aspect-[3/4] w-full bg-stone-800 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={card.nameVi}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {inCartQty > 0 && (
                        <div className="absolute top-1.5 right-1.5 font-mono text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-md">
                          x{inCartQty}
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                      <div>
                        <h4 className="text-xs font-bold text-white truncate" title={card.nameVi}>
                          {card.nameVi}
                        </h4>
                        <p className="text-[10px] text-stone-400 truncate">
                          {card.nameEn || card.slug} &bull; {card.category || "Động Vật"}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-amber-300 font-bold">
                          {formatVndCurrency(card.price || 219000)}
                        </span>
                        <span className="text-[10px] font-bold text-amber-400 group-hover:underline">
                          + Chọn
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Modal */}
        <div className="p-4 border-t border-white/10 bg-stone-950/60 flex items-center justify-between text-xs">
          <span className="text-stone-400">
            Tổng cộng trong đơn hiện tại: <strong className="text-amber-400">{totalCartCount}</strong> sản phẩm
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-black transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Xong &amp; Về Hóa Đơn
          </button>
        </div>
      </div>
    </div>
  );
}
