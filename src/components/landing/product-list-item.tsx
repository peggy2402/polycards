"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Animal } from "@/types/animal";
import { siteConfig } from "@/config/site";
import { formatVndCurrency } from "@/lib/formatters";
import { playCardLanguageAudio } from "@/lib/speech-audio";
import { SubjectFocusImage } from "@/components/common/subject-focus-image";
import {
  Sparkles,
  ShoppingBag,
  Smartphone,
  Volume2,
} from "lucide-react";

interface ProductListItemProps {
  animal: Animal;
}

export function ProductListItem({ animal }: ProductListItemProps) {
  const [playingLang, setPlayingLang] = useState<"en" | "vi" | "zh" | null>(null);

  const buyUrl =
    animal.buyUrl && animal.buyUrl.trim() !== ""
      ? animal.buyUrl
      : siteConfig.defaultBuyUrl;

  const showEn = animal.enableEnVi !== false;
  const showZh =
    animal.enableZhVi !== undefined
      ? animal.enableZhVi
      : Boolean(animal.nameZh && animal.nameZh.trim());

  const playAudio = (lang: "en" | "vi" | "zh") => {
    setPlayingLang(lang);
    playCardLanguageAudio(animal, lang, () => {
      setPlayingLang(null);
    });
  };

  const isZhOnly = showZh && !showEn;

  return (
    <article className="group relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-3xl border-2 border-amber-200/90 bg-white hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
      {/* 1. ẢNH ĐẠI DIỆN THẺ BÀI (COMPACT SQUARE) */}
      <Link
        href={`/ar/${animal.slug}`}
        className="relative shrink-0 w-full sm:w-32 md:w-36 aspect-[4/3] sm:aspect-square overflow-hidden rounded-2xl bg-gradient-to-tr from-sky-50 via-amber-50/50 to-emerald-50/60 border border-amber-200/80 shadow-inner group/img cursor-pointer"
      >
        <SubjectFocusImage
          primaryUrl={animal.images?.[0]}
          secondaryUrl={animal.posterUrl}
          alt={`Mô hình đồ chơi 3D ${animal.nameVi} (${animal.nameEn})`}
          className="rounded-xl transition-transform duration-500 group-hover/img:scale-108"
        />

        {/* Badges nổi trên ảnh */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 flex-wrap pointer-events-none">
          {animal.category && (
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/75 text-white backdrop-blur-md border border-white/20">
              {animal.category}
            </span>
          )}
          {animal.arEnabled && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-600/90 text-white backdrop-blur-md border border-white/20">
              <Sparkles className="h-2.5 w-2.5" />
              <span>AR</span>
            </span>
          )}
        </div>

        {animal.badge && (
          <span className="absolute top-2 right-2 z-10 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-md border border-amber-300 pointer-events-none">
            {animal.badge}
          </span>
        )}

        <div className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[9px] font-black text-amber-300 shadow-sm border border-white/20 backdrop-blur-md">
          <Sparkles className="h-2 w-2 text-amber-400" />
          <span>Xem 3D</span>
        </div>
      </Link>

      {/* 2. THÔNG TIN THẺ BÀI (TIÊU ĐỀ, PHIÊN ÂM, PHÁT ÂM, MÔ TẢ) */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Tên Thẻ Bài & Phiên âm Song Ngữ */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/ar/${animal.slug}`} className="hover:text-emerald-700 transition-colors">
            <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              {animal.nameVi}
            </h3>
          </Link>

          {isZhOnly ? (
            <div className="flex items-center gap-1.5">
              {animal.nameZh && (
                <span
                  className="text-base font-bold text-rose-700"
                  style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' }}
                >
                  {animal.nameZh}
                </span>
              )}
              {animal.pinyinZh && (
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {animal.pinyinZh}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-stone-700">
                {animal.nameEn}
              </span>
              {animal.ipa && (
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {animal.ipa}
                </span>
              )}
              {showZh && animal.nameZh && (
                <span
                  className="text-sm font-bold text-rose-700"
                  style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' }}
                >
                  • {animal.nameZh} {animal.pinyinZh ? `(${animal.pinyinZh})` : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Thanh Nghe Phát Âm Đa Ngôn Ngữ */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
          <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
            <Volume2 className="h-3 w-3 text-amber-600" />
            <span>Phát âm:</span>
          </span>

          <div className="flex items-center gap-1">
            {showEn && (
              <button
                type="button"
                onClick={() => playAudio("en")}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                  playingLang === "en"
                    ? "bg-amber-500 text-white shadow-xs animate-pulse"
                    : "bg-amber-50 text-stone-700 hover:bg-amber-200/70 border border-amber-200"
                }`}
                title="Nghe phát âm tiếng Anh"
              >
                Tiếng Anh
              </button>
            )}
            <button
              type="button"
              onClick={() => playAudio("vi")}
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                playingLang === "vi"
                  ? "bg-emerald-600 text-white shadow-xs animate-pulse"
                  : "bg-emerald-50 text-stone-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
              title="Nghe phát âm tiếng Việt"
            >
              Tiếng Việt
            </button>
            {showZh && animal.nameZh && (
              <button
                type="button"
                onClick={() => playAudio("zh")}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                  playingLang === "zh"
                    ? "bg-rose-500 text-white shadow-xs animate-pulse"
                    : "bg-rose-50 text-stone-700 hover:bg-rose-100 border border-rose-200"
                }`}
                title="Nghe phát âm tiếng Trung"
              >
                Tiếng Trung
              </button>
            )}
          </div>
        </div>

        {/* Mô tả thẻ bài */}
        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
          {animal.description ||
            `Thẻ học thông minh tương tác thực tế ảo WebAR Poly Cards: ${animal.nameVi} (${
              isZhOnly ? animal.nameZh || animal.nameEn : animal.nameEn
            }). Quét mã QR trải nghiệm mô hình 3D tương tác sống động.`}
        </p>

        {/* Mã bộ bản quyền nếu có */}
        {animal.packCode && (
          <div className="text-[10px] text-stone-400 flex items-center gap-1 pt-0.5">
            <span>Mã bộ:</span>
            <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              {animal.packCode}
            </span>
          </div>
        )}
      </div>

      {/* 3. GIÁ TIỀN & CỤM NÚT HÀNH ĐỘNG */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-amber-100 shrink-0 min-w-[160px]">
        {/* Giá bán */}
        <div className="text-left sm:text-right">
          <div className="flex items-center sm:justify-end gap-1.5">
            <span className="text-lg font-black text-amber-950">
              {formatVndCurrency(animal.price)}
            </span>
            {animal.originalPrice && animal.originalPrice > animal.price ? (
              <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                -{Math.round(((animal.originalPrice - animal.price) / animal.originalPrice) * 100)}%
              </span>
            ) : null}
          </div>
          {animal.originalPrice && animal.originalPrice > animal.price ? (
            <span className="text-[11px] text-stone-400 line-through font-mono block">
              {formatVndCurrency(animal.originalPrice)}
            </span>
          ) : null}
        </div>

        {/* Cụm Nút Thử AR 3D & Mua Thẻ */}
        <div className="flex items-center gap-2">
          <Link
            href={`/ar/${animal.slug}`}
            className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow-sm transition-all hover:scale-102 active:scale-95"
            aria-label={`Trải nghiệm AR 3D cho ${animal.nameVi}`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Thử AR 3D</span>
          </Link>

          <Link
            href={buyUrl}
            className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-sm shadow-emerald-600/25 transition-all hover:scale-102 active:scale-95"
            aria-label={`Đặt mua thẻ ${animal.nameVi}`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Mua Thẻ</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
