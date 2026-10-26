"use client";

import React, { useState } from "react";
import { Animal } from "@/types/animal";
import { Volume2, VolumeX, Sparkles } from "lucide-react";

interface ArAudioPlayerProps {
  animal: Animal;
}

export function ArAudioPlayer({ animal }: ArAudioPlayerProps) {
  const [playingLang, setPlayingLang] = useState<"en" | "vi" | "zh" | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const playAudio = (lang: "en" | "vi" | "zh") => {
    // Stop currently playing audio if any
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    try {
      let audioPath = animal.audioUrl;
      if (animal.audios) {
        if (lang === "en" && animal.audios.en) audioPath = animal.audios.en;
        if (lang === "vi" && animal.audios.vi) audioPath = animal.audios.vi;
        if (lang === "zh" && animal.audios.zh) audioPath = animal.audios.zh;
      }

      const audio = new Audio(audioPath);
      setCurrentAudio(audio);
      setPlayingLang(lang);

      audio.onended = () => {
        setPlayingLang(null);
        setCurrentAudio(null);
      };
      audio.onerror = () => {
        setPlayingLang(null);
        setCurrentAudio(null);
      };

      audio.play().catch(() => {
        setPlayingLang(null);
        setCurrentAudio(null);
      });
    } catch {
      setPlayingLang(null);
      setCurrentAudio(null);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setPlayingLang(null);
    setCurrentAudio(null);
  };

  return (
    <div className="w-full max-w-full overflow-hidden rounded-3xl border-2 border-amber-200/90 bg-white/95 p-4 sm:p-5 shadow-lg shadow-amber-900/5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-amber-100">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900 truncate">
              Luyện Nghe & Phát Âm Chuẩn
            </h3>
            <span className="text-[11px] text-stone-500 block truncate">
              Bấm để nghe phát âm từng ngôn ngữ
            </span>
          </div>
        </div>

        {playingLang && (
          <button
            type="button"
            onClick={stopAudio}
            className="flex items-center gap-1 rounded-xl bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-200"
            title="Dừng phát âm"
          >
            <VolumeX className="h-3.5 w-3.5" />
            <span>Dừng</span>
          </button>
        )}
      </div>

      {/* 3 Language Audio Buttons */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* EN Button */}
        <button
          type="button"
          onClick={() => playAudio("en")}
          className={`flex min-h-[56px] items-center justify-between rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
            playingLang === "en"
              ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/30"
              : "border-amber-200 bg-amber-50/70 text-amber-950 hover:bg-amber-100"
          }`}
        >
          <div>
            <span className="block text-xs font-extrabold tracking-wider uppercase opacity-80">
              Tiếng Anh (EN)
            </span>
            <span className="text-base font-black">{animal.nameEn}</span>
            <span className="block text-[11px] font-mono opacity-80">{animal.ipa}</span>
          </div>
          <Volume2 className={`h-5 w-5 shrink-0 ${playingLang === "en" ? "animate-pulse" : "text-amber-600"}`} />
        </button>

        {/* VI Button */}
        <button
          type="button"
          onClick={() => playAudio("vi")}
          className={`flex min-h-[56px] items-center justify-between rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
            playingLang === "vi"
              ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "border-emerald-200 bg-emerald-50/70 text-emerald-950 hover:bg-emerald-100"
          }`}
        >
          <div>
            <span className="block text-xs font-extrabold tracking-wider uppercase opacity-80">
              Tiếng Việt (VI)
            </span>
            <span className="text-base font-black">{animal.nameVi}</span>
            <span className="block text-[11px] opacity-80">Giọng bản xứ</span>
          </div>
          <Volume2 className={`h-5 w-5 shrink-0 ${playingLang === "vi" ? "animate-pulse" : "text-emerald-600"}`} />
        </button>

        {/* ZH Button */}
        {animal.nameZh ? (
          <button
            type="button"
            onClick={() => playAudio("zh")}
            className={`flex min-h-[56px] items-center justify-between rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
              playingLang === "zh"
                ? "border-red-500 bg-red-500 text-white shadow-md shadow-red-500/30"
                : "border-red-200 bg-red-50/70 text-red-950 hover:bg-red-100"
            }`}
          >
            <div>
              <span className="block text-xs font-extrabold tracking-wider uppercase opacity-80">
                Tiếng Trung (ZH)
              </span>
              <span className="text-base font-black">{animal.nameZh}</span>
              <span className="block text-[11px] opacity-80 font-mono">{animal.pinyinZh}</span>
            </div>
            <Volume2 className={`h-5 w-5 shrink-0 ${playingLang === "zh" ? "animate-pulse" : "text-red-600"}`} />
          </button>
        ) : (
          <div className="flex min-h-[56px] items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-3 text-center text-xs text-stone-400">
            <span>Sắp cập nhật</span>
          </div>
        )}
      </div>

      {/* Visual Audio Waveform when playing */}
      {playingLang && (
        <div className="mt-3 flex items-center justify-center gap-1.5 py-1">
          <span className="h-3 w-1 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-5 w-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-7 w-1 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          <span className="h-4 w-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "450ms" }} />
          <span className="h-2 w-1 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }} />
          <span className="text-xs font-bold text-amber-900 ml-2">Đang phát âm thanh...</span>
        </div>
      )}
    </div>
  );
}
