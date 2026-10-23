import React from "react";
import {
  PackageCheck,
  ScanLine,
  Volume2,
  Box,
  ArrowRight,
} from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: PackageCheck,
      title: "Chọn Mô Hình Động Vật",
      description:
        "Bé tự tay chọn bạn động vật yêu thích từ bộ sưu tập đồ chơi an toàn Poly Cards để cầm nắm và quan sát.",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      number: "02",
      icon: ScanLine,
      title: "Quét Mã QR Thông Minh",
      description:
        "Dùng camera điện thoại hoặc nút quét trên trang web Poly Cards đưa vào mã QR in trên đế hoặc thẻ bài.",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      number: "03",
      icon: Volume2,
      title: "Nghe & Khám Phá Từ Vựng",
      description:
        "Nghe phát âm chuẩn bản xứ, đọc phiên âm quốc tế IPA và đọc những mẩu truyện ngắn thú vị về tập tính con vật.",
      badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    },
    {
      number: "04",
      icon: Box,
      title: "Đưa Con Vật Vào AR Thật",
      description:
        "Chỉ cần bấm một nút để đưa bạn hươu, voi hay sư tử 3D chuyển động trực tiếp trên sàn nhà hoặc bàn học của bé.",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-24 bg-stone-50 dark:bg-stone-950/60 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
            <span>Dễ Dàng Cho Cả Bé & Ba Mẹ</span>
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
            Cách Hoạt Động Chỉ Với 4 Bước Đơn Giản
          </h2>

          <p className="mt-3 text-base text-stone-600 sm:text-lg dark:text-stone-400">
            Không cần tài khoản, không cần cấu hình phức tạp. Trải nghiệm bắt đầu ngay tức thì khi camera chạm vào mã QR.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative flex flex-col rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 dark:border-stone-800 dark:bg-stone-900"
              >
                {/* Step Number & Icon */}
                <div className="flex items-center justify-between pb-4">
                  <span className={`inline-flex items-center justify-center rounded-xl px-2.5 py-1 text-xs font-bold ${step.badgeColor}`}>
                    Bước {step.number}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  {step.description}
                </p>

                {/* Arrow indicator for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-stone-400">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
