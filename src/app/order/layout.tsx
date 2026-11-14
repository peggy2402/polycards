import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://polycards.vn";

export const metadata: Metadata = {
  title: "Đặt Mua Bộ Thẻ Poly Cards - Giao Hàng Miễn Phí Toàn Quốc",
  description:
    "Chọn mua các gói Combo Thẻ Học AR Thực Tế Ảo 3D Poly Cards. Miễn phí vận chuyển toàn quốc, kiểm tra hàng trước khi thanh toán, kèm mã kích hoạt WebAR trọn đời.",
  alternates: {
    canonical: `${SITE_URL}/order`,
  },
  openGraph: {
    title: "Đặt Mua Bộ Thẻ Poly Cards - Khám Phá Thế Giới 3D AR Cho Bé",
    description:
      "Đặt mua các bộ thẻ AR thông minh (Động vật, Xe cộ, Hoa quả, Nghề nghiệp). Giảm giá đến 34%, tặng kèm hộp quà cao cấp và bản quyền WebAR vĩnh viễn.",
    url: `${SITE_URL}/order`,
    siteName: "Poly Cards",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png?v=2`,
        width: 1200,
        height: 630,
        alt: "Đặt Mua Bộ Thẻ Poly Cards - Giao Hàng Toàn Quốc",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Đặt Mua Bộ Thẻ Poly Cards - Giao Hàng Miễn Phí Toàn Quốc",
    description:
      "Chọn mua bộ thẻ học thực tế ảo WebAR cho bé. Miễn phí vận chuyển, bản quyền trọn đời.",
    images: [`${SITE_URL}/twitter-image.png?v=2`],
  },
};

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

