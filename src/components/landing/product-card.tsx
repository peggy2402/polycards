"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Animal } from "@/types/animal";
import { siteConfig } from "@/config/site";
import { formatVndCurrency, buildTargetScanUrl } from "@/lib/formatters";
import { Badge } from "@/components/common/badge";
import {
  Sparkles,
  ShoppingBag,
  Smartphone,
  ExternalLink,
  Volume2,
} from "lucide-react";

interface ProductCardProps {
  animal: Animal;
}

export function ProductCard({ animal }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const [playingLang, setPlayingLang] = useState<"en" | "vi" | "zh" | null>(null);

  const targetScanUrl = buildTargetScanUrl(animal.slug);
  const buyUrl =
    animal.buyUrl && animal.buyUrl.trim() !== ""
      ? animal.buyUrl
      : siteConfig.defaultBuyUrl;

  // 3D Parallax Tilt calculation on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8; // Max tilt 8 deg
    const rotateY = ((x - centerX) / centerX) * 8;

    setTilt({ x: rotateX, y: rotateY, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false });
  };

  // Audio Playback for multiple languages (EN, VI, ZH)
  const playAudio = (lang: "en" | "vi" | "zh") => {
    try {
      setPlayingLang(lang);
      let audioPath = animal.audioUrl;
      if (animal.audios) {
        if (lang === "en" && animal.audios.en) audioPath = animal.audios.en;
        if (lang === "vi" && animal.audios.vi) audioPath = animal.audios.vi;
        if (lang === "zh" && animal.audios.zh) audioPath = animal.audios.zh;
      }

      const audio = new Audio(audioPath);
      audio.onended = () => setPlayingLang(null);
      audio.onerror = () => setPlayingLang(null);
      audio.play().catch(() => setPlayingLang(null));
    } catch {
      setPlayingLang(null);
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
      }}
      className="group relative"
    >
      <article
        style={{
          transform: tilt.active
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: tilt.active
            ? "transform 0.1s ease-out"
            : "transform 0.5s ease-out, box-shadow 0.5s ease-out",
        }}
        className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-amber-200/90 bg-white p-5 shadow-lg shadow-amber-900/5 transition-all duration-300 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/15"
      >
        {/* Holographic Sheen/Glare Overlay on 3D Tilt */}
        {tilt.active && (
          <div
            className="pointer-events-none absolute inset-0 z-20 rounded-3xl opacity-30 mix-blend-overlay transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${(tilt.y + 8) * 6.25}% ${
                (-tilt.x + 8) * 6.25
              }%, rgba(255,255,255,0.9), transparent 60%)`,
            }}
          />
        )}

        {/* 3D Animal Poster Image with Floating Badges */}
        <div className="relative">
          <Link
            href={`/ar/${animal.slug}`}
            className="group/img relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-tr from-sky-50 via-amber-50/50 to-emerald-50/60 border border-amber-200/80 shadow-inner cursor-pointer"
          >
            <div
              style={{
                transform: tilt.active ? "translateZ(30px)" : "translateZ(0)",
                transition: "transform 0.2s ease-out",
              }}
              className="relative h-full w-full"
            >
              <Image
                src={animal.images[0] || "/images/animals/lion.jpg"}
                alt={`Mô hình đồ chơi 3D ${animal.nameVi} (${animal.nameEn})`}
                fill
                className="object-cover rounded-xl transition-transform duration-500 group-hover/img:scale-108"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            {/* Floating Top-Left Badges */}
            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap pointer-events-none">
              {animal.category && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/20 shadow-xs">
                  {animal.category}
                </span>
              )}
              {animal.arEnabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600/90 text-white backdrop-blur-md shadow-xs border border-white/20">
                  <Sparkles className="h-3 w-3" />
                  <span>AR 3D</span>
                </span>
              )}
            </div>

            {/* Floating Top-Right Badge */}
            {animal.badge && (
              <span className="absolute top-2.5 right-2.5 z-10 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-md border border-amber-300 pointer-events-none">
                {animal.badge}
              </span>
            )}

            {/* Floating Bottom-Right Hint */}
            <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-black text-amber-300 shadow-sm border border-white/20 backdrop-blur-md">
              <Sparkles className="h-2.5 w-2.5 text-amber-400" />
              <span>Xem 3D</span>
            </div>
          </Link>
        </div>

        {/* Info Area: Compact & Proportional */}
        <div className="relative z-10 flex flex-1 flex-col pt-3 pb-1 space-y-2">
          {/* Multilingual Animal Name Header */}
          <div className="flex items-start justify-between gap-2">
            <Link href={`/ar/${animal.slug}`} className="group/title block min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-lg font-black tracking-tight text-slate-900 group-hover/title:text-emerald-700 transition-colors truncate">
                  {animal.nameEn}
                </h3>
                <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 shrink-0">
                  {animal.ipa}
                </span>
              </div>
              <div className="text-xs font-bold text-amber-700 mt-0.5">
                {animal.nameVi}
              </div>
            </Link>

            {animal.nameZh && (
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-slate-800">{animal.nameZh}</span>
                <span className="block text-[10px] text-slate-500 font-medium">{animal.pinyinZh}</span>
              </div>
            )}
          </div>

          {/* Multilingual Audio Listen Buttons - Compact Bar */}
          <div className="flex items-center justify-between gap-1.5 py-1 px-2.5 rounded-xl bg-amber-50/90 border border-amber-200/70 text-xs">
            <span className="text-[10px] font-bold text-amber-950 flex items-center gap-1 shrink-0">
              <Volume2 className="h-3 w-3 text-amber-600" />
              <span>Nghe:</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => playAudio("en")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${
                  playingLang === "en"
                    ? "bg-amber-500 text-white shadow-xs animate-pulse"
                    : "bg-white text-stone-700 hover:bg-amber-200/60 border border-amber-200"
                }`}
                title="Nghe phát âm tiếng Anh"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => playAudio("vi")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${
                  playingLang === "vi"
                    ? "bg-emerald-600 text-white shadow-xs animate-pulse"
                    : "bg-white text-stone-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
                title="Nghe phát âm tiếng Việt"
              >
                VI
              </button>
              {animal.nameZh && (
                <button
                  type="button"
                  onClick={() => playAudio("zh")}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${
                    playingLang === "zh"
                      ? "bg-rose-500 text-white shadow-xs animate-pulse"
                      : "bg-white text-stone-700 hover:bg-rose-100 border border-rose-200"
                  }`}
                  title="Nghe phát âm tiếng Trung"
                >
                  ZH
                </button>
              )}
            </div>
          </div>

          {/* Price Tag with Original Price and Discount */}
          <div className="pt-1 flex items-center justify-between border-t border-amber-100/80">
            <div>
              <span className="text-[10px] font-medium text-stone-500 block leading-tight">Giá thẻ lẻ:</span>
              {animal.originalPrice && animal.originalPrice > animal.price ? (
                <span className="text-[10px] text-stone-400 line-through font-mono">
                  {formatVndCurrency(animal.originalPrice)}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-amber-950">
                {formatVndCurrency(animal.price)}
              </span>
              {animal.originalPrice && animal.originalPrice > animal.price ? (
                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                  -{Math.round(((animal.originalPrice - animal.price) / animal.originalPrice) * 100)}%
                </span>
              ) : null}
            </div>
          </div>

          {/* Action Buttons: Touch Target >= 44px */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href={`/ar/${animal.slug}`}
              className="btn-toy-3d inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-2 py-2 text-xs font-black text-slate-950 shadow-sm transition-all hover:scale-102 active:scale-95"
              aria-label={`Trải nghiệm 3D và AR cho ${animal.nameEn}`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Thử AR 3D</span>
            </Link>

            <Link
              href={`/order?animal=${animal.slug}`}
              className="btn-toy-3d inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-2 py-2 text-xs font-black text-white shadow-sm shadow-emerald-600/25 transition-all hover:scale-102 active:scale-95"
              aria-label={`Đặt mua bộ thẻ ${animal.nameEn}`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Mua Thẻ</span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
