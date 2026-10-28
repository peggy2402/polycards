"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig, navItems } from "@/config/site";
import {
  QrCode,
  Menu,
  X,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  BookOpen,
  Layers,
  HelpCircle,
  Eye,
} from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper gán icon tinh tế cho từng mục menu drawer
  const getNavIcon = (label: string) => {
    switch (label) {
      case "Giới thiệu":
        return <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />;
      case "Hướng dẫn":
        return <BookOpen className="h-4 w-4 text-sky-500 shrink-0" />;
      case "Bộ Combo":
        return <Layers className="h-4 w-4 text-emerald-500 shrink-0" />;
      case "Kho Thẻ AR":
        return <ShoppingBag className="h-4 w-4 text-purple-500 shrink-0" />;
      case "Thử 3D AR":
        return <Eye className="h-4 w-4 text-teal-500 shrink-0" />;
      case "Hỏi đáp":
        return <HelpCircle className="h-4 w-4 text-amber-600 shrink-0" />;
      default:
        return <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />;
    }
  };

  return (
    <header className="sticky top-2 sm:top-4 z-40 w-full px-3 sm:px-6 transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border border-amber-200/60 bg-white/85 px-3.5 sm:px-6 shadow-[0_8px_30px_rgb(217,119,6,0.07),0_1px_3px_rgb(0,0,0,0.03)] backdrop-blur-xl ring-1 ring-black/[0.02]">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 sm:gap-3 rounded-full py-1 pr-2 transition-transform hover:scale-102 focus:outline-hidden"
          aria-label={`${siteConfig.name} Trang chủ`}
        >
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-amber-50 to-amber-100/60 p-1 border border-amber-300/80 shadow-xs transition-transform duration-300 group-hover:rotate-6">
            <Image
              src="/images/icons/logo.png"
              alt="Poly Cards Logo"
              width={44}
              height={44}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none whitespace-nowrap">
              {siteConfig.name}
            </span>
            <span className="text-[9.5px] font-black tracking-wider text-emerald-600 uppercase leading-none mt-1 whitespace-nowrap">
              AR Smart Cards
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Hiển thị mượt mà trên desktop) */}
        <nav
          className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0"
          aria-label="Menu chính"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap shrink-0 rounded-full px-3 xl:px-3.5 py-1.5 text-xs xl:text-sm font-bold text-slate-700 transition-all hover:bg-amber-100/70 hover:text-amber-950 active:scale-95"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Action CTA Buttons */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <Link
            href="/order"
            className="whitespace-nowrap shrink-0 inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/90 px-3.5 py-1.5 text-xs font-black text-amber-950 hover:bg-amber-100 hover:border-amber-400 active:scale-95 transition-all shadow-xs"
          >
            <ShoppingBag className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Đặt Mua</span>
          </Link>

          <Link
            href="/scan"
            className="btn-toy-3d whitespace-nowrap shrink-0 inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-4 py-1.5 text-xs font-black text-white shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/35 hover:scale-102 active:scale-95 transition-all"
          >
            <QrCode className="h-4 w-4 shrink-0" />
            <span>Quét QR AR</span>
          </Link>
        </div>

        {/* Tablet & Mobile Hamburger Menu Button */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/scan"
            className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm"
          >
            <QrCode className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">Quét AR</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full p-2 text-slate-700 hover:bg-amber-100/70 active:scale-95 transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-7xl lg:hidden overflow-hidden rounded-3xl border border-amber-200/80 bg-white/98 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-amber-500/10">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-950 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
                  {getNavIcon(item.label)}
                </div>
                <span>{item.label}</span>
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2 border-t border-amber-100">
              <Link
                href="/order"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-950 active:scale-98 shadow-xs"
              >
                <ShoppingBag className="h-4 w-4 text-amber-600" />
                <span>Đặt Mua Bộ Thẻ Poly Cards</span>
              </Link>
              <Link
                href="/scan"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-600/25 active:scale-98"
              >
                <QrCode className="h-4 w-4" />
                <span>Quét Mã QR Trải Nghiệm AR 3D</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

