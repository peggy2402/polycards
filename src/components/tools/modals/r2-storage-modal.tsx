"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface R2UsedByProduct {
  slug: string;
  name: string;
  category?: string;
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

  if (!isOpen) return null;

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

  // Lọc danh sách tệp: hỗ trợ tìm theo tên tệp (key), định dạng, tên thẻ bài hoặc slug sản phẩm
  const displayedItems = (activeTab === "orphans" ? orphans : items).filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchKey = item.key.toLowerCase().includes(q);
      const matchProduct = item.usedBy?.some(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.slug.toLowerCase().includes(q) ||
          (u.category && u.category.toLowerCase().includes(q)) ||
          u.role.toLowerCase().includes(q)
      );
      if (!matchKey && !matchProduct) return false;
    }
    if (filterExt === "all") return true;
    return item.extension.toLowerCase() === filterExt.toLowerCase();
  });

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

            {/* Bộ lọc & Tìm kiếm */}
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
                <input
                  type="text"
                  placeholder="Tìm tên tệp hoặc tên thẻ (VD: Đi bộ, walk, card)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={filterExt}
                onChange={(e) => setFilterExt(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tất cả đuôi</option>
                <option value="glb">.glb (3D)</option>
                <option value="usdz">.usdz (iOS)</option>
                <option value="mind">.mind (Target)</option>
                <option value="png">.png</option>
                <option value="jpg">.jpg</option>
              </select>

              <button
                type="button"
                onClick={fetchR2Data}
                disabled={isLoading}
                className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
                title="Làm mới danh sách"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
              </button>
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
                      <th className="px-4 py-3 font-semibold">Thẻ Bài Sử Dụng</th>
                      <th className="px-4 py-3 font-semibold text-center">Trạng Thái</th>
                      <th className="px-4 py-3 font-semibold text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                    {displayedItems.map((item, index) => (
                      <tr key={item.key} className="hover:bg-stone-900/40 transition-colors">
                        <td className="px-3 py-2.5 text-center font-sans text-stone-500 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-stone-200 max-w-[220px] truncate" title={item.key}>
                          {item.key}
                        </td>
                        <td className="px-4 py-2.5 uppercase text-stone-400 font-semibold">
                          .{item.extension}
                        </td>
                        <td className="px-4 py-2.5 text-right text-stone-300">
                          {(item.size / 1024 / 1024).toFixed(2)} MB
                        </td>
                        <td className="px-4 py-2.5">
                          {item.usedBy && item.usedBy.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1 max-w-[280px]">
                              {item.usedBy.slice(0, 2).map((u, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-900 border border-emerald-500/30 text-[10px] text-stone-200"
                                  title={`${u.name} (slug: ${u.slug}) - ${u.role}`}
                                >
                                  <span className="font-bold text-emerald-400 truncate max-w-[110px]">
                                    {u.name}
                                  </span>
                                  <span className="text-[9px] text-stone-400 font-sans">
                                    ({u.role})
                                  </span>
                                </span>
                              ))}
                              {item.usedBy.length > 2 && (
                                <span className="px-1.5 py-0.5 rounded bg-stone-800 text-[9px] text-stone-400">
                                  +{item.usedBy.length - 2} thẻ khác
                                </span>
                              )}
                            </div>
                          ) : item.isProtected ? (
                            <span className="text-sky-300 text-[10px] font-sans italic">
                              Hệ thống mặc định
                            </span>
                          ) : (
                            <span className="text-amber-400/80 text-[10px] font-sans italic">
                              Chưa gắn thẻ bài nào
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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

