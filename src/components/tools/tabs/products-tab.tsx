"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Layers,
  Plus,
  Search,
  X,
  Filter,
  RefreshCw,
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List,
  Sliders,
  Edit3,
  PackageCheck,
  CheckSquare,
  Square,
  Check,
  FolderArchive,
  FolderPlus,
  ListPlus,
  FileDown,
  Download,
  Eye,
  MousePointerClick,
  Trash2,
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
  onBatchDeleteProducts?: (slugs: string[]) => void;
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
  onBatchDeleteProducts,
  printQueueCount = 0,
  isGeneratingZip = false,
}: ProductsTabProps) {
  const [searchCardQuery, setSearchCardQuery] = useState("");
  const [filterCardCategory, setFilterCardCategory] = useState("all");
  const [filterCardPackCode, setFilterCardPackCode] = useState("all");
  const [onlyHomeFeatured, setOnlyHomeFeatured] = useState<boolean>(false);
  const [selectedDetailSlug, setSelectedDetailSlug] = useState<string | null>(null);

  // Quản lý chế độ chọn nhiều thẻ (Selection Mode)
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [batchTargetPackCode, setBatchTargetPackCode] = useState<string>("POLY30-HANHDONG");
  const [isApplyingBatch, setIsApplyingBatch] = useState<boolean>(false);

  // Chế độ xem: Dạng Lưới Thẻ (grid) vs Dạng Danh Sách (list)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Phân trang (Pagination): 6, 18, 24, 30, 36, 108 — Mặc định 6 thẻ / trang để tối ưu tốc độ & không giật lag
  const [pageSize, setPageSize] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Tải tùy chọn chế độ xem & page size từ localStorage
  useEffect(() => {
    try {
      const savedView = localStorage.getItem("poly_products_view_mode");
      if (savedView === "grid" || savedView === "list") {
        setViewMode(savedView);
      }
      const savedPageSize = localStorage.getItem("poly_products_page_size");
      if (savedPageSize) {
        const parsed = parseInt(savedPageSize, 10);
        if ([6, 18, 24, 30, 36, 108].includes(parsed)) {
          setPageSize(parsed);
        }
      }
    } catch {}
  }, []);

  const handleChangeViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("poly_products_view_mode", mode);
    } catch {}
  };

  const handleChangePageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    try {
      localStorage.setItem("poly_products_page_size", String(size));
    } catch {}
  };

  // Tự động lọc bỏ các thẻ đã bị xóa khỏi kho thẻ bài
  useEffect(() => {
    setSelectedSlugs((prev) => prev.filter((s) => productsList.some((p) => p.slug === s)));
  }, [productsList]);

  // Kéo chuột quét vùng chọn nhiều thẻ (Marquee Drag Selection)
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const isPointerDownRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

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

  // Tự động quay về trang 1 khi thay đổi điều kiện tìm kiếm / lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchCardQuery, filterCardCategory, filterCardPackCode, onlyHomeFeatured]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, startIndex, pageSize]);

  const getPaginationItems = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const items: (number | "...")[] = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) items.push(i);
      items.push("...");
      items.push(total);
    } else if (current >= total - 3) {
      items.push(1);
      items.push("...");
      for (let i = total - 4; i <= total; i++) items.push(i);
    } else {
      items.push(1);
      items.push("...");
      items.push(current - 1);
      items.push(current);
      items.push(current + 1);
      items.push("...");
      items.push(total);
    }
    return items;
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedSlugs([]);
      }
      return next;
    });
  };

  const handleExitSelectionMode = () => {
    setSelectedSlugs([]);
    setIsSelectionMode(false);
  };

  const toggleSelectCard = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSelectAllFiltered = () => {
    setIsSelectionMode(true);
    setSelectedSlugs(filteredProducts.map((p) => p.slug));
  };

  const handleClearSelection = () => {
    setSelectedSlugs([]);
    // Vẫn duy trì isSelectionMode = true để người dùng tiếp tục chọn thẻ khác một cách tự nhiên!
  };

  // Phím tắt Ctrl+A / Cmd+A để chọn tất cả thẻ theo bộ lọc, và phím Escape để thoát/bỏ chọn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isInput) return;

      // Ctrl + A hoặc Cmd + A
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setIsSelectionMode(true);
        setSelectedSlugs(filteredProducts.map((p) => p.slug));
        return;
      }

      // Escape: Bỏ chọn hoặc thoát chế độ chọn
      if (e.key === "Escape") {
        if (selectedSlugs.length > 0) {
          setSelectedSlugs([]);
        } else if (isSelectionMode) {
          setIsSelectionMode(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredProducts, isSelectionMode, selectedSlugs.length]);

  // Chuột kéo quét vùng chọn marquee
  const handleGridPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea, [data-prevent-marquee]")) {
      return;
    }
    isPointerDownRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      if (Math.hypot(dx, dy) > 8) {
        setIsSelectionMode(true);
        setMarquee({
          startX: startPosRef.current.x,
          startY: startPosRef.current.y,
          currentX: e.clientX,
          currentY: e.clientY,
        });

        if (gridContainerRef.current) {
          const boxLeft = Math.min(startPosRef.current.x, e.clientX);
          const boxRight = Math.max(startPosRef.current.x, e.clientX);
          const boxTop = Math.min(startPosRef.current.y, e.clientY);
          const boxBottom = Math.max(startPosRef.current.y, e.clientY);

          const cardEls = gridContainerRef.current.querySelectorAll<HTMLElement>(
            "[data-card-slug]"
          );
          const intersectingSlugs: string[] = [];
          cardEls.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const intersects = !(
              rect.right < boxLeft ||
              rect.left > boxRight ||
              rect.bottom < boxTop ||
              rect.top > boxBottom
            );
            if (intersects) {
              const slug = el.getAttribute("data-card-slug");
              if (slug) intersectingSlugs.push(slug);
            }
          });

          if (intersectingSlugs.length > 0) {
            setSelectedSlugs((prev) => {
              const set = new Set([...prev, ...intersectingSlugs]);
              return Array.from(set);
            });
          }
        }
      }
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
      setMarquee(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

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

          {/* Chuyển Đổi Chế Độ Xem: Dạng Thẻ (Grid) vs Dạng Danh Sách (List) */}
          <div className="flex items-center p-1 rounded-xl bg-stone-900 border border-white/15">
            <button
              type="button"
              onClick={() => handleChangeViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-amber-400 text-stone-950 shadow-xs font-bold"
                  : "text-stone-400 hover:text-white"
              }`}
              title="Chuyển sang dạng lưới thẻ bài"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleChangeViewMode("list")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-amber-400 text-stone-950 shadow-xs font-bold"
                  : "text-stone-400 hover:text-white"
              }`}
              title="Chuyển sang dạng danh sách chi tiết"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Chọn số thẻ / trang */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-white/15 text-xs text-stone-300">
            <span className="text-[11px] font-bold text-stone-400 hidden xl:inline">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => handleChangePageSize(Number(e.target.value))}
              className="bg-transparent text-amber-300 font-black text-xs focus:outline-hidden cursor-pointer font-mono"
              title="Số lượng thẻ hiển thị trên mỗi trang"
            >
              {[6, 18, 24, 30, 36, 108].map((size) => (
                <option key={size} value={size} className="bg-stone-900 text-white font-sans">
                  {size} thẻ / trang
                </option>
              ))}
            </select>
          </div>

          {/* Nút Bật/Tắt Chế Độ Chọn Nhiều Thẻ */}
          <button
            type="button"
            onClick={handleToggleSelectionMode}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSelectionMode
                ? "bg-purple-500 text-white border-purple-300 shadow-md shadow-purple-500/30 ring-2 ring-purple-400/40"
                : "bg-stone-900 text-stone-300 border-white/15 hover:border-purple-400/40 hover:text-white"
            }`}
            title="Bật/tắt chế độ chọn nhiều thẻ bài (hoặc bấm Ctrl+A / Cmd+A)"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>
              {isSelectionMode
                ? selectedSlugs.length > 0
                  ? `Đang chọn (${selectedSlugs.length}/${filteredProducts.length})`
                  : "Chế độ chọn (Bật)"
                : "Chọn nhiều thẻ (Ctrl+A)"}
            </span>
          </button>
        </div>
      </div>

      {/* THANH TÁC VỤ CHỌN NHIỀU THẺ (Sticky Batch Action Bar) */}
      {isSelectionMode && (
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/95 via-stone-900 to-amber-950/95 border-2 border-purple-400/70 shadow-2xl shadow-purple-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-500 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-purple-500/30">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="font-black text-xs sm:text-sm text-purple-200 flex items-center gap-2 flex-wrap">
                <span>
                  Đã chọn: <strong className="text-white text-sm">{selectedSlugs.length}</strong> / {filteredProducts.length} thẻ
                </span>
                <span className="text-stone-500">•</span>
                {selectedSlugs.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[11px] text-amber-300 hover:text-amber-200 underline cursor-pointer font-bold"
                  >
                    Bỏ chọn tất cả
                  </button>
                ) : (
                  <span className="text-[11px] text-purple-300/80 font-medium">
                    Nhấn vào thẻ bất kỳ hoặc quét chuột để chọn
                  </span>
                )}
                <span className="text-stone-500">•</span>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[11px] text-purple-300 hover:text-white underline cursor-pointer"
                >
                  Chọn tất cả ({filteredProducts.length})
                </button>
              </div>
              <p className="text-[10px] text-purple-300/70">
                Mẹo: Bấm <strong>Ctrl + A</strong> (Cmd + A) để chọn tất cả thẻ theo bộ lọc, hoặc rê chuột quét vùng chọn
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
              disabled={isApplyingBatch || selectedSlugs.length === 0}
              onClick={handleExecuteBatchAssign}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
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
                disabled={selectedSlugs.length === 0}
                onClick={() => {
                  const selectedCards = productsList.filter((p) =>
                    selectedSlugs.includes(p.slug)
                  );
                  onBatchAddToPrintQueue(selectedCards);
                }}
                className="py-2 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-stone-950 border border-emerald-400/40 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
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
                disabled={isGeneratingZip || selectedSlugs.length === 0}
                onClick={() => {
                  const selectedCards = productsList.filter((p) =>
                    selectedSlugs.includes(p.slug)
                  );
                  onDownloadZipForCards(
                    selectedCards,
                    `polycards-chon-${selectedCards.length}-the-in.zip`
                  );
                }}
                className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
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

            {/* Xóa hàng loạt các thẻ đã chọn */}
            {onBatchDeleteProducts && (
              <button
                type="button"
                disabled={selectedSlugs.length === 0}
                onClick={() => onBatchDeleteProducts(selectedSlugs)}
                className="py-2 px-3.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                title={`Xóa vĩnh viễn ${selectedSlugs.length} thẻ bài đã chọn khỏi hệ thống`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa ({selectedSlugs.length} Thẻ)</span>
              </button>
            )}

            {/* Nút thoát chế độ chọn */}
            <button
              type="button"
              onClick={handleExitSelectionMode}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-stone-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-colors cursor-pointer"
              title="Thoát chế độ chọn (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
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
        <div className="space-y-4">
          {viewMode === "grid" ? (
            <div
              ref={gridContainerRef}
              onPointerDown={handleGridPointerDown}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 select-none"
            >
              {paginatedProducts.map((card) => {
            const key = card.id || card.slug;
            const isPinned = Boolean(card.showOnHome);
            const hasBadge = Boolean(card.badge && card.badge.trim() !== "");
            const isSelected = selectedSlugs.includes(card.slug);

            return (
              <div
                key={key}
                data-card-slug={card.slug}
                onClick={() => {
                  if (isSelectionMode) {
                    toggleSelectCard(card.slug);
                  } else {
                    setSelectedDetailSlug(card.slug);
                  }
                }}
                className={`group relative rounded-2xl bg-stone-900/90 border p-2.5 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/60 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-purple-400 ring-2 ring-purple-400/50 bg-purple-950/30"
                    : isSelectionMode
                    ? "border-purple-400/30 hover:border-purple-400/80 hover:bg-stone-850"
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
                      if (!isSelectionMode) {
                        setIsSelectionMode(true);
                      }
                      toggleSelectCard(card.slug);
                    }}
                    title={isSelected ? "Bỏ chọn thẻ này" : "Chọn thẻ này"}
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
                    {isSelectionMode ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetailSlug(card.slug);
                        }}
                        title="Xem chi tiết thẻ này"
                        className="h-5 w-5 rounded-md bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-stone-500 group-hover:text-amber-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    )}
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
          ) : (
            <div
              ref={gridContainerRef}
              onPointerDown={handleGridPointerDown}
              className="rounded-2xl bg-stone-900/90 border border-white/10 overflow-hidden shadow-xl select-none"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-stone-950/80 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">
                        <span className="sr-only">Chọn</span>
                      </th>
                      <th className="py-3 px-3 w-16 text-center">Ảnh</th>
                      <th className="py-3 px-4 min-w-[180px]">Thẻ Bài</th>
                      <th className="py-3 px-3 min-w-[110px]">Danh Mục</th>
                      <th className="py-3 px-3 min-w-[130px]">Mã Bộ</th>
                      <th className="py-3 px-3 min-w-[90px]">Giá Bán</th>
                      <th className="py-3 px-3 text-center w-20">Trang Chủ</th>
                      <th className="py-3 px-4 text-right min-w-[170px]">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedProducts.map((card) => {
                      const key = card.id || card.slug;
                      const isPinned = Boolean(card.showOnHome);
                      const isSelected = selectedSlugs.includes(card.slug);

                      return (
                        <tr
                          key={key}
                          data-card-slug={card.slug}
                          onClick={() => {
                            if (isSelectionMode) {
                              toggleSelectCard(card.slug);
                            } else {
                              setSelectedDetailSlug(card.slug);
                            }
                          }}
                          className={`group transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-purple-950/40 hover:bg-purple-950/60"
                              : "hover:bg-white/5"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!isSelectionMode) setIsSelectionMode(true);
                                toggleSelectCard(card.slug);
                              }}
                              className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all mx-auto cursor-pointer ${
                                isSelected
                                  ? "bg-purple-500 text-white shadow-md ring-2 ring-purple-300"
                                  : "bg-white/5 text-stone-400 hover:text-white border border-white/20"
                              }`}
                            >
                              {isSelected ? (
                                <CheckSquare className="h-3.5 w-3.5" />
                              ) : (
                                <Square className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </td>

                          {/* Ảnh Thumbnail */}
                          <td className="py-2 px-3 text-center">
                            <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-stone-950 border border-white/10 mx-auto">
                              <SubjectFocusImage
                                primaryUrl={card.images?.[0]}
                                secondaryUrl={card.posterUrl}
                                alt={card.nameVi}
                              />
                            </div>
                          </td>

                          {/* Tên Thẻ Bài & Phiên âm */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-white group-hover:text-amber-300 transition-colors">
                                {card.nameVi}
                              </span>
                              {card.badge && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                  {card.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400 flex items-center gap-1.5 font-mono">
                              <span>{card.nameEn}</span>
                              {card.ipa && <span className="text-stone-500">{card.ipa}</span>}
                              {card.nameZh && <span className="text-amber-300/80 font-sans">{card.nameZh}</span>}
                            </div>
                          </td>

                          {/* Danh Mục */}
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/5 text-stone-300 border border-white/10 inline-block">
                              {card.category || "Động Vật"}
                            </span>
                          </td>

                          {/* Mã Bộ */}
                          <td className="py-2.5 px-3">
                            {card.packCode && card.packCode.trim() !== "" ? (
                              <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30 inline-block">
                                {card.packCode}
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-500 italic">Chưa có</span>
                            )}
                          </td>

                          {/* Giá Bán */}
                          <td className="py-2.5 px-3 font-mono font-black text-amber-400 text-xs">
                            {formatVndCurrency(card.price || 219000)}
                          </td>

                          {/* Ghim Trang Chủ */}
                          <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onToggleShowOnHome(card)}
                              title={isPinned ? "Bỏ ghim #products" : "Ghim lên #products"}
                              className={`h-7 w-7 rounded-full flex items-center justify-center border transition-all mx-auto cursor-pointer ${
                                isPinned
                                  ? "bg-emerald-500 text-stone-950 border-emerald-300 shadow-md"
                                  : "bg-white/5 text-stone-400 hover:text-amber-300 border-white/10"
                              }`}
                            >
                              <Star className={`h-3.5 w-3.5 ${isPinned ? "fill-stone-950" : ""}`} />
                            </button>
                          </td>

                          {/* Thao Tác (Actions) */}
                          <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedDetailSlug(card.slug)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title="Xem chi tiết thẻ"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onLoadCardToCanvas(card)}
                                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-400/30 transition-colors cursor-pointer"
                                title="Chế bản & in thẻ này trên Canvas"
                              >
                                <Sliders className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenEditProduct(card)}
                                className="p-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-400/30 transition-colors cursor-pointer"
                                title="Chỉnh sửa thông tin thẻ"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              {onAddToPrintQueue && (
                                <button
                                  type="button"
                                  onClick={() => onAddToPrintQueue(card)}
                                  className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-stone-950 border border-emerald-400/30 transition-colors cursor-pointer"
                                  title="+ Hàng đợi in"
                                >
                                  <FolderPlus className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {onDownloadSingleCard && (
                                <button
                                  type="button"
                                  onClick={() => onDownloadSingleCard(card)}
                                  className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-400/30 transition-colors cursor-pointer"
                                  title="Tải ảnh in có mã QR"
                                >
                                  <FileDown className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onDeleteProduct(card)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-colors cursor-pointer"
                                title="Xóa thẻ này"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Thanh Phân Trang Đầy Đủ: << < 1, 2, 3, ... > >> & Thống kê */}
          <div className="p-3 sm:p-4 rounded-2xl bg-stone-900/90 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-stone-400 font-medium text-center md:text-left">
              <span>
                Hiển thị <strong className="text-white">{totalItems === 0 ? 0 : startIndex + 1}</strong> -{" "}
                <strong className="text-white">{endIndex}</strong> /{" "}
                <strong className="text-amber-400">{totalItems}</strong> thẻ bài
              </span>
              {isSelectionMode && selectedSlugs.length > 0 && (
                <span className="text-purple-300 font-bold">
                  (Đang chọn {selectedSlugs.length} thẻ)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* Về trang đầu << */}
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                title="Trang đầu (<<)"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Trang trước < */}
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                title="Trang trước (<)"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Danh sách các số trang kèm ... */}
              {getPaginationItems(validCurrentPage, totalPages).map((item, idx) => {
                if (item === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1 text-stone-500 font-bold select-none text-xs"
                    >
                      ...
                    </span>
                  );
                }

                const isCurrent = item === validCurrentPage;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={`min-w-8 h-8 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-400/20 scale-105"
                        : "bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10"
                    }`}
                    title={`Trang ${item}`}
                  >
                    {item}
                  </button>
                );
              })}

              {/* Trang sau > */}
              <button
                type="button"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                title="Trang sau (>)"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Đến trang cuối >> */}
              <button
                type="button"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                title="Trang cuối (>>)"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
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

      {/* Vùng quét chuột kéo chọn thẻ (Marquee Drag Selection Box) */}
      {marquee && (
        <div
          className="fixed pointer-events-none z-50 border-2 border-purple-400 bg-purple-500/20 backdrop-blur-[0.5px] rounded-lg shadow-xl"
          style={{
            left: Math.min(marquee.startX, marquee.currentX),
            top: Math.min(marquee.startY, marquee.currentY),
            width: Math.abs(marquee.currentX - marquee.startX),
            height: Math.abs(marquee.currentY - marquee.startY),
          }}
        />
      )}
    </div>
  );
}
