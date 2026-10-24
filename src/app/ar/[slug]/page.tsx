import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAnimalBySlug, getAnimalSlugs } from "@/lib/animals";
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

export async function generateStaticParams() {
  const slugs = getAnimalSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ArPageProps): Promise<Metadata> {
  const { slug } = await params;
  const animal = getAnimalBySlug(slug);

  if (!animal) {
    return {
      title: "Không tìm thấy con vật | Poly Cards",
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
  const animal = getAnimalBySlug(slug);

  if (!animal) {
    notFound();
  }

  const buyUrl =
    animal.buyUrl && animal.buyUrl.trim() !== ""
      ? animal.buyUrl
      : siteConfig.defaultBuyUrl;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/70 via-amber-50/40 to-emerald-50/50 pb-16">
      {/* Top Header Toolbar - Không quảng cáo, chỉ có điều hướng an toàn */}
      <header className="sticky top-0 z-30 border-b border-amber-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-stone-700 hover:bg-amber-100/60 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-amber-600" />
            <span className="hidden sm:inline">Trang Chủ Poly Cards</span>
            <span className="sm:hidden">Quay Lại</span>
          </Link>

          {/* Logo Brand Mini */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white shadow-xs p-0.5">
              <Image
                src="/images/icons/logo.png"
                alt="Poly Cards"
                width={36}
                height={36}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-base font-extrabold text-amber-950">
              Poly Cards AR
            </span>
          </Link>

          {/* Action: Scan Another Animal */}
          <Link
            href="/scan"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Quét Con Khác</span>
            <span className="sm:hidden">Quét QR</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 sm:pt-8 space-y-6">
        {/* Safe environment badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 py-1.5 px-4 rounded-full max-w-fit mx-auto border border-emerald-300">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Không gian an toàn cho bé • Không chứa liên kết ngoài độc hại</span>
        </div>

        {/* Interactive AR & 3D Viewer Container */}
        <ArViewerContainer animal={animal} />

        {/* Bottom Animal Description & Purchasing Details */}
        <div className="rounded-3xl border-2 border-amber-200/90 bg-white/95 p-6 shadow-lg shadow-amber-900/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-100">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
                Thế Giới Tự Nhiên
              </span>
              <h2 className="text-2xl font-black text-stone-900">
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
              className="btn-toy-3d inline-flex min-h-[48px] w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Đặt Mua Thẻ Bài AR {animal.nameEn} ({animal.nameVi})</span>
            </Link>

            <Link
              href="/scan"
              className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-3 text-sm font-extrabold text-amber-950 hover:bg-amber-100 active:scale-95 transition-all"
            >
              <QrCode className="h-4 w-4 text-amber-700" />
              <span>Quét Thẻ Bài Động Vật Khác</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
