"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Animal } from "@/types/animal";
import { isInAppBrowser } from "@/lib/user-agent";
import { getAnimalBySlug } from "@/lib/animals";
import { ScanGuideModal } from "@/components/scanner/scan-guide-modal";
import { InAppBrowserModal } from "@/components/scanner/in-app-browser-modal";

// Dynamic import QrCameraScanner với ssr: false để ngăn chặn hoàn toàn lỗi hydration React #418
const DynamicQrCameraScanner = dynamic(
  () =>
    import("@/components/scanner/qr-camera-scanner").then(
      (mod) => mod.QrCameraScanner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-stone-950 text-white">
        <div className="h-10 w-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span className="mt-3 text-xs font-semibold text-stone-400">
          Đang chuẩn bị Camera AR...
        </span>
      </div>
    ),
  }
);

function ScanContent() {
  const searchParams = useSearchParams();
  const expectSlug = searchParams.get("expect");

  // Quản lý trạng thái nạp dữ liệu thẻ mục tiêu
  const [expectedAnimal, setExpectedAnimal] = useState<Animal | undefined>(() => {
    return expectSlug ? getAnimalBySlug(expectSlug) : undefined;
  });

  // State 3 bước: "checking" (kiểm tra in-app) -> "inapp" (hiện cảnh báo) hoặc "normal" (mở camera)
  const [scanMode, setScanMode] = useState<"checking" | "inapp" | "normal">("checking");
  const [inAppName, setInAppName] = useState<string>("");
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Truy vấn dữ liệu thực tế của expectSlug nếu có
  useEffect(() => {
    if (!expectSlug) return;
    const cleanSlug = expectSlug.toLowerCase().trim();

    fetch(`/api/products/${cleanSlug}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Product not found");
      })
      .then((json) => {
        if (json.success && json.data) {
          setExpectedAnimal(json.data as Animal);
        }
      })
      .catch(() => {
        // Fallback đã có trong khởi tạo
      });
  }, [expectSlug]);

  // Kiểm tra in-app browser sau khi client mounted
  useEffect(() => {
    const detected = isInAppBrowser();
    if (detected.isInApp) {
      setInAppName(detected.appName);
      setScanMode("inapp");
    } else {
      setScanMode("normal");
    }
  }, []);

  return (
    <div
      suppressHydrationWarning
      className="min-h-[100dvh] w-full bg-stone-950 relative overflow-hidden"
    >
      {/* 1. Màn hình Kiểm Tra Môi Trường Trình Duyệt */}
      {scanMode === "checking" && (
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-stone-950 text-white">
          <div className="h-10 w-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="mt-3 text-xs font-semibold text-stone-400">
            Đang khởi động Camera Poly Cards...
          </span>
        </div>
      )}

      {/* 2. Cảnh báo In-App Browser (Zalo, TikTok, Facebook, WeChat, etc.) */}
      {scanMode === "inapp" && (
        <InAppBrowserModal
          appName={inAppName}
          onContinueAnyway={() => setScanMode("normal")}
        />
      )}

      {/* 3. Camera Scanner Toàn Màn Hình */}
      {scanMode === "normal" && (
        <DynamicQrCameraScanner
          expectedAnimal={expectedAnimal}
          onOpenGuide={() => setShowGuideModal(true)}
        />
      )}

      {/* 4. Modal Hướng Dẫn Quét Thẻ An Toàn (Bottom Sheet / Popup) */}
      {showGuideModal && (
        <ScanGuideModal
          expectedAnimal={expectedAnimal}
          onStartScan={() => setShowGuideModal(false)}
        />
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-stone-950 text-white">
          <div className="h-10 w-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="mt-3 text-xs font-semibold text-stone-400">
            Đang nạp ứng dụng Poly Cards...
          </span>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
