import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, QrCode, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Not Found | Poly Cards",
  description: "Trang hoặc thẻ bài bạn đang tìm kiếm không tồn tại trên hệ thống Poly Cards.",
};

export default function NotFound() {
  return (
    <div
      suppressHydrationWarning
      className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-sky-50 via-amber-50/50 to-emerald-50/40 text-center"
    >
      <div className="w-full max-w-md rounded-3xl border-2 border-amber-200/90 bg-white/95 p-8 shadow-xl shadow-amber-900/5 space-y-6">
        {/* Brand Logo */}
        <div className="mx-auto relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-xs p-1">
          <Image
            src="/images/icons/logo.png"
            alt="Poly Cards"
            width={64}
            height={64}
            priority
            className="h-full w-full object-contain"
          />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-900 border border-amber-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>404 • Không Tìm Thấy Trang</span>
          </span>

          <h1 className="text-2xl font-black text-stone-900 sm:text-3xl">
            Bạn Nhỏ Này Đi Lạc Rồi!
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Thẻ bài hoặc trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang danh mục khác.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay Về Trang Chủ</span>
          </Link>

          <Link
            href="/scan"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-3 text-sm font-extrabold text-amber-950 hover:bg-amber-100 active:scale-95 transition-all"
          >
            <QrCode className="h-4 w-4 text-amber-700" />
            <span>Mở Trình Quét AR</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
