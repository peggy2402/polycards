import { Animal, ProductCategory } from "@/types/animal";

export type Product = Animal;
export type Category = ProductCategory;

export interface Preset3DModel {
  id: string;
  name: string;
  modelUrl: string;
  iosModelUrl: string;
  targetUrl: string;
  category: string;
  description: string;
}

export interface CardPreset {
  id: string;
  name: string;
  slug: string;
  category: string;
  imageSrc: string;
  width: number;
  height: number;
  defaultQr: { x: number; y: number; size: number };
}

export interface PrintQueueItem {
  id: string;
  orderNumber: number; // 1, 2, 3...
  name: string;
  slug: string;
  category: string;
  previewUrl: string;
  blob: Blob;
  addedAt: string;
}

export interface ProductFormData {
  nameEn: string;
  nameVi: string;
  nameZh: string;
  ipa: string;
  pinyinZh: string;
  enableEnVi: boolean;
  enableZhVi: boolean;
  category: string;
  price: number;
  originalPrice: number;
  badge: string;
  showOnHome: boolean;
  description: string;
  useCompositeCardImage: boolean;
  modelPresetId: string;
  modelUrl: string;
  iosModelUrl: string;
  targetUrl: string;
  audioUrl: string;
  audioEnUrl: string;
  audioViUrl: string;
  audioZhUrl: string;
}

export interface EditProductFormData {
  nameVi: string;
  nameEn: string;
  nameZh: string;
  ipa: string;
  pinyinZh: string;
  enableEnVi: boolean;
  enableZhVi: boolean;
  category: string;
  price: number;
  originalPrice: number;
  badge: string;
  showOnHome: boolean;
  description: string;
  imageUrl: string;
  modelUrl: string;
  iosModelUrl: string;
  targetUrl: string;
  audioUrl: string;
  audioEnUrl: string;
  audioViUrl: string;
  audioZhUrl: string;
}

export interface QrPosition {
  x: number;
  y: number;
  size: number;
}

export interface ConfirmState {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export type StudioTab = "editor" | "products" | "categories";
