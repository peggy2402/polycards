import { Animal } from "@/types/animal";
import { INITIAL_PRODUCTS } from "@/data/seed-data";

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
  return INITIAL_PRODUCTS.find((animal) => animal.slug.toLowerCase() === cleanSlug);
}

/**
 * Lấy con vật theo mã QR định danh (ví dụ: 'AR-DEER-001')
 */
export function getAnimalByQrCode(qrCode: string): Animal | undefined {
  if (!qrCode) return undefined;
  const cleanCode = qrCode.toUpperCase().trim();
  return INITIAL_PRODUCTS.find((animal) => animal.qrCode.toUpperCase() === cleanCode);
}

/**
 * Lấy danh sách slug phục vụ generateStaticParams
 */
export function getAnimalSlugs(): string[] {
  return INITIAL_PRODUCTS.map((animal) => animal.slug);
}
