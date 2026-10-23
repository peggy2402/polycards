"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Animal } from "@/types/animal";
import { getAllAnimals } from "@/lib/animals";
import { Camera, QrCode, Sparkles, ArrowLeft, CheckCircle2, ShieldCheck, Box } from "lucide-react";

interface ScanGuideModalProps {
  expectedAnimal?: Animal;
  onStartScan: () => void;
}

export function ScanGuideModal({
  expectedAnimal,
  onStartScan,
}: ScanGuideModalProps) {
  const animals = getAllAnimals();

  return (
    <div
      suppressHydrationWarning
      className="flex min-h-[100dvh] w-full flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-sky-50 via-amber-50/50 to-emerald-50/40"
    >
      {/* Top Bar */}
      <div className="w-full max-w-lg flex items-center justify-between pt-2">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-xs font-black text-slate-800 hover:bg-amber-50 active:scale-95 transition-all shadow-xs"
        >
          <ArrowLeft className="h-4 w-4 text-amber-600" />
          <span>Về Trang Chủ</span>
        </Link>

        <span className="text-xs font-black text-emerald-950 bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-300">
          Công Nghệ Camera AR
        </span>
      </div>

      {/* Main Guide Card */}
      <div className="w-full max-w-lg rounded-[2.5rem] border-2 border-amber-200/90 bg-white/98 p-6 sm:p-8 shadow-2xl shadow-amber-950/10 my-auto space-y-6 text-center">
        {/* Expected Animal Preview Banner (if expect mode) */}
        {expectedAnimal ? (
          <div className="rounded-3xl bg-amber-50/90 p-4 border-2 border-amber-200 flex items-center gap-3.5 text-left">
            <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-sm">
              <Image
                src={expectedAnimal.images[0] || "/images/animals/lion.jpg"}
                alt={expectedAnimal.nameVi}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">
                Mục tiêu trải nghiệm:
              </span>
              <h4 className="text-lg font-black text-slate-900">
                {expectedAnimal.nameEn} ({expectedAnimal.nameVi})
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                Hãy đưa camera vào mã QR in trên thẻ bài {expectedAnimal.nameVi} nhé!
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30">
            <QrCode className="h-8 w-8" />
          </div>
        )}

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {expectedAnimal
              ? `Kích Hoạt AR 3D ${expectedAnimal.nameEn}`
              : "Quét Mã QR Mở Thế Giới AR 3D"}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Không cần cài đặt ứng dụng nặng máy. Camera trực tuyến của Poly Cards quét mã QR trên thẻ bài và đưa mô hình 3D xoay 360° chuyển động tức thì.
          </p>
        </div>

        {/* 3 Step Visual Guide */}
        <div className="space-y-2.5 text-left text-xs font-semibold text-slate-700">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50/60 p-3.5 border border-amber-200/70">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>1. Chuẩn bị thẻ bài hoặc đế đồ chơi Poly Cards có in mã QR sắc nét.</span>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/60 p-3.5 border border-emerald-200/70">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>2. Đặt camera cách mã QR 10–15cm ở nơi đủ ánh sáng (có thể bật đèn flash).</span>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-sky-50/60 p-3.5 border border-sky-200/70">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>3. Hệ thống tự động nhận diện và mở ra không gian tương tác 3D cùng giọng đọc bản xứ.</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onStartScan}
          className="btn-toy-3d flex min-h-[54px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-3.5 text-base font-black text-white shadow-xl shadow-emerald-600/30 active:scale-95 transition-all"
        >
          <Camera className="h-5 w-5" />
          <span>Bật Máy Ảnh & Bắt Đầu Quét</span>
        </button>

        {/* Virtual Demo Fast-Pass for users without physical cards */}
        <div className="pt-2 border-t border-amber-100 text-center space-y-2">
          <span className="text-[11px] font-black text-slate-500 block">
            Hoặc thử nhanh mô hình AR trực tiếp (không cần quét):
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {animals.slice(0, 4).map((a) => (
              <Link
                key={a.id}
                href={`/ar/${a.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
              >
                <Box className="h-3.5 w-3.5 text-emerald-600" />
                <span>Xem {a.nameEn}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Safe bottom notice */}
      <div className="flex items-center gap-1.5 text-center text-xs font-bold text-emerald-800 pb-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Camera bảo mật 100% • Không lưu trữ hình ảnh • Hoàn toàn không quảng cáo</span>
      </div>
    </div>
  );
}
