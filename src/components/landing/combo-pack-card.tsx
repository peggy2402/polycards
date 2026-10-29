"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface ComboPackCardProps {
  pack: CardComboPack;
  isVipBanner?: boolean;
}

export function ComboPackCard({ pack, isVipBanner = false }: ComboPackCardProps) {
  const isVip = isVipBanner || pack.id === "pack-combo-vip-120";
  const [imgSrc, setImgSrc] = useState<string>(
    pack.imageSrc || "/images/cards/lion-cards.jpg"
  );

  useEffect(() => {
    setImgSrc(pack.imageSrc || "/images/cards/lion-cards.jpg");
  }, [pack.imageSrc]);

  const detailHref =
    pack.targetUrl && pack.targetUrl.trim() !== ""
      ? pack.targetUrl.trim()
      : "/products";

  const subBadgeText =
    pack.subBadge !== undefined
      ? pack.subBadge.trim()
      : "Gói Combo Đại Gia Đình Toàn Diện Nhất";

  if (isVip) {
    return (
      <article className="group relative md:col-span-2 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-orange-50/70 border-2 border-amber-400 shadow-xl shadow-amber-500/15 ring-2 ring-amber-400/30 transition-all duration-300 hover:-translate-y-1">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Cột ảnh đại diện gói Combo Lớn — Nhấn trực tiếp vào ảnh để chuyển trang */}
          <Link
            href={detailHref}
            className="relative aspect-[16/10] lg:aspect-auto lg:col-span-5 min-h-[240px] w-full overflow-hidden bg-stone-900 block cursor-pointer"
            title={`Xem chi tiết ${pack.name}`}
          >
            <Image
              src={imgSrc}
              alt={`Bộ thẻ học ${pack.name}`}
              fill
              unoptimized
              onError={() => setImgSrc("/images/cards/lion-cards.jpg")}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/30" />

            <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 flex-wrap">
              {pack.categoryName && (
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-400 text-stone-950 shadow-sm">
                  {pack.categoryName}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-sm">
                <Layers className="h-3.5 w-3.5" />
                <span>{pack.cardsCount} Thẻ AR</span>
              </span>
            </div>

            <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-black text-amber-300 tracking-wider bg-black/75 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/15">
                Mã Bộ: {pack.packCode}
              </span>
              {pack.badge && pack.badge.trim() !== "" && (
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-stone-950 shadow-md">
                  {pack.badge}
                </span>
              )}
            </div>
          </Link>

          {/* Cột thông tin & nút đặt mua gói Combo Lớn */}
          <div className="p-5 sm:p-7 lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              {subBadgeText !== "" && (
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>{subBadgeText}</span>
                </div>
              )}

              {/* Nhấn vào tiêu đề hoặc mô tả trên thẻ đều chuyển qua trang */}
              <Link href={detailHref} className="block group/title cursor-pointer">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover/title:text-amber-700 transition-colors flex items-center gap-2">
                  <span>{pack.name}</span>
                  <ArrowRight className="h-5 w-5 text-amber-600 opacity-0 -translate-x-1 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all shrink-0" />
                </h3>

                <p className="mt-1.5 text-xs sm:text-sm text-stone-600 leading-relaxed group-hover/title:text-stone-800 transition-colors">
                  {pack.description}
                </p>
              </Link>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {pack.highlights.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800 bg-white px-3 py-1 rounded-xl border border-amber-200 shadow-2xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link href={detailHref} className="block cursor-pointer">
                <span className="text-[11px] font-bold text-stone-500 block">
                  Giá ưu đãi trọn bộ ({pack.cardsCount} thẻ):
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-amber-950">
                    {formatVndCurrency(pack.price)}
                  </span>
                  {pack.originalPrice > pack.price && (
                    <span className="text-xs text-stone-400 line-through font-mono">
                      {formatVndCurrency(pack.originalPrice)}
                    </span>
                  )}
                  {pack.discountPercent > 0 && (
                    <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      -{pack.discountPercent}%
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/ar/${pack.sampleSlug || "lion"}?ar=1`}
                  className="btn-toy-3d inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-sm transition-all hover:scale-102 active:scale-95"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Thử AR 3D</span>
                </Link>

                <Link
                  href={`/order?pack=${pack.packCode}`}
                  className="btn-toy-3d inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-emerald-600/25 transition-all hover:scale-102 active:scale-95"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Đặt Mua Trọn Bộ VIP</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  const singlePackHref = `/products?category=${pack.categorySlug}`;

  return (
    <article className="group relative h-full flex flex-col justify-between overflow-hidden rounded-3xl bg-white border-2 border-amber-200/90 shadow-md shadow-stone-900/5 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10">
      <Link
        href={singlePackHref}
        className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-tr from-stone-100 via-amber-50/50 to-orange-50/40 block cursor-pointer"
      >
        <Image
          src={imgSrc}
          alt={`Bộ thẻ học ${pack.name}`}
          fill
          unoptimized
          onError={() => setImgSrc("/images/cards/lion-card.jpg")}
          className="object-cover transition-transform duration-500 group-hover:scale-106"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/30" />

        <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-xs">
            {pack.categoryName}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
            <Layers className="h-3 w-3" />
            <span>{pack.cardsCount} Thẻ AR</span>
          </span>
        </div>

        {pack.badge && pack.badge.trim() !== "" && (
          <span className="absolute top-3.5 right-3.5 z-10 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md border bg-amber-400 text-stone-950 border-amber-300">
            {pack.badge}
          </span>
        )}

        <div className="absolute bottom-3 left-3.5 z-10 font-mono text-[10px] font-black text-amber-300 tracking-wider bg-black/70 px-2.5 py-0.5 rounded-md backdrop-blur-md border border-white/10">
          Mã Bộ: {pack.packCode}
        </div>
      </Link>

      <div className="p-5 sm:p-6 flex flex-1 flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <Link href={singlePackHref} className="block cursor-pointer">
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
              {pack.name}
            </h3>

            <p className="mt-1 text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-2 min-h-[2.5rem]">
              {pack.description}
            </p>
          </Link>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {pack.highlights.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-700 bg-amber-50/90 px-2.5 py-1 rounded-lg border border-amber-200/80"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-amber-100/90 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-stone-500 block leading-tight">
                Giá trọn bộ {pack.cardsCount} thẻ:
              </span>
              {pack.originalPrice > pack.price && (
                <span className="text-xs text-stone-400 line-through font-mono">
                  {formatVndCurrency(pack.originalPrice)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-950">
                {formatVndCurrency(pack.price)}
              </span>
              {pack.discountPercent > 0 && (
                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                  -{pack.discountPercent}%
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            <Link
              href={`/ar/${pack.sampleSlug}?ar=1`}
              className="btn-toy-3d inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-3 py-2 text-xs sm:text-sm font-black text-slate-950 shadow-sm transition-all hover:scale-102 active:scale-95"
            >
              <Smartphone className="h-4 w-4" />
              <span>Thử AR 3D</span>
            </Link>

            <Link
              href={`/order?pack=${pack.packCode}`}
              className="btn-toy-3d inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-3 py-2 text-xs sm:text-sm font-black text-white shadow-sm shadow-emerald-600/25 transition-all hover:scale-102 active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Đặt Mua Bộ</span>
            </Link>
          </div>

          <Link
            href={singlePackHref}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/70 hover:bg-amber-100/90 px-3 py-2 text-xs font-bold text-amber-900 transition-colors"
          >
            <span>Xem chi tiết danh sách {pack.cardsCount} thẻ lẻ của bộ này</span>
            <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
          </Link>
        </div>
      </div>
    </article>
  );
}
