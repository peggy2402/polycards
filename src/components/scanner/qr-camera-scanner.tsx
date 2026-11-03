"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { parseAndValidateQr, QrParseResult } from "@/lib/qr-parser";
import { Animal } from "@/types/animal";
import { getMobileOperatingSystem } from "@/lib/user-agent";
import {
  ArrowLeft,
  Zap,
  ZapOff,
  RefreshCw,
  CheckCircle2,
  UploadCloud,
  Sparkles,
  Camera,
  SwitchCamera,
  HelpCircle,
  MoreVertical,
  Sliders,
  AlertCircle,
  X,
} from "lucide-react";

interface QrCameraScannerProps {
  expectedAnimal?: Animal;
  onOpenGuide: () => void;
  allowMismatchContinue?: boolean;
}

type CameraErrorCode =
  | "permission-denied"
  | "not-found"
  | "in-use"
  | "insecure-context"
  | "unsupported"
  | "overconstrained"
  | "unknown";

interface NormalizedCameraError {
  code: CameraErrorCode;
  message: string;
  guide: string;
}

// Hàm chuẩn hóa lỗi Camera từ chuỗi, Error, hoặc DOMException
function normalizeCameraError(err: unknown): NormalizedCameraError {
  const os = getMobileOperatingSystem();
  let rawMsg = "";

  if (typeof err === "string") {
    rawMsg = err;
  } else if (err instanceof Error) {
    rawMsg = `${err.name} ${err.message}`;
  } else if (typeof err === "object" && err !== null) {
    rawMsg = String((err as any).message || (err as any).name || "");
  }

  const lower = rawMsg.toLowerCase();

  if (
    lower.includes("notallowederror") ||
    lower.includes("permission") ||
    lower.includes("denied")
  ) {
    return {
      code: "permission-denied",
      message: "Chưa cấp quyền truy cập Camera",
      guide:
        os === "ios"
          ? "Mở Cài đặt iPhone > Safari > Camera > Chọn 'Cho phép', sau đó bấm 'Thử lại'."
          : "Bấm vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ Chrome > Quyền > Bật Camera, sau đó bấm 'Thử lại'.",
    };
  }

  if (
    lower.includes("notfounderror") ||
    lower.includes("devicesnotfound") ||
    lower.includes("no camera")
  ) {
    return {
      code: "not-found",
      message: "Không tìm thấy thiết bị camera",
      guide: "Thiết bị không có camera khả dụng. Bạn có thể bấm 'Tải Ảnh Mã QR' để quét từ album ảnh.",
    };
  }

  if (
    lower.includes("notreadableerror") ||
    lower.includes("trackstarterror") ||
    lower.includes("in use") ||
    lower.includes("busy")
  ) {
    return {
      code: "in-use",
      message: "Camera đang bị ứng dụng khác sử dụng",
      guide: "Vui lòng đóng các ứng dụng đang dùng camera (Zalo, Messenger, v.v.) rồi bấm 'Thử lại'.",
    };
  }

  if (typeof window !== "undefined" && !window.isSecureContext) {
    return {
      code: "insecure-context",
      message: "Kết nối chưa an toàn (cần HTTPS)",
      guide: "Trình duyệt chỉ cho phép bật Camera trên địa chỉ bảo mật HTTPS hoặc localhost.",
    };
  }

  if (lower.includes("overconstrainederror") || lower.includes("constraint")) {
    return {
      code: "overconstrained",
      message: "Thông số camera không tương thích",
      guide: "Hệ thống đang chuyển sang chế độ camera tương thích cơ bản.",
    };
  }

  return {
    code: "unknown",
    message: "Chưa thể khởi động Camera",
    guide: "Vui lòng kiểm tra lại quyền camera hoặc sử dụng nút 'Tải Ảnh Mã QR' bên dưới.",
  };
}

// AudioContext Singleton mở khóa âm thanh cho cả Safari iOS & Android
let globalAudioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      globalAudioCtx = new AudioCtxClass();
    }
  }
  return globalAudioCtx;
}

function unlockAudioContext() {
  if (isAudioUnlocked) return;
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().then(() => {
      isAudioUnlocked = true;
    }).catch(() => {});
  } else if (ctx) {
    isAudioUnlocked = true;
  }
}

function playBeepSuccess() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {}
}

