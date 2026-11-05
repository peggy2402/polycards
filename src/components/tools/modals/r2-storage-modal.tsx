"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  HardDrive,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Box,
  ScanLine,
  Image as ImageIcon,
  Volume2,
  FileQuestion,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PackageCheck,
  Languages,
  RotateCcw,
} from "lucide-react";

interface R2UsedByProduct {
  slug: string;
  name: string;
  category?: string;
  categorySlug?: string;
  packCode?: string;
  enableEnVi?: boolean;
  enableZhVi?: boolean;
  modelName?: string;
  modelUrl?: string;
  role: string;
}

interface R2Item {
  key: string;
  size: number;
  lastModified?: string;
  url: string;
  extension: string;
  isOrphan: boolean;
  isProtected: boolean;
  usedBy?: R2UsedByProduct[];
}

interface R2CategoryStat {
  count: number;
  sizeBytes: number;
}

interface R2Stats {
  totalObjects: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  quotaLimitMB: number;
  usedPercent: number;
  categoryStats: {
    glb: R2CategoryStat;
    usdz: R2CategoryStat;
    mind: R2CategoryStat;
    images: R2CategoryStat;
    audio: R2CategoryStat;
    other: R2CategoryStat;
  };
  orphanCount: number;
  orphanSizeBytes: number;
  orphanSizeMB: number;
}

interface R2StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshProducts?: () => void;
}

