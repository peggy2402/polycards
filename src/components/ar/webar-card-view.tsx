"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Animal } from "@/types/animal";
import { speakWord, playAnimalSoundEffect } from "@/lib/speech-audio";
import {
  Camera,
  X,
  Volume2,
  Sparkles,
  CheckCircle2,
  Scan,
  RotateCcw,
  Languages,
  Music,
  Download,
  AlertCircle,
  HelpCircle,
  Play,
} from "lucide-react";

declare global {
  interface Window {
    THREE?: any;
    MINDAR?: {
      IMAGE: {
        MindARThree: any;
        THREE: any;
      };
    };
  }
}

interface WebArCardViewProps {
  animal: Animal;
  onClose: () => void;
}

export function WebArCardView({ animal, onClose }: WebArCardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindarRef = useRef<any>(null);
  const mixerRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const actionsRef = useRef<{ [name: string]: any }>({});
  const clockRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTargetFound, setIsTargetFound] = useState<boolean>(false);
  const [activeLang, setActiveLang] = useState<"en" | "vi" | "zh" | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);
  const [currentAnimIndex, setCurrentAnimIndex] = useState<number>(0);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Dynamic script loader utility
  const loadScript = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = (e) => reject(new Error(`Failed to load script ${src}: ${e}`));
      document.body.appendChild(s);
    });
  }, []);

  // Initialize MindAR and Three.js scene
  useEffect(() => {
    let isCancelled = false;

    async function startAR() {
      try {
        setIsLoading(true);
        setLoadError(null);

        // 1. Nạp bộ thư viện MindAR Three UMD nếu chưa có
        if (!window.MINDAR || !window.MINDAR.IMAGE || !window.MINDAR.IMAGE.MindARThree) {
          await loadScript("/lib/mindar-image-three.prod.js");
        }

        if (isCancelled) return;

        // Gán Three.js toàn cục để tương thích GLTFLoader
        if (!window.THREE && window.MINDAR && window.MINDAR.IMAGE.THREE) {
          window.THREE = window.MINDAR.IMAGE.THREE;
        }

        // 2. Nạp GLTFLoader nếu chưa có
        if (!window.THREE.GLTFLoader) {
          await loadScript("/lib/GLTFLoader.js");
        }

        if (isCancelled || !containerRef.current) return;

        const THREE = window.THREE;
        const { MindARThree } = window.MINDAR!.IMAGE;

        // 3. Khởi tạo MindAR Three instance với target thẻ bài tương ứng
        const mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: `/targets/${animal.slug}.mind`,
          maxTrack: 1,
          uiLoading: "no",
          uiScanning: "no",
        });

        mindarRef.current = mindarThree;

        const { renderer, scene, camera } = mindarThree;

        // Thêm ánh sáng môi trường cho mô hình 3D rực rỡ
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
        dirLight.position.set(0, 10, 5);
        scene.add(dirLight);

        // Thêm ánh sáng phụ lấp đầy từ phía trước
        const fillLight = new THREE.DirectionalLight(0xffedd5, 0.8);
        fillLight.position.set(0, -5, 5);
        scene.add(fillLight);

        const anchor = mindarThree.addAnchor(0);

        // Bắt sự kiện nhận diện thẻ bài
        anchor.onTargetFound = () => {
          if (!isCancelled) {
            setIsTargetFound(true);
            // Kêu tiếng con vật chào mừng khi vừa phát hiện thẻ
            playAnimalSoundEffect(animal.slug);
          }
        };

        anchor.onTargetLost = () => {
          if (!isCancelled) {
            setIsTargetFound(false);
          }
        };

        // 4. Nạp mô hình 3D GLTF/GLB
        const loader = new THREE.GLTFLoader();
        loader.load(
          animal.modelUrl,
          (gltf: any) => {
            if (isCancelled) return;

            const model = gltf.scene;
            // Tỷ lệ mô hình phù hợp hiển thị trên bề mặt thẻ bài chuẩn
            model.scale.set(0.35, 0.35, 0.35);
            model.position.set(0, -0.35, 0);
            model.rotation.set(0, 0, 0);

            anchor.group.add(model);
            modelRef.current = model;

            // Xử lý các Animations nếu mô hình có hoạt ảnh
            if (gltf.animations && gltf.animations.length > 0) {
              const mixer = new THREE.AnimationMixer(model);
              mixerRef.current = mixer;
              actionsRef.current = {};

              gltf.animations.forEach((clip: any) => {
                const action = mixer.clipAction(clip);
                actionsRef.current[clip.name] = action;
              });

              // Chạy hoạt ảnh đầu tiên mặc định
              const firstClip = gltf.animations[0];
              if (firstClip) {
                actionsRef.current[firstClip.name]?.play();
              }
            }

            // 5. Khởi động Camera và Video stream tracking
            clockRef.current = new THREE.Clock();

            mindarThree
              .start()
              .then(() => {
                if (isCancelled) return;
                setIsLoading(false);

                // Khởi chạy vòng lặp render
                renderer.setAnimationLoop(() => {
                  if (clockRef.current && mixerRef.current) {
                    const delta = clockRef.current.getDelta();
                    mixerRef.current.update(delta);
                  }
                  renderer.render(scene, camera);
                });
              })
              .catch((err: any) => {
                console.error("[MindAR Start Error]:", err);
                if (!isCancelled) {
                  setLoadError("Không thể truy cập camera. Vui lòng cấp quyền camera trong cài đặt trình duyệt để trải nghiệm AR.");
                  setIsLoading(false);
                }
              });
          },
          undefined,
          (err: any) => {
            console.error("[GLTF Loader Error]:", err);
            if (!isCancelled) {
              setLoadError("Không thể tải mô hình 3D con vật. Vui lòng thử lại sau.");
              setIsLoading(false);
            }
          }
        );
      } catch (err: any) {
        console.error("[WebAR Init Error]:", err);
        if (!isCancelled) {
          setLoadError(err.message || "Lỗi khởi tạo AR Engine.");
          setIsLoading(false);
        }
      }
    }

    startAR();

    return () => {
      isCancelled = true;
      // Dừng và dọn dẹp MindAR Camera stream
      if (mindarRef.current) {
        try {
          mindarRef.current.stop();
          if (mindarRef.current.renderer) {
            mindarRef.current.renderer.setAnimationLoop(null);
          }
        } catch (e) {
          console.warn("[MindAR Stop]:", e);
        }
      }
    };
  }, [animal, loadScript]);

  // Xử lý phát âm đa ngữ khi chạm vào 3 nút bấm
  const handleSpeak = (lang: "en" | "vi" | "zh") => {
    setActiveLang(lang);

    // Kích hoạt phản hồi nhảy cử động của mô hình 3D
    triggerModelReaction();

    let textToSpeak = animal.nameEn;
    if (lang === "vi") textToSpeak = animal.nameVi;
    if (lang === "zh") textToSpeak = animal.nameZh || animal.nameEn;

    speakWord(textToSpeak, lang, () => {
      setActiveLang(null);
    });
  };

  // Xử lý phát tiếng kêu con vật
  const handleAnimalSound = () => {
    setIsPlayingSound(true);
    triggerModelReaction();
    playAnimalSoundEffect(animal.slug, () => {
      setIsPlayingSound(false);
    });
  };

  // Đổi hoạt ảnh của con vật
  const handleToggleAnimation = () => {
    if (!animal.animations || animal.animations.length <= 1 || !mixerRef.current) return;
    const nextIndex = (currentAnimIndex + 1) % animal.animations.length;
    const currentName = animal.animations[currentAnimIndex];
    const nextName = animal.animations[nextIndex];

    const currentAction = actionsRef.current[currentName];
    const nextAction = actionsRef.current[nextName];

    if (currentAction && nextAction) {
      currentAction.fadeOut(0.3);
      nextAction.reset().fadeIn(0.3).play();
    }
    setCurrentAnimIndex(nextIndex);
  };

  // Hiệu ứng tương tác: Mô hình nhún nhảy / xoay nhẹ khi chạm nút
  const triggerModelReaction = () => {
    if (!modelRef.current) return;
    const startY = modelRef.current.position.y;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      modelRef.current.position.y = startY + Math.sin(step * 0.5) * 0.08;
      modelRef.current.rotation.y += 0.05;
      if (step >= 12) {
        clearInterval(interval);
        modelRef.current.position.y = startY;
      }
    }, 25);
  };

  // Chụp ảnh kỷ niệm AR
  const handleCapturePhoto = () => {
    if (!mindarRef.current || !containerRef.current) return;
    try {
      const videoEl = containerRef.current.querySelector("video") as HTMLVideoElement | null;
      const canvasEl = containerRef.current.querySelector("canvas") as HTMLCanvasElement | null;

      if (!videoEl || !canvasEl) return;

      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = videoEl.videoWidth || canvasEl.width;
      captureCanvas.height = videoEl.videoHeight || canvasEl.height;
      const ctx = captureCanvas.getContext("2d");
      if (!ctx) return;

      // 1. Vẽ khung video camera thật
      ctx.drawImage(videoEl, 0, 0, captureCanvas.width, captureCanvas.height);
      // 2. Đè mô hình 3D WebGL lên trên
      ctx.drawImage(canvasEl, 0, 0, captureCanvas.width, captureCanvas.height);

      // Thêm logo Poly Cards Watermark góc dưới
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.roundRect(16, captureCanvas.height - 48, 180, 36, 8);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`Poly Cards AR • ${animal.nameEn}`, 28, captureCanvas.height - 25);

      const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.92);
      setCapturedPhotoUrl(dataUrl);
    } catch (err) {
      console.warn("Lỗi khi chụp ảnh AR:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 select-none overflow-hidden touch-none">
      {/* 1. Vùng chứa Camera Stream và WebGL Canvas của MindAR */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full overflow-hidden [&>video]:absolute [&>video]:inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:w-full [&>canvas]:h-full"
      />

      {/* 2. Top Navigation Bar (Nút Đóng, Tiêu đề con vật, Hướng dẫn) */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-4 pb-3 bg-gradient-to-b from-stone-950/80 via-stone-950/40 to-transparent backdrop-blur-[2px]">
        {/* Nút thoát AR */}
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/60 text-white border border-white/20 backdrop-blur-md active:scale-90 transition-transform shadow-lg"
          title="Đóng Camera AR"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Huy hiệu tên con vật & Trạng thái nhận diện */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md shadow-lg">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isTargetFound ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-xs font-black tracking-wide text-white">
              {animal.nameEn} ({animal.nameVi})
            </span>
          </div>
          <span className="text-[10px] text-amber-200/90 font-medium mt-0.5">
            {isTargetFound ? "Đang khóa mục tiêu thẻ bài" : "Đang tìm thẻ bài..."}
          </span>
        </div>

        {/* Nút trợ giúp / hướng dẫn */}
        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/60 text-white border border-white/20 backdrop-blur-md active:scale-90 transition-transform shadow-lg"
          title="Hướng dẫn sử dụng"
        >
          <HelpCircle className="h-5 w-5 text-amber-300" />
        </button>
      </div>

      {/* 3. Reticle Khung ngắm định vị thẻ bài giữa màn hình */}
      {!isLoading && !loadError && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
          <div
            className={`relative w-64 h-80 max-w-[70vw] max-h-[48vh] rounded-3xl border-2 transition-all duration-300 ${
              isTargetFound
                ? "border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.6)] bg-emerald-500/5"
                : "border-dashed border-amber-300/80 shadow-[0_0_15px_rgba(251,191,36,0.3)] bg-black/10"
            }`}
          >
            {/* 4 góc ngắm laser hiện đại */}
            <div className="absolute -top-1.5 -left-1.5 h-5 w-5 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
            <div className="absolute -bottom-1.5 -left-1.5 h-5 w-5 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
            <div className="absolute -bottom-1.5 -right-1.5 h-5 w-5 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />

            {/* Thông báo trạng thái giữa khung ngắm */}
            <div className="absolute -top-10 inset-x-0 flex justify-center">
              {isTargetFound ? (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md animate-bounce">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đã nhận diện thẻ bài!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-bold text-stone-950 shadow-lg backdrop-blur-md">
                  <Scan className="h-3.5 w-3.5 animate-spin" />
                  <span>Hướng vào thẻ bài {animal.nameVi}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Loading State Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/85 backdrop-blur-md px-6 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 border-t-amber-400 animate-spin" />
            <Sparkles className="h-8 w-8 text-amber-400 animate-pulse" />
          </div>
          <h3 className="mt-4 text-lg font-black text-white">
            Đang Khởi Động AR Poly Cards...
          </h3>
          <p className="mt-1 text-xs text-amber-200/80 max-w-xs leading-relaxed">
            Đang đồng bộ đặc trưng thị giác của {animal.nameVi} và kết nối camera
          </p>
        </div>
      )}

      {/* 5. Error State (Quyền camera hoặc lỗi) */}
      {loadError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/90 backdrop-blur-md px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-white">Chưa thể bật Camera AR</h3>
          <p className="mt-2 text-xs text-stone-300 max-w-xs leading-relaxed">
            {loadError}
          </p>
          <div className="mt-6 flex flex-col gap-2.5 w-full max-w-xs">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 text-sm font-extrabold text-stone-950 active:scale-95 transition-transform shadow-lg shadow-amber-500/20"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Thử Lại Lần Nữa</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 text-sm font-bold text-white border border-white/20 active:scale-95 transition-transform"
            >
              <span>Quay Lại Chế Độ 3D</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Floating Control Panel (3 Nút Phát Âm EN/VI/ZH + Tiếng Kêu + Chụp Ảnh + Đổi Động Tác) */}
      <div className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center gap-3 px-4 pb-6 pt-8 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent">
        {/* Hàng 3 Nút Phát Âm Ngôn Ngữ Trọng Tâm (EN / VI / ZH) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-md">
          {/* NÚT TIẾNG ANH (EN) */}
          <button
            type="button"
            onClick={() => handleSpeak("en")}
            className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border-2 backdrop-blur-md active:scale-95 transition-all shadow-lg ${
              activeLang === "en"
                ? "bg-amber-500 border-amber-300 text-stone-950 scale-105 shadow-amber-500/40"
                : "bg-black/60 border-amber-400/50 text-white hover:border-amber-400"
            }`}
          >
            <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
              <Languages className="h-3 w-3" />
              <span>EN</span>
            </div>
            <span className="text-sm font-black truncate max-w-full">
              {animal.nameEn}
            </span>
            <span className="text-[10px] font-mono text-amber-200/80">
              {animal.ipa}
            </span>
          </button>

          {/* NÚT TIẾNG VIỆT (VI) */}
          <button
            type="button"
            onClick={() => handleSpeak("vi")}
            className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border-2 backdrop-blur-md active:scale-95 transition-all shadow-lg ${
              activeLang === "vi"
                ? "bg-emerald-500 border-emerald-300 text-white scale-105 shadow-emerald-500/40"
                : "bg-black/60 border-emerald-400/50 text-white hover:border-emerald-400"
            }`}
          >
            <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-300">
              <Languages className="h-3 w-3" />
              <span>VI</span>
            </div>
            <span className="text-sm font-black truncate max-w-full">
              {animal.nameVi}
            </span>
            <span className="text-[10px] text-emerald-200/80">
              Tiếng Việt
            </span>
          </button>

          {/* NÚT TIẾNG TRUNG (ZH) */}
          <button
            type="button"
            onClick={() => handleSpeak("zh")}
            className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border-2 backdrop-blur-md active:scale-95 transition-all shadow-lg ${
              activeLang === "zh"
                ? "bg-rose-500 border-rose-300 text-white scale-105 shadow-rose-500/40"
                : "bg-black/60 border-rose-400/50 text-white hover:border-rose-400"
            }`}
          >
            <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-rose-300">
              <Languages className="h-3 w-3" />
              <span>ZH</span>
            </div>
            <span className="text-sm font-black truncate max-w-full">
              {animal.nameZh || animal.nameEn}
            </span>
            <span className="text-[10px] font-mono text-rose-200/80">
              {animal.pinyinZh || "zhōngwén"}
            </span>
          </button>
        </div>

        {/* Hàng các nút phụ trợ: Tiếng kêu, Đổi hoạt ảnh, Chụp ảnh */}
        <div className="flex items-center justify-center gap-3 w-full max-w-md pt-1">
          {/* Nút Tiếng kêu con vật */}
          <button
            type="button"
            onClick={handleAnimalSound}
            className={`flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-2xl px-3 text-xs font-bold border transition-all active:scale-95 shadow-md ${
              isPlayingSound
                ? "bg-amber-400 text-stone-950 border-amber-300"
                : "bg-stone-900/80 text-amber-300 border-amber-500/40 hover:bg-stone-800"
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>Tiếng Kêu</span>
          </button>

          {/* Nút Đổi hoạt ảnh (nếu có) */}
          {animal.animations && animal.animations.length > 1 && (
            <button
              type="button"
              onClick={handleToggleAnimation}
              className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-stone-900/80 px-3 text-xs font-bold text-sky-300 border border-sky-500/40 hover:bg-stone-800 transition-all active:scale-95 shadow-md"
            >
              <Play className="h-4 w-4" />
              <span>Động Tác ({currentAnimIndex + 1})</span>
            </button>
          )}

          {/* Nút Chụp ảnh kỷ niệm AR */}
          <button
            type="button"
            onClick={handleCapturePhoto}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 font-black shadow-lg shadow-amber-500/30 active:scale-90 transition-transform"
            title="Chụp ảnh cùng con vật"
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 7. Modal Xem và Tải Ảnh Đã Chụp */}
      {capturedPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative max-w-md w-full rounded-3xl bg-stone-900 border-2 border-amber-400/60 p-4 shadow-2xl flex flex-col items-center">
            <button
              type="button"
              onClick={() => setCapturedPhotoUrl(null)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-3">
              <Sparkles className="h-4 w-4" />
              <span>Ảnh Chụp AR Poly Cards</span>
            </div>

            {/* Khung hiển thị ảnh chụp */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/20 bg-black aspect-3/4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedPhotoUrl}
                alt={`Ảnh AR ${animal.nameEn}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Các hành động với ảnh */}
            <div className="mt-4 flex items-center gap-3 w-full">
              <a
                href={capturedPhotoUrl}
                download={`polycards-${animal.slug}-ar.jpg`}
                className="flex flex-1 min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white active:scale-95 transition-transform shadow-lg shadow-emerald-600/30"
              >
                <Download className="h-4 w-4" />
                <span>Tải Ảnh Về Máy</span>
              </a>
              <button
                type="button"
                onClick={() => setCapturedPhotoUrl(null)}
                className="min-h-[46px] px-5 rounded-2xl bg-white/10 text-sm font-bold text-white border border-white/20 active:scale-95 transition-transform"
              >
                Chụp Tiếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Hướng Dẫn Quét Thẻ Bài AR */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-sm w-full rounded-3xl bg-stone-900 border-2 border-amber-300/60 p-5 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-base font-black">Hướng Dẫn Quét AR Thẻ Bài</h3>
            </div>

            <div className="mt-3 space-y-3 text-xs leading-relaxed text-stone-300">
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  1
                </span>
                <span>
                  Đặt tấm thẻ bài <strong>{animal.nameVi}</strong> ở nơi có đủ ánh sáng, trên mặt phẳng bàn.
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  2
                </span>
                <span>
                  Đưa camera điện thoại hướng vào hình con vật trong khung ngắm. Chú {animal.nameVi} 3D sẽ xuất hiện ngay trên thẻ!
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  3
                </span>
                <span>
                  Chạm vào các nút <strong>EN</strong>, <strong>VI</strong>, <strong>ZH</strong> để nghe phát âm chuẩn và con vật cử động theo camera.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full min-h-[44px] rounded-2xl bg-amber-500 text-sm font-black text-stone-950 active:scale-95 transition-transform"
            >
              Đã Hiểu, Bắt Đầu Quét
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
