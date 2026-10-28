"use client";

import React from "react";
import {
  Sliders,
  Sparkles,
  QrCode,
  FileDown,
  ListPlus,
  Copy,
  Printer,
  FolderArchive,
  ChevronDown,
  ChevronUp,
  Trash2,
  Archive,
  RotateCcw,
  ShoppingBag,
  Layers,
  Check,
} from "lucide-react";
import { PrintQueueItem, QrPosition } from "../types";

interface PrintExportPanelProps {
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
          <div className="space-y-3 pt-1">
            {/* Slider Kích thước QR (1:1) */}
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-300 mb-1">
                <span>Cỡ QR (% chiều rộng):</span>
                <span className="font-mono text-amber-300">{qrPos.size}%</span>
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
              <div className="flex justify-between text-xs font-bold text-stone-300 mb-1">
                <span>Vị trí X (% từ lề trái):</span>
                <span className="font-mono text-amber-300">{qrPos.x}%</span>
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
              <div className="flex justify-between text-xs font-bold text-stone-300 mb-1">
                <span>Vị trí Y (% từ lề trên):</span>
                <span className="font-mono text-amber-300">{qrPos.y}%</span>
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

        {/* Nút Xuất File Chính: Tải Ngay vs Thêm Vào Hàng Đợi In */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDownloadCard}
            disabled={isExporting}
            className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs active:scale-98 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileDown className="h-4 w-4 text-stone-950 shrink-0" />
            <span className="truncate">{isExporting ? "Đang Xuất File..." : "Tải Thẻ Này (PNG 1:1)"}</span>
          </button>

          <button
            type="button"
            onClick={onAddToPrintQueue}
            disabled={isAddingToQueue}
            className="py-3 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-black text-xs active:scale-98 transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Thêm thẻ này vào hàng đợi để tải nhiều thẻ cùng lúc dưới dạng file .ZIP"
          >
            <ListPlus className="h-4 w-4 text-white shrink-0" />
            <span className="truncate">{isAddingToQueue ? "Đang Thêm..." : "Thêm Vào Hàng Đợi In"}</span>
          </button>
        </div>

        {/* Nút sao chép ảnh vào Clipboard & In Trực Tiếp */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCopyImage}
            className="py-2 px-2 rounded-xl bg-black/40 hover:bg-black/60 text-stone-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-white/5 transition-colors cursor-pointer"
          >
            {copiedImage ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-amber-400" />}
            <span>{copiedImage ? "Đã Chép" : "Chép Clipboard"}</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="py-2 px-2 rounded-xl bg-black/40 hover:bg-black/60 text-stone-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-white/5 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-purple-400" />
            <span>In Trực Tiếp</span>
          </button>
        </div>

        {/* GIAO DIỆN HÀNG ĐỢI IN ẤN (PRINT QUEUE & TẢI ZIP NHIỀU THẺ) */}
        <div className="pt-2 border-t border-white/10 space-y-2.5">
          <div
            onClick={() => onSetIsQueueExpanded(!isQueueExpanded)}
            className="flex items-center justify-between cursor-pointer select-none text-xs font-black text-amber-300 hover:text-amber-200"
          >
            <div className="flex items-center gap-1.5">
              <FolderArchive className="h-3.5 w-3.5 text-amber-400" />
              <span>Hàng Đợi Xuất File .ZIP ({printQueue.length})</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-stone-400">
              <span>{isQueueExpanded ? "Thu gọn" : "Xem chi tiết"}</span>
              {isQueueExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </div>
          </div>

          {isQueueExpanded && (
            <div className="space-y-2.5 animate-in fade-in">
              {printQueue.length === 0 ? (
                <div className="p-3 rounded-xl bg-black/40 border border-dashed border-white/15 text-center space-y-1">
                  <p className="text-[11px] text-stone-400">
                    Chưa có thẻ nào trong hàng đợi in.
                  </p>
                  <p className="text-[10px] text-stone-500 leading-snug">
                    Bấm nút <strong className="text-amber-300">"Thêm Vào Hàng Đợi In"</strong> ở trên sau khi căn chỉnh thẻ để gom nhiều thẻ và tải 1 lần thành tệp <strong className="text-amber-300">.ZIP</strong> (tên ảnh tự động: <code className="text-sky-300">1.png</code>, <code className="text-sky-300">2.png</code>...).
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Ô Người Dùng Tự Đặt Tên Tệp .ZIP */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-300 flex items-center justify-between">
                      <span>Tên tệp .ZIP khi tải xuống:</span>
                      <span className="text-[9px] text-amber-400 font-mono">Tự đặt tên tùy ý</span>
                    </label>
                    <div className="flex items-center rounded-xl bg-black/70 border border-white/20 overflow-hidden focus-within:border-amber-400">
                      <input
                        type="text"
                        value={zipFileName}
                        onChange={(e) => onSetZipFileName(e.target.value)}
                        placeholder="Ví dụ: bo-dong-vat-30-the"
                        className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden"
                      />
                      <span className="px-2.5 py-1.5 text-xs font-mono font-bold text-amber-400 bg-white/5 border-l border-white/10">
                        .zip
                      </span>
                    </div>
                  </div>

                  {/* Danh sách các thẻ trong hàng đợi theo thứ tự 1, 2, 3... */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-700">
                    {printQueue.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2 text-xs hover:border-amber-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 px-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}.png
                          </div>

                          {item.previewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="h-8 w-6 object-cover rounded border border-white/20 shrink-0 bg-stone-800"
                            />
                          )}

                          <div className="min-w-0">
                            <div className="font-bold text-white text-[11px] truncate">
                              {item.name}
                            </div>
                            <div className="text-[9px] text-stone-400 flex items-center gap-1.5 font-mono">
                              <span>slug: {item.slug}</span>
                              <span>•</span>
                              <span className="text-amber-400/80">{item.category}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveQueueItem(item.id)}
                          className="h-6 w-6 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                          title="Xóa thẻ này khỏi hàng đợi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Các nút thao tác hàng đợi: Tải ZIP & Làm Rỗng */}
                  <div className="grid grid-cols-12 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onDownloadZip}
                      disabled={isGeneratingZip || printQueue.length === 0}
                      className="col-span-8 sm:col-span-9 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                      <Archive className="h-4 w-4" />
                      <span>
                        {isGeneratingZip
                          ? "Đang Đóng Gói .ZIP..."
                          : `Tải Tệp .ZIP (${printQueue.length} Thẻ)`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={onClearQueue}
                      disabled={isGeneratingZip || printQueue.length === 0}
                      className="col-span-4 sm:col-span-3 py-2.5 px-2 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 text-stone-300 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-1 border border-white/10 transition-colors cursor-pointer"
                      title="Xóa toàn bộ thẻ trong hàng đợi"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Xóa Hết</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
