"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Animal } from "@/types/animal";
import {
  Camera,
  RotateCw,
  QrCode,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { speakWord } from "@/lib/speech-audio";

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

  const cardFrontImage = animal.images[0] || `/images/animals/${animal.slug}.jpg`;
  const qrImage = `/qr-output/${animal.slug}-qr.png`;

  const handleQuickSpeak = (e: React.MouseEvent, lang: "en" | "vi" | "zh") => {
    e.stopPropagation();
    setActiveVoice(lang);
    let text = animal.nameEn;
    if (lang === "vi") text = animal.nameVi;
    if (lang === "zh") text = animal.nameZh || animal.nameEn;

    speakWord(text, lang, () => {
      setActiveVoice(null);
    });
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Khung thẻ bài chính với tỷ lệ chuẩn Flashcard (Aspect ratio 3:4 hoặc 2:3) */}
      <div className="w-full max-w-sm sm:max-w-md perspective-1000">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative aspect-[3/4] w-full rounded-3xl border-4 border-amber-300 bg-white shadow-2xl transition-transform duration-700 transform-style-preserve-3d cursor-pointer select-none ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            boxShadow:
              "0 20px 35px -10px rgba(180, 83, 9, 0.25), 0 0 15px rgba(251, 191, 36, 0.3)",
          }}
        >
          {/* ================= MẶT TRƯỚC THẺ BÀI (FRONT) ================= */}
          <div className="absolute inset-0 backface-hidden flex flex-col rounded-[22px] overflow-hidden bg-gradient-to-b from-amber-50/70 via-white to-amber-50/40 p-4">
            {/* Top header thẻ bài: Logo Poly Cards & Badge con vật */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xs shadow-xs">
                  P
                </div>
                <span className="text-xs font-black tracking-wide text-amber-950 uppercase">
                  Poly Cards
                </span>
              </div>

              {animal.badge && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-900 border border-amber-300">
                  {animal.badge}
                </span>
              )}
            </div>

            {/* Khung minh họa con vật thực tế */}
            <div className="relative flex-1 w-full my-3 rounded-2xl overflow-hidden border-2 border-amber-200 bg-stone-100 shadow-inner group">
              <Image
                src={cardFrontImage}
                alt={`Thẻ bài ${animal.nameEn}`}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 420px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Nút lật mặt sau mini ở góc trên hình */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
                className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-stone-950/75 px-2.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-md shadow-md border border-white/20 active:scale-95 transition-all"
                title="Bấm để xem mặt sau có mã QR"
              >
                <RotateCw className="h-3 w-3" />
                <span>Xem Mặt Sau</span>
              </button>
            </div>

            {/* Thông tin 3 Ngôn Ngữ chân thẻ bài */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-stone-900 leading-tight">
                    {animal.nameEn}
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-700">
                    {animal.ipa}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-stone-800">
                    {animal.nameVi}
                  </div>
                  <div className="text-xs font-bold text-rose-600">
                    {animal.nameZh} <span className="font-mono text-[10px] text-stone-500">({animal.pinyinZh})</span>
                  </div>
                </div>
              </div>

              {/* Hàng nút bấm nghe phát âm nhanh trực tiếp trên thẻ */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={(e) => handleQuickSpeak(e, "en")}
                  className={`flex-1 py-1 px-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 flex items-center justify-center gap-1 ${
                    activeVoice === "en"
                      ? "bg-amber-500 text-stone-950 border-amber-400"
                      : "bg-white text-stone-700 border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  <Volume2 className="h-3 w-3 text-amber-600" />
                  <span>EN</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleQuickSpeak(e, "vi")}
                  className={`flex-1 py-1 px-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 flex items-center justify-center gap-1 ${
                    activeVoice === "vi"
                      ? "bg-emerald-500 text-white border-emerald-400"
                      : "bg-white text-stone-700 border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  <Volume2 className="h-3 w-3 text-emerald-600" />
                  <span>VI</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleQuickSpeak(e, "zh")}
                  className={`flex-1 py-1 px-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 flex items-center justify-center gap-1 ${
                    activeVoice === "zh"
                      ? "bg-rose-500 text-white border-rose-400"
                      : "bg-white text-stone-700 border-rose-200 hover:bg-rose-50"
                  }`}
                >
                  <Volume2 className="h-3 w-3 text-rose-600" />
                  <span>ZH</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= MẶT SAU THẺ BÀI (BACK - QR CODE) ================= */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-between rounded-[22px] overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950 text-white p-5 border-2 border-amber-400/50">
            {/* Top header mặt sau */}
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

            {/* Vùng hiển thị Mã QR Code nhận diện thực tế ảo */}
            <div className="flex flex-col items-center justify-center my-auto py-2">
              <div className="relative h-44 w-44 rounded-2xl bg-white p-3 shadow-xl border-2 border-amber-400/80 flex items-center justify-center">
                <Image
                  src={qrImage}
                  alt={`Mã QR thẻ ${animal.nameEn}`}
                  width={150}
                  height={150}
                  className="object-contain"
                />
              </div>

              <div className="mt-3 text-center">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                  Mã Quét AR Định Danh
                </span>
                <p className="text-[11px] text-stone-300 max-w-xs mt-0.5 leading-relaxed">
                  Hướng camera vào mã QR hoặc mặt trước thẻ để con vật {animal.nameVi} 3D xuất hiện.
                </p>
              </div>
            </div>

            {/* Bottom info mặt sau */}
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
                className="flex items-center gap-1 font-bold text-amber-300 hover:underline"
              >
                <RotateCw className="h-3 w-3" />
                <span>Xem Mặt Trước</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh công cụ tương tác dưới thẻ bài */}
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-md">
        {onOpenWebAr && (
          <button
            type="button"
            onClick={onOpenWebAr}
            className="flex-1 w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-2.5 text-sm font-black text-stone-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer border border-amber-300"
          >
            <Camera className="h-4 w-4 text-stone-950" />
            <span>Quét Thẻ AR Tương Tác</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-amber-300 bg-white px-4 py-2.5 text-xs font-extrabold text-stone-800 hover:bg-amber-50 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <RotateCw className="h-3.5 w-3.5 text-amber-600" />
          <span>{isFlipped ? "Xem Mặt Trước" : "Lật Xem Mã QR"}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreenCard(!isFullscreenCard)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-white text-stone-700 hover:bg-amber-50 active:scale-90 transition-all shadow-xs shrink-0"
          title="Phóng to thẻ bài để quét từ máy khác"
        >
          <Maximize2 className="h-4 w-4 text-amber-700" />
        </button>
      </div>

      {/* Gợi ý cho phụ huynh / bé */}
      <p className="mt-3 text-[11px] text-stone-500 text-center max-w-sm leading-relaxed">
        Chạm trực tiếp vào tấm thẻ để lật mặt trước/sau. Bạn có thể mở thẻ này trên máy tính để lấy điện thoại quét thử AR!
      </p>

      {/* Modal phóng to thẻ bài toàn màn hình để tiện quét từ điện thoại khác */}
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
              Thẻ Mẫu Thử AR: {animal.nameVi} ({animal.nameEn})
            </span>

            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-stone-200">
              <Image
                src={cardFrontImage}
                alt={animal.nameEn}
                fill
                priority
                className="object-cover"
              />
            </div>

            <p className="mt-3 text-[11px] text-stone-600 text-center">
              Dùng một điện thoại khác mở camera quét trực tiếp vào tấm thẻ này để trải nghiệm 3D AR!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
