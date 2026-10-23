"use client";

import React, { useState } from "react";
import { AlertTriangle, Copy, Check, ExternalLink } from "lucide-react";

interface InAppBrowserModalProps {
  appName: string;
}

export function InAppBrowserModal({ appName }: InAppBrowserModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border-2 border-amber-300 bg-white p-6 shadow-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-9 w-9 text-amber-600" />
        </div>

        <h3 className="mt-4 text-xl font-extrabold text-stone-900">
          Phát Hiện Trình Duyệt {appName}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Trình duyệt nhúng của <strong>{appName}</strong> thường chặn quyền truy cập Camera, khiến việc quét mã QR và xem thực tế ảo AR bị gián đoạn.
        </p>

        {/* Instructions */}
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-left border border-amber-200/80 space-y-2">
          <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
            Hướng dẫn mở trình duyệt chuẩn:
          </span>
          <p className="text-xs text-stone-700 leading-relaxed">
            1. Nhấn vào biểu tượng <strong>dấu 3 chấm (⋯)</strong> hoặc <strong>biểu tượng chia sẻ</strong> ở góc trên/dưới màn hình.
          </p>
          <p className="text-xs text-stone-700 leading-relaxed">
            2. Chọn <strong>"Mở bằng trình duyệt ngoài"</strong> (hoặc <strong>Safari</strong> trên iPhone / <strong>Chrome</strong> trên Android).
          </p>
        </div>

        {/* Copy Link Button */}
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Đã Sao Chép Liên Kết!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Sao Chép Liên Kết Trang Web</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
