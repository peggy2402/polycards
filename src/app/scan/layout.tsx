import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://polycards.vn";

export const metadata: Metadata = {
  title: "Quét Mã QR WebAR - Mở Khóa Mô Hình 3D Ngay Trên Trình Duyệt",
  description:
    "Trình quét mã QR WebAR siêu tốc của Poly Cards. Đưa camera lại gần mã QR trên thẻ bài để mở ngay thế giới thực tế ảo 3D sống động mà không cần cài ứng dụng.",
  alternates: {
    canonical: `${SITE_URL}/scan`,
  },
  openGraph: {
    title: "Quét Mã QR WebAR - Trải Nghiệm Thực Tế Ảo 3D Poly Cards",
    description:
      "Quét mã QR thẻ bài để mở ngay mô hình 3D AR tương tác xoay 360 độ và phát âm song ngữ chuẩn bản xứ.",
    url: `${SITE_URL}/scan`,
    siteName: "Poly Cards",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png?v=2`,
        width: 1200,
        height: 630,
        alt: "Quét Mã QR WebAR Poly Cards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quét Mã QR WebAR - Mở Khóa Mô Hình 3D Poly Cards",
    description: "Quét mã QR thẻ bài Poly Cards mở ngay mô hình 3D trên Safari/Chrome.",
    images: [`${SITE_URL}/twitter-image.png?v=2`],
  },
};

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

