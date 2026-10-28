"use client";

import React from "react";
import Link from "next/link";
import { COMBO_PACKS } from "@/data/combos";
import { ComboPackCard } from "./combo-pack-card";
import {
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function ProductsGrid() {
  return (
    <section
      id="products"
      className="scroll-mt-20 py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/25 to-sky-50/20 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-950 border border-amber-300 shadow-2xs">
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Bộ Sưu Tập Combo Thẻ Học Thông Minh AR</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Các Bộ Thẻ Học Thông Minh AR Poly Cards
          </h2>

          <p className="mt-3 text-base text-stone-700 sm:text-lg leading-relaxed">
            Mỗi bộ gồm 30 thẻ bài chống nước cao cấp theo từng chủ đề, hình ảnh 3D hoạt hình sống động, tích hợp phát âm chuẩn 3 ngôn ngữ (Anh - Việt - Trung) và mã QR kích hoạt AR trọn đời.
          </p>
        </div>

        {/* LƯỚI CÁC BỘ COMBO CÂN ĐỐI (4 Bộ Chủ Đề 2x2 + 1 Gói Trọn Bộ VIP Full-Width) */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {COMBO_PACKS.map((pack) => (
            <ComboPackCard key={pack.id} pack={pack} />
          ))}
        </div>

        {/* Nút điều hướng sang Kho Thẻ Bài đầy đủ (/products) & Cam kết bản quyền */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/products"
            className="btn-toy-3d inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white hover:bg-amber-50 border-2 border-amber-400 px-6 py-3 text-xs sm:text-sm font-black text-stone-900 shadow-md transition-all hover:scale-102 active:scale-95"
          >
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Xem Toàn Bộ Kho Thẻ Lẻ Tất Cả Chủ Đề (/products)</span>
            <ArrowRight className="h-4 w-4 text-amber-600" />
          </Link>

          <div className="w-full rounded-2xl border border-amber-200/80 bg-white/90 p-4 text-center text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md">
            <p className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                100% Bộ thẻ chính hãng Poly Cards đi kèm mã bộ bản quyền bảo hành trọn đời và quyền truy cập không giới hạn vào ứng dụng WebAR tương tác 3D.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

