"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Animal } from "@/types/animal";
import { Camera, QrCode, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";

interface ScanGuideModalProps {
  expectedAnimal?: Animal;
  onStartScan: () => void;
}

export function ScanGuideModal({
  expectedAnimal,
  onStartScan,
}: ScanGuideModalProps) {
  return (
    <div
      suppressHydrationWarning
      className="flex min-h-[100dvh] w-full flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-sky-50 via-amber-50/50 to-emerald-50/40"
    >
      {/* Top Bar */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-stone-700 hover:bg-white/80 active:scale-95 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-amber-600" />
          <span>Trang Chủ</span>
        </Link>

        <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
          Hướng Dẫn Quét AR
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md rounded-3xl border-2 border-amber-200/90 bg-white/95 p-6 shadow-xl shadow-amber-900/5 my-auto space-y-5 text-center">
        {/* Expected Animal Preview Banner (if expect mode) */}
        {expectedAnimal ? (
          <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 flex items-center gap-3 text-left">
            <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-amber-300 shadow-xs">
              <Image
                src={expectedAnimal.images[0] || "/images/animals/lion.jpg"}
                alt={expectedAnimal.nameVi}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
                Mục tiêu trải nghiệm:
              </span>
              <h4 className="text-base font-black text-stone-900">
                {expectedAnimal.nameEn} ({expectedAnimal.nameVi})
              </h4>
              <p className="text-xs text-stone-600">
                Hãy tìm và quét mã QR của bạn {expectedAnimal.nameVi} nhé!
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
            <QrCode className="h-8 w-8 text-amber-600" />
          </div>
        )}

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            {expectedAnimal
              ? `Sẵn Sàng Mở Ra ${expectedAnimal.nameEn} 3D`
              : "Khám Phá Thế Giới Động Vật AR"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-600">
            Trình quét trực tuyến Poly Cards sẽ kích hoạt camera sau của bạn để nhận diện mã QR trên thẻ bài.
          </p>
        </div>

        {/* 3 Step Visual Guide */}
        <div className="space-y-2.5 text-left text-xs font-medium text-stone-700">
          <div className="flex items-start gap-2.5 rounded-xl bg-stone-50 p-3 border border-stone-200/60">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>1. Chuẩn bị thẻ bài hoặc đế mô hình Poly Cards có in mã QR.</span>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl bg-stone-50 p-3 border border-stone-200/60">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>2. Giữ điện thoại cách mã QR khoảng 10–15cm ở nơi đủ ánh sáng.</span>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl bg-stone-50 p-3 border border-stone-200/60">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>3. Nhấn nút bên dưới để cấp quyền mở máy ảnh và bắt đầu quét.</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={onStartScan}
          className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-base font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all"
        >
          <Camera className="h-5 w-5" />
          <span>Mở Camera & Bắt Đầu Quét</span>
        </button>
      </div>

      {/* Safe bottom notice */}
      <div className="text-center text-[11px] text-stone-500 pb-2">
        Camera chỉ dùng để nhận diện mã QR của đồ chơi • Không lưu trữ hình ảnh cá nhân
      </div>
    </div>
  );
}
