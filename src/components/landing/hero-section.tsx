"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  QrCode,
  Compass,
  Sparkles,
  ShieldCheck,
  Volume2,
  Eye,
  Smartphone,
  RotateCw,
  Box,
  CheckCircle2,
} from "lucide-react";

export function HeroSection() {
  const [playingLang, setPlayingLang] = useState<"en" | "vi" | null>(null);

  const handlePlayAudio = (lang: "en" | "vi") => {
    try {
      setPlayingLang(lang);
      const audioPath = lang === "en" ? "/audio/en/lion.mp3" : "/audio/vi/lion.mp3";
      const audio = new Audio(audioPath);
      audio.onended = () => setPlayingLang(null);
      audio.onerror = () => setPlayingLang(null);
      audio.play().catch(() => setPlayingLang(null));
    } catch {
      setPlayingLang(null);
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24">
      {/* Decorative Warm & Sunny Glow Orbs */}
      <div
        className="pointer-events-none absolute -top-20 left-10 -z-10 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-amber-300/35 via-yellow-200/25 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/4 -right-10 -z-10 h-[30rem] w-[30rem] rounded-full bg-gradient-to-bl from-sky-300/30 via-teal-200/20 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-1/3 -z-10 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Headlines & Content */}
          <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
            {/* Top Playful Capsule Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-amber-300/90 bg-white/95 px-4 py-1.5 text-xs font-black text-amber-950 shadow-sm backdrop-blur-md">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>BỘ THẺ THÔNG MINH 3D AR • CHO BÉ 3–8 TUỔI</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-300/80 bg-emerald-50/90 px-3.5 py-1.5 text-xs font-black text-emerald-900 shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>KHÔNG CẦN CÀI APP</span>
              </div>
            </div>

            {/* Main Punchy Typography */}
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-5xl xl:text-6xl leading-[1.12]">
              Học tiếng Anh bằng cách{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 bg-clip-text text-transparent block sm:inline">
                chạm vào thế giới thật
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0 font-medium">
              Bộ thẻ bài đồ chơi giáo dục cao cấp kết hợp công nghệ thực tế ảo AR. Bé tự tay cầm nắm thẻ bài xinh xắn, quét mã QR để mở ra thế giới muông thú 3D chuyển động sống động kèm giọng đọc bản xứ chuẩn quốc tế IPA.
            </p>

            {/* Tactile 3D Action Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start pt-2">
              <Link
                href="/scan"
                className="btn-toy-3d inline-flex min-h-[54px] w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-102 active:scale-98"
              >
                <QrCode className="h-5 w-5" />
                <span>Quét QR Trải Nghiệm AR</span>
              </Link>

              <a
                href="#products"
                className="inline-flex min-h-[54px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl border-2 border-amber-300 bg-white px-7 py-4 text-base font-black text-amber-950 shadow-md shadow-amber-950/5 transition-all hover:bg-amber-50 hover:border-amber-400 hover:scale-102 active:scale-98"
              >
                <Compass className="h-5 w-5 text-amber-600" />
                <span>Khám Phá 6 Bạn Thú</span>
              </a>
            </div>

            {/* 3 Tactile Glassmorphism Trust Badges */}
            <div className="pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
                {/* Badge 1 */}
                <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-200/90 bg-white/95 p-3.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 leading-snug">
                    100% Không quảng cáo & link lạ
                  </span>
                </div>

                {/* Badge 2 */}
                <div className="flex items-center gap-3 rounded-2xl border-2 border-amber-200/90 bg-white/95 p-3.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 leading-snug">
                    Phát âm tiếng Anh chuẩn bản xứ IPA
                  </span>
                </div>

                {/* Badge 3 */}
                <div className="flex items-center gap-3 rounded-2xl border-2 border-sky-200/90 bg-white/95 p-3.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Eye className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 leading-snug">
                    Bảo vệ mắt, giảm nhìn màn hình thụ động
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Premium 3D Physical Card Showcase (Không đè mất chữ trên thẻ bài) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto flex max-w-sm flex-col items-center">
              {/* Realistic Physical Card Frame (Tỷ lệ dọc 3:4 thẻ thật, KHÔNG che chữ) */}
              <div className="relative w-full overflow-hidden rounded-[2.5rem] border-4 border-white bg-white shadow-[0_25px_60px_-15px_rgba(217,119,6,0.3)] ring-4 ring-amber-200/70 transition-transform duration-300 hover:scale-[1.02]">
                {/* Floating 360 Rotating Badge (Top Right of Card) */}
                <div className="absolute top-3.5 right-3.5 z-20">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 ring-2 ring-white/90 backdrop-blur-md">
                    <RotateCw className="h-3.5 w-3.5 animate-spin text-amber-200" style={{ animationDuration: "6s" }} />
                    <span>3D Xoay 360° Sống Động</span>
                  </div>
                </div>

                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2.2rem] bg-amber-50">
                  <Image
                    src="/images/cards/lion-card.jpg"
                    alt="Thẻ bài học tiếng Anh Sư Tử Lion Poly Cards thật"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 420px"
                  />
                </div>
              </div>

              {/* Interactive Control Capsule Below the Card */}
              <div className="mt-4 w-full rounded-3xl border-2 border-amber-200/90 bg-white/98 p-4 shadow-xl shadow-amber-950/5 backdrop-blur-xl space-y-3">
                {/* Animal Title & Action Button */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-900">Lion</span>
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        /ˈlaɪ.ən/
                      </span>
                    </div>
                    <p className="text-xs font-bold text-amber-800">
                      Con sư tử • Chúa sơn lâm dũng mãnh
                    </p>
                  </div>

                  <Link
                    href="/ar/lion"
                    className="btn-toy-3d inline-flex min-h-[42px] items-center gap-1.5 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-stone-950 shadow-md hover:bg-amber-400 active:scale-95 transition-all"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Thử AR 3D</span>
                  </Link>
                </div>

                {/* Multilingual Audio Listen Strip */}
                <div className="flex items-center justify-between gap-2 rounded-2xl bg-amber-50/90 p-2.5 border border-amber-200">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Volume2 className="h-4 w-4 text-amber-600" />
                    <span>Nghe giọng đọc:</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlayAudio("en")}
                      className={`inline-flex min-h-[34px] items-center gap-1 rounded-xl px-3 py-1 text-xs font-black transition-all active:scale-95 ${
                        playingLang === "en"
                          ? "bg-amber-500 text-white shadow-md animate-pulse"
                          : "bg-white text-slate-800 border border-amber-300 hover:bg-amber-100"
                      }`}
                      title="Nghe phát âm tiếng Anh bản xứ"
                    >
                      <span>Tiếng Anh (EN)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlayAudio("vi")}
                      className={`inline-flex min-h-[34px] items-center gap-1 rounded-xl px-3 py-1 text-xs font-black transition-all active:scale-95 ${
                        playingLang === "vi"
                          ? "bg-emerald-600 text-white shadow-md animate-pulse"
                          : "bg-white text-slate-800 border border-emerald-300 hover:bg-emerald-100"
                      }`}
                      title="Nghe phát âm tiếng Việt"
                    >
                      <span>Tiếng Việt (VI)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
