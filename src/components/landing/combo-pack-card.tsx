"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CardComboPack } from "@/data/combos";
import { formatVndCurrency } from "@/lib/formatters";
import {
  Sparkles,
  ShoppingBag,
  Smartphone,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ComboPackCardProps {
  pack: CardComboPack;
}

export function ComboPackCard({ pack }: ComboPackCardProps) {
  const isVip = pack.id === "pack-combo-vip-120";

  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white transition-all duration-300 hover:-translate-y-1.5 ${
        isVip
          ? "border-2 border-amber-400 shadow-xl shadow-amber-500/15 ring-2 ring-amber-400/30"
          : "border-2 border-amber-200/90 shadow-md shadow-stone-900/5 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10"
      }`}
    >
      {/* Khối Ảnh Đại Diện Bộ Thẻ */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-tr from-stone-100 via-amber-50/50 to-orange-50/40">
        <Image
          src={pack.imageSrc}
          alt={`Bộ thẻ học ${pack.name}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-106"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Lớp phủ Gradient bảo vệ chữ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Floating Top-Left: Tên Chủ Đề & Số Lượng Thẻ */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-xs">
            {pack.categoryName}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
            <Layers className="h-3 w-3" />
            <span>{pack.cardsCount} Thẻ AR</span>
          </span>
        </div>

        {/* Floating Top-Right: Badge Khuyến Mãi / Hot */}
        {pack.badge && (
          <span
            className={`absolute top-3 right-3 z-10 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md border ${
              isVip
                ? "bg-gradient-to-r from-amber-400 to-orange-400 text-stone-950 border-amber-300"
                : "bg-amber-400 text-stone-950 border-amber-300"
            }`}
          >
            {pack.badge}
          </span>
        )}

        {/* Floating Bottom: Mã Bộ Chuẩn */}
        <div className="absolute bottom-2.5 left-3 z-10 font-mono text-[10px] font-black text-amber-300 tracking-wider bg-black/65 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10">
          Mã Bộ: {pack.packCode}
        </div>
      </div>

      {/* Thông Tin Bộ Combo: Gọn Gàng & Thanh Thoát */}
      <div className="p-4 sm:p-5 flex flex-1 flex-col justify-between space-y-3">
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
            {pack.name}
          </h3>

          <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
            {pack.description}
          </p>

          {/* Dòng Highlights đặc tính */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {pack.highlights.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80"
              >
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-amber-100/80 space-y-3">
          {/* Giá Tiền Bộ Combo */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-stone-500 block leading-tight">
                Giá trọn bộ:
              </span>
              {pack.originalPrice > pack.price && (
                <span className="text-xs text-stone-400 line-through font-mono">
                  {formatVndCurrency(pack.originalPrice)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-amber-950">
                {formatVndCurrency(pack.price)}
              </span>
              {pack.discountPercent > 0 && (
                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                  -{pack.discountPercent}%
                </span>
              )}
            </div>
          </div>

          {/* Nút Hành Động: Trải Nghiệm AR & Đặt Mua Bộ */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <Link
              href={`/ar/${pack.sampleSlug}?ar=1`}
              target="_blank"
              className="btn-toy-3d inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-3 py-2 text-xs font-black text-slate-950 shadow-sm transition-all hover:scale-102 active:scale-95"
              title={`Thử trải nghiệm AR 3D cho bộ ${pack.name}`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Thử AR 3D</span>
            </Link>

            <Link
              href={`/order?pack=${pack.packCode}`}
              className="btn-toy-3d inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-3 py-2 text-xs font-black text-white shadow-sm shadow-emerald-600/25 transition-all hover:scale-102 active:scale-95"
              title={`Đặt mua ngay ${pack.name}`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Đặt Mua Bộ</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
