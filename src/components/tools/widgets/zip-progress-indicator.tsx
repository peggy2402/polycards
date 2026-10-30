"use client";

import React, { useState } from "react";
import {
  FolderArchive,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronUp,
  ChevronDown,
  Download,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";
import { ZipExportProgressState } from "../types";

interface ZipProgressIndicatorProps {
  progress: ZipExportProgressState;
  onCancel: () => void;
  onClose: () => void;
}

export function ZipProgressIndicator({
  progress,
  onCancel,
  onClose,
}: ZipProgressIndicatorProps) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);

  if (!progress.isOpen) return null;

  const isCompleted = progress.isCompleted;
  const isCancelled = progress.isCancelled;
  const isCompressing = progress.isCompressing;

  return (
    <aside
      aria-label="Tiến trình xuất tệp ZIP"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-[410px] bg-stone-900/95 backdrop-blur-xl border-2 border-purple-400/60 rounded-2xl sm:rounded-3xl shadow-2xl text-white overflow-hidden ring-1 ring-purple-400/30 animate-in slide-in-from-bottom-5 duration-200"
    >
      {/* HEADER COMPACT */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-purple-950/70 via-stone-900 to-stone-950 border-b border-white/10">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-400/30"
                  : isCancelled
                  ? "bg-rose-500/20 text-rose-400 border-rose-400/30"
                  : "bg-purple-500/20 text-purple-400 border-purple-400/30"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : isCancelled ? (
                <AlertCircle className="h-5 w-5 text-rose-400" />
              ) : (
                <RefreshCw className="h-5 w-5 text-purple-400 animate-spin" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">
                  {isCompleted
                    ? "Đã Xuất Xong Tệp ZIP"
                    : isCancelled
                    ? "Đã Hủy Tiến Trình"
                    : isCompressing
                    ? "Đang Nén Tệp .ZIP..."
                    : "Đang Đóng Gói Phôi In..."}
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
                  {progress.current}/{progress.total}
                </span>
              </div>

              <div className="text-[11px] text-stone-300 truncate font-mono mt-0.5">
                {isCompleted ? (
                  <span className="text-emerald-400 font-semibold">Tải về hoàn tất 100%!</span>
                ) : isCancelled ? (
                  <span className="text-rose-400 font-semibold">Đã dừng tạo file in.</span>
                ) : isCompressing ? (
                  <span className="text-amber-300">Đang nén dữ liệu Deflate...</span>
                ) : (
                  <span>
                    Vẽ QR: <strong className="text-amber-300">{progress.currentCardName || "Chuẩn bị..."}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS (Chi tiết + Hủy/Đóng) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title={isDetailsExpanded ? "Thu gọn chi tiết" : "Xem chi tiết tiến trình"}
            >
              {isDetailsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>

            {!isCompleted && !isCancelled && (
              <button
                type="button"
                onClick={onCancel}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                title="Hủy tiến trình tạo ZIP"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hủy</span>
              </button>
            )}

            {(isCompleted || isCancelled) && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
                title="Đóng thông báo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* THANH TIẾN TRÌNH % */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-stone-400">Tiến độ xuất phôi:</span>
            <span className="font-bold text-amber-300">{progress.percent}%</span>
          </div>

          <div className="h-2 w-full bg-stone-950 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isCompleted
                  ? "bg-emerald-400"
                  : isCancelled
                  ? "bg-rose-500"
                  : "bg-gradient-to-r from-purple-500 via-amber-400 to-emerald-400"
              }`}
              style={{ width: `${Math.min(100, Math.max(2, progress.percent))}%` }}
            />
          </div>
        </div>
      </div>

      {/* DANH SÁCH CHI TIẾT TỪNG THẺ KHI MỞ RỘNG (DETAILS DRAWER) */}
      {isDetailsExpanded && (
        <div className="p-3.5 bg-stone-950/90 border-t border-white/10 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] text-stone-400 font-bold">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-purple-400" />
              <span>Danh sách thẻ in ({progress.items.length} thẻ):</span>
            </div>
            <span className="font-mono text-stone-500 truncate max-w-[150px]">
              {progress.zipFileName}
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-stone-700">
            {progress.items.map((item, idx) => (
              <div
                key={`${item.slug}-${idx}`}
                className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 border ${
                  item.status === "done"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-stone-200"
                    : item.status === "processing"
                    ? "bg-amber-500/15 border-amber-400/40 text-amber-200 font-bold"
                    : "bg-white/5 border-transparent text-stone-400"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-stone-500 shrink-0">
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate">{item.nameVi}</span>
                  {item.category && (
                    <span className="text-[10px] text-stone-500 truncate hidden sm:inline">
                      ({item.category})
                    </span>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {item.status === "done" && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Xong</span>
                    </span>
                  )}
                  {item.status === "processing" && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-300 font-bold">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Đang vẽ QR</span>
                    </span>
                  )}
                  {item.status === "pending" && (
                    <span className="flex items-center gap-1 text-[10px] text-stone-500">
                      <Clock className="h-3 w-3" />
                      <span>Chờ</span>
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="flex items-center gap-1 text-[10px] text-rose-400">
                      <AlertCircle className="h-3 w-3" />
                      <span>Lỗi</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isCompleted && !isCancelled && (
            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Hủy Tiến Trình Đóng Gói Này</span>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

