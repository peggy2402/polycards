export interface AnimalAudio {
  en: string;
  vi: string;
  zh?: string;
}

export interface CardQrPosition {
  x: number;
  y: number;
  size: number;
}

export type OrderStatus = "CHO_DUYET" | "DANG_GIAO" | "DA_NHAN" | "DA_HUY";

export type DeliveryMethod =
  | "TRUC_TIEP"
  | "VAN_CHUYEN_OTO"
  | "CPN_NHTT"
  | "CPN_COD";

export interface DbComboRule {
  id: string;
  name: string;
  description?: string;
  minPacksCount: number;
  discountType: "percent" | "fixed_amount";
  discountValue: number;
  scope: "all" | "categories" | "packs";
  applicableSlugs?: string[];
  isActive: boolean;
  priority: number;
  badge?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  packCode?: string;
  totalCards?: number;
  createdAt?: string;
}

export interface Animal {
  id: string;
  slug: string;
  qrCode: string;
  nameEn: string;
  nameVi: string;
  nameZh?: string;
  ipa: string;
  ipaVi?: string;
  pinyinZh?: string;
  enableEnVi?: boolean;
  enableZhVi?: boolean;
  description: string;
  price: number;
  originalPrice?: number;
  category?: string;
  categoryId?: string;
  categorySlug?: string;
  packCode?: string;
  basePackCode?: string;
  allowedPackCodes?: string[];
  images: string[];
  audioUrl: string;
  audioUrlEn?: string;
  audioUrlZh?: string;
  audios?: AnimalAudio;
  modelUrl: string;
  iosModelUrl: string;
  posterUrl: string;
  rawImageUrl?: string;
  qrPosition?: CardQrPosition;
  animations: string[];
  arEnabled: boolean;
  targetUrl?: string;
  buyUrl?: string;
  badge?: string;
  showOnHome?: boolean;
  isCustom?: boolean;
  updatedAt?: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  hotline: string;
  email: string;
  address: string;
  socials: {
    facebook: string;
    zalo: string;
    tiktok: string;
  };
  defaultBuyUrl: string;
}
