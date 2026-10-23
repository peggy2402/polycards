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

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between gap-2 pb-3">
          {animal.arEnabled ? (
            <Badge
              variant="secondary"
              icon="sparkles"
              className="border-emerald-300 bg-emerald-50 text-emerald-800 font-bold"
            >
              AR Live 3D
            </Badge>
          ) : (
            <span />
          )}

          {animal.badge && (
            <Badge
              variant="primary"
              icon="flame"
              className="border-amber-300 bg-amber-100 text-amber-900 font-bold"
            >
              {animal.badge}
            </Badge>
          )}
        </div>

        {/* 3D Animal Poster Image - Hoàn toàn trong trẻo, không che mặt */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-tr from-sky-50 via-amber-50/50 to-emerald-50/60 p-2 border border-amber-100 shadow-inner">
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
              className="object-cover rounded-xl transition-transform duration-500 group-hover:scale-106"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Quick AR Badge */}
          <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-amber-900 shadow-sm border border-amber-200 backdrop-blur-xs">
            <Sparkles className="h-3 w-3 text-amber-500 animate-spin" style={{ animationDuration: "6s" }} />
            <span>Mô Hình 3D</span>
          </div>
        </div>

        {/* Info Area */}
        <div className="relative z-10 flex flex-1 flex-col pt-4 pb-2">
          {/* Multilingual Animal Name Header */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-extrabold tracking-tight text-stone-900">
                {animal.nameEn}
              </h3>
              <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {animal.ipa}
              </span>
            </div>

            {animal.nameZh && (
              <div className="text-right">
                <span className="text-sm font-bold text-stone-700">{animal.nameZh}</span>
                <span className="block text-[10px] text-stone-500 font-medium">{animal.pinyinZh}</span>
              </div>
            )}
          </div>

          <div className="mt-1 text-sm font-bold text-emerald-700">
            {animal.nameVi}
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-600">
            {animal.description}
          </p>

          {/* Multilingual Audio Listen Buttons */}
          <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-amber-50/80 p-2 border border-amber-200/70">
            <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5 text-amber-600" />
              <span>Nghe:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-1">
              {/* EN Audio */}
              <button
                type="button"
                onClick={() => playAudio("en")}
                className={`flex-1 min-h-[34px] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  playingLang === "en"
                    ? "bg-amber-500 text-white shadow-xs animate-pulse"
                    : "bg-white text-stone-700 hover:bg-amber-200/60 border border-amber-200"
                }`}
                title="Nghe phát âm tiếng Anh"
              >
                <span>EN</span>
              </button>

              {/* VI Audio */}
              <button
                type="button"
                onClick={() => playAudio("vi")}
                className={`flex-1 min-h-[34px] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  playingLang === "vi"
                    ? "bg-emerald-600 text-white shadow-xs animate-pulse"
                    : "bg-white text-stone-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
                title="Nghe phát âm tiếng Việt"
              >
                <span>VI</span>
              </button>

              {/* ZH Audio */}
              {animal.nameZh && (
                <button
                  type="button"
                  onClick={() => playAudio("zh")}
                  className={`flex-1 min-h-[34px] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    playingLang === "zh"
                      ? "bg-red-500 text-white shadow-xs animate-pulse"
                      : "bg-white text-stone-700 hover:bg-red-100 border border-red-200"
                  }`}
                  title="Nghe phát âm tiếng Trung"
                >
                  <span>ZH</span>
                </button>
              )}
            </div>
          </div>

          {/* Price Tag */}
          <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Giá ưu đãi:</span>
            <span className="text-xl font-extrabold text-amber-950">
              {formatVndCurrency(animal.price)}
            </span>
          </div>
        </div>

        {/* Action Buttons: Touch Target >= 44px */}
        <div className="relative z-10 mt-3 grid grid-cols-2 gap-2.5 pt-1">
          <Link
            href={targetScanUrl}
            className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-amber-500/15 px-3 py-2 text-xs font-extrabold text-amber-900 border border-amber-300/80 transition-all hover:bg-amber-500/25 active:scale-95"
            aria-label={`Trải nghiệm AR cho ${animal.nameEn}`}
          >
            <Smartphone className="h-4 w-4 text-amber-600" />
            <span>Thử AR</span>
          </Link>

          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-extrabold text-white shadow-md shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-95"
            aria-label={`Mua ngay mô hình ${animal.nameEn}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Mua Ngay</span>
            <ExternalLink className="h-3 w-3 opacity-75" />
          </a>
        </div>
      </article>
    </div>
  );
}
