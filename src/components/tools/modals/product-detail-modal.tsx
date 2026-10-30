"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Star,
  Sliders,
  Edit3,
  Eye,
  Trash2,
  Box,
  Languages,
  Tag,
  Image as ImageIcon,
  QrCode,
  Volume2,
  PackageCheck,
  FolderPlus,
  FileDown,
} from "lucide-react";
import { Animal } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";
import { resolveValidProductImage } from "@/lib/products-store";
import { SubjectFocusImage } from "@/components/common/subject-focus-image";

interface ProductDetailModalProps {
  card: Animal | null;
  onClose: () => void;
  onToggleShowOnHome: (card: Animal) => void;
  onLoadCardToCanvas: (card: Animal) => void;
  onOpenEditProduct: (card: Animal) => void;
  onDeleteProduct: (card: Animal) => void;
  onUpdatePackCode?: (card: Animal, newPackCode: string) => void;
  onAddToPrintQueue?: (card: Animal) => void;
  onDownloadSingleCard?: (card: Animal) => void;
}

export function ProductDetailModal({
  card,
  onClose,
  onToggleShowOnHome,
  onLoadCardToCanvas,
  onOpenEditProduct,
  onDeleteProduct,
  onUpdatePackCode,
  onAddToPrintQueue,
  onDownloadSingleCard,
}: ProductDetailModalProps) {
  const [previewMode, setPreviewMode] = useState<"subject" | "fullcard">("subject");

  if (!card) return null;

  const isPinned = Boolean(card.showOnHome);
  const fullCardImg = resolveValidProductImage(
    card.images?.[0],
    card.posterUrl,
    "/images/cards/jump-template.jpg"
  );
  const showEn = card.enableEnVi !== false;
  const showZh =
    card.enableZhVi !== undefined
      ? card.enableZhVi
      : Boolean(card.nameZh && card.nameZh.trim());

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-2xl w-full max-h-[90dvh] bg-stone-900 border-2 border-amber-400/50 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden ring-1 ring-amber-400/20"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-stone-900/95 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
              {card.category || "Động Vật"}
            </span>
            <h3 className="text-sm sm:text-base font-black text-white truncate">
              {card.nameVi}{" "}
              <span className="text-stone-300">
                (
                {card.enableZhVi && !card.enableEnVi && card.nameZh
                  ? card.nameZh
                  : card.nameEn}
                )
              </span>
            </h3>
            <span className="font-mono text-[11px] text-amber-300 hidden sm:inline">
              /
              {card.enableZhVi && !card.enableEnVi && card.pinyinZh
                ? card.pinyinZh
                : card.slug}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Đóng chi tiết"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            {/* Cột trái: Ảnh nhân vật / Phôi thẻ */}
            <div className="sm:col-span-5 space-y-2">
              <div className="relative aspect-[3/3.6] w-full rounded-2xl overflow-hidden bg-stone-950 border border-white/15 shadow-lg">
                {previewMode === "subject" ? (
                  <SubjectFocusImage
                    primaryUrl={card.images?.[0]}
                    secondaryUrl={card.posterUrl}
                    alt={card.nameVi}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fullCardImg}
                    alt={`Phôi thẻ ${card.nameVi}`}
                    className="h-full w-full object-contain bg-stone-950"
                  />
                )}

                {card.badge && card.badge.trim() !== "" && (
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-md">
                    {card.badge}
                  </span>
                )}
              </div>

              {/* Chuyển chế độ xem: Nhân vật vs Phôi thẻ đầy đủ */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-stone-950 border border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewMode("subject")}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    previewMode === "subject"
                      ? "bg-amber-400 text-stone-950"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  <ImageIcon className="h-3 w-3" />
                  <span>Nhân Vật</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("fullcard")}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    previewMode === "fullcard"
                      ? "bg-amber-400 text-stone-950"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  <QrCode className="h-3 w-3" />
                  <span>Phôi Thẻ In</span>
                </button>
              </div>
            </div>

            {/* Cột phải: Thông tin chi tiết */}
            <div className="sm:col-span-7 space-y-3.5">
              {/* Giá & Trạng thái ghim */}
              <div className="p-3.5 rounded-2xl bg-stone-950/90 border border-white/10 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block">
                    Giá bán thẻ lẻ:
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {formatVndCurrency(card.price || 219000)}
                    </span>
                    {card.originalPrice && card.originalPrice > (card.price || 0) && (
                      <span className="text-xs text-stone-500 line-through font-mono">
                        {formatVndCurrency(card.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleShowOnHome(card)}
                  className={`py-2 px-3 rounded-xl font-black text-xs flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                    isPinned
                      ? "bg-emerald-500 text-stone-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                      : "bg-white/5 hover:bg-emerald-500/20 text-stone-300 hover:text-emerald-300 border-white/15"
                  }`}
                >
                  <Star className={`h-3.5 w-3.5 ${isPinned ? "fill-stone-950" : ""}`} />
                  <span>{isPinned ? "Đang Ghim #products" : "Ghim Lên #products"}</span>
                </button>
              </div>

              {/* Mã Bộ Bản Quyền & Kích Hoạt */}
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-400/30 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-black text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <PackageCheck className="h-3.5 w-3.5 text-purple-400" />
                    <span>Mã Bộ Bản Quyền (Tham số &code=)</span>
                  </span>
                  {card.packCode && card.packCode.trim() !== "" ? (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-mono font-bold">
                      {card.packCode}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[10px] font-bold">
                      Chưa có
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-stone-300 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-stone-400">Gán nhanh mã bộ:</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      "POLY30-DONGVAT",
                      "POLY30-HANHDONG",
                      "POLY30-XECO",
                      "POLY30-HOAQUA",
                      "POLY120-COMBOVIP",
                    ].map((pCode) => (
                      <button
                        key={pCode}
                        type="button"
                        onClick={() => onUpdatePackCode && onUpdatePackCode(card, pCode)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                          card.packCode === pCode
                            ? "bg-purple-500 text-white border-purple-300 shadow-sm"
                            : "bg-white/5 text-purple-300 border-purple-400/20 hover:bg-purple-500/20"
                        }`}
                      >
                        {pCode}
                      </button>
                    ))}
                    {card.packCode && (
                      <button
                        type="button"
                        onClick={() => onUpdatePackCode && onUpdatePackCode(card, "")}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-rose-400/20 transition-all cursor-pointer"
                      >
                        Xóa (Chưa có)
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[10px] font-mono text-stone-400 pt-1 border-t border-purple-400/20 flex items-center justify-between gap-1">
                  <span>URL WebAR kích hoạt:</span>
                  <code className="text-purple-300 truncate max-w-[240px]">
                    /ar/{card.slug}?ar=1{card.packCode ? `&code=${card.packCode}` : ""}
                  </code>
                </div>
              </div>

              {/* Từ vựng & Chế độ song ngữ */}
              <div className="p-3.5 rounded-2xl bg-stone-950/90 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 text-amber-400" />
                    <span>Từ Vựng & Song Ngữ WebAR</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {showEn && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                        EN - VI
                      </span>
                    )}
                    {showZh && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                        ZH - VI
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-stone-400 block">Tiếng Việt:</span>
                    <strong className="text-emerald-300">{card.nameVi}</strong>
                  </div>
                  {showEn && (
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-stone-400 block">Tiếng Anh (IPA):</span>
                      <strong className="text-white">{card.nameEn}</strong>{" "}
                      <span className="font-mono text-[11px] text-amber-300">{card.ipa}</span>
                    </div>
                  )}
                  {showZh && (card.nameZh || card.pinyinZh) && (
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 col-span-2">
                      <span className="text-[10px] text-stone-400 block">Tiếng Trung (Pinyin):</span>
                      <strong
                        className="text-rose-300 text-sm"
                        style={{
                          fontFamily:
                            '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
                        }}
                      >
                        {card.nameZh || "Chưa nhập chữ Hán"}
                      </strong>{" "}
                      {card.pinyinZh && (
                        <span className="font-mono text-[12px] text-amber-300 font-semibold">
                          ({card.pinyinZh})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tài nguyên 3D & Âm thanh */}
              <div className="p-3.5 rounded-2xl bg-stone-950/90 border border-white/10 space-y-1.5 text-[11px]">
                <div className="font-black text-sky-300 flex items-center gap-1.5 mb-1">
                  <Box className="h-3.5 w-3.5 text-sky-400" />
                  <span>Tài Nguyên 3D & Âm Thanh Đã Gắn</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-stone-400">
                  <span>GLB (Web/Android):</span>
                  <code className="text-stone-200 truncate max-w-[210px]">{card.modelUrl || "Chưa gắn"}</code>
                </div>
                <div className="flex items-center justify-between gap-2 text-stone-400">
                  <span>USDZ (iPhone AR):</span>
                  <code className="text-stone-200 truncate max-w-[210px]">{card.iosModelUrl || "Chưa gắn"}</code>
                </div>
                <div className="flex items-center justify-between gap-2 text-stone-400">
                  <span>MindAR (.mind):</span>
                  <code className="text-stone-200 truncate max-w-[210px]">{card.targetUrl || "Chưa gắn"}</code>
                </div>
                <div className="flex items-center justify-between gap-2 text-stone-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Volume2 className="h-3 w-3 text-amber-400" />
                    <span>Âm thanh:</span>
                  </span>
                  <span className="text-emerald-300 font-bold">
                    {card.audios?.en || card.audios?.vi || card.audios?.zh
                      ? "Tệp MP3 riêng + AI"
                      : "Web Speech AI tự động"}
                  </span>
                </div>
              </div>

              {/* Mô tả */}
              {card.description && (
                <div className="text-xs text-stone-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-300 uppercase mb-0.5">
                    <Tag className="h-3 w-3 text-amber-400" />
                    <span>Mô tả thẻ:</span>
                  </span>
                  <p>{card.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-stone-950/95 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteProduct(card);
            }}
            className="py-2.5 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Xóa Thẻ</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {onAddToPrintQueue && (
              <button
                type="button"
                onClick={() => {
                  onAddToPrintQueue(card);
                }}
                className="py-2.5 px-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-stone-950 border border-emerald-400/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Đưa thẻ này vào danh sách hàng đợi in để xuất ZIP nhiều thẻ"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>+ Hàng Đợi In</span>
              </button>
            )}

            {onDownloadSingleCard && (
              <button
                type="button"
                onClick={() => {
                  onDownloadSingleCard(card);
                }}
                className="py-2.5 px-3.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-400/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Tải trực tiếp ảnh phôi thẻ chuẩn in (PNG kèm mã QR scannable)"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Tải Phôi In (PNG + QR)</span>
              </button>
            )}

            <Link
              href={`/ar/${card.slug}?ar=1${card.packCode ? `&code=${card.packCode}` : ""}`}
              target="_blank"
              className="py-2.5 px-3.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-400/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Mở WebAR 3D</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEditProduct(card);
              }}
              className="py-2.5 px-4 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-stone-950 border border-sky-400/40 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Sửa Thông Tin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLoadCardToCanvas(card);
              }}
              className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Chế Bản & In Thẻ Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

