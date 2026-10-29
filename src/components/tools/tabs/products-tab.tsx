"use client";

import React, { useState } from "react";
import {
  Layers,
  Plus,
  Search,
  X,
  Filter,
  RefreshCw,
  Star,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Animal, ProductCategory } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";
import { SubjectFocusImage } from "@/components/common/subject-focus-image";
import { ProductDetailModal } from "../modals/product-detail-modal";

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
  const [selectedDetailSlug, setSelectedDetailSlug] = useState<string | null>(null);

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

  // Luôn lấy dữ liệu mới nhất từ productsList để khi bấm Ghim trong Modal trạng thái cập nhật ngay tức thì
  const activeDetailCard = selectedDetailSlug
    ? productsList.find((p) => p.slug === selectedDetailSlug) || null
    : null;

  return (
    <div className="flex-1 overflow-y-auto bg-stone-950 p-4 sm:p-6 lg:p-8 space-y-5">
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
            Bấm trực tiếp vào bất kỳ thẻ nhỏ nào bên dưới để xem chi tiết, sửa thông tin, chế bản in hoặc thử WebAR 3D. Bấm biểu tượng ngôi sao góc phải ảnh để ghim nhanh lên <strong className="text-amber-300">#products</strong> tức thì (không tải lại trang).
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
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-stone-900 to-emerald-500/10 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <Star className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <div className="font-black text-amber-200 flex items-center gap-2 flex-wrap">
              <span>Trang Chủ (#products): 4 Thẻ Nhỏ 1 Hàng + 1 Khối Combo Lớn</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-mono">
                Đang ghim: {pinnedCardsCount}/4 thẻ
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOnlyHomeFeatured((prev) => !prev)}
          className={`py-1.5 px-3 rounded-xl text-xs font-black border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            onlyHomeFeatured
              ? "bg-amber-400 text-stone-950 border-amber-300 shadow-md"
              : "bg-stone-900/90 text-amber-300 border-amber-400/30 hover:bg-amber-500/15"
          }`}
        >
          <Star className="h-3.5 w-3.5" />
          <span>
            {onlyHomeFeatured
              ? `Đang lọc thẻ #products (${pinnedCardsCount})`
              : `Lọc thẻ ghim #products (${pinnedCardsCount})`}
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
                  {cat.name} (
                  {
                    productsList.filter(
                      (p) => p.categorySlug === cat.slug || p.category === cat.name
                    ).length
                  }
                  )
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lưới Thẻ Bài Thu Gọn (Compact Grid 2 -> 6 cột) — Chỉ hiện Loader khi chưa có dữ liệu lần đầu */}
      {isLoadingProducts && productsList.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-stone-400 font-bold">Đang tải danh sách thẻ bài...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredProducts.map((card) => {
            const key = card.id || card.slug;
            const isPinned = Boolean(card.showOnHome);
            const hasBadge = Boolean(card.badge && card.badge.trim() !== "");

            return (
              <div
                key={key}
                onClick={() => setSelectedDetailSlug(card.slug)}
                className={`group relative rounded-2xl bg-stone-900/90 border p-2.5 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/60 cursor-pointer flex flex-col justify-between ${
                  isPinned
                    ? "border-emerald-400/60 ring-1 ring-emerald-400/20"
                    : "border-white/10 hover:border-amber-400/50"
                }`}
              >
                {/* Ảnh thu gọn 1:1 tập trung nhân vật */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-950 border border-white/10">
                  <SubjectFocusImage
                    primaryUrl={card.images?.[0]}
                    secondaryUrl={card.posterUrl}
                    alt={card.nameVi}
                    className="transition-transform duration-300 group-hover:scale-106"
                  />

                  {/* Góc trên trái: Danh mục */}
                  <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/75 text-stone-200 backdrop-blur-md border border-white/15 max-w-[70%] truncate">
                    {card.category || "Động Vật"}
                  </span>

                  {/* Góc trên phải: Nút Ngôi Sao 1 chạm ghim/gỡ #products tức thì (không mở modal, không reload) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleShowOnHome(card);
                    }}
                    title={
                      isPinned
                        ? "Đang ghim trên Trang Chủ #products (Bấm để gỡ)"
                        : "Đưa thẻ này lên Trang Chủ #products"
                    }
                    className={`absolute top-1.5 right-1.5 z-10 h-7 w-7 rounded-full flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                      isPinned
                        ? "bg-emerald-500 text-stone-950 border-emerald-300 shadow-md"
                        : "bg-black/70 text-stone-300 hover:text-amber-300 border-white/20 backdrop-blur-md"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${isPinned ? "fill-stone-950" : ""}`} />
                  </button>

                  {/* Góc dưới trái: Badge nổi bật nếu có */}
                  {hasBadge && (
                    <span className="absolute bottom-1.5 left-1.5 z-10 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-sm max-w-[78%] truncate">
                      {card.badge}
                    </span>
                  )}
                </div>

                {/* Thông tin tóm tắt gọn gàng */}
                <div className="px-0.5 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3
                      className="font-black text-xs text-white group-hover:text-amber-300 transition-colors truncate"
                      title={card.nameVi}
                    >
                      {card.nameVi}
                    </h3>
                    <ChevronRight className="h-3.5 w-3.5 text-stone-500 group-hover:text-amber-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>

                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="text-stone-400 font-semibold truncate">
                      {card.nameEn}
                    </span>
                    <span className="font-mono font-black text-amber-400 shrink-0">
                      {formatVndCurrency(card.price || 219000)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Xem Chi Tiết & Thao Tác Đầy Đủ Cho Thẻ Được Chọn */}
      <ProductDetailModal
        card={activeDetailCard}
        onClose={() => setSelectedDetailSlug(null)}
        onToggleShowOnHome={onToggleShowOnHome}
        onLoadCardToCanvas={onLoadCardToCanvas}
        onOpenEditProduct={onOpenEditProduct}
        onDeleteProduct={onDeleteProduct}
      />
    </div>
  );
}
