"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  Download,
  Printer,
  Archive,
  Layers,
  ShoppingBag,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Animal } from "@/types/animal";
import { PrintQueueItem } from "../types";

interface AssetsTemplatesPanelProps {
  // Upload Phôi Thẻ
  cardDimensions: { width: number; height: number };
  cardFileName: string;
  isDraggingOverFile: boolean;
  onSetIsDraggingOverFile: (val: boolean) => void;
  onLoadImageFile: (file: File) => void;

  // Thêm Sticker Khung Thoại (Speech Bubble)
  onAddSpeechBubbleSticker: () => void;

  // Kho thẻ bài có sẵn từ Database
  existingCards: Animal[];
  onSelectExistingCard: (card: Animal) => void;

  // Xuất file in & landing
  isExporting: boolean;
  isAddingToQueue: boolean;
  copiedImage: boolean;
  printQueue: PrintQueueItem[];
  isQueueExpanded: boolean;
  zipFileName: string;
  isGeneratingZip: boolean;
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
}

export function AssetsTemplatesPanel({
  cardDimensions,
  cardFileName,
  isDraggingOverFile,
  onSetIsDraggingOverFile,
  onLoadImageFile,
  onAddSpeechBubbleSticker,
  existingCards,
  onSelectExistingCard,
  isExporting,
  isAddingToQueue,
  copiedImage,
  printQueue,
  isQueueExpanded,
  zipFileName,
  isGeneratingZip,
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
}: AssetsTemplatesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchCatalogQuery, setSearchCatalogQuery] = useState("");

  const filteredCards = existingCards.filter((c) => {
    if (!searchCatalogQuery.trim()) return true;
    const q = searchCatalogQuery.toLowerCase();
    return (
      c.nameVi.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.category && c.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* 1. VÙNG NẠP PHÔI THẺ MẪU (CARD TEMPLATE DROPZONE) */}
      <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4 text-amber-400" />
            <span>Phôi Thẻ Bài (Card Template)</span>
          </label>
          <span className="text-[10px] font-mono text-stone-400">
            {cardDimensions.width} x {cardDimensions.height} px
          </span>
        </div>

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
            Kéo thả phôi ảnh vào đây hoặc bấm để chọn tệp
          </div>
          <p className="text-[10px] text-stone-400 mt-0.5 truncate">
            Đang nạp: <strong className="text-amber-300">{cardFileName}</strong>
          </p>
        </div>
      </div>

      {/* 2. THƯ VIỆN KHUNG THOẠI / STICKER (SPEECH BUBBLE - ẢNH 4) */}
      <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-amber-400" />
            <span>Thư Viện Khung Thoại / Sticker</span>
          </label>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
            Chèn 1 Chạm
          </span>
        </div>

        <p className="text-[11px] text-stone-400">
          Chèn thêm khung thoại phong cách hoạt hình (Comic Bubble) lên thẻ bài:
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAddSpeechBubbleSticker}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-400/40 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group active:scale-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/stickers/speech-bubble.png"
              alt="Khung Thoại Comic"
              className="h-10 w-auto object-contain group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] font-bold text-stone-300 group-hover:text-amber-300">
              Khung Thoại Comic
            </span>
          </button>
        </div>
      </div>

      {/* 3. CHỌN NHANH TỪ KHO THẺ BÀI SẴN CÓ TRÊN DATABASE */}
      <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-amber-400" />
            <span>Kho Thẻ Bài Có Sẵn ({filteredCards.length})</span>
          </label>
        </div>

        <input
          type="text"
          value={searchCatalogQuery}
          onChange={(e) => setSearchCatalogQuery(e.target.value)}
          placeholder="Tìm tên thẻ để nạp phôi..."
          className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
        />

        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
          {filteredCards.length === 0 ? (
            <div className="text-center py-4 text-xs text-stone-500">
              Không tìm thấy thẻ nào
            </div>
          ) : (
            filteredCards.slice(0, 15).map((card) => (
              <button
                key={card.id || card.slug}
                type="button"
                onClick={() => onSelectExistingCard(card)}
                className="w-full p-2 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-400/40 flex items-center gap-2.5 transition-all cursor-pointer text-left group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.images?.[0] || card.posterUrl || "/images/icons/logo.png"}
                  alt={card.nameVi}
                  className="h-9 w-9 rounded-lg object-cover border border-white/10 shrink-0 bg-stone-900"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-stone-200 group-hover:text-amber-300 truncate">
                    {card.nameVi} ({card.nameEn})
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">
                    Slug: <span className="font-mono text-emerald-400">{card.slug}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 4. XUẤT IN ẤN & XUẤT BẢN LANDING #products */}
      <div className="rounded-2xl bg-gradient-to-b from-emerald-500/15 via-black/50 to-black/60 border-2 border-emerald-400/40 p-4 space-y-3 shadow-xl">
        <label className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
          <Printer className="h-4 w-4 text-emerald-400" />
          <span>Xuất Bản &amp; In Ấn Thẻ Chuẩn Xưởng</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDownloadCard}
            disabled={isExporting}
            className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? "Đang xuất..." : "Tải Ảnh Thẻ (1:1)"}</span>
          </button>

          <button
            type="button"
            onClick={onAddToPrintQueue}
            disabled={isAddingToQueue}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Archive className="h-3.5 w-3.5 text-amber-400" />
            <span>+ Hàng Đợi In ({printQueue.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenPublishModal}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Đẩy Thẻ Lên Kho</span>
        </button>

        {/* Hàng Đợi In Thu Gọn / Mở Rộng */}
        {printQueue.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-300">
                Đang có <strong className="text-amber-400">{printQueue.length}</strong> thẻ chờ in
              </span>
              <button
                type="button"
                onClick={() => onSetIsQueueExpanded(!isQueueExpanded)}
                className="text-[11px] font-bold text-amber-300 hover:underline flex items-center gap-1"
              >
                <span>{isQueueExpanded ? "Thu gọn" : "Xem danh sách"}</span>
                {isQueueExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {isQueueExpanded && (
              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={onDownloadZip}
                  disabled={isGeneratingZip}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isGeneratingZip ? "Đang nén ZIP..." : "Tải Toàn Bộ Gói ZIP In Ấn"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

