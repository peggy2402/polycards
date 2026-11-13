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

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Footer() {
  const currentYear = 2026;

  return (
    <footer className="border-t border-amber-200/80 bg-gradient-to-b from-white to-amber-50/60 pt-16 pb-12 text-slate-600">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info (Lựa chọn A: Logo Ngang Tự Nhiên Thoáng Đãng) */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-11 sm:h-12 w-auto flex items-center">
                <Image
                  src="/images/icons/logo.png"
                  alt="Poly Cards Logo"
                  width={160}
                  height={79}
                  className="h-11 sm:h-12 w-auto object-contain drop-shadow-xs"
                />
              </div>
              <div className="flex flex-col justify-center border-l border-amber-300 pl-3">
                <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                  AR Smart Cards
                </span>
                <span className="text-[9.5px] font-extrabold text-slate-500">
                  Thẻ Học Thông Minh 3D
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 font-medium">
              {siteConfig.tagline}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              <span>100% An toàn cho trẻ em • Không quảng cáo</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">
              Khám Phá
            </h3>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <a
                  href="/#why-choose-us"
                  className="transition-colors hover:text-emerald-600"
                >
                  Vì sao chọn Poly Cards
                </a>
              </li>
              <li>
                <a
                  href="/#how-it-works"
                  className="transition-colors hover:text-emerald-600"
                >
                  4 Bước trải nghiệm AR
                </a>
              </li>
              <li>
                <a
                  href="/#products"
                  className="transition-colors hover:text-emerald-600"
                >
                  Các bộ combo có sẵn
                </a>
              </li>
              <li>
                <Link
                  href="/products"
                  className="transition-colors hover:text-emerald-600 text-amber-700 font-bold"
                >
                  Toàn bộ kho thẻ bài AR &rarr;
                </Link>
              </li>
              <li>
                <a
                  href="/#ar-demo"
                  className="transition-colors hover:text-emerald-600"
                >
                  Thử nghiệm tương tác 3D
                </a>
              </li>
              <li>
                <a
                  href="/#faq"
                  className="transition-colors hover:text-emerald-600"
                >
                  Câu hỏi thường gặp
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">
              Liên Hệ & Hỗ Trợ
            </h3>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Hotline:{" "}
                  <a
                    href={`tel:${siteConfig.hotline.replace(/\s+/g, "")}`}
                    className="font-bold text-slate-900 hover:underline"
                  >
                    {siteConfig.hotline}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:underline"
                >
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{siteConfig.address}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <FacebookIcon className="h-4 w-4 shrink-0 text-[#1877F2] mt-0.5" />
                <a
                  href={siteConfig.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-800 hover:text-[#1877F2] hover:underline transition-colors flex items-center gap-1 group"
                >
                  <span>/polycards</span>
                  <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-[#1877F2] transition-colors" />
                </a>
              </li>
            </ul>
          </div>

          {/* Official Stores & Socials */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">
              Kênh Chính Hãng
            </h3>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/order"
                className="inline-flex min-h-[44px] items-center justify-between rounded-2xl border-2 border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-xs transition-colors hover:border-emerald-400 hover:text-emerald-700"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  <span>Đặt Mua Thẻ Poly Cards</span>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Mới
                </span>
              </Link>

              <a
                href={siteConfig.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-between rounded-2xl border-2 border-blue-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-xs transition-colors hover:border-[#1877F2] hover:text-[#1877F2]"
              >
                <div className="flex items-center gap-2">
                  <FacebookIcon className="h-4 w-4 text-[#1877F2]" />
                  <span>Fanpage Facebook</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>

              <a
                href={siteConfig.socials.zalo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-between rounded-2xl border-2 border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-xs transition-colors hover:border-blue-400 hover:text-blue-700"
              >
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-blue-600" />
                  <span>Zalo Hỗ Trợ Ba Mẹ</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>

              <Link
                href="/scan"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-amber-500/15 px-4 py-2.5 text-sm font-extrabold text-amber-950 transition-colors hover:bg-amber-500/25 border border-amber-300"
              >
                Mở Trình Quét AR Trực Tuyến
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Internal Shortcuts */}
        <div className="mt-12 border-t border-amber-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <p>© {currentYear} {siteConfig.name}. Tất cả quyền được bảo lưu. Đồ chơi giáo dục thông minh AR thế hệ mới.</p>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
            <Link href="/invoices" className="hover:text-amber-700 transition-colors">
              Hóa Đơn Bán Hàng (POS)
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/tools" className="hover:text-amber-700 transition-colors">
              Chế Bản Thẻ &amp; QR
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
