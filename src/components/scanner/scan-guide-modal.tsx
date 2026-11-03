"use client";

import React, { useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  SunMedium,
  Maximize2,
  Scan,
  CheckCircle2,
} from "lucide-react";

interface GuideCardSummary {
  slug?: string;
  nameEn?: string;
  nameVi?: string;
  posterUrl?: string;
  images?: string[];
}

interface ScanGuideModalProps {
  expectedAnimal?: GuideCardSummary;
  onStartScan: () => void;
}

export function ScanGuideModal({
  expectedAnimal,
  onStartScan,
}: ScanGuideModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus trap & Khóa cuộn nền khi mở modal
  useEffect(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus vào phần tử đầu tiên có thể focus trong modal
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(focusableSelectors);
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onStartScan();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      // Trả focus về phần tử ban đầu khi đóng modal
      previousActiveElementRef.current?.focus?.();
    };
  }, [onStartScan]);

  const posterImageSrc =
    expectedAnimal?.posterUrl ||
    expectedAnimal?.images?.[0] ||
    "/images/cards/walk-card.jpg";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onStartScan}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-t-[2rem] sm:rounded-3xl border-t sm:border border-amber-200/60 bg-gradient-to-b from-[#FFFDF9] to-[#FBF8EF] p-5 sm:p-7 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-stone-900 max-h-[90dvh] overflow-y-auto"
      >
        {/* Nút Đóng X */}
        <button
          type="button"
          onClick={onStartScan}
          aria-label="Đóng hướng dẫn"
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-all active:scale-90 cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-stone-950 shadow-sm">
            <Scan className="h-5 w-5" />
          </div>
          <div>
            <h2 id="guide-title" className="text-lg font-black text-stone-900">
              Mẹo Quét Thẻ AR Nhanh &amp; Chuẩn
            </h2>
            <p className="text-xs font-semibold text-stone-500">
              Poly Cards • Trải nghiệm thế giới 3D sống động
            </p>
          </div>
        </div>

        {/* Mục tiêu hiện tại nếu có ?expect= */}
        {expectedAnimal && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-2.5">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-amber-300 bg-white shadow-xs shrink-0 flex items-center justify-center">
              <img
                src={posterImageSrc}
                alt={expectedAnimal.nameEn || "Target card"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/cards/walk-card.jpg";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Thẻ mục tiêu cần quét:
              </div>
              <div className="truncate text-xs font-black text-stone-900">
                {expectedAnimal.nameEn || expectedAnimal.slug}
                {expectedAnimal.nameVi ? ` (${expectedAnimal.nameVi})` : ""}
              </div>
            </div>
          </div>
        )}

        {/* 3 Mẹo quan trọng */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-start gap-3 rounded-2xl border border-stone-200/70 bg-white p-3 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Maximize2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-800">
                1. Khoảng cách lý tưởng 10 - 20 cm
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                Cầm thẻ thẳng trước camera sao cho toàn bộ mã QR nằm trọn trong khung ngắm xanh.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-stone-200/70 bg-white p-3 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <SunMedium className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-800">
                2. Đảm bảo đủ ánh sáng
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                Tránh bóng râm quá tối hoặc ánh đèn chói thẳng vào thẻ bài. Có thể bật nút đèn flash trên góc màn hình.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-stone-200/70 bg-white p-3 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-800">
                3. Có thể dùng ảnh chụp từ thư viện
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                Nếu camera mờ hoặc không xin được quyền, bấm nút <strong>&quot;Tải Ảnh Mã QR&quot;</strong> ở dưới đáy để quét từ album ảnh máy.
              </p>
            </div>
          </div>
        </div>

        {/* Nút Đã hiểu */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onStartScan}
            className="btn-toy-3d flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-black text-stone-950 shadow-md shadow-amber-500/25 hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Đã Hiểu, Bắt Đầu Quét Thẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
