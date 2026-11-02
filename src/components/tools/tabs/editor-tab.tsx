"use client";

import React, { RefObject, useState } from "react";
import Link from "next/link";
import { Receipt, ArrowRight, Sliders, Eye, Layers, Upload, Sparkles } from "lucide-react";
import { Animal } from "@/types/animal";
import { PrintQueueItem, QrPosition } from "../types";
import { QrConfigPanel } from "../sections/qr-config-panel";
import { LayersPalette, StickerLayerState } from "../sections/layers-palette";
import { CanvasWorkbench } from "../sections/canvas-workbench";
import { AssetsTemplatesPanel } from "../sections/assets-templates-panel";

interface EditorTabProps {
  // QR Config State & Handlers
  qrGeneratedCount: number;
  slug: string;
  directAr: boolean;
  includeLicense: boolean;
  licenseCode: string;
  isGeneratingQr: boolean;
  qrDataUrl: string;
  targetUrl: string;
  copiedUrl: boolean;
  onSetSlug: (slug: string) => void;
  onSetDirectAr: (val: boolean) => void;
  onSetIncludeLicense: (val: boolean) => void;
  onSetLicenseCode: (code: string) => void;
  onGenerateQr: () => void;
  onDownloadQrPng: () => void;
  onCopyUrl: () => void;

  // Dữ liệu sản phẩm để validate trùng slug & nạp phôi
  existingCards?: Animal[];
  onSelectExistingCard?: (card: Animal) => void;

  // Card Template State & Handlers
  cardDimensions: { width: number; height: number };
  cardFileName: string;
  isDraggingOverFile: boolean;
  onSetIsDraggingOverFile: (val: boolean) => void;
  onLoadImageFile: (file: File) => void;

  // Layers Palette State & Handlers
  isBackgroundVisible: boolean;
  onToggleBackground: () => void;
  onRemoveBackground: () => void;
  stickerLayer: StickerLayerState | null;
  onToggleSticker: () => void;
  onRemoveSticker: () => void;
  onAddSpeechBubbleSticker: () => void;

  // Print & Export State & Handlers
  qrPos: QrPosition;
  isQrOverlayEnabled: boolean;
  isExporting: boolean;
  isAddingToQueue: boolean;
  copiedImage: boolean;
  printQueue: PrintQueueItem[];
  isQueueExpanded: boolean;
  zipFileName: string;
  isGeneratingZip: boolean;
  onSetQrPos: (pos: QrPosition) => void;
  onAutoSnap: () => void;
  onToggleQrOverlay: () => void;
  onDownloadCard: () => void;
  onAddToPrintQueue: () => void;
  onCopyImage: () => void;
  onPrint: () => void;
  onSetIsQueueExpanded: (val: boolean) => void;
  onSetZipFileName: (name: string) => void;
  onRemoveQueueItem: (id: string) => void;
  onDownloadZip: () => void;
  onClearQueue: () => void;
  onOpenPublishModal: () => void;

  // Canvas Workbench State & Handlers
  canvasContainerRef: RefObject<HTMLDivElement | null>;
  cardElementRef: RefObject<HTMLDivElement | null>;
  cardImageSrc: string;
  isPreviewFinal: boolean;
  cardHasBakedQr?: boolean;
  onSetIsPreviewFinal: (val: boolean) => void;
  onPointerDownQr: (e: React.PointerEvent) => void;
  onResizePointerDown: (handle: string, e: React.PointerEvent) => void;
  onWorkspacePointerMove: (e: React.PointerEvent) => void;
  onWorkspacePointerUp: (e: React.PointerEvent) => void;
  onUploadCleanTemplate?: (file: File) => void;
  onRestoreOriginalImage?: () => void;
  onResetQrToStandard?: () => void;
  onPointerDownSticker?: (e: React.PointerEvent) => void;
}

