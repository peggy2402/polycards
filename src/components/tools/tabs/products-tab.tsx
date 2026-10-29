"use client";

import React, { useState, useMemo } from "react";
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
  PackageCheck,
  CheckSquare,
  Square,
  Check,
  FolderArchive,
  FolderPlus,
  ListPlus,
  FileDown,
  Download,
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
  onBatchAssignPackCode: (slugs: string[], packCode: string) => Promise<void> | void;
  onUpdatePackCode?: (card: Animal, newPackCode: string) => Promise<void> | void;
  onAddToPrintQueue?: (card: Animal) => void;
  onBatchAddToPrintQueue?: (cards: Animal[]) => void;
  onDownloadSingleCard?: (card: Animal) => void;
  onDownloadZipForCards?: (cards: Animal[], customZipName?: string) => Promise<void> | void;
  printQueueCount?: number;
  isGeneratingZip?: boolean;
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
  onBatchAssignPackCode,
  onUpdatePackCode,
  onAddToPrintQueue,
  onBatchAddToPrintQueue,
  onDownloadSingleCard,
  onDownloadZipForCards,
  printQueueCount = 0,
  isGeneratingZip = false,
}: ProductsTabProps) {
  const [searchCardQuery, setSearchCardQuery] = useState("");
  const [filterCardCategory, setFilterCardCategory] = useState("all");
  const [filterCardPackCode, setFilterCardPackCode] = useState("all");
  const [onlyHomeFeatured, setOnlyHomeFeatured] = useState<boolean>(false);
  const [selectedDetailSlug, setSelectedDetailSlug] = useState<string | null>(null);

  // Quản lý chọn hàng loạt để gán mã bộ hoặc xuất in
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [batchTargetPackCode, setBatchTargetPackCode] = useState<string>("POLY30-HANHDONG");
  const [isApplyingBatch, setIsApplyingBatch] = useState<boolean>(false);

  // Modal tải file .ZIP theo Bộ Thẻ
  const [isPackZipModalOpen, setIsPackZipModalOpen] = useState<boolean>(false);
  const [selectedExportPackCode, setSelectedExportPackCode] = useState<string>("all");

  const pinnedCardsCount = productsList.filter((c) => Boolean(c.showOnHome)).length;

  // Danh sách các Mã Bộ độc nhất hiện có
  const uniquePackCodes = useMemo(() => {
    const set = new Set<string>();
    productsList.forEach((p) => {
      if (p.packCode && p.packCode.trim() !== "") {
        set.add(p.packCode.trim());
      }
    });
    return Array.from(set).sort();
  }, [productsList]);

  const cardsWithoutPackCodeCount = useMemo(() => {
    return productsList.filter((p) => !p.packCode || p.packCode.trim() === "").length;
  }, [productsList]);

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

    const matchesPackCode =
      filterCardPackCode === "all" ||
      (filterCardPackCode === "none"
        ? !card.packCode || card.packCode.trim() === ""
        : card.packCode === filterCardPackCode);

    const matchesHomeFilter = !onlyHomeFeatured || Boolean(card.showOnHome);

    return matchesSearch && matchesCategory && matchesPackCode && matchesHomeFilter;
  });

  const toggleSelectCard = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSelectAllFiltered = () => {
    setSelectedSlugs(filteredProducts.map((p) => p.slug));
  };

  const handleClearSelection = () => {
    setSelectedSlugs([]);
  };

  const handleExecuteBatchAssign = async () => {
    if (selectedSlugs.length === 0) return;
    setIsApplyingBatch(true);
    try {
      await onBatchAssignPackCode(selectedSlugs, batchTargetPackCode);
      setSelectedSlugs([]);
    } finally {
      setIsApplyingBatch(false);
    }
  };

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
            Bấm trực tiếp vào bất kỳ thẻ nhỏ nào bên dưới để xem chi tiết, sửa thông tin, chế bản in hoặc thử WebAR 3D. Chọn nhiều thẻ để gán nhanh Mã Bộ hàng loạt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onDownloadZipForCards && (
            <button
              type="button"
              disabled={isGeneratingZip}
              onClick={() => {
                if (filterCardPackCode !== "all" && filterCardPackCode !== "none") {
                  setSelectedExportPackCode(filterCardPackCode);
                } else {
                  setSelectedExportPackCode("all");
                }
                setIsPackZipModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500 text-purple-200 hover:text-white border border-purple-400/50 font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <FolderArchive className="h-4 w-4" />
              <span>Xuất Tệp .ZIP Thẻ In Theo Bộ</span>
            </button>
          )}

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

      {/* Thanh Công Cụ: Tìm Kiếm, Lọc Danh Mục, Lọc Mã Bộ, Chọn Hàng Loạt */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
        {/* Tìm kiếm */}
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

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Lọc Theo Danh Mục */}
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

          {/* Lọc Theo Mã Bộ (Pack Code) */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 border border-white/15 text-xs text-stone-300">
            <PackageCheck className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <select
              value={filterCardPackCode}
              onChange={(e) => setFilterCardPackCode(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-stone-900 text-white">
                Tất Cả Mã Bộ ({productsList.length})
              </option>
              <option value="none" className="bg-stone-900 text-amber-300">
                Chưa Có Mã Bộ ({cardsWithoutPackCodeCount})
              </option>
              {uniquePackCodes.map((code) => {
                const count = productsList.filter((p) => p.packCode === code).length;
                return (
                  <option key={code} value={code} className="bg-stone-900 text-purple-300 font-mono">
                    Bộ: {code} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Nút Chọn Hàng Loạt */}
          <button
            type="button"
            onClick={
              selectedSlugs.length === filteredProducts.length && filteredProducts.length > 0
                ? handleClearSelection
                : handleSelectAllFiltered
            }
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedSlugs.length > 0
                ? "bg-purple-500/20 text-purple-300 border-purple-400/40 hover:bg-purple-500/30"
                : "bg-stone-900 text-stone-400 border-white/15 hover:text-white"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5 text-purple-400" />
            <span>
              {selectedSlugs.length > 0
                ? `Đã chọn (${selectedSlugs.length}/${filteredProducts.length})`
                : "Chọn nhiều thẻ"}
            </span>
          </button>
        </div>
      </div>

      {/* TIỆN ÍCH GÁN MÃ BỘ HÀNG LOẠT (Sticky Batch Action Bar) */}
      {selectedSlugs.length > 0 && (
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/90 via-stone-900 to-amber-950/90 border-2 border-purple-400/60 shadow-xl shadow-purple-950/50 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-500 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-purple-500/30">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-black text-xs sm:text-sm text-purple-200 flex items-center gap-2">
                <span>
                  Đã chọn: <strong className="text-white text-sm">{selectedSlugs.length}</strong> thẻ bài
                </span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-[11px] text-stone-400 hover:text-white underline cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
              <p className="text-[10px] text-purple-300/70">
                Chọn mã bộ đích bên dưới và bấm &quot;Gán Cho Các Thẻ Đã Chọn&quot;
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dropdown chọn mã bộ đích */}
            <div className="flex items-center gap-1.5 bg-black/60 border border-purple-400/40 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] font-bold text-purple-300">Gán mã bộ:</span>
              <select
                value={batchTargetPackCode}
                onChange={(e) => setBatchTargetPackCode(e.target.value)}
                className="bg-transparent text-white font-mono font-bold text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="POLY30-DONGVAT" className="bg-stone-900 text-white">POLY30-DONGVAT (Động Vật)</option>
                <option value="POLY30-HANHDONG" className="bg-stone-900 text-white">POLY30-HANHDONG (Hành Động)</option>
                <option value="POLY30-XECO" className="bg-stone-900 text-white">POLY30-XECO (Xe Cộ)</option>
                <option value="POLY30-HOAQUA" className="bg-stone-900 text-white">POLY30-HOAQUA (Hoa Quả)</option>
                <option value="POLY120-COMBOVIP" className="bg-stone-900 text-white">POLY120-COMBOVIP (Trọn Bộ VIP)</option>
                {uniquePackCodes
                  .filter((c) => !["POLY30-DONGVAT", "POLY30-HANHDONG", "POLY30-XECO", "POLY30-HOAQUA", "POLY120-COMBOVIP"].includes(c))
                  .map((c) => (
                    <option key={c} value={c} className="bg-stone-900 text-white">{c}</option>
                  ))
                }
                <option value="" className="bg-stone-900 text-rose-300">-- Xóa mã bộ (Đặt về Chưa có) --</option>
              </select>
            </div>

            <button
              type="button"
              disabled={isApplyingBatch}
              onClick={handleExecuteBatchAssign}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isApplyingBatch ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang gán...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Gán Mã Bộ ({selectedSlugs.length})</span>
                </>
              )}
            </button>

            {/* Thêm hàng loạt vào hàng đợi in */}
            {onBatchAddToPrintQueue && (
              <button
                type="button"
                onClick={() => {
                  const selectedCards = productsList.filter((p) =>
                    selectedSlugs.includes(p.slug)
                  );
                  onBatchAddToPrintQueue(selectedCards);
                }}
                className="py-2 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-stone-950 border border-emerald-400/40 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="Đưa các thẻ đã chọn vào danh sách chờ xuất file in"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>+ Hàng Đợi In ({selectedSlugs.length})</span>
              </button>
            )}

            {/* Tải tệp ZIP trực tiếp cho các thẻ đã chọn */}
            {onDownloadZipForCards && (
              <button
                type="button"
                disabled={isGeneratingZip}
                onClick={() => {
                  const selectedCards = productsList.filter((p) =>
                    selectedSlugs.includes(p.slug)
                  );
                  onDownloadZipForCards(
                    selectedCards,
                    `polycards-chon-${selectedCards.length}-the-in.zip`
                  );
                }}
                className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Tải ngay tệp ZIP các ảnh phôi in chất lượng cao đã có mã QR"
              >
                {isGeneratingZip ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Tải ZIP ({selectedSlugs.length} Thẻ In)</span>
              </button>
            )}
          </div>
        </div>
      )}

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
            Thử tìm kiếm với từ khóa khác, tắt bộ lọc mã bộ hoặc bộ lọc thẻ ghim Trang Chủ để xem toàn bộ kho thẻ.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchCardQuery("");
              setFilterCardCategory("all");
              setFilterCardPackCode("all");
              setOnlyHomeFeatured(false);
            }}
            className="py-2 px-4 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            Xóa Toàn Bộ Lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredProducts.map((card) => {
            const key = card.id || card.slug;
            const isPinned = Boolean(card.showOnHome);
            const hasBadge = Boolean(card.badge && card.badge.trim() !== "");
            const isSelected = selectedSlugs.includes(card.slug);

            return (
              <div
                key={key}
                onClick={() => setSelectedDetailSlug(card.slug)}
                className={`group relative rounded-2xl bg-stone-900/90 border p-2.5 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/60 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-purple-400 ring-2 ring-purple-400/40 bg-purple-950/20"
                    : isPinned
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

                  {/* Góc trên trái: Checkbox chọn nhiều thẻ */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectCard(card.slug);
                    }}
                    title={isSelected ? "Bỏ chọn thẻ này" : "Chọn thẻ này để gán mã bộ hàng loạt"}
                    className={`absolute top-1.5 left-1.5 z-20 h-6 w-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-500 text-white shadow-md ring-2 ring-purple-300"
                        : "bg-black/60 text-stone-400 hover:text-white border border-white/20 backdrop-blur-md opacity-80 group-hover:opacity-100"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-3.5 w-3.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Kế bên checkbox: Danh mục */}
                  <span className="absolute top-1.5 left-8.5 z-10 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/75 text-stone-200 backdrop-blur-md border border-white/15 max-w-[55%] truncate">
                    {card.category || "Động Vật"}
                  </span>

                  {/* Góc trên phải: Nút Ngôi Sao 1 chạm ghim/gỡ #products tức thì */}
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

                  {/* Nút thêm nhanh vào hàng đợi in khi hover */}
                  {onAddToPrintQueue && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToPrintQueue(card);
                      }}
                      title="Thêm nhanh thẻ này vào hàng đợi in"
                      className="absolute bottom-1.5 right-1.5 z-10 h-7 w-7 rounded-full bg-black/75 hover:bg-emerald-500 text-stone-300 hover:text-stone-950 border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                    </button>
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

                  {/* Hiển thị Mã Bộ: Bộ [code] hoặc Chưa có */}
                  <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-white/5 text-[10px]">
                    <span className="text-stone-500 font-medium">Mã bộ:</span>
                    {card.packCode && card.packCode.trim() !== "" ? (
                      <span
                        className="font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/25 text-purple-300 border border-purple-400/40 text-[9px] truncate max-w-[110px]"
                        title={`Mã bộ: ${card.packCode}`}
                      >
                        {card.packCode}
                      </span>
                    ) : (
                      <span
                        className="font-bold px-1.5 py-0.2 rounded bg-stone-800/80 text-amber-300/80 border border-amber-400/20 text-[9px]"
                        title="Chưa gắn mã bộ"
                      >
                        Chưa có
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Xuất File .ZIP Thẻ In Theo Bộ */}
      {isPackZipModalOpen && (
        <div
          onClick={() => setIsPackZipModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-stone-900 border-2 border-purple-400/50 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden ring-1 ring-purple-400/20 max-h-[90dvh]"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-stone-950/95 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/30 flex items-center justify-center font-black">
                  <FolderArchive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Xuất Tệp .ZIP Thẻ In Theo Bộ
                  </h3>
                  <p className="text-[11px] text-purple-300/80">
                    Nén thành file .zip chứa toàn bộ ảnh phôi in .png kèm mã QR WebAR
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPackZipModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Danh sách chọn Bộ */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-400/30 text-xs text-purple-200 leading-relaxed">
                Tất cả các thẻ xuất ra là file <strong>.png</strong> độ nét cao (1:1), đã chứa hình ảnh nhân vật, từ vựng song ngữ và <strong>mã QR tương tác WebAR</strong> quét được ngay. Xưởng in có thể dùng trực tiếp để in ấn!
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-300 block">
                  Chọn Bộ Thẻ Cần Xuất ZIP:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Tùy chọn 1: Toàn bộ kho thẻ */}
                  <button
                    type="button"
                    onClick={() => setSelectedExportPackCode("all")}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      selectedExportPackCode === "all"
                        ? "bg-purple-500/25 border-purple-400 ring-1 ring-purple-400 text-white"
                        : "bg-stone-950/70 border-white/10 hover:border-white/25 text-stone-300"
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs">Toàn Bộ Kho Thẻ</div>
                      <div className="text-[10px] text-stone-400">Tất cả danh mục trong studio</div>
                    </div>
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-full bg-white/10">
                      {productsList.length} thẻ
                    </span>
                  </button>

                  {/* Tùy chọn 2: Các thẻ đang lọc */}
                  <button
                    type="button"
                    onClick={() => setSelectedExportPackCode("filtered")}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      selectedExportPackCode === "filtered"
                        ? "bg-purple-500/25 border-purple-400 ring-1 ring-purple-400 text-white"
                        : "bg-stone-950/70 border-white/10 hover:border-white/25 text-stone-300"
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs">Danh Sách Đang Lọc</div>
                      <div className="text-[10px] text-stone-400">Theo bộ lọc tìm kiếm & danh mục</div>
                    </div>
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-full bg-white/10">
                      {filteredProducts.length} thẻ
                    </span>
                  </button>

                  {/* Từng Bộ thẻ cụ thể có sẵn */}
                  {uniquePackCodes.map((code) => {
                    const count = productsList.filter((p) => p.packCode === code).length;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setSelectedExportPackCode(code)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          selectedExportPackCode === code
                            ? "bg-purple-500/25 border-purple-400 ring-1 ring-purple-400 text-white"
                            : "bg-stone-950/70 border-white/10 hover:border-white/25 text-stone-300"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-black text-xs truncate text-purple-300">
                            {code}
                          </div>
                          <div className="text-[10px] text-stone-400 truncate">
                            Bộ thẻ bài chủ đề
                          </div>
                        </div>
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
                          {count} thẻ
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            {(() => {
              const exportCards =
                selectedExportPackCode === "all"
                  ? productsList
                  : selectedExportPackCode === "filtered"
                  ? filteredProducts
                  : productsList.filter((p) => p.packCode === selectedExportPackCode);

              const exportZipName =
                selectedExportPackCode === "all"
                  ? "polycards-toan-bo-kho-the.zip"
                  : selectedExportPackCode === "filtered"
                  ? "polycards-the-theo-bo-loc.zip"
                  : `polycards-${selectedExportPackCode.toLowerCase()}.zip`;

              return (
                <div className="px-5 py-3.5 border-t border-white/10 bg-stone-950/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="text-xs text-stone-400">
                    Sẽ xuất: <strong className="text-white font-mono">{exportCards.length}</strong> thẻ in (.png + QR)
                  </div>

                  <div className="flex items-center gap-2">
                    {onBatchAddToPrintQueue && (
                      <button
                        type="button"
                        disabled={exportCards.length === 0}
                        onClick={() => {
                          onBatchAddToPrintQueue(exportCards);
                          setIsPackZipModalOpen(false);
                        }}
                        className="py-2.5 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-stone-950 border border-emerald-400/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <FolderPlus className="h-3.5 w-3.5" />
                        <span>+ Hàng Đợi In</span>
                      </button>
                    )}

                    {onDownloadZipForCards && (
                      <button
                        type="button"
                        disabled={isGeneratingZip || exportCards.length === 0}
                        onClick={async () => {
                          await onDownloadZipForCards(exportCards, exportZipName);
                          setIsPackZipModalOpen(false);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isGeneratingZip ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Đang Đóng Gói .ZIP...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span>Tải Tệp .ZIP ({exportCards.length} Thẻ)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
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
        onUpdatePackCode={onUpdatePackCode}
        onAddToPrintQueue={onAddToPrintQueue}
        onDownloadSingleCard={onDownloadSingleCard}
      />
    </div>
  );
}
