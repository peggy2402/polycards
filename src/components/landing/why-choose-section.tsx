import React from "react";
import {
  Hand,
  ShieldCheck,
  Volume2,
  Zap,
  HeartHandshake,
} from "lucide-react";

export function WhyChooseSection() {
  const reasons = [
    {
      icon: Hand,
      title: "Chạm & Cầm Nắm Thẻ Bài Thật",
      description:
        "Bé không bị giam mình trong thế giới ảo vô cảm. Đồ chơi vật lý giúp kích thích xúc giác, vận động tinh và khả năng quan sát không gian 3 chiều thực tế.",
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-gradient-to-br from-amber-50/80 to-white",
      borderColor: "border-amber-200/90",
      shadowColor: "shadow-amber-500/10",
    },
    {
      icon: Volume2,
      title: "Phát Âm 3 Ngôn Ngữ Bản Xứ",
      description:
        "Mỗi loài động vật đều có phát âm chuẩn quốc tế IPA tiếng Anh, tiếng Việt và tiếng Trung, giúp trẻ tiếp cận ngôn ngữ tự nhiên trong giai đoạn vàng của não bộ.",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-emerald-50/80 to-white",
      borderColor: "border-emerald-200/90",
      shadowColor: "shadow-emerald-500/10",
    },
    {
      icon: ShieldCheck,
      title: "100% An Toàn & Không Quảng Cáo",
      description:
        "Trải nghiệm AR được thiết kế khép kín hoàn toàn: không có banner quảng cáo, không pop-up, không điều hướng sang liên kết lạ, bảo vệ mắt và tâm lý trẻ nhỏ.",
      color: "from-sky-500 to-blue-500",
      bgColor: "bg-gradient-to-br from-sky-50/80 to-white",
      borderColor: "border-sky-200/90",
      shadowColor: "shadow-sky-500/10",
    },
    {
      icon: Zap,
      title: "Tiện Lợi Không Cần Cài App",
      description:
        "Công nghệ WebXR và Apple Quick Look tiên tiến cho phép xem 3D và đưa vào AR ngay trên trình duyệt di động mà không làm đầy bộ nhớ điện thoại của bố mẹ.",
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-gradient-to-br from-purple-50/80 to-white",
      borderColor: "border-purple-200/90",
      shadowColor: "shadow-purple-500/10",
    },
  ];

  return (
    <section id="why-choose-us" className="scroll-mt-20 py-16 sm:py-24 bg-[#FCFBF7] transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-extrabold text-emerald-900">
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
            <span>Phương Pháp Giáo Dục Tương Lai</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Vì Sao Phụ Huynh Chọn Poly Cards?
          </h2>

          <p className="text-base text-slate-600 sm:text-lg font-medium">
            Kết hợp sự kỳ diệu của đồ chơi vật lý với sức mạnh trực quan của công nghệ thực tế ảo, mang lại trải nghiệm học tập trọn vẹn nhất cho con yêu.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <div
                key={index}
                className={`relative rounded-3xl border-2 ${reason.borderColor} ${reason.bgColor} p-7 sm:p-8 shadow-lg ${reason.shadowColor} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
              >
                <div className="flex items-start gap-5">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${reason.color} text-white shadow-md`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {reason.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 font-medium">
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
