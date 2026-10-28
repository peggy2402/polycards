"use client";

import React, { RefObject } from "react";
import Link from "next/link";
import { Receipt, ArrowRight } from "lucide-react";
import { PrintQueueItem, QrPosition } from "../types";
import { QrConfigPanel } from "../sections/qr-config-panel";
import { CardTemplatePanel } from "../sections/card-template-panel";
import { PrintExportPanel } from "../sections/print-export-panel";
import { CanvasWorkbench } from "../sections/canvas-workbench";

interface EditorTabProps {
  // QR Config State & Handlers
  qrGeneratedCount: number;
  selectedPackForCard: string;
  packGeneratedCode: string;
  copiedPackCode: boolean;
  qrMode: "slug" | "custom";
  qrTargetEnv: "production" | "local";
  slug: string;
  customUrl: string;
  directAr: boolean;
  includeLicense: boolean;
  licenseCode: string;
  isGeneratingQr: boolean;
  qrDataUrl: string;
  targetUrl: string;
  copiedUrl: boolean;
  onSetSelectedPackForCard: (pack: string) => void;
  onGeneratePackCodeForCard: () => void;
  onCopyPackCode: (code: string) => void;
  onSetQrMode: (mode: "slug" | "custom") => void;
  onSetQrTargetEnv: (env: "production" | "local") => void;
  onSetSlug: (slug: string) => void;
  onSetCustomUrl: (url: string) => void;
  onSetDirectAr: (val: boolean) => void;
  onSetIncludeLicense: (val: boolean) => void;
  onSetLicenseCode: (code: string) => void;
  onGenerateQr: () => void;
  onDownloadQrPng: () => void;
  onDownloadQrSvg: () => void;
  onCopyUrl: () => void;

  // Card Template State & Handlers
  cardDimensions: { width: number; height: number };
  cardFileName: string;
  isDraggingOverFile: boolean;
  onSetIsDraggingOverFile: (val: boolean) => void;
  onLoadImageFile: (file: File) => void;

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
  onSetIsPreviewFinal: (val: boolean) => void;
  onPointerDownQr: (e: React.PointerEvent) => void;
  onResizePointerDown: (handle: string, e: React.PointerEvent) => void;
  onWorkspacePointerMove: (e: React.PointerEvent) => void;
  onWorkspacePointerUp: (e: React.PointerEvent) => void;
}

export function EditorTab({
  qrGeneratedCount,
  selectedPackForCard,
  packGeneratedCode,
  copiedPackCode,
  qrMode,
  qrTargetEnv,
  slug,
  customUrl,
  directAr,
  includeLicense,
  licenseCode,
  isGeneratingQr,
  qrDataUrl,
  targetUrl,
  copiedUrl,
  onSetSelectedPackForCard,
  onGeneratePackCodeForCard,
  onCopyPackCode,
  onSetQrMode,
  onSetQrTargetEnv,
  onSetSlug,
  onSetCustomUrl,
  onSetDirectAr,
  onSetIncludeLicense,
  onSetLicenseCode,
  onGenerateQr,
  onDownloadQrPng,
  onDownloadQrSvg,
  onCopyUrl,
  cardDimensions,
  cardFileName,
  isDraggingOverFile,
  onSetIsDraggingOverFile,
  onLoadImageFile,
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
  onSetIsPreviewFinal,
  onPointerDownQr,
  onResizePointerDown,
  onWorkspacePointerMove,
  onWorkspacePointerUp,
}: EditorTabProps) {
  return (
    <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
      {/* CỘT TRÁI: BẢNG TẠO MÃ QR & CẤU HÌNH */}
      <div className="lg:col-span-5 xl:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 bg-stone-900/60 p-4 sm:p-5 overflow-y-auto space-y-5 max-h-[calc(100vh-60px)]">
        {/* LIÊN KẾT NHANH SANG PHÂN HỆ HÓA ĐƠN BÁN HÀNG (POS) */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-300">Hóa Đơn Bán Hàng (POS)</div>
              <div className="text-[10px] text-stone-400">Tách riêng phân hệ lập phiếu, hạch toán Nợ/Có</div>
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

        <div className="space-y-5">
          {/* KHỐI 1: BỘ KHỞI TẠO MÃ QR */}
          <QrConfigPanel
            qrGeneratedCount={qrGeneratedCount}
            selectedPackForCard={selectedPackForCard}
            packGeneratedCode={packGeneratedCode}
            copiedPackCode={copiedPackCode}
            qrMode={qrMode}
            qrTargetEnv={qrTargetEnv}
            slug={slug}
            customUrl={customUrl}
            directAr={directAr}
            includeLicense={includeLicense}
            licenseCode={licenseCode}
            isGeneratingQr={isGeneratingQr}
            qrDataUrl={qrDataUrl}
            targetUrl={targetUrl}
            copiedUrl={copiedUrl}
            onSetSelectedPackForCard={onSetSelectedPackForCard}
            onGeneratePackCodeForCard={onGeneratePackCodeForCard}
            onCopyPackCode={onCopyPackCode}
            onSetQrMode={onSetQrMode}
            onSetQrTargetEnv={onSetQrTargetEnv}
            onSetSlug={onSetSlug}
            onSetCustomUrl={onSetCustomUrl}
            onSetDirectAr={onSetDirectAr}
            onSetIncludeLicense={onSetIncludeLicense}
            onSetLicenseCode={onSetLicenseCode}
            onGenerateQr={onGenerateQr}
            onDownloadQrPng={onDownloadQrPng}
            onDownloadQrSvg={onDownloadQrSvg}
            onCopyUrl={onCopyUrl}
          />

          {/* KHỐI 2: THẺ BÀI MẪU */}
          <CardTemplatePanel
            cardDimensions={cardDimensions}
            cardFileName={cardFileName}
            isDraggingOverFile={isDraggingOverFile}
            onSetIsDraggingOverFile={onSetIsDraggingOverFile}
            onLoadImageFile={onLoadImageFile}
          />

          {/* KHỐI 3 + 4 + 5: TINH CHỈNH QR, XUẤT IN ẤN & XUẤT BẢN LANDING */}
          <PrintExportPanel
            qrPos={qrPos}
            isQrOverlayEnabled={isQrOverlayEnabled}
            isExporting={isExporting}
            isAddingToQueue={isAddingToQueue}
            copiedImage={copiedImage}
            printQueue={printQueue}
            isQueueExpanded={isQueueExpanded}
            zipFileName={zipFileName}
            isGeneratingZip={isGeneratingZip}
            onSetQrPos={onSetQrPos}
            onAutoSnap={onAutoSnap}
            onToggleQrOverlay={onToggleQrOverlay}
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
      </div>

      {/* CỘT PHẢI: KHÔNG GIAN CANVAS TƯƠNG TÁC */}
      <CanvasWorkbench
        canvasContainerRef={canvasContainerRef}
        cardElementRef={cardElementRef}
        cardImageSrc={cardImageSrc}
        cardDimensions={cardDimensions}
        qrDataUrl={qrDataUrl}
        qrPos={qrPos}
        isQrOverlayEnabled={isQrOverlayEnabled}
        isPreviewFinal={isPreviewFinal}
        onSetIsPreviewFinal={onSetIsPreviewFinal}
        onToggleQrOverlay={onToggleQrOverlay}
        onPointerDownQr={onPointerDownQr}
        onResizePointerDown={onResizePointerDown}
        onWorkspacePointerMove={onWorkspacePointerMove}
        onWorkspacePointerUp={onWorkspacePointerUp}
      />
    </main>
  );
}
