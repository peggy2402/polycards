"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Animal } from "@/types/animal";
import { Sparkles, Box, RefreshCw, AlertCircle, RotateCcw } from "lucide-react";

interface ModelViewerViewProps {
  animal: Animal;
  selectedAnimation?: string;
}

export function ModelViewerView({
  animal,
  selectedAnimation,
}: ModelViewerViewProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const modelViewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Dynamic import Web Component @google/model-viewer on client
    import("@google/model-viewer")
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Error loading model-viewer component:", err);
        setLoadError(true);
      });
  }, []);

  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleArStatus = (event: Event) => {
      const customEvent = event as CustomEvent<{ status: string }>;
      if (customEvent.detail.status === "failed") {
        setArSupported(false);
      }
    };

    const handleError = () => {
      setLoadError(true);
    };

    viewer.addEventListener("ar-status", handleArStatus);
    viewer.addEventListener("error", handleError);

    return () => {
      viewer.removeEventListener("ar-status", handleArStatus);
      viewer.removeEventListener("error", handleError);
    };
  }, [isLoaded]);

  const handleLaunchAr = () => {
    const viewer = modelViewerRef.current as any;
    if (viewer && typeof viewer.activateAR === "function") {
      viewer.activateAR();
    }
  };

  const handleResetCamera = () => {
    const viewer = modelViewerRef.current as any;
    if (viewer && typeof viewer.resetTurntable === "function") {
      viewer.resetTurntable();
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border-2 border-amber-200/90 bg-gradient-to-tr from-sky-50 via-amber-50/50 to-emerald-50/60 shadow-xl shadow-amber-900/5 backdrop-blur-md">
      {/* 3D Model Viewer Container */}
      <div className="relative aspect-square sm:aspect-4/3 w-full flex items-center justify-center p-4">
        {loadError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              Không thể tải mô hình 3D
            </h3>
            <p className="text-xs text-stone-600 max-w-xs">
              Đang hiển thị ảnh minh họa 3D chất lượng cao của {animal.nameVi}.
            </p>
            <div className="relative h-48 w-48 rounded-2xl overflow-hidden shadow-md">
              <Image
                src={animal.images[0] || "/images/animals/lion.jpg"}
                alt={animal.nameVi}
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setLoadError(false);
                setIsLoaded(false);
                import("@google/model-viewer").then(() => setIsLoaded(true));
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Thử Tải Lại</span>
            </button>
          </div>
        ) : isLoaded ? (
          <model-viewer
            ref={modelViewerRef as any}
            src={animal.modelUrl}
            ios-src={animal.iosModelUrl}
            poster={animal.posterUrl}
            alt={`Mô hình 3D AR ${animal.nameEn}`}
            ar={true}
            ar-modes="webxr scene-viewer quick-look"
            camera-controls={true}
            auto-rotate={true}
            auto-rotate-delay="3000"
            rotation-per-second="20deg"
            shadow-intensity="1.2"
            shadow-softness="0.8"
            exposure="1.0"
            animation-name={selectedAnimation || undefined}
            autoplay={Boolean(selectedAnimation)}
            loading="eager"
            reveal="auto"
            touch-action="pan-y"
            className="w-full h-full min-h-[320px] sm:min-h-[420px]"
          >
            {/* Custom AR Slot button inside model-viewer for compatibility */}
            <button
              slot="ar-button"
              className="hidden"
              id="model-viewer-ar-button"
            >
              Kích hoạt AR
            </button>
          </model-viewer>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 space-y-3">
            <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-stone-600">
              Đang khởi tạo không gian 3D tương tác...
            </p>
          </div>
        )}

        {/* Camera Reset Button */}
        {isLoaded && !loadError && (
          <button
            type="button"
            onClick={handleResetCamera}
            className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-stone-700 shadow-md border border-amber-200 hover:bg-white active:scale-95 transition-all"
            title="Đặt lại góc nhìn xoay 360"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
            <span>Góc Nhìn Gốc</span>
          </button>
        )}

        {/* Hint Chip for Touch Interaction */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-stone-900/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-xs">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Dùng ngón tay xoay 360° & Phóng to</span>
        </div>
      </div>

      {/* Primary Action Button: Launch AR (WebXR / Quick Look) */}
      <div className="border-t border-amber-100 bg-white/90 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-sm font-extrabold text-stone-900">
              Chế Độ Thực Tế Tăng Cường (AR)
            </span>
            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              Live
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            Đưa {animal.nameEn} ({animal.nameVi}) chuyển động ngay trên sàn nhà hoặc bàn học của bé.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLaunchAr}
          className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-95"
        >
          <Box className="h-5 w-5" />
          <span>Đưa {animal.nameEn} Vào Không Gian Thật</span>
        </button>
      </div>

      {/* Fallback Notice when AR is not hardware supported */}
      {arSupported === false && (
        <div className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 border-t border-amber-200">
          Thiết bị này chưa hỗ trợ cảm biến AR chuyên dụng. Bạn vẫn có thể xoay ngắm mô hình 3D 360 độ và nghe âm thanh đầy đủ ở trên!
        </div>
      )}
    </div>
  );
}
