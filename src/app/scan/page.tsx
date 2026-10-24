"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAnimalBySlug } from "@/lib/animals";
import { isInAppBrowser } from "@/lib/user-agent";
import { ScanGuideModal } from "@/components/scanner/scan-guide-modal";
import { QrCameraScanner } from "@/components/scanner/qr-camera-scanner";
import { InAppBrowserModal } from "@/components/scanner/in-app-browser-modal";

function ScanContent() {
  const searchParams = useSearchParams();
  const expectSlug = searchParams.get("expect");
  const expectedAnimal = expectSlug ? getAnimalBySlug(expectSlug) : undefined;

  const [isScanning, setIsScanning] = useState(false);
  const [inAppInfo, setInAppInfo] = useState<{ isInApp: boolean; appName: string }>({
    isInApp: false,
    appName: "",
  });

  useEffect(() => {
    // Check for in-app browsers like Zalo, TikTok, Facebook
    const detected = isInAppBrowser();
    if (detected.isInApp) {
      setInAppInfo(detected);
    }
  }, []);

  return (
    <div
      suppressHydrationWarning
      className={`min-h-[100dvh] w-full transition-colors duration-300 ${
        isScanning ? "bg-stone-950" : "bg-[#FCFBF7]"
      }`}
    >
      {/* Show in-app warning if opened in Zalo/Facebook/TikTok */}
      {inAppInfo.isInApp && <InAppBrowserModal appName={inAppInfo.appName} />}

      {/* Toggle between Guide Screen and Fullscreen Camera Scanner */}
      {!isScanning ? (
        <ScanGuideModal
          expectedAnimal={expectedAnimal}
          onStartScan={() => setIsScanning(true)}
        />
      ) : (
        <QrCameraScanner
          expectedAnimal={expectedAnimal}
          onBackToGuide={() => setIsScanning(false)}
        />
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
              Đang khởi động giao diện quét...
            </span>
          </div>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
