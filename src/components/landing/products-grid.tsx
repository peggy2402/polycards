"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { COMBO_PACKS } from "@/data/combos";
import { ComboPackCard } from "./combo-pack-card";
import {
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Compass,
  Tag,
  ArrowUpRight,
  Eye,
  Volume2,
} from "lucide-react";

export function ProductsGrid() {
  const [quickSearch, setQuickSearch] = useState("");
  const router = useRouter();

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      router.push(`/products?search=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      router.push("/products");
    }
  };

  const quickCategories = [
    { label: "Tất cả 60+ Thẻ", href: "/products", badge: "Đầy đủ" },
    { label: "Động Vật Hoang Dã", href: "/products?category=dong-vat", badge: "30 thẻ" },
    { label: "Hành Động & Thể Chất", href: "/products?category=hanh-dong", badge: "30 thẻ" },
    { label: "Phương Tiện Giao Thông", href: "/products?category=phuong-tien", badge: "Hot" },
    { label: "Trái Cây & Ẩm Thực", href: "/products?category=trai-cay", badge: "Mới" },
  ];

  return (
    <section
      id="products"
      className="scroll-mt-20 py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/25 to-sky-50/20 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-950 border border-amber-300 shadow-2xs">
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Hệ Sinh Thái Thẻ Học AR Đa Giác Quan</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Các Bộ Thẻ Học Thông Minh AR Poly Cards
          </h2>

          <p className="mt-3 text-base text-stone-700 sm:text-lg leading-relaxed max-w-3xl mx-auto">
            Mỗi bộ gồm 30 thẻ bài chống nước cao cấp, hình ảnh 3D hoạt hình sống động, tích hợp phát âm chuẩn 3 ngôn ngữ (Anh - Việt - Trung) và mã QR kích hoạt AR trọn đời.
          </p>

          {/* DUAL MODE NAVIGATOR: Điều hướng phân biệt rõ ràng giữa Bộ Combo và Kho Thẻ Lẻ */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Chế độ 1: Bộ Combo (Đang xem) */}
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-xs sm:text-sm font-black text-stone-950 shadow-md shadow-amber-500/25 border border-amber-400">
              <Layers className="h-4 w-4" />
              <span>1. Bộ Sưu Tập Combo Có Sẵn (Ưu Đãi)</span>
            </div>

            {/* Chế độ 2: Nút chuyển sang /products RÕ RÀNG & NỔI BẬT NHẤT */}
            <Link
              href="/products"
              className="group relative inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs sm:text-sm font-black text-slate-900 border-2 border-emerald-500 hover:border-emerald-600 hover:bg-emerald-50 shadow-md shadow-emerald-500/15 transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <SlidersHorizontal className="h-4 w-4 text-emerald-600 transition-transform group-hover:rotate-45" />
              <span>2. Tra Cứu Kho Thẻ Lẻ &amp; Bộ Lọc Đầy Đủ</span>
              <ArrowRight className="h-4 w-4 text-emerald-600 transition-transform group-hover:translate-x-1" />
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                60+ Thẻ
              </span>
            </Link>
          </div>
        </div>

        {/* QUICK SEARCH & CATEGORY SHORTCUTS BAR (Cầu nối trực tiếp chuyển sang trang /products) */}
        <div className="mt-10 mx-auto max-w-4xl rounded-3xl border-2 border-amber-200/90 bg-white/95 p-4 sm:p-5 shadow-xl shadow-amber-950/5 backdrop-blur-xl">
          <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Tìm thẻ lẻ: Sư tử, Voi, Nhảy cao, Ô tô, Khủng long..."
                className="w-full rounded-2xl border border-stone-200 bg-stone-50/70 pl-11 pr-4 py-3 text-sm font-bold text-stone-900 placeholder-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-amber-400/20 transition-all"
              />
            </div>
            <button
              type="submit"
              className="btn-toy-3d w-full sm:w-auto inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-5 py-2.5 text-xs sm:text-sm font-black text-stone-950 shadow-md shadow-amber-500/20 hover:scale-102 active:scale-98 transition-all shrink-0 cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              <span>Mở Kho Thẻ &amp; Bộ Lọc</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Dải Chip danh mục nhanh chuyển thẳng sang /products */}
          <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-stone-500 shrink-0">
              Lọc nhanh theo chủ đề:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {quickCategories.map((cat, idx) => (
                <Link
                  key={idx}
                  href={cat.href}
                  className="inline-flex items-center gap-1 rounded-full bg-stone-100 hover:bg-amber-100/90 text-stone-700 hover:text-amber-950 px-3 py-1 text-xs font-bold transition-all border border-stone-200 hover:border-amber-300"
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] font-extrabold text-stone-400 group-hover:text-amber-700">
                    ({cat.badge})
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* LƯỚI CÁC BỘ COMBO CÓ SẴN (Curated Pack Cards) */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {COMBO_PACKS.map((pack) => (
            <ComboPackCard key={pack.id} pack={pack} />
          ))}
        </div>

        {/* KHỐI GATEWAY PORTAL CARD: DẪN SANG TRANG /products ĐẦY ĐỦ BỘ LỌC & TỪNG THẺ LẺ */}
        <div className="mt-14 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-300/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Cột trái: Thông tin thuyết phục & Danh sách tính năng */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-500/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                <span>KHO THƯ VIỆN 60+ THẺ BÀI AR ĐẦY ĐỦ</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
                Bạn Muốn Tra Cứu Từng Thẻ Bài Riêng Lẻ &amp; Sử Dụng Bộ Lọc Nâng Cao?
              </h3>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Tại trang <strong className="text-amber-950 font-black">Kho Thẻ Bài Poly Cards (/products)</strong>, bạn có thể dễ dàng tìm kiếm từ vựng, lọc theo từng danh mục chủ đề, phân loại theo mức giá và nghe thử audio phát âm 3 thứ tiếng bản xứ:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-amber-200/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-stone-800">Bộ lọc từ khóa &amp; Chủ đề thời gian thực</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-amber-200/80">
                  <Volume2 className="h-4 w-4 text-sky-600 shrink-0" />
                  <span className="text-xs font-bold text-stone-800">Nghe phát âm chuẩn Anh - Việt - Trung</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-amber-200/80">
                  <Eye className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-stone-800">Xem trực tiếp mô hình 3D AR xoay 360°</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-amber-200/80">
                  <Tag className="h-4 w-4 text-rose-600 shrink-0" />
                  <span className="text-xs font-bold text-stone-800">Lọc theo mức giá &amp; thẻ bài mới nhất</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/products"
                  className="btn-toy-3d inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 px-7 py-3.5 text-sm sm:text-base font-black text-stone-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  <SlidersHorizontal className="h-5 w-5 text-stone-950" />
                  <span>Chuyển Sang Trang Kho Thẻ Bài &amp; Bộ Lọc (/products)</span>
                  <ArrowRight className="h-5 w-5 text-stone-950" />
                </Link>
              </div>
            </div>

            {/* Cột phải: Visual Mockup Thẻ bài xếp lớp 3D bắt mắt */}
            <div className="lg:col-span-5 flex justify-center">
              <Link
                href="/products"
                className="group relative block w-full max-w-sm rounded-3xl p-4 transition-transform hover:scale-103"
                title="Bấm để chuyển sang trang Kho Thẻ Bài /products"
              >
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border-4 border-white shadow-2xl ring-4 ring-amber-300/50 bg-stone-900">
                  <Image
                    src="/images/cards/lion-card.jpg"
                    alt="Kho Thẻ Bài AR Poly Cards"
                    fill
                    className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">
                      Giao Diện Thư Viện Mới
                    </span>
                    <h4 className="text-lg font-black mt-0.5">
                      Khám Phá Toàn Bộ Thẻ Lẻ &amp; Mô Hình 3D
                    </h4>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 group-hover:underline">
                      <span>Bấm vào đây để mở trang ngay</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Note cam kết chất lượng */}
        <div className="mt-8 rounded-2xl border border-amber-200/80 bg-white/90 p-4 text-center text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md">
          <p className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              100% Bộ thẻ chính hãng Poly Cards đi kèm mã bản quyền bảo hành trọn đời và quyền truy cập không giới hạn vào ứng dụng WebAR tương tác 3D.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

