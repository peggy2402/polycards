/**
 * Poly Cards - AR Camera Hook
 * Quản lý chuyển đổi Camera Trước / Sau (Selfie Mode vs World Marker Mode)
 * và chụp ảnh kỷ niệm sắc nét không bị ngược gương (Correct Mirror Orientation).
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { ArCameraFacingMode } from "../types";

interface UseArCameraOptions {
  onShowToast?: (msg: string, type: "info" | "warning" | "error") => void;
}

export function useArCamera({ onShowToast }: UseArCameraOptions = {}) {
  const [facingMode, setFacingMode] = useState<ArCameraFacingMode>("environment");
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(true);
  const frontStreamRef = useRef<MediaStream | null>(null);

  // Kiểm tra thiết bị có nhiều hơn 1 camera hay không
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {
          setHasMultipleCameras(true);
        });
    }
  }, []);

  /**
   * Dừng luồng camera trước nếu đang chạy
   */
  const stopFrontStream = useCallback(() => {
    if (frontStreamRef.current) {
      frontStreamRef.current.getTracks().forEach((track) => track.stop());
      frontStreamRef.current = null;
    }
  }, []);

  /**
   * Khởi động luồng camera trước (Selfie Mode)
   */
  const startFrontCamera = useCallback(
    async (videoEl: HTMLVideoElement): Promise<MediaStream | null> => {
      stopFrontStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        frontStreamRef.current = stream;
        videoEl.srcObject = stream;
        videoEl.playsInline = true;
        videoEl.muted = true;
        await videoEl.play();
        return stream;
      } catch (err: any) {
        console.warn("[Front Camera Error]:", err);
        if (onShowToast) {
          onShowToast("Không thể khởi động camera trước. Đang quay lại camera sau.", "warning");
        }
        return null;
      }
    },
    [onShowToast, stopFrontStream]
  );

  /**
   * Chụp ảnh kỷ niệm chuẩn xác với lật gương tự nhiên
   */
  const capturePhoto = useCallback(
    (containerEl: HTMLElement, isFront: boolean): string | null => {
      try {
        const videoEl = containerEl.querySelector("video") as HTMLVideoElement | null;
        const canvasEl = containerEl.querySelector("canvas") as HTMLCanvasElement | null;

        if (!videoEl || !canvasEl) return null;

        const w = videoEl.videoWidth || canvasEl.width || 1280;
        const h = videoEl.videoHeight || canvasEl.height || 720;

        const captureCanvas = document.createElement("canvas");
        captureCanvas.width = w;
        captureCanvas.height = h;
        const ctx = captureCanvas.getContext("2d");
        if (!ctx) return null;

        if (isFront) {
          // Camera trước: Lật gương ảnh chụp để bé nhìn tự nhiên như soi gương
          ctx.save();
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoEl, 0, 0, w, h);
          ctx.drawImage(canvasEl, 0, 0, w, h);
          ctx.restore();
        } else {
          // Camera sau: Vẽ chuẩn thông thường
          ctx.drawImage(videoEl, 0, 0, w, h);
          ctx.drawImage(canvasEl, 0, 0, w, h);
        }

        return captureCanvas.toDataURL("image/jpeg", 0.94);
      } catch (e) {
        console.error("[Capture Photo Error]:", e);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      stopFrontStream();
    };
  }, [stopFrontStream]);

  return {
    facingMode,
    setFacingMode,
    isSwitching,
    setIsSwitching,
    hasMultipleCameras,
    startFrontCamera,
    stopFrontStream,
    capturePhoto,
  };
}
