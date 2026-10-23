import React from "react";
import {
  PackageCheck,
  ScanLine,
  Box,
  Volume2,
  Trophy,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: PackageCheck,
      title: "Cầm Thẻ Bài Thật",
      description:
        "Bé chọn bạn thú yêu thích, cầm nắm thẻ bài bo góc an toàn chứng nhận FSC kích thích xúc giác và giảm lệ thuộc màn hình.",
      badgeColor: "bg-amber-100 text-amber-950 border border-amber-300",
      iconColor: "text-amber-600 bg-amber-50",
    },
    {
      number: "02",
      icon: ScanLine,
      title: "Quét QR Bằng Camera",
      description:
        "Dùng camera điện thoại đưa vào mã QR trên thẻ. Không cần tải app, công nghệ WebXR mở ra thế giới 3D tức thì.",
      badgeColor: "bg-emerald-100 text-emerald-950 border border-emerald-300",
      iconColor: "text-emerald-600 bg-emerald-50",
    },
    {
      number: "03",
      icon: Box,
      title: "Xem 3D & Đưa Vào AR",
      description:
        "Bạn thú 3D sống động xuất hiện ngay trên bàn học hoặc sàn nhà của bé, có thể xoay 360° và phóng to ngắm nhìn chi tiết.",
      badgeColor: "bg-sky-100 text-sky-950 border border-sky-300",
      iconColor: "text-sky-600 bg-sky-50",
    },
    {
      number: "04",
      icon: Volume2,
      title: "Nghe Phát Âm 3 Ngôn Ngữ",
      description:
        "Bé nghe giọng đọc bản xứ tiếng Anh (kèm phiên âm IPA chuẩn), tiếng Việt và tiếng Trung (kèm pinyin) trong giai đoạn vàng ngôn ngữ.",
      badgeColor: "bg-purple-100 text-purple-950 border border-purple-300",
      iconColor: "text-purple-600 bg-purple-50",
    },
    {
      number: "05",
      icon: Trophy,
      title: "Thử Thách & Luyện Tập",
      description:
        "Tham gia mini game tương tác nhanh để củng cố phản xạ, nhận sao thưởng và kích thích não bộ ghi nhớ sâu dài lâu.",
      badgeColor: "bg-rose-100 text-rose-950 border border-rose-300",
      iconColor: "text-rose-600 bg-rose-50",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/20 to-white transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300 bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-950 shadow-xs">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Quy Trình Học 5 Bước Độc Quyền Poly Cards</span>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Từ Thẻ Bài Vật Lý Đến Thế Giới 3D AR
          </h2>

          <p className="text-base text-slate-600 sm:text-lg font-medium">
            Khác với flashcard truyền thống chỉ nhìn và quên, Poly Cards dẫn dắt trẻ qua chu trình tương tác đa giác quan khép kín.
          </p>
        </div>

        {/* 5 Steps Grid */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative flex flex-col justify-between rounded-3xl border-2 border-amber-200/80 bg-white p-5 shadow-lg shadow-amber-950/5 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400 hover:shadow-2xl"
              >
                <div>
                  {/* Step Number & Icon */}
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

                {/* Arrow indicator for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-amber-400">
                    <ArrowRight className="h-4 w-4" />
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
