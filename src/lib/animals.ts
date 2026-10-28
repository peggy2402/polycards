import animalsData from "../../data/animals.json";
import { Animal } from "@/types/animal";

/**
 * Đọc danh sách con vật mới nhất từ filesystem (nếu ở server) hoặc từ JSON import tĩnh
 */
function getLiveAnimals(): Animal[] {
  if (typeof window === "undefined") {
    try {
      const fs = eval("require")("fs");
      const path = eval("require")("path");
      const productsPath = path.join(process.cwd(), "data", "products.json");
      const animalsPath = path.join(process.cwd(), "data", "animals.json");

      if (fs.existsSync(productsPath)) {
        const content = fs.readFileSync(productsPath, "utf8");
        return JSON.parse(content) as Animal[];
      }
      if (fs.existsSync(animalsPath)) {
        const content = fs.readFileSync(animalsPath, "utf8");
        return JSON.parse(content) as Animal[];
      }
    } catch {
      // fallback sang static import
    }
  }
  return animalsData as Animal[];
}

/**
 * Lấy toàn bộ danh sách con vật
 */
export function getAllAnimals(): Animal[] {
  return getLiveAnimals();
}

/**
 * Lấy con vật theo slug (ví dụ: 'deer', 'cat', 'lion', 'jump')
 */
export function getAnimalBySlug(slug: string): Animal | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();
  return getLiveAnimals().find((animal) => animal.slug.toLowerCase() === cleanSlug);
}

/**
 * Lấy con vật theo mã QR định danh (ví dụ: 'AR-DEER-001')
 */
export function getAnimalByQrCode(qrCode: string): Animal | undefined {
  if (!qrCode) return undefined;
  const cleanCode = qrCode.toUpperCase().trim();
  return getLiveAnimals().find((animal) => animal.qrCode.toUpperCase() === cleanCode);
}

/**
 * Lấy danh sách slug phục vụ generateStaticParams
 */
export function getAnimalSlugs(): string[] {
  return getLiveAnimals().map((animal) => animal.slug);
}

