"use client";

import React, { useState } from "react";
import { Animal } from "@/types/animal";
import { ModelViewerView } from "@/components/ar/model-viewer-view";
import { ArAudioPlayer } from "@/components/ar/ar-audio-player";
import { AnimationControls } from "@/components/ar/animation-controls";
import { ArInteractiveQuiz } from "@/components/ar/ar-interactive-quiz";
import { WebArCardView } from "@/components/ar/webar-card-view";
import { Camera, Sparkles, Languages, Volume2, ArrowRight } from "lucide-react";

interface ArViewerContainerProps {
  animal: Animal;
}

export function ArViewerContainer({ animal }: ArViewerContainerProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<string>(
    animal.animations && animal.animations.length > 0 ? animal.animations[0] : ""
  );
  const [isWebArOpen, setIsWebArOpen] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* 1. Interactive WebAR Hero Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 text-stone-950 shadow-xl shadow-amber-500/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-amber-400 shadow-md">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-950">
                  Công Nghệ AR Quét Thẻ Trực Tiếp
                </h3>
                <span className="rounded-full bg-stone-950 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
                  Mới
                </span>
              </div>
              <p className="text-xs font-semibold text-stone-900/90 mt-0.5">
                Camera di chuyển quanh thẻ bài, tương tác 3 nút phát âm EN / VI / ZH và tiếng kêu sống động!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsWebArOpen(true)}
            className="inline-flex min-h-[48px] w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-6 py-2.5 text-sm font-black text-amber-300 shadow-lg hover:bg-stone-900 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>Bật Camera Quét Thẻ</span>
            <ArrowRight className="h-4 w-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* 2. 3D Model Viewer with Turntable + AR launch capabilities */}
      <ModelViewerView
        animal={animal}
        selectedAnimation={selectedAnimation}
        onOpenWebAr={() => setIsWebArOpen(true)}
      />

      {/* 3. Animation Controls if available */}
      {animal.animations && animal.animations.length > 0 && (
        <AnimationControls
          animations={animal.animations}
          selectedAnimation={selectedAnimation}
          onSelectAnimation={setSelectedAnimation}
        />
      )}

      {/* 4. Multilingual Audio Listen Panel (Tiếng Anh IPA - Tiếng Việt - Tiếng Trung Pinyin) */}
      <ArAudioPlayer animal={animal} />

      {/* 5. Mini Challenge: Tương tác củng cố trí nhớ cho trẻ 3-8 tuổi */}
      <ArInteractiveQuiz currentAnimal={animal} />

      {/* 6. Fullscreen WebAR Card View Overlay */}
      {isWebArOpen && (
        <WebArCardView
          animal={animal}
          onClose={() => setIsWebArOpen(false)}
        />
      )}
    </div>
  );
}
