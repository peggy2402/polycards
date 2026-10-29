"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  X,
  Filter,
  RefreshCw,
  Sliders,
  Edit3,
  Eye,
  Trash2,
  Star,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Animal, ProductCategory } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";
import { resolveValidProductImage } from "@/lib/products-store";

interface ProductsTabProps {
  productsList: Animal[];
  categoriesList: ProductCategory[];
  isLoadingProducts: boolean;
  onNavigateToEditor: () => void;
  onLoadCardToCanvas: (card: Animal) => void;
  onOpenEditProduct: (card: Animal) => void;
  onDeleteProduct: (card: Animal) => void;
  onToggleShowOnHome: (card: Animal) => void;
  onOpenComboModal: () => void;
}

export function ProductsTab({
  productsList,
  categoriesList,
  isLoadingProducts,
  onNavigateToEditor,
  onLoadCardToCanvas,
  onOpenEditProduct,
  onDeleteProduct,
  onToggleShowOnHome,
  onOpenComboModal,
}: ProductsTabProps) {
  const [searchCardQuery, setSearchCardQuery] = useState("");
  const [filterCardCategory, setFilterCardCategory] = useState("all");
  const [onlyHomeFeatured, setOnlyHomeFeatured] = useState<boolean>(false);
  const [brokenImgMap, setBrokenImgMap] = useState<Record<string, boolean>>({});

  const pinnedCardsCount = productsList.filter((c) => Boolean(c.showOnHome)).length;

  const filteredProducts = productsList.filter((card) => {
    const matchesSearch =
      card.nameVi.toLowerCase().includes(searchCardQuery.toLowerCase()) ||
      card.nameEn.toLowerCase().includes(searchCardQuery.toLowerCase()) ||
      (card.nameZh && card.nameZh.toLowerCase().includes(searchCardQuery.toLowerCase())) ||
      card.slug.toLowerCase().includes(searchCardQuery.toLowerCase());

    const matchesCategory =
      filterCardCategory === "all" ||
      card.categorySlug === filterCardCategory ||
      card.category === filterCardCategory;

    const matchesHomeFilter = !onlyHomeFeatured || Boolean(card.showOnHome);

    return matchesSearch && matchesCategory && matchesHomeFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-stone-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Kho Thẻ Bài */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              <Layers className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Kho Thẻ Bài Sản Phẩm Poly Cards
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              {productsList.length} Thẻ
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Quản lý toàn bộ thẻ bài tại <strong className="text-amber-300">/products</strong> và chọn các thẻ nổi bật ghim lên hàng 4 thẻ nhỏ + Khối Combo Lớn tại trang chủ <strong className="text-amber-300">#products</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenComboModal}
            className="py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-stone-950 border border-emerald-400/40 font-black text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Tùy Chỉnh Khối Combo Lớn (#products)</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToEditor}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Chế Bản Thẻ Mới</span>
          </button>
        </div>
      </div>

      {/* Thanh trạng thái bố cục Trang Chủ #products */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-stone-900 to-emerald-500/10 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <Star className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <div className="font-black text-amber-200 flex items-center gap-2 flex-wrap">
              <span>
                Bố cục Trang Chủ (#products): 4 Thẻ Nhỏ Cùng 1 Hàng + 1 Khối Combo Lớn Bên Dưới
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-mono">
                Đang ghim: {pinnedCardsCount}/4 thẻ
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {pinnedCardsCount === 0
                ? "Chưa ghim thẻ thủ công — Trang chủ tự động lấy 4 thẻ đầu tiên. Bấm nút \"Đưa Lên Trang Chủ\" trên từng thẻ bên dưới để tự chọn đúng 4 thẻ bạn muốn."
                : "Các thẻ được đánh dấu sao bên dưới sẽ xuất hiện trực tiếp trên hàng 4 thẻ nhỏ tại Trang Chủ #products. Huy hiệu (Badge) chỉnh trong mục \"Sửa\" của từng thẻ."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOnlyHomeFeatured((prev) => !prev)}
          className={`py-2 px-3.5 rounded-xl text-xs font-black border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            onlyHomeFeatured
              ? "bg-amber-400 text-stone-950 border-amber-300 shadow-md"
              : "bg-stone-900/90 text-amber-300 border-amber-400/30 hover:bg-amber-500/15"
          }`}
        >
          <Star className="h-3.5 w-3.5" />
          <span>
            {onlyHomeFeatured
              ? `Đang lọc thẻ Trang Chủ (${pinnedCardsCount})`
              : `Lọc thẻ ghim Trang Chủ (${pinnedCardsCount})`}
          </span>
        </button>
      </div>

      {/* Thanh Công Cụ: Tìm Kiếm, Lọc Danh Mục */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchCardQuery}
            onChange={(e) => setSearchCardQuery(e.target.value)}
            placeholder="Tìm thẻ theo tên tiếng Việt, tiếng Anh, tiếng Trung hoặc slug..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-white/15 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
          />
          {searchCardQuery && (
            <button
              type="button"
              onClick={() => setSearchCardQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 border border-white/15 text-xs text-stone-300">
            <Filter className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <select
              value={filterCardCategory}
              onChange={(e) => setFilterCardCategory(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-stone-900 text-white">
                Tất Cả Danh Mục ({productsList.length})
              </option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.slug} className="bg-stone-900 text-white">
                  {cat.name} ({productsList.filter((p) => p.categorySlug === cat.slug || p.category === cat.name).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lưới Thẻ Bài Sản Phẩm */}
      {isLoadingProducts ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-stone-400 font-bold">Đang tải danh sách thẻ bài...</p>
        </div>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-stone-900/40 border border-dashed border-white/10 p-8 space-y-3">
              <Layers className="h-10 w-10 text-stone-600 mx-auto" />
              <h4 className="text-sm font-bold text-stone-300">Không tìm thấy thẻ bài nào phù hợp</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Thử tìm kiếm với từ khóa khác hoặc tắt bộ lọc thẻ ghim Trang Chủ để xem toàn bộ kho thẻ.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchCardQuery("");
                  setFilterCardCategory("all");
                  setOnlyHomeFeatured(false);
                }}
                className="py-2 px-4 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                Xóa Bộ Lọc Tìm Kiếm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((card) => {
                const key = card.id || card.slug;
                const resolvedImg = resolveValidProductImage(
                  card.images?.[0],
                  card.posterUrl,
                  "/images/cards/jump-template.jpg"
                );
                const cardImg = brokenImgMap[key]
                  ? "/images/cards/jump-template.jpg"
                  : resolvedImg;
                const isPinned = Boolean(card.showOnHome);
                const hasBadge = Boolean(card.badge && card.badge.trim() !== "");

                return (
                  <div
                    key={key}
                    className={`rounded-2xl bg-stone-900/90 border p-3.5 space-y-3 transition-all hover:shadow-xl hover:shadow-black/50 flex flex-col justify-between group ${
                      isPinned
                        ? "border-emerald-400/60 ring-1 ring-emerald-400/25"
                        : "border-white/10 hover:border-amber-500/40"
                    }`}
                  >
                    {/* Ảnh & Badges */}
                    <div className="space-y-2.5">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-950 border border-white/10 group-hover:border-amber-500/30 transition-colors">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cardImg}
                          alt={card.nameVi}
                          onError={() =>
                            setBrokenImgMap((prev) => ({ ...prev, [key]: true }))
                          }
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Top-Left: Category + Pinned status */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/75 text-stone-200 backdrop-blur-md border border-white/20">
                            {card.category || "Động Vật"}
                          </span>
                          {isPinned && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 shadow-md">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              <span>TRANG CHỦ</span>
                            </span>
                          )}
                        </div>

                        {/* Top-Right: Badge nổi bật (đúng vị trí trên thẻ ngoài trang chủ) */}
                        {hasBadge && (
                          <div className="absolute top-2 right-2">
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-md">
                              {card.badge}
                            </span>
                          </div>
                        )}

                        <div className="absolute bottom-2 right-2">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/80 text-amber-300 border border-amber-500/30">
                            {card.slug}
                          </span>
                        </div>
                      </div>

                      {/* Thông Tin Tên & Giá */}
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-black text-sm text-white truncate" title={card.nameVi}>
                            {card.nameVi}
                          </h3>
                          <span className="text-xs font-black text-amber-400 shrink-0 font-mono">
                            {formatVndCurrency(card.price || 219000)}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400 truncate">
                          <span className="text-stone-300 font-bold">{card.nameEn}</span>
                          {card.nameZh && <span className="ml-1 text-stone-400">({card.nameZh})</span>}
                          {card.ipa && <span className="ml-1 font-mono text-stone-500">{card.ipa}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Các Nút Hành Động Cho Thẻ */}
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      {/* Nút Bật/Tắt Ghim Lên Trang Chủ #products */}
                      <button
                        type="button"
                        onClick={() => onToggleShowOnHome(card)}
                        className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                          isPinned
                            ? "bg-emerald-500 text-stone-950 border-emerald-400 shadow-md shadow-emerald-500/20 hover:bg-emerald-400"
                            : "bg-white/5 hover:bg-emerald-500/20 text-stone-300 hover:text-emerald-300 border-white/10 hover:border-emerald-400/40"
                        }`}
                        title="Chọn hoặc gỡ thẻ này khỏi hàng 4 thẻ nhỏ nổi bật tại Trang Chủ #products"
                      >
                        <Star className={`h-3.5 w-3.5 ${isPinned ? "fill-stone-950" : ""}`} />
                        <span>
                          {isPinned ? "Đang Ghim Ở #products" : "Đưa Lên Trang Chủ #products"}
                        </span>
                      </button>

                      {/* Nút Nạp Vào Bàn Chế Bản */}
                      <button
                        type="button"
                        onClick={() => onLoadCardToCanvas(card)}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 border border-amber-500/30 transition-all active:scale-95 cursor-pointer"
                        title="Nạp thẻ này lên Canvas Bàn Chế Bản để chỉnh sửa QR hoặc thêm vào hàng đợi in ấn"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Chế Bản & In Thẻ Này</span>
                      </button>

                      {/* 3 Nút Nhỏ: Sửa (kèm sửa Badge), AR 3D, Xóa */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditProduct(card)}
                          className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin thẻ bài, Huy hiệu (Badge), giá bán, tệp 3D & âm thanh"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-sky-400" />
                          <span>Sửa</span>
                        </button>

                        <Link
                          href={`/ar/${card.slug}?ar=1`}
                          target="_blank"
                          className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Mở xem trải nghiệm AR 3D thực tế"
                        >
                          <Eye className="h-3.5 w-3.5 text-purple-400" />
                          <span>AR 3D</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => onDeleteProduct(card)}
                          className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Xóa thẻ này khỏi hệ thống"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
