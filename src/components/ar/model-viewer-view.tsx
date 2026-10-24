"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Animal } from "@/types/animal";
import {
  Sparkles,
  Box,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  HelpCircle,
  X,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface ModelViewerViewProps {
  animal: Animal;
  selectedAnimation?: string;
}

export function ModelViewerView({
  animal,
  selectedAnimation,
}: ModelViewerViewProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showArGuide, setShowArGuide] = useState(false);
  const [arModePreference, setArModePreference] = useState<"scene-viewer" | "webxr">("scene-viewer");
  const modelViewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== "undefined") {
      setIsAndroid(/android/i.test(navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    if (showArGuide) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showArGuide]);

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
        setShowArGuide(true);
      } else if (customEvent.detail.status === "session-started") {
        setArSupported(true);
      }
    };

    const handleModelLoad = () => {
      const v = viewer as any;
      const available: string[] = v.availableAnimations || [];
      if (available.length > 0) {
        if (selectedAnimation && available.includes(selectedAnimation)) {
          v.animationName = selectedAnimation;
        } else {
          v.animationName = available[0];
        }
        if (typeof v.play === "function") {
          v.play();
        }
      }
    };

    const handleError = () => {
      setLoadError(true);
    };

    viewer.addEventListener("ar-status", handleArStatus);
    viewer.addEventListener("error", handleError);
    viewer.addEventListener("load", handleModelLoad);

    return () => {
      viewer.removeEventListener("ar-status", handleArStatus);
      viewer.removeEventListener("error", handleError);
      viewer.removeEventListener("load", handleModelLoad);
    };
  }, [isLoaded, selectedAnimation]);

  useEffect(() => {
    const viewer = modelViewerRef.current as any;
    if (!viewer) return;
    const available: string[] = viewer.availableAnimations || [];
    if (available.length > 0) {
      if (selectedAnimation && available.includes(selectedAnimation)) {
        viewer.animationName = selectedAnimation;
        if (typeof viewer.play === "function") viewer.play();
      } else if (available.length > 0) {
        viewer.animationName = available[0];
        if (typeof viewer.play === "function") viewer.play();
      }
    }
  }, [selectedAnimation]);

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
            ar-modes={
              arModePreference === "webxr"
                ? "webxr scene-viewer quick-look"
                : "scene-viewer webxr quick-look"
            }
            ar-scale="auto"
            ar-placement="floor"
            bounds="tight"
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

        {/* Top Floating Control Bar - Responsive & Non-overlapping on narrow Android/iPhone screens */}
        <div className="absolute top-3.5 inset-x-3.5 z-10 flex items-center justify-between gap-2 pointer-events-none">
          {/* Hint Chip for Touch Interaction */}
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-stone-900/85 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md shadow-xs shrink min-w-0">
            <Sparkles className="h-3 w-3 shrink-0 text-amber-400" />
            <span className="hidden sm:inline truncate">Dùng ngón tay xoay 360° & Phóng to</span>
            <span className="sm:hidden truncate">Xoay 360° & Zoom</span>
          </div>

          {/* Camera Reset Button */}
          {isLoaded && !loadError && (
            <button
              type="button"
              onClick={handleResetCamera}
              className="pointer-events-auto shrink-0 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-stone-700 shadow-md border border-amber-200 hover:bg-white active:scale-95 transition-all"
              title="Đặt lại góc nhìn xoay 360"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
              <span className="hidden sm:inline">Góc Nhìn Gốc</span>
              <span className="sm:hidden">Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Action Button & Android AR Helper Bar */}
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

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleLaunchAr}
            className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-95 cursor-pointer"
          >
            <Box className="h-5 w-5" />
            <span>Đưa {animal.nameEn} Vào Không Gian Thật</span>
          </button>

          {isAndroid && (
            <button
              type="button"
              onClick={() => setShowArGuide(true)}
              className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs font-bold text-amber-900 transition-all hover:bg-amber-100 active:scale-95 cursor-pointer"
              title="Hướng dẫn kích hoạt AR cho điện thoại Android"
            >
              <HelpCircle className="h-4 w-4 text-amber-600" />
              <span>Trợ Giúp AR</span>
            </button>
          )}
        </div>
      </div>

      {/* Fallback Notice when AR encounters issues */}
      {arSupported === false && (
        <div className="bg-amber-50 px-4 py-3 text-center text-xs text-amber-800 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Thiết bị của bạn chưa khởi chạy được camera AR? Đừng lo, bé vẫn có thể tương tác 3D 360° trực tiếp trên màn hình này!
          </span>
          <button
            type="button"
            onClick={() => setShowArGuide(true)}
            className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 active:scale-95 cursor-pointer transition-all shrink-0"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Xem Hướng Dẫn Kích Hoạt</span>
          </button>
        </div>
      )}

      {/* Portal Modal Hướng Dẫn & Trợ Giúp AR Cho Android (Gắn trực tiếp vào document.body tránh bị che khuất) */}
      {mounted && showArGuide && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-stone-950/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowArGuide(false);
              }}
            >
              <div
                className="relative w-full max-w-lg rounded-t-[32px] sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200/80 max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-6 duration-300"
                role="dialog"
                aria-modal="true"
              >
                {/* Mobile Bottom Sheet Grab Handle */}
                <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-3 shrink-0" />

                {/* Header cố định */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-3 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-stone-900 leading-tight">
                        Hướng Dẫn Camera AR Trên Android
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Khắc phục khi camera không mở hoặc ứng dụng Google bị dừng
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowArGuide(false)}
                    className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                    title="Đóng cửa sổ"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Nội dung các bước (Cuộn độc lập mượt mà) */}
                <div className="mt-3.5 flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs text-stone-700">
                  {/* Bước 1: Cài đặt Dịch vụ Google Play cho AR */}
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Bước 1: Cài ứng dụng "Dịch vụ Google Play cho AR"</span>
                    </div>
                    <p className="mt-1 text-emerald-800 text-[11px] leading-relaxed">
                      Để đặt được con vật lên sàn nhà, hệ điều hành Android yêu cầu gói cảm biến <b>ARCore</b> chính thức từ Google.
                    </p>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.google.ar.core"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Cài đặt trên CH Play (Google Play)</span>
                    </a>
                  </div>

                  {/* Bước 2: Sửa lỗi Google tiếp tục dừng */}
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3.5">
                    <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Bước 2: Nếu bị báo "Google tiếp tục dừng"</span>
                    </div>
                    <p className="mt-1 text-amber-900 text-[11px] leading-relaxed">
                      Ứng dụng Google trên máy bị đầy bộ nhớ đệm: Vào <b>Cài đặt điện thoại &gt; Ứng dụng &gt; Google &gt; Lưu trữ &gt; Xóa bộ nhớ đệm (Clear cache)</b> và đảm bảo đã bật quyền <b>Máy ảnh (Camera)</b>.
                    </p>
                  </div>

                  {/* Bước 3: Đổi chế độ AR Trình duyệt */}
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                        <Layers className="h-4 w-4 text-teal-600 shrink-0" />
                        <span>Bước 3: Đổi chế độ khởi chạy AR</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
                        {arModePreference === "scene-viewer" ? "Google App" : "Trình duyệt WebXR"}
                      </span>
                    </div>
                    <p className="mt-1 text-stone-600 text-[11px]">
                      Nếu Google Scene Viewer bị đóng đột ngột, bạn có thể chuyển sang chế độ <b>WebXR</b> chạy trực tiếp trong Chrome (không qua ứng dụng Google ngoài):
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setArModePreference((prev) =>
                          prev === "scene-viewer" ? "webxr" : "scene-viewer"
                        )
                      }
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-stone-600" />
                      <span>
                        Chuyển sang: {arModePreference === "scene-viewer" ? "Trình duyệt WebXR" : "Google Scene Viewer"}
                      </span>
                    </button>
                  </div>

                  {/* Lựa chọn không cần cài app */}
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-3.5 text-sky-950">
                    <p className="font-bold text-sm">Không muốn cài đặt thêm ứng dụng?</p>
                    <p className="mt-1 text-[11px] text-sky-800 leading-relaxed">
                      Bé hoàn toàn có thể <b>tương tác 3D 360°</b>, thu phóng cử động con vật và nghe phát âm 3 ngôn ngữ (Anh - Việt - Trung) ngay trên màn hình này mà <b>không cần cài thêm bất kỳ ứng dụng nào</b>!
                    </p>
                  </div>
                </div>

                {/* Footer cố định */}
                <div className="mt-4 border-t border-stone-100 pt-3 flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowArGuide(false)}
                    className="w-full sm:w-auto rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-stone-800 active:scale-95 transition-colors cursor-pointer"
                  >
                    Đã Hiểu & Đóng
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
