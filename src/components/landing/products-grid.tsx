"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Animal, ProductCategory } from "@/types/animal";
import { ProductCard } from "./product-card";
import {
  getMergedProducts,
  getProductCategories,
  PRODUCTS_UPDATED_EVENT,
  CATEGORIES_UPDATED_EVENT,
} from "@/lib/products-store";
import {
  Sparkles,
  Layers,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  RotateCcw,
  PawPrint,
  Activity,
  Car,
  Apple,
  Check,
} from "lucide-react";

interface ProductsGridProps {
  animals: Animal[];
}

type PriceFilterType = "all" | "under220" | "220to250" | "above250";
type SortOptionType = "default" | "price-asc" | "price-desc" | "name-az";

export function ProductsGrid({ animals: initialAnimals }: ProductsGridProps) {
  // 1. Quản lý danh sách sản phẩm & danh mục
  const [products, setProducts] = useState<Animal[]>(initialAnimals);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // 2. Bộ lọc danh mục & Tìm kiếm & Giá
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<PriceFilterType>("all");
  const [sortOption, setSortOption] = useState<SortOptionType>("default");

  // Đồng bộ thời gian thực khi có sản phẩm hoặc danh mục mới được cập nhật từ /tools
  useEffect(() => {
    setIsMounted(true);
    setProducts(getMergedProducts(initialAnimals));
    setCategories(getProductCategories());

    const handleProductsUpdated = () => {
      setProducts(getMergedProducts(initialAnimals));
    };

    const handleCategoriesUpdated = () => {
      setCategories(getProductCategories());
    };

    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    window.addEventListener(CATEGORIES_UPDATED_EVENT, handleCategoriesUpdated);
    window.addEventListener("storage", handleProductsUpdated);

    // Initial load on mount
    handleProductsUpdated();
    handleCategoriesUpdated();

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, handleCategoriesUpdated);
      window.removeEventListener("storage", handleProductsUpdated);
    };
  }, [initialAnimals]);

  // Icon hiển thị tương ứng với từng danh mục
  const renderCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case "PawPrint":
        return <PawPrint className="h-4 w-4" />;
      case "Activity":
        return <Activity className="h-4 w-4" />;
      case "Car":
        return <Car className="h-4 w-4" />;
      case "Apple":
        return <Apple className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  // Tính số lượng thẻ bài trong từng danh mục
  const categoryCounts = useMemo(() => {
    const counts: { [slug: string]: number } = { all: products.length };
    products.forEach((p) => {
      const catSlug = p.categorySlug || "dong-vat";
      counts[catSlug] = (counts[catSlug] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Lọc và Sắp xếp danh sách sản phẩm
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Lọc Danh mục
        if (selectedCategorySlug !== "all") {
          const matchSlug = product.categorySlug === selectedCategorySlug;
          const matchName = product.category?.toLowerCase() === selectedCategorySlug.toLowerCase();
          if (!matchSlug && !matchName) return false;
        }

        // Lọc Tìm kiếm
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchEn = product.nameEn.toLowerCase().includes(q);
          const matchVi = product.nameVi.toLowerCase().includes(q);
          const matchZh = product.nameZh ? product.nameZh.toLowerCase().includes(q) : false;
          const matchDesc = product.description.toLowerCase().includes(q);
          if (!matchEn && !matchVi && !matchZh && !matchDesc) return false;
        }

        // Lọc Khoảng giá
        const price = product.price || 0;
        if (priceFilter === "under220" && price >= 220000) return false;
        if (priceFilter === "220to250" && (price < 220000 || price > 250000)) return false;
        if (priceFilter === "above250" && price <= 250000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "price-asc") {
          return (a.price || 0) - (b.price || 0);
        }
        if (sortOption === "price-desc") {
          return (b.price || 0) - (a.price || 0);
        }
        if (sortOption === "name-az") {
          return a.nameEn.localeCompare(b.nameEn);
        }
        return 0; // default order
      });
  }, [products, selectedCategorySlug, searchQuery, priceFilter, sortOption]);

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSelectedCategorySlug("all");
    setSearchQuery("");
    setPriceFilter("all");
    setSortOption("default");
  };

  const hasActiveFilters =
    selectedCategorySlug !== "all" ||
    searchQuery.trim() !== "" ||
    priceFilter !== "all" ||
    sortOption !== "default";

  return (
    <section
      id="products"
      className="scroll-mt-20 py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/30 to-sky-50/20 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-950 border border-amber-300">
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Bộ Sưu Tập Thẻ Học Thông Minh</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Khám Phá Thế Giới Động Vật Poly Cards
          </h2>

          <p className="mt-3 text-base text-stone-700 sm:text-lg">
            Thẻ bài chất liệu chống nước cao cấp, hình ảnh 3D hoạt hình sống động, tích hợp phát âm chuẩn 3 ngôn ngữ (Anh - Việt - Trung) và mã QR AR.
          </p>
        </div>

        {/* ========================================================
            BỘ ĐIỀU KHIỂN & LỌC TÌM KIẾM TOÀN DIỆN (SEARCH & FILTERS)
           ======================================================== */}
        <div className="mt-10 space-y-4">
          {/* HÀNG 1: TABS DANH MỤC SẢN PHẨM (CATEGORY TABS) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
            {/* Nút "Tất cả" */}
            <button
              type="button"
              onClick={() => setSelectedCategorySlug("all")}
              className={`group flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-black transition-all shadow-sm active:scale-95 ${
                selectedCategorySlug === "all"
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-amber-500/25 shadow-md scale-102 border-2 border-amber-300"
                  : "bg-white text-stone-700 hover:bg-amber-100/70 border-2 border-amber-200/80"
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-600 group-hover:rotate-12 transition-transform" />
              <span>Tất Cả Thẻ Bài</span>
              <span
                suppressHydrationWarning
                className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  selectedCategorySlug === "all"
                    ? "bg-stone-950 text-amber-300"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {categoryCounts["all"] || products.length}
              </span>
            </button>

            {/* Các danh mục động từ hệ thống */}
            {categories.map((cat) => {
              const count = categoryCounts[cat.slug] || 0;
              const isSelected = selectedCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`group flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-black transition-all shadow-sm active:scale-95 ${
                    isSelected
                      ? "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-amber-500/25 shadow-md scale-102 border-2 border-amber-300"
                      : "bg-white text-stone-700 hover:bg-amber-100/70 border-2 border-amber-200/80"
                  }`}
                >
                  <span className={isSelected ? "text-stone-950" : "text-amber-600"}>
                    {renderCategoryIcon(cat.iconName)}
                  </span>
                  <span>{cat.name}</span>
                  <span
                    suppressHydrationWarning
                    className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isSelected
                        ? "bg-stone-950 text-amber-300"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* HÀNG 2: THANH TÌM KIẾM + BỘ LỌC KHOẢNG GIÁ + SẮP XẾP */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-3xl bg-white/95 p-3 sm:p-4 border-2 border-amber-200/80 shadow-md backdrop-blur-md">
            {/* Ô TÌM KIẾM THÔNG MINH (Search Bar - Width: 5/12) */}
            <div className="relative md:col-span-5 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm thẻ (Sư tử, Cat, Jump, 狮子...)"
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-stone-50 border-2 border-stone-200 text-xs sm:text-sm text-stone-900 placeholder-stone-400 font-medium focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* BỘ LỌC KHOẢNG GIÁ (Price Range - Width: 4/12) */}
            <div className="md:col-span-4 flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600 shrink-0 hidden sm:inline" />
              <div className="relative w-full">
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value as PriceFilterType)}
                  className="w-full appearance-none py-2.5 pl-3 pr-8 rounded-2xl bg-stone-50 border-2 border-stone-200 text-xs sm:text-sm font-bold text-stone-800 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">Tất cả mức giá</option>
                  <option value="under220">Dưới 220.000 đ</option>
                  <option value="220to250">220.000 đ - 250.000 đ</option>
                  <option value="above250">Trên 250.000 đ</option>
                </select>
                <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* SẮP XẾP SẢN PHẨM (Sorting - Width: 3/12) */}
            <div className="md:col-span-3 relative w-full">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOptionType)}
                className="w-full appearance-none py-2.5 pl-3 pr-8 rounded-2xl bg-stone-50 border-2 border-stone-200 text-xs sm:text-sm font-bold text-stone-800 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all cursor-pointer"
              >
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="price-asc">Giá: Thấp đến cao</option>
                <option value="price-desc">Giá: Cao đến thấp</option>
                <option value="name-az">Tên: A đến Z</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
            </div>
          </div>

          {/* HÀNG 3: THANH THÔNG BÁO SỐ LƯỢNG & NÚT RESET BỘ LỌC */}
          <div className="flex items-center justify-between text-xs text-stone-600 px-2">
            <div className="font-medium">
              Hiển thị <strong className="text-amber-950 font-black">{filteredProducts.length}</strong> / {products.length} thẻ bài học thông minh
              {selectedCategorySlug !== "all" && (
                <span className="ml-1 text-amber-700 font-bold">
                  • Danh mục: {categories.find((c) => c.slug === selectedCategorySlug)?.name || selectedCategorySlug}
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 font-bold text-amber-700 hover:text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-full transition-colors active:scale-95"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            DANH SÁCH SẢN PHẨM HOẶC EMPTY STATE
           ======================================================== */}
        {filteredProducts.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {filteredProducts.map((animal) => (
              <ProductCard key={animal.id} animal={animal} />
            ))}
          </div>
        ) : (
          /* Empty State khi tìm kiếm / lọc không ra kết quả */
          <div className="mt-12 rounded-3xl border-2 border-dashed border-amber-300 bg-white/80 p-8 sm:p-12 text-center shadow-xs">
            <div className="mx-auto h-16 w-16 rounded-3xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-stone-900 sm:text-xl">
              Không tìm thấy thẻ bài phù hợp
            </h3>
            <p className="mt-2 text-sm text-stone-600 max-w-md mx-auto">
              Không có sản phẩm nào khớp với từ khóa{" "}
              {searchQuery && <strong className="text-amber-700">&quot;{searchQuery}&quot;</strong>} hoặc các bộ lọc giá tiền bạn đã chọn.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-black text-stone-950 shadow-md hover:bg-amber-400 active:scale-95 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Xem Tất Cả Thẻ Bài</span>
            </button>
          </div>
        )}

        {/* Note under grid */}
        <div className="mt-12 rounded-2xl border-2 border-amber-200/80 bg-white/90 p-4 text-center text-xs font-bold text-slate-700 shadow-sm backdrop-blur-md">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              Mỗi thẻ bài đều đi kèm mã QR riêng biệt và quyền truy cập không giới hạn vào trải nghiệm AR tương tác 3D.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
