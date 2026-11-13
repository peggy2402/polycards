import { SiteConfig } from "@/types/animal";

export const siteConfig: SiteConfig = {
  name: "Poly Cards",
  tagline: "Học tiếng Anh bằng cách chạm vào thế giới thật",
  description:
    "Bộ thẻ & đồ chơi giáo dục AR thông minh dành cho trẻ từ 3 đến 8 tuổi. Quét mã QR để mở ra thế giới động vật 3D sống động kèm phát âm chuẩn bản xứ.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://polycards.vn",
  hotline: "0356226707",
  email: "hello@polycards.vn",
  address: "Số 24, Đường Thăng Long, Đông Anh, Hà Nội, Việt Nam",
  socials: {
    facebook: "https://www.facebook.com/share/1JRy4cHAVV/?mibextid=wwXIfr",
    zalo: "https://zalo.me/polycards",
    tiktok: "https://tiktok.com/@polycards",
  },
  defaultBuyUrl: "/order",
};

export const navItems = [
  { label: "Giới thiệu", href: "/#why-choose-us" },
  { label: "Hướng dẫn", href: "/#how-it-works" },
  { label: "Bộ Combo", href: "/#products" },
  { label: "Kho Thẻ AR", href: "/products" },
  { label: "Thử 3D AR", href: "/#ar-demo" },
  { label: "Hỏi đáp", href: "/#faq" },
];
