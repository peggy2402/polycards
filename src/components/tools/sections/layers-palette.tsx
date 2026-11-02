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
  MessageSquare,
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

  stickerLayer: StickerLayerState | null;
  onToggleSticker: () => void;
  onRemoveSticker: () => void;
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
  stickerLayer,
  onToggleSticker,
  onRemoveSticker,
  onAddSticker,
}: LayersPaletteProps) {
  // Tính tổng số layer đang kích hoạt
  const totalLayers = (hasCardImage ? 1 : 0) + 1 + (stickerLayer ? 1 : 0);

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
        Bật/tắt biểu tượng con mắt để ẩn/hiện hoặc xóa từng lớp thành phần trên thẻ bài:
      </p>

      {/* DANH SÁCH CÁC LAYER XẾP CHỒNG (TỪ TRÊN XUỐNG DƯỚI) */}
      <div className="space-y-1.5">
        {/* LAYER 3: KHUNG THOẠI / STICKER (NẾU CÓ) */}
        {stickerLayer ? (
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              stickerLayer.isVisible
                ? "bg-amber-500/10 border-amber-400/40 text-white"
                : "bg-white/5 border-white/10 text-stone-500 opacity-60"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onToggleSticker}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  stickerLayer.isVisible
                    ? "bg-amber-400 text-stone-950 shadow-xs"
                    : "bg-white/10 text-stone-400 hover:text-white"
                }`}
                title={stickerLayer.isVisible ? "Ẩn layer sticker" : "Hiện layer sticker"}
              >
                {stickerLayer.isVisible ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-3.5 w-3.5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    {stickerLayer.name || "Khung Thoại (Speech Bubble)"}
                  </div>
                  <div className="text-[9px] font-mono text-stone-400">
                    Lớp Sticker Nổi • {Math.round(stickerLayer.width)}x{Math.round(stickerLayer.height)}%
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onRemoveSticker}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Xóa layer sticker này"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {/* LAYER 2: MÃ QR WEBAR */}
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            isQrOverlayEnabled
              ? "bg-amber-500/10 border-amber-400/40 text-white"
              : "bg-white/5 border-white/10 text-stone-500 opacity-60"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onToggleQrOverlay}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isQrOverlayEnabled
                  ? "bg-amber-400 text-stone-950 shadow-xs"
                  : "bg-white/10 text-stone-400 hover:text-white"
              }`}
              title={isQrOverlayEnabled ? "Ẩn mã QR trên thẻ" : "Hiện mã QR trên thẻ"}
            >
              {isQrOverlayEnabled ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <QrCode className="h-3.5 w-3.5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">Mã QR WebAR Ghép</div>
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
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
              title="Đặt lại vị trí QR về chuẩn góc dưới"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* LAYER 1: PHÔI THẺ BÀI (BACKGROUND LAYER) */}
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            hasCardImage && isBackgroundVisible
              ? "bg-white/8 border-white/15 text-white"
              : "bg-white/5 border-white/10 text-stone-500 opacity-60"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onToggleBackground}
              disabled={!hasCardImage}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                hasCardImage && isBackgroundVisible
                  ? "bg-emerald-500 text-stone-950 shadow-xs"
                  : "bg-white/10 text-stone-400 hover:text-white"
              }`}
              title={
                !hasCardImage
                  ? "Chưa có ảnh phôi thẻ"
                  : isBackgroundVisible
                  ? "Ẩn phôi thẻ"
                  : "Hiện phôi thẻ"
              }
            >
              {hasCardImage && isBackgroundVisible ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <ImageIcon className="h-3.5 w-3.5 text-stone-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">
                  {hasCardImage ? cardFileName : "Chưa nạp phôi thẻ"}
                </div>
                <div className="text-[9px] font-mono text-stone-400">
                  Lớp Nền Gốc (Background)
                </div>
              </div>
            </div>
          </div>

          {hasCardImage && (
            <button
              type="button"
              onClick={onRemoveBackground}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
