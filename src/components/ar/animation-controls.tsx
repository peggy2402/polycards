"use client";

import React from "react";
import { Play } from "lucide-react";

interface AnimationControlsProps {
  animations: string[];
  selectedAnimation: string;
  onSelectAnimation: (anim: string) => void;
}

export function AnimationControls({
  animations,
  selectedAnimation,
  onSelectAnimation,
}: AnimationControlsProps) {
  if (!animations || animations.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-white/90 p-3.5 shadow-xs backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950 pb-2">
        <Play className="h-3.5 w-3.5 text-amber-600 fill-amber-600" />
        <span>Chuyển Động Nhân Vật (Animation):</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {animations.map((anim) => {
          const isActive = selectedAnimation === anim;
          return (
            <button
              key={anim}
              type="button"
              onClick={() => onSelectAnimation(anim)}
              className={`min-h-[36px] rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                isActive
                  ? "bg-amber-500 text-white shadow-xs shadow-amber-500/25 ring-2 ring-amber-300"
                  : "bg-amber-50 text-stone-700 hover:bg-amber-100 border border-amber-200/60"
              }`}
            >
              <span>{anim}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
