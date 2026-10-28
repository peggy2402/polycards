import { Animal, ProductCategory } from "@/types/animal";
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from "@/data/seed-data";

export const DEFAULT_CATEGORIES: ProductCategory[] = INITIAL_CATEGORIES;

const STORAGE_CATEGORIES_KEY = "polycards_categories_db";
const STORAGE_PRODUCTS_KEY = "polycards_custom_products";
const STORAGE_DELETED_PRODUCTS_KEY = "polycards_deleted_products";
export const PRODUCTS_UPDATED_EVENT = "polycards_products_updated";
export const CATEGORIES_UPDATED_EVENT = "polycards_categories_updated";

/**
 * Lấy danh sách ID / Slug của các sản phẩm đã bị xóa
 */
export function getDeletedProductKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_PRODUCTS_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list.map((k: string) => String(k).toLowerCase()) : []);
  } catch {
    return new Set();
  }
}

/**
 * Tạo slug chuẩn từ chuỗi tiếng Việt hoặc tiếng Anh
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Lấy danh sách toàn bộ danh mục sản phẩm
 */
export function getProductCategories(): ProductCategory[] {
  if (typeof window === "undefined") return [...DEFAULT_CATEGORIES];

  try {
    const raw = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return [...DEFAULT_CATEGORIES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("Lỗi đọc danh mục từ localStorage:", err);
  }
  return [...DEFAULT_CATEGORIES];
}

/**
 * Thêm mới một danh mục sản phẩm
 */
export function addProductCategory(data: {
  name: string;
  description?: string;
  iconName?: string;
}): ProductCategory {
  const categories = getProductCategories();
  const cleanName = data.name.trim();
  const slug = slugify(cleanName);

  // Kiểm tra trùng slug
  const existing = categories.find((c) => c.slug === slug);
  if (existing) {
    throw new Error(`Danh mục "${cleanName}" đã tồn tại trên hệ thống.`);
  }

  const newCategory: ProductCategory = {
    id: `cat-${Date.now()}`,
    name: cleanName,
    slug,
    description: data.description?.trim() || "",
    iconName: data.iconName || "Layers",
    createdAt: new Date().toISOString(),
  };

  const updated = [...categories, newCategory];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT, { detail: newCategory }));
  }

  return newCategory;
}

/**
 * Chỉnh sửa danh mục sản phẩm
 */
export function updateProductCategory(
  id: string,
  data: { name: string; description?: string; iconName?: string }
): ProductCategory {
  const categories = getProductCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error("Không tìm thấy danh mục để cập nhật.");
  }

  const cleanName = data.name.trim();
  const updatedCategory: ProductCategory = {
    ...categories[index],
    name: cleanName,
    slug: slugify(cleanName),
    description: data.description !== undefined ? data.description.trim() : categories[index].description,
    iconName: data.iconName || categories[index].iconName,
  };

  categories[index] = updatedCategory;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT, { detail: updatedCategory }));
  }

  return updatedCategory;
}

/**
 * Xóa danh mục sản phẩm
 */
export function deleteProductCategory(id: string): void {
  const categories = getProductCategories();
  const target = categories.find((c) => c.id === id);
  if (!target) return;

  const filtered = categories.filter((c) => c.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT, { detail: { deletedId: id } }));
  }
}

/**
 * Lấy danh sách sản phẩm hợp nhất (Seed/MongoDB products + Custom products từ Tools)
 */
