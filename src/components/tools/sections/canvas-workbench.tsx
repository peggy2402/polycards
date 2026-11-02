"use client";

import React, { RefObject, useRef } from "react";
import {
  Sliders,
  Eye,
  QrCode,
  CheckCircle2,
  Sparkles,
  Check,
  Upload,
  MessageSquare,
} from "lucide-react";
import { QrPosition } from "../types";
import { StickerLayerState } from "./layers-palette";

interface CanvasWorkbenchProps {
  canvasContainerRef: RefObject<HTMLDivElement | null>;
  cardElementRef: RefObject<HTMLDivElement | null>;
  cardImageSrc: string;
  cardDimensions: { width: number; height: number };
  qrDataUrl: string;
  qrPos: QrPosition;
  isQrOverlayEnabled: boolean;
  isPreviewFinal: boolean;
  cardHasBakedQr?: boolean;
  isBackgroundVisible?: boolean;
  stickerLayer?: StickerLayerState | null;

  onSetIsPreviewFinal: (val: boolean) => void;
  onToggleQrOverlay: () => void;
  onPointerDownQr: (e: React.PointerEvent) => void;
  onResizePointerDown: (handle: string, e: React.PointerEvent) => void;
  onWorkspacePointerMove: (e: React.PointerEvent) => void;
  onWorkspacePointerUp: (e: React.PointerEvent) => void;
  onUploadCleanTemplate?: (file: File) => void;
  onRestoreOriginalImage?: () => void;
  onResetQrToStandard?: () => void;

  onPointerDownSticker?: (e: React.PointerEvent) => void;
}

