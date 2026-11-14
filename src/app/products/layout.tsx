import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://polycards.vn";

export const metadata: Metadata = {
  title: {
    absolute: "Kho 300 Thẻ Học AR Thực Tế Ảo 3D Song Ngữ Cho Bé | Poly Cards",
  },
  description:
    "Khám phá trọn bộ 300 thẻ học thực tế ảo WebAR 3D Poly Cards cho bé 3-8 tuổi. 10 chủ đề phong phú: Động vật, Xe cộ, Hoa quả, Hành động, Nghề nghiệp. Phát âm Anh - Việt - Trung chuẩn bản xứ, quét QR là xem ngay, không cần cài app.",
  keywords: [
    "thẻ học AR",
    "the hoc ar",
    "kho 300 thẻ học AR",
    "thẻ thực tế ảo 3D",
    "the thuc te ao 3d",
    "thẻ học song ngữ cho bé",
    "flashcard 3D cho bé",
    "đồ chơi giáo dục thông minh",
    "WebAR cho trẻ em",
    "thẻ học tiếng Anh 3D",
    "thẻ học tiếng Trung 3D",
    "thẻ AR động vật",
    "thẻ AR xe cộ",
    "thẻ AR hoa quả",
    "thẻ AR nghề nghiệp",
    "thẻ AR hành động",
    "Poly Cards",
    "polycards",
    "polycards.vn",
  ],
  alternates: {
    canonical: `${SITE_URL}/products`,
  },
  openGraph: {
    title: "Kho 300 Thẻ Học AR Thực Tế Ảo 3D Song Ngữ - Poly Cards",
    description:
      "Trọn bộ 300 thẻ học WebAR 3D tương tác sống động cho bé 3-8 tuổi. 10 chủ đề, mô hình 3D xoay 360 độ, phát âm bản xứ chuẩn quốc tế, không cần cài app.",
    url: `${SITE_URL}/products`,
    siteName: "Poly Cards",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png?v=2`,
        width: 1200,
        height: 630,
        alt: "Kho 300 Thẻ Học AR Thực Tế Ảo 3D Poly Cards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kho 300 Thẻ Học AR Thực Tế Ảo 3D Song Ngữ - Poly Cards",
    description:
      "Khám phá danh mục 300 thẻ bài WebAR tương tác 3D thông minh cho bé. 10 chủ đề đa dạng, phát âm chuẩn song ngữ Anh - Việt - Trung.",
    images: [`${SITE_URL}/twitter-image.png?v=2`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cấu trúc dữ liệu JSON-LD Schema.org chuẩn Google SEO Rich Results
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang Chủ",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kho Thẻ Học AR Thực Tế Ảo 3D",
        item: `${SITE_URL}/products`,
      },
    ],
  };

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Kho 300 Thẻ Học AR Thực Tế Ảo 3D Song Ngữ Cho Bé | Poly Cards",
    description:
      "Danh mục đầy đủ 10 bộ với 300 thẻ bài học thông minh thực tế ảo WebAR 3D cho trẻ em từ 3 đến 8 tuổi.",
    url: `${SITE_URL}/products`,
    inLanguage: "vi-VN",
    publisher: {
      "@type": "Organization",
      name: "Poly Cards",
      url: SITE_URL,
      logo: `${SITE_URL}/images/icons/logo.png`,
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Danh Sách Các Bộ Thẻ Học AR Poly Cards",
      numberOfItems: 10,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Bộ 30 Thẻ AR Động Vật Hoang Dã (Anh - Việt)",
          url: `${SITE_URL}/order?pack=POLY30-DONGVAT-ENVI`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Bộ 30 Thẻ AR Phương Tiện Giao Thông & Xe Cộ (Anh - Việt)",
          url: `${SITE_URL}/order?pack=POLY30-XECO-ENVI`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Bộ 30 Thẻ AR Hoa Quả & Trái Cây (Anh - Việt)",
          url: `${SITE_URL}/order?pack=POLY30-HOAQUA-ENVI`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Bộ 30 Thẻ AR Hành Động & Thói Quen (Anh - Việt)",
          url: `${SITE_URL}/order?pack=POLY30-HANHDONG-ENVI`,
        },
        {
          "@type": "ListItem",
          position: 5,
          name: "Bộ 30 Thẻ AR Nghề Nghiệp Ước Mơ (Anh - Việt)",
          url: `${SITE_URL}/order?pack=POLY30-NGHENGHIEP-ENVI`,
        },
        {
          "@type": "ListItem",
          position: 6,
          name: "Siêu Combo Trọn Bộ 300 Thẻ Học AR 3D Toàn Diện (10-in-1)",
          url: `${SITE_URL}/order?pack=POLY300-ALLVIP`,
        },
      ],
    },
  };

  return (
    <>
      {/* Schema.org Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Schema.org CollectionPage / ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />
      {children}
    </>
  );
}