export function getMergedProducts(baseList?: Animal[]): Animal[] {
  const sourceList: Animal[] = baseList || INITIAL_PRODUCTS;
  const deletedKeys = getDeletedProductKeys();

  const defaultList: Animal[] = sourceList
    .filter(
      (item) =>
        !deletedKeys.has(item.id.toLowerCase()) &&
        !deletedKeys.has(item.slug.toLowerCase())
    )
    .map((item) => ({
      ...item,
      category: item.category || "Động Vật",
      categorySlug: item.categorySlug || "dong-vat",
      originalPrice: item.originalPrice || Math.round((item.price || 249000) * 1.3),
    }));

  if (typeof window === "undefined") {
    return defaultList;
  }

  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (!raw) return defaultList;

    const customList: Animal[] = JSON.parse(raw);
    if (!Array.isArray(customList) || customList.length === 0) {
      return defaultList;
    }

    // Merge: custom items override default items by ID or SLUG, and new custom items are prepended
    const validCustomList = customList.filter(
      (c) => !deletedKeys.has(c.id.toLowerCase()) && !deletedKeys.has(c.slug.toLowerCase())
    );
    const result: Animal[] = [...validCustomList];
    const customSlugs = new Set(validCustomList.map((c) => c.slug.toLowerCase()));
    const customIds = new Set(validCustomList.map((c) => c.id));

    defaultList.forEach((def) => {
      if (!customSlugs.has(def.slug.toLowerCase()) && !customIds.has(def.id)) {
        result.push(def);
      }
    });

    return result;
  } catch (err) {
    console.error("Lỗi đọc danh sách sản phẩm từ localStorage:", err);
    return defaultList;
  }
}

/**
 * Dọn dẹp các ảnh Data URL Base64 khổng lồ trong localStorage để giải phóng bộ nhớ Quota (5MB limit)
 */
export function cleanStorageQuota(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (!raw) return;
    const list: Animal[] = JSON.parse(raw);
    if (!Array.isArray(list)) return;

    let modified = false;
    const sanitized = list.map((item) => {
      let changed = false;
      let newImages = item.images;
      let newPoster = item.posterUrl;

      if (Array.isArray(newImages)) {
        newImages = newImages.map((img) => {
          if (typeof img === "string" && img.startsWith("data:image/") && img.length > 500) {
            changed = true;
            return `/images/cards/${item.slug}-card.jpg`;
          }
          return img;
        });
      }

      if (typeof newPoster === "string" && newPoster.startsWith("data:image/") && newPoster.length > 500) {
        changed = true;
        newPoster = `/images/cards/${item.slug}-card.jpg`;
      }

      if (changed) {
        modified = true;
        return { ...item, images: newImages, posterUrl: newPoster };
      }
      return item;
    });

    if (modified) {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(sanitized));
      console.log("Đã giải phóng dung lượng localStorage polycards_custom_products thành công.");
    }
  } catch (e) {
    console.warn("Không thể dọn dẹp localStorage:", e);
  }
}

/**
 * Thêm hoặc Cập nhật Thẻ Sản Phẩm vào #products (Có cơ chế chống tràn Quota 5MB)
 */