export function CanvasWorkbench({
  canvasContainerRef,
  cardElementRef,
  cardImageSrc,
  cardDimensions,
  qrDataUrl,
  qrPos,
  isQrOverlayEnabled,
  isPreviewFinal,
  cardHasBakedQr = false,
  isBackgroundVisible = true,
  stickerLayer = null,
  onSetIsPreviewFinal,
  onToggleQrOverlay,
  onPointerDownQr,
  onResizePointerDown,
  onWorkspacePointerMove,
  onWorkspacePointerUp,
  onUploadCleanTemplate,
  onRestoreOriginalImage,
  onResetQrToStandard,
  onPointerDownSticker,
}: CanvasWorkbenchProps) {
  const cleanFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadCleanTemplate) {
      onUploadCleanTemplate(file);
    }
    e.target.value = "";
  };

  const hasBackground = Boolean(cardImageSrc && cardImageSrc.trim() !== "");

  return (
    <div
      ref={canvasContainerRef}
      onPointerMove={onWorkspacePointerMove}
      onPointerUp={onWorkspacePointerUp}
      className="w-full h-full bg-stone-950 p-3 sm:p-6 flex flex-col items-center justify-center relative select-none overflow-hidden min-h-[520px]"
    >
      <input
        ref={cleanFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Thanh HUD Điều Khiển Canvas & Chế Độ Xem (Chỉnh Sửa vs Xem Thẻ FINAL) */}
      <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Nhóm Nút Điều Khiển */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-stone-900/90 border border-white/20 backdrop-blur-md shadow-2xl pointer-events-auto">
            <button
              type="button"
              onClick={() => onSetIsPreviewFinal(false)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                !isPreviewFinal
                  ? "bg-amber-500 text-stone-950 font-black shadow-md"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Chế Độ Chỉnh Sửa</span>
            </button>

            <button
              type="button"
              onClick={() => onSetIsPreviewFinal(true)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isPreviewFinal
                  ? "bg-emerald-500 text-stone-950 font-black shadow-md"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Xem Thẻ FINAL</span>
            </button>

            <button
              type="button"
              onClick={onToggleQrOverlay}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isQrOverlayEnabled
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-white/5 text-stone-400 hover:text-white border border-white/10"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Mã QR Ghép: {isQrOverlayEnabled ? "BẬT" : "TẮT"}</span>
            </button>
          </div>
        </div>

        {/* Chỉ dẫn hoặc Badge trạng thái */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full bg-stone-900/90 border border-white/20 px-3.5 py-1.5 backdrop-blur-md text-xs text-stone-200 shadow-2xl pointer-events-auto">
            {!hasBackground ? (
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Upload className="h-4 w-4" />
                <span>Kéo thả ảnh hoặc chọn file ở panel bên phải</span>
              </span>
            ) : !isQrOverlayEnabled ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Đang hiển thị thẻ nguyên bản (Dùng mã QR đã có sẵn trên thẻ)</span>
              </span>
            ) : isPreviewFinal ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Chế Độ Soát Thẻ FINAL: 100% Sạch Bụi, Không Viền, Chuẩn In Xưởng</span>
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>
                  Kéo ở giữa để <strong>di chuyển</strong> • Kéo 4 góc để <strong>đổi cỡ (1:1)</strong>
                </span>
                <span className="hidden sm:inline text-amber-300 font-mono text-[10px] pl-1 border-l border-white/20">
                  Giữ phím <strong>Alt</strong> để co giãn từ tâm
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VÙNG CHẾ BẢN THẺ BÀI CHÍNH (Card Canvas Frame) */}
      <div
        ref={cardElementRef}
        className={`relative max-h-[76vh] w-auto aspect-[709/1024] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-2 transition-all select-none ${
          isPreviewFinal ? "border-emerald-500/60 ring-4 ring-emerald-500/20" : "border-white/20"
        } bg-stone-900 flex items-center justify-center`}
        style={{
          aspectRatio: `${cardDimensions.width} / ${cardDimensions.height}`,
        }}
      >
        {/* 1. Lớp Ảnh Thẻ Mẫu Bên Dưới (Nền Phôi Thẻ) */}
        {hasBackground && isBackgroundVisible ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cardImageSrc}
            alt="Thẻ Bài AR Poly Cards"
            draggable={false}
            className="w-full h-full object-cover pointer-events-none select-none block"
          />
        ) : (
          /* TRẠNG THÁI CHƯA CÓ PHÔI THẺ THEO YÊU CẦU NGƯỜI DÙNG */
          <div
            onClick={() => cleanFileInputRef.current?.click()}
            className="w-full h-full border-2 border-dashed border-amber-400/40 rounded-3xl p-6 flex flex-col items-center justify-center text-center bg-gradient-to-b from-stone-900/60 to-black/80 hover:bg-stone-900/90 hover:border-amber-400 transition-all cursor-pointer group"
          >
            <div className="h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform shadow-lg">
              <Upload className="h-8 w-8" />
            </div>
            <p className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
              kéo thả ảnh hoặc chọn file ở panel bên phải
            </p>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              Hỗ trợ phôi in PNG 1:1, JPG sắc nét chuẩn tỉ lệ xưởng in Poly Cards
            </p>
          </div>
        )}

        {/* 2. LỚP KHUNG THOẠI / STICKER HỌA TIẾT (Speech Bubble Layer - Ảnh 4) */}
        {stickerLayer && stickerLayer.isVisible && (
          <div
            onPointerDown={!isPreviewFinal ? onPointerDownSticker : undefined}
            className={`absolute z-15 select-none touch-none ${
              !isPreviewFinal ? "cursor-move group/sticker" : "pointer-events-none"
            }`}
            style={{
              left: `${stickerLayer.x}%`,
              top: `${stickerLayer.y}%`,
              width: `${stickerLayer.width}%`,
              height: `${(stickerLayer.height * cardDimensions.width) / cardDimensions.height}%`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stickerLayer.src}
              alt={stickerLayer.name}
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
            />
            {!isPreviewFinal && (
              <div className="absolute inset-0 rounded-lg border border-dashed border-sky-400/80 pointer-events-none opacity-0 group-hover/sticker:opacity-100 transition-opacity" />
            )}
          </div>
        )}

        {/* 3. Lớp Mã QR Nổi Bên Trên Có Thể Kéo Thả & Co Giãn 1:1 */}
        {isQrOverlayEnabled && (
          <div
            onPointerDown={!isPreviewFinal ? onPointerDownQr : undefined}
            className={`absolute z-20 select-none touch-none ${
              !isPreviewFinal ? "cursor-move group/qr" : "pointer-events-none"
            }`}
            style={{
              left: `${qrPos.x}%`,
              top: `${qrPos.y}%`,
              width: `${qrPos.size}%`,
              height: `${(qrPos.size * cardDimensions.width) / cardDimensions.height}%`,
            }}
          >
            {/* Ảnh Mã QR Thực Tế */}
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR Code"
                draggable={false}
                className="w-full h-full object-contain pointer-events-none select-none block"
              />
            )}

            {/* Bounding Box & 4 Núm Kéo khi chỉnh sửa */}
            {!isPreviewFinal && (
              <>
                <div className="absolute inset-0 rounded-xl border-2 border-dashed border-amber-400/90 pointer-events-none shadow-[0_0_15px_rgba(251,191,36,0.45)] group-hover/qr:border-amber-300" />

                <div
                  onPointerDown={(e) => onResizePointerDown("nw", e)}
                  className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                  title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
                />
                <div
                  onPointerDown={(e) => onResizePointerDown("ne", e)}
                  className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                  title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
                />
                <div
                  onPointerDown={(e) => onResizePointerDown("se", e)}
                  className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                  title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
                />
                <div
                  onPointerDown={(e) => onResizePointerDown("sw", e)}
                  className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                  title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
                />

                <div className="absolute -bottom-7 inset-x-0 flex justify-center pointer-events-none opacity-0 group-hover/qr:opacity-100 transition-opacity">
                  <span className="px-2 py-0.5 rounded-md bg-stone-900/95 text-amber-300 font-mono text-[9px] shadow-lg border border-amber-400/40 whitespace-nowrap">
                    QR 1:1 • {Math.round(qrPos.size)}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Thanh Thông Tin Chân Canvas */}
      <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 z-20 flex items-center justify-between pointer-events-none text-[11px] text-stone-400">
        <div className="bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto">
          {isQrOverlayEnabled ? (
            <>
              Tọa độ QR: <span className="font-mono text-amber-300">X: {Math.round(qrPos.x)}%, Y: {Math.round(qrPos.y)}%</span>
            </>
          ) : (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="h-3 w-3" />
              <span>Dùng mã QR gốc trên thẻ bài</span>
            </span>
          )}
        </div>
        <div className="bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto">
          Độ phân giải: <span className="font-mono text-emerald-400">{cardDimensions.width} x {cardDimensions.height} px</span>
        </div>
      </div>
    </div>
  );
}
