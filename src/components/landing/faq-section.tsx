"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: "Điện thoại nào có thể xem và tương tác được AR?",
      answer:
        "Hầu hết các smartphone thông dụng hiện nay đều hỗ trợ: iPhone (chạy iOS 12 trở lên với trình duyệt Safari hoặc Chrome) sử dụng công nghệ Apple Quick Look; các dòng Android (Samsung, Xiaomi, Oppo, Pixel...) hỗ trợ Google Play Services for AR thông qua trình duyệt Chrome.",
    },
    {
      question: "Bố mẹ có cần phải tải thêm ứng dụng (App) nào không?",
      answer:
        "Hoàn toàn không cần tải app! Bạn chỉ cần dùng camera gốc của điện thoại hoặc truy cập trình quét trực tuyến của Poly Cards. Trải nghiệm AR chạy trực tiếp trên nền tảng WebXR, giúp tiết kiệm dung lượng bộ nhớ cho máy.",
    },
    {
      question: "Mã QR được bố trí ở đâu trên bộ sản phẩm?",
      answer:
        "Mỗi thẻ bài học tập và phần đế của mô hình động vật vật lý đều được in mã QR công nghệ cao, sắc nét và có lớp phủ chống trầy xước, đảm bảo quét nhạy ngay cả trong điều kiện ánh sáng phòng ngủ nhẹ.",
    },
    {
      question: "Bé tự chơi một mình có an toàn không?",
      answer:
        "Rất an toàn! Môi trường AR của Poly Cards được thiết kế khép kín dành riêng cho trẻ em: hoàn toàn không chứa quảng cáo, không có pop-up chuyển hướng sang website khác và không thu thập thông tin cá nhân của trẻ.",
    },
    {
      question: "Nếu điện thoại không hỗ trợ AR thì có dùng được không?",
      answer:
        "Nếu thiết bị của bạn không có phần cứng AR chuyên dụng, hệ thống sẽ tự động chuyển sang chế độ 3D thông minh. Bé vẫn có thể dùng ngón tay xoay mô hình 360 độ, phóng to chi tiết và bấm nghe phát âm tiếng Anh bình thường.",
    },
    {
      question: "Nếu quét mã QR chưa nhận diện được thì phải làm sao?",
      answer:
        "Hãy giữ điện thoại cách mã QR khoảng 10 đến 15cm trong vòng 1-2 giây. Nếu phòng hơi tối, bạn có thể bấm nút 'Bật đèn flash' ngay trên màn hình quét của Poly Cards để trợ sáng.",
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-24 bg-[#FCFBF7] transition-colors">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-4 py-1.5 text-xs font-extrabold text-amber-950">
            <HelpCircle className="h-4 w-4 text-amber-600" />
            <span>Giải Đáp Thắc Mắc Cho Ba Mẹ</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Câu Hỏi Thường Gặp (FAQ)
          </h2>

          <p className="text-base text-slate-600 sm:text-lg font-medium">
            Mọi điều bố mẹ cần biết trước khi bắt đầu hành trình trải nghiệm AR cùng bé.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border-2 border-amber-200/80 bg-white shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(index)}
                  className="flex min-h-[52px] w-full items-center justify-between gap-4 px-6 py-4.5 text-left font-bold text-slate-900 transition-colors hover:text-emerald-700"
                  aria-expanded={isOpen}
                >
                  <span className="text-base">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-amber-600 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-amber-100 px-6 pt-3 pb-5 text-sm leading-relaxed text-slate-600 font-medium animate-in fade-in duration-200">
                    {faq.answer}
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
