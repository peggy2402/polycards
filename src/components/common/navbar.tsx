"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig, navItems } from "@/config/site";
import { QrCode, Menu, X, ArrowUpRight, Sparkles, ShoppingBag } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-3 sm:top-5 z-40 w-full px-3 sm:px-6 transition-all">
      <div className="mx-auto flex h-16 sm:h-18 max-w-6xl items-center justify-between rounded-2xl sm:rounded-full border-2 border-amber-200/80 bg-white/95 px-4 sm:px-6 shadow-[0_12px_36px_-8px_rgba(217,119,6,0.14)] backdrop-blur-xl">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-full p-1 transition-transform hover:scale-102 focus:outline-hidden"
          aria-label={`${siteConfig.name} Trang chủ`}
        >
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-full bg-white shadow-xs p-1 border-2 border-amber-300">
            <Image
              src="/images/icons/logo.png"
              alt="Poly Cards Logo"
              width={48}
              height={48}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
              {siteConfig.name}
            </span>
            <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">
              AR Smart Cards
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Menu chính">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-amber-100/70 hover:text-amber-950 hover:scale-105 active:scale-95"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Action CTA Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/order"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border-2 border-amber-300 bg-amber-50 px-4 py-2 text-xs font-black text-amber-950 hover:bg-amber-100 active:scale-95 transition-all shadow-xs"
          >
            <ShoppingBag className="h-4 w-4 text-amber-600" />
            <span>Đặt Mua Thẻ</span>
          </Link>

          <Link
            href="/scan"
            className="btn-toy-3d inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-5 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition-all"
          >
            <QrCode className="h-4 w-4" />
            <span>Quét QR AR</span>
          </Link>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-amber-50"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-6xl md:hidden overflow-hidden rounded-3xl border border-amber-200 bg-white/98 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1.5">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-2xl px-4 py-2.5 text-base font-bold text-slate-700 hover:bg-amber-50"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/order"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-base font-black text-amber-950 active:scale-98 shadow-xs"
              >
                <ShoppingBag className="h-5 w-5 text-amber-600" />
                <span>Đặt Mua Thẻ Poly Cards</span>
              </Link>
              <Link
                href="/scan"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-base font-extrabold text-white shadow-md shadow-emerald-600/25 active:scale-98"
              >
                <QrCode className="h-5 w-5" />
                <span>Quét QR Trải Nghiệm AR</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
