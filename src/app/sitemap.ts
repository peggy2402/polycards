import { MetadataRoute } from "next";
import { COMBO_PACKS } from "@/data/combos";
import { getMongoDb } from "@/lib/mongodb";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://polycards.vn";

// Danh sách các thẻ AR mặc định tiêu biểu
const CORE_AR_SLUGS = [
  "polycards",
  "butterfly",
  "strawberry",
  "lion",
  "elephant",
  "cat",
  "dog",
  "car",
  "airplane",
  "train",
  "apple",
  "banana",
  "doctor",
  "teacher",
  "police",
  "firefighter",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // 1. Các trang cốt lõi của website Poly Cards
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/order`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/scan`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];

  // 2. Thu thập danh sách thẻ AR từ MongoDB Atlas (nếu có kết nối)
  let dbCardSlugs: string[] = [];
  try {
    const db = await getMongoDb();
    if (db) {
      const products = await db
        .collection("products")
        .find({ isHidden: { $ne: true } })
        .project({ slug: 1, updatedAt: 1 })
        .toArray();
      dbCardSlugs = products
        .map((p) => p.slug)
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0);
    }
  } catch {
    // Fallback nếu chưa kết nối Mongo trong quá trình build static
  }

  // Kết hợp danh sách thẻ duy nhất
  const uniqueSlugs = Array.from(new Set([...CORE_AR_SLUGS, ...dbCardSlugs]));

  const arRoutes: MetadataRoute.Sitemap = uniqueSlugs.map((slug) => ({
    url: `${BASE_URL}/ar/${encodeURIComponent(slug)}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 3. Đường dẫn bộ sưu tập Combo Packs
  const comboRoutes: MetadataRoute.Sitemap = COMBO_PACKS.map((pack) => ({
    url: `${BASE_URL}/order?pack=${encodeURIComponent(pack.id)}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [...staticRoutes, ...comboRoutes, ...arRoutes];
}

