"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Animal } from "@/types/animal";
import {
  isAnimalUnlocked,
  activateWithCodeAsync,
  normalizeCategorySlug,
} from "@/lib/activation";
import { getMergedProducts } from "@/lib/products-store";
import { CardFlashcardView } from "@/components/ar/card-flashcard-view";
import { ModelViewerView } from "@/components/ar/model-viewer-view";
import { ArAudioPlayer } from "@/components/ar/ar-audio-player";
import { AnimationControls } from "@/components/ar/animation-controls";
import { ArInteractiveQuiz } from "@/components/ar/ar-interactive-quiz";
import { WebArCardView } from "@/components/ar/webar-card-view";
import { ArActivationModal } from "@/components/ar/ar-activation-modal";
import {
  Camera,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Box,
} from "lucide-react";

interface ArViewerContainerProps {
  animal: Animal;
}

export function ArViewerContainer({ animal: initialAnimal }: ArViewerContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [animal, setAnimal] = useState<Animal>(initialAnimal);

  // Đồng bộ dữ liệu thẻ mới nhất từ MongoDB API hoặc Local Store (hỗ trợ thẻ mới tạo từ /tools tức thì)
  useEffect(() => {
    const cleanSlug = initialAnimal.slug.toLowerCase().trim();
    const localMatched = getMergedProducts().find(
      (p) => p.slug.toLowerCase() === cleanSlug
    );
    if (localMatched) {
      setAnimal(localMatched);
    }

    fetch("/api/products")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const serverMatched = json.data.find(
            (p: Animal) => p.slug.toLowerCase() === cleanSlug
          );
          if (serverMatched) {
            setAnimal(serverMatched);
          }
        }
      })
      .catch(() => {});
  }, [initialAnimal.slug]);

  // Tab Switcher State: Mặc định hiển thị Models 3D ngay khi vào trang
  const [activeTab, setActiveTab] = useState<"card" | "model3d">("model3d");

  const [selectedAnimation, setSelectedAnimation] = useState<string>(
    animal.animations && animal.animations.length > 0 ? animal.animations[0] : ""
  );

  useEffect(() => {
    if (animal.animations && animal.animations.length > 0) {
      const slugLower = (animal.slug || "").toLowerCase();
      let bestAnim = animal.animations[0];
      if (slugLower.includes("jump")) {
        const found = animal.animations.find((a) => a.toLowerCase().includes("jump"));
        if (found) bestAnim = found;
      } else if (slugLower.includes("walk")) {
        const found = animal.animations.find((a) => a.toLowerCase().includes("walk"));
        if (found) bestAnim = found;
      } else if (slugLower.includes("run")) {
        const found = animal.animations.find((a) => a.toLowerCase().includes("run"));
        if (found) bestAnim = found;
      }
      setSelectedAnimation(bestAnim);
    }
  }, [animal.animations, animal.slug]);

  const [isWebArOpen, setIsWebArOpen] = useState<boolean>(false);
  const [isTrial, setIsTrial] = useState<boolean>(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState<boolean>(false);
  const [unlocked, setUnlocked] = useState<boolean>(false);

  // Tự động kích hoạt bản quyền (check MongoDB Atlas) & Mở thẳng WebAR 3D khi khách hàng quét QR
  useEffect(() => {
    let isMounted = true;
    const isDirectAr =
      searchParams.get("ar") === "1" ||
      searchParams.get("camera") === "1" ||
      searchParams.get("scan") === "1" ||
      searchParams.get("mode") === "webar";

    const codeParam = searchParams.get("code") || searchParams.get("key");
    const catSlug = normalizeCategorySlug(animal.categorySlug || animal.category);

    async function handleDirectScan() {
      if (codeParam) {
        await activateWithCodeAsync(codeParam, catSlug, animal.slug);
      }

      if (!isMounted) return;
      const isAlreadyUnlocked = isAnimalUnlocked(animal.slug, catSlug);
      setUnlocked(isAlreadyUnlocked);

      if (isDirectAr || codeParam) {
        setIsTrial(!isAlreadyUnlocked);
        setIsWebArOpen(true);
      }
    }

    handleDirectScan();
    return () => {
      isMounted = false;
    };
  }, [searchParams, animal.slug, animal.categorySlug, animal.category]);

  // Kiểm tra trạng thái bản quyền (Đã kích hoạt đúng Bộ Danh Mục hay chưa) và đồng bộ tức thì
  useEffect(() => {
    const catSlug = normalizeCategorySlug(animal.categorySlug || animal.category);
    const updateUnlockStatus = () => {
      setUnlocked(isAnimalUnlocked(animal.slug, catSlug));
    };

    updateUnlockStatus();

    window.addEventListener("storage", updateUnlockStatus);
    window.addEventListener("polycards_activated", updateUnlockStatus);

    return () => {
      window.removeEventListener("storage", updateUnlockStatus);
      window.removeEventListener("polycards_activated", updateUnlockStatus);
    };
  }, [animal.slug, animal.categorySlug, animal.category]);

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
      {/* 1. Interactive WebAR Hero Banner Card - 100% Responsive trên Mobile */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 sm:p-5 text-stone-950 shadow-xl shadow-amber-500/20 w-full max-w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto min-w-0 flex-1">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-amber-400 shadow-md">
              <Camera className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-stone-950 leading-tight">
                  Công Nghệ AR Quét Thẻ
                </h3>
                {unlocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300 shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Đã Kích Hoạt</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-stone-950 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 shrink-0">
                    Bản Quyền
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-900/90 leading-tight mt-1">
                Camera di chuyển quanh thẻ, con vật 3D tương tác 3 nút phát âm EN/VI/ZH!
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleRequestWebAr}
              className="inline-flex min-h-[48px] w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-black text-amber-300 shadow-lg hover:bg-stone-900 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
              <span className="truncate">{unlocked ? "Bật Camera Quét Thẻ" : "Quét AR (Thử 3s / Mở Khóa)"}</span>
              <ArrowRight className="h-4 w-4 text-amber-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hai Chế Độ: Tab 1: Thẻ Bài AR & Tab 2: Models 3D - Grid 2 cột hoàn hảo trên màn hình 360px */}
      <div className="w-full max-w-sm mx-auto">
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-amber-100/90 border-2 border-amber-300 shadow-xs gap-1.5 w-full">
          {/* TAB 1: THẺ BÀI */}
          <button
            type="button"
            onClick={() => setActiveTab("card")}
            className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 ${
              activeTab === "card"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30 scale-102"
                : "text-stone-700 hover:text-stone-900 hover:bg-amber-200/60"
            }`}
          >
            <Layers className="h-4 w-4 text-stone-950 shrink-0" />
            <span className="truncate">Tab 1: Thẻ Bài</span>
          </button>

          {/* TAB 2: MODELS 3D */}
          <button
            type="button"
            onClick={() => setActiveTab("model3d")}
            className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 ${
              activeTab === "model3d"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30 scale-102"
                : "text-stone-700 hover:text-stone-900 hover:bg-amber-200/60"
            }`}
          >
            <Box className="h-4 w-4 text-stone-950 shrink-0" />
            <span className="truncate">Tab 2: Models 3D</span>
          </button>
        </div>
      </div>

      {/* 3. Vùng hiển thị nội dung theo Tab */}
      {activeTab === "card" ? (
        /* ================= NỘI DUNG TAB 1: THẺ BÀI ================= */
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <CardFlashcardView
            animal={animal}
            onOpenWebAr={handleRequestWebAr}
          />
        </div>
      ) : (
        /* ================= NỘI DUNG TAB 2: MODELS 3D ================= */
        <div className="animate-in fade-in zoom-in-95 duration-200 space-y-5">
          <ModelViewerView
            animal={animal}
            selectedAnimation={selectedAnimation}
            onOpenWebAr={handleRequestWebAr}
          />

          {/* Animation Controls cho mô hình 3D */}
          {animal.animations && animal.animations.length > 0 && (
            <AnimationControls
              animations={animal.animations}
              selectedAnimation={selectedAnimation}
              onSelectAnimation={setSelectedAnimation}
            />
          )}
        </div>
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
