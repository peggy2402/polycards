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
  Eraser,
  Target,
  ImagePlus,
  AlertTriangle,
} from "lucide-react";
import { QrPosition } from "../types";

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
  onSetIsPreviewFinal: (val: boolean) => void;
  onToggleQrOverlay: () => void;
  onPointerDownQr: (e: React.PointerEvent) => void;
  onResizePointerDown: (handle: string, e: React.PointerEvent) => void;
  onWorkspacePointerMove: (e: React.PointerEvent) => void;
  onWorkspacePointerUp: (e: React.PointerEvent) => void;
  onUploadCleanTemplate?: (file: File) => void;
  onCleanOldQrPatch?: () => void;
  onResetQrToStandard?: () => void;
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
  onSetIsPreviewFinal,
  onToggleQrOverlay,
  onPointerDownQr,
  onResizePointerDown,
  onWorkspacePointerMove,
  onWorkspacePointerUp,
  onUploadCleanTemplate,
  onCleanOldQrPatch,
  onResetQrToStandard,
}: CanvasWorkbenchProps) {
  const cleanFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadCleanTemplate) {
      onUploadCleanTemplate(file);
    }
    e.target.value = "";
  };

  return (
    <div
      ref={canvasContainerRef}
      onPointerMove={onWorkspacePointerMove}
      onPointerUp={onWorkspacePointerUp}
      className="lg:col-span-7 xl:col-span-8 bg-stone-950 p-4 sm:p-8 flex flex-col items-center justify-center relative select-none overflow-hidden min-h-[500px]"
    >
      <input
        ref={cleanFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Thanh HUD Điều Khiển Canvas & Chế Độ Xem (Chỉnh Sửa vs Xem Thẻ FINAL) */}
      <div className="absolute top-4 inset-x-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Nhóm Nút Điều Khiển: Chế độ sửa, Xem Thẻ Final, Bật/Tắt Lớp QR Ghép */}
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
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isPreviewFinal
                  ? "bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/25"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Xem Thẻ FINAL</span>
            </button>

            {/* Nút Toggle Bật/Tắt Lớp Ghép Mã QR */}
            <button
              type="button"
              onClick={onToggleQrOverlay}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isQrOverlayEnabled
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
              }`}
              title="Bật/Tắt lớp mã QR ghép thêm nếu ảnh thẻ đã có sẵn mã QR để tránh bị lặp 2 mã"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>
                {isQrOverlayEnabled ? "Mã QR Ghép: BẬT" : "DÙNG QR CÓ SẴN (Ẩn QR Ghép)"}
              </span>
            </button>
          </div>

          {/* Nhóm Nút Khắc Phục Lỗi Phôi Thẻ: Nạp Phôi Sạch Mới & Vá QR Cũ */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-stone-900/90 border border-white/20 backdrop-blur-md shadow-2xl pointer-events-auto">
            {onUploadCleanTemplate && (
              <button
                type="button"
                onClick={() => cleanFileInputRef.current?.click()}
                className="py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/40 hover:bg-blue-500/30 cursor-pointer shadow-sm"
                title="Tải ảnh phôi sạch (chưa gắn mã QR) từ máy tính để mã QR mới nổi bên trên sắc nét, không bị đè"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                <span>Thay Phôi Sạch Mới</span>
              </button>
            )}

            {onCleanOldQrPatch && (
              <button
                type="button"
                onClick={onCleanOldQrPatch}
                className="py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border border-purple-400/40 hover:bg-purple-500/30 cursor-pointer shadow-sm"
                title="Tự động tẩy sạch vùng mã QR cũ bị lệch trên thẻ bài bằng màu nền ô vàng chuẩn, đưa thẻ về trạng thái phôi sạch"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>Tẩy QR Cũ Bị Lệch</span>
              </button>
            )}

            {onResetQrToStandard && (
              <button
                type="button"
                onClick={onResetQrToStandard}
                className="py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 cursor-pointer shadow-sm"
                title="Căn mã QR vào vị trí trung tâm ô vàng chuẩn của thẻ bài Poly Cards"
              >
                <Target className="h-3.5 w-3.5" />
                <span>Ô Vàng Chuẩn</span>
              </button>
            )}
          </div>
        </div>

        {/* Cảnh báo thông minh nếu ảnh thẻ đang bị dính mã QR cũ */}
        {cardHasBakedQr && !isPreviewFinal && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-500/20 border border-amber-400/50 px-3.5 py-2 backdrop-blur-md text-xs text-amber-200 shadow-xl pointer-events-auto">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Ảnh này <strong>đã bị in sẵn mã QR</strong>. Nếu mã QR cũ bị to hoặc lệch, hãy dùng:
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onUploadCleanTemplate && (
                <button
                  type="button"
                  onClick={() => cleanFileInputRef.current?.click()}
                  className="px-2 py-1 rounded-lg bg-amber-400 text-stone-950 font-black text-[11px] hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  Tải Phôi Sạch
                </button>
              )}
              {onCleanOldQrPatch && (
                <button
                  type="button"
                  onClick={onCleanOldQrPatch}
                  className="px-2 py-1 rounded-lg bg-purple-500 text-white font-black text-[11px] hover:bg-purple-400 transition-colors cursor-pointer"
                >
                  Tẩy QR Cũ
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chỉ dẫn hoặc Badge trạng thái */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full bg-stone-900/90 border border-white/20 px-3.5 py-1.5 backdrop-blur-md text-xs text-stone-200 shadow-2xl pointer-events-auto">
            {!isQrOverlayEnabled ? (
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
        className={`relative max-h-[82vh] w-auto aspect-[709/1024] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-2 transition-all select-none ${
          isPreviewFinal ? "border-emerald-500/60 ring-4 ring-emerald-500/20" : "border-white/20"
        } bg-stone-900`}
        style={{
          aspectRatio: `${cardDimensions.width} / ${cardDimensions.height}`,
        }}
      >
        {/* 1. Lớp Ảnh Thẻ Mẫu Bên Dưới */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardImageSrc}
          alt="Thẻ Bài AR Poly Cards"
          draggable={false}
          className="w-full h-full object-cover pointer-events-none select-none block"
        />

        {/* 2. Lớp Mã QR Nổi Bên Trên Có Thể Kéo Thả & Co Giãn 1:1 (Chỉ hiển thị khi bật ghép QR) */}
        {isQrOverlayEnabled && (
          <div
            onPointerDown={!isPreviewFinal ? onPointerDownQr : undefined}
            className={`absolute z-10 select-none touch-none ${
              !isPreviewFinal ? "cursor-move group" : "pointer-events-none"
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

            {/* Chỉ hiển thị Bounding Box & 4 Núm Kéo khi KHÔNG ở chế độ xem Thẻ FINAL */}
            {!isPreviewFinal && (
              <>
                {/* Khung Viền Chọn Tương Tác (Selection Border) */}
                <div className="absolute inset-0 rounded-xl border-2 border-dashed border-amber-400/90 pointer-events-none shadow-[0_0_15px_rgba(251,191,36,0.45)] group-hover:border-amber-300" />

                {/* 4 Núm Kéo Góc Giữ Tỉ Lệ 1:1 (Handles) */}
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

                {/* Huy hiệu hiển thị kích thước trực tiếp khi rê chuột */}
                <div className="absolute -bottom-7 inset-x-0 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-2 py-0.5 rounded-md bg-stone-900/95 text-amber-300 font-mono text-[9px] shadow-lg border border-amber-400/40 whitespace-nowrap">
                    QR 1:1 • {qrPos.size}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Thanh Thông Tin Chân Canvas */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none text-[11px] text-stone-400">
        <div className="bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto">
          {isQrOverlayEnabled ? (
            <>
              Tọa độ: <span className="font-mono text-amber-300">X: {qrPos.x}%, Y: {qrPos.y}%</span>
            </>
          ) : (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="h-3 w-3" />
              <span>Dùng mã QR gốc trên thẻ bài</span>
            </span>
          )}
        </div>
        <div className="bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto">
          Độ phân giải xuất: <span className="font-mono text-emerald-400">{cardDimensions.width} x {cardDimensions.height} px</span>
        </div>
      </div>
    </div>
  );
}
