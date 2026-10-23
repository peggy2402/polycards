import { SiteConfig } from "@/types/animal";

export const siteConfig: SiteConfig = {
  name: "Poly Cards",
  tagline: "Học tiếng Anh bằng cách chạm vào thế giới thật",
  description:
    "Bộ thẻ & đồ chơi giáo dục AR thông minh dành cho trẻ từ 3 đến 8 tuổi. Quét mã QR để mở ra thế giới động vật 3D sống động kèm phát âm chuẩn bản xứ.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://polycards.vn",
  hotline: "1900 8866 22",
  email: "hello@polycards.vn",
  address: "Tòa nhà Innovation Hub, Quận 1, TP. Hồ Chí Minh",
  socials: {
    facebook: "https://facebook.com/polycards.vn",
    zalo: "https://zalo.me/polycards",
    tiktok: "https://tiktok.com/@polycards",
    shopee: "https://shopee.vn/polycards_official",
  },
  defaultBuyUrl: "https://shopee.vn/polycards_official",
};

export const navItems = [
  { label: "Giới thiệu", href: "#why-choose-us" },
  { label: "Cách hoạt động", href: "#how-it-works" },
  { label: "Sản phẩm", href: "#products" },
  { label: "Trải nghiệm AR", href: "#ar-demo" },
  { label: "Hỏi đáp (FAQ)", href: "#faq" },
];
