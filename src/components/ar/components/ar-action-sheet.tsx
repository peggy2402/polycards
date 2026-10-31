/**
 * Poly Cards - AR Action Clips Sheet
 * Bottom Sheet kéo lên chọn động tác cho con vật (Portrait) hoặc panel trượt phải (Landscape).
 */

import React from "react";
import { ChevronUp, ChevronDown, Activity, X } from "lucide-react";

interface ArActionSheetProps {
  isOpen: boolean;
  isLandscape?: boolean;
  clips: string[];
  activeClip: string | null;
  onSelectClip: (clipName: string) => void;
  onToggle: () => void;
}

export function getClipFriendlyLabel(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("highjump") || n.startsWith("_01a")) return "Nhảy Cao";
  if (n.includes("spin") || n.includes("360")) return "Nhảy Xoay";
  if (n.includes("jump") || n.includes("nhay")) return "Nhảy";
  if (n.includes("run") || n.includes("chay")) return "Chạy";
  if (n.includes("walk") || n.includes("di")) return "Đi bộ";
  if (n.includes("roar") || n.includes("gam")) return "Gầm";
  if (n.includes("dance") || n.includes("vua")) return "Nhảy Múa";
  if (n.includes("idle") || n.includes("stand")) return "Đứng Yên";
  return name;
}

export function ArActionSheet({
  isOpen,
  isLandscape = false,
  clips,
  activeClip,
  onSelectClip,
  onToggle,
}: ArActionSheetProps) {
  if (clips.length <= 1) return null;

  if (isLandscape) {
    // Chế độ ngang: Panel trượt từ cạnh phải
    if (!isOpen) return null;
    return (
      <div className="absolute right-18 top-16 bottom-16 z-35 w-44 rounded-3xl bg-stone-950/85 border border-white/20 p-3 backdrop-blur-lg shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <Activity className="h-3.5 w-3.5" />
            <span>Động tác</span>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
          {clips.map((clip) => {
            const isSelected = activeClip === clip;
            return (
              <button
                key={clip}
                type="button"
                onClick={() => onSelectClip(clip)}
                className={`w-full py-2 px-3 rounded-xl text-left text-xs font-black transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-400 text-stone-950 shadow-md"
                    : "bg-white/5 text-stone-300 hover:bg-white/15"
                }`}
              >
                {getClipFriendlyLabel(clip)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Chế độ dọc: Bottom Sheet kéo lên / thu gọn
  return (
    <div className="w-full flex flex-col items-center pointer-events-auto">
      {isOpen ? (
        <div className="w-full max-w-sm rounded-2xl bg-stone-950/85 border border-white/20 p-2.5 backdrop-blur-lg shadow-2xl space-y-2 animate-in slide-in-from-bottom-2 duration-200 mb-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              <span>Chọn Động Tác 3D</span>
            </span>
            <button
              type="button"
              onClick={onToggle}
              className="p-1 rounded-lg text-stone-400 hover:text-white"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-none py-0.5">
            {clips.map((clip) => {
              const isSelected = activeClip === clip;
              return (
                <button
                  key={clip}
                  type="button"
                  onClick={() => onSelectClip(clip)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-400 text-stone-950 shadow-md scale-102"
                      : "bg-white/10 text-stone-300 hover:bg-white/20"
                  }`}
                >
                  {getClipFriendlyLabel(clip)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
