/**
 * Poly Cards - AR Gesture Hint Pill
 * Hiển thị thanh hướng dẫn trực quan với icon bàn tay cảm ứng. Tự động mờ dần sau 4.5s.
 */

import React, { useState, useEffect } from "react";
import { Hand, Sparkles } from "lucide-react";

interface ArGestureHintProps {
  isFreeArMode?: boolean;
  isUsingFallbackModel?: boolean;
}

export function ArGestureHint({
  isFreeArMode = false,
  isUsingFallbackModel = false,
}: ArGestureHintProps) {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    // Tự động mờ và ẩn sau 4.5 giây
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible && !isFreeArMode && !isUsingFallbackModel) return null;

  return (
    <div
      className={`absolute top-14 inset-x-0 z-25 flex flex-col items-center gap-1.5 pointer-events-none px-4 transition-opacity duration-700 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-2 rounded-full bg-stone-950/80 border border-white/20 px-3 py-1 backdrop-blur-md text-[11px] font-bold text-amber-200 shadow-xl">
        <Hand className="h-3.5 w-3.5 text-amber-400 shrink-0 animate-bounce" />
        <span>1 ngón xoay • Giữ để kéo • 2 ngón thu phóng • Chạm để chơi</span>
      </div>

      {isFreeArMode && (
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/85 border border-emerald-400/40 px-3 py-0.5 backdrop-blur-md text-[10px] font-bold text-emerald-200 shadow-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>Tương Tác Trực Tiếp 3D (Không cần thẻ)</span>
        </div>
      )}

      {isUsingFallbackModel && (
        <div className="flex items-center gap-1.5 rounded-full bg-amber-950/90 border border-amber-400/60 px-3 py-0.5 backdrop-blur-md text-[10px] font-bold text-amber-300 shadow-md">
          <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
          <span>Đang hiển thị mô hình mẫu dự phòng</span>
        </div>
      )}
    </div>
  );
}
