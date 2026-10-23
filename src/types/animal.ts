export interface AnimalAudio {
  en: string;
  vi: string;
  zh?: string;
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
  images: string[];
  audioUrl: string;
  audios?: AnimalAudio;
  modelUrl: string;
  iosModelUrl: string;
  posterUrl: string;
  animations: string[];
  arEnabled: boolean;
  buyUrl?: string;
  badge?: string;
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
    shopee: string;
  };
  defaultBuyUrl: string;
}
