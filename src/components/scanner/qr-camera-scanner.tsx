"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { parseAndValidateQr, QrParseResult } from "@/lib/qr-parser";
import { getMergedProducts } from "@/lib/products-store";
import { getAllAnimals, SYSTEM_POLYCARDS_ANIMAL } from "@/lib/animals";
import { Animal } from "@/types/animal";
import {
  ArrowLeft,
  Zap,
  ZapOff,
  RefreshCw,
  CheckCircle2,
  UploadCloud,
  Sparkles,
  Camera,
  Layers,
  SwitchCamera,
  HelpCircle,
  ZoomIn,
  Flame,
  Activity,
  Smile,
  Check,
} from "lucide-react";

interface QrCameraScannerProps {
  expectedAnimal?: Animal;
  onOpenGuide: () => void;
}

// Hàm phát âm thanh Beep nhẹ nhàng khi quét trúng thẻ (Native Web Audio, zero external mp3)
function playBeepSuccess() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {}
}

// Component Thẻ Mẫu Ảo với Safe Avatar (Không bao giờ vỡ ảnh)
function VirtualCardBadge({
  item,
  onClick,
}: {
  item: Animal;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const isSystemHero = item.slug === "polycards" || item.slug === "butterfly";

  // Lấy ảnh ưu tiên, nếu là dạng /api/tools/upload có thể lỗi thì fallback an toàn
  const rawImage = item.images?.[0] || item.posterUrl;
  const isApiUpload = typeof rawImage === "string" && rawImage.startsWith("/api/tools/upload");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
        isSystemHero
          ? "border-amber-400/80 bg-gradient-to-r from-amber-500/25 to-yellow-500/20 text-amber-200 hover:bg-amber-500/35 ring-1 ring-amber-400/40 shadow-sm"
          : "border-white/15 bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
      }`}
    >
      <div className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-300/80 bg-stone-800 text-[10px] font-black text-amber-400">
        {!imgError && rawImage && !isApiUpload ? (
          // Dùng thẻ img native kèm onError để tránh hoàn toàn Next Image Optimization 400
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rawImage}
            alt={item.nameVi || item.nameEn}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : isSystemHero ? (
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" />
        ) : item.categorySlug === "hanh-dong" ? (
          <Activity className="h-3.5 w-3.5 text-sky-400" />
        ) : (
          <span>{item.nameEn.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className="flex flex-col text-left leading-none">
        <span className="font-extrabold flex items-center gap-1">
          {item.nameEn}
          {isSystemHero && (
            <span className="rounded bg-amber-400 px-1 py-0.2 text-[8px] font-black text-stone-950">
              HOT
            </span>
          )}
        </span>
        <span className="text-[9px] text-stone-400 font-medium mt-0.5 truncate max-w-[80px]">
          {item.nameVi}
        </span>
      </div>
    </button>
  );
}

export function QrCameraScanner({
  expectedAnimal,
  onOpenGuide,
}: QrCameraScannerProps) {
  const router = useRouter();

  // Danh sách sản phẩm
  const [animals, setAnimals] = useState<Animal[]>(() => {
    const merged = getMergedProducts();
    const base = merged.length > 0 ? merged : getAllAnimals();
    return [SYSTEM_POLYCARDS_ANIMAL, ...base.filter((a) => a.slug !== "polycards")];
  });

  // Giữ reference tới animals để tránh re-bind camera listener gây MaxListenersExceededWarning
  const animalsRef = useRef<Animal[]>(animals);
  useEffect(() => {
    animalsRef.current = animals;
  }, [animals]);

  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomAvailable, setZoomAvailable] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(1);
  const [scanStatus, setScanStatus] = useState<"scanning" | "success" | "warning">("scanning");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [detectedAnimal, setDetectedAnimal] = useState<Animal | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isNavigatingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerContainerId = "qr-reader-container";

  // Đồng bộ sản phẩm từ DB một lần duy nhất
  useEffect(() => {
    let isCancelled = false;
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isCancelled && json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const merged = getMergedProducts(json.data);
          const fullList = [
            SYSTEM_POLYCARDS_ANIMAL,
            ...merged.filter((a) => a.slug !== "polycards"),
          ];
          setAnimals(fullList);
        }
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, []);

  // Hàm dừng Camera an toàn, không rò rỉ listener
  const safeStopScanner = useCallback(async (inst: Html5Qrcode | null) => {
    if (!inst) return;
    try {
      if (inst.isScanning) {
        await inst.stop();
      }
    } catch {}
    try {
      inst.clear();
    } catch {}
  }, []);

  // Xử lý mã QR khi được giải mã
  const handleQrDecoded = useCallback(
    async (decodedText: string) => {
      if (isNavigatingRef.current) return;

      const parseResult: QrParseResult = parseAndValidateQr(
        decodedText,
        expectedAnimal ? expectedAnimal.slug : null
      );

      if (parseResult.valid && parseResult.slug) {
        isNavigatingRef.current = true;
        setScanStatus("success");
        setFeedbackMessage(`Đã nhận diện: ${parseResult.animalNameEn || parseResult.slug}!`);

        // Tìm con vật trong list hiện tại
        const found = animalsRef.current.find(
          (a) => a.slug.toLowerCase() === parseResult.slug?.toLowerCase()
        );
        if (found) {
          setDetectedAnimal(found);
        }

        // Âm thanh và rung phản hồi
        playBeepSuccess();
        try {
          navigator.vibrate?.([80, 50, 80]);
        } catch {}

        // Dừng camera sạch sẽ trước khi chuyển trang
        if (scannerRef.current) {
          try {
            const stream = (scannerRef.current as any).localMediaStream as MediaStream | undefined;
            if (stream) {
              stream.getTracks().forEach((t) => t.stop());
            }
            await safeStopScanner(scannerRef.current);
          } catch {}
        }

        setTimeout(() => {
          const query = parseResult.code
            ? `?ar=1&code=${encodeURIComponent(parseResult.code)}`
            : `?ar=1`;
          router.push(`/ar/${parseResult.slug}${query}`);
        }, 500);
      } else if (parseResult.isMismatched) {
        setScanStatus("warning");
        setFeedbackMessage(parseResult.errorMessage || "Mã QR không khớp với thẻ bài đang yêu cầu.");
        try {
          navigator.vibrate?.([50, 50, 50]);
        } catch {}

        setTimeout(() => {
          setScanStatus("scanning");
          setFeedbackMessage(null);
        }, 3000);
      } else {
        setScanStatus("warning");
        setFeedbackMessage(parseResult.errorMessage || "Mã QR không thuộc hệ sinh thái Poly Cards.");
        setTimeout(() => {
          setScanStatus("scanning");
          setFeedbackMessage(null);
        }, 3000);
      }
    },
    [expectedAnimal, router, safeStopScanner]
  );

  // Giữ ref tới callback để useEffect của camera không bị re-trigger liên tục
  const handleQrDecodedRef = useRef(handleQrDecoded);
  useEffect(() => {
    handleQrDecodedRef.current = handleQrDecoded;
  }, [handleQrDecoded]);

  // Khởi động Camera chỉ khi cameraFacingMode thay đổi hoặc khi mount
  useEffect(() => {
    let isMounted = true;
    let scannerInstance: Html5Qrcode | null = null;

    try {
      scannerInstance = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scannerInstance;
    } catch {
      return;
    }

    const startCamera = async () => {
      if (!scannerInstance) return;
      try {
        setCameraError(null);
        await scannerInstance.start(
          { facingMode: cameraFacingMode },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minDim = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(minDim * 0.72);
              return {
                width: Math.max(220, Math.min(size, 340)),
                height: Math.max(220, Math.min(size, 340)),
              };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isMounted) return;
            handleQrDecodedRef.current(decodedText);
          },
          () => {}
        );

        if (!isMounted) {
          safeStopScanner(scannerInstance);
          return;
        }

        // Kiểm tra khả năng Đèn Flash & Zoom của Camera
        try {
          const stream = (scannerInstance as any).localMediaStream as MediaStream | undefined;
          if (stream) {
            const track = stream.getVideoTracks()[0];
            const capabilities = (track as any).getCapabilities?.();

            if (capabilities) {
              if ("torch" in capabilities) {
                setTorchAvailable(true);
              } else {
                setTorchAvailable(false);
              }

              if ("zoom" in capabilities) {
                setZoomAvailable(true);
                setMaxZoom(Math.min(capabilities.zoom.max || 3, 3));
                setCurrentZoom(capabilities.zoom.min || 1);
              } else {
                setZoomAvailable(false);
              }
            }
          }
        } catch {
          setTorchAvailable(false);
          setZoomAvailable(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn("Camera start message:", err);
        if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
          setCameraError(
            "Trình duyệt chưa được cấp quyền Camera. Hãy bấm vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ để cho phép quyền camera."
          );
        } else if (err.name === "NotFoundError" || err.message?.includes("NotFound")) {
          setCameraError(
            "Không tìm thấy camera trên thiết bị. Bạn có thể bấm nút Tải Ảnh QR hoặc thử thẻ mẫu bên dưới."
          );
        } else {
          setCameraError(
            "Không thể kích hoạt camera tự động. Bạn có thể bấm nút Tải Ảnh QR từ album hoặc bấm thử các thẻ mẫu AR bên dưới."
          );
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (scannerInstance) {
        safeStopScanner(scannerInstance);
      }
    };
  }, [cameraFacingMode, safeStopScanner]);

  // Đổi Camera Trước / Sau
  const handleSwitchCamera = async () => {
    if (scannerRef.current) {
      await safeStopScanner(scannerRef.current);
    }
    setCameraFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Bật/tắt đèn Flash
  const toggleTorch = async () => {
    try {
      const stream = (scannerRef.current as any)?.localMediaStream as MediaStream | undefined;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setTorchOn(nextState);
      }
    } catch (e) {
      console.warn("Could not toggle flashlight:", e);
    }
  };

  // Zoom Camera (1x / 2x)
  const toggleZoom = async () => {
    try {
      const stream = (scannerRef.current as any)?.localMediaStream as MediaStream | undefined;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        const nextZoom = currentZoom === 1 ? Math.min(2, maxZoom) : 1;
        await track.applyConstraints({
          advanced: [{ zoom: nextZoom } as any],
        });
        setCurrentZoom(nextZoom);
      }
    } catch (e) {
      console.warn("Could not toggle zoom:", e);
    }
  };

  // Quét nhanh từ thẻ mẫu ảo (Virtual Demo Cards)
  const handleQuickDemoSelect = (animal: Animal) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    setScanStatus("success");
    setDetectedAnimal(animal);
    setFeedbackMessage(`Đã chọn thẻ mẫu: ${animal.nameEn} (${animal.nameVi})!`);

    playBeepSuccess();
    try {
      navigator.vibrate?.(100);
    } catch {}

    if (scannerRef.current) {
      safeStopScanner(scannerRef.current);
    }

    setTimeout(() => {
      router.push(`/ar/${animal.slug}?ar=1`);
    }, 450);
  };

  // Quét mã QR từ file ảnh người dùng tải lên
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    try {
      setIsProcessingFile(true);
      const decodedResult = await scannerRef.current.scanFile(file, true);
      handleQrDecoded(decodedResult);
    } catch {
      setScanStatus("warning");
      setFeedbackMessage("Không tìm thấy mã QR hợp lệ trong ảnh này. Vui lòng thử ảnh rõ nét hơn!");
      setTimeout(() => {
        setScanStatus("scanning");
        setFeedbackMessage(null);
      }, 3000);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col justify-between bg-stone-950 text-white overflow-hidden select-none">
      {/* Input File Ẩn cho Upload Ảnh QR */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="qr-file-upload-input"
      />

      {/* 1. THANH ĐIỀU KHIỂN NỔI PHÍA TRÊN (TOP CONTROLS) */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3.5 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        <Link
          href="/"
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-2 text-xs font-black text-white backdrop-blur-md hover:bg-white/30 active:scale-95 transition-all shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Trang Chủ</span>
        </Link>

        {expectedAnimal ? (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3.5 py-1.5 text-xs font-black text-white backdrop-blur-md shadow-md border border-emerald-400/40">
            <span className="h-2 w-2 rounded-full bg-amber-300 animate-ping" />
            <span className="truncate max-w-[140px] sm:max-w-none">
              Mục tiêu: {expectedAnimal.nameEn}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-stone-900/80 px-3.5 py-1.5 text-xs font-black text-amber-300 backdrop-blur-md border border-white/10 shadow-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Camera WebAR Live</span>
          </div>
        )}

        {/* Các Nút Tiện Ích: Đổi Camera, Flash, Zoom, Tải Ảnh, Hướng Dẫn */}
        <div className="flex items-center gap-1.5">
          {/* Nút Zoom (nếu thiết bị hỗ trợ) */}
          {zoomAvailable && (
            <button
              type="button"
              onClick={toggleZoom}
              className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full p-2 backdrop-blur-md text-xs font-black transition-all active:scale-90 ${
                currentZoom > 1
                  ? "bg-emerald-500 text-stone-950 shadow-md"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              title="Thu phóng 1x / 2x"
            >
              <span>{currentZoom}x</span>
            </button>
          )}

          {/* Nút Đổi Camera Trước/Sau */}
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-white/20 p-2 backdrop-blur-md text-white hover:bg-white/30 active:scale-90 transition-all cursor-pointer"
            title="Đổi camera trước / sau"
          >
            <SwitchCamera className="h-4.5 w-4.5" />
          </button>

          {/* Nút Flashlight (nếu hỗ trợ) */}
          {torchAvailable && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full p-2 backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                torchOn
                  ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/40"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              title={torchOn ? "Tắt đèn flash" : "Bật đèn flash"}
            >
              {torchOn ? <Zap className="h-4.5 w-4.5" /> : <ZapOff className="h-4.5 w-4.5" />}
            </button>
          )}

          {/* Nút Tải Ảnh QR */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-white/20 p-2 backdrop-blur-md text-white hover:bg-white/30 active:scale-90 transition-all cursor-pointer"
            title="Tải ảnh QR từ album máy"
          >
            <UploadCloud className="h-4.5 w-4.5" />
          </button>

          {/* Nút Mở Hướng Dẫn */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-amber-500/80 p-2 backdrop-blur-md text-stone-950 font-black hover:bg-amber-400 active:scale-90 transition-all shadow-md cursor-pointer"
            title="Xem hướng dẫn quét thẻ an toàn"
          >
            <HelpCircle className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* 2. KHU VỰC CAMERA VIEWPORT */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="m-4 max-w-sm rounded-3xl border border-stone-800 bg-stone-900/95 p-6 text-center shadow-2xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Camera className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-white">Chưa Bật Được Camera</h3>
            <p className="text-xs text-stone-300 leading-relaxed">{cameraError}</p>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-toy-3d inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-500 active:scale-95 cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Tải Ảnh Mã QR Từ Máy</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-stone-800 px-4 py-2 text-xs font-bold text-stone-300 hover:bg-stone-700 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Thử Cấp Quyền Lại</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* HTML5 QR Video Container */}
            <div
              id={scannerContainerId}
              className="h-full w-full object-cover"
              style={{
                width: "100%",
                height: "100%",
              }}
            />

            {/* Glowing AR Reticle HUD Overlay (Khung Ngắm Laser Quét Siêu Đẹp) */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div
                className={`relative aspect-square w-64 max-w-[70vw] rounded-3xl border-2 transition-all duration-300 ${
                  scanStatus === "success"
                    ? "border-emerald-400 shadow-[0_0_50px_rgba(52,211,153,0.8)] scale-105"
                    : scanStatus === "warning"
                    ? "border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.6)]"
                    : "border-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.35)]"
                }`}
              >
                {/* 4 Góc Marker AR Định Vị */}
                <div className="absolute -top-1.5 -left-1.5 h-7 w-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                <div className="absolute -top-1.5 -right-1.5 h-7 w-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                <div className="absolute -bottom-1.5 -left-1.5 h-7 w-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                <div className="absolute -bottom-1.5 -right-1.5 h-7 w-7 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />

                {/* Laser Scanning Beam Di Chuyển Nhịp Nhàng */}
                <div
                  className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
                  style={{
                    animation: "cameraScanBeam 2s ease-in-out infinite alternate",
                  }}
                />

                {/* Dòng Chữ Hướng Dẫn Trong Khung */}
                <div className="absolute -bottom-10 inset-x-0 text-center">
                  <span className="inline-block rounded-full bg-black/75 px-3.5 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur-md border border-white/10 shadow-sm">
                    Đặt mã QR thẻ bài vào khung
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Thông Báo Đã Khóa Mục Tiêu AR Thành Công */}
            {scanStatus === "success" && detectedAnimal && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-40 mx-auto max-w-sm rounded-3xl border-2 border-emerald-300 bg-stone-900/95 p-5 text-center shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-md mb-3 border border-emerald-400/40">
                  <Sparkles className="h-8 w-8 animate-pulse text-amber-300" />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-400 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>ĐÃ KHÓA MỤC TIÊU 3D</span>
                </div>
                <h3 className="text-2xl font-black text-white">{detectedAnimal.nameEn}</h3>
                <p className="text-xs font-bold text-amber-300 mt-1">
                  {detectedAnimal.nameVi} • Đang khởi tạo thế giới WebAR...
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. KHU VỰC ĐÁY: PHẢN HỒI & KHAY THẺ BÀI MẪU ẢO */}
      <div className="relative z-30 p-3.5 sm:p-5 bg-gradient-to-t from-black via-black/90 to-transparent space-y-2.5">
        {/* Tin nhắn trạng thái / Cảnh báo */}
        {scanStatus === "warning" ? (
          <div className="mx-auto max-w-sm rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-black text-stone-950 shadow-lg text-center animate-in zoom-in-95 duration-150">
            {feedbackMessage}
          </div>
        ) : isProcessingFile ? (
          <div className="mx-auto max-w-sm rounded-2xl bg-sky-600 px-4 py-2 text-xs font-black text-white shadow-lg text-center animate-pulse">
            Đang phân tích hình ảnh mã QR...
          </div>
        ) : null}

        {/* Khay Thẻ Bài Mẫu Ảo (Thử Ngay Không Cần Thẻ Giấy) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-300 px-1">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>Chưa có thẻ giấy? Bấm thử thẻ mẫu ảo:</span>
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-black cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Tải ảnh QR</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {animals.slice(0, 14).map((item) => (
              <VirtualCardBadge
                key={item.id || item.slug}
                item={item}
                onClick={() => handleQuickDemoSelect(item)}
              />
            ))}
          </div>
        </div>

        <div className="text-center text-[10px] text-stone-400 font-medium">
          Poly Cards WebXR • Hỗ trợ Android WebAR &amp; Apple iOS Quick Look
        </div>
      </div>

      {/* Animation keyframes cho Laser Beam */}
      <style jsx>{`
        @keyframes cameraScanBeam {
          0% {
            top: 5%;
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 92%;
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
