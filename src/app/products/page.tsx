"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Animal, ProductCategory } from "@/types/animal";
import { getAllAnimals } from "@/lib/animals";
import { normalizeCategorySlug } from "@/lib/activation";
import { ProductCard } from "@/components/landing/product-card";
import { ProductListItem } from "@/components/landing/product-list-item";
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
  Languages,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type PriceFilterType = "all" | "under220" | "220to250" | "above250";
type SortOptionType = "default" | "price-asc" | "price-desc" | "name-az";

export default function ProductsPage() {
  const [products, setProducts] = useState<Animal[]>(() => {
    if (typeof window !== "undefined") {
      return getMergedProducts(getAllAnimals());
    }
    return getAllAnimals();
  });
  const [categories, setCategories] = useState<ProductCategory[]>(() => getProductCategories());

  // Bộ lọc danh mục & Tìm kiếm & Giá & Sắp xếp
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<PriceFilterType>("all");
  const [sortOption, setSortOption] = useState<SortOptionType>("default");
  const [languageFilter, setLanguageFilter] = useState<"all" | "en-vi" | "zh-vi">("all");

  // Chế độ xem: Dạng Lưới 4 thẻ 1 hàng ("grid") hoặc Dạng Danh Sách ("list")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(16);
  const resultsTopRef = useRef<HTMLDivElement>(null);

  // Đồng bộ thời gian thực khi có sản phẩm hoặc danh mục mới được cập nhật từ Studio /tools
  useEffect(() => {
    // Khôi phục tùy chọn chế độ xem và URL params trên client
    const frameId = requestAnimationFrame(() => {
      try {
        const savedView = localStorage.getItem("poly_products_page_view_mode");
        if (savedView === "grid" || savedView === "list") {
          setViewMode(savedView);
        }
        const savedPageSize = localStorage.getItem("poly_products_page_size");
        if (savedPageSize && !isNaN(Number(savedPageSize))) {
          setPageSize(Number(savedPageSize));
        }
      } catch {}

      // Đọc URL search params để tự động chọn đúng danh mục hoặc từ khóa khi chuyển hướng từ trang chủ
      const params = new URLSearchParams(window.location.search);
      const categoryParam = params.get("category");
      const searchParam = params.get("search");
      if (categoryParam) {
        setSelectedCategorySlug(categoryParam);
      }
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    });

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
      setProducts(getMergedProducts(getAllAnimals()));
    };

    const handleCategoriesUpdated = () => {
      fetchServerCategories();
      setCategories(getProductCategories());
    };

    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    window.addEventListener(CATEGORIES_UPDATED_EVENT, handleCategoriesUpdated);
    window.addEventListener("storage", handleProductsUpdated);

    return () => {
      cancelAnimationFrame(frameId);
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

  // Tính số lượng thẻ bài trong từng danh mục chuẩn xác (hỗ trợ cả slug chuẩn, slug biến thể và tên danh mục)
  const categoryCounts = useMemo(() => {
    const counts: { [slug: string]: number } = { all: products.length };
    categories.forEach((cat) => {
      const targetSlug = cat.slug;
      const targetNorm = normalizeCategorySlug(cat.slug);
      const count = products.filter((p) => {
        const pSlugNorm = normalizeCategorySlug(p.categorySlug);
        const pCatNorm = normalizeCategorySlug(p.category);
        return (
          p.categorySlug === targetSlug ||
          pSlugNorm === targetNorm ||
          pCatNorm === targetNorm ||
          (p.category && p.category.toLowerCase() === cat.name.toLowerCase())
        );
      }).length;
      counts[targetSlug] = count;
    });
    return counts;
  }, [products, categories]);

  // Lọc và Sắp xếp danh sách sản phẩm
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Lọc Danh mục chuẩn hóa
        if (selectedCategorySlug !== "all") {
          const selectedCat = categories.find((c) => c.slug === selectedCategorySlug);
          const targetNorm = normalizeCategorySlug(selectedCategorySlug);
          const pSlugNorm = normalizeCategorySlug(product.categorySlug);
          const pCatNorm = normalizeCategorySlug(product.category);

          const matchesCategory =
            product.categorySlug === selectedCategorySlug ||
            pSlugNorm === targetNorm ||
            pCatNorm === targetNorm ||
            (selectedCat && product.category?.toLowerCase() === selectedCat.name.toLowerCase());

          if (!matchesCategory) return false;
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
          const matchZh = Boolean(product.enableZhVi);
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
  }, [products, categories, selectedCategorySlug, searchQuery, priceFilter, sortOption, languageFilter]);

  // Xử lý thay đổi các bộ lọc kết hợp đặt lại về trang 1
  const handleSelectCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleLanguageChange = (lang: "all" | "en-vi" | "zh-vi") => {
    setLanguageFilter(lang);
    setCurrentPage(1);
  };

  const handlePriceFilterChange = (filter: PriceFilterType) => {
    setPriceFilter(filter);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: SortOptionType) => {
    setSortOption(sort);
    setCurrentPage(1);
  };

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safeCurrentPage, pageSize]);

  const startItemIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemIndex = Math.min(safeCurrentPage * pageSize, totalItems);

  const pageNumbers = useMemo(() => {
    const pages: (number | "dots")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (safeCurrentPage > 3) pages.push("dots");
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safeCurrentPage < totalPages - 2) pages.push("dots");
    pages.push(totalPages);
    return pages;
  }, [totalPages, safeCurrentPage]);

  const handleChangeViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("poly_products_page_view_mode", mode);
    } catch {}
  };

  const handleChangePageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    try {
      localStorage.setItem("poly_products_page_size", String(size));
    } catch {}
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSelectedCategorySlug("all");
    setSearchQuery("");
    setPriceFilter("all");
    setSortOption("default");
    setLanguageFilter("all");
    setCurrentPage(1);
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
                onClick={() => handleSelectCategory("all")}
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
                    onClick={() => handleSelectCategory(cat.slug)}
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
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tìm thẻ (Sư tử, Lion, Jump, 狮子, /dɪr/...)"
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-stone-50 border-2 border-stone-200 text-xs sm:text-sm text-stone-900 placeholder-stone-400 font-medium focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
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
                    onChange={(e) => handleLanguageChange(e.target.value as "all" | "en-vi" | "zh-vi")}
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
                    onChange={(e) => handlePriceFilterChange(e.target.value as PriceFilterType)}
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
                  onChange={(e) => handleSortChange(e.target.value as SortOptionType)}
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

            {/* HÀNG 3: THANH CÔNG CỤ HIỂN THỊ (VIEW MODE, SỐ THẺ TRÊN TRANG, KẾT QUẢ, RESET) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600 px-1 pt-1">
              <div className="font-medium flex items-center flex-wrap gap-x-2 gap-y-1">
                <span>
                  Hiển thị <strong className="text-amber-950 font-black">{startItemIndex} - {endItemIndex}</strong> trên tổng số <strong className="text-amber-950 font-black">{totalItems}</strong> thẻ bài
                </span>
                {selectedCategorySlug !== "all" && (
                  <span className="text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                    {categories.find((c) => c.slug === selectedCategorySlug)?.name || selectedCategorySlug}
                  </span>
                )}
                {languageFilter !== "all" && (
                  <span className="text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                    {languageFilter === "en-vi" ? "Anh - Việt" : "Trung - Việt"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
                {/* Bộ chọn số lượng thẻ trên 1 trang */}
                <div className="flex items-center gap-1.5 text-stone-600">
                  <span className="hidden sm:inline font-bold text-[11px] text-stone-500">Mỗi trang:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handleChangePageSize(Number(e.target.value))}
                    className="py-1.5 px-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-amber-400 cursor-pointer shadow-2xs"
                  >
                    <option value={12}>12 thẻ</option>
                    <option value={16}>16 thẻ</option>
                    <option value={24}>24 thẻ</option>
                    <option value={32}>32 thẻ</option>
                    <option value={48}>48 thẻ</option>
                  </select>
                </div>

                {/* Nút chuyển đổi View Mode: Lưới 4 thẻ vs Danh Sách */}
                <div className="flex items-center bg-stone-200/80 p-0.5 rounded-xl border border-stone-300/80 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleChangeViewMode("grid")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                      viewMode === "grid"
                        ? "bg-white text-stone-900 shadow-xs scale-102"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                    title="Hiển thị dạng lưới 4 thẻ 1 hàng"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-amber-600" />
                    <span className="hidden md:inline">Lưới 4</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeViewMode("list")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                      viewMode === "list"
                        ? "bg-white text-stone-900 shadow-xs scale-102"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                    title="Hiển thị dạng danh sách chi tiết"
                  >
                    <List className="h-3.5 w-3.5 text-amber-600" />
                    <span className="hidden md:inline">Danh sách</span>
                  </button>
                </div>

                {/* Nút Reset bộ lọc */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-1.5 rounded-xl border border-amber-300 transition-colors active:scale-95 shadow-2xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Đặt lại</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ANCHOR CUỘN TRANG LÊN ĐẦU KHI CHUYỂN TRANG */}
          <div ref={resultsTopRef} className="-mt-4 scroll-mt-24" />

          {/* ========================================================
              LƯỚI HOẶC DANH SÁCH SẢN PHẨM HOẶC TRẠNG THÁI TRỐNG
             ======================================================== */}
          {totalItems > 0 ? (
            <div className="space-y-8">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-4.5">
                  {paginatedProducts.map((animal) => (
                    <ProductCard key={animal.id} animal={animal} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:gap-3.5">
                  {paginatedProducts.map((animal) => (
                    <ProductListItem key={animal.id} animal={animal} />
                  ))}
                </div>
              )}

              {/* PHÂN TRANG (PAGINATION) */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-amber-200/80">
                  <div className="text-xs text-stone-500 font-semibold order-2 sm:order-1">
                    Trang <span className="text-amber-950 font-black">{safeCurrentPage}</span> trên tổng số <span className="text-amber-950 font-black">{totalPages}</span> trang ({totalItems} thẻ bài)
                  </div>

                  <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                    {/* Trang đầu */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(1)}
                      disabled={safeCurrentPage === 1}
                      className="p-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-2xs"
                      title="Trang đầu"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>

                    {/* Trang trước */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
                      disabled={safeCurrentPage === 1}
                      className="p-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-2xs"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Các số trang */}
                    {pageNumbers.map((p, idx) => {
                      if (p === "dots") {
                        return (
                          <span key={`dots-${idx}`} className="px-2 text-stone-400 font-bold select-none">
                            ...
                          </span>
                        );
                      }
                      const isActive = p === safeCurrentPage;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`min-w-[36px] h-9 px-3 rounded-xl text-xs font-black transition-all active:scale-95 shadow-2xs ${
                            isActive
                              ? "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 border-2 border-amber-400 shadow-amber-500/20 shadow-md font-black"
                              : "bg-white text-stone-700 border border-stone-200 hover:bg-amber-50 hover:border-amber-300"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    {/* Trang sau */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="p-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-2xs"
                      title="Trang sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Trang cuối */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={safeCurrentPage === totalPages}
                      className="p-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-2xs"
                      title="Trang cuối"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
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
