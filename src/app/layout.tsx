import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { siteConfig } from "@/config/site";
import { AiChatWidget } from "@/components/chat/ai-chat-widget";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://polycards.vn";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Poly Cards - Bộ Thẻ Học AR Thực Tế Ảo 3D Song Ngữ Cho Bé",
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Poly Cards - Bộ 270 thẻ học thực tế ảo WebAR 3D thông minh cho bé 3-8 tuổi. Chạm để xem mô hình 3D sống động, phát âm song ngữ Anh - Việt - Trung chuẩn bản xứ, không cần cài app!",
  keywords: [
    // Brand keywords
    "Poly Cards",
    "polycards",
    "polycards.vn",
    "thẻ poly cards",
    // Core Product & AR keywords (Tiếng Việt có dấu & không dấu)
    "thẻ học AR",
    "the hoc ar",
    "thẻ thực tế ảo 3D",
    "the thuc te ao 3d",
    "đồ chơi giáo dục AR",
    "do choi giao duc ar",
    "flashcard AR",
    "thẻ học 3D cho bé",
    "the hoc 3d cho be",
    "đồ chơi thông minh cho bé",
    "do choi thong minh cho be",
    // Education & Bilingual keywords
    "học tiếng Anh qua thực tế ảo",
    "hoc tieng anh thuc te ao",
    "thẻ học tiếng Anh 3D",
    "thẻ học song ngữ Anh Việt",
    "thẻ học song ngữ Trung Việt",
    "the hoc song ngu",
    "flashcard tiếng Anh 3D",
    // Category keywords
    "thẻ học động vật 3D",
    "the hoc dong vat 3d",
    "thẻ học xe cộ 3D",
    "thẻ học hoa quả 3D",
    "thẻ học hành động 3D",
    "thẻ học nghề nghiệp 3D",
    // Long-tail & Search intent keywords
    "quà tặng sinh nhật cho bé",
    "qua tang cho be 3 den 8 tuoi",
    "WebAR giáo dục cho trẻ em",
    "bộ 270 thẻ AR thông minh",
    "thẻ học không cần tải app",
    "đồ chơi tương tác 3D WebAR",
  ],
  authors: [{ name: "Poly Cards Vietnam", url: SITE_URL }],
  creator: "Poly Cards",
  publisher: "Poly Cards",
  category: "education",
  classification: "Đồ chơi giáo dục & Thẻ học thực tế ảo WebAR",
  applicationName: "Poly Cards WebAR",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "vi-VN": SITE_URL,
      "en-US": `${SITE_URL}/en`,
    },
  },
  openGraph: {
    title: "Poly Cards - Bộ Thẻ Học AR Thực Tế Ảo 3D Song Ngữ Cho Bé",
    description:
      "Khám phá thế giới 3D tương tác với 270 thẻ học thực tế ảo WebAR cho bé 3-8 tuổi. Phát âm bản xứ Anh - Việt - Trung, chạm để xem mô hình 3D chuyển động, không cần cài app!",
    url: SITE_URL,
    siteName: "Poly Cards",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png?v=2`,
        width: 1200,
        height: 630,
        alt: "Poly Cards - Bộ Thẻ Học AR Thực Tế Ảo 3D Song Ngữ Cho Bé",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Poly Cards - Bộ Thẻ Học AR Thực Tế Ảo 3D Song Ngữ Cho Bé",
    description:
      "Bộ 270 thẻ học thực tế ảo WebAR 3D thông minh cho bé. Học song ngữ chuẩn bản xứ, xem mô hình 3D không cần tải app!",
    images: [`${SITE_URL}/twitter-image.png?v=2`],
    creator: "@polycards",
    site: "@polycards",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "G-VERIFICATION-CODE",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f59e0b",
};

// Cấu trúc dữ liệu chuẩn Schema.org JSON-LD giúp Google đề xuất và hiển thị Rich Snippets
const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "Poly Cards",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/icon.png`,
        "width": 512,
        "height": 512,
      },
      "description":
        "Bộ thẻ & đồ chơi giáo dục thực tế ảo WebAR 3D thông minh dành cho trẻ từ 3 đến 8 tuổi.",
      "telephone": siteConfig.hotline,
      "email": siteConfig.email,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Số 24, Đường Thăng Long",
        "addressLocality": "Đông Anh",
        "addressRegion": "Hà Nội",
        "addressCountry": "VN",
      },
      "sameAs": [
        siteConfig.socials.facebook,
        siteConfig.socials.zalo,
        siteConfig.socials.tiktok,
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": SITE_URL,
      "name": "Poly Cards",
      "publisher": {
        "@id": `${SITE_URL}/#organization`,
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SITE_URL}/products?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Product",
      "@id": `${SITE_URL}/#product`,
      "name": "Siêu Combo Trọn Bộ 270 Thẻ Học AR Thực Tế Ảo 3D Poly Cards",
      "image": `${SITE_URL}/og-image.png?v=2`,
      "description":
        "Bộ 270 thẻ học thực tế ảo WebAR 3D đa ngữ cho bé. Quét mã QR mở ngay mô hình 3D tương tác, phát âm chuẩn bản xứ, không cần cài app.",
      "brand": {
        "@type": "Brand",
        "name": "Poly Cards",
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "VND",
        "lowPrice": "219000",
        "highPrice": "1490000",
        "offerCount": "11",
        "availability": "https://schema.org/InStock",
        "url": `${SITE_URL}/order`,
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "1250",
        "bestRating": "5",
        "worstRating": "1",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Poly Cards là gì và bé sử dụng như thế nào?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Poly Cards là bộ thẻ học thông minh ứng dụng công nghệ thực tế ảo WebAR. Ba mẹ chỉ cần dùng camera điện thoại (iPhone hoặc Android) quét mã QR in trên thẻ, mô hình 3D sống động sẽ hiện lên ngay lập tức trên màn hình kèm phát âm song ngữ chuẩn bản xứ mà không cần cài đặt bất kỳ ứng dụng nào.",
          },
        },
        {
          "@type": "Question",
          "name": "Tôi có cần tải app từ App Store hoặc Google Play không?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Hoàn toàn KHÔNG cần cài app. Poly Cards chạy trực tiếp trên trình duyệt web mặc định (Safari trên iPhone/iPad hoặc Chrome trên Android) thông qua công nghệ WebAR, giúp tiết kiệm dung lượng bộ nhớ máy và an toàn tuyệt đối cho bé.",
          },
        },
        {
          "@type": "Question",
          "name": "Sản phẩm Poly Cards phù hợp với độ tuổi nào?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Poly Cards được thiết kế tối ưu cho trẻ từ 3 đến 8 tuổi, giai đoạn vàng phát triển tư duy ngôn ngữ, thị giác và khả năng nhận biết thế giới xung quanh.",
          },
        },
        {
          "@type": "Question",
          "name": "Chính sách bảo hành và bản quyền thẻ bài như thế nào?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Mỗi bộ thẻ Poly Cards đều đi kèm mã kích hoạt bản quyền WebAR vĩnh viễn trọn đời. Thẻ bài được in bằng chất liệu bìa cán màng mờ chống lóa, bo góc an toàn và chống thấm nước.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${plusJakartaSans.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        {/* Schema.org Structured Data Injection */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#FCFBF7] font-sans text-slate-800 selection:bg-amber-200 selection:text-amber-900"
      >
        {children}
        <AiChatWidget />
      </body>
    </html>
  );
}
