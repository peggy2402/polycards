import { SiteConfig } from "@/types/animal";

export const siteConfig: SiteConfig = {
  name: "Poly Cards",
  tagline: "Học tiếng Anh bằng cách chạm vào thế giới thật",
  description:
    "Bộ thẻ & đồ chơi giáo dục AR thông minh dành cho trẻ từ 3 đến 8 tuổi. Quét mã QR để mở ra thế giới động vật 3D sống động kèm phát âm chuẩn bản xứ.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://polycards-one.vercel.app",
  hotline: "1900 8866 22",
  email: "hello@polycards.vn",
  address: "294 Lĩnh Nam, Hoàng Mai, Hà Nội",
  socials: {
    facebook: "https://facebook.com/polycards.vn",
    zalo: "https://zalo.me/polycards",
    tiktok: "https://tiktok.com/@polycards",
  },
  defaultBuyUrl: "/order",
};

export const navItems = [
  { label: "Giới thiệu", href: "/#why-choose-us" },
  { label: "Cách hoạt động", href: "/#how-it-works" },
  { label: "Bộ Combo Thẻ", href: "/#products" },
  { label: "Kho Thẻ Bài", href: "/products" },
  { label: "Trải nghiệm AR", href: "/#ar-demo" },
  { label: "Hỏi đáp (FAQ)", href: "/#faq" },
];
