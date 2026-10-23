import React from "react";
import {
  Users,
  GraduationCap,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function BenefitsSection() {
  const parentBenefits = [
    "Thời lượng tiếp xúc màn hình có định hướng, không bị nghiện video thụ động.",
    "Bé tự giác học và nhớ từ vựng tiếng Anh thông qua phản xạ hình ảnh và xúc giác.",
    "Hoàn toàn an tâm: 0 quảng cáo rác, 0 link ngoài nguy hiểm.",
    "Gắn kết thời gian chất lượng giữa ba mẹ và con cái vào mỗi buổi tối.",
  ];

  const teacherBenefits = [
    "Giáo cụ sinh động trực quan, thu hút 100% sự tập trung của trẻ trong lớp học.",
    "Dễ dàng lồng ghép vào giáo trình tiếng Anh mầm non và tiểu học.",
    "Không cần đầu tư thiết bị đắt tiền, chỉ cần smartphone thông dụng của giáo viên.",
    "Tạo các trò chơi đội nhóm: tìm thẻ, quét QR nhận diện động vật.",
  ];

  return (
    <section className="py-16 sm:py-24 bg-stone-50 dark:bg-stone-950 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300">
            <Sparkles className="h-4 w-4" />
            <span>Giá Trị Thực Tế</span>
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
            Đồng Hành Cùng Phụ Huynh & Thầy Cô
          </h2>

          <p className="mt-3 text-base text-stone-600 sm:text-lg dark:text-stone-400">
            Được nghiên cứu và thiết kế dựa trên tâm lý tiếp thu tự nhiên của trẻ từ 3 đến 8 tuổi.
          </p>
        </div>

        {/* 2 Columns: Parents vs Teachers */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Parent Column */}
          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-xs dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-3 pb-6 border-b border-stone-100 dark:border-stone-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Dành Cho Ba Mẹ
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Giải pháp giáo dục sớm an tâm tại gia đình
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-4">
              {parentBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Teacher Column */}
          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-xs dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-3 pb-6 border-b border-stone-100 dark:border-stone-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Dành Cho Thầy Cô & Nhà Trường
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Giáo cụ trực quan nâng cao hứng thú tiết học
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-4">
              {teacherBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