export function QrCameraScanner({
  expectedAnimal,
  onOpenGuide,
  allowMismatchContinue = false,
}: QrCameraScannerProps) {
  const router = useRouter();

  // State điều khiển Camera & Lỗi
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<NormalizedCameraError | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Tính năng phần cứng
  const [torchAvailable, setTorchAvailable] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [zoomAvailable, setZoomAvailable] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(1);

  // Trạng thái quét & Phản hồi
  const [scanStatus, setScanStatus] = useState<"scanning" | "success" | "warning">("scanning");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [detectedResult, setDetectedResult] = useState<QrParseResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [visualFlash, setVisualFlash] = useState<boolean>(false);

  // Refs điều khiển vòng đời
  const scannerContainerId = "qr-reader-container";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileDecoderRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isNavigatingRef = useRef<boolean>(false);
  const lastScannedContentRef = useRef<{ text: string; time: number }>({ text: "", time: 0 });
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Hàng đợi tuần tự (Mutex Promise Chain) ngăn chặn triệt để race-condition
  const operationLockRef = useRef<Promise<void>>(Promise.resolve());
  const runSequentially = useCallback((task: () => Promise<void>) => {
    operationLockRef.current = operationLockRef.current.then(async () => {
      try {
        await task();
      } catch (e) {
        console.warn("Lỗi trong hàng đợi camera:", e);
      }
    });
    return operationLockRef.current;
  }, []);

  // Lắng nghe pointerdown 1 lần để unlock Web Audio trên Safari
  useEffect(() => {
    const handlePointerDown = () => {
      unlockAudioContext();
      window.removeEventListener("pointerdown", handlePointerDown);
    };
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  // Lấy video track đang chạy một cách an toàn qua container
  const updateHardwareCapabilities = useCallback(() => {
    try {
      const container = document.getElementById(scannerContainerId);
      const videoEl = container?.querySelector("video") as HTMLVideoElement | null;
      let track: MediaStreamTrack | null = null;

      if (videoEl && videoEl.srcObject instanceof MediaStream) {
        track = videoEl.srcObject.getVideoTracks()[0] || null;
      }

      if (!track && scannerRef.current) {
        // Fallback kiểm tra track của scanner
        const inst = scannerRef.current as any;
        if (inst.localMediaStream instanceof MediaStream) {
          track = inst.localMediaStream.getVideoTracks()[0] || null;
        }
      }

      activeVideoTrackRef.current = track;

      if (track && typeof track.getCapabilities === "function") {
        const capabilities: any = track.getCapabilities();

        if (capabilities && "torch" in capabilities) {
          setTorchAvailable(true);
        } else {
          setTorchAvailable(false);
          setTorchOn(false);
        }

        if (capabilities && "zoom" in capabilities) {
          setZoomAvailable(true);
          const maxZ = Math.min(capabilities.zoom?.max || 3, 3);
          const minZ = capabilities.zoom?.min || 1;
          setMaxZoom(maxZ);
          setCurrentZoom(minZ);
        } else {
          setZoomAvailable(false);
        }
      } else {
        setTorchAvailable(false);
        setZoomAvailable(false);
      }
    } catch {
      setTorchAvailable(false);
      setZoomAvailable(false);
    }
  }, []);

  // Dừng camera an toàn
  const stopCameraSafe = useCallback(async () => {
    if (activeVideoTrackRef.current) {
      try {
        activeVideoTrackRef.current.stop();
      } catch {}
      activeVideoTrackRef.current = null;
    }

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch {}
    }

    setTorchOn(false);
    setTorchAvailable(false);
    setZoomAvailable(false);
  }, []);

  // Điều hướng sang trang AR sau khi xác thực thành công
  const navigateToAr = useCallback(
    (slug: string, code?: string) => {
      isNavigatingRef.current = true;
      setScanStatus("success");
      setVisualFlash(true);

      // Rung phản hồi (nếu trình duyệt hỗ trợ)
      try {
        navigator.vibrate?.([80, 50, 80]);
      } catch {}

      playBeepSuccess();

      // Dừng video stream ngay lập tức để tiết kiệm tài nguyên
      stopCameraSafe();

      // Watchdog 4 giây: nếu sau 4 giây vẫn còn trên trang (lỗi mạng hoặc huỷ), mở lại camera
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = setTimeout(() => {
        if (isNavigatingRef.current) {
          console.warn("Watchdog: Điều hướng mất quá nhiều thời gian, khôi phục camera...");
          isNavigatingRef.current = false;
          setScanStatus("scanning");
          setVisualFlash(false);
          setDetectedResult(null);
        }
      }, 4000);

      const query = code
        ? `?ar=1&code=${encodeURIComponent(code)}`
        : `?ar=1`;

      setTimeout(() => {
        router.push(`/ar/${slug}${query}`);
      }, 450);
    },
    [router, stopCameraSafe]
  );

  // Xử lý khi quét trúng mã QR
  const handleQrDecoded = useCallback(
    async (decodedText: string) => {
      if (isNavigatingRef.current) return;

      const now = Date.now();
      // Cooldown 2.5s với cùng một chuỗi mã để chống spam
      if (
        lastScannedContentRef.current.text === decodedText &&
        now - lastScannedContentRef.current.time < 2500
      ) {
        return;
      }
      lastScannedContentRef.current = { text: decodedText, time: now };

      const parseResult = parseAndValidateQr(
        decodedText,
        expectedAnimal ? expectedAnimal.slug : null
      );

      // Trường hợp 1: Mã hợp lệ
      if (parseResult.valid && parseResult.slug) {
        const slug = parseResult.slug;
        setDetectedResult(parseResult);
        setFeedbackMessage(`Đã nhận diện: ${parseResult.animalNameEn || slug}!`);

        // Xác thực trước với máy chủ (MongoDB / System) để đảm bảo thẻ tồn tại, tránh lỗi 404
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const res = await fetch(`/api/products/${slug}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            navigateToAr(slug, parseResult.code);
            return;
          } else if (res.status === 404) {
            setScanStatus("warning");
            setFeedbackMessage(`Thẻ "${slug}" chưa có trên hệ sinh thái Poly Cards.`);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            warningTimerRef.current = setTimeout(() => {
              setScanStatus("scanning");
              setFeedbackMessage(null);
            }, 3000);
            return;
          }
        } catch {
          // Nếu mạng chậm, vẫn tiến hành chuyển trang để trải nghiệm không bị gián đoạn
          navigateToAr(slug, parseResult.code);
          return;
        }

        navigateToAr(slug, parseResult.code);
        return;
      }

      // Trường hợp 2: Lệch mục tiêu (?expect=...)
      if (parseResult.isMismatched) {
        setDetectedResult(parseResult);
        setScanStatus("warning");
        setFeedbackMessage(parseResult.errorMessage || "Mã QR không khớp với thẻ bài đang yêu cầu.");

        try {
          navigator.vibrate?.([50, 50, 50]);
        } catch {}

        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        warningTimerRef.current = setTimeout(() => {
          setScanStatus("scanning");
          setFeedbackMessage(null);
        }, 3500);
        return;
      }

      // Trường hợp 3: QR không hợp lệ
      setScanStatus("warning");
      setFeedbackMessage(parseResult.errorMessage || "Mã QR không thuộc hệ thống Poly Cards.");

      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => {
        setScanStatus("scanning");
        setFeedbackMessage(null);
      }, 3000);
    },
    [expectedAnimal, navigateToAr]
  );

  const handleQrDecodedRef = useRef(handleQrDecoded);
  useEffect(() => {
    handleQrDecodedRef.current = handleQrDecoded;
  }, [handleQrDecoded]);

  // Khởi động Camera chính
  const startCamera = useCallback(async () => {
    await runSequentially(async () => {
      setIsInitializing(true);
      setCameraError(null);

      // Tạo instance nếu chưa có
      if (!scannerRef.current) {
        try {
          scannerRef.current = new Html5Qrcode(scannerContainerId, {
            verbose: false,
          });
        } catch (e) {
          console.warn("Lỗi khởi tạo Html5Qrcode:", e);
          setIsInitializing(false);
          setCameraError(normalizeCameraError(e));
          return;
        }
      }

      const scanner = scannerRef.current;

      // Dừng phiên cũ nếu còn chạy
      if (scanner.isScanning) {
        try {
          await scanner.stop();
        } catch {}
      }

      try {
        await scanner.start(
          { facingMode: cameraFacingMode },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minDim = Math.min(viewfinderWidth, viewfinderHeight);
              const boxSize = Math.max(220, Math.min(Math.floor(minDim * 0.72), 340));
              return { width: boxSize, height: boxSize };
            },
            videoConstraints: {
              facingMode: cameraFacingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          (decodedText) => {
            handleQrDecodedRef.current(decodedText);
          },
          () => {}
        );

        setIsInitializing(false);
        updateHardwareCapabilities();
      } catch (err) {
        setIsInitializing(false);
        setCameraError(normalizeCameraError(err));
      }
    });
  }, [cameraFacingMode, runSequentially, updateHardwareCapabilities]);

  // Khởi chạy camera khi mount hoặc facingMode đổi
  useEffect(() => {
    let isCancelled = false;

    startCamera().then(() => {
      if (isCancelled) {
        stopCameraSafe();
      }
    });

    return () => {
      isCancelled = true;
      runSequentially(async () => {
        await stopCameraSafe();
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, [cameraFacingMode, runSequentially, startCamera, stopCameraSafe]);

  // Xử lý BFCache: khi người dùng bấm Back từ AR quay lại /scan
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted || isNavigatingRef.current) {
        isNavigatingRef.current = false;
        setScanStatus("scanning");
        setVisualFlash(false);
        setDetectedResult(null);
        startCamera();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [startCamera]);

  // Xử lý Tab Ẩn / Khóa Màn Hình (Visibility Change & Page Hide)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopCameraSafe();
      } else if (document.visibilityState === "visible" && !isNavigatingRef.current) {
        startCamera();
      }
    };

    const handlePageHide = () => {
      stopCameraSafe();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [startCamera, stopCameraSafe]);

  // Đổi Camera Trước / Sau
  const handleSwitchCamera = useCallback(() => {
    setCameraFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  // Bật / Tắt Đèn Flash
  const toggleTorch = useCallback(async () => {
    if (!activeVideoTrackRef.current) {
      updateHardwareCapabilities();
    }
    const track = activeVideoTrackRef.current;
    if (!track) return;

    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn("Không thể bật/tắt đèn flash:", e);
    }
  }, [torchOn, updateHardwareCapabilities]);

  // Thu phóng Camera 1x / 2x
  const toggleZoom = useCallback(async () => {
    if (!activeVideoTrackRef.current) {
      updateHardwareCapabilities();
    }
    const track = activeVideoTrackRef.current;
    if (!track) return;

    try {
      const nextZoom = currentZoom === 1 ? Math.min(2, maxZoom) : 1;
      await (track as any).applyConstraints({
        advanced: [{ zoom: nextZoom }],
      });
      setCurrentZoom(nextZoom);
    } catch (e) {
      console.warn("Không thể thay đổi zoom:", e);
    }
  }, [currentZoom, maxZoom, updateHardwareCapabilities]);

  // Quét ảnh QR từ Thư viện độc lập (không chạm vào Camera đang chạy)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);

    try {
      // Khởi tạo decoder riêng nếu chưa có
      if (!fileDecoderRef.current) {
        fileDecoderRef.current = new Html5Qrcode("qr-file-decoder", {
          verbose: false,
        });
      }

      // Xử lý nén ảnh nếu ảnh quá lớn (> 1600px) để quét nhanh hơn
      const processedFile = await preprocessImageForQr(file);
      const decodedResult = await fileDecoderRef.current.scanFile(processedFile, false);

      handleQrDecoded(decodedResult);
    } catch {
      setScanStatus("warning");
      setFeedbackMessage("Không tìm thấy mã QR trong bức ảnh này. Vui lòng thử ảnh rõ nét hơn!");
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => {
        setScanStatus("scanning");
        setFeedbackMessage(null);
      }, 3500);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col justify-between bg-stone-950 text-white overflow-hidden select-none">
      {/* Container ẩn phục vụ giải mã File ảnh độc lập */}
      <div id="qr-file-decoder" className="hidden" aria-hidden="true" />

      {/* Input File Ẩn cho Upload Ảnh QR */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="qr-file-upload-input"
      />

      {/* 1. THANH ĐIỀU KHIỂN NỔI PHÍA TRÊN (Responsive hoàn hảo cho 360px+) */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/85 via-black/45 to-transparent">
        {/* Nút Về Trang Chủ */}
        <Link
          href="/"
          className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-black text-white backdrop-blur-md hover:bg-white/30 active:scale-95 transition-all shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden min-[380px]:inline">Trang Chủ</span>
        </Link>

        {/* Nhãn Mục Tiêu AR */}
        {expectedAnimal ? (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-black text-white backdrop-blur-md shadow-md border border-emerald-400/40 max-w-[160px] truncate">
            <span className="h-2 w-2 rounded-full bg-amber-300 animate-ping shrink-0" />
            <span className="truncate">{expectedAnimal.nameEn}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-stone-900/80 px-3 py-1 text-xs font-black text-amber-300 backdrop-blur-md border border-white/10 shadow-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="hidden min-[360px]:inline">Camera AR</span>
          </div>
        )}

        {/* Cụm Nút Điều Khiển Gọn Gàng (Tối đa 3 nút để không tràn màn hình 360px) */}
        <div className="flex items-center gap-1.5">
          {/* Nút Đổi Camera */}
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-white/20 p-2 backdrop-blur-md text-white hover:bg-white/30 active:scale-90 transition-all cursor-pointer"
            title="Đổi camera trước / sau"
            aria-label="Đổi camera"
          >
            <SwitchCamera className="h-4.5 w-4.5" />
          </button>

          {/* Nút Đèn Flash (nếu thiết bị hỗ trợ) */}
          {torchAvailable && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full p-2 backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                torchOn
                  ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/50"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              title={torchOn ? "Tắt đèn flash" : "Bật đèn flash"}
              aria-label="Bật tắt đèn flash"
            >
              {torchOn ? <Zap className="h-4.5 w-4.5" /> : <ZapOff className="h-4.5 w-4.5" />}
            </button>
          )}

          {/* Nút Menu Tùy Chọn "⋯" */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-white/20 p-2 backdrop-blur-md text-white hover:bg-white/30 active:scale-90 transition-all cursor-pointer"
              title="Tùy chọn mở rộng"
              aria-label="Tùy chọn mở rộng"
            >
              <MoreVertical className="h-4.5 w-4.5" />
            </button>

            {/* Menu Popup Khi Bấm "⋯" */}
            {showMoreMenu && (
              <div
                className="absolute right-0 top-12 z-50 w-44 rounded-2xl border border-white/20 bg-stone-900/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowMoreMenu(false)}
              >
                {zoomAvailable && (
                  <button
                    type="button"
                    onClick={toggleZoom}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-stone-200 hover:bg-white/10 active:scale-98 transition-all cursor-pointer"
                  >
                    <Sliders className="h-4 w-4 text-emerald-400" />
                    <span>Thu phóng: {currentZoom}x</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-stone-200 hover:bg-white/10 active:scale-98 transition-all cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4 text-sky-400" />
                  <span>Chọn ảnh từ album</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 hover:bg-white/10 active:scale-98 transition-all cursor-pointer"
                >
                  <HelpCircle className="h-4 w-4 text-amber-400" />
                  <span>Hướng dẫn quét thẻ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. KHU VỰC CAMERA VIEWPORT */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
        {/* Màn hình Báo Lỗi Camera */}
        {cameraError ? (
          <div className="m-4 max-w-sm rounded-3xl border border-stone-800 bg-stone-900/95 p-6 text-center shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Camera className="h-8 w-8" />
            </div>
            <h3 className="text-base font-black text-white">{cameraError.message}</h3>
            <p className="text-xs text-stone-300 leading-relaxed">{cameraError.guide}</p>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={startCamera}
                className="btn-toy-3d inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-black text-stone-950 shadow-md hover:bg-amber-400 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Thử Lại Khởi Động Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-stone-800 px-4 py-2 text-xs font-bold text-stone-200 hover:bg-stone-700 active:scale-95 cursor-pointer"
              >
                <UploadCloud className="h-4 w-4 text-sky-400" />
                <span>Chọn Ảnh Mã QR Từ Máy</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* HTML5 QR Video Container */}
            <div
              id={scannerContainerId}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Loading Indicator khi đang xin quyền/khởi tạo */}
            {isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                <div className="h-10 w-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="mt-3 text-xs font-semibold text-stone-300">
                  Đang khởi động Camera...
                </span>
              </div>
            )}

            {/* Glowing AR Reticle HUD Overlay (Khung ngắm chuẩn) */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 z-10">
              <div
                className={`relative aspect-square w-64 max-w-[70vw] rounded-3xl border-2 transition-all duration-300 ${
                  visualFlash
                    ? "border-emerald-300 bg-emerald-400/20 shadow-[0_0_60px_rgba(52,211,153,1)] scale-105"
                    : scanStatus === "success"
                    ? "border-emerald-400 shadow-[0_0_50px_rgba(52,211,153,0.8)] scale-105"
                    : scanStatus === "warning"
                    ? "border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.6)]"
                    : "border-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.35)]"
                }`}
              >
                {/* 4 Góc Marker AR */}
                <div className="absolute -top-1.5 -left-1.5 h-7 w-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                <div className="absolute -top-1.5 -right-1.5 h-7 w-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                <div className="absolute -bottom-1.5 -left-1.5 h-7 w-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                <div className="absolute -bottom-1.5 -right-1.5 h-7 w-7 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />

                {/* Laser Scanning Beam */}
                <div
                  className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
                  style={{
                    animation: "cameraScanBeam 2s ease-in-out infinite alternate",
                  }}
                />

                {/* Hướng Dẫn Trong Khung */}
                <div className="absolute -bottom-10 inset-x-0 text-center">
                  <span className="inline-block rounded-full bg-black/75 px-3.5 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur-md border border-white/10 shadow-sm">
                    Đặt mã QR thẻ bài vào khung
                  </span>
                </div>
              </div>
            </div>

            {/* Màn hình Khóa Mục Tiêu AR Thành Công */}
            {scanStatus === "success" && detectedResult && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-40 mx-auto max-w-sm rounded-3xl border-2 border-emerald-300 bg-stone-900/95 p-6 text-center shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-md mb-3 border border-emerald-400/40">
                  <Sparkles className="h-8 w-8 animate-pulse text-amber-300" />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-400 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>ĐÃ KHÓA MỤC TIÊU 3D</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase">
                  {detectedResult.animalNameEn || detectedResult.slug}
                </h3>
                {detectedResult.animalNameVi && (
                  <p className="text-xs font-bold text-stone-300 mt-0.5">
                    ({detectedResult.animalNameVi})
                  </p>
                )}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="h-1.5 w-24 rounded-full bg-stone-800 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full animate-pulse w-full" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">Đang nạp 3D...</span>
                </div>
              </div>
            )}

            {/* Màn hình Mismatch nếu bật allowMismatchContinue */}
            {allowMismatchContinue && scanStatus === "warning" && detectedResult?.isMismatched && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-40 mx-auto max-w-sm rounded-3xl border-2 border-amber-300 bg-stone-900/95 p-5 text-center shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
                <AlertCircle className="mx-auto h-10 w-10 text-amber-400 mb-2" />
                <h4 className="text-sm font-bold text-white">Thẻ không trùng với mục tiêu</h4>
                <p className="text-xs text-stone-300 mt-1">{feedbackMessage}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (detectedResult.slug) {
                        navigateToAr(detectedResult.slug, detectedResult.code);
                      }
                    }}
                    className="flex-1 rounded-xl bg-amber-500 py-2 text-xs font-bold text-stone-950 shadow-sm hover:bg-amber-400 active:scale-95"
                  >
                    Xem thẻ này
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScanStatus("scanning");
                      setFeedbackMessage(null);
                    }}
                    className="flex-1 rounded-xl bg-stone-800 py-2 text-xs font-bold text-stone-300 hover:bg-stone-700 active:scale-95"
                  >
                    Quét lại
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. KHU VỰC ĐÁY: NÚT TẢI ẢNH QR DUY NHẤT & CẢNH BÁO */}
      <div className="relative z-30 p-3 sm:p-4 bg-gradient-to-t from-black via-black/90 to-transparent space-y-2.5">
        {scanStatus === "warning" ? (
          <div className="mx-auto max-w-sm rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-stone-950 shadow-lg text-center animate-in zoom-in-95 duration-150">
            {feedbackMessage}
          </div>
        ) : isProcessingFile ? (
          <div className="mx-auto max-w-sm rounded-2xl bg-sky-600 px-4 py-2 text-xs font-black text-white shadow-lg text-center animate-pulse">
            Đang phân tích hình ảnh mã QR...
          </div>
        ) : null}

        {/* Nút bấm tải ảnh QR duy nhất ở đáy */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-toy-3d inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-102 active:scale-95 cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Tải Ảnh Mã QR Từ Thư Viện</span>
          </button>
        </div>
      </div>

      {/* Tùy chỉnh CSS ẩn thành phần thừa của html5-qrcode */}
      <style jsx global>{`
        #qr-reader-container {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          border: none !important;
        }
        #qr-reader-container video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        /* Ẩn hoàn toàn khung mờ và viền tự vẽ mặc định của html5-qrcode */
        #qr-reader-container #qr-shaded-region {
          display: none !important;
        }
        #qr-reader-container span,
        #qr-reader-container img {
          display: none !important;
        }
      `}</style>

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

// Hàm hỗ trợ tiền xử lý ảnh: nếu kích thước > 1600px thì vẽ lại canvas để giảm dung lượng trước khi decode
async function preprocessImageForQr(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1600;
      let { width, height } = img;

      if (width <= maxDim && height <= maxDim) {
        resolve(file);
        return;
      }

      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const resizedFile = new File([blob], file.name, { type: file.type });
        resolve(resizedFile);
      }, file.type || "image/jpeg", 0.92);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
