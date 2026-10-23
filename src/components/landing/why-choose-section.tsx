import React from "react";
import {
  Hand,
  ShieldCheck,
  Volume2,
  Sparkles,
  Zap,
  HeartHandshake,
} from "lucide-react";

export function WhyChooseSection() {
  const reasons = [
    {
      icon: Hand,
      title: "Chạm & Cầm Nắm Mô Hình Thật",
      description:
        "Bé không bị giam mình trong thế giới ảo vô cảm. Đồ chơi vật lý giúp kích thích xúc giác, vận động tinh và khả năng quan sát không gian 3 chiều.",
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800/60",
    },
    {
      icon: Volume2,
      title: "Phát Âm Chuẩn Bản Xứ",
      description:
        "Mỗi loài động vật đều có phát âm chuẩn quốc tế IPA và file âm thanh bản xứ chân thực, giúp trẻ tiếp cận tiếng Anh tự nhiên trong giai đoạn vàng ngôn ngữ.",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-800/60",
    },
    {
      icon: ShieldCheck,
      title: "100% An Toàn & Không Quảng Cáo",
      description:
        "Trải nghiệm AR được thiết kế khép kín hoàn toàn: không có banner quảng cáo, không pop-up, không điều hướng sang liên kết lạ, bảo vệ mắt và tâm lý trẻ nhỏ.",
      color: "from-sky-500 to-blue-500",
      bgColor: "bg-sky-50 dark:bg-sky-950/30",
      borderColor: "border-sky-200 dark:border-sky-800/60",
    },
    {
      icon: Zap,
      title: "Không Cần Tải App Phức Tạp",
      description:
        "Công nghệ WebXR và Apple Quick Look tiên tiến cho phép xem 3D và đưa vào AR ngay trên trình duyệt di động mà không làm đầy bộ nhớ điện thoại của bố mẹ.",
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800/60",
    },
  ];

  return (
    <section id="why-choose-us" className="scroll-mt-20 py-16 sm:py-24 bg-white dark:bg-stone-900 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <HeartHandshake className="h-4 w-4" />
            <span>Phương Pháp Giáo Dục Tương Lai</span>
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
            Vì Sao Phụ Huynh Thông Thái Chọn Poly Cards?
          </h2>

          <p className="mt-3 text-base text-stone-600 sm:text-lg dark:text-stone-400">
            Kết hợp sự kỳ diệu của đồ chơi truyền thống với sức mạnh trực quan của công nghệ thực tế ảo, mang lại trải nghiệm học tập trọn vẹn nhất cho con yêu.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <div
                key={index}
                className={`relative rounded-3xl border ${reason.borderColor} ${reason.bgColor} p-6 sm:p-8 transition-all hover:shadow-lg`}
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${reason.color} text-white shadow-md`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {reason.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                      {reason.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
