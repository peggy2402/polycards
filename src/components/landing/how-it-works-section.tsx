"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  PackageCheck,
  ScanLine,
  Box,
  Volume2,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const steps = [
    {
      number: "01",
      icon: PackageCheck,
      title: "Cầm Thẻ Bài Thật",
      description:
        "Bé chọn bạn thú yêu thích, cầm nắm thẻ bài bo góc an toàn chứng nhận FSC kích thích xúc giác và giảm lệ thuộc màn hình.",
      badgeColor: "bg-amber-100 text-amber-950 border border-amber-300",
      iconColor: "text-amber-600 bg-amber-50",
      accentBg: "from-amber-500/10 to-amber-500/5",
    },
    {
      number: "02",
      icon: ScanLine,
      title: "Quét QR Bằng Camera",
      description:
        "Dùng camera điện thoại đưa vào mã QR trên thẻ. Không cần tải app, công nghệ WebXR mở ra thế giới 3D tức thì.",
      badgeColor: "bg-emerald-100 text-emerald-950 border border-emerald-300",
      iconColor: "text-emerald-600 bg-emerald-50",
      accentBg: "from-emerald-500/10 to-emerald-500/5",
    },
    {
      number: "03",
      icon: Box,
      title: "Xem 3D & Đưa Vào AR",
      description:
        "Bạn thú 3D sống động xuất hiện ngay trên bàn học hoặc sàn nhà của bé, có thể xoay 360° và phóng to ngắm nhìn chi tiết.",
      badgeColor: "bg-sky-100 text-sky-950 border border-sky-300",
      iconColor: "text-sky-600 bg-sky-50",
      accentBg: "from-sky-500/10 to-sky-500/5",
    },
    {
      number: "04",
      icon: Volume2,
      title: "Nghe Phát Âm 3 Ngôn Ngữ",
      description:
        "Bé nghe giọng đọc bản xứ tiếng Anh (kèm phiên âm IPA chuẩn), tiếng Việt và tiếng Trung (kèm pinyin) trong giai đoạn vàng ngôn ngữ.",
      badgeColor: "bg-purple-100 text-purple-950 border border-purple-300",
      iconColor: "text-purple-600 bg-purple-50",
      accentBg: "from-purple-500/10 to-purple-500/5",
    },
    {
      number: "05",
      icon: Trophy,
      title: "Thử Thách & Luyện Tập",
      description:
        "Tham gia mini game tương tác nhanh để củng cố phản xạ, nhận sao thưởng và kích thích não bộ ghi nhớ sâu dài lâu.",
      badgeColor: "bg-rose-100 text-rose-950 border border-rose-300",
      iconColor: "text-rose-600 bg-rose-50",
      accentBg: "from-rose-500/10 to-rose-500/5",
    },
  ];

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % steps.length);
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  // Touch Swipe Handlers cho Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchCurrentX.current !== null) {
      const diffX = touchStartX.current - touchCurrentX.current;
      const minSwipeDistance = 40; // Ngưỡng vuốt 40px

      if (diffX > minSwipeDistance) {
        handleNext(); // Vuốt sang trái -> xem bước tiếp theo
      } else if (diffX < -minSwipeDistance) {
        handlePrev(); // Vuốt sang phải -> quay lại bước trước
      }
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  return (
    <section id="how-it-works" className="scroll-mt-20 py-14 sm:py-24 bg-gradient-to-b from-white via-amber-50/20 to-white transition-colors overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300 bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-950 shadow-xs">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Quy Trình Học 5 Bước Độc Quyền Poly Cards</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Từ Thẻ Bài Vật Lý Đến Thế Giới 3D AR
          </h2>

          <p className="text-sm text-slate-600 sm:text-lg font-medium">
            Khác với flashcard truyền thống chỉ nhìn và quên, Poly Cards dẫn dắt trẻ qua chu trình tương tác đa giác quan khép kín.
          </p>
        </div>

        {/* 1. HIỂN THỊ TRÊN DESKTOP: LƯỚI 5 BƯỚC TRẢI NGANG (hidden md:grid) */}
        <div className="hidden md:grid mt-14 grid-cols-2 lg:grid-cols-5 gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative flex flex-col justify-between rounded-3xl border-2 border-amber-200/80 bg-white p-5 shadow-lg shadow-amber-950/5 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400 hover:shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between pb-3">
                    <span className={`inline-flex items-center justify-center rounded-xl px-2.5 py-1 text-xs font-black ${step.badgeColor}`}>
                      Bước {step.number}
                    </span>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${step.iconColor} shadow-inner`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium">
                    {step.description}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-amber-400">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 2. HIỂN THỊ TRÊN MOBILE: 3D CYLINDER VERTICAL-AXIS SWIPE CAROUSEL (md:hidden) */}
        <div className="md:hidden mt-8 select-none">
          {/* Hướng Dẫn Vuốt Cảm Ứng */}
          <div className="flex items-center justify-center gap-2 mb-3 text-xs font-bold text-amber-900/80">
            <span>👈 Vuốt sang trái hoặc phải để chuyển bước 👉</span>
          </div>

          {/* 3D Cylinder Stage */}
          <div
            className="relative h-[290px] w-full flex items-center justify-center"
            style={{ perspective: "1000px" }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {steps.map((step, index) => {
              const Icon = step.icon;

              // Tính khoảng cách vòng lặp xoay tròn quanh trục thẳng đứng Y (Z-cylinder vertical axis)
              let diff = index - activeStep;
              if (diff > 2) diff -= steps.length;
              if (diff < -2) diff += steps.length;

              const isActive = diff === 0;
              const isPrev = diff === -1;
              const isNext = diff === 1;
              const isFar = Math.abs(diff) > 1;

              // Tính thông số 3D Transform
              let rotateY = 0;
              let translateX = 0;
              let translateZ = 0;
              let scale = 1;
              let opacity = 1;
              let zIndex = 10;

              if (isActive) {
                rotateY = 0;
                translateX = 0;
                translateZ = 20;
                scale = 1;
                opacity = 1;
                zIndex = 30;
              } else if (isNext) {
                rotateY = -35;
                translateX = 65;
                translateZ = -70;
                scale = 0.84;
                opacity = 0.65;
                zIndex = 20;
              } else if (isPrev) {
                rotateY = 35;
                translateX = -65;
                translateZ = -70;
                scale = 0.84;
                opacity = 0.65;
                zIndex = 20;
              } else {
                rotateY = diff > 0 ? -60 : 60;
                translateX = diff > 0 ? 120 : -120;
                translateZ = -160;
                scale = 0.65;
                opacity = 0;
                zIndex = 5;
              }

              return (
                <div
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className="absolute w-[82%] max-w-[310px] rounded-3xl border-2 border-amber-300/90 bg-white p-5 shadow-xl transition-all duration-500 ease-out cursor-pointer"
                  style={{
                    transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                    transformStyle: "preserve-3d",
                    opacity,
                    zIndex,
                    pointerEvents: isFar ? "none" : "auto",
                  }}
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between pb-3">
                    <span className={`inline-flex items-center justify-center rounded-xl px-2.5 py-1 text-xs font-black ${step.badgeColor}`}>
                      Bước {step.number}
                    </span>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${step.iconColor} shadow-inner`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 leading-snug">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium">
                    {step.description}
                  </p>

                  {/* Indicator if active */}
                  {isActive && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-black text-amber-600">
                      <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "4s" }} />
                      <span>Bước {step.number} trên tổng số 05</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation Controls & Dots */}
          <div className="mt-4 flex items-center justify-between px-6">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-amber-300 bg-white text-slate-700 shadow-md active:scale-90 transition-all"
              aria-label="Bước trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveStep(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    activeStep === i
                      ? "w-7 bg-amber-500 shadow-sm"
                      : "w-2.5 bg-amber-200 hover:bg-amber-300"
                  }`}
                  aria-label={`Chuyển đến bước ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-amber-300 bg-white text-slate-700 shadow-md active:scale-90 transition-all"
              aria-label="Bước sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
