"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig, navItems } from "@/config/site";
import { Sparkles, QrCode, Menu, X, ArrowUpRight } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/85 backdrop-blur-md dark:border-stone-800/80 dark:bg-stone-950/85 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg p-1 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          aria-label={`${siteConfig.name} Trang chủ`}
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white shadow-xs p-0.5">
            <Image
              src="/images/icons/logo.png"
              alt="Poly Cards Logo"
              width={44}
              height={44}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-amber-950 dark:text-stone-100">
              {siteConfig.name}
            </span>
            <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
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
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Action Button */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/scan"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/25 active:scale-[0.98] focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <QrCode className="h-4 w-4" />
            <span>Quét QR Trải Nghiệm</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2.5 text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-white px-4 pt-2 pb-6 shadow-xl dark:border-stone-800 dark:bg-stone-950 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-4 py-2.5 text-base font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-900"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3">
              <Link
                href="/scan"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]"
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
