"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Animal, ProductCategory } from "@/types/animal";
import { getAllAnimals } from "@/lib/animals";
import { ProductCard } from "@/components/landing/product-card";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
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
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Languages,
} from "lucide-react";

type PriceFilterType = "all" | "under220" | "220to250" | "above250";
type SortOptionType = "default" | "price-asc" | "price-desc" | "name-az";

export default function ProductsPage() {
  const [products, setProducts] = useState<Animal[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Bộ lọc danh mục & Tìm kiếm & Giá & Sắp xếp
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<PriceFilterType>("all");
  const [sortOption, setSortOption] = useState<SortOptionType>("default");
  const [languageFilter, setLanguageFilter] = useState<"all" | "en-vi" | "zh-vi">("all");

  // Đồng bộ thời gian thực khi có sản phẩm hoặc danh mục mới được cập nhật từ Studio /tools
  useEffect(() => {
    setIsMounted(true);
    const initialAnimals = getAllAnimals();
    setProducts(getMergedProducts(initialAnimals));
    setCategories(getProductCategories());

    // Đọc URL search params để tự động chọn đúng danh mục hoặc từ khóa khi chuyển hướng từ trang chủ
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const categoryParam = params.get("category");
      const searchParam = params.get("search");
      if (categoryParam) {
        setSelectedCategorySlug(categoryParam);
      }
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }

    const fetchServerProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProducts(getMergedProducts(json.data));
        }
      } catch (err) {
        console.warn("Lỗi tải sản phẩm từ API server, dùng dữ liệu local:", err);
      }
    };

    const fetchServerCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data);
        }
      } catch (err) {
        console.warn("Lỗi tải danh mục từ API server, dùng dữ liệu local:", err);
      }
    };

    fetchServerProducts();
    fetchServerCategories();

    const handleProductsUpdated = () => {
      fetchServerProducts();
      setProducts(getMergedProducts(initialAnimals));
    };

    const handleCategoriesUpdated = () => {
      fetchServerCategories();
      setCategories(getProductCategories());
    };

    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    window.addEventListener(CATEGORIES_UPDATED_EVENT, handleCategoriesUpdated);
    window.addEventListener("storage", handleProductsUpdated);

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, handleCategoriesUpdated);
      window.removeEventListener("storage", handleProductsUpdated);
    };
  }, []);

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

        // Lọc Tìm kiếm (EN, VI, ZH, IPA, Description)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchEn = product.nameEn.toLowerCase().includes(q);
          const matchVi = product.nameVi.toLowerCase().includes(q);
          const matchZh = product.nameZh ? product.nameZh.toLowerCase().includes(q) : false;
          const matchIpa = product.ipa ? product.ipa.toLowerCase().includes(q) : false;
          const matchDesc = product.description.toLowerCase().includes(q);
          if (!matchEn && !matchVi && !matchZh && !matchIpa && !matchDesc) return false;
        }

        // Lọc Khoảng giá
        const price = product.price || 0;
        if (priceFilter === "under220" && price >= 220000) return false;
        if (priceFilter === "220to250" && (price < 220000 || price > 250000)) return false;
        if (priceFilter === "above250" && price <= 250000) return false;

        // Lọc Song ngữ (Anh - Việt / Trung - Việt)
        if (languageFilter === "en-vi") {
          const matchEn = product.enableEnVi !== false && Boolean(product.nameEn && product.nameEn.trim());
          if (!matchEn) return false;
        } else if (languageFilter === "zh-vi") {
          const matchZh = product.enableZhVi === true || Boolean(product.nameZh && product.nameZh.trim());
          if (!matchZh) return false;
        }

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
        return 0;
      });
  }, [products, selectedCategorySlug, searchQuery, priceFilter, sortOption, languageFilter]);

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSelectedCategorySlug("all");
    setSearchQuery("");
    setPriceFilter("all");
    setSortOption("default");
    setLanguageFilter("all");
  };

  const hasActiveFilters =
    selectedCategorySlug !== "all" ||
    searchQuery.trim() !== "" ||
    priceFilter !== "all" ||
    sortOption !== "default" ||
    languageFilter !== "all";

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#FCFBF7]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Breadcrumbs & Nút Quay Lại Trang Chủ */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <nav className="flex items-center gap-2 text-xs font-bold text-stone-500" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-amber-700 transition-colors flex items-center gap-1">
                <span>Trang Chủ</span>
              </Link>
              <span>/</span>
              <span className="text-stone-900 font-black">Thư Viện Thẻ Bài AR</span>
            </nav>

            {/* Lối tắt quay về các bộ combo trên trang chủ */}
            <Link
              href="/#products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200/80 px-3 py-1.5 rounded-full border border-amber-300 transition-all active:scale-95 shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Xem Các Bộ Combo Có Sẵn (Trang Chủ)</span>
            </Link>
          </div>

          {/* Header Trang Thư Viện Thẻ Bài */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-950 border border-amber-300 shadow-2xs">
              <Layers className="h-4 w-4 text-amber-600" />
              <span>Kho Thẻ Học AR Đa Ngôn Ngữ</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900">
              Tất Cả Thẻ Bài Học Thông Minh Poly Cards
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              Khám phá chi tiết từng thẻ bài 3D thực tế ảo, lọc theo từng chủ đề và luyện nghe phát âm chuẩn 3 ngôn ngữ Anh - Việt - Trung.
            </p>
          </div>

          {/* ========================================================
              BỘ ĐIỀU KHIỂN & LỌC TÌM KIẾM TOÀN DIỆN (SEARCH & FILTERS)
             ======================================================== */}
          <div className="space-y-4">
            {/* HÀNG 1: TABS DANH MỤC CHỦ ĐỀ */}
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

            {/* HÀNG 2: THANH TÌM KIẾM + BỘ LỌC SONG NGỮ + KHOẢNG GIÁ + SẮP XẾP */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-3xl bg-white/95 p-3 sm:p-4 border-2 border-amber-200/80 shadow-md backdrop-blur-md">
              {/* Ô TÌM KIẾM THÔNG MINH */}
              <div className="relative md:col-span-4 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm thẻ (Sư tử, Lion, Jump, 狮子, /dɪr/...)"
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

              {/* BỘ LỌC SONG NGỮ */}
              <div className="md:col-span-3 flex items-center gap-2">
                <Languages className="h-4 w-4 text-amber-600 shrink-0 hidden sm:inline" />
                <div className="relative w-full">
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value as "all" | "en-vi" | "zh-vi")}
                    className="w-full appearance-none py-2.5 pl-3 pr-8 rounded-2xl bg-stone-50 border-2 border-stone-200 text-xs sm:text-sm font-bold text-stone-800 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="all">Tất cả song ngữ</option>
                    <option value="en-vi">Anh - Việt (EN-VI)</option>
                    <option value="zh-vi">Trung - Việt (ZH-VI)</option>
                  </select>
                  <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* BỘ LỌC KHOẢNG GIÁ */}
              <div className="md:col-span-3 flex items-center gap-2">
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

              {/* SẮP XẾP SẢN PHẨM */}
              <div className="md:col-span-2 relative w-full">
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

            {/* HÀNG 3: BÁO CÁO KẾT QUẢ & RESET */}
            <div className="flex items-center justify-between text-xs text-stone-600 px-2">
              <div className="font-medium">
                Hiển thị <strong className="text-amber-950 font-black">{filteredProducts.length}</strong> / {products.length} thẻ bài học thông minh
                {selectedCategorySlug !== "all" && (
                  <span className="ml-1 text-amber-700 font-bold">
                    • Danh mục: {categories.find((c) => c.slug === selectedCategorySlug)?.name || selectedCategorySlug}
                  </span>
                )}
                {languageFilter !== "all" && (
                  <span className="ml-1 text-amber-700 font-bold">
                    • Song ngữ: {languageFilter === "en-vi" ? "Anh - Việt" : "Trung - Việt"}
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
              LƯỚI SẢN PHẨM HOẶC TRẠNG THÁI TRỐNG (EMPTY STATE)
             ======================================================== */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {filteredProducts.map((animal) => (
                <ProductCard key={animal.id} animal={animal} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-amber-300 bg-white/80 p-8 sm:p-12 text-center shadow-xs">
              <div className="mx-auto h-16 w-16 rounded-3xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-stone-900 sm:text-xl">
                Không tìm thấy thẻ bài phù hợp
              </h3>
              <p className="mt-2 text-sm text-stone-600 max-w-md mx-auto">
                Không có thẻ bài nào khớp với từ khóa{" "}
                {searchQuery && <strong className="text-amber-700">&quot;{searchQuery}&quot;</strong>} hoặc tiêu chí bạn đã lọc.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-black text-stone-950 shadow-md hover:bg-amber-400 active:scale-95 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Xem Toàn Bộ Thẻ Bài</span>
              </button>
            </div>
          )}

          {/* Banner Giới Thiệu Tính Năng */}
          <div className="rounded-2xl border-2 border-amber-200/80 bg-white/90 p-5 text-center text-xs font-bold text-slate-700 shadow-sm backdrop-blur-md space-y-2">
            <p className="flex items-center justify-center gap-2 text-amber-900">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span>
                Mỗi thẻ bài đều tích hợp mã QR kích hoạt WebAR tức thì, âm thanh phát âm bản xứ 3 thứ tiếng và hình ảnh 3D hoạt họa sắc nét.
              </span>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
