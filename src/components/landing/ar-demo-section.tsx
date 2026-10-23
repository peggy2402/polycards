"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Volume2,
  Scan,
  Smartphone,
  CheckCircle2,
  Sparkles,
  RotateCw,
} from "lucide-react";

export function ArDemoSection() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePlayAudio = () => {
    try {
      setIsPlayingAudio(true);
      const audio = new Audio("/audio/deer.mp3");
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
    } catch {
      setIsPlayingAudio(false);
    }
  };

  return (
    <section id="ar-demo" className="scroll-mt-20 py-16 sm:py-24 bg-gradient-to-b from-sky-50/80 via-emerald-50/40 to-amber-50/50 text-stone-900 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Messages */}
          <div className="space-y-6 text-center lg:col-span-6 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold text-emerald-900 border border-emerald-300">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Công Nghệ AR Đỉnh Cao Cho Giáo Dục</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-stone-900">
              Quét. Nghe. Khám phá. Tương tác.
            </h2>

            <p className="text-base leading-relaxed text-stone-700 sm:text-lg">
              Chỉ với một chiếc smartphone thông thường, căn phòng khách hay bàn học của bé lập tức biến thành thế giới muông thú kỳ diệu. Con vật 3D xuất hiện đúng tỷ lệ, có thể xoay ngắm mọi góc độ và lắng nghe tiếng gọi chân thực.
            </p>

            {/* Feature Highlights */}
            <ul className="space-y-3.5 text-left text-sm text-stone-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="font-medium">Âm thanh phát âm tiếng Anh giọng chuẩn bản xứ</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="font-medium">Xoay 360°, phóng to - thu nhỏ trực quan</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="font-medium">Đặt con vật vào không gian thật qua Apple Quick Look & Android Scene Viewer</span>
              </li>
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
              <Link
                href="/scan?expect=deer"
                className="inline-flex min-h-[50px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-amber-500 px-7 py-3.5 text-base font-extrabold text-stone-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400 active:scale-[0.98]"
              >
                <Scan className="h-5 w-5" />
                <span>Thử Quét Mã AR Mẫu Ngay</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Visual Demo (Tươi sáng, viền kính bóng bẩy) */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-md rounded-3xl border-2 border-emerald-200/90 bg-white/95 p-6 shadow-2xl shadow-emerald-600/10 backdrop-blur-md">
              {/* Header of Viewer */}
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700">
                    Trải Nghiệm AR Tương Tác 3D
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  AR-DEER-001
                </span>
              </div>

              {/* Viewport Box Tươi Sáng */}
              <div className="relative my-4 aspect-4/3 overflow-hidden rounded-2xl bg-gradient-to-tr from-sky-100 via-amber-50/70 to-emerald-100/80 flex items-center justify-center p-3 border border-emerald-200/60 shadow-inner">
                {/* 3D Deer Model Poster */}
                <div className="relative h-full w-full rounded-xl overflow-hidden transition-transform duration-500 hover:scale-103">
                  <Image
                    src="/images/animals/deer.jpg"
                    alt="Mô hình Deer AR tương tác"
                    fill
                    className="object-cover rounded-xl"
                  />
                </div>

                {/* Simulated 360 rotating badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-emerald-800 shadow-md border border-emerald-200">
                  <RotateCw className="h-3.5 w-3.5 text-emerald-600 animate-spin" style={{ animationDuration: "8s" }} />
                  <span>Xoay 360° Sống Động</span>
                </div>
              </div>

              {/* Controls Toolbar */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2 text-xs font-black transition-all active:scale-95 ${
                    isPlayingAudio
                      ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/30 animate-pulse"
                      : "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100"
                  }`}
                  aria-label="Nghe phát âm con hươu"
                >
                  <Volume2 className="h-4 w-4 text-amber-600" />
                  <span>{isPlayingAudio ? "Đang phát..." : "Nghe Giọng Đọc"}</span>
                </button>

                <Link
                  href="/ar/deer"
                  className="btn-toy-3d inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-102 active:scale-95"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Xem Mô Hình 3D</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
