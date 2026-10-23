import animalsData from "../../data/animals.json";
import { Animal } from "@/types/animal";

const animals: Animal[] = animalsData as Animal[];

/**
 * Lấy toàn bộ danh sách con vật
 */
export function getAllAnimals(): Animal[] {
  return animals;
}

/**
 * Lấy con vật theo slug (ví dụ: 'deer', 'cat')
 */
export function getAnimalBySlug(slug: string): Animal | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();
  return animals.find((animal) => animal.slug.toLowerCase() === cleanSlug);
}

/**
 * Lấy con vật theo mã QR định danh (ví dụ: 'AR-DEER-001')
 */
export function getAnimalByQrCode(qrCode: string): Animal | undefined {
  if (!qrCode) return undefined;
  const cleanCode = qrCode.toUpperCase().trim();
  return animals.find((animal) => animal.qrCode.toUpperCase() === cleanCode);
}

/**
 * Lấy danh sách slug phục vụ generateStaticParams
 */
export function getAnimalSlugs(): string[] {
  return animals.map((animal) => animal.slug);
}
