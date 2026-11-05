import { Animal } from "@/types/animal";
import { INITIAL_PRODUCTS } from "@/data/seed-data";

/**
 * Thẻ hệ thống độc quyền PolyCards AR (Dành riêng cho Hero & Trải nghiệm 3D /models/polycards.glb)
 * Thẻ này phục vụ demo WebAR trực tiếp không cần mạng, với assets có sẵn trong repo.
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
  images: ["/images/cards/butterfly-card.png"],
  posterUrl: "/images/cards/butterfly-card.png",
  modelUrl: "/models/polycards.glb",
  iosModelUrl: "/models/polycards.usdz",
  targetUrl: "/targets/polycards.mind",
  audioUrl: "",
  animations: [],
  audios: {
    en: "",
    vi: "",
    zh: "",
  },
  arEnabled: true,
  enableEnVi: true,
  enableZhVi: true,
};

// Chỉ giữ các thẻ mẫu có tài nguyên Cloudflare R2 thực sự (như jump, walk) để fallback an toàn
const VALID_SEED_PRODUCTS: Animal[] = INITIAL_PRODUCTS.filter((item) =>
  item.modelUrl?.includes(".r2.dev") || item.modelUrl?.startsWith("http")
);

/**
 * Lấy danh sách thẻ bài mẫu an toàn (có sẵn tài nguyên thực tế)
 */
export function getAllAnimals(): Animal[] {
  return [SYSTEM_POLYCARDS_ANIMAL, ...VALID_SEED_PRODUCTS];
}

/**
 * Lấy thẻ bài theo slug đồng bộ
 */
export function getAnimalBySlug(slug: string): Animal | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();

  // Nhận diện thẻ hệ thống polycards / butterfly
  if (cleanSlug === "polycards" || cleanSlug === "butterfly") {
    return SYSTEM_POLYCARDS_ANIMAL;
  }

  return VALID_SEED_PRODUCTS.find((p) => p.slug.toLowerCase() === cleanSlug);
}

/**
 * Lấy con vật theo mã QR định danh (ví dụ: 'AR-POLYCARDS-001')
 */
export function getAnimalByQrCode(qrCode: string): Animal | undefined {
  if (!qrCode) return undefined;
  const cleanCode = qrCode.toUpperCase().trim();

  if (cleanCode === "AR-POLYCARDS-001") {
    return SYSTEM_POLYCARDS_ANIMAL;
  }

  return VALID_SEED_PRODUCTS.find((p) => p.qrCode.toUpperCase() === cleanCode);
}

/**
 * Lấy danh sách slug phục vụ generateStaticParams (Chỉ pre-render các thẻ tĩnh an toàn)
 */
export function getAnimalSlugs(): string[] {
  return ["polycards", "butterfly", "car"];
}
