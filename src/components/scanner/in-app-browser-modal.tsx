"use client";

import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, Copy, Check, ExternalLink, ArrowRight } from "lucide-react";
import { getMobileOperatingSystem } from "@/lib/user-agent";

interface InAppBrowserModalProps {
  appName: string;
  onContinueAnyway?: () => void;
}

export function InAppBrowserModal({ appName, onContinueAnyway }: InAppBrowserModalProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showAndroidIntentHint, setShowAndroidIntentHint] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const os = getMobileOperatingSystem();

  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://polycards.vn/scan";

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopied(true);
          setCopyFailed(false);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      if (inputRef.current) {
        inputRef.current.select();
        inputRef.current.setSelectionRange(0, 99999);
      }
      const successful = document.execCommand("copy");
      if (successful) {
        setCopied(true);
        setCopyFailed(false);
        setTimeout(() => setCopied(false), 2500);
      } else {
        setCopyFailed(true);
      }
    } catch {
      setCopyFailed(true);
    }
  };

  const handleOpenAndroidChrome = () => {
    if (typeof window === "undefined") return;
    const { host, pathname, search } = window.location;
    const intentUrl = `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;

    // Sau 1.5 giây nếu vẫn còn ở trang này (trình duyệt không mở được intent Chrome), hiện gợi ý sao chép
    setTimeout(() => {
      setShowAndroidIntentHint(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border-2 border-amber-300 bg-white p-6 shadow-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
          <AlertTriangle className="h-8 w-8 text-amber-600 animate-bounce" />
        </div>

        <h3 className="mt-4 text-xl font-extrabold text-stone-900">
          Phát Hiện Trình Duyệt {appName}
        </h3>

        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600">
          Trình duyệt nhúng của <strong>{appName}</strong> thường chặn quyền truy cập Camera, khiến việc quét mã QR và xem tương tác AR 3D bị gián đoạn.
        </p>

        {/* Hướng dẫn từng bước */}
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-left border border-amber-200/80 space-y-2">
          <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
            Cách mở bằng trình duyệt chuẩn:
          </span>
          <p className="text-xs text-stone-700 leading-relaxed">
            1. Bấm vào biểu tượng <strong>dấu 3 chấm (⋯)</strong> hoặc <strong>biểu tượng chia sẻ</strong> ở góc màn hình.
          </p>
          <p className="text-xs text-stone-700 leading-relaxed">
            2. Chọn <strong>&quot;Mở bằng trình duyệt ngoài&quot;</strong> (hoặc{" "}
            <strong>{os === "ios" ? "Safari" : "Chrome"}</strong>).
          </p>
        </div>

        {/* Ô liên kết chỉ đọc dự phòng copy khi clipboard API bị chặn */}
        <div className="mt-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 p-1.5">
            <input
              ref={inputRef}
              type="text"
              readOnly
              value={currentUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-transparent px-2 text-xs font-mono text-stone-700 outline-none select-all"
              aria-label="Đường dẫn trang web"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg bg-stone-200 hover:bg-stone-300 px-2.5 py-1 text-[11px] font-bold text-stone-800 transition-colors"
            >
              {copied ? "Đã chép" : "Sao chép"}
            </button>
          </div>
          {copyFailed && (
            <p className="mt-1 text-[11px] text-amber-700 font-semibold">
              Vui lòng chạm giữ vào ô đường dẫn ở trên để chọn &quot;Sao chép&quot; rồi dán vào {os === "ios" ? "Safari" : "Chrome"}.
            </p>
          )}
        </div>

        {/* Các nút hành động */}
        <div className="mt-4 space-y-2">
          {/* Nút mở Chrome nếu là Android */}
          {os === "android" && (
            <>
              <button
                type="button"
                onClick={handleOpenAndroidChrome}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Mở Trực Tiếp Bằng Chrome</span>
              </button>
              {showAndroidIntentHint && (
                <p className="text-[11px] text-stone-500 italic">
                  Nếu Chrome không tự mở, bạn vui lòng dùng nút &quot;Sao Chép&quot; ở trên và mở trình duyệt thủ công.
                </p>
              )}
            </>
          )}

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-200" />
                <span>Đã Sao Chép Liên Kết!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Sao Chép Liên Kết Trang Web</span>
              </>
            )}
          </button>

          {/* Nút Bỏ Qua và Thử Quét */}
          {onContinueAnyway && (
            <button
              type="button"
              onClick={onContinueAnyway}
              className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
            >
              <span>Vẫn muốn thử quét trên trình duyệt này</span>
              <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
