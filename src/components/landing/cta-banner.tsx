import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Sparkles, QrCode, ShoppingBag, ExternalLink } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-16 sm:py-20 bg-transparent transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-700 px-6 py-12 sm:px-12 sm:py-16 text-center text-white shadow-2xl shadow-amber-950/15">
          {/* Decorative Circles */}
          <div
            className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-emerald-500/20 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Sẵn Sàng Cho Trải Nghiệm Học Tập Mới</span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Mang Cả Thế Giới Động Vật Sống Động Vào Căn Phòng Của Bé
            </h2>

            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-amber-100 sm:text-base">
              Đặt hàng ngay hôm nay để nhận trọn bộ thẻ bài chống nước, mô hình vật lý cao cấp và quyền truy cập thế giới thực tế ảo AR Poly Cards không giới hạn.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/order"
                className="btn-toy-3d inline-flex min-h-[50px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-white px-7 py-3.5 text-base font-black text-slate-900 shadow-xl transition-all hover:bg-amber-50 active:scale-95"
              >
                <ShoppingBag className="h-5 w-5 text-amber-600" />
                <span>Đặt Mua Trọn Bộ Thẻ AR</span>
              </Link>

              <Link
                href="/scan"
                className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl border-2 border-white/60 bg-white/10 px-6 py-3 text-base font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
              >
                <QrCode className="h-5 w-5" />
                <span>Quét Mã Dùng Thử Ngay</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
