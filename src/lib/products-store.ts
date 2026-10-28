import { Animal, ProductCategory } from "@/types/animal";
import animalsData from "../../data/animals.json";

export const DEFAULT_CATEGORIES: ProductCategory[] = [
  {
    id: "cat-dong-vat",
    name: "Động Vật",
    slug: "dong-vat",
    description: "Các loài động vật kỳ thú, đáng yêu từ rừng rậm đến đại dương",
    iconName: "PawPrint",
    createdAt: "2026-01-01",
  },
  {
    id: "cat-hanh-dong",
    name: "Hành Động",
    slug: "hanh-dong",
    description: "Các hành động, chuyển động vui nhộn phát triển thể chất",
    iconName: "Activity",
    createdAt: "2026-01-01",
  },
  {
    id: "cat-phuong-tien",
    name: "Phương Tiện",
    slug: "phuong-tien",
    description: "Phương tiện giao thông đường bộ, đường hàng không, đường thủy",
    iconName: "Car",
    createdAt: "2026-01-01",
  },
  {
    id: "cat-trai-cay",
    name: "Trái Cây",
    slug: "trai-cay",
    description: "Hoa quả tươi ngon, đa dạng màu sắc và giàu vitamin",
    iconName: "Apple",
    createdAt: "2026-01-01",
  },
];

const STORAGE_CATEGORIES_KEY = "polycards_categories_db";
const STORAGE_PRODUCTS_KEY = "polycards_custom_products";
export const PRODUCTS_UPDATED_EVENT = "polycards_products_updated";
export const CATEGORIES_UPDATED_EVENT = "polycards_categories_updated";

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
 * Lấy danh sách sản phẩm hợp nhất (Default animals.json + Custom products từ Tools)
 */
export function getMergedProducts(baseList?: Animal[]): Animal[] {
  const sourceList: Animal[] = baseList || (animalsData as unknown as Animal[]);
  const defaultList: Animal[] = sourceList.map((item) => ({
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
    const result: Animal[] = [...customList];
    const customSlugs = new Set(customList.map((c) => c.slug.toLowerCase()));
    const customIds = new Set(customList.map((c) => c.id));

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

  window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT, { detail: finalProduct }));
  return finalProduct;
}


/**
 * Xóa một sản phẩm do người dùng thêm
 */
export function deleteCustomProduct(idOrSlug: string): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
  if (!raw) return;

  try {
    const list: Animal[] = JSON.parse(raw);
    const filtered = list.filter(
      (item) => item.id !== idOrSlug && item.slug.toLowerCase() !== idOrSlug.toLowerCase()
    );
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT, { detail: { deletedId: idOrSlug } }));
  } catch {}
}
