import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://polycards.vn";

export const metadata: Metadata = {
  title: "Kho 270 Thẻ Học AR Thực Tế Ảo 3D - Khám Phá Thế Giới Song Ngữ",
  description:
    "Tra cứu trọn bộ 270 thẻ học 3D tương tác Poly Cards: Động vật, Hành động, Xe cộ, Hoa quả, Nghề nghiệp. Xem trước mô hình 3D, phiên âm quốc tế và phát âm bản xứ.",
  alternates: {
    canonical: `${SITE_URL}/products`,
  },
  openGraph: {
    title: "Kho 270 Thẻ Học AR Thực Tế Ảo 3D - Poly Cards",
    description:
      "Khám phá thế giới trực quan sống động với 270 thẻ học WebAR song ngữ. Bộ lọc đa dạng theo chủ đề, cấp độ và phát âm chuẩn.",
    url: `${SITE_URL}/products`,
    siteName: "Poly Cards",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Kho 270 Thẻ Học AR Thực Tế Ảo 3D Poly Cards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kho 270 Thẻ Học AR Thực Tế Ảo 3D - Poly Cards",
    description:
      "Tra cứu danh mục 270 thẻ bài WebAR tương tác 3D cho bé.",
    images: [`${SITE_URL}/twitter-image.png`],
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

