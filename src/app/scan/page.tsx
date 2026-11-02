"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAnimalBySlug } from "@/lib/animals";
import { isInAppBrowser } from "@/lib/user-agent";
import { ScanGuideModal } from "@/components/scanner/scan-guide-modal";
import { QrCameraScanner } from "@/components/scanner/qr-camera-scanner";
import { InAppBrowserModal } from "@/components/scanner/in-app-browser-modal";
import { X } from "lucide-react";

function ScanContent() {
  const searchParams = useSearchParams();
  const expectSlug = searchParams.get("expect");
  const expectedAnimal = expectSlug ? getAnimalBySlug(expectSlug) : undefined;

  // Mặc định BẬT NGAY Camera Scanner để quét tức thì
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [inAppInfo, setInAppInfo] = useState<{ isInApp: boolean; appName: string }>({
    isInApp: false,
    appName: "",
  });

  useEffect(() => {
    // Kiểm tra các trình duyệt in-app như Zalo, TikTok, Facebook
    const detected = isInAppBrowser();
    if (detected.isInApp) {
      setInAppInfo(detected);
    }
  }, []);

  return (
    <div
      suppressHydrationWarning
      className="min-h-[100dvh] w-full bg-stone-950 relative overflow-hidden"
    >
      {/* Cảnh báo nếu mở trong Zalo / Facebook / TikTok */}
      {inAppInfo.isInApp && <InAppBrowserModal appName={inAppInfo.appName} />}

      {/* 1. Camera Scanner Toàn Màn Hình Trực Tiếp */}
      <QrCameraScanner
        expectedAnimal={expectedAnimal}
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* 2. Modal Hướng Dẫn Quét Thẻ An Toàn (Popup Overlay Khi Cần) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90dvh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 shadow-md transition-all active:scale-90"
              title="Đóng hướng dẫn"
            >
              <X className="h-5 w-5" />
            </button>

            <ScanGuideModal
              expectedAnimal={expectedAnimal}
              onStartScan={() => setShowGuideModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-stone-950 text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-stone-400">
              Đang khởi động Camera AR...
            </span>
          </div>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
