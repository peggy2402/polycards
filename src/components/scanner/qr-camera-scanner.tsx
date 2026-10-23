"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { parseAndValidateQr, QrParseResult } from "@/lib/qr-parser";
import { Animal } from "@/types/animal";
import {
  ArrowLeft,
  Zap,
  ZapOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Scan,
} from "lucide-react";

interface QrCameraScannerProps {
  expectedAnimal?: Animal;
  onBackToGuide: () => void;
}

export function QrCameraScanner({
  expectedAnimal,
  onBackToGuide,
}: QrCameraScannerProps) {
  const router = useRouter();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanStatus, setScanStatus] = useState<"scanning" | "success" | "warning">("scanning");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader-container";

  useEffect(() => {
    let isMounted = true;
    const scanner = new Html5Qrcode(scannerContainerId);
    scannerRef.current = scanner;

    const startCamera = async () => {
      try {
        setCameraError(null);
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minDim = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(minDim * 0.72);
              return { width: Math.max(220, Math.min(size, 320)), height: Math.max(220, Math.min(size, 320)) };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isMounted) return;
            handleQrDecoded(decodedText);
          },
          () => {
            // QR code scanning frame error (normal frame drop, ignore)
          }
        );

        // Check if torch/flashlight is supported
        try {
          // Check video track capabilities
          const stream = (scanner as any).localMediaStream as MediaStream | undefined;
          if (stream) {
            const track = stream.getVideoTracks()[0];
            const capabilities = (track as any).getCapabilities?.();
            if (capabilities && "torch" in capabilities) {
              setTorchAvailable(true);
            }
          }
        } catch {
          // Torch check failed gracefully
        }

        // If unmounted while starting camera, stop immediately
        if (!isMounted) {
          safeStopScanner(scanner);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Camera start error:", err);
        if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
          setCameraError(
            "Bạn đã từ chối quyền truy cập máy ảnh. Vui lòng vào cài đặt trình duyệt để cho phép quyền camera và thử lại."
          );
        } else if (err.name === "NotFoundError" || err.message?.includes("NotFound")) {
          setCameraError("Không tìm thấy thiết bị camera phía sau trên điện thoại của bạn.");
        } else {
          setCameraError("Không thể kích hoạt máy ảnh. Vui lòng kiểm tra lại quyền hoặc thử trình duyệt khác.");
        }
      }
    };

    const safeStopScanner = async (inst: Html5Qrcode | null) => {
      if (!inst) return;
      try {
        // Html5QrcodeScannerState: 2 = SCANNING, 3 = PAUSED
        const state = typeof inst.getState === "function" ? inst.getState() : 0;
        if (state === 2 || state === 3 || (inst as any).isScanning) {
          await inst.stop();
        }
      } catch {
        // Ignore "Cannot stop, scanner is not running or paused" safely
      }
      try {
        inst.clear();
      } catch {
        // Ignore
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      safeStopScanner(scannerRef.current);
    };
  }, []);

  const handleQrDecoded = (decodedText: string) => {
    const parseResult: QrParseResult = parseAndValidateQr(
      decodedText,
      expectedAnimal ? expectedAnimal.slug : null
    );

    if (parseResult.valid && parseResult.slug) {
      setScanStatus("success");
      setFeedbackMessage(`Đã nhận diện: ${parseResult.animalNameEn || parseResult.slug}!`);
      try {
        navigator.vibrate?.(100);
      } catch {}

      // Stop scanner safely and navigate
      if (scannerRef.current) {
        try {
          const state = typeof scannerRef.current.getState === "function" ? scannerRef.current.getState() : 0;
          if (state === 2 || state === 3) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {}
      }
      setTimeout(() => {
        router.push(`/ar/${parseResult.slug}`);
      }, 700);
    } else if (parseResult.isMismatched) {
      setScanStatus("warning");
      setFeedbackMessage(parseResult.errorMessage || "Mã QR không khớp sản phẩm đang chọn.");
      try {
        navigator.vibrate?.([50, 50, 50]);
      } catch {}

      // Resume scanning after 3 seconds
      setTimeout(() => {
        setScanStatus("scanning");
        setFeedbackMessage(null);
      }, 3500);
    } else {
      setScanStatus("warning");
      setFeedbackMessage(parseResult.errorMessage || "Mã QR không thuộc hệ thống Poly Cards an toàn.");
      setTimeout(() => {
        setScanStatus("scanning");
        setFeedbackMessage(null);
      }, 3000);
    }
  };

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

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col justify-between bg-stone-950 text-white overflow-hidden">
      {/* Top Floating Controls */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent">
        <button
          type="button"
          onClick={onBackToGuide}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-md hover:bg-white/30 active:scale-95 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay Lại</span>
        </button>

        {expectedAnimal && (
          <div className="rounded-full bg-emerald-600/90 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md">
            Mục tiêu: {expectedAnimal.nameEn}
          </div>
        )}

        {torchAvailable && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 backdrop-blur-md transition-all active:scale-95 ${
              torchOn
                ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/40"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title={torchOn ? "Tắt đèn flash" : "Bật đèn flash trợ sáng"}
          >
            {torchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Camera Video Viewport */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="m-4 max-w-sm rounded-3xl border border-stone-800 bg-stone-900/95 p-6 text-center shadow-2xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-400">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Lỗi Truy Cập Camera</h3>
            <p className="text-xs text-stone-300 leading-relaxed">{cameraError}</p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Tải Lại Trang Để Thử Lại</span>
              </button>
              <button
                type="button"
                onClick={onBackToGuide}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-stone-800 px-4 py-2 text-xs font-semibold text-stone-300 hover:bg-stone-700"
              >
                Về Hướng Dẫn
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* HTML5 QR Container */}
            <div
              id={scannerContainerId}
              className="h-full w-full object-cover"
              style={{
                width: "100%",
                height: "100%",
              }}
            />

            {/* Glowing Reticle Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="relative aspect-square w-64 max-w-[70vw] rounded-3xl border-2 border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                {/* 4 Corners */}
                <div className="absolute -top-1.5 -left-1.5 h-6 w-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute -top-1.5 -right-1.5 h-6 w-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute -bottom-1.5 -left-1.5 h-6 w-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                {/* Laser scan line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" style={{ top: "50%" }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Feedback Banner */}
      <div className="relative z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent text-center space-y-2">
        {scanStatus === "success" ? (
          <div className="mx-auto flex max-w-sm items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm font-extrabold text-white shadow-lg animate-in zoom-in-95 duration-150">
            <CheckCircle2 className="h-5 w-5" />
            <span>{feedbackMessage}</span>
          </div>
        ) : scanStatus === "warning" ? (
          <div className="mx-auto max-w-sm rounded-2xl bg-amber-500/90 px-4 py-3 text-xs font-bold text-stone-950 shadow-lg animate-in zoom-in-95 duration-150">
            {feedbackMessage}
          </div>
        ) : (
          <div className="mx-auto max-w-sm rounded-2xl bg-white/15 px-4 py-3 text-xs font-semibold text-white/90 backdrop-blur-md border border-white/10">
            <p className="flex items-center justify-center gap-1.5">
              <Scan className="h-4 w-4 text-emerald-400 animate-spin" style={{ animationDuration: "5s" }} />
              <span>Đưa mã QR trên thẻ bài vào giữa khung quét</span>
            </p>
          </div>
        )}

        <div className="text-[11px] text-stone-400 pt-1">
          Hỗ trợ quét thẻ bài Poly Cards hoặc mã QR in trên sản phẩm
        </div>
      </div>
    </div>
  );
}
