import React from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import {
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Share2,
} from "lucide-react";

export function Footer() {
  const currentYear = 2026;

  return (
    <footer className="border-t border-stone-200 bg-stone-100/70 pt-16 pb-12 text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white shadow-xs p-0.5">
                <Image
                  src="/images/icons/logo.png"
                  alt="Poly Cards Logo"
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-amber-950 dark:text-stone-100">
                {siteConfig.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {siteConfig.tagline}
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>100% An toàn cho trẻ em • Không quảng cáo</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-stone-900 uppercase dark:text-stone-100">
              Khám Phá
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#why-choose-us"
                  className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  Vì sao chọn Poly Cards
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  4 Bước trải nghiệm AR
                </a>
              </li>
              <li>
                <a
                  href="#products"
                  className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  Bộ sưu tập mô hình
                </a>
              </li>
              <li>
                <a
                  href="#ar-demo"
                  className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  Thử nghiệm tương tác 3D
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  Câu hỏi thường gặp
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-stone-900 uppercase dark:text-stone-100">
              Liên Hệ & Hỗ Trợ
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>
                  Hotline:{" "}
                  <a
                    href={`tel:${siteConfig.hotline.replace(/\s+/g, "")}`}
                    className="font-semibold text-stone-800 dark:text-stone-200 hover:underline"
                  >
                    {siteConfig.hotline}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:underline"
                >
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>{siteConfig.address}</span>
              </li>
            </ul>
          </div>

          {/* Official Stores & Socials */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-stone-900 uppercase dark:text-stone-100">
              Kênh Chính Hãng
            </h3>
            <div className="flex flex-col gap-2.5">
              <a
                href={siteConfig.socials.shopee}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-between rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-800 shadow-2xs transition-colors hover:border-amber-500 hover:text-amber-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-amber-600" />
                  <span>Shopee Official Store</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
              </a>

              <a
                href={siteConfig.socials.zalo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-between rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-800 shadow-2xs transition-colors hover:border-blue-500 hover:text-blue-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              >
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-blue-600" />
                  <span>Zalo Hỗ Trợ Phụ Huynh</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
              </a>

              <Link
                href="/scan"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-amber-500/10 px-3.5 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300"
              >
                Mở Trình Quét AR Trực Tuyến
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 border-t border-stone-200/80 pt-6 text-center text-xs text-stone-500 dark:border-stone-800/80 dark:text-stone-400">
          <p>© {currentYear} {siteConfig.name}. Tất cả quyền được bảo lưu. Công nghệ thực tế tăng cường dành cho thế hệ tương lai.</p>
        </div>
      </div>
    </footer>
  );
}
