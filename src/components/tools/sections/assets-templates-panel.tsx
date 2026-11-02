"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
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
  Search,
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

  // Thêm Sticker Khung Thoại (Tùy chọn, nếu không dùng có thể bỏ qua)
  onAddSpeechBubbleSticker?: () => void;

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
    <div className="flex flex-col h-full space-y-4">
      {/* KHỐI TRÊN: NẠP PHÔI THẺ & KHO THẺ SẴN CÓ (CUỘN ĐƯỢC) */}
      <div className="space-y-4 flex-1">
        {/* 1. VÙNG NẠP PHÔI THẺ MẪU (CARD TEMPLATE DROPZONE) */}
        <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-amber-400" />
              <span>Nạp Phôi Thẻ In Mẫu (Template)</span>
            </label>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-stone-400 border border-white/10">
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
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith("image/")) {
                onLoadImageFile(file);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDraggingOverFile
                ? "border-amber-400 bg-amber-500/15 scale-102"
                : "border-white/20 hover:border-amber-400/50 bg-white/5 hover:bg-white/10"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onLoadImageFile(file);
                }
              }}
            />
            <Upload className="h-6 w-6 mx-auto text-amber-400 mb-1 animate-bounce" />
            <div className="text-xs font-bold text-white">
              Kéo thả ảnh hoặc chọn tệp ở panel này
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5 truncate">
              Đang nạp: <strong className="text-amber-300">{cardFileName}</strong>
            </p>
          </div>
        </div>

        {/* 2. CHỌN NHANH TỪ KHO THẺ BÀI SẴN CÓ TRÊN DATABASE */}
        <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-amber-400" />
              <span>Kho Thẻ Bài Có Sẵn ({filteredCards.length})</span>
            </label>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              value={searchCatalogQuery}
              onChange={(e) => setSearchCatalogQuery(e.target.value)}
              placeholder="Tìm thẻ để nạp phôi & sửa..."
              className="w-full bg-black/80 border border-white/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {filteredCards.length === 0 ? (
              <div className="text-center py-4 text-xs text-stone-500">
                Không tìm thấy thẻ nào
              </div>
            ) : (
              filteredCards.map((card) => (
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
                    className="h-9 w-9 rounded-lg object-cover border border-white/15 shrink-0 bg-stone-900 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                      {card.nameVi} ({card.nameEn})
                    </div>
                    <div className="text-[10px] text-stone-400 truncate flex items-center gap-1.5">
                      <span>/{card.slug}/</span>
                      <span>•</span>
                      <span className="text-amber-400">{card.category || "Động Vật"}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors text-stone-300 shrink-0">
                    Nạp thẻ
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* KHỐI DƯỚI: XUẤT BẢN & IN ẤN THẺ CHUẨN XƯỞNG (FIXED / STICKY CỐ ĐỊNH Ở ĐÁY) */}
      <div className="sticky bottom-0 z-30 -mx-3 -mb-3 sm:-mx-4 sm:-mb-4 p-4 rounded-t-3xl bg-stone-950/98 backdrop-blur-xl border-t-2 border-amber-400/50 shadow-[0_-12px_32px_rgba(0,0,0,0.85)] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <Printer className="h-4 w-4 text-emerald-400" />
            <span>Xuất Bản &amp; In Ấn Thẻ Chuẩn Xưởng</span>
          </label>
          <span className="text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30">
            Cố định sẵn sàng
          </span>
        </div>

        {/* Nút ĐẨY THẺ LÊN KHO Nổi Bật Nhất */}
        <button
          type="button"
          onClick={onOpenPublishModal}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-200 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-98 transition-all cursor-pointer ring-2 ring-amber-300/60"
        >
          <ShoppingBag className="h-4 w-4 text-stone-950" />
          <span>Đẩy Thẻ Lên Kho / Cập Nhật Trang Chủ</span>
        </button>

        {/* Hai Nút Phụ: Tải Ảnh Thẻ (1:1) & Hàng Đợi In */}
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
