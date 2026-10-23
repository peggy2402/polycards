import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/common/badge";
import {
  QrCode,
  Compass,
  Sparkles,
  ShieldCheck,
  Volume2,
  Scan,
  Smartphone,
  Eye,
  RotateCw,
  Layers,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/60 via-amber-50/40 to-emerald-50/30 pt-8 pb-16 md:pt-16 md:pb-24 transition-colors">
      {/* Decorative Warm Playful Glows */}
      <div
        className="pointer-events-none absolute -top-24 left-1/4 -z-10 h-96 w-96 rounded-full bg-amber-300/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-20 -z-10 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headlines & CTAs */}
          <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <Badge variant="primary" icon="sparkles" className="border-amber-300 bg-amber-100/90 text-amber-900 font-bold">
                Công Nghệ AR Thông Minh Cho Trẻ 3–8 Tuổi
              </Badge>
              <Badge variant="secondary" icon="check" className="border-emerald-300 bg-emerald-100/90 text-emerald-900 font-bold">
                Không Cần Cài App
              </Badge>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-5xl xl:text-6xl">
              Học tiếng Anh bằng cách{" "}
              <span className="relative inline-block text-emerald-600">
                chạm vào thế giới thật
                <svg
                  className="absolute -bottom-2 left-0 w-full text-amber-400"
                  height="10"
                  viewBox="0 0 200 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M2 7C55 2 145 2 198 7"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-700 sm:text-lg lg:mx-0">
              Bộ thẻ bài đồ chơi giáo dục cao cấp kết hợp công nghệ thực tế ảo AR. Trẻ cầm nắm thẻ bài xinh xắn, quét mã QR để mở ra thế giới muông thú 3D chuyển động sống động kèm giọng đọc bản xứ chuẩn quốc tế.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-3.5 sm:flex-row lg:justify-start pt-2">
              <Link
                href="/scan"
                className="inline-flex min-h-[50px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-600/40 active:scale-[0.98]"
              >
                <QrCode className="h-5 w-5" />
                <span>Quét QR Trải Nghiệm AR</span>
              </Link>

              <a
                href="#products"
                className="inline-flex min-h-[50px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-white/90 px-6 py-3.5 text-base font-bold text-stone-800 shadow-sm backdrop-blur-sm transition-all hover:border-amber-500 hover:bg-amber-50/50 active:scale-[0.98]"
              >
                <Compass className="h-5 w-5 text-amber-600" />
                <span>Khám Phá Bộ Thẻ</span>
              </a>
            </div>

            {/* Trust Badges - Tươi sáng & Ấm áp */}
            <div className="pt-4 border-t border-amber-200/70">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="flex items-center gap-2.5 rounded-2xl bg-white/90 p-3 shadow-xs border border-emerald-100">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-800">
                    100% Không quảng cáo & Link ngoài
                  </span>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl bg-white/90 p-3 shadow-xs border border-amber-100">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-800">
                    Phát âm tiếng Anh chuẩn bản xứ IPA
                  </span>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl bg-white/90 p-3 shadow-xs border border-sky-100">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Eye className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-800">
                    Giảm thời gian nhìn màn hình thụ động
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Composite - Không che chữ, Badge bounce rực rỡ */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              {/* BOUNCE BADGE: Nổi bật rực rỡ, hiệu ứng nhịp nhàng không bị đè viền */}
              <div className="absolute -top-6 -right-2 sm:-right-4 z-30 animate-bounce">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-extrabold text-white shadow-xl shadow-emerald-500/40 ring-4 ring-white/90 transition-transform">
                  <Sparkles className="h-4 w-4 animate-spin text-amber-200" style={{ animationDuration: "6s" }} />
                  <span>3D Xoay 360° Sống Động</span>
                </div>
              </div>

              {/* Main Visual Card Container */}
              <div className="relative rounded-3xl border-2 border-amber-200/90 bg-white/95 p-5 shadow-2xl shadow-amber-900/10 backdrop-blur-md">
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-1 text-xs font-bold text-amber-900">
                      Poly Cards AR Live
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    <Layers className="h-3 w-3" />
                    <span>Thẻ Học Thông Minh</span>
                  </span>
                </div>

                {/* Showcase Dual Layout: Thẻ bài Lion thật + Mô hình AR */}
                <div className="relative my-4 aspect-4/3 overflow-hidden rounded-2xl bg-gradient-to-tr from-sky-100 via-amber-50 to-emerald-100 p-3 border border-amber-200/60 flex items-center justify-center">
                  {/* Real Lion Card Image (Thẻ bài thật người dùng gửi) */}
                  <div className="relative h-full w-full flex items-center justify-center">
                    <div className="relative h-full w-48 shadow-lg rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105">
                      <Image
                        src="/images/cards/lion-card.jpg"
                        alt="Thẻ bài học tiếng Anh con sư tử Lion Poly Cards"
                        fill
                        priority
                        className="object-cover rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Camera Reticle Overlay */}
                  <div className="absolute inset-3 pointer-events-none rounded-xl border border-emerald-500/50">
                    <div className="absolute top-1.5 left-1.5 h-4 w-4 border-t-2 border-l-2 border-emerald-600" />
                    <div className="absolute top-1.5 right-1.5 h-4 w-4 border-t-2 border-r-2 border-emerald-600" />
                    <div className="absolute bottom-1.5 left-1.5 h-4 w-4 border-b-2 border-l-2 border-emerald-600" />
                    <div className="absolute bottom-1.5 right-1.5 h-4 w-4 border-b-2 border-r-2 border-emerald-600" />
                  </div>

                  {/* AR Scanning Status Chip */}
                  <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-lg bg-stone-900/85 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-md">
                    <Scan className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Đã nhận diện: LION</span>
                  </div>
                </div>

                {/* Sub Info Row - KHÔNG BỊ ĐÈ CHỮ, HOÀN TOÀN THOÁNG ĐÃNG */}
                <div className="flex items-center justify-between pt-2 pb-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-stone-900">
                        Lion
                      </h2>
                      <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        /ˈlaɪ.ən/
                      </span>
                    </div>
                    <p className="text-xs font-medium text-stone-600 mt-0.5">
                      Con sư tử • Chúa sơn lâm dũng mãnh
                    </p>
                  </div>

                  <Link
                    href="/scan?expect=lion"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-amber-700 active:scale-95"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Thử AR</span>
                  </Link>
                </div>

                {/* QR Guide Banner Được Đặt GỌN GÀNG BÊN TRONG CARD (Không che đè bất kỳ chữ nào) */}
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-50/90 p-3 border border-amber-200/80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-stone-900">
                      Mã QR In Sắc Nét Trên Từng Thẻ
                    </div>
                    <div className="text-[11px] text-stone-600">
                      Quét bằng camera điện thoại hoặc trên web để xem AR
                    </div>
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