export function R2StorageModal({ isOpen, onClose, onRefreshProducts }: R2StorageModalProps) {
  const [stats, setStats] = useState<R2Stats | null>(null);
  const [items, setItems] = useState<R2Item[]>([]);
  const [orphans, setOrphans] = useState<R2Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"orphans" | "all">("orphans");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterExt, setFilterExt] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPackCode, setFilterPackCode] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<"all" | "en-vi" | "zh-vi">("all");

  // Phân trang danh sách tệp R2
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchR2Data = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await fetch("/api/tools/r2-storage");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể tải dữ liệu Cloudflare R2.");
      }
      setStats(data.stats);
      setItems(data.items || []);
      setOrphans(data.orphans || []);
    } catch (err: unknown) {
      console.error("Lỗi lấy dữ liệu R2:", err);
      const msg = err instanceof Error ? err.message : "Lỗi đọc dữ liệu R2";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchR2Data();
      setFeedbackMessage(null);
    }
  }, [isOpen]);

  // Xóa tất cả tệp cần dọn dẹp
  const handleCleanAllOrphans = async () => {
    if (orphans.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${orphans.length} tệp cần dọn dẹp để thu hồi ${stats?.orphanSizeMB} MB?`)) {
      return;
    }

    try {
      setIsCleaning(true);
      setErrorMessage(null);
      setFeedbackMessage(null);

      const res = await fetch("/api/tools/r2-storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clean-orphans" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Lỗi dọn dẹp tệp mồ côi");
      }

      setFeedbackMessage(data.message);
      await fetchR2Data();
      if (onRefreshProducts) onRefreshProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi dọn dẹp";
      setErrorMessage(msg);
    } finally {
      setIsCleaning(false);
    }
  };

  // Xóa từng tệp đơn lẻ
  const handleDeleteSingle = async (key: string) => {
    if (!confirm(`Xóa tệp "${key}" khỏi Cloudflare R2?`)) return;

    try {
      setIsCleaning(true);
      setErrorMessage(null);

      const res = await fetch("/api/tools/r2-storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", keys: [key] }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Lỗi xóa tệp");
      }

      await fetchR2Data();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi xóa tệp";
      setErrorMessage(msg);
    } finally {
      setIsCleaning(false);
    }
  };

  // Danh sách các Danh mục duy nhất có trong R2
  const availableCategories = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      item.usedBy?.forEach((u) => {
        if (u.category && u.category.trim()) {
          const cat = u.category.trim();
          map.set(cat, (map.get(cat) || 0) + 1);
        }
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // Danh sách các Mã bộ duy nhất có trong R2
  const availablePackCodes = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      item.usedBy?.forEach((u) => {
        if (u.packCode && u.packCode.trim()) {
          const code = u.packCode.trim();
          map.set(code, (map.get(code) || 0) + 1);
        }
      });
    });
    return Array.from(map.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [items]);

  // Kiểm tra nếu có bất kỳ bộ lọc nào đang được kích hoạt
  const hasActiveFilters =
    searchQuery !== "" ||
    filterExt !== "all" ||
    filterCategory !== "all" ||
    filterPackCode !== "all" ||
    filterLanguage !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterExt("all");
    setFilterCategory("all");
    setFilterPackCode("all");
    setFilterLanguage("all");
  };

  // Lọc danh sách tệp: hỗ trợ tìm theo tên tệp (key), định dạng, tên thẻ bài, model 3D, danh mục, mã bộ, song ngữ
  const displayedItems = (activeTab === "orphans" ? orphans : items).filter((item) => {
    // 1. Tìm kiếm theo từ khóa
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchKey = item.key.toLowerCase().includes(q);
      const matchProduct = item.usedBy?.some(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.slug.toLowerCase().includes(q) ||
          (u.category && u.category.toLowerCase().includes(q)) ||
          (u.packCode && u.packCode.toLowerCase().includes(q)) ||
          (u.modelName && u.modelName.toLowerCase().includes(q)) ||
          u.role.toLowerCase().includes(q)
      );
      if (!matchKey && !matchProduct) return false;
    }

    // 2. Lọc theo định dạng đuôi
    if (filterExt !== "all" && item.extension.toLowerCase() !== filterExt.toLowerCase()) {
      return false;
    }

    // 3. Lọc theo Danh mục
    if (filterCategory !== "all") {
      const matchCat = item.usedBy?.some(
        (u) =>
          (u.category && u.category.toLowerCase() === filterCategory.toLowerCase()) ||
          (u.categorySlug && u.categorySlug.toLowerCase() === filterCategory.toLowerCase())
      );
      if (!matchCat) return false;
    }

    // 4. Lọc theo Mã bộ (Pack Code)
    if (filterPackCode !== "all") {
      if (filterPackCode === "none") {
        const hasPackCode = item.usedBy?.some((u) => u.packCode && u.packCode.trim() !== "");
        if (hasPackCode) return false;
      } else {
        const matchPack = item.usedBy?.some(
          (u) => u.packCode && u.packCode.toLowerCase() === filterPackCode.toLowerCase()
        );
        if (!matchPack) return false;
      }
    }

    // 5. Lọc theo Song ngữ
    if (filterLanguage !== "all") {
      if (filterLanguage === "en-vi") {
        const matchEnVi = item.usedBy?.some((u) => u.enableEnVi === true);
        if (!matchEnVi) return false;
      } else if (filterLanguage === "zh-vi") {
        const matchZhVi = item.usedBy?.some((u) => u.enableZhVi === true);
        if (!matchZhVi) return false;
      }
    }

    return true;
  });

  // Tự động chuyển về trang 1 khi thay đổi tab, từ khóa tìm kiếm, bộ lọc đuôi hoặc số tệp/trang
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterExt, filterCategory, filterPackCode, filterLanguage, pageSize]);

  const totalItems = displayedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = displayedItems.slice(startIndex, endIndex);

  // Danh sách các số trang thông minh với dấu chấm lửng
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4.5 border-b border-stone-800 bg-stone-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-stone-950">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-stone-100">
                  Kho lưu trữ ảnh/models
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Limit 10GB
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Theo dõi dung lượng CDN, kiểm soát tệp 3D và dọn dẹp các tệp chưa dùng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nội dung Modal */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Thước đo dung lượng tổng quan (Storage Meter) */}
          <div className="p-5 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-stone-400">Dung lượng ổ lưu trữ trên Server:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black font-mono text-stone-100">
                    {stats ? `${stats.totalSizeMB} MB` : "--"}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">/ 10,240 MB (10 GB)</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-stone-400">Tỷ lệ sử dụng:</span>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {stats ? `${stats.usedPercent}%` : "--%"}
                </div>
              </div>
            </div>

            {/* Thanh tiến trình phân tầng */}
            <div className="w-full h-3 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(1, Math.min(100, stats?.usedPercent || 0))}%` }}
              />
            </div>

            {/* Badges thống kê phân loại */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-2">
                  <Box className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-stone-400">Model GLB</div>
                    <div className="font-bold text-stone-200">
                      {stats.categoryStats.glb.count} tệp ({(stats.categoryStats.glb.sizeBytes / 1024 / 1024).toFixed(1)}M)
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-2">
                  <Box className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-stone-400">Apple USDZ</div>
                    <div className="font-bold text-stone-200">
                      {stats.categoryStats.usdz.count} tệp ({(stats.categoryStats.usdz.sizeBytes / 1024 / 1024).toFixed(1)}M)
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-2">
                  <ScanLine className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-stone-400">Target .mind</div>
                    <div className="font-bold text-stone-200">
                      {stats.categoryStats.mind.count} tệp ({(stats.categoryStats.mind.sizeBytes / 1024 / 1024).toFixed(1)}M)
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-stone-400">Hình ảnh</div>
                    <div className="font-bold text-stone-200">
                      {stats.categoryStats.images.count} tệp ({(stats.categoryStats.images.sizeBytes / 1024 / 1024).toFixed(1)}M)
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <div>
                    <div className="text-stone-400">Âm thanh</div>
                    <div className="font-bold text-stone-200">
                      {stats.categoryStats.audio.count} tệp ({(stats.categoryStats.audio.sizeBytes / 1024 / 1024).toFixed(1)}M)
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                  <FileQuestion className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-amber-300">Cần dọn dẹp</div>
                    <div className="font-bold text-amber-200">
                      {stats.orphanCount} tệp ({stats.orphanSizeMB}M)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thông báo kết quả */}
          {feedbackMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Thanh công cụ lọc & tìm kiếm */}
          <div className="flex flex-col gap-2.5">
            {/* Hàng 1: Tabs & Tìm kiếm & Phân trang */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-stone-950/80 border border-stone-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("orphans")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "orphans"
                      ? "bg-amber-500 text-stone-950 shadow-md"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <FileQuestion className="h-3.5 w-3.5" />
                  <span>Cần Dọn Dẹp ({orphans.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "all"
                      ? "bg-emerald-500 text-stone-950 shadow-md"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Tất Cả Tệp ({items.length})</span>
                </button>
              </div>

              {/* Ô tìm kiếm đa năng */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
                <input
                  type="text"
                  placeholder="Tìm theo tên tệp, tên thẻ bài, model 3D (VD: dautay, strawberry.glb)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Bộ chọn số lượng tệp mỗi trang */}
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                  title="Số tệp hiển thị mỗi trang"
                >
                  <option value={15}>15 tệp/trang</option>
                  <option value={20}>20 tệp/trang</option>
                  <option value={50}>50 tệp/trang</option>
                  <option value={100}>100 tệp/trang</option>
                </select>

                {/* Nút Làm mới */}
                <button
                  type="button"
                  onClick={fetchR2Data}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
                  title="Làm mới danh sách"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
                </button>

                {/* Nút Đặt lại bộ lọc */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-2.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Đặt lại tất cả bộ lọc"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span className="hidden sm:inline">Đặt lại</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hàng 2: Bộ lọc Chuyên Sâu (Danh mục, Mã bộ, Song ngữ, Định dạng) */}
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-stone-950/60 border border-stone-800/80">
              {/* Lọc Theo Danh Mục */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-300">
                <Filter className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent text-stone-200 font-bold text-xs focus:outline-none cursor-pointer max-w-[150px] truncate"
                  title="Lọc theo Danh mục thẻ bài"
                >
                  <option value="all" className="bg-stone-900 text-white">
                    Tất Cả Danh Mục
                  </option>
                  {availableCategories.map((c) => (
                    <option key={c.name} value={c.name} className="bg-stone-900 text-amber-300">
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc Theo Mã Bộ (Pack Code) */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-300">
                <PackageCheck className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <select
                  value={filterPackCode}
                  onChange={(e) => setFilterPackCode(e.target.value)}
                  className="bg-transparent text-stone-200 font-bold text-xs focus:outline-none cursor-pointer max-w-[170px] truncate font-mono"
                  title="Lọc theo Mã bộ thẻ bài"
                >
                  <option value="all" className="bg-stone-900 text-white font-sans">
                    Tất Cả Mã Bộ
                  </option>
                  <option value="none" className="bg-stone-900 text-amber-300 font-sans">
                    Chưa Có Mã Bộ
                  </option>
                  {availablePackCodes.map((p) => (
                    <option key={p.code} value={p.code} className="bg-stone-900 text-purple-300 font-mono">
                      Bộ: {p.code} ({p.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc Theo Song Ngữ */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-300">
                <Languages className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value as "all" | "en-vi" | "zh-vi")}
                  className="bg-transparent text-stone-200 font-bold text-xs focus:outline-none cursor-pointer"
                  title="Lọc theo Chế độ Song ngữ"
                >
                  <option value="all" className="bg-stone-900 text-white">
                    Tất Cả Song Ngữ
                  </option>
                  <option value="en-vi" className="bg-stone-900 text-amber-300">
                    Anh - Việt (EN-VI)
                  </option>
                  <option value="zh-vi" className="bg-stone-900 text-rose-300">
                    Trung - Việt (ZH-VI)
                  </option>
                </select>
              </div>

              {/* Lọc Theo Định Dạng Tệp */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-300">
                <select
                  value={filterExt}
                  onChange={(e) => setFilterExt(e.target.value)}
                  className="bg-transparent text-stone-200 font-bold text-xs focus:outline-none cursor-pointer"
                  title="Lọc theo định dạng tệp"
                >
                  <option value="all" className="bg-stone-900 text-white">Tất cả đuôi</option>
                  <option value="glb" className="bg-stone-900 text-indigo-300">.glb (Mô hình 3D)</option>
                  <option value="usdz" className="bg-stone-900 text-sky-300">.usdz (Apple AR)</option>
                  <option value="mind" className="bg-stone-900 text-cyan-300">.mind (Target AR)</option>
                  <option value="png" className="bg-stone-900 text-amber-300">.png (Ảnh thẻ/Phôi)</option>
                  <option value="jpg" className="bg-stone-900 text-amber-300">.jpg (Ảnh thẻ)</option>
                  <option value="mp3" className="bg-stone-900 text-rose-300">.mp3 (Âm thanh)</option>
                </select>
              </div>

              {/* Badge số tệp khớp bộ lọc */}
              <div className="ml-auto text-[11px] text-stone-400 font-medium">
                Khớp: <strong className="text-emerald-400">{displayedItems.length}</strong> tệp
              </div>
            </div>
          </div>

          {/* Bảng danh sách tệp */}
          <div className="rounded-2xl border border-stone-800 overflow-hidden bg-stone-950/40">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-stone-500 text-xs gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                <span>Đang quét danh sách tệp trên Cloudflare R2...</span>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="py-16 text-center text-stone-500 text-xs space-y-1">
                <p className="font-bold text-stone-400">
                  {activeTab === "orphans"
                    ? "Tuyệt vời! Không có tệp dư thừa nào cần dọn dẹp trên Cloudflare R2."
                    : "Không tìm thấy tệp nào phù hợp với bộ lọc."}
                </p>
                <p className="text-[11px] text-stone-600">
                  Toàn bộ các tệp 3D, USDZ và .mind đều đang được liên kết chuẩn mực với các thẻ trong database.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-900/80 text-stone-400 text-[11px] border-b border-stone-800">
                    <tr>
                      <th className="px-3 py-3 font-semibold text-center w-12 text-stone-500">STT</th>
                      <th className="px-4 py-3 font-semibold">Tên Tệp (Key)</th>
                      <th className="px-4 py-3 font-semibold">Định Dạng</th>
                      <th className="px-4 py-3 font-semibold text-right">Kích Thước</th>
                      <th className="px-4 py-3 font-semibold">Thẻ Bài & Mô Hình 3D Sử Dụng</th>
                      <th className="px-4 py-3 font-semibold text-center">Trạng Thái</th>
                      <th className="px-4 py-3 font-semibold text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                    {paginatedItems.map((item, index) => {
                      const stt = startIndex + index + 1;
                      return (
                        <tr key={item.key} className="hover:bg-stone-900/40 transition-colors">
                          <td className="px-3 py-2.5 text-center font-sans text-stone-500 font-medium">
                            {stt}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-stone-200 max-w-[220px]" title={item.key}>
                            <div className="flex items-center gap-2">
                              {item.extension === "glb" || item.extension === "usdz" ? (
                                <Box className="h-4 w-4 text-indigo-400 shrink-0" />
                              ) : ["jpg", "jpeg", "png", "webp"].includes(item.extension) ? (
                                <ImageIcon className="h-4 w-4 text-amber-400 shrink-0" />
                              ) : item.extension === "mind" ? (
                                <ScanLine className="h-4 w-4 text-cyan-400 shrink-0" />
                              ) : ["mp3", "wav", "m4a", "ogg"].includes(item.extension) ? (
                                <Volume2 className="h-4 w-4 text-rose-400 shrink-0" />
                              ) : (
                                <HardDrive className="h-4 w-4 text-stone-400 shrink-0" />
                              )}
                              <span className="truncate">{item.key}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 uppercase text-stone-400 font-semibold">
                            .{item.extension}
                          </td>
                          <td className="px-4 py-2.5 text-right text-stone-300">
                            {(item.size / 1024 / 1024).toFixed(2)} MB
                          </td>
                          <td className="px-4 py-2.5">
                            {item.usedBy && item.usedBy.length > 0 ? (
                              <div className="flex flex-col gap-1.5 max-w-[340px]">
                                {item.usedBy.slice(0, 2).map((u, idx) => (
                                  <div
                                    key={idx}
                                    className="p-1.5 rounded-lg bg-stone-900/90 border border-stone-800 text-[10px] flex flex-col gap-1 hover:border-emerald-500/40 transition-colors"
                                  >
                                    {/* Tên thẻ bài và vai trò của tệp */}
                                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                      <span className="font-bold text-emerald-300 truncate" title={`${u.name} (slug: ${u.slug})`}>
                                        {u.name}
                                      </span>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 font-sans">
                                        {u.role}
                                      </span>
                                    </div>

                                    {/* Model 3D đang sử dụng & Mã bộ */}
                                    <div className="flex items-center gap-1.5 flex-wrap text-[9px]">
                                      {u.modelName ? (
                                        <span
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold"
                                          title={`Thẻ này đang sử dụng mô hình 3D: ${u.modelName}`}
                                        >
                                          <Box className="h-3 w-3 text-indigo-400 shrink-0" />
                                          <span className="truncate max-w-[130px]">3D: {u.modelName}</span>
                                        </span>
                                      ) : (
                                        <span className="text-stone-500 italic font-sans">
                                          Chưa gắn 3D
                                        </span>
                                      )}

                                      {/* Mã bộ */}
                                      {u.packCode && (
                                        <span
                                          className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono truncate max-w-[110px]"
                                          title={`Mã bộ: ${u.packCode}`}
                                        >
                                          {u.packCode}
                                        </span>
                                      )}

                                      {/* Song ngữ */}
                                      <span
                                        className={`px-1 py-0.5 rounded border text-[9px] font-bold ${
                                          u.enableZhVi
                                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                        }`}
                                      >
                                        {u.enableZhVi ? "ZH-VI" : "EN-VI"}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {item.usedBy.length > 2 && (
                                  <span className="text-[9px] text-stone-400 italic">
                                    +{item.usedBy.length - 2} thẻ bài khác cùng sử dụng
                                  </span>
                                )}
                              </div>
                            ) : item.isProtected ? (
                              <span className="text-sky-300 text-[10px] font-sans italic flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-sky-400" /> Hệ thống mặc định
                              </span>
                            ) : (
                              <span className="text-amber-400/80 text-[10px] font-sans italic flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-amber-400" /> Chưa gắn thẻ bài nào
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {item.isProtected ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                                Hệ thống
                              </span>
                            ) : item.isOrphan ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                Cần dọn dẹp
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                Đang dùng
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 transition-colors cursor-pointer"
                                title="Mở URL công khai"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>

                              {!item.isProtected && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSingle(item.key)}
                                  disabled={isCleaning}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                                  title="Xóa tệp khỏi R2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Thanh Điều Hướng Phân Trang */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-stone-950/60 border border-stone-800 rounded-2xl">
              <div className="text-xs text-stone-400 font-medium">
                Hiển thị <span className="text-emerald-400 font-bold">{startIndex + 1} - {endIndex}</span> trong tổng số <span className="text-stone-200 font-bold">{totalItems}</span> tệp (Trang {safeCurrentPage}/{totalPages})
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {/* Trang đầu */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-100 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Về trang đầu"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Trang trước */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-100 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Các số trang */}
                {pageNumbers.map((p, idx) => {
                  if (p === "dots") {
                    return (
                      <span key={`dots-${idx}`} className="px-2 text-stone-600 font-bold select-none text-xs">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = p === safeCurrentPage;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20 font-black"
                          : "border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Trang sau */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-100 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Trang cuối */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-100 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Đến trang cuối"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-t border-stone-800 bg-stone-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2.5">
            {orphans.length > 0 && (
              <button
                type="button"
                onClick={handleCleanAllOrphans}
                disabled={isCleaning}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-stone-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50"
              >
                {isCleaning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Đang Dọn Dẹp...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Dọn Dẹp Tất Cả Tệp Chưa Dùng ({stats?.orphanSizeMB} MB)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

