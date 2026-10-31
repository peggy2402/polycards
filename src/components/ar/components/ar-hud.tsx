/**
 * Poly Cards - AR Diagnostic Debug HUD
 * Hiển thị thông số thời gian thực: FPS, Trạng thái nhận diện thẻ, Camera mode, Animation clip, Tọa độ 3D.
 */

import React from "react";
import { Radio, X } from "lucide-react";

interface ArHudProps {
  isOpen: boolean;
  fps: number;
  slug: string;
  isFreeArMode: boolean;
  isUsingFallbackModel: boolean;
  isTargetFound: boolean;
  targetHitCount: number;
  playingClipName: string | null;
  animalSlug: string;
  posX: number;
  posY: number;
  zoomPercent: number;
  facingMode: "environment" | "user";
  onClose: () => void;
  onForceShow: () => void;
  onResetTransform: () => void;
  onTestSound: () => void;
}

export function ArHud({
  isOpen,
  fps,
  slug,
  isFreeArMode,
  isUsingFallbackModel,
  isTargetFound,
  targetHitCount,
  playingClipName,
  animalSlug,
  posX,
  posY,
  zoomPercent,
  facingMode,
  onClose,
  onForceShow,
  onResetTransform,
  onTestSound,
}: ArHudProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 left-3.5 z-40 max-w-xs w-[calc(100vw-28px)] rounded-2xl bg-stone-950/90 border border-amber-400/50 p-3 backdrop-blur-lg shadow-2xl text-white font-mono text-[11px] space-y-2 pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-sans font-black text-amber-400">
          <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
          <span>AR Inspector HUD</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-stone-400 font-sans">FPS: {fps}</span>
          <button
            type="button"
            onClick={onClose}
            className="h-5 w-5 rounded-md hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1 text-stone-300 text-[10px]">
        <div className="flex justify-between items-center">
          <span>Camera:</span>
          <span className="font-bold text-amber-300">
            {facingMode === "user" ? "Camera Trước (Selfie)" : "Camera Sau (World AR)"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Target MindAR:</span>
          <span className="font-bold text-amber-300 truncate max-w-[150px]">
            {slug}.mind {isFreeArMode ? "(Free AR)" : ""}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Mô hình 3D:</span>
          <span className="font-bold text-amber-300">
            {isUsingFallbackModel ? "polycards.glb (Mẫu dự phòng)" : "Chính thức"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Trạng thái quét:</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-black font-sans uppercase ${
              isTargetFound
                ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {isTargetFound ? "Đã Bắt Dính Thẻ" : "Đang Tìm Thẻ"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Số lần nhận diện:</span>
          <span className="font-bold text-white">{targetHitCount} lần</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Animation:</span>
          <span className="font-bold text-sky-300 truncate max-w-[140px]">
            {playingClipName || (animalSlug === "cat" ? "Static (Protected)" : "Default")}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Vị trí (X, Y):</span>
          <span className="text-stone-300">
            {posX.toFixed(2)}, {posY.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Tỉ lệ (Scale):</span>
          <span className="text-amber-300">{zoomPercent}%</span>
        </div>
      </div>

      <div className="pt-1 flex gap-1.5 border-t border-white/10 font-sans">
        <button
          type="button"
          onClick={onForceShow}
          className="flex-1 py-1 px-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-[10px] font-bold text-white text-center cursor-pointer"
        >
          Ép Hiện 3D
        </button>
        <button
          type="button"
          onClick={onResetTransform}
          className="py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-stone-200 cursor-pointer"
        >
          Về Tâm
        </button>
        <button
          type="button"
          onClick={onTestSound}
          className="py-1 px-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-[10px] font-bold text-stone-950 cursor-pointer"
        >
          Test Kêu
        </button>
      </div>
    </div>
  );
}