export function saveProductToLanding(productData: Partial<Animal> & {
  nameEn: string;
  nameVi: string;
  category: string;
  price: number;
}): Animal {
  if (typeof window === "undefined") {
    throw new Error("Môi trường không hợp lệ.");
  }

  // Tự động dọn dẹp rác base64 cũ nếu có
  cleanStorageQuota();

  const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
  let customList: Animal[] = [];
  if (raw) {
    try {
      customList = JSON.parse(raw);
    } catch {}
  }

  const cleanSlug = (productData.slug || slugify(productData.nameEn)).toLowerCase();
  const categorySlug = productData.categorySlug || slugify(productData.category);

  const existingIndex = customList.findIndex(
    (item) => item.id === productData.id || item.slug.toLowerCase() === cleanSlug
  );

  // Bảo vệ dung lượng: Tuyệt đối không lưu chuỗi Base64 khổng lồ vào localStorage
  let safeImages = productData.images && productData.images.length > 0 ? productData.images : ["/images/cards/jump-template.jpg"];
  let safePoster = productData.posterUrl || safeImages[0] || "/images/cards/jump-template.jpg";

  if (typeof safeImages[0] === "string" && safeImages[0].startsWith("data:image/") && safeImages[0].length > 500) {
    safeImages = [`/images/cards/${cleanSlug}-card.jpg`];
  }
  if (typeof safePoster === "string" && safePoster.startsWith("data:image/") && safePoster.length > 500) {
    safePoster = `/images/cards/${cleanSlug}-card.jpg`;
  }

  const finalProduct: Animal = {
    id: productData.id || `card-${Date.now()}`,
    slug: cleanSlug,
    qrCode: productData.qrCode || `AR-${cleanSlug.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    nameEn: productData.nameEn.trim(),
    nameVi: productData.nameVi.trim(),
    nameZh: productData.nameZh?.trim() || "",
    ipa: productData.ipa?.trim() || `/${cleanSlug}/`,
    pinyinZh: productData.pinyinZh?.trim() || "",
    description: productData.description?.trim() || `Thẻ học thông minh tương tác thực tế ảo AR Poly Cards: ${productData.nameVi} (${productData.nameEn}).`,
    price: Number(productData.price) || 219000,
    originalPrice: Number(productData.originalPrice) || Math.round((Number(productData.price) || 219000) * 1.3),
    category: productData.category.trim(),
    categorySlug,
    images: safeImages,
    audioUrl: productData.audioUrl || `/audio/${cleanSlug}.mp3`,
    audios: productData.audios || {
      en: `/audio/en/${cleanSlug}.mp3`,
      vi: `/audio/vi/${cleanSlug}.mp3`,
      zh: `/audio/zh/${cleanSlug}.mp3`,
    },
    modelUrl: productData.modelUrl || `/models/${cleanSlug}.glb`,
    iosModelUrl: productData.iosModelUrl || `/models/${cleanSlug}.usdz`,
    posterUrl: safePoster,
    animations: productData.animations || ["Idle"],
    arEnabled: productData.arEnabled !== undefined ? productData.arEnabled : true,
    buyUrl: productData.buyUrl || `/order?animal=${cleanSlug}`,
    badge: productData.badge || "Mới ra mắt",
    isCustom: true,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    customList[existingIndex] = finalProduct;
  } else {
    customList.unshift(finalProduct);
  }

  // Ghi an toàn vào localStorage với cơ chế tự phục hồi nếu quota đầy
  try {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(customList));
  } catch (quotaErr) {
    console.warn("localStorage quota bị đầy, tiến hành dọn dẹp và giới hạn danh sách:", quotaErr);
    try {
      const reducedList = customList.slice(0, 5).map((item) => ({
        ...item,
        images: Array.isArray(item.images)
          ? item.images.map((img) => (typeof img === "string" && img.length > 200 ? `/images/cards/${item.slug}-card.jpg` : img))
          : ["/images/cards/jump-template.jpg"],
        posterUrl: typeof item.posterUrl === "string" && item.posterUrl.length > 200
          ? `/images/cards/${item.slug}-card.jpg`
          : item.posterUrl,
      }));
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(reducedList));
    } catch (fallbackErr) {
      console.error("Không thể ghi localStorage sau fallback:", fallbackErr);
    }
  }

  // Nếu sản phẩm này từng bị xóa trước đó, tự động gỡ khỏi danh sách blacklist
  try {
    const deleted = getDeletedProductKeys();
    let unDeleted = false;
    if (deleted.has(cleanSlug)) {
      deleted.delete(cleanSlug);
      unDeleted = true;
    }
    if (productData.id && deleted.has(productData.id.toLowerCase())) {
      deleted.delete(productData.id.toLowerCase());
      unDeleted = true;
    }
    if (unDeleted) {
      localStorage.setItem(STORAGE_DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(deleted)));
    }
  } catch {}

  window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT, { detail: finalProduct }));
  return finalProduct;
}

/**
 * Xóa một sản phẩm (áp dụng bền vững cho cả sản phẩm tùy chỉnh và sản phẩm mặc định hệ thống)
 */
export function deleteCustomProduct(idOrSlug: string): void {
  if (typeof window === "undefined") return;
  const clean = idOrSlug.trim().toLowerCase();

  // 1. Thêm vào danh sách blacklist thẻ đã xóa (loại bỏ vĩnh viễn cả thẻ mặc định trên Vercel Serverless)
  try {
    const deleted = getDeletedProductKeys();
    deleted.add(clean);
    deleted.add(idOrSlug.trim());
    localStorage.setItem(STORAGE_DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.warn("Lỗi lưu STORAGE_DELETED_PRODUCTS_KEY:", err);
  }

  // 2. Xóa khỏi danh sách custom products
  const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
  if (raw) {
    try {
      const list: Animal[] = JSON.parse(raw);
      const filtered = list.filter(
        (item) => item.id !== idOrSlug && item.slug.toLowerCase() !== clean
      );
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(filtered));
    } catch {}
  }

  window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT, { detail: { deletedId: idOrSlug } }));
}
