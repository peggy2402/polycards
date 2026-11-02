/**
 * Poly Cards - AR Camera Hook
 * Quản lý chuyển đổi Camera Trước / Sau (Selfie Mode vs World Marker Mode)
 * Giải quyết triệt để lỗi camera đen khi lật trước/sau:
 * - Giải phóng hardware stream cũ với độ trễ 200ms trên iOS Safari.
 * - Token chống race condition khi bấm nhanh liên tục.
 * - Điều khiển tạm dừng MindAR khi ở Selfie và phục hồi khi về Camera sau.
 * - Tự động phục hồi luồng video khi tab active trở lại (visibilitychange).
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { ArCameraFacingMode } from "../types";

interface UseArCameraOptions {
  onShowToast?: (msg: string, type: "info" | "warning" | "error" | "success") => void;
}

export function useArCamera({ onShowToast }: UseArCameraOptions = {}) {
  const [facingMode, setFacingMode] = useState<ArCameraFacingMode>("environment");
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(true);

  const activeStreamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const mindarRef = useRef<any>(null);
  const switchTokenRef = useRef<number>(0);
  const facingModeRef = useRef<ArCameraFacingMode>("environment");
  facingModeRef.current = facingMode;

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
   * Helper dừng toàn bộ các MediaStreamTrack của một stream
   */
  const stopStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
    } catch {}
  }, []);

  /**
   * Hàm chuyển đổi Camera Trước / Sau chuẩn xác, chống race condition và màn hình đen
   */
  const switchCamera = useCallback(
    async (
      target: ArCameraFacingMode,
      videoEl: HTMLVideoElement,
      mindarThreeInstance?: any
    ): Promise<boolean> => {
      if (isSwitching) return false;

      const currentToken = ++switchTokenRef.current;
      setIsSwitching(true);
      videoElRef.current = videoEl;
      if (mindarThreeInstance) {
        mindarRef.current = mindarThreeInstance;
      }

      const prevFacing = facingModeRef.current;

      try {
        // 1. Tạm dừng MindAR controller để không tiếp tục xử lý frame cũ
        if (mindarThreeInstance?.controller) {
          try {
            mindarThreeInstance.controller.stopProcessVideo();
          } catch {}
        }

        // 2. Dừng toàn bộ tracks hiện tại trên videoEl và activeStream
        if (videoEl.srcObject instanceof MediaStream) {
          stopStream(videoEl.srcObject);
        }
        stopStream(activeStreamRef.current);
        activeStreamRef.current = null;
        videoEl.srcObject = null;

        // 3. Chờ 200ms để iOS Safari giải phóng phần cứng camera (tránh lỗi NotReadableError)
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (currentToken !== switchTokenRef.current) return false;

        // 4. Yêu cầu luồng Camera mới
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: target },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (currentToken !== switchTokenRef.current) {
          stopStream(newStream);
          return false;
        }

        activeStreamRef.current = newStream;
        videoEl.srcObject = newStream;
        videoEl.muted = true;
        videoEl.defaultMuted = true;
        videoEl.playsInline = true;
        videoEl.setAttribute("playsinline", "true");
        videoEl.setAttribute("webkit-playsinline", "true");
        videoEl.setAttribute("x5-playsinline", "true");
        videoEl.setAttribute("disablePictureInPicture", "true");
        videoEl.setAttribute("disableRemotePlayback", "true");
        videoEl.controls = false;
        videoEl.style.pointerEvents = "none";

        await videoEl.play();

        // 5. Cập nhật MindAR theo chế độ mới
        if (mindarThreeInstance) {
          if (target === "user") {
            // Ở chế độ selfie: Dừng nhận diện marker
            try {
              mindarThreeInstance.controller?.stopProcessVideo?.();
            } catch {}
          } else {
            // Khi quay lại camera sau: Khởi động lại luồng quét thẻ
            try {
              mindarThreeInstance.controller?.processVideo?.(videoEl);
            } catch {}
          }

          // Căn chỉnh lại canvas và kích thước video
          try {
            mindarThreeInstance.resize?.();
          } catch {}
        }

        setFacingMode(target);
        facingModeRef.current = target;
        setIsSwitching(false);

        if (onShowToast) {
          onShowToast(
            target === "user"
              ? "Đã chuyển sang Camera trước (Selfie - Cảm biến xoay tạm tắt)"
              : "Đã chuyển về Camera sau",
            "info"
          );
        }

        return true;
      } catch (err: any) {
        console.warn("[Camera Switch Error]:", err);

        // Khôi phục lại chế độ trước đó nếu lỗi
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: prevFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          activeStreamRef.current = fallbackStream;
          videoEl.srcObject = fallbackStream;
          await videoEl.play();

          if (prevFacing === "environment" && mindarThreeInstance?.controller) {
            mindarThreeInstance.controller.processVideo?.(videoEl);
          }
        } catch {}

        setIsSwitching(false);
        if (onShowToast) {
          onShowToast("Không thể chuyển đổi camera. Đã giữ nguyên chế độ hiện tại.", "warning");
        }
        return false;
      }
    },
    [isSwitching, onShowToast, stopStream]
  );

  /**
   * Tự động phục hồi luồng video khi tab active trở lại (visibilitychange)
   */
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;

      const video = videoElRef.current;
      if (!video) return;

      const stream = activeStreamRef.current || (video.srcObject as MediaStream | null);
      const isDead =
        !stream ||
        video.paused ||
        stream.getTracks().some((t) => t.readyState === "ended");

      if (isDead && video) {
        console.log("[useArCamera] Tab active lại, khôi phục luồng camera...");
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: facingModeRef.current },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          activeStreamRef.current = newStream;
          video.srcObject = newStream;
          video.muted = true;
          video.defaultMuted = true;
          video.playsInline = true;
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          video.setAttribute("x5-playsinline", "true");
          video.setAttribute("disablePictureInPicture", "true");
          video.setAttribute("disableRemotePlayback", "true");
          video.controls = false;
          video.style.pointerEvents = "none";
          await video.play();

          if (facingModeRef.current === "environment" && mindarRef.current?.controller) {
            mindarRef.current.controller.processVideo?.(video);
          }
        } catch (err) {
          console.warn("[useArCamera] Lỗi khôi phục camera sau visibilitychange:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /**
   * Chụp ảnh kỷ niệm chuẩn xác:
   * - Nếu Selfie: Video lật gương còn Canvas 3D KHÔNG lật (đúng hướng mô hình)
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
          // Lật gương phần video nền selfie để tự nhiên như gương
          ctx.save();
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoEl, 0, 0, w, h);
          ctx.restore();

          // Vẽ canvas 3D giữ nguyên không lật (chữ, con vật không bị lộn ngược)
          ctx.drawImage(canvasEl, 0, 0, w, h);
        } else {
          // Camera sau: Vẽ video và canvas chuẩn
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

  // Cleanup khi unmount: dừng toàn bộ tracks
  useEffect(() => {
    return () => {
      stopStream(activeStreamRef.current);
      if (videoElRef.current?.srcObject instanceof MediaStream) {
        stopStream(videoElRef.current.srcObject);
      }
    };
  }, [stopStream]);

  return {
    facingMode,
    setFacingMode,
    isSwitching,
    hasMultipleCameras,
    switchCamera,
    capturePhoto,
    registerVideoElement: (el: HTMLVideoElement | null) => {
      videoElRef.current = el;
    },
    registerMindarInstance: (instance: any) => {
      mindarRef.current = instance;
    },
  };
}
