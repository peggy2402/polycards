"use client";

import React, { useMemo } from "react";
import {
  QrCode,
  Sparkles,
  RefreshCw,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Animal } from "@/types/animal";
import { normalizeSlugWithPinyin } from "@/lib/slug-helper";

interface QrConfigPanelProps {
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

  // Dữ liệu kiểm tra trùng slug & nạp nhanh phôi thẻ
  existingCards?: Animal[];
  onSelectExistingCard?: (card: Animal) => void;
}

export function QrConfigPanel({
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
}: QrConfigPanelProps) {
  // Xử lý khi người dùng gõ slug: Tự động convert tiếng Trung sang Pinyin, tiếng Việt bỏ dấu
  const handleSlugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = normalizeSlugWithPinyin(raw);
    onSetSlug(clean);
  };

  // Tìm thẻ bị trùng slug trên hệ thống (nếu có)
  const duplicateCard = useMemo(() => {
    const clean = slug.trim().toLowerCase();
    if (!clean) return null;
    return existingCards.find((c) => c.slug.trim().toLowerCase() === clean) || null;
  }, [slug, existingCards]);

  return (
    <div className="rounded-2xl bg-gradient-to-b from-amber-500/15 via-black/50 to-black/60 border-2 border-amber-400/50 p-4 space-y-4 shadow-xl shadow-amber-500/10">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <QrCode className="h-4 w-4 text-amber-400" />
          <span>1. Khởi Tạo Mã QR (QR Generator)</span>
        </label>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
          Mã số #{qrGeneratedCount}
        </span>
      </div>

      {/* Domain đích chính thức cố định https://polycards.vn */}
      <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-stone-400">Máy chủ WebAR:</span>
        <span className="text-[11px] font-mono font-black text-emerald-400 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>polycards.vn</span>
        </span>
      </div>

      {/* Nhập Slug */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-stone-200">
          Slug Định Danh Thẻ Bài / Nhân Vật:
        </label>
        <div className="relative">
          <input
            type="text"
            value={slug}
            onChange={handleSlugInputChange}
            placeholder="Nhập slug ..."
            className={`w-full bg-black/80 border rounded-xl px-3 py-2.5 text-xs font-mono text-amber-300 placeholder-stone-500 focus:outline-hidden transition-colors ${
              duplicateCard
                ? "border-amber-400 ring-2 ring-amber-400/20"
                : "border-white/20 focus:border-amber-400"
            }`}
          />
        </div>
        <p className="text-[10px] text-stone-400">
          * Nhập chữ thường tiếng Anh / tiếng Việt / tiếng Trung (tiếng Trung tự convert sang Pinyin, ví dụ: <em>螺蛳粉 &rarr; luo-si-fen</em>).
        </p>

        {/* Khối Thông Báo Chế Độ Sửa / Cập Nhật Thẻ Hiện Có */}
        {duplicateCard && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border-2 border-amber-400/40 text-xs space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-black text-amber-300">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Chế Độ Chỉnh Sửa &amp; Cập Nhật Thẻ</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Sẽ Lưu Đè
              </span>
            </div>

            <div className="flex items-center gap-2.5 bg-black/50 p-2 rounded-xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={duplicateCard.images?.[0] || duplicateCard.posterUrl || "/images/icons/logo.png"}
                alt={duplicateCard.nameVi}
                className="h-11 w-11 rounded-lg object-cover border border-amber-400/40 shrink-0 bg-stone-900"
              />
              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-xs truncate">
                  {duplicateCard.nameVi} ({duplicateCard.nameEn})
                </div>
                <div className="text-[10px] text-stone-300 truncate">
                  Slug: <span className="font-mono text-amber-300">/{duplicateCard.slug}/</span>
                  {duplicateCard.packCode ? ` • Mã: ${duplicateCard.packCode}` : ""}
                </div>
                <p className="text-[10px] text-emerald-400 font-medium">
                  ✓ Khi bấm &quot;Đẩy Thẻ Lên Kho&quot;, hệ thống sẽ cập nhật đè thẻ này.
                </p>
              </div>
            </div>

            {/* Các tùy chọn hỗ trợ người dùng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {onSelectExistingCard && (
                <button
                  type="button"
                  onClick={() => onSelectExistingCard(duplicateCard)}
                  className="py-1.5 px-2.5 rounded-lg bg-amber-400/20 hover:bg-amber-400 hover:text-stone-950 text-amber-300 border border-amber-400/30 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                >
                  <ArrowRight className="h-3 w-3" />
                  <span>Nạp lại phôi thẻ này</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onSetSlug(`${duplicateCard.slug}-moi`)}
                className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white border border-white/15 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                title="Đổi slug nếu muốn tạo thành thẻ mới thay vì lưu đè thẻ cũ"
              >
                <span>Tạo thẻ mới (đổi slug)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Các Tùy Chọn Kích Hoạt AR */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-200">
          <input
            type="checkbox"
            checked={directAr}
            onChange={(e) => onSetDirectAr(e.target.checked)}
            className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 h-4 w-4"
          />
          <span>Mở thẳng WebAR Camera khi quét QR (?ar=1)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-200">
          <input
            type="checkbox"
            checked={includeLicense}
            onChange={(e) => onSetIncludeLicense(e.target.checked)}
            className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 h-4 w-4"
          />
          <span>Nhúng mã bản quyền tự kích hoạt 1 chạm (&amp;code=...)</span>
        </label>

        {includeLicense && (
          <div className="pl-6 pt-1">
            <input
              type="text"
              value={licenseCode}
              onChange={(e) => onSetLicenseCode(e.target.value.toUpperCase())}
              placeholder="VD: VIP-8888-9999"
              className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-400 uppercase placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>
        )}
      </div>

      {/* Nút Tạo / Cập Nhật Mã QR */}
      <button
        type="button"
        onClick={onGenerateQr}
        disabled={isGeneratingQr || !slug.trim()}
        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        <RefreshCw className={`h-4 w-4 ${isGeneratingQr ? "animate-spin" : ""}`} />
        <span>{isGeneratingQr ? "Đang tạo mã QR nét cao..." : "Tạo / Cập Nhật Mã QR Ngay"}</span>
      </button>

      {/* Xem Trước Ảnh QR & Tải Xuống / Copy Link (Chỉ giữ tải PNG và Copy Link) */}
      {qrDataUrl && (
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 bg-black/60 p-2.5 rounded-xl border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="Mã QR Poly Cards"
              className="h-16 w-16 rounded-lg bg-white p-1 shrink-0 border border-amber-300/60"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Mã QR Đã Sẵn Sàng Quét</span>
              </div>
              <p className="text-[10px] font-mono text-stone-400 truncate mt-0.5" title={targetUrl}>
                {targetUrl}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onDownloadQrPng}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              <span>Tải PNG (1024px)</span>
            </button>

            <button
              type="button"
              onClick={onCopyUrl}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              {copiedUrl ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã Chép!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-amber-400" />
                  <span>Chép URL</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
