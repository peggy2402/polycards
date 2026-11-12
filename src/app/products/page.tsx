"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Animal, ProductCategory } from "@/types/animal";
import { CardComboPack, COMBO_PACKS } from "@/data/combos";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { PackDetailModal } from "@/components/order/pack-detail-modal";
import { formatVndCurrency } from "@/lib/formatters";
import { computePackDynamicPricing } from "@/lib/pricing";
import {
  Sparkles,
  Layers,
  Search,
  X,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";

export default function ProductsPage() {
  const router = useRouter();

  // Danh sách các bộ thẻ có sẵn (kết hợp tĩnh + nạp từ MongoDB Atlas)
  const [packs, setPacks] = useState<CardComboPack[]>(() =>
    COMBO_PACKS.filter((p) => (p.cardsCount || 0) > 0 && !["POLY30-NGHENGHIEP", "POLY30-HANHDONG"].includes(p.packCode))
  );
  const [cardsList, setCardsList] = useState<Animal[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal xem chi tiết thẻ trong bộ
  const [detailPack, setDetailPack] = useState<CardComboPack | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Bộ lọc
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<"all" | "en-vi" | "zh-vi">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/categories").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/pack-codes").then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([productsRes, catsRes, packsRes]) => {
      const allCards: Animal[] = Array.isArray(productsRes?.data) ? productsRes.data : [];
      if (allCards.length > 0) setCardsList(allCards);

      if (Array.isArray(catsRes?.data)) setCategories(catsRes.data);

      const packConfigsList: any[] = Array.isArray(packsRes?.data) ? packsRes.data : [];
      const packConfigMap = new Map<string, any>();
      for (const p of packConfigsList) {
        if (p?.code) packConfigMap.set(p.code.toUpperCase(), p);
      }

      setPacks((prev) => {
        // Cập nhật giá động và ảnh thumbnail cho các bộ hiện có
        const updated = prev.map((pack) => {
          const cfg = packConfigMap.get(pack.packCode.toUpperCase());
          const dynamicPricing = computePackDynamicPricing(pack.packCode, cfg, allCards);

          return {
            ...pack,
            imageSrc: cfg?.imageSrc || pack.imageSrc,
            cardsCount: dynamicPricing.cardsCount,
            price: dynamicPricing.price,
            originalPrice: dynamicPricing.originalPrice,
            discountPercent: dynamicPricing.discountPercent,
          };
        });

        // Bổ sung các mã bộ mới từ database nếu chưa có (chỉ thêm nếu có thẻ thực tế trong kho)
        const existingCodes = new Set(updated.map((p) => p.packCode.toUpperCase()));
        const newPacks: CardComboPack[] = [];

        for (const item of packConfigsList) {
          const codeUpper = (item.code || "").toUpperCase();
          if (!existingCodes.has(codeUpper) && codeUpper.startsWith("POLY")) {
            const dynamicPricing = computePackDynamicPricing(item.code, item, allCards);

            if (dynamicPricing.cardsCount > 0) {
              const isZh = codeUpper.includes("ZHVI");

              newPacks.push({
                id: `pack-${item.code.toLowerCase()}`,
                name: item.name || `Bộ 30 Thẻ AR ${item.code}`,
                packCode: item.code,
                categoryName: item.categoryName || "Chủ đề Poly Cards",
                categorySlug: item.categorySlug || "khac",
                languageType: isZh ? "zh-vi" : "en-vi",
                cardsCount: dynamicPricing.cardsCount,
                price: dynamicPricing.price,
                originalPrice: dynamicPricing.originalPrice,
                discountPercent: dynamicPricing.discountPercent,
                badge: isZh ? "Song Ngữ Trung - Việt" : "Song Ngữ Anh - Việt",
                imageSrc: item.imageSrc || "/images/cards/butterfly-card.png",
                sampleSlug: "polycards",
                description: item.description || `Bộ thẻ AR tương tác 3D đa góc nhìn sống động.`,
                highlights: ["Thẻ AR 3D sống động", "Phát âm chuẩn", "Chống nước 100%"],
              });
            }
          }
        }

        const combined = newPacks.length > 0 ? [...updated, ...newPacks] : updated;
        return combined.filter((p) => (p.cardsCount || 0) > 0);
      });
      setIsLoading(false);
    });
  }, []);

  // Lọc danh sách bộ thẻ
  const filteredPacks = useMemo(() => {
    return packs
      .filter((p) => (p.cardsCount || 0) > 0)
      .filter((p) => {
        // 1. Lọc theo danh mục (hỗ trợ bidirectional matching chuẩn xác)
        if (selectedCategorySlug !== "all") {
          const cat = selectedCategorySlug.toLowerCase();
          const pCat = (p.categorySlug || "").toLowerCase();
          const matchesCategory =
            pCat === cat ||
            (pCat === "all-vip" && cat === "all") ||
            ((cat === "xe-co" || cat === "phuong-tien") && (pCat === "xe-co" || pCat === "phuong-tien")) ||
            ((cat === "hoa-qua" || cat === "trai-cay") && (pCat === "hoa-qua" || pCat === "trai-cay"));
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

  // Mở modal xem danh sách thẻ trong bộ
  const handleOpenDetail = (pack: CardComboPack) => {
    setDetailPack(pack);
    setIsDetailModalOpen(true);
  };

  // Chuyển hướng đặt hàng
  const handleSelectBuy = (pack: CardComboPack) => {
    router.push(`/order?pack=${encodeURIComponent(pack.id || pack.packCode)}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#FCFBF7]">
      <Navbar />

      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
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
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-950 border border-amber-300 shadow-2xs">
              <Layers className="h-4 w-4 text-amber-600" />
              <span>Thư Viện Các Bộ Thẻ Học AR Poly Cards</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
              Chọn Bộ Thẻ Bài Thực Tế Ảo Thông Minh Cho Bé
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl mx-auto">
              Nhấp trực tiếp vào bất kỳ bộ thẻ nào để xem chi tiết danh sách tất cả các thẻ lẻ bên trong.
            </p>
          </div>

          {/* BỘ LỌC TÌM KIẾM & DANH MỤC */}
          <div className="space-y-3.5">
            {/* Tabs danh mục */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
              <button
                type="button"
                onClick={() => setSelectedCategorySlug("all")}
                className={`group flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer ${
                  selectedCategorySlug === "all"
                    ? "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-amber-500/25 shadow-md border-2 border-amber-300"
                    : "bg-white text-stone-700 hover:bg-amber-100/70 border border-stone-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Tất Cả Các Bộ</span>
                <span className="ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold bg-stone-100 text-stone-700">
                  {packs.length}
                </span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`group flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer ${
                    selectedCategorySlug === cat.slug ||
                    (selectedCategorySlug === "xe-co" && cat.slug === "phuong-tien") ||
                    (selectedCategorySlug === "phuong-tien" && cat.slug === "xe-co") ||
                    (selectedCategorySlug === "hoa-qua" && cat.slug === "trai-cay") ||
                    (selectedCategorySlug === "trai-cay" && cat.slug === "hoa-qua")
                      ? "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-amber-500/25 shadow-md border-2 border-amber-300"
                      : "bg-white text-stone-700 hover:bg-amber-100/70 border border-stone-200"
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
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white border border-stone-200 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 shadow-2xs"
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
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                    selectedLanguage === "all" ? "bg-amber-500 text-stone-950" : "hover:text-stone-900"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("en-vi")}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                    selectedLanguage === "en-vi" ? "bg-emerald-600 text-white" : "hover:text-stone-900"
                  }`}
                >
                  Anh - Việt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("zh-vi")}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                    selectedLanguage === "zh-vi" ? "bg-purple-600 text-white" : "hover:text-stone-900"
                  }`}
                >
                  Trung - Việt
                </button>
              </div>
            </div>
          </div>

          {/* DANH SÁCH BỘ THẺ: 5 BỘ / HÀNG */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-stone-200/60 animate-pulse" />
              ))}
            </div>
          ) : filteredPacks.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white/50 p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Không tìm thấy bộ thẻ nào phù hợp</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển danh mục.
              </p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredPacks.map((pack) => {
                return (
                  <div
                    key={pack.id || pack.packCode}
                    onClick={() => handleOpenDetail(pack)}
                    className="flex flex-col justify-between rounded-2xl bg-white border border-stone-200/90 hover:border-amber-400 shadow-xs hover:shadow-md transition-all overflow-hidden group cursor-pointer relative"
                  >
                    {/* Phần trên: Ảnh & Badges */}
                    <div>
                      <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100 flex items-center justify-center p-2.5">
                        <img
                          src={pack.imageSrc || "/images/cards/butterfly-card.png"}
                          alt={pack.name}
                          className="h-full w-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Badge % Khuyến mãi */}
                        {pack.discountPercent > 0 && (
                          <div className="absolute top-2 left-2 bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-xs">
                            -{pack.discountPercent}%
                          </div>
                        )}

                        {/* Số thẻ trong bộ */}
                        <div className="absolute bottom-2 left-2 bg-stone-950/75 backdrop-blur-xs text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                          {pack.cardsCount} Thẻ AR
                        </div>
                      </div>

                      {/* Thông tin bộ thẻ */}
                      <div className="p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pack.badge && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300/80">
                              {pack.badge.includes("Trung") ? "Trung - Việt" : pack.badge.includes("Anh") ? "Anh - Việt" : pack.badge}
                            </span>
                          )}
                          <span className="text-[9px] font-medium text-stone-500 truncate max-w-[100px]">
                            {pack.categoryName}
                          </span>
                        </div>

                        <h3 className="text-xs sm:text-sm font-black text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                          {pack.name}
                        </h3>

                        <p className="text-[11px] text-stone-500 line-clamp-2 leading-normal">
                          {pack.description}
                        </p>
                      </div>
                    </div>

                    {/* Phần dưới: Giá tiền & Nút Đặt mua */}
                    <div className="p-3 pt-0 space-y-2 border-t border-stone-100 mt-1">
                      <div className="flex items-baseline justify-between pt-2">
                        <div>
                          <span className="text-xs sm:text-sm font-black text-amber-700">
                            {formatVndCurrency(pack.price)}
                          </span>
                        </div>
                        {pack.originalPrice && pack.originalPrice > pack.price && (
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 line-through font-mono">
                              {formatVndCurrency(pack.originalPrice)}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBuy(pack);
                        }}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Chọn Mua</span>
                      </button>
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
