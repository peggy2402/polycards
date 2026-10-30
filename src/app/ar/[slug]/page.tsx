import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAnimalBySlug, getAnimalSlugs } from "@/lib/animals";
import { dbGetProductBySlug } from "@/lib/mongodb";
import { siteConfig } from "@/config/site";
import { ArViewerContainer } from "./ar-viewer-container";
import {
  ArrowLeft,
  QrCode,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface ArPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = getAnimalSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ArPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  const animal = getAnimalBySlug(cleanSlug) || (await dbGetProductBySlug(cleanSlug));

  if (!animal) {
    return {
      title: "Not Found | Poly Cards",
      description: "Thẻ bài không tồn tại trên hệ thống Poly Cards.",
    };
  }

  return {
    title: `${animal.nameEn} (${animal.nameVi}) - Trải Nghiệm Thực Tế Ảo AR`,
    description: `${animal.nameEn} trong thế giới Poly Cards. Quét mã để xem mô hình 3D AR sống động và nghe phát âm tiếng Anh, tiếng Việt chuẩn bản xứ.`,
    openGraph: {
      title: `${animal.nameEn} (${animal.nameVi}) - Poly Cards AR Live`,
      description: animal.description,
      images: [animal.images[0] || "/images/animals/lion.jpg"],
    },
  };
}

export default async function ArDetailPage({ params }: ArPageProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  const animal = getAnimalBySlug(cleanSlug) || (await dbGetProductBySlug(cleanSlug));

  // Nếu thẻ chưa tồn tại trên hệ thống, kích hoạt ngay trang 404 chuẩn của Poly Cards
  if (!animal) {
    notFound();
  }

  const buyUrl =
    animal.buyUrl && animal.buyUrl.trim() !== ""
      ? animal.buyUrl
      : siteConfig.defaultBuyUrl;

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-gradient-to-b from-sky-50/70 via-amber-50/40 to-emerald-50/50 pb-16">
      {/* Top Header Toolbar - Không quảng cáo, điều hướng an toàn, chuẩn Responsive 360px+ */}
      <header className="sticky top-0 z-30 border-b border-amber-200/80 bg-white/95 backdrop-blur-md w-full max-w-full overflow-x-hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-3 sm:px-6 gap-2">
          {/* Action: Quay lại */}
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-extrabold text-stone-700 hover:bg-amber-100/60 active:scale-95 transition-all shrink-0"
            aria-label="Quay lại trang chủ"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">Trang Chủ Poly Cards</span>
            <span className="sm:hidden text-xs">Quay Lại</span>
          </Link>

          {/* Logo Brand Mini - Truncate tự nhiên khi màn hình hẹp 360px */}
          <Link href="/" className="flex items-center gap-1.5 min-w-0 mx-1 shrink">
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded-xl bg-white shadow-xs p-0.5">
              <Image
                src="/images/icons/logo.png"
                alt="Poly Cards"
                width={36}
                height={36}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-sm sm:text-base font-black text-amber-950 truncate">
              Poly Cards AR
            </span>
          </Link>

          {/* Action: Scan Another Animal - Touch target 44px */}
          <Link
            href="/scan"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all shrink-0"
            aria-label="Quét thẻ bài khác"
          >
            <QrCode className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Quét Con Khác</span>
            <span className="sm:hidden">Quét QR</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area - Tránh tràn viền màn hình 360px */}
      <main className="mx-auto w-full max-w-4xl px-3 sm:px-6 pt-4 sm:pt-6 space-y-5 overflow-x-hidden">
        {/* Safe environment badge - Tự động xuống dòng gọn gàng trên mobile */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-900 bg-emerald-100/90 py-1.5 px-3 rounded-2xl sm:rounded-full w-full max-w-md mx-auto border border-emerald-300 text-center shadow-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="leading-tight">Không gian an toàn cho bé • Không chứa liên kết ngoài độc hại</span>
        </div>

        {/* Interactive AR & 3D Viewer Container */}
        <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-3xl bg-amber-100/60" />}>
          <ArViewerContainer animal={animal} />
        </Suspense>

        {/* Bottom Animal Description & Purchasing Details */}
        <div className="w-full rounded-3xl border-2 border-amber-200/90 bg-white/95 p-4 sm:p-6 shadow-lg shadow-amber-900/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-100">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
                Thế Giới Tự Nhiên
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                Về Bạn {animal.nameVi} ({animal.nameEn})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Mã QR: {animal.qrCode}</span>
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-stone-700 sm:text-base">
            {animal.description}
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href={`/order?animal=${animal.slug}`}
              className="btn-toy-3d inline-flex min-h-[48px] w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-5 sm:px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-600/25 active:scale-95 transition-all text-center"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span>Đặt Mua Thẻ Bài AR {animal.nameEn} ({animal.nameVi})</span>
            </Link>

            <Link
              href="/scan"
              className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 sm:px-6 py-3 text-xs sm:text-sm font-extrabold text-amber-950 hover:bg-amber-100 active:scale-95 transition-all text-center"
            >
              <QrCode className="h-4 w-4 shrink-0 text-amber-700" />
              <span>Quét Thẻ Bài Động Vật Khác</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
