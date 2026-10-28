"use client";

import React from "react";
import Link from "next/link";
import { COMBO_PACKS } from "@/data/combos";
import { ComboPackCard } from "./combo-pack-card";
import {
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export function ProductsGrid() {
  return (
    <section
      id="products"
      className="scroll-mt-20 py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/30 to-sky-50/20 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header: Đã cập nhật tiêu đề đa chủ đề chuẩn mực */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-950 border border-amber-300 shadow-2xs">
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Hệ Sinh Thái Thẻ Học AR Đa Giác Quan</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Các Bộ Thẻ Học Thông Minh AR Poly Cards
          </h2>

          <p className="mt-3 text-base text-stone-700 sm:text-lg leading-relaxed">
            Mỗi bộ gồm 30 thẻ bài chống nước cao cấp, hình ảnh 3D hoạt hình sống động, tích hợp phát âm chuẩn 3 ngôn ngữ (Anh - Việt - Trung) và mã QR kích hoạt AR trọn đời.
          </p>
        </div>

        {/* LƯỚI CÁC BỘ COMBO CÓ SẴN (Curated Pack Cards) */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {COMBO_PACKS.map((pack) => (
            <ComboPackCard key={pack.id} pack={pack} />
          ))}
        </div>

        {/* KHỐI CTA DẪN SANG TRANG /products ĐẦY ĐỦ BỘ LỌC & TỪNG THẺ LẺ */}
        <div className="mt-14 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-300/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-md">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-950 font-black text-xs border border-amber-400/40">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Thư Viện Thẻ Bài Mở Rộng</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900">
              Bạn Muốn Tra Cứu Từng Thẻ Bài Riêng Lẻ &amp; Luyện Phát Âm?
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              Truy cập trang thư viện thẻ bài để tra cứu theo từ khóa, lọc theo từng danh mục chủ đề (Động Vật, Hành Động, Xe Cộ, Trái Cây...) và nghe phát âm chuẩn 3 thứ tiếng.
            </p>
          </div>

          <Link
            href="/products"
            className="btn-toy-3d shrink-0 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 px-6 py-3.5 text-sm font-black text-stone-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <span>Khám Phá Tất Cả Thẻ Bài &amp; Bộ Lọc</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Note cam kết chất lượng */}
        <div className="mt-8 rounded-2xl border border-amber-200/80 bg-white/90 p-4 text-center text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md">
          <p className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              100% Bộ thẻ chính hãng Poly Cards đi kèm mã bản quyền bảo hành trọn đời và quyền truy cập không giới hạn vào ứng dụng WebAR tương tác 3D.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
