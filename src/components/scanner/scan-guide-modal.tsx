"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Animal } from "@/types/animal";
import { getAllAnimals } from "@/lib/animals";
import {
  Camera,
  QrCode,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Box,
  Layers,
  Smartphone,
  ScanLine,
  Volume2,
  CheckCircle2,
  Lightbulb,
  Zap,
} from "lucide-react";

interface ScanGuideModalProps {
  expectedAnimal?: Animal;
  onStartScan: () => void;
}

export function ScanGuideModal({
  expectedAnimal,
  onStartScan,
}: ScanGuideModalProps) {
  const allAnimals = getAllAnimals();
  // Display animal for preview simulation (use expected animal or default to Lion)
  const displayAnimal = expectedAnimal || allAnimals[4] || allAnimals[0];

  return (
    <div
      suppressHydrationWarning
      className="relative flex min-h-[100dvh] w-full flex-col justify-between overflow-x-hidden bg-gradient-to-br from-amber-50/80 via-[#FCFBF7] to-emerald-50/60 p-4 sm:p-6 lg:p-8"
    >
      {/* Ambient Playful Background Orbs */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-amber-300/25 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />

      {/* 1. Header Toolbar */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-amber-200/90 bg-white/95 px-4 py-2 text-xs font-black text-slate-800 shadow-sm backdrop-blur-md transition-all hover:bg-amber-50 hover:scale-102 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-amber-600" />
          <span>Về Trang Chủ</span>
        </Link>

        <div className="flex items-center gap-2 rounded-full border-2 border-emerald-300/80 bg-white/95 px-4 py-1.5 shadow-sm backdrop-blur-md">
          <div className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-xs font-black tracking-tight text-emerald-950">
            Camera AR Live
          </span>
        </div>
      </header>

      {/* 2. Main Center Card Showcase */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-5xl py-4 sm:py-6">
        <div className="overflow-hidden rounded-[2.5rem] border-2 border-amber-200/90 bg-white/95 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-amber-950/10 backdrop-blur-xl">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
            
            {/* ========================================================= */}
            {/* LEFT COLUMN: Visual AR Card Scanning Simulation (5 cols)  */}
            {/* ========================================================= */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[300px]">
                {/* Outer Glow Halo */}
                <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-tr from-amber-400/30 via-emerald-400/20 to-sky-400/30 blur-xl" />

                {/* Simulated Physical Toy Card */}
                <div className="relative aspect-3/4 w-full overflow-hidden rounded-[2rem] border-4 border-amber-300 bg-white p-4 shadow-xl flex flex-col justify-between">
                  {/* Card Header Brand */}
                  <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                    <div className="flex items-center gap-1.5">
                      <div className="relative h-6 w-6 rounded-full bg-amber-100 p-0.5 border border-amber-300">
                        <Image
                          src="/images/icons/logo.png"
                          alt="Poly Cards"
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-black tracking-wider text-slate-800">
                        POLY CARDS
                      </span>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-800 border border-emerald-200">
                      AR 3D LIVE
                    </span>
                  </div>

                  {/* 3D Animal Poster Image */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-tr from-sky-50 via-amber-50 to-emerald-50 border border-amber-200/70 shadow-inner my-2">
                    <Image
                      src={displayAnimal.images[0] || "/images/animals/lion.jpg"}
                      alt={displayAnimal.nameEn}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 z-10 rounded-md bg-stone-900/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                      {displayAnimal.nameEn} • {displayAnimal.nameVi}
                    </div>
                  </div>

                  {/* Simulated QR Code on Card with Laser Scan Animation */}
                  <div className="relative rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 p-2.5 border-2 border-dashed border-amber-300 flex items-center gap-3">
                    {/* Simulated Mini QR Code */}
                    <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-white p-1 border border-amber-200 shadow-sm flex items-center justify-center">
                      <Image
                        src={`/qr-output/${displayAnimal.slug}-qr.png`}
                        alt="QR Code"
                        width={48}
                        height={48}
                        className="object-contain"
                        onError={(e) => {
                          // Fallback to lion QR if specific not available
                          (e.target as any).src = "/qr-output/lion-qr.png";
                        }}
                      />

                      {/* Animated Laser Scanning Beam */}
                      <div
                        className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse"
                        style={{
                          top: "50%",
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-black text-amber-950">
                        <ScanLine className="h-3.5 w-3.5 text-emerald-600 animate-spin" style={{ animationDuration: "8s" }} />
                        <span>Vùng Quét Thẻ</span>
                      </div>
                      <span className="block text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                        Mã QR gắn trên thẻ bài hoặc đế đồ chơi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Micro-Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-900 px-3.5 py-1 text-[11px] font-extrabold text-white shadow-lg border border-amber-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Tự động nhận diện trong 0.2s</span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT COLUMN: Instructions, Steps & Action CTA (7 cols)   */}
            {/* ========================================================= */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Headline Block */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-950 border border-emerald-300">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>KHÔNG CẦN CÀI ĐẶT APP</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {expectedAnimal ? (
                    <>
                      Kích Hoạt AR 3D{" "}
                      <span className="text-emerald-600">{expectedAnimal.nameEn}</span>
                    </>
                  ) : (
                    "Quét Mã QR Mở Thế Giới AR 3D"
                  )}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Camera trực tuyến của Poly Cards quét mã QR trên thẻ bài và đưa mô hình 3D xoay 360° chuyển động tức thì cùng giọng phát âm bản xứ.
                </p>
              </div>

              {/* 3 Redesigned Playful Step Cards */}
              <div className="grid grid-cols-1 gap-3">
                {/* Step 1 */}
                <div className="group flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/80 bg-amber-50/50 p-3 sm:p-3.5 transition-all hover:bg-amber-50 hover:border-amber-400 shadow-2xs">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 font-black text-slate-950 shadow-sm text-sm">
                    01
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-900">
                      <Layers className="h-3.5 w-3.5 text-amber-700" />
                      <span>Cầm thẻ bài Poly Cards</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-snug mt-0.5">
                      Hướng mặt có in mã QR sắc nét về phía camera điện thoại.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="group flex items-center gap-3.5 rounded-2xl border-2 border-emerald-200/80 bg-emerald-50/50 p-3 sm:p-3.5 transition-all hover:bg-emerald-50 hover:border-emerald-400 shadow-2xs">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 font-black text-white shadow-sm text-sm">
                    02
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-900">
                      <Smartphone className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Giữ cự ly 10–15cm</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-snug mt-0.5">
                      Đặt mã QR nằm gọn trong khung ngắm ở nơi có ánh sáng tốt.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="group flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/80 bg-sky-50/50 p-3 sm:p-3.5 transition-all hover:bg-sky-50 hover:border-sky-400 shadow-2xs">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-400 to-blue-500 font-black text-white shadow-sm text-sm">
                    03
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-900">
                      <Volume2 className="h-3.5 w-3.5 text-sky-700" />
                      <span>Khám phá 3D & Học âm thanh</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-snug mt-0.5">
                      Con vật lập tức xuất hiện, bé chạm xoay 360° và nghe phát âm 3 thứ tiếng.
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Launch Action Button */}
              <button
                type="button"
                onClick={onStartScan}
                className="btn-toy-3d flex min-h-[54px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-3.5 text-base font-black text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-102 active:scale-95"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <span>Bật Máy Ảnh & Bắt Đầu Quét</span>
              </button>

              {/* Fast-Pass: Quick Animal Preview Pills for Users without physical cards */}
              <div className="pt-2 border-t border-amber-100">
                <span className="text-[11px] font-black text-slate-500 block mb-2">
                  Chưa có thẻ bài giấy? Chọn nhanh để xem ngay mô hình 3D AR:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {allAnimals.map((animal) => (
                    <Link
                      key={animal.id}
                      href={`/ar/${animal.slug}?ar=1`}
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-xs font-bold text-amber-950 transition-all hover:bg-amber-100 hover:scale-105 active:scale-95 shadow-2xs"
                    >
                      <div className="relative h-4 w-4 shrink-0 rounded-full overflow-hidden border border-amber-300">
                        <Image
                          src={animal.images[0] || "/images/animals/lion.jpg"}
                          alt={animal.nameVi}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span>{animal.nameEn}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 3. Safety & Privacy Footer Seal */}
      <footer className="relative z-10 mx-auto flex items-center justify-center gap-2 text-center text-xs font-bold text-emerald-800 pt-2 pb-1">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Camera bảo mật 100% • Xử lý trực tiếp trên thiết bị • Không lưu hình ảnh • Hoàn toàn không quảng cáo</span>
      </footer>
    </div>
  );
}