export function EditorTab({
  qrGeneratedCount,
  slug,
  directAr,
  includeLicense,
  licenseCode,
  isGeneratingQr,
  qrDataUrl,
  targetUrl,
  copiedUrl,
  onSetSlug,
  onSetDirectAr,
  onSetIncludeLicense,
  onSetLicenseCode,
  onGenerateQr,
  onDownloadQrPng,
  onCopyUrl,
  existingCards = [],
  onSelectExistingCard,
  cardDimensions,
  cardFileName,
  isDraggingOverFile,
  onSetIsDraggingOverFile,
  onLoadImageFile,
  isBackgroundVisible,
  onToggleBackground,
  onRemoveBackground,
  stickerLayer,
  onToggleSticker,
  onRemoveSticker,
  onAddSpeechBubbleSticker,
  qrPos,
  isQrOverlayEnabled,
  isExporting,
  isAddingToQueue,
  copiedImage,
  printQueue,
  isQueueExpanded,
  zipFileName,
  isGeneratingZip,
  onSetQrPos,
  onAutoSnap,
  onToggleQrOverlay,
  onDownloadCard,
  onAddToPrintQueue,
  onCopyImage,
  onPrint,
  onSetIsQueueExpanded,
  onSetZipFileName,
  onRemoveQueueItem,
  onDownloadZip,
  onClearQueue,
  onOpenPublishModal,
  canvasContainerRef,
  cardElementRef,
  cardImageSrc,
  isPreviewFinal,
  cardHasBakedQr = false,
  onSetIsPreviewFinal,
  onPointerDownQr,
  onResizePointerDown,
  onWorkspacePointerMove,
  onWorkspacePointerUp,
  onUploadCleanTemplate,
  onRestoreOriginalImage,
  onResetQrToStandard,
  onPointerDownSticker,
}: EditorTabProps) {
  // Mobile Switcher: 3 Chế độ màn hình nhỏ ("config" | "canvas" | "assets")
  const [mobileSubTab, setMobileSubTab] = useState<"config" | "canvas" | "assets">("config");

  const hasCardImage = Boolean(cardImageSrc && cardImageSrc.trim() !== "");

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Mobile Switcher (3 Tabs chuyển đổi mượt mà trên Mobile & Tablet < xl) */}
      <div className="xl:hidden sticky top-0 z-20 bg-stone-900/95 border-b border-white/10 p-2 flex items-center justify-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setMobileSubTab("config")}
          className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
            mobileSubTab === "config"
              ? "bg-amber-500 text-stone-950 font-black shadow-md"
              : "bg-stone-800 text-stone-300 hover:text-white"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>1. QR &amp; Layers</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileSubTab("canvas")}
          className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
            mobileSubTab === "canvas"
              ? "bg-amber-500 text-stone-950 font-black shadow-md"
              : "bg-stone-800 text-stone-300 hover:text-white"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>2. Canvas (1:1)</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileSubTab("assets")}
          className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
            mobileSubTab === "assets"
              ? "bg-amber-500 text-stone-950 font-black shadow-md"
              : "bg-stone-800 text-stone-300 hover:text-white"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>3. Phôi &amp; Xuất In</span>
        </button>
      </div>

      {/* BỐ CỤC 3 PANEL CHUYÊN NGHIỆP TRÊN DESKTOP (XL+) */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-0 overflow-y-auto xl:overflow-hidden">
        {/* ========================================================
            PANEL 1 (CỘT TRÁI - XL:COL-SPAN-3): QR CONFIG & LAYERS
           ======================================================== */}
        <div
          className={`xl:col-span-3 border-b xl:border-b-0 xl:border-r border-white/10 bg-stone-900/60 p-3 sm:p-4 overflow-y-auto space-y-4 xl:max-h-[calc(100vh-115px)] ${
            mobileSubTab === "config" ? "block" : "hidden xl:block"
          }`}
        >
          {/* LIÊN KẾT NHANH SANG PHÂN HỆ HÓA ĐƠN BÁN HÀNG (POS) */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 shadow-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-amber-300 truncate">Hóa Đơn Bán Hàng (POS)</div>
                <div className="text-[10px] text-stone-400 truncate">Lập phiếu &amp; hạch toán Nợ/Có</div>
              </div>
            </div>
            <Link
              href="/invoices"
              className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1 transition-all shadow-md active:scale-95 shrink-0"
            >
              <span>Mở POS</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* KHỐI 1: BỘ KHỞI TẠO MÃ QR (ĐÃ TỐI ƯU DOMAIN, PINYIN, CHECK TRÙNG) */}
          <QrConfigPanel
            qrGeneratedCount={qrGeneratedCount}
            slug={slug}
            directAr={directAr}
            includeLicense={includeLicense}
            licenseCode={licenseCode}
            isGeneratingQr={isGeneratingQr}
            qrDataUrl={qrDataUrl}
            targetUrl={targetUrl}
            copiedUrl={copiedUrl}
            onSetSlug={onSetSlug}
            onSetDirectAr={onSetDirectAr}
            onSetIncludeLicense={onSetIncludeLicense}
            onSetLicenseCode={onSetLicenseCode}
            onGenerateQr={onGenerateQr}
            onDownloadQrPng={onDownloadQrPng}
            onCopyUrl={onCopyUrl}
            existingCards={existingCards}
            onSelectExistingCard={onSelectExistingCard}
          />

          {/* KHỐI 2: BẢNG QUẢN LÝ LỚP LAYER (PHOTOSHOP STYLE) */}
          <LayersPalette
            cardFileName={cardFileName}
            hasCardImage={hasCardImage}
            isBackgroundVisible={isBackgroundVisible}
            onToggleBackground={onToggleBackground}
            onRemoveBackground={onRemoveBackground}
            isQrOverlayEnabled={isQrOverlayEnabled}
            qrPos={qrPos}
            onToggleQrOverlay={onToggleQrOverlay}
            onResetQrToStandard={onResetQrToStandard}
            stickerLayer={stickerLayer}
            onToggleSticker={onToggleSticker}
            onRemoveSticker={onRemoveSticker}
            onAddSticker={onAddSpeechBubbleSticker}
          />
        </div>

        {/* ========================================================
            PANEL 2 (CỘT GIỮA - XL:COL-SPAN-6): CANVAS WORKBENCH 1:1
           ======================================================== */}
        <div
          className={`xl:col-span-6 border-b xl:border-b-0 xl:border-r border-white/10 flex flex-col ${
            mobileSubTab === "canvas" ? "flex" : "hidden xl:flex"
          }`}
        >
          <CanvasWorkbench
            canvasContainerRef={canvasContainerRef}
            cardElementRef={cardElementRef}
            cardImageSrc={cardImageSrc}
            cardDimensions={cardDimensions}
            qrDataUrl={qrDataUrl}
            qrPos={qrPos}
            isQrOverlayEnabled={isQrOverlayEnabled}
            isPreviewFinal={isPreviewFinal}
            cardHasBakedQr={cardHasBakedQr}
            isBackgroundVisible={isBackgroundVisible}
            stickerLayer={stickerLayer}
            onSetIsPreviewFinal={onSetIsPreviewFinal}
            onToggleQrOverlay={onToggleQrOverlay}
            onPointerDownQr={onPointerDownQr}
            onResizePointerDown={onResizePointerDown}
            onWorkspacePointerMove={onWorkspacePointerMove}
            onWorkspacePointerUp={onWorkspacePointerUp}
            onUploadCleanTemplate={onUploadCleanTemplate}
            onRestoreOriginalImage={onRestoreOriginalImage}
            onResetQrToStandard={onResetQrToStandard}
            onPointerDownSticker={onPointerDownSticker}
          />
        </div>

        {/* ========================================================
            PANEL 3 (CỘT PHẢI - XL:COL-SPAN-3): PHÔI, STICKER & XUẤT IN
           ======================================================== */}
        <div
          className={`xl:col-span-3 bg-stone-900/60 p-3 sm:p-4 overflow-y-auto space-y-4 xl:max-h-[calc(100vh-115px)] ${
            mobileSubTab === "assets" ? "block" : "hidden xl:block"
          }`}
        >
          <AssetsTemplatesPanel
            cardDimensions={cardDimensions}
            cardFileName={cardFileName}
            isDraggingOverFile={isDraggingOverFile}
            onSetIsDraggingOverFile={onSetIsDraggingOverFile}
            onLoadImageFile={onLoadImageFile}
            onAddSpeechBubbleSticker={onAddSpeechBubbleSticker}
            existingCards={existingCards}
            onSelectExistingCard={onSelectExistingCard ? onSelectExistingCard : () => {}}
            isExporting={isExporting}
            isAddingToQueue={isAddingToQueue}
            copiedImage={copiedImage}
            printQueue={printQueue}
            isQueueExpanded={isQueueExpanded}
            zipFileName={zipFileName}
            isGeneratingZip={isGeneratingZip}
            onDownloadCard={onDownloadCard}
            onAddToPrintQueue={onAddToPrintQueue}
            onCopyImage={onCopyImage}
            onPrint={onPrint}
            onSetIsQueueExpanded={onSetIsQueueExpanded}
            onSetZipFileName={onSetZipFileName}
            onRemoveQueueItem={onRemoveQueueItem}
            onDownloadZip={onDownloadZip}
            onClearQueue={onClearQueue}
            onOpenPublishModal={onOpenPublishModal}
          />
        </div>
      </main>
    </div>
  );
}
