"use client";

import React from "react";
import {
  Sliders,
  Sparkles,
  QrCode,
  FileDown,
  Copy,
  Printer,
  ShoppingBag,
  Layers,
  Check,
  Target,
  RotateCcw,
} from "lucide-react";
import { PrintQueueItem, QrPosition } from "../types";

interface PrintExportPanelProps {
  qrPos: QrPosition;
  isQrOverlayEnabled: boolean;
  isExporting: boolean;
  isAddingToQueue?: boolean;
  copiedImage: boolean;
  printQueue?: PrintQueueItem[];
  isQueueExpanded?: boolean;
  zipFileName?: string;
  isGeneratingZip?: boolean;
  onSetQrPos: (pos: QrPosition) => void;
  onAutoSnap: () => void;
  onToggleQrOverlay: () => void;
  onDownloadCard: () => void;
  onAddToPrintQueue?: () => void;
  onCopyImage: () => void;
  onPrint: () => void;
  onSetIsQueueExpanded?: (val: boolean) => void;
  onSetZipFileName?: (name: string) => void;
  onRemoveQueueItem?: (id: string) => void;
  onDownloadZip?: () => void;
  onClearQueue?: () => void;
  onOpenPublishModal: () => void;
}

export function PrintExportPanel({
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
}: PrintExportPanelProps) {
  return (
    <>
      {/* KHỐI 3: TINH CHỈNH VỊ TRÍ & KÍCH THƯỚC QR (1:1 RATIO) */}
      <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-amber-400" />
            <span>3. Tinh Chỉnh QR Trên Thẻ (1:1)</span>
          </label>
          <button
            type="button"
            onClick={onAutoSnap}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-black text-[11px] shadow hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
            title="Tự động đặt vào ô trắng góc dưới thẻ"
          >
            <Sparkles className="h-3 w-3" />
            <span>Auto-Snap Vào Ô Trắng</span>
          </button>
        </div>

        {/* Công tắc Bật/Tắt Lớp Ghép Mã QR */}
        <div className="p-3 rounded-xl bg-stone-900/90 border border-white/10 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                isQrOverlayEnabled
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              <QrCode className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {isQrOverlayEnabled ? "Đang Bật Lớp Ghép QR Mới" : "Đang Dùng QR Có Sẵn Trên Thẻ"}
              </div>
              <div className="text-[10px] text-stone-400 truncate">
                {isQrOverlayEnabled
                  ? "Mã QR mới được ghép đè lên phôi thẻ"
                  : "Đã ẩn QR ghép thêm để tránh bị trùng 2 mã"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleQrOverlay}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shrink-0 cursor-pointer ${
              isQrOverlayEnabled
                ? "bg-amber-500 text-stone-950 hover:bg-amber-400"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {isQrOverlayEnabled ? "Tắt QR Ghép" : "Bật QR Ghép"}
          </button>
        </div>

        {isQrOverlayEnabled && (
          <div className="space-y-3.5 pt-1">
            {/* Bộ Phím Tắt Căn Nhanh Vị Trí Ô Vàng */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 space-y-2">
              <span className="text-[10px] font-black uppercase text-stone-400 block tracking-wider">
                Căn Chỉnh Nhanh Vị Trí Chuẩn:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onSetQrPos({ x: 4.1, y: 74.2, size: 22.8 })}
                  className="py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-[10px] font-bold text-amber-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Vị trí tiêu chuẩn vàng của Poly Cards (X: 4.1%, Y: 74.2%, Cỡ: 22.8%)"
                >
                  <Target className="h-3 w-3" />
                  <span>Ô Vàng Chuẩn</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetQrPos({ x: 4.1, y: 74.2, size: 22.8 })}
                  className="py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-[10px] font-bold text-emerald-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Căn chuẩn xác vào giữa tâm của ô bo vàng (X: 4.1%, Y: 74.2%, Cỡ: 22.8%)"
                >
                  <span>Giữa Tâm</span>
                </button>
                <button
                  type="button"
                  onClick={onAutoSnap}
                  className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-bold text-stone-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Khôi phục lại tọa độ mặc định ban đầu"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Mặc Định</span>
                </button>
              </div>
            </div>

            {/* Slider Kích thước QR (1:1) */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-stone-300 mb-1">
                <span>Cỡ QR (% chiều rộng):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="60"
                    step="0.1"
                    value={qrPos.size}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) onSetQrPos({ ...qrPos, size: val });
                    }}
                    className="w-14 px-1.5 py-0.5 rounded bg-black border border-white/20 text-right font-mono text-[11px] text-amber-300"
                  />
                  <span className="font-mono text-amber-300 text-xs">%</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="0.1"
                value={qrPos.size}
                onChange={(e) => onSetQrPos({ ...qrPos, size: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Slider Tọa độ X (Ngang) */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-stone-300 mb-1">
                <span>Vị trí X (% từ lề trái):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="85"
                    step="0.1"
                    value={qrPos.x}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) onSetQrPos({ ...qrPos, x: val });
                    }}
                    className="w-14 px-1.5 py-0.5 rounded bg-black border border-white/20 text-right font-mono text-[11px] text-amber-300"
                  />
                  <span className="font-mono text-amber-300 text-xs">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="85"
                step="0.1"
                value={qrPos.x}
                onChange={(e) => onSetQrPos({ ...qrPos, x: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Slider Tọa độ Y (Dọc) */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-stone-300 mb-1">
                <span>Vị trí Y (% từ lề trên):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="85"
                    step="0.1"
                    value={qrPos.y}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) onSetQrPos({ ...qrPos, y: val });
                    }}
                    className="w-14 px-1.5 py-0.5 rounded bg-black border border-white/20 text-right font-mono text-[11px] text-amber-300"
                  />
                  <span className="font-mono text-amber-300 text-xs">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="85"
                step="0.1"
                value={qrPos.y}
                onChange={(e) => onSetQrPos({ ...qrPos, y: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* KHỐI 4: XUẤT FILE IN ẤN (PRINT EXPORT) */}
      <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <FileDown className="h-4 w-4 text-amber-400" />
          <span>4. Xuất File In Ấn (Print Export)</span>
        </label>

        {/* Nút Xuất File Chính: Tải Ngay */}
        <button
          type="button"
          onClick={onDownloadCard}
          disabled={isExporting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs active:scale-98 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileDown className="h-4 w-4 text-stone-950 shrink-0" />
          <span className="truncate">{isExporting ? "Đang Xuất File..." : "Tải Thẻ Này (PNG 1:1 Chuẩn In Kèm QR)"}</span>
        </button>

        {/* Nút sao chép ảnh vào Clipboard & In Trực Tiếp */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCopyImage}
            className="py-2.5 px-2 rounded-xl bg-black/40 hover:bg-black/60 text-stone-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            {copiedImage ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-amber-400" />}
            <span>{copiedImage ? "Đã Chép" : "Chép Clipboard"}</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="py-2.5 px-2 rounded-xl bg-black/40 hover:bg-black/60 text-stone-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-purple-400" />
            <span>In Trực Tiếp</span>
          </button>
        </div>
      </div>

      {/* KHỐI 5: LƯU / CẬP NHẬT THẺ VÀO #products TRANG CHỦ */}
      <div className="rounded-2xl bg-gradient-to-b from-emerald-500/20 via-black/60 to-black/80 border-2 border-emerald-400/70 p-4 space-y-3.5 shadow-2xl shadow-emerald-500/15">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            <span>5. Đưa Thẻ Ra #products Trang Chủ</span>
          </label>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Xuất Bản Landing
          </span>
        </div>

        <p className="text-[11px] text-stone-300 leading-relaxed">
          Cập nhật thẻ bài vừa tạo vào danh mục sản phẩm trên trang chủ (có hoặc không có mã QR), bắt buộc chọn danh mục và quản lý giá bán để khách hàng xem được ngay tại <strong className="text-amber-300">#products</strong>.
        </p>

        <button
          type="button"
          onClick={onOpenPublishModal}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-stone-950 font-black text-xs sm:text-sm active:scale-98 transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Layers className="h-4 w-4 text-stone-950" />
          <span>Cập Nhật / Đưa Thẻ Vào #products</span>
        </button>
      </div>
    </>
  );
}
