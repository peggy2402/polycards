"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Animal, ProductCategory } from "@/types/animal";
import { CardComboPack, COMBO_PACKS } from "@/data/combos";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { PackDetailModal } from "@/components/order/pack-detail-modal";
import { formatVndCurrency } from "@/lib/formatters";
import { formatVnd } from "@/lib/pricing";
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
  ChevronRight,
  ShoppingBag,
  Eye,
  CheckCircle2,
  PackageCheck,
} from "lucide-react";

export default function ProductsPage() {
  const router = useRouter();

  // Danh sách các bộ thẻ có sẵn (kết hợp tĩnh + nạp từ MongoDB Atlas)
  const [packs, setPacks] = useState<CardComboPack[]>(COMBO_PACKS);
  const [cardsList, setCardsList] = useState<Animal[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal xem chi tiết bộ thẻ
  const [detailPack, setDetailPack] = useState<CardComboPack | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Bộ lọc
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<"all" | "en-vi" | "zh-vi">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    // 1. Tải thẻ lẻ để hiển thị trong modal chi tiết
    fetch("/api/products")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCardsList(json.data);
        }
      })
      .catch(() => {});

    // 2. Tải danh mục
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      })
      .catch(() => {});

    // 3. Tải các mã bộ mới từ MongoDB
    fetch("/api/pack-codes")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setPacks((prev) => {
            const existingCodes = new Set(prev.map((p) => p.packCode));
            const newPacks: CardComboPack[] = [];

            for (const item of res.data) {
              if (!existingCodes.has(item.code) && item.code.startsWith("POLY")) {
                const isZh = item.code.includes("ZHVI");
                newPacks.push({
                  id: `pack-${item.code.toLowerCase()}`,
                  name: item.name || `Bộ 30 Thẻ AR ${item.code}`,
                  packCode: item.code,
                  categoryName: item.categoryName || "Chủ đề Poly Cards",
                  categorySlug: item.categorySlug || "khac",
                  languageType: isZh ? "zh-vi" : "en-vi",
                  cardsCount: item.cardsCount || 30,
                  price: item.salePrice || 249000,
                  originalPrice: item.originalPrice || 299000,
                  discountPercent: item.discountPercent || 17,
                  badge: isZh ? "Song Ngữ Trung - Việt" : "Song Ngữ Anh - Việt",
                  imageSrc: "/images/cards/butterfly-card.png",
                  sampleSlug: "polycards",
                  description: item.description || `Bộ thẻ AR tương tác 3D đa góc nhìn sống động.`,
                  highlights: ["Thẻ AR 3D sống động", "Phát âm chuẩn", "Chống nước 100%"],
                });
              }
            }
            return newPacks.length > 0 ? [...prev, ...newPacks] : prev;
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Lọc danh sách bộ thẻ
  const filteredPacks = useMemo(() => {
    return packs.filter((p) => {
      // 1. Lọc theo danh mục
      if (selectedCategorySlug !== "all") {
        const matchesCategory =
          p.categorySlug === selectedCategorySlug ||
          (p.categorySlug === "all-vip" && selectedCategorySlug === "all");
        if (!matchesCategory) return false;
      }

      // 2. Lọc theo ngôn ngữ
      if (selectedLanguage !== "all") {
        if (p.languageType && p.languageType !== "all" && p.languageType !== selectedLanguage) {
          return false;
        }
      }

      // 3. Tìm kiếm theo tên hoặc mã
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          p.name.toLowerCase().includes(q) ||
          p.packCode.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [packs, selectedCategorySlug, selectedLanguage, searchQuery]);

  const handleOpenDetail = (pack: CardComboPack) => {
    setDetailPack(pack);
    setIsDetailModalOpen(true);
  };

  const handleSelectBuy = (pack: CardComboPack) => {
    router.push(`/order?pack=${encodeURIComponent(pack.id || pack.packCode)}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#FCFBF7]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Breadcrumbs & Nút Quay Lại */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <nav className="flex items-center gap-2 text-xs font-bold text-stone-500" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-amber-700 transition-colors flex items-center gap-1">
                <span>Trang Chủ</span>
              </Link>
              <span>/</span>
              <span className="text-stone-900 font-black">Các Bộ Thẻ Học AR</span>
            </nav>

            <Link
              href="/#products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200/80 px-3.5 py-1.5 rounded-full border border-amber-300 transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Xem Khối Combo Ghim Trang Chủ</span>
            </Link>
          </div>

          {/* Header Tiêu Đề */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-950 border border-amber-300 shadow-2xs">
              <Layers className="h-4 w-4 text-amber-600" />
              <span>Thư Viện Các Bộ Thẻ Học AR Poly Cards</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900">
              Chọn Bộ Thẻ Bài Thực Tế Ảo Thông Minh Cho Bé
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              Mỗi bộ thẻ gồm các chủ đề thế giới xung quanh sống động. Khách hàng có thể xem danh sách toàn bộ thẻ lẻ bên trong từng bộ trước khi đặt mua.
            </p>
          </div>

          {/* BỘ LỌC TÌM KIẾM & DANH MỤC */}
          <div className="space-y-4">
            {/* Tabs danh mục */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
              <button
                type="button"
                onClick={() => setSelectedCategorySlug("all")}
                className={`group flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-black transition-all shadow-sm active:scale-95 cursor-pointer ${
                  selectedCategorySlug === "all"
                    ? "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-amber-500/25 shadow-md border-2 border-amber-300"
                    : "bg-white text-stone-700 hover:bg-amber-100/70 border-2 border-amber-200/80"
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Tất Cả Các Bộ Thẻ</span>
                <span className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-stone-100 text-stone-700">
                  {packs.length}
                </span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`group flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-black transition-all shadow-sm active:scale-95 cursor-pointer ${
                    selectedCategorySlug === cat.slug
                      ? "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-amber-500/25 shadow-md border-2 border-amber-300"
                      : "bg-white text-stone-700 hover:bg-amber-100/70 border-2 border-amber-200/80"
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Thanh tìm kiếm & Lọc ngôn ngữ */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm bộ thẻ theo tên hoặc chủ đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Lọc ngôn ngữ */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-stone-200 shadow-2xs text-xs font-bold text-stone-600">
                <span className="px-2 text-stone-400 text-[11px]">Ngôn ngữ:</span>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("all")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedLanguage === "all" ? "bg-amber-500 text-stone-950" : "hover:text-stone-900"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("en-vi")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedLanguage === "en-vi" ? "bg-emerald-600 text-white" : "hover:text-stone-900"
                  }`}
                >
                  Anh - Việt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("zh-vi")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedLanguage === "zh-vi" ? "bg-purple-600 text-white" : "hover:text-stone-900"
                  }`}
                >
                  Trung - Việt
                </button>
              </div>
            </div>
          </div>

          {/* DANH SÁCH CÁC BỘ THẺ (GRID) */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-bold">Đang tải danh sách các bộ thẻ...</p>
            </div>
          ) : filteredPacks.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white border-2 border-dashed border-stone-200 p-8 space-y-3">
              <Layers className="h-10 w-10 text-stone-400 mx-auto" />
              <h4 className="text-sm font-bold text-stone-800">Không tìm thấy bộ thẻ nào phù hợp</h4>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategorySlug("all");
                  setSelectedLanguage("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold shadow-xs cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPacks.map((pack) => {
                const isVip = pack.cardsCount >= 120;

                return (
                  <div
                    key={pack.id || pack.packCode}
                    className="flex flex-col justify-between rounded-3xl bg-white border-2 border-amber-200/80 shadow-md hover:shadow-xl hover:border-amber-400 transition-all overflow-hidden group"
                  >
                    {/* Phần trên: Ảnh & Badges */}
                    <div>
                      <div className="relative aspect-16/10 w-full overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 p-4 flex items-center justify-center">
                        <div className="relative h-full w-48 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
                          <Image
                            src={pack.imageSrc || "/images/cards/butterfly-card.png"}
                            alt={pack.name}
                            fill
                            className="object-cover rounded-xl"
                          />
                        </div>

                        {/* Badge % Khuyến mãi */}
                        {pack.discountPercent > 0 && (
                          <div className="absolute top-3 left-3 bg-rose-600 text-white font-black text-[11px] px-2.5 py-1 rounded-full shadow-md">
                            -{pack.discountPercent}%
                          </div>
                        )}

                        {/* Số thẻ trong bộ */}
                        <div className="absolute top-3 right-3 bg-stone-950/80 backdrop-blur-xs text-white font-bold text-[10px] px-2.5 py-1 rounded-full">
                          {pack.cardsCount} Thẻ AR
                        </div>
                      </div>

                      {/* Thông tin bộ */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {pack.badge && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                              {pack.badge}
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-stone-500">
                            {pack.categoryName}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-stone-950 group-hover:text-amber-800 transition-colors line-clamp-2">
                          {pack.name}
                        </h3>

                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-medium">
                          {pack.description}
                        </p>
                      </div>
                    </div>

                    {/* Phần dưới: Giá tiền & Nút hành động */}
                    <div className="p-5 pt-0 space-y-3.5 border-t border-stone-100 mt-2">
                      <div className="flex items-baseline justify-between pt-3">
                        <div>
                          <span className="text-xs text-stone-400 block font-medium">Giá ưu đãi:</span>
                          <span className="text-xl sm:text-2xl font-black text-amber-700">
                            {formatVndCurrency(pack.price)}
                          </span>
                        </div>
                        {pack.originalPrice && (
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block">Giá gốc:</span>
                            <span className="text-xs text-stone-400 line-through font-mono">
                              {formatVndCurrency(pack.originalPrice)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Các nút bấm */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(pack)}
                          className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Xem Chi Tiết</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectBuy(pack)}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Chọn Mua</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal Xem Danh Sách Toàn Bộ Thẻ Lẻ Trong Bộ */}
      <PackDetailModal
        pack={detailPack}
        isOpen={isDetailModalOpen}
        cardsList={cardsList}
        onClose={() => setIsDetailModalOpen(false)}
        onSelectAndAdd={(pack) => handleSelectBuy(pack)}
      />

      <Footer />
    </div>
  );
}
