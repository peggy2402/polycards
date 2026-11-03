"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { isInAppBrowser } from "@/lib/user-agent";
import { getAnimalBySlug } from "@/lib/animals";
import { ScanGuideModal } from "@/components/scanner/scan-guide-modal";
import { InAppBrowserModal } from "@/components/scanner/in-app-browser-modal";

export interface ScanCardSummary {
  slug: string;
  nameEn: string;
  nameVi: string;
  posterUrl?: string;
}

// Màn hình tải chuẩn dùng chung duy nhất (tránh chớp layout và giật font)
function ScanLoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-stone-950 text-white select-none">
      <div className="h-10 w-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      <span className="mt-3 text-xs font-semibold text-stone-400 tracking-wide">
        {message || "Đang khởi động Camera Poly Cards..."}
      </span>
    </div>
  );
}

// Dynamic import QrCameraScanner với ssr: false để ngăn chặn hoàn toàn lỗi hydration React #418
const DynamicQrCameraScanner = dynamic(
  () =>
    import("@/components/scanner/qr-camera-scanner").then(
      (mod) => mod.QrCameraScanner
    ),
  {
    ssr: false,
    loading: () => <ScanLoadingScreen message="Đang khởi động Camera Poly Cards..." />,
  }
);

function ScanContent() {
  const searchParams = useSearchParams();
  const expectSlug = searchParams.get("expect");

  // Khởi tạo thẻ mục tiêu từ kho tĩnh nếu có
  const [expectedAnimal, setExpectedAnimal] = useState<ScanCardSummary | undefined>(() => {
    if (!expectSlug) return undefined;
    const fallback = getAnimalBySlug(expectSlug);
    if (!fallback) return { slug: expectSlug, nameEn: expectSlug.toUpperCase(), nameVi: "" };
    return {
      slug: fallback.slug,
      nameEn: fallback.nameEn,
      nameVi: fallback.nameVi,
      posterUrl: fallback.posterUrl || fallback.images?.[0],
    };
  });

  // State 3 bước: "checking" (kiểm tra in-app) -> "inapp" (hiện cảnh báo) hoặc "normal" (mở camera)
  const [scanMode, setScanMode] = useState<"checking" | "inapp" | "normal">("checking");
  const [inAppName, setInAppName] = useState<string>("");
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Truy vấn dữ liệu thực tế của expectSlug nếu có, hỗ trợ hủy fetch cũ bằng AbortController
  useEffect(() => {
    if (!expectSlug) {
      setExpectedAnimal(undefined);
      return;
    }

    const cleanSlug = expectSlug.toLowerCase().trim();
    const controller = new AbortController();

    fetch(`/api/products/${cleanSlug}`, { signal: controller.signal })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Product not found");
      })
      .then((json) => {
        if (json.success && json.data) {
          const item = json.data;
          setExpectedAnimal({
            slug: item.slug || cleanSlug,
            nameEn: item.nameEn || cleanSlug.toUpperCase(),
            nameVi: item.nameVi || "",
            posterUrl: item.posterUrl,
          });
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          // Giữ fallback đã khởi tạo
        }
      });

    return () => {
      controller.abort();
    };
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
        <ScanLoadingScreen message="Đang khởi động Camera Poly Cards..." />
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
    <Suspense fallback={<ScanLoadingScreen message="Đang khởi động Camera Poly Cards..." />}>
      <ScanContent />
    </Suspense>
  );
}
