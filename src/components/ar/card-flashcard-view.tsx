"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Animal } from "@/types/animal";
import { siteConfig } from "@/config/site";
import { SubjectFocusImage } from "@/components/common/subject-focus-image";
import {
  Camera,
  RotateCw,
  QrCode,
  Sparkles,
  Minimize2,
  Volume2,
  ShieldCheck,
} from "lucide-react";
import { playCardLanguageAudio } from "@/lib/speech-audio";

interface CardFlashcardViewProps {
  animal: Animal;
  onOpenWebAr?: () => void;
}

export function CardFlashcardView({
  animal,
  onOpenWebAr,
}: CardFlashcardViewProps) {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isFullscreenCard, setIsFullscreenCard] = useState<boolean>(false);
  const [activeVoice, setActiveVoice] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("/qr-output/lion-qr.png");

  const showEn = animal.enableEnVi !== false;
  const showZh =
    animal.enableZhVi !== undefined
      ? animal.enableZhVi
      : Boolean(animal.nameZh && animal.nameZh.trim());

  const hasBadge = Boolean(animal.badge && animal.badge.trim() !== "");

  // Tự động sinh mã QR chuẩn xác cho mặt sau thẻ
  useEffect(() => {
    let isActive = true;
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : siteConfig.url.replace(/\/$/, "");
    const langParam =
      showEn && !showZh ? "&lang=en-vi" : !showEn && showZh ? "&lang=zh-vi" : "";
    const targetArUrl = `${origin}/ar/${animal.slug}?ar=1${langParam}`;

    QRCode.toDataURL(targetArUrl, {
      width: 360,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#1c1917",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isActive && url) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.warn("Không thể sinh QR động, dùng QR mặc định:", err);
      });

    return () => {
      isActive = false;
    };
  }, [animal.slug, showEn, showZh]);

  const handleQuickSpeak = (e: React.MouseEvent, lang: "en" | "vi" | "zh") => {
    e.stopPropagation();
    setActiveVoice(lang);
    playCardLanguageAudio(animal, lang, () => {
      setActiveVoice(null);
    });
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Khung thẻ bài 3D lật 2 mặt: Mặt trước tập trung 100% vào nhân vật & từ vựng, Mặt sau hiển thị mã QR */}
      <div className="w-full max-w-[340px] sm:max-w-[380px] perspective-1000 mx-auto">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative aspect-[3/4.15] w-full rounded-[28px] border-[3px] border-amber-300/90 bg-white shadow-2xl transition-transform duration-700 transform-style-preserve-3d cursor-pointer select-none ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            boxShadow:
              "0 24px 48px -12px rgba(180, 83, 9, 0.22), 0 0 0 4px rgba(254, 243, 199, 0.75)",
          }}
        >
          {/* ================= MẶT TRƯỚC THẺ BÀI (NHÂN VẬT SẠCH QR + TỪ VỰNG TINH TẾ) ================= */}
          <div className="absolute inset-0 backface-hidden flex flex-col rounded-[25px] overflow-hidden bg-gradient-to-b from-amber-50/80 via-white to-emerald-50/35 p-3.5 sm:p-4">
            {/* Header thẻ mặt trước */}
            <div className="flex items-center justify-between gap-2 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative h-7 w-7 rounded-xl bg-white border border-amber-200 shadow-2xs p-0.5 shrink-0 overflow-hidden">
                  <Image
                    src="/images/icons/logo.png"
                    alt="Poly Cards"
                    width={26}
                    height={26}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 truncate">
                  {animal.category || "Poly Cards"}
                </span>
              </div>

              {hasBadge && (
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-2.5 py-0.5 text-[10px] font-black text-stone-950 shadow-2xs shrink-0">
                  {animal.badge}
                </span>
              )}
            </div>

            {/* Khung trung tâm: Chỉ focus vào Nhân Vật / Vật Thể (không hiển thị QR hay ô chữ đè) */}
            <div className="relative flex-1 w-full rounded-2xl overflow-hidden border-2 border-amber-200/80 bg-gradient-to-b from-sky-50 via-amber-50/40 to-emerald-50/60 shadow-inner group">
              <SubjectFocusImage
                primaryUrl={animal.images?.[0]}
                secondaryUrl={animal.posterUrl}
                alt={`Nhân vật ${animal.nameVi} (${animal.nameEn})`}
                className="transition-transform duration-500 group-hover:scale-105"
              />

              {/* Nút lật xem mã QR mặt sau */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
                className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-stone-950/75 hover:bg-stone-950 px-2.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-md shadow-md border border-white/20 active:scale-95 transition-all cursor-pointer"
                title="Bấm để lật xem mã QR ở mặt sau"
              >
                <QrCode className="h-3 w-3" />
                <span>Lật Xem QR</span>
              </button>
            </div>

            {/* Khu vực Từ Vựng & Nút Phát Âm (Đã loại bỏ hoàn toàn dấu ngoặc rỗng) */}
            <div className="pt-3 space-y-2.5">
              <div className="rounded-2xl bg-white/95 border border-amber-200/80 px-3.5 py-2.5 shadow-2xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-none tracking-tight">
                      {showEn ? animal.nameEn : animal.nameVi}
                    </h3>
                    {showEn && animal.ipa && (
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80">
                        {animal.ipa}
                      </span>
                    )}
                  </div>
                  {showEn && (
                    <p className="text-xs sm:text-sm font-extrabold text-amber-700 mt-1 truncate">
                      {animal.nameVi}
                    </p>
                  )}
                </div>

                {showZh && animal.nameZh && animal.nameZh.trim() !== "" && (
                  <div className="text-right shrink-0 pl-2 border-l border-amber-100">
                    <div className="text-base font-black text-rose-600 leading-tight">
                      {animal.nameZh}
                    </div>
                    {animal.pinyinZh && animal.pinyinZh.trim() !== "" && (
                      <div className="font-mono text-[11px] font-semibold text-stone-500">
                        {animal.pinyinZh}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hàng nút bấm nghe phát âm nhanh */}
              <div className="flex items-center gap-2">
                {showEn && (
                  <button
                    type="button"
                    onClick={(e) => handleQuickSpeak(e, "en")}
                    className={`flex-1 min-h-[38px] py-1.5 px-2.5 rounded-xl text-xs font-black border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeVoice === "en"
                        ? "bg-amber-400 text-stone-950 border-amber-500 shadow-sm"
                        : "bg-amber-50/80 text-amber-950 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <Volume2 className="h-3.5 w-3.5 text-amber-600" />
                    <span>EN</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => handleQuickSpeak(e, "vi")}
                  className={`flex-1 min-h-[38px] py-1.5 px-2.5 rounded-xl text-xs font-black border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeVoice === "vi"
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                      : "bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>VI</span>
                </button>

                {showZh && (
                  <button
                    type="button"
                    onClick={(e) => handleQuickSpeak(e, "zh")}
                    className={`flex-1 min-h-[38px] py-1.5 px-2.5 rounded-xl text-xs font-black border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeVoice === "zh"
                        ? "bg-rose-500 text-white border-rose-600 shadow-sm"
                        : "bg-rose-50/80 text-rose-900 border-rose-200 hover:bg-rose-100"
                    }`}
                  >
                    <Volume2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>ZH</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ================= MẶT SAU THẺ BÀI (BACK - MÃ QR ĐỊNH DANH) ================= */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-between rounded-[25px] overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950 text-white p-5 border-2 border-amber-400/50">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Thẻ Bài AR Poly Cards
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-200">
                {animal.qrCode}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center my-auto py-2">
              <div className="relative h-44 w-44 rounded-2xl bg-white p-3 shadow-xl border-2 border-amber-400/80 flex items-center justify-center">
                <Image
                  src={qrDataUrl}
                  alt={`Mã QR thẻ ${animal.nameEn}`}
                  width={150}
                  height={150}
                  unoptimized
                  onError={() => {
                    if (qrDataUrl !== "/qr-output/lion-qr.png") {
                      setQrDataUrl("/qr-output/lion-qr.png");
                    }
                  }}
                  className="object-contain"
                />
              </div>

              <div className="mt-3 text-center">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                  Mã Quét AR Định Danh
                </span>
                <p className="text-[11px] text-stone-300 max-w-xs mt-0.5 leading-relaxed">
                  Hướng camera vào mã QR này hoặc mặt trước thẻ in để mô hình {animal.nameVi} 3D xuất hiện.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-amber-500/30 flex items-center justify-between text-[11px] text-amber-200/80">
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Bản quyền Poly Cards</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="flex items-center gap-1 font-bold text-amber-300 hover:underline cursor-pointer"
              >
                <RotateCw className="h-3 w-3" />
                <span>Xem Mặt Trước</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh công cụ mở camera AR bên dưới thẻ */}
      <div className="mt-4 flex flex-col gap-2.5 w-full max-w-[340px] sm:max-w-[380px] mx-auto">
        {onOpenWebAr && (
          <button
            type="button"
            onClick={onOpenWebAr}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-2.5 text-xs sm:text-sm font-black text-stone-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer border border-amber-300"
          >
            <Camera className="h-4 w-4 text-stone-950 shrink-0" />
            <span>Quét Thẻ AR Tương Tác</span>
          </button>
        )}
      </div>

      <p className="mt-3 text-[11px] text-stone-500 text-center max-w-sm leading-relaxed">
        Chạm trực tiếp vào tấm thẻ để lật mặt trước (nhân vật) và mặt sau (mã QR quét thử AR).
      </p>

      {isFullscreenCard && (
        <div
          onClick={() => setIsFullscreenCard(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md cursor-pointer animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl border-4 border-amber-300 flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setIsFullscreenCard(false)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-stone-950 text-white"
            >
              <Minimize2 className="h-4 w-4" />
            </button>

            <span className="text-xs font-black uppercase text-amber-700 mb-2">
              Nhân Vật AR: {animal.nameVi} ({animal.nameEn})
            </span>

            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-stone-200">
              <SubjectFocusImage
                primaryUrl={animal.images?.[0]}
                secondaryUrl={animal.posterUrl}
                alt={animal.nameEn}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
