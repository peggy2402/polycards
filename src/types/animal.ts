export interface AnimalAudio {
  en: string;
  vi: string;
  zh?: string;
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
  description: string;
  price: number;
  originalPrice?: number;
  category?: string;
  categoryId?: string;
  categorySlug?: string;
  packCode?: string;
  images: string[];
  audioUrl: string;
  audios?: AnimalAudio;
  modelUrl: string;
  iosModelUrl: string;
  posterUrl: string;
  animations: string[];
  arEnabled: boolean;
  targetUrl?: string;
  buyUrl?: string;
  badge?: string;
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
