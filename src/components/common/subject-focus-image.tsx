"use client";

import React, { useState, useEffect } from "react";
import { resolveValidProductImage } from "@/lib/products-store";

/**
 * Kiểm tra xem đường dẫn ảnh có phải là phôi thẻ in đầy đủ
 * (chứa nhân vật góc trên-trái, ô từ vựng bên phải và mã QR góc dưới-trái) hay không.
 */
export function isPrintedCardLayoutImage(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();

  // Ảnh minh họa nhân vật/động vật độc lập không chứa mã QR hay khung chữ
  if (
    lower.startsWith("/images/animals/") ||
    lower.startsWith("/images/posters/") ||
    lower.includes("-subject") ||
    lower.includes("-avatar") ||
    lower.includes("-raw") ||
    lower.includes("/raw/")
  ) {
    return false;
  }

  // Ảnh phôi thẻ hoặc ảnh xuất từ Bàn Chế Bản Studio
  if (
    lower.includes("/images/cards/") ||
    lower.includes("-card") ||
    lower.includes("-template") ||
    lower.includes("/api/tools/upload") ||
    lower.startsWith("data:image/")
  ) {
    return true;
  }

  return false;
}

// Bộ nhớ đệm toàn cục lưu ảnh nhân vật đã cắt sạch QR để không phải xử lý lại khi chuyển trang
const croppedSubjectCache = new Map<string, string>();

interface SubjectFocusImageProps {
  rawUrl?: string;
  primaryUrl?: string;
  secondaryUrl?: string;
  fallbackUrl?: string;
  alt: string;
  className?: string;
}

/**
 * Component hiển thị ảnh tập trung 100% vào nhân vật / vật thể 3D chính trong thẻ,
 * tự động loại bỏ vùng mã QR và các ô chữ rườm rà nếu nguồn ảnh là phôi thẻ in.
 */
export function SubjectFocusImage({
  rawUrl,
  primaryUrl,
  secondaryUrl,
  fallbackUrl = "/images/cards/lion-card.jpg",
  alt,
  className = "",
}: SubjectFocusImageProps) {
  // Ưu tiên cao nhất là rawUrl (ảnh nhân vật gốc không có khung QR)
  const initialSrc =
    (rawUrl && rawUrl.trim() !== "")
      ? rawUrl
      : resolveValidProductImage(primaryUrl, secondaryUrl, fallbackUrl);

  const [activeSrc, setActiveSrc] = useState<string>(initialSrc);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(
    () => croppedSubjectCache.get(initialSrc) || null
  );
  const [cropFailed, setCropFailed] = useState<boolean>(false);

  useEffect(() => {
    const nextSrc =
      (rawUrl && rawUrl.trim() !== "")
        ? rawUrl
        : resolveValidProductImage(primaryUrl, secondaryUrl, fallbackUrl);
    setActiveSrc(nextSrc);
    setCroppedUrl(croppedSubjectCache.get(nextSrc) || null);
    setCropFailed(false);
  }, [rawUrl, primaryUrl, secondaryUrl, fallbackUrl]);

  // Nếu là rawUrl thì tuyệt đối không cần cắt xén
  const needsCrop = Boolean(!rawUrl && isPrintedCardLayoutImage(activeSrc));

  useEffect(() => {
    if (!needsCrop) {
      setCroppedUrl(null);
      return;
    }

    const cached = croppedSubjectCache.get(activeSrc);
    if (cached) {
      setCroppedUrl(cached);
      return;
    }

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;

        // Vùng nhân vật chuẩn trên phôi thẻ Poly Cards:
        // X: 2% -> 55.5% (loại bỏ hoàn toàn 3 ô từ vựng bên phải từ 56.5%+)
        // Y: 1% -> 65.0% (loại bỏ hoàn toàn khung mã QR góc dưới-trái từ 66%+ và hộp giải nghĩa)
        const sx = Math.round(w * 0.02);
        const sy = Math.round(h * 0.01);
        const sw = Math.max(1, Math.round(w * 0.535));
        const sh = Math.max(1, Math.round(h * 0.64));

        const minTargetRatio = 0.86;
        const currentRatio = sw / sh;
        const targetW =
          currentRatio < minTargetRatio ? Math.round(sh * minTargetRatio) : sw;
        const targetH = sh;

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        if (targetW > sw) {
          const blurCanvas = document.createElement("canvas");
          blurCanvas.width = 24;
          blurCanvas.height = 28;
          const blurCtx = blurCanvas.getContext("2d");
          if (blurCtx) {
            blurCtx.imageSmoothingEnabled = true;
            blurCtx.drawImage(img, sx, sy, sw, sh, 0, 0, 24, 28);
            ctx.drawImage(blurCanvas, 0, 0, 24, 28, 0, 0, targetW, targetH);
          }

          const offsetX = Math.round((targetW - sw) / 2);
          ctx.drawImage(img, sx, sy, sw, sh, offsetX, 0, sw, targetH);
        } else {
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        }

        const resultDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        croppedSubjectCache.set(activeSrc, resultDataUrl);
        if (!cancelled) {
          setCroppedUrl(resultDataUrl);
        }
      } catch {
        // Trình duyệt chặn canvas (CORS R2): Giữ chế độ CSS crop bên dưới, KHÔNG đổi sang jump-template!
        if (!cancelled) setCropFailed(true);
      }
    };

    img.onerror = () => {
      // Khi CORS chặn img.crossOrigin="anonymous": Giữ ảnh gốc và dùng CSS crop!
      if (!cancelled) {
        setCropFailed(true);
      }
    };

    img.src = activeSrc;

    return () => {
      cancelled = true;
    };
  }, [activeSrc, needsCrop, fallbackUrl]);

  // 1. Ảnh minh họa nhân vật gốc hoặc ảnh đã cắt sạch QR qua Canvas
  if (!needsCrop || (croppedUrl && !cropFailed)) {
    const displaySrc = croppedUrl || activeSrc;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={displaySrc}
        alt={alt}
        className={`h-full w-full object-cover object-[50%_22%] ${className}`}
      />
    );
  }

  // 2. Fallback tức thì trong lúc SSR / vài mili-giây đầu trước khi Canvas cắt xong:
  // Phóng trực tiếp vào góc trên-trái (2%..55.5% ngang, 1%..65% dọc) để tuyệt đối không nháy mã QR
  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activeSrc}
        alt={alt}
        onError={() => {
          if (activeSrc !== fallbackUrl) {
            setActiveSrc(fallbackUrl);
          }
        }}
        style={{
          position: "absolute",
          left: "-3.7%",
          top: "-1.6%",
          width: "187%",
          height: "156%",
          maxWidth: "none",
        }}
        className="object-fill select-none pointer-events-none"
      />
    </div>
  );
}

