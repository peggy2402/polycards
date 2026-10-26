"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Animal } from "@/types/animal";
import { isAnimalUnlocked } from "@/lib/activation";
import { ModelViewerView } from "@/components/ar/model-viewer-view";
import { ArAudioPlayer } from "@/components/ar/ar-audio-player";
import { AnimationControls } from "@/components/ar/animation-controls";
import { ArInteractiveQuiz } from "@/components/ar/ar-interactive-quiz";
import { WebArCardView } from "@/components/ar/webar-card-view";
import { ArActivationModal } from "@/components/ar/ar-activation-modal";
import { Camera, Sparkles, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";

interface ArViewerContainerProps {
  animal: Animal;
}

export function ArViewerContainer({ animal }: ArViewerContainerProps) {
  const router = useRouter();
  const [selectedAnimation, setSelectedAnimation] = useState<string>(
    animal.animations && animal.animations.length > 0 ? animal.animations[0] : ""
  );

  const [isWebArOpen, setIsWebArOpen] = useState<boolean>(false);
  const [isTrial, setIsTrial] = useState<boolean>(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState<boolean>(false);
  const [unlocked, setUnlocked] = useState<boolean>(false);

  // Kiểm tra trạng thái bản quyền (Đã kích hoạt hay chưa)
  useEffect(() => {
    setUnlocked(isAnimalUnlocked(animal.slug));
  }, [animal.slug]);

  // Xử lý khi người dùng bấm nút mở WebAR
  const handleRequestWebAr = () => {
    if (unlocked) {
      // Đã mở khóa -> vào thẳng chế độ chính thức không giới hạn
      setIsTrial(false);
      setIsWebArOpen(true);
    } else {
      // Chưa mở khóa -> hiển thị popup lựa chọn: Dùng thử 30s / Đặt mua / Nhập mã
      setIsActivationModalOpen(true);
    }
  };

  const handleStartTrial = () => {
    setIsTrial(true);
    setIsWebArOpen(true);
  };

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
                {unlocked ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Đã Kích Hoạt</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-stone-950 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
                    Bản Quyền
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-stone-900/90 mt-0.5">
                Camera di chuyển quanh thẻ bài, con vật đồng hành trước camera, tương tác 3 nút phát âm EN/VI/ZH!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleRequestWebAr}
              className="inline-flex min-h-[48px] w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-6 py-2.5 text-sm font-black text-amber-300 shadow-lg hover:bg-stone-900 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>{unlocked ? "Bật Camera Quét Thẻ" : "Quét AR (Thử 30s / Mở Khóa)"}</span>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 3D Model Viewer with Turntable + AR launch capabilities */}
      <ModelViewerView
        animal={animal}
        selectedAnimation={selectedAnimation}
        onOpenWebAr={handleRequestWebAr}
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
          isTrial={isTrial}
          onOpenOrder={() => router.push(`/order?animal=${animal.slug}`)}
          onOpenActivate={() => setIsActivationModalOpen(true)}
        />
      )}

      {/* 7. Modal Bán Hàng & Kích Hoạt Bản Quyền */}
      <ArActivationModal
        animal={animal}
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        onStartTrial={handleStartTrial}
        onActivated={() => {
          setUnlocked(true);
        }}
      />
    </div>
  );
}
