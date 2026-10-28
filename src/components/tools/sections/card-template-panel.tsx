"use client";

import React, { useRef } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";

interface CardTemplatePanelProps {
  cardDimensions: { width: number; height: number };
  cardFileName: string;
  isDraggingOverFile: boolean;
  onSetIsDraggingOverFile: (val: boolean) => void;
  onLoadImageFile: (file: File) => void;
}

export function CardTemplatePanel({
  cardDimensions,
  cardFileName,
  isDraggingOverFile,
  onSetIsDraggingOverFile,
  onLoadImageFile,
}: CardTemplatePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-amber-400" />
          <span>2. Thẻ Bài Mẫu (Card Template)</span>
        </label>
        <span className="text-[10px] font-mono text-stone-400">
          {cardDimensions.width} x {cardDimensions.height} px
        </span>
      </div>

      {/* Dropzone Kéo Thả Ảnh Thẻ */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          onSetIsDraggingOverFile(true);
        }}
        onDragLeave={() => onSetIsDraggingOverFile(false)}
        onDrop={(e) => {
          e.preventDefault();
          onSetIsDraggingOverFile(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onLoadImageFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
          isDraggingOverFile
            ? "border-amber-400 bg-amber-500/10 scale-102"
            : "border-white/20 bg-white/5 hover:border-amber-400/60 hover:bg-white/8"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onLoadImageFile(e.target.files[0]);
            }
          }}
        />
        <Upload className="h-6 w-6 mx-auto text-amber-400 mb-1 animate-bounce" />
        <div className="text-xs font-bold text-white">
          Kéo thả ảnh thẻ bài vào đây hoặc bấm để chọn tệp
        </div>
        <p className="text-[10px] text-stone-400 mt-0.5">
          Đang nạp: <strong className="text-amber-300">{cardFileName}</strong>
        </p>
      </div>
    </div>
  );
}
