"use client";

import React from "react";
import {
  QrCode,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  Download,
  FileCode,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";

interface QrConfigPanelProps {
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
}

export function QrConfigPanel({
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
}: QrConfigPanelProps) {
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

      {/* Chọn Chế Độ Tạo QR: Theo Slug AR hay Link Tùy Biến */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10">
        <button
          type="button"
          onClick={() => onSetQrMode("slug")}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            qrMode === "slug"
              ? "bg-amber-500 text-stone-950 font-black shadow-md"
              : "text-stone-300 hover:text-white"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          <span>Theo Thẻ AR (Slug)</span>
        </button>
        <button
          type="button"
          onClick={() => onSetQrMode("custom")}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            qrMode === "custom"
              ? "bg-amber-500 text-stone-950 font-black shadow-md"
              : "text-stone-300 hover:text-white"
          }`}
        >
          <LinkIcon className="h-3 w-3" />
          <span>Link Tùy Biến</span>
        </button>
      </div>

      {/* Form nhập liệu tương ứng */}
      {qrMode === "slug" ? (
        <div className="space-y-3">
          {/* Chọn môi trường đích */}
          <div className="flex items-center justify-between text-xs font-bold text-stone-300 pb-1">
            <span>Máy chủ đích QR:</span>
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => onSetQrTargetEnv("production")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  qrTargetEnv === "production"
                    ? "bg-amber-500 text-stone-950 shadow"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Quét bằng camera điện thoại ngoài đời (trang web Vercel đã deploy)"
              >
                Online Vercel (Chuẩn in)
              </button>
              <button
                type="button"
                onClick={() => onSetQrTargetEnv("local")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  qrTargetEnv === "local"
                    ? "bg-emerald-500 text-stone-950 shadow"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Quét test trực tiếp trên máy tính localhost:3000"
              >
                Localhost
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              Slug Tên Thẻ / Hành Động / Con Vật:
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => onSetSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="Ví dụ: lion, cat, jump, apple..."
              className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
            />

            {/* Preset Buttons nhanh */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-stone-400">Chọn nhanh:</span>
              {[
                { slugKey: "lion", label: "Sư Tử" },
                { slugKey: "cat", label: "Con Mèo" },
                { slugKey: "dog", label: "Con Chó" },
                { slugKey: "deer", label: "Hươu" },
                { slugKey: "elephant", label: "Voi" },
                { slugKey: "panda", label: "Gấu Trúc" },
                { slugKey: "jump", label: "Nhảy" },
              ].map((item) => (
                <button
                  key={item.slugKey}
                  type="button"
                  onClick={() => onSetSlug(item.slugKey)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                    slug === item.slugKey
                      ? "bg-amber-400 text-stone-950 border-amber-300"
                      : "bg-white/5 text-stone-300 border-white/10 hover:bg-white/20"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Các tùy chọn kích hoạt AR */}
          <div className="space-y-2 pt-1 border-t border-white/10">
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
              <span>Nhúng mã bản quyền tự kích hoạt 1 chạm (&code=...)</span>
            </label>

            {includeLicense && (
              <div className="pl-6 pt-1">
                <input
                  type="text"
                  value={licenseCode}
                  onChange={(e) => onSetLicenseCode(e.target.value.toUpperCase())}
                  placeholder="Mã bản quyền: POLY-JUMP-2026..."
                  className="w-full bg-black/80 border border-amber-400/40 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-400 placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-bold text-stone-300 mb-1">
            Đường Dẫn URL Tùy Biến:
          </label>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => onSetCustomUrl(e.target.value)}
            placeholder="https://polycards-one.vercel.app/ar/..."
            className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
          />
          <p className="text-[10px] text-stone-400 mt-1">
            Có thể nhập bất kỳ đường link website, video, hoặc trang đặt hàng.
          </p>
        </div>
      )}

      {/* NÚT TẠO MÃ QR NỔI BẬT */}
      <button
        type="button"
        onClick={onGenerateQr}
        disabled={isGeneratingQr}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm active:scale-98 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
      >
        <RefreshCw className={`h-4 w-4 ${isGeneratingQr ? "animate-spin" : ""}`} />
        <span>{isGeneratingQr ? "Đang Khởi Tạo QR..." : "Tạo / Cập Nhật Mã QR Ngay"}</span>
      </button>

      {/* KHUNG XEM TRƯỚC MÃ QR RIÊNG BIỆT */}
      <div className="p-3.5 rounded-2xl bg-black/70 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-3.5">
        <div className="relative h-28 w-28 shrink-0 rounded-xl bg-white p-1.5 shadow-xl flex items-center justify-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="Mã QR Preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-stone-400 text-[10px]">
              Đang tạo...
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-black text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mã QR Đã Sẵn Sàng Quét Thử</span>
            </div>
            <div className="text-[10px] text-stone-400 truncate max-w-full font-mono mt-0.5" title={targetUrl}>
              {targetUrl}
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <button
              type="button"
              onClick={onDownloadQrPng}
              className="py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Tải riêng file PNG độ nét cao (1024px)"
            >
              <Download className="h-3 w-3" />
              <span>Tải PNG</span>
            </button>

            <button
              type="button"
              onClick={onDownloadQrSvg}
              className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Tải riêng file vector SVG vô hạn độ phân giải"
            >
              <FileCode className="h-3 w-3 text-sky-400" />
              <span>Tải SVG</span>
            </button>

            <button
              type="button"
              onClick={onCopyUrl}
              className="py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Sao chép liên kết"
            >
              {copiedUrl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedUrl ? "Đã chép" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
