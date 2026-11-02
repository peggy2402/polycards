import { Animal } from "@/types/animal";
import { INITIAL_PRODUCTS } from "@/data/seed-data";

/**
 * Thẻ hệ thống đặc biệt PolyCards AR (Dành riêng cho Hero & Trải nghiệm 3D /models/polycards.glb)
 * Thẻ này KHÔNG nằm trong Kho Thẻ Bài (INITIAL_PRODUCTS / Kho Sản Phẩm), nhưng có đầy đủ định danh AR.
 */
export const SYSTEM_POLYCARDS_ANIMAL: Animal = {
  id: "polycards-system-hero",
  slug: "polycards",
  nameEn: "Poly Cards",
  nameVi: "Bướm Ma Thuật AR",
  nameZh: "智能卡",
  ipa: "/ˈmædʒ.ɪk ˈbʌt.ə.flaɪ/",
  pinyinZh: "zhì néng kǎ",
  description:
    "Mô hình 3D AR bướm ma thuật chuyển động 360° sống động độc quyền của nền tảng đồ chơi giáo dục Poly Cards.",
  category: "Động Vật",
  categorySlug: "dong-vat",
  qrCode: "AR-POLYCARDS-001",
  price: 219000,
  originalPrice: 299000,
  images: ["/images/cards/lion-card.jpg"],
  posterUrl: "/images/cards/lion-card.jpg",
  modelUrl: "/models/polycards.glb",
  iosModelUrl: "/models/polycards.usdz",
  targetUrl: "/targets/polycards.mind",
  audioUrl: "/audio/lion.mp3",
  animations: [],
  audios: {
    en: "/audio/en/lion.mp3",
    vi: "/audio/vi/lion.mp3",
    zh: "/audio/zh/lion.mp3",
  },
  arEnabled: true,
  enableEnVi: true,
  enableZhVi: true,
};

/**
 * Lấy danh sách con vật mặc định (dùng đồng bộ cho Client Component hoặc Static Params)
 */
export function getAllAnimals(): Animal[] {
  return INITIAL_PRODUCTS;
}

/**
 * Lấy con vật theo slug đồng bộ
 */
export function getAnimalBySlug(slug: string): Animal | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();

  // Nhận diện thẻ hệ thống polycards / butterfly (không nằm trong kho)
  if (cleanSlug === "polycards" || cleanSlug === "butterfly") {
    return SYSTEM_POLYCARDS_ANIMAL;
  }

  return INITIAL_PRODUCTS.find((animal) => animal.slug.toLowerCase() === cleanSlug);
}

/**
 * Lấy con vật theo mã QR định danh (ví dụ: 'AR-DEER-001' hoặc 'AR-POLYCARDS-001')
 */
export function getAnimalByQrCode(qrCode: string): Animal | undefined {
  if (!qrCode) return undefined;
  const cleanCode = qrCode.toUpperCase().trim();

  if (cleanCode === "AR-POLYCARDS-001") {
    return SYSTEM_POLYCARDS_ANIMAL;
  }

  return INITIAL_PRODUCTS.find((animal) => animal.qrCode.toUpperCase() === cleanCode);
}

/**
 * Lấy danh sách slug phục vụ generateStaticParams
 */
export function getAnimalSlugs(): string[] {
  return [...INITIAL_PRODUCTS.map((animal) => animal.slug), "polycards", "butterfly"];
}
