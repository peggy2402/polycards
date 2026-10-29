"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Animal } from "@/types/animal";
import { CardComboPack, DEFAULT_FEATURED_COMBO } from "@/data/combos";
import { ComboPackCard } from "./combo-pack-card";
import { SubjectFocusImage } from "@/components/common/subject-focus-image";
import {
  getMergedProducts,
  getFeaturedCombo,
  PRODUCTS_UPDATED_EVENT,
  COMBO_UPDATED_EVENT,
} from "@/lib/products-store";
import { formatVndCurrency } from "@/lib/formatters";
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

function HomeMiniProductCard({ card }: { card: Animal }) {
  const cardDetailHref = `/ar/${card.slug}`;
  const price = card.price || 219000;
  const originalPrice = card.originalPrice || Math.round(price * 1.3);
  const discountPercent =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;
  const hasBadge = Boolean(card.badge && card.badge.trim() !== "");

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-amber-200/90 bg-white p-3.5 shadow-md shadow-amber-900/5 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/15">
      {/* Toàn bộ khối Ảnh + Tiêu đề chữ trên thẻ điều hướng mượt sang trang chi tiết 3D & AR */}
      <Link
        href={cardDetailHref}
        className="block space-y-3 cursor-pointer focus:outline-hidden"
        title={`Mở thẻ 3D & WebAR: ${card.nameVi} (${card.nameEn})`}
      >
        <div className="relative aspect-[4/4.2] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 via-amber-50/40 to-emerald-50/60 border border-amber-100">
          <SubjectFocusImage
            primaryUrl={card.images?.[0]}
            secondaryUrl={card.posterUrl}
            alt={`Thẻ học thông minh AR ${card.nameVi} (${card.nameEn})`}
            className="transition-transform duration-500 group-hover:scale-106"
          />

          {/* Top-Left: Danh mục + AR 3D */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/75 text-white backdrop-blur-md border border-white/15">
              {card.category || "Động Vật"}
            </span>
            {card.arEnabled !== false && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                <Sparkles className="h-2.5 w-2.5" />
                <span>AR 3D</span>
              </span>
            )}
          </div>

          {/* Top-Right: Huy hiệu nổi bật (Badge tùy biến từ Kho Thẻ Bài) */}
          {hasBadge && (
            <span className="absolute top-2.5 right-2.5 z-10 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 border border-amber-300 shadow-sm">
              {card.badge}
            </span>
          )}

          {/* Bottom-Right: Nhãn Xem 3D khi hover */}
          <div className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-stone-900/80 px-2.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-md border border-white/10 transition-colors group-hover:bg-amber-400 group-hover:text-stone-950">
            <Sparkles className="h-3 w-3" />
            <span>Xem 3D</span>
          </div>
        </div>

        {/* Khối chữ trên thẻ: Nhấn vào text chuyển trang ngay */}
        <div className="px-0.5 space-y-1">
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors truncate">
              {card.nameEn}
            </h3>
            {card.ipa && (
              <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 shrink-0">
                {card.ipa}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-bold text-amber-800 group-hover:text-amber-600 transition-colors truncate">
            {card.nameVi}
            {card.enableZhVi && card.nameZh ? ` • ${card.nameZh}` : ""}
          </p>
        </div>
      </Link>

      {/* Chân thẻ: Giá tiền + Nút chuyển nhanh */}
      <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-between gap-2 px-0.5">
        <Link href={cardDetailHref} className="block cursor-pointer min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-amber-950">
              {formatVndCurrency(price)}
            </span>
            {discountPercent > 0 && (
              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                -{discountPercent}%
              </span>
            )}
          </div>
          {originalPrice > price && (
            <span className="block text-[11px] text-stone-400 line-through font-mono leading-tight">
              {formatVndCurrency(originalPrice)}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={card.buyUrl || `/order?animal=${card.slug}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 transition-colors"
            title={`Đặt mua thẻ ${card.nameVi}`}
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>

          <Link
            href={cardDetailHref}
            className="inline-flex h-9 items-center gap-1 rounded-xl bg-amber-400 hover:bg-amber-300 px-3 text-xs font-black text-stone-950 shadow-2xs transition-all active:scale-95"
          >
            <span>Mở Thẻ</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductsGrid() {
  const [products, setProducts] = useState<Animal[]>(() => getMergedProducts());
  const [featuredCombo, setFeaturedCombo] = useState<CardComboPack>(
    DEFAULT_FEATURED_COMBO
  );

  const loadHomeData = useCallback(async () => {
    // 1. Đồng bộ danh sách thẻ bài từ MongoDB + Local Store
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProducts(getMergedProducts(json.data));
        } else {
          setProducts(getMergedProducts());
        }
      } else {
        setProducts(getMergedProducts());
      }
    } catch {
      setProducts(getMergedProducts());
    }

    // 2. Đồng bộ Khối Combo Lớn từ MongoDB + Local Store
    setFeaturedCombo(getFeaturedCombo());
    try {
      const comboRes = await fetch("/api/featured-combo");
      if (comboRes.ok) {
        const comboJson = await comboRes.json();
        if (comboJson.success && comboJson.data) {
          setFeaturedCombo(comboJson.data);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadHomeData();
    const handleRefresh = () => loadHomeData();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleRefresh);
    window.addEventListener(COMBO_UPDATED_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleRefresh);
      window.removeEventListener(COMBO_UPDATED_EVENT, handleRefresh);
    };
  }, [loadHomeData]);

  // Lọc các thẻ được ghim lên Trang Chủ (showOnHome === true). Nếu chưa chọn thủ công thì hiển thị 4 thẻ đầu tiên
  const pinnedCards = products.filter((p) => Boolean(p.showOnHome));
  const homeFeaturedCards =
    pinnedCards.length > 0 ? pinnedCards : products.slice(0, 4);

  return (
    <section
      id="products"
      className="scroll-mt-20 py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/25 to-sky-50/20 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-950 border border-amber-300 shadow-2xs">
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Bộ Sưu Tập Thẻ Lẻ & Combo Thông Minh AR</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Khám Phá Thẻ Học & Bộ Combo AR Poly Cards
          </h2>

          <p className="mt-3 text-base text-stone-700 sm:text-lg leading-relaxed">
            Chạm trực tiếp vào từng thẻ bài bên dưới để xem mô hình 3D sống động, nghe phát âm bản xứ và quét thử WebAR ngay trên trình duyệt.
          </p>
        </div>

        {/* HÀNG TRÊN: 4 THẺ NHỎ NẰM CÙNG 1 HÀNG */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {homeFeaturedCards.map((card) => (
            <HomeMiniProductCard key={card.id || card.slug} card={card} />
          ))}
        </div>

        {/* HÀNG DƯỚI: 1 KHỐI COMBO LỚN TRẢI NGANG DƯỚI 4 THẺ NHỎ */}
        <div className="mt-6 sm:mt-8">
          <ComboPackCard pack={featuredCombo} isVipBanner={true} />
        </div>

        {/* Nút điều hướng sang Kho Thẻ Bài đầy đủ (/products) & Cam kết bản quyền */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/products"
            className="btn-toy-3d inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white hover:bg-amber-50 border-2 border-amber-400 px-6 py-3 text-xs sm:text-sm font-black text-stone-900 shadow-md transition-all hover:scale-102 active:scale-95"
          >
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Xem Toàn Bộ Kho Thẻ Bài Tất Cả Chủ Đề (/products)</span>
            <ArrowRight className="h-4 w-4 text-amber-600" />
          </Link>

          <div className="w-full rounded-2xl border border-amber-200/80 bg-white/90 p-4 text-center text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md">
            <p className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                100% Bộ thẻ chính hãng Poly Cards đi kèm mã bộ bản quyền bảo hành trọn đời và quyền truy cập không giới hạn vào ứng dụng WebAR tương tác 3D.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
