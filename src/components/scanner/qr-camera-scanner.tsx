"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { parseAndValidateQr, QrParseResult } from "@/lib/qr-parser";
import { ScanCardSummary } from "@/app/scan/page";
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
  RotateCcw,
} from "lucide-react";

interface QrCameraScannerProps {
  expectedAnimal?: ScanCardSummary;
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

  // Kích thước đồng bộ giữa viewfinder và reticle HUD (Mục B5)
  const [reticleBoxSize, setReticleBoxSize] = useState<number>(260);

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

  // Trạng thái watchdog điều hướng (Mục A1)
  const [navSlowNotice, setNavSlowNotice] = useState<boolean>(false);

  // Refs điều khiển vòng đời
  const scannerContainerId = "qr-reader-container";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileDecoderRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cờ chặn race-condition khi xử lý mã và chuyển trang (Mục A1 & A2)
  const isNavigatingRef = useRef<boolean>(false);
  const isResolvingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const lastScannedContentRef = useRef<{ text: string; time: number }>({ text: "", time: 0 });
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const slowNavTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Lắng nghe pointerdown 1 lần để unlock Web Audio trên Safari iOS
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

  // Mục C3: Đóng bảng "⋯" khi click ra ngoài hoặc bấm Escape
  useEffect(() => {
    if (!showMoreMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMoreMenu]);

  // Mục B5: Tính toán kích thước Reticle HUD khớp chuẩn với qrbox (70% minDim, 220px - 320px)
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const minDim = Math.min(clientWidth || window.innerWidth, clientHeight || window.innerHeight);
      const computedSize = Math.max(220, Math.min(Math.floor(minDim * 0.70), 320));
      setReticleBoxSize(computedSize);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Lấy video track đang chạy một cách an toàn
  const updateHardwareCapabilities = useCallback(() => {
    try {
      const container = document.getElementById(scannerContainerId);
      const videoEl = container?.querySelector("video") as HTMLVideoElement | null;
      let track: MediaStreamTrack | null = null;

      if (videoEl && videoEl.srcObject instanceof MediaStream) {
        track = videoEl.srcObject.getVideoTracks()[0] || null;
      }

      if (!track && scannerRef.current) {
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

  // Mục A1: Khôi phục lại trạng thái quét và bật lại camera khi hủy hoặc timeout
  const cancelNavigationAndRestoreCamera = useCallback(() => {
    isNavigatingRef.current = false;
    isResolvingRef.current = false;
    setScanStatus("scanning");
    setVisualFlash(false);
    setDetectedResult(null);
    setNavSlowNotice(false);

    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (slowNavTimerRef.current) clearTimeout(slowNavTimerRef.current);

    runSequentially(async () => {
      await startCameraInternal();
    });
  }, [runSequentially]);

  // Điều hướng sang trang AR sau khi xác thực thành công (Mục A1)
  const navigateToAr = useCallback(
    (slug: string, code?: string) => {
      isNavigatingRef.current = true;
      isResolvingRef.current = false;
      setScanStatus("success");
      setVisualFlash(true);
      setNavSlowNotice(false);

      // Rung phản hồi (nếu trình duyệt hỗ trợ)
      try {
        navigator.vibrate?.([80, 50, 80]);
      } catch {}

      playBeepSuccess();

      // Dừng video stream ngay lập tức để giải phóng RAM cho AR Viewer
      stopCameraSafe();

      // Hẹn giờ hiển thị nút "Hủy / Quét lại" sau 6 giây nếu mạng chậm
      if (slowNavTimerRef.current) clearTimeout(slowNavTimerRef.current);
      slowNavTimerRef.current = setTimeout(() => {
        if (isNavigatingRef.current) {
          setNavSlowNotice(true);
        }
      }, 6000);

      // Watchdog 10 giây: nếu sau 10 giây vẫn còn trên trang, khôi phục camera (Mục A1)
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = setTimeout(() => {
        if (isNavigatingRef.current) {
          console.warn("Watchdog 10s: Điều hướng mất quá nhiều thời gian, khôi phục camera...");
          cancelNavigationAndRestoreCamera();
        }
      }, 10000);

      const query = code
        ? `?ar=1&code=${encodeURIComponent(code)}`
        : `?ar=1`;

      setTimeout(() => {
        router.push(`/ar/${slug}${query}`);
      }, 450);
    },
    [router, stopCameraSafe, cancelNavigationAndRestoreCamera]
  );

  // Xử lý khi quét trúng mã QR (Mục A2, A4)
  const handleQrDecoded = useCallback(
    async (decodedText: string) => {
      // Chặn ngay lập tức nếu đang resolve fetch hoặc đang điều hướng (Mục A2)
      if (isNavigatingRef.current || isResolvingRef.current) return;

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
        isResolvingRef.current = true; // Khóa ngay lập tức (Mục A2)

        setDetectedResult(parseResult);
        setFeedbackMessage(`Đã nhận diện: ${parseResult.animalNameEn || slug}!`);

        // Hủy request trước đó nếu còn chạy
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const timeoutId = setTimeout(() => controller.abort(), 3500);

        try {
          const res = await fetch(`/api/products/${slug}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const json = await res.json();
            // Mục A4: Cập nhật tên thực tế nameEn / nameVi từ API trước khi chuyển màn hình
            if (json.success && json.data) {
              const apiCard = json.data;
              setDetectedResult({
                ...parseResult,
                animalNameEn: apiCard.nameEn || parseResult.animalNameEn,
                animalNameVi: apiCard.nameVi || parseResult.animalNameVi,
              });
            }
            navigateToAr(slug, parseResult.code);
            return;
          } else if (res.status === 404) {
            isResolvingRef.current = false;
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
          // Mạng chậm hoặc timeout: vẫn tiếp tục chuyển sang AR để không chặn người dùng
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

  // Khởi động Camera nội bộ (chạy tuần tự qua mutex, Mục B4 & B5)
  const startCameraInternal = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);

    // Kiểm tra DOM container
    const container = document.getElementById(scannerContainerId);
    if (!container) {
      setIsInitializing(false);
      return;
    }

    // Nếu scanner cũ không hợp lệ hoặc đã bị lỗi DOM, xóa và tạo mới
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch {
        try {
          await scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
    }

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

    try {
      await scanner.start(
        { facingMode: cameraFacingMode },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.max(220, Math.min(Math.floor(minDim * 0.70), 320));
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
  }, [cameraFacingMode, updateHardwareCapabilities]);

  const startCamera = useCallback(async () => {
    await runSequentially(async () => {
      await startCameraInternal();
    });
  }, [runSequentially, startCameraInternal]);

  // Mục A3: Khởi chạy camera khi mount hoặc facingMode đổi, không chạy stop ngoài hàng đợi
  useEffect(() => {
    startCamera();

    return () => {
      runSequentially(async () => {
        await stopCameraSafe();
      });
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      if (slowNavTimerRef.current) clearTimeout(slowNavTimerRef.current);
    };
  }, [cameraFacingMode, runSequentially, startCamera, stopCameraSafe]);

  // Mục C6: BFCache & Visibility Change không bị khởi động kép
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted || isNavigatingRef.current) {
        isNavigatingRef.current = false;
        isResolvingRef.current = false;
        setScanStatus("scanning");
        setVisualFlash(false);
        setDetectedResult(null);
        setNavSlowNotice(false);

        // Kiểm tra nếu camera chưa chạy thì mới start
        const isHealthy =
          scannerRef.current?.isScanning &&
          activeVideoTrackRef.current?.readyState === "live";

        if (!isHealthy) {
          startCamera();
        }
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [startCamera]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopCameraSafe();
      } else if (document.visibilityState === "visible" && !isNavigatingRef.current) {
        // Kiểm tra tránh start lặp lại nếu track đang live
        const isHealthy =
          scannerRef.current?.isScanning &&
          activeVideoTrackRef.current?.readyState === "live";

        if (!isHealthy) {
          startCamera();
        }
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

  // Dọn dẹp fileDecoder khi unmount (Mục B3)
  useEffect(() => {
    return () => {
      if (fileDecoderRef.current) {
        try {
          fileDecoderRef.current.clear();
        } catch {}
        fileDecoderRef.current = null;
      }
    };
  }, []);

  // Mục B3: Nâng cấp giải mã file ảnh theo thứ tự đa tầng (ảnh gốc <= 2400px -> 2048px -> 1024px -> gốc)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);

    try {
      if (!fileDecoderRef.current) {
        fileDecoderRef.current = new Html5Qrcode("qr-file-decoder", {
          verbose: false,
        });
      }
      const decoder = fileDecoderRef.current;

      // Đặt timeout tổng 6.5 giây
      const decodeWithStages = async (): Promise<string> => {
        let lastErr: unknown = null;

        // Tầng 1: Thử ảnh gốc (nếu <= 2400px) hoặc thu về 2048px
        try {
          const stage1File = await resizeImageToMaxDim(file, 2048, true);
          return await decoder.scanFile(stage1File, false);
        } catch (err1) {
          lastErr = err1;
        }

        // Tầng 2: Thử thu nhỏ về 1024px
        try {
          const stage2File = await resizeImageToMaxDim(file, 1024, false);
          return await decoder.scanFile(stage2File, false);
        } catch (err2) {
          lastErr = err2;
        }

        // Tầng 3: Thử file gốc nguyên bản (không qua canvas)
        try {
          return await decoder.scanFile(file, false);
        } catch (err3) {
          lastErr = err3;
          throw lastErr;
        }
      };

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout khi quét ảnh")), 6500)
      );

      const decodedResult = await Promise.race([decodeWithStages(), timeoutPromise]);
      handleQrDecoded(decodedResult);
    } catch (err: any) {
      const isFormatError =
        err?.message?.includes("format") || err?.name === "NotSupportedError";
      const errMsg = isFormatError
        ? "Định dạng ảnh không được hỗ trợ. Vui lòng chọn tệp JPG hoặc PNG."
        : "Không tìm thấy mã QR trong bức ảnh này. Vui lòng thử ảnh rõ nét hơn!";

      setScanStatus("warning");
      setFeedbackMessage(errMsg);

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
    <div
      ref={containerRef}
      className="relative flex min-h-[100dvh] w-full flex-col justify-between bg-stone-950 text-white overflow-hidden select-none"
    >
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

      {/* 1. THANH ĐIỀU KHIỂN NỔI PHÍA TRÊN */}
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
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-black text-white backdrop-blur-md shadow-md border border-emerald-400/40 max-w-[170px] truncate">
            <span className="h-2 w-2 rounded-full bg-amber-300 animate-ping shrink-0" />
            <span className="truncate">{expectedAnimal.nameEn}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-stone-900/80 px-3 py-1 text-xs font-black text-amber-300 backdrop-blur-md border border-white/10 shadow-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="hidden min-[360px]:inline">Camera AR</span>
          </div>
        )}

        {/* Cụm Nút Điều Khiển Gọn Gàng */}
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

          {/* Nút Đèn Flash */}
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
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-white/20 p-2 backdrop-blur-md text-white hover:bg-white/30 active:scale-90 transition-all cursor-pointer"
              title="Tùy chọn mở rộng"
              aria-label="Tùy chọn mở rộng"
            >
              <MoreVertical className="h-4.5 w-4.5" />
            </button>

            {/* Menu Popup Khi Bấm "⋯" (Mục C3) */}
            {showMoreMenu && (
              <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-white/20 bg-stone-900/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                {zoomAvailable && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleZoom();
                      setShowMoreMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-stone-200 hover:bg-white/10 active:scale-98 transition-all cursor-pointer"
                  >
                    <Sliders className="h-4 w-4 text-emerald-400" />
                    <span>Thu phóng: {currentZoom}x</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowMoreMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-stone-200 hover:bg-white/10 active:scale-98 transition-all cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4 text-sky-400" />
                  <span>Chọn ảnh từ album</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenGuide();
                  }}
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
        {/* Mục B4: HTML5 QR Video Container LUÔN nằm trong DOM */}
        <div
          id={scannerContainerId}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Lớp Phủ Báo Lỗi Camera (Overlay phủ lên trên mà không gỡ container khỏi DOM) */}
        {cameraError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="max-w-sm rounded-3xl border border-stone-800 bg-stone-900/95 p-6 text-center shadow-2xl space-y-4">
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
          </div>
        )}

        {/* Loading Indicator khi đang xin quyền/khởi tạo */}
        {isInitializing && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
            <div className="h-10 w-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="mt-3 text-xs font-semibold text-stone-300">
              Đang khởi động Camera...
            </span>
          </div>
        )}

        {/* Mục B5: Glowing AR Reticle HUD Overlay (Kích thước reticleBoxSize đồng bộ 100% với qrbox) */}
        {!cameraError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 z-10">
            <div
              style={{
                width: `${reticleBoxSize}px`,
                height: `${reticleBoxSize}px`,
              }}
              className={`relative rounded-3xl border-2 transition-all duration-300 ${
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
        )}

        {/* Màn hình Khóa Mục Tiêu AR Thành Công (Mục A1 & A4) */}
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

            <div className="mt-4 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-stone-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full animate-pulse w-full" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400">
                  {navSlowNotice ? "Đang chuẩn bị mô hình..." : "Đang nạp 3D..."}
                </span>
              </div>

              {/* Mục A1: Nút Hủy / Quét lại xuất hiện sau 6 giây nếu kết nối mạng chậm */}
              {navSlowNotice && (
                <button
                  type="button"
                  onClick={cancelNavigationAndRestoreCamera}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-800/90 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-stone-700 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Mạng chậm? Hủy &amp; Quét lại</span>
                </button>
              )}
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
                className="flex-1 rounded-xl bg-amber-500 py-2 text-xs font-bold text-stone-950 shadow-sm hover:bg-amber-400 active:scale-95 cursor-pointer"
              >
                Xem thẻ này
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanStatus("scanning");
                  setFeedbackMessage(null);
                }}
                className="flex-1 rounded-xl bg-stone-800 py-2 text-xs font-bold text-stone-300 hover:bg-stone-700 active:scale-95 cursor-pointer"
              >
                Quét lại
              </button>
            </div>
          </div>
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

// Hàm hỗ trợ tiền xử lý ảnh với giới hạn kích thước tối đa (Mục B3)
async function resizeImageToMaxDim(file: File, maxDim: number, passIfSmall: boolean): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (passIfSmall && width <= maxDim && height <= maxDim) {
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
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const resizedFile = new File([blob], file.name, { type: file.type || "image/jpeg" });
          resolve(resizedFile);
        },
        file.type || "image/jpeg",
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
