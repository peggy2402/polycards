"use client";

import React from "react";
import {
  Layers,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  QrCode,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { QrPosition } from "../types";

export interface StickerLayerState {
  id: string;
  name: string;
  src: string;
  isVisible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayersPaletteProps {
  cardFileName: string;
  hasCardImage: boolean;
  isBackgroundVisible: boolean;
  onToggleBackground: () => void;
  onRemoveBackground: () => void;

  isQrOverlayEnabled: boolean;
  qrPos: QrPosition;
  onToggleQrOverlay: () => void;
  onResetQrToStandard?: () => void;

  stickerLayer?: StickerLayerState | null;
  onToggleSticker?: () => void;
  onRemoveSticker?: () => void;
  onAddSticker?: () => void;
}

export function LayersPalette({
  cardFileName,
  hasCardImage,
  isBackgroundVisible,
  onToggleBackground,
  onRemoveBackground,
  isQrOverlayEnabled,
  qrPos,
  onToggleQrOverlay,
  onResetQrToStandard,
}: LayersPaletteProps) {
  // Tính tổng số layer (Lớp QR + Lớp Phôi Nền)
  const totalLayers = (hasCardImage ? 1 : 0) + 1;

  return (
    <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-amber-400" />
          <span>Lớp Layer Thẻ Bài ({totalLayers})</span>
        </label>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-stone-400 border border-white/10">
          Photoshop Style
        </span>
      </div>

      <p className="text-[11px] text-stone-400 leading-relaxed">
        Bấm vào biểu tượng <strong>con mắt 👁</strong> để ẩn / hiện từng lớp thành phần trên thẻ bài:
      </p>

      {/* DANH SÁCH CÁC LAYER XẾP CHỒNG (TỪ TRÊN XUỐNG DƯỚI) */}
      <div className="space-y-2">
        {/* ========================================================
            LAYER 2: MÃ QR WEBAR GHÉP (NẰM TRÊN)
           ======================================================== */}
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all select-none ${
            isQrOverlayEnabled
              ? "bg-amber-500/10 border-amber-400/50 shadow-sm"
              : "bg-white/5 border-white/10 opacity-60"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Nút Toggle Con Mắt Đóng / Mở To Rõ */}
            <button
              type="button"
              onClick={onToggleQrOverlay}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border-2 transition-all cursor-pointer active:scale-90 ${
                isQrOverlayEnabled
                  ? "bg-amber-400 border-amber-300 text-stone-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/30"
                  : "bg-stone-800 border-stone-600 text-stone-400 hover:text-white hover:border-white/40"
              }`}
              title={isQrOverlayEnabled ? "Nhấn để ẨN mã QR khỏi thẻ" : "Nhấn để HIỆN mã QR lên thẻ"}
            >
              {isQrOverlayEnabled ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4 text-rose-400" />
              )}
            </button>

            {/* Thông tin Layer QR */}
            <div
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
              onClick={onToggleQrOverlay}
            >
              <div
                className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${
                  isQrOverlayEnabled
                    ? "bg-amber-500/20 border-amber-400/40 text-amber-300"
                    : "bg-stone-800 border-stone-700 text-stone-500"
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold truncate ${
                      isQrOverlayEnabled ? "text-white" : "text-stone-400 line-through"
                    }`}
                  >
                    Mã QR WebAR Ghép
                  </span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                      isQrOverlayEnabled
                        ? "bg-amber-400 text-stone-950"
                        : "bg-stone-700 text-stone-400"
                    }`}
                  >
                    {isQrOverlayEnabled ? "HIỆN" : "ẨN"}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-stone-400">
                  Cỡ: {Math.round(qrPos.size)}% • X:{Math.round(qrPos.x)}% Y:{Math.round(qrPos.y)}%
                </div>
              </div>
            </div>
          </div>

          {onResetQrToStandard && (
            <button
              type="button"
              onClick={onResetQrToStandard}
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
              title="Đặt lại vị trí QR về chuẩn góc dưới bên trái"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ========================================================
            LAYER 1: PHÔI THẺ BÀI (BACKGROUND LAYER NẰM DƯỚI)
           ======================================================== */}
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all select-none ${
            hasCardImage && isBackgroundVisible
              ? "bg-emerald-500/10 border-emerald-400/40 shadow-sm"
              : "bg-white/5 border-white/10 opacity-60"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Nút Toggle Con Mắt Đóng / Mở To Rõ */}
            <button
              type="button"
              onClick={onToggleBackground}
              disabled={!hasCardImage}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border-2 transition-all cursor-pointer active:scale-90 ${
                !hasCardImage
                  ? "bg-stone-800 border-stone-700 text-stone-600 opacity-50 cursor-not-allowed"
                  : hasCardImage && isBackgroundVisible
                  ? "bg-emerald-500 border-emerald-400 text-stone-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/30"
                  : "bg-stone-800 border-stone-600 text-stone-400 hover:text-white hover:border-white/40"
              }`}
              title={
                !hasCardImage
                  ? "Chưa có ảnh phôi thẻ"
                  : isBackgroundVisible
                  ? "Nhấn để ẨN phôi nền thẻ"
                  : "Nhấn để HIỆN phôi nền thẻ"
              }
            >
              {hasCardImage && isBackgroundVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4 text-rose-400" />
              )}
            </button>

            {/* Thông tin Layer Phôi Thẻ Nền */}
            <div
              className={`flex items-center gap-2.5 min-w-0 flex-1 ${
                hasCardImage ? "cursor-pointer" : "cursor-default"
              }`}
              onClick={hasCardImage ? onToggleBackground : undefined}
            >
              <div
                className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${
                  hasCardImage && isBackgroundVisible
                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                    : "bg-stone-800 border-stone-700 text-stone-500"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold truncate ${
                      hasCardImage && isBackgroundVisible
                        ? "text-white"
                        : "text-stone-400 line-through"
                    }`}
                  >
                    {hasCardImage ? cardFileName : "Chưa nạp phôi thẻ"}
                  </span>
                  {hasCardImage && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                        isBackgroundVisible
                          ? "bg-emerald-500 text-stone-950"
                          : "bg-stone-700 text-stone-400"
                      }`}
                    >
                      {isBackgroundVisible ? "HIỆN" : "ẨN"}
                    </span>
                  )}
                </div>
                <div className="text-[9px] font-mono text-stone-400">
                  Lớp Nền Gốc (Background Template)
                </div>
              </div>
            </div>
          </div>

          {hasCardImage && (
            <button
              type="button"
              onClick={onRemoveBackground}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 ml-1"
              title="Gỡ ảnh phôi thẻ này (trở về trạng thái trống)"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
