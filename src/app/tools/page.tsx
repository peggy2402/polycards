"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import JSZip from "jszip";
import {
  QrCode,
  Layers,
  Tag,
  Receipt,
  Eye,
  Unlock,
  Archive,
  FolderArchive,
  ShoppingBag,
} from "lucide-react";
import {
  getProductCategories,
  addProductCategory,
  updateProductCategory,
  deleteProductCategory,
  saveProductToLanding,
  deleteCustomProduct,
  getMergedProducts,
  getFeaturedCombo,
  saveFeaturedComboLocal,
  slugify,
  CATEGORIES_UPDATED_EVENT,
  PRODUCTS_UPDATED_EVENT,
  COMBO_UPDATED_EVENT,
} from "@/lib/products-store";
import { Animal, ProductCategory } from "@/types/animal";
import { CardComboPack, DEFAULT_FEATURED_COMBO } from "@/data/combos";

// Import Types & Constants đã chuẩn hóa
import {
  CardPreset,
  PrintQueueItem,
  ProductFormData,
  EditProductFormData,
  QrPosition,
  ConfirmState,
  ToastItem,
  StudioTab,
} from "@/components/tools/types";
import { CARD_PRESETS, PRESET_3D_MODELS } from "@/components/tools/constants";

// Import Widgets & Modals
import { ToastNotification } from "@/components/tools/widgets/toast-notification";
import { ConfirmModal } from "@/components/tools/widgets/confirm-modal";
import { AuthModal } from "@/components/tools/modals/auth-modal";
import { PublishProductModal } from "@/components/tools/modals/publish-product-modal";
import { EditProductModal } from "@/components/tools/modals/edit-product-modal";
import { CategoryModal } from "@/components/tools/modals/category-modal";
import { ComboConfigModal } from "@/components/tools/modals/combo-config-modal";

// Import Tabs
import { EditorTab } from "@/components/tools/tabs/editor-tab";
import { ProductsTab } from "@/components/tools/tabs/products-tab";
import { CategoriesTab } from "@/components/tools/tabs/categories-tab";

export default function ToolsPage() {
  // 1. Quản lý xác thực bảo mật tác giả Poly Cards
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 2. Chế độ tạo mã QR: "slug" (Theo thẻ WebAR) hoặc "custom" (Nhập link tùy ý)
  const [qrMode, setQrMode] = useState<"slug" | "custom">("slug");
  const [qrTargetEnv, setQrTargetEnv] = useState<"production" | "local">("production");
  const [slug, setSlug] = useState<string>("lion");
  const [customUrl, setCustomUrl] = useState<string>("https://polycards-one.vercel.app/ar/lion?ar=1");
  const [directAr, setDirectAr] = useState<boolean>(true);
  const [includeLicense, setIncludeLicense] = useState<boolean>(false);
  const [licenseCode, setLicenseCode] = useState<string>("POLY-LION-2026");

  // 3. Tùy chỉnh màu sắc & Logo mã QR
  const [qrColor, setQrColor] = useState<string>("#0F172A");
  const [includeLogo, setIncludeLogo] = useState<boolean>(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrSvgString, setQrSvgString] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [qrGeneratedCount, setQrGeneratedCount] = useState<number>(1);

  // 4. Trạng thái Thẻ Mẫu (Card Template)
  const [selectedPresetId, setSelectedPresetId] = useState<string>("jump-action");
  const [cardImageSrc, setCardImageSrc] = useState<string>("/images/cards/jump-template.jpg");
  const [cardDimensions, setCardDimensions] = useState<{ width: number; height: number }>({
    width: 709,
    height: 1024,
  });
  const [cardFileName, setCardFileName] = useState<string>("jump-template.jpg");
  const [isDraggingOverFile, setIsDraggingOverFile] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string>("");
  const [rawImageBlob, setRawImageBlob] = useState<Blob | null>(null);

  // 5. Tọa độ & Kích thước QR trên Thẻ (% chuẩn xác theo ô vàng thực tế: Cỡ 22.8%, X: 4.1%, Y: 74.2%)
  const [qrPos, setQrPos] = useState<QrPosition>({
    x: 4.1,
    y: 74.2,
    size: 22.8,
  });
  const [isQrOverlayEnabled, setIsQrOverlayEnabled] = useState<boolean>(true);

  // 6. Tương tác Canvas (Kéo thả di chuyển, Kéo góc đổi kích thước 1:1, Phím Alt)
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const [isDraggingQr, setIsDraggingQr] = useState<boolean>(false);
  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const [isAltKeyPressed, setIsAltKeyPressed] = useState<boolean>(false);
  const interactionStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    initialQrX: number;
    initialQrY: number;
    initialQrSize: number;
    cardRenderWidth: number;
    cardRenderHeight: number;
  }>({
    pointerX: 0,
    pointerY: 0,
    initialQrX: 0,
    initialQrY: 0,
    initialQrSize: 0,
    cardRenderWidth: 1,
    cardRenderHeight: 1,
  });

  // 7. Trạng thái xuất file & Feedback
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPreviewFinal, setIsPreviewFinal] = useState<boolean>(false);

  // 8. Cấu hình Sinh Mã Bản Quyền Cho Bộ Thẻ (In Xưởng / Tem Dán)
  const [selectedPackForCard, setSelectedPackForCard] = useState<string>("POLY30-DONGVAT");
  const [packGeneratedCode, setPackGeneratedCode] = useState<string>("");
  const [copiedPackCode, setCopiedPackCode] = useState<boolean>(false);

  // 9. Toast Notification System
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 10. Modal Xác Nhận Tùy Biến
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState | null>(null);
  const requestConfirm = useCallback((options: ConfirmState) => {
    setConfirmDialog(options);
  }, []);

  // 11. Quản lý Danh Mục Sản Phẩm (Categories)
  const [categoriesList, setCategoriesList] = useState<ProductCategory[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    iconName: "Layers",
  });

  // 12. Modal "Lưu / Cập Nhật Thẻ Vào #products Trang Chủ"
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [productForm, setProductForm] = useState<ProductFormData>({
    nameEn: "Jump",
    nameVi: "Nhảy Vui Nhộn",
    nameZh: "跳",
    ipa: "/dʒʌmp/",
    pinyinZh: "tiào",
    enableEnVi: true,
    enableZhVi: false,
    category: "Hành Động",
    packCode: "POLY30-HANHDONG",
    price: 219000,
    originalPrice: 299000,
    badge: "Mới ra mắt",
    showOnHome: true,
    description: "Thẻ học thông minh phát triển kỹ năng vận động và phản xạ thể chất cho trẻ.",
    useCompositeCardImage: true,
    modelPresetId: "lion",
    modelUrl: "/models/lion.glb",
    iosModelUrl: "/models/lion.usdz",
    targetUrl: "/targets/lion.mind",
    audioUrl: "",
    audioEnUrl: "",
    audioViUrl: "",
    audioZhUrl: "",
  });
  const [isPublishingProduct, setIsPublishingProduct] = useState<boolean>(false);

  // 13. Tabs phân hệ Studio
  const [activeStudioTab, setActiveStudioTab] = useState<StudioTab>("editor");
  const isTabInitializedRef = useRef<boolean>(false);

  // 14. Hàng Đợi Xuất File In Ấn (Print Queue) & Đóng gói ZIP
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  const [zipFileName, setZipFileName] = useState<string>("bo-the-polycards-in-an");
  const [isAddingToQueue, setIsAddingToQueue] = useState<boolean>(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [isQueueExpanded, setIsQueueExpanded] = useState<boolean>(true);

  // 15. Quản lý Thẻ Bài Sản Phẩm (CRUD Products Studio)
  const [productsList, setProductsList] = useState<Animal[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [filterCardCategory, setFilterCardCategory] = useState<string>("all");

  // 16. Modal Chỉnh Sửa Thông Tin Thẻ Bài
  const [editingProduct, setEditingProduct] = useState<Animal | null>(null);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState<boolean>(false);
  const [editProductForm, setEditProductForm] = useState<EditProductFormData>({
    nameVi: "",
    nameEn: "",
    nameZh: "",
    ipa: "",
    pinyinZh: "",
    enableEnVi: true,
    enableZhVi: false,
    category: "Động Vật",
    packCode: "",
    price: 219000,
    originalPrice: 299000,
    badge: "Mới ra mắt",
    showOnHome: false,
    description: "",
    imageUrl: "",
    modelUrl: "/models/lion.glb",
    iosModelUrl: "/models/lion.usdz",
    targetUrl: "/targets/lion.mind",
    audioUrl: "",
    audioEnUrl: "",
    audioViUrl: "",
    audioZhUrl: "",
  });
  const [isSavingEditProduct, setIsSavingEditProduct] = useState<boolean>(false);

  // 17. Cấu hình Khối Combo Lớn trên Trang Chủ (#products)
  const [featuredCombo, setFeaturedCombo] = useState<CardComboPack>(DEFAULT_FEATURED_COMBO);
  const [isComboModalOpen, setIsComboModalOpen] = useState<boolean>(false);
  const [isSavingCombo, setIsSavingCombo] = useState<boolean>(false);

  useEffect(() => {
    const loadCombo = async () => {
      setFeaturedCombo(getFeaturedCombo());
      try {
        const res = await fetch("/api/featured-combo");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setFeaturedCombo(json.data);
          }
        }
      } catch {}
    };
    loadCombo();
    window.addEventListener(COMBO_UPDATED_EVENT, loadCombo);
    return () => {
      window.removeEventListener(COMBO_UPDATED_EVENT, loadCombo);
    };
  }, []);

  const handleSaveFeaturedCombo = async (updatedCombo: CardComboPack) => {
    try {
      setIsSavingCombo(true);
      await fetch("/api/featured-combo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCombo),
      });
      saveFeaturedComboLocal(updatedCombo);
      setFeaturedCombo(updatedCombo);
      setIsComboModalOpen(false);
      showToast("Đã cập nhật Khối Combo Lớn tại Trang Chủ (#products) thành công!", "success");
    } catch (err: any) {
      showToast(`Lỗi lưu Khối Combo: ${err.message}`, "error");
    } finally {
      setIsSavingCombo(false);
    }
  };

  // Tải danh mục sản phẩm từ API MongoDB (hoặc fallback store)
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesList(getProductCategories());
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setCategoriesList(json.data);
          }
        }
      } catch {}
    };
    loadCategories();
    window.addEventListener(CATEGORIES_UPDATED_EVENT, loadCategories);
    return () => {
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, loadCategories);
    };
  }, []);

  // Tải danh sách sản phẩm từ API (hoặc fallback store) — Hỗ trợ chế độ silent không làm nháy/reload danh sách
  const loadStudioProducts = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsLoadingProducts(true);
      }
      const res = await fetch("/api/products");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProductsList(json.data);
          return;
        }
      }
    } catch (e) {
      console.warn("Fallback getMergedProducts:", e);
    } finally {
      if (!silent) {
        setIsLoadingProducts(false);
      }
    }
    setProductsList(getMergedProducts());
  }, []);

  useEffect(() => {
    loadStudioProducts(false);
    const handleUpdate = () => loadStudioProducts(true);
    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleUpdate);
    };
  }, [loadStudioProducts]);

  // Khôi phục tab khi tải lại trang (Ưu tiên từ URL searchParams ?tab=..., sau đó đến localStorage)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get("tab") as StudioTab;
        const validTabs: StudioTab[] = ["editor", "products", "categories"];
        let targetTab: StudioTab | null = null;

        if (urlTab && validTabs.includes(urlTab)) {
          targetTab = urlTab;
        } else {
          const savedTab = localStorage.getItem("poly_studio_active_tab") as StudioTab;
          if (savedTab && validTabs.includes(savedTab)) {
            targetTab = savedTab;
          }
        }

        if (targetTab) {
          setActiveStudioTab(targetTab);
          if (targetTab === "products") {
            loadStudioProducts(true);
          }
        }
      }
    } catch {} finally {
      isTabInitializedRef.current = true;
    }
  }, [loadStudioProducts]);

  // Đồng bộ tab đang chọn vào URL query và localStorage để khi F5 / reload không bị mất trạng thái
  useEffect(() => {
    if (!isTabInitializedRef.current) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("poly_studio_active_tab", activeStudioTab);
        const url = new URL(window.location.href);
        if (url.searchParams.get("tab") !== activeStudioTab) {
          url.searchParams.set("tab", activeStudioTab);
          window.history.replaceState(null, "", url.toString());
        }
      }
    } catch {}
  }, [activeStudioTab]);

  // Lắng nghe nút Back / Forward trên trình duyệt để chuyển tab tương ứng
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get("tab") as StudioTab;
        const validTabs: StudioTab[] = ["editor", "products", "categories"];
        if (urlTab && validTabs.includes(urlTab)) {
          setActiveStudioTab(urlTab);
        }
      } catch {}
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Nhận diện session bảo mật
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("polycards_tools_auth");
      if (saved === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Lắng nghe phím Alt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltKeyPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltKeyPressed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Tính toán URL đích khi quét mã QR
  const computedTargetUrl = useCallback(() => {
    if (qrMode === "custom") {
      return customUrl.trim() || "https://polycards-one.vercel.app";
    }

    const cleanSlug = slug.trim().toLowerCase() || "lion";
    const baseUrl = qrTargetEnv === "local" && typeof window !== "undefined"
      ? window.location.origin
      : "https://polycards-one.vercel.app";
    let url = `${baseUrl}/ar/${cleanSlug}`;
    const params = new URLSearchParams();
    if (directAr) {
      params.set("ar", "1");
    }
    if (productForm.enableEnVi && !productForm.enableZhVi) {
      params.set("lang", "en-vi");
    } else if (!productForm.enableEnVi && productForm.enableZhVi) {
      params.set("lang", "zh-vi");
    }
    if (includeLicense && licenseCode.trim()) {
      params.set("code", licenseCode.trim());
    }
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }, [
    qrMode,
    qrTargetEnv,
    customUrl,
    slug,
    directAr,
    productForm.enableEnVi,
    productForm.enableZhVi,
    includeLicense,
    licenseCode,
  ]);

  const targetUrl = computedTargetUrl();

  // Tạo ảnh mã QR có độ phân giải cao kết hợp logo tròn thương hiệu Poly Cards
  const handleGenerateQr = useCallback(async () => {
    if (!targetUrl) return;
    try {
      setIsGeneratingQr(true);

      const svg = await QRCode.toString(targetUrl, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 1,
        color: {
          dark: qrColor,
          light: "#FFFFFF",
        },
      });
      setQrSvgString(svg);

      const rawDataUrl = await QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 1024,
        color: {
          dark: qrColor,
          light: "#FFFFFF",
        },
      });

      if (includeLogo && typeof window !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const qrImg = new window.Image();
          qrImg.crossOrigin = "anonymous";
          qrImg.onload = () => {
            ctx.drawImage(qrImg, 0, 0, 1024, 1024);

            const badgeSize = 1024 * 0.22;
            const center = 1024 / 2;

            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(center, center, badgeSize / 2 + 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 6;
            ctx.strokeStyle = qrColor;
            ctx.stroke();

            const logo = new window.Image();
            logo.crossOrigin = "anonymous";
            logo.onload = () => {
              const innerSize = badgeSize * 0.8;
              ctx.drawImage(
                logo,
                center - innerSize / 2,
                center - innerSize / 2,
                innerSize,
                innerSize
              );
              setQrDataUrl(canvas.toDataURL("image/png"));
              setIsGeneratingQr(false);
              setQrGeneratedCount((prev) => prev + 1);
            };
            logo.onerror = () => {
              setQrDataUrl(rawDataUrl);
              setIsGeneratingQr(false);
              setQrGeneratedCount((prev) => prev + 1);
            };
            logo.src = "/images/icons/logo.png";
          };
          qrImg.src = rawDataUrl;
          return;
        }
      }

      setQrDataUrl(rawDataUrl);
      setQrGeneratedCount((prev) => prev + 1);
    } catch (err) {
      console.error("QR Generation Error:", err);
    } finally {
      setIsGeneratingQr(false);
    }
  }, [targetUrl, qrColor, includeLogo]);

  useEffect(() => {
    handleGenerateQr();
  }, [handleGenerateQr]);

  // Sinh mã bản quyền tự động theo bộ
  const handleGeneratePackCodeForCard = async () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newCode = `${selectedPackForCard}-${randomNum}`;

    let packSampleSlug = "lion";
    if (selectedPackForCard === "POLY30-HANHDONG") packSampleSlug = "jump";
    else if (selectedPackForCard === "POLY30-XECO") packSampleSlug = "car";
    else if (selectedPackForCard === "POLY30-HOAQUA") packSampleSlug = "apple";

    setSlug(packSampleSlug);
    setLicenseCode(newCode);
    setIncludeLicense(true);
    setDirectAr(true);
    setPackGeneratedCode(newCode);
    setQrPos({ x: 4.1, y: 74.2, size: 22.8 });

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          customerType: "TRUCTIEP",
          customerName: `Bộ Thẻ ${selectedPackForCard} (In Xưởng)`,
          packCode: selectedPackForCard,
          packTitle: `Bộ 30 Thẻ AR ${selectedPackForCard}`,
          allowedCategorySlug: selectedPackForCard.toLowerCase().replace("poly30-", ""),
          creditAmount: 249000,
          debitAmount: 249000,
          remainingAmount: 0,
          paymentMethod: "TIEN_MAT",
          status: "PAID",
          directUrl: `https://polycards-one.vercel.app/ar/${packSampleSlug}?ar=1&code=${newCode}`,
          note: `Mã bản quyền sinh tự động trong Studio Chế Bản Thẻ & QR`,
        }),
      });
    } catch (e) {
      console.warn("Lưu backend orders:", e);
    }

    showToast(`Đã sinh mã ${newCode} cho ${selectedPackForCard} và nhúng vào mã QR!`, "success");
  };

  const handleCopyPackCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPackCode(true);
    showToast(`Đã sao chép mã bản quyền: ${code}`, "success");
    setTimeout(() => setCopiedPackCode(false), 2000);
  };

  // Nạp ảnh thẻ mẫu mới từ máy tính (lưu cả phôi sạch để tái sử dụng bền vững)
  const handleLoadImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).", "warning");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setCardImageSrc(objectUrl);
      setRawImageUrl(objectUrl);
      setRawImageBlob(file);
      setCardDimensions({
        width: img.naturalWidth || 709,
        height: img.naturalHeight || 1024,
      });
      setCardFileName(file.name);
      setSelectedPresetId("custom-upload");
      setIsQrOverlayEnabled(true);

      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const cleanSlug = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/^-+|-+$/g, "");
      if (cleanSlug && cleanSlug.length >= 2) {
        setSlug(cleanSlug);
      }
    };
    img.src = objectUrl;
  };

  // Nạp ảnh phôi sạch (chưa có QR) mới cho thẻ bài đang chế bản
  const handleLoadCleanTemplate = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).", "warning");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setCardImageSrc(objectUrl);
      setRawImageUrl(objectUrl);
      setRawImageBlob(file);
      setCardDimensions({
        width: img.naturalWidth || 709,
        height: img.naturalHeight || 1024,
      });
      setCardFileName(file.name);
      setIsQrOverlayEnabled(true);
      setQrPos({ x: 4.1, y: 74.2, size: 22.8 });
      showToast(
        "Đã nạp ảnh phôi sạch mới thành công! Mã QR giờ đây đã nổi bên trên, bạn có thể tự do căn chỉnh lại sắc nét.",
        "success"
      );
    };
    img.src = objectUrl;
  };

  // Khôi phục lại ảnh ban đầu của thẻ bài từ hệ thống
  const handleRestoreOriginalCardImage = () => {
    const existing =
      productsList.find((p) => p.slug.toLowerCase() === slug.toLowerCase()) ||
      getMergedProducts().find((p) => p.slug.toLowerCase() === slug.toLowerCase());

    const origImg =
      existing?.rawImageUrl ||
      existing?.posterUrl ||
      (Array.isArray(existing?.images) && existing.images[0]) ||
      `/images/cards/${slug}-template.jpg`;

    setCardImageSrc(origImg);
    setRawImageUrl(existing?.rawImageUrl || "");
    setRawImageBlob(null);

    const isAlreadyHasQr = origImg.includes("-card.") || !origImg.includes("-template.");
    setIsQrOverlayEnabled(!isAlreadyHasQr);

    if (existing?.qrPosition && typeof existing.qrPosition.x === "number") {
      setQrPos({
        x: existing.qrPosition.x,
        y: existing.qrPosition.y,
        size: existing.qrPosition.size,
      });
    } else {
      setQrPos({ x: 4.1, y: 74.2, size: 22.8 });
    }

    showToast("Đã khôi phục lại ảnh nguyên bản của thẻ bài!", "info");
  };

  const handleAutoSnap = () => {
    setQrPos({ x: 4.1, y: 74.2, size: 22.8 });
  };

  const handleResetQrToStandard = () => {
    setQrPos({ x: 4.1, y: 74.2, size: 22.8 });
    showToast("Đã căn mã QR vào vị trí ô vàng tiêu chuẩn (Cỡ: 22.8%, X: 4.1%, Y: 74.2%).", "info");
  };

  const handleToggleQrOverlay = () => {
    setIsQrOverlayEnabled((prev) => !prev);
    showToast(
      !isQrOverlayEnabled
        ? "Đã bật lớp ghép mã QR lên thẻ."
        : "Đã tắt lớp ghép mã QR (phù hợp thẻ đã in sẵn QR).",
      "info"
    );
  };

  // Pointer events trên Canvas
  const handleQrPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!cardElementRef.current) return;

    const rect = cardElementRef.current.getBoundingClientRect();
    interactionStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialQrX: qrPos.x,
      initialQrY: qrPos.y,
      initialQrSize: qrPos.size,
      cardRenderWidth: rect.width,
      cardRenderHeight: rect.height,
    };
    setIsDraggingQr(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizePointerDown = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation();
    if (!cardElementRef.current) return;

    const rect = cardElementRef.current.getBoundingClientRect();
    interactionStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialQrX: qrPos.x,
      initialQrY: qrPos.y,
      initialQrSize: qrPos.size,
      cardRenderWidth: rect.width,
      cardRenderHeight: rect.height,
    };
    setResizingHandle(handle);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleWorkspacePointerMove = (e: React.PointerEvent) => {
    const {
      pointerX,
      pointerY,
      initialQrX,
      initialQrY,
      initialQrSize,
      cardRenderWidth,
      cardRenderHeight,
    } = interactionStartRef.current;

    if (cardRenderWidth <= 0 || cardRenderHeight <= 0) return;

    const deltaPixelX = e.clientX - pointerX;
    const deltaPixelY = e.clientY - pointerY;

    if (isDraggingQr) {
      const deltaPercentX = (deltaPixelX / cardRenderWidth) * 100;
      const deltaPercentY = (deltaPixelY / cardRenderHeight) * 100;
      const cardAspect = cardDimensions.height / cardDimensions.width;
      const qrHeightPercent = initialQrSize / cardAspect;

      const nextX = Math.max(0, Math.min(100 - initialQrSize, initialQrX + deltaPercentX));
      const nextY = Math.max(0, Math.min(100 - qrHeightPercent, initialQrY + deltaPercentY));

      setQrPos((prev) => ({
        ...prev,
        x: Math.round(nextX * 10) / 10,
        y: Math.round(nextY * 10) / 10,
      }));
      return;
    }

    if (resizingHandle) {
      let deltaPercent = (deltaPixelX / cardRenderWidth) * 100;
      if (resizingHandle === "nw" || resizingHandle === "sw") {
        deltaPercent = -deltaPercent;
      }

      const isAlt = e.altKey || isAltKeyPressed;
      const scaleMultiplier = isAlt ? 2 : 1;

      let nextSize = initialQrSize + deltaPercent * scaleMultiplier;
      nextSize = Math.max(12, Math.min(55, nextSize));

      const sizeDiff = nextSize - initialQrSize;
      const cardAspect = cardDimensions.height / cardDimensions.width;

      let nextX = initialQrX;
      let nextY = initialQrY;

      if (isAlt) {
        nextX = initialQrX - sizeDiff / 2;
        nextY = initialQrY - (sizeDiff / 2) / cardAspect;
      } else {
        if (resizingHandle === "nw") {
          nextX = initialQrX - sizeDiff;
          nextY = initialQrY - sizeDiff / cardAspect;
        } else if (resizingHandle === "ne") {
          nextY = initialQrY - sizeDiff / cardAspect;
        } else if (resizingHandle === "sw") {
          nextX = initialQrX - sizeDiff;
        }
      }

      setQrPos({
        x: Math.max(0, Math.min(100 - nextSize, Math.round(nextX * 10) / 10)),
        y: Math.max(0, Math.min(100 - (nextSize / cardAspect), Math.round(nextY * 10) / 10)),
        size: Math.round(nextSize * 10) / 10,
      });
    }
  };

  const handleWorkspacePointerUp = (e: React.PointerEvent) => {
    setIsDraggingQr(false);
    setResizingHandle(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Tạo ảnh thẻ thành phẩm full-res
  const generateCompositeCanvas = useCallback((): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = cardDimensions.width;
      canvas.height = cardDimensions.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Không thể khởi tạo Canvas 2D"));
        return;
      }

      const cardImg = new window.Image();
      cardImg.crossOrigin = "anonymous";
      cardImg.onload = () => {
        ctx.drawImage(cardImg, 0, 0, cardDimensions.width, cardDimensions.height);

        if (!isQrOverlayEnabled || !qrDataUrl) {
          resolve(canvas);
          return;
        }

        const realQrX = (qrPos.x / 100) * cardDimensions.width;
        const realQrY = (qrPos.y / 100) * cardDimensions.height;
        const realQrSize = (qrPos.size / 100) * cardDimensions.width;

        const qrImg = new window.Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.onload = () => {
          ctx.drawImage(qrImg, realQrX, realQrY, realQrSize, realQrSize);
          resolve(canvas);
        };
        qrImg.onerror = () => reject(new Error("Lỗi nạp ảnh mã QR"));
        qrImg.src = qrDataUrl;
      };
      cardImg.onerror = () => reject(new Error("Lỗi nạp ảnh thẻ bài"));
      cardImg.src = cardImageSrc;
    });
  }, [cardDimensions, cardImageSrc, qrPos, qrDataUrl, isQrOverlayEnabled]);

  // Xuất file in ấn
  const handleExportFullCard = async () => {
    try {
      setIsExporting(true);
      const canvas = await generateCompositeCanvas();
      const link = document.createElement("a");
      link.download = `polycards-${slug || "card"}-ready-to-print.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      showToast("Đã xuất tệp in ấn hoàn tất thành công!", "success");
    } catch (err: any) {
      showToast(`Lỗi xuất file: ${err.message}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `polycards-qr-${slug || "target"}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleDownloadQrSvg = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `polycards-qr-${slug || "target"}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCardImage = async () => {
    try {
      const canvas = await generateCompositeCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopiedImage(true);
        showToast("Đã sao chép ảnh thẻ vào Clipboard!", "success");
        setTimeout(() => setCopiedImage(false), 2500);
      }, "image/png");
    } catch {
      handleExportFullCard();
    }
  };

  const handlePrint = async () => {
    try {
      const canvas = await generateCompositeCanvas();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>In Thẻ Poly Cards - ${slug}</title>
              <style>
                @page { size: auto; margin: 0; }
                body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
                img { max-width: 95vw; max-height: 95vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${canvas.toDataURL("image/png")}" />
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err: any) {
      showToast(`Lỗi chuẩn bị in: ${err.message}`, "error");
    }
  };

  // Print Queue Handlers
  const handleAddToPrintQueue = async () => {
    try {
      setIsAddingToQueue(true);
      const canvas = await generateCompositeCanvas();
      const previewUrl = canvas.toDataURL("image/png", 0.4);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Không thể chuyển đổi canvas thành tệp ảnh"));
        }, "image/png");
      });

      const nextOrder = printQueue.length + 1;
      const cardTitle = productForm.nameVi || slug || "Thẻ Poly Cards";

      const newItem: PrintQueueItem = {
        id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderNumber: nextOrder,
        name: cardTitle,
        slug: slug || "card",
        category: productForm.category || "Động Vật",
        previewUrl,
        blob,
        addedAt: new Date().toLocaleTimeString("vi-VN"),
      };

      setPrintQueue((prev) => [...prev, newItem]);
      setIsQueueExpanded(true);
      showToast(`Đã thêm "${cardTitle}" vào Hàng Đợi In (Xuất: ${nextOrder}.png)`, "success");
    } catch (err: any) {
      showToast(`Lỗi thêm vào hàng đợi: ${err.message}`, "error");
    } finally {
      setIsAddingToQueue(false);
    }
  };

  const handleRemoveQueueItem = (id: string) => {
    setPrintQueue((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered.map((item, idx) => ({ ...item, orderNumber: idx + 1 }));
    });
    showToast("Đã xóa thẻ khỏi hàng đợi in", "info");
  };

  const handleClearQueue = () => {
    if (printQueue.length === 0) return;
    requestConfirm({
      title: "Làm Rỗng Hàng Đợi In",
      message: `Bạn có chắc muốn xóa toàn bộ ${printQueue.length} thẻ đang chờ trong hàng đợi không?`,
      confirmText: "Xóa Hàng Đợi",
      danger: true,
      onConfirm: () => {
        setPrintQueue([]);
        showToast("Đã xóa toàn bộ thẻ trong hàng đợi in", "info");
      },
    });
  };

  const handleDownloadZip = async () => {
    if (printQueue.length === 0) {
      showToast("Hàng đợi in đang trống! Hãy thêm thẻ vào trước khi tải file .ZIP.", "warning");
      return;
    }

    try {
      setIsGeneratingZip(true);
      const zip = new JSZip();

      const manifestLines: string[] = [
        `============================================================`,
        `POLY CARDS - DANH MỤC THẺ IN ẤN XƯỞNG CHUẨN ĐỘ NÉT CAO (PNG 1:1)`,
        `Tổng số thẻ: ${printQueue.length} thẻ`,
        `Thời gian xuất file: ${new Date().toLocaleString("vi-VN")}`,
        `Quy ước: Thứ tự file 1.png, 2.png, 3.png... tương ứng vị trí trong hàng đợi`,
        `============================================================\n`,
      ];

      printQueue.forEach((item, index) => {
        const orderNumber = index + 1;
        const fileName = `${orderNumber}.png`;
        zip.file(fileName, item.blob);
        manifestLines.push(
          `[${fileName}] ${item.name} | Slug: ${item.slug} | Phân loại: ${item.category} | Thêm lúc: ${item.addedAt}`
        );
      });

      manifestLines.push(`\n------------------------------------------------------------`);
      manifestLines.push(`Poly Cards Studio - Chế bản & In ấn thẻ học thông minh AR 3D.`);
      zip.file("danh-sach-the-in.txt", manifestLines.join("\n"));

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      let rawName = zipFileName.trim() || "bo-the-polycards-in-an";
      if (!rawName.toLowerCase().endsWith(".zip")) {
        rawName += ".zip";
      }

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = rawName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      showToast(`Đã tải xuống tệp ZIP "${rawName}" (${printQueue.length} thẻ) thành công!`, "success");
    } catch (err: any) {
      showToast(`Lỗi xuất file ZIP: ${err.message}`, "error");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Helper render phôi thẻ in kèm mã QR chất lượng cao cho bất kỳ thẻ nào trong hệ thống
  const generateCardCompositeBlob = async (
    card: Animal
  ): Promise<{ blob: Blob; previewUrl: string }> => {
    return new Promise(async (resolve, reject) => {
      try {
        const hasRawTemplate = Boolean(card.rawImageUrl && card.rawImageUrl.trim());
        const cardImgSrc =
          card.rawImageUrl ||
          card.posterUrl ||
          (Array.isArray(card.images) && card.images[0]) ||
          `/images/cards/${card.slug}-card.jpg`;

        // Nếu thẻ có ảnh phôi sạch riêng (rawImageUrl) thì bắt buộc phải ghép QR mới
        const isAlreadyComposite =
          !hasRawTemplate &&
          (cardImgSrc.includes("-card.") ||
            cardImgSrc.includes("jump-card") ||
            cardImgSrc.includes("lion-card") ||
            cardImgSrc.includes("walk-card"));

        const effectivePackCode =
          card.packCode && card.packCode.trim() !== ""
            ? card.packCode.trim()
            : card.categorySlug === "hanh-dong" || card.category === "Hành Động"
            ? "POLY30-HANHDONG"
            : card.categorySlug === "dong-vat" || card.category === "Động Vật"
            ? "POLY30-DONGVAT"
            : card.categorySlug === "xe-co" || card.category === "Xe Cộ"
            ? "POLY30-XECO"
            : card.categorySlug === "hoa-qua" || card.category === "Hoa Quả"
            ? "POLY30-HOAQUA"
            : "";

        const targetWebArUrl = `${
          typeof window !== "undefined" ? window.location.origin : "https://polycards-one.vercel.app"
        }/ar/${card.slug}?ar=1${effectivePackCode ? `&code=${encodeURIComponent(effectivePackCode)}` : ""}`;

        // Sinh mã QR kèm logo tròn Poly Cards ở trung tâm
        let qrDataUrl = "";
        if (!isAlreadyComposite) {
          const rawDataUrl = await QRCode.toDataURL(targetWebArUrl, {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 1024,
            color: { dark: "#000000", light: "#FFFFFF" },
          });

          const qrCanvas = document.createElement("canvas");
          qrCanvas.width = 1024;
          qrCanvas.height = 1024;
          const qrCtx = qrCanvas.getContext("2d");
          if (qrCtx) {
            await new Promise<void>((resQr) => {
              const qrImg = new window.Image();
              qrImg.crossOrigin = "anonymous";
              qrImg.onload = () => {
                qrCtx.drawImage(qrImg, 0, 0, 1024, 1024);
                const badgeSize = 1024 * 0.22;
                const center = 1024 / 2;
                qrCtx.fillStyle = "#FFFFFF";
                qrCtx.beginPath();
                qrCtx.arc(center, center, badgeSize / 2 + 10, 0, Math.PI * 2);
                qrCtx.fill();
                qrCtx.lineWidth = 6;
                qrCtx.strokeStyle = "#F59E0B";
                qrCtx.stroke();

                const logo = new window.Image();
                logo.crossOrigin = "anonymous";
                logo.onload = () => {
                  const innerSize = badgeSize * 0.8;
                  qrCtx.drawImage(
                    logo,
                    center - innerSize / 2,
                    center - innerSize / 2,
                    innerSize,
                    innerSize
                  );
                  qrDataUrl = qrCanvas.toDataURL("image/png");
                  resQr();
                };
                logo.onerror = () => {
                  qrDataUrl = rawDataUrl;
                  resQr();
                };
                logo.src = "/images/icons/logo.png";
              };
              qrImg.onerror = () => {
                qrDataUrl = rawDataUrl;
                resQr();
              };
              qrImg.src = rawDataUrl;
            });
          }
        }

        // Tạo canvas hoàn chỉnh
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Không thể khởi tạo Canvas Context");

        const baseImg = new window.Image();
        baseImg.crossOrigin = "anonymous";
        baseImg.onload = () => {
          const width = baseImg.naturalWidth || 700;
          const height = baseImg.naturalHeight || 1000;
          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(baseImg, 0, 0, width, height);

          // Nếu chưa có QR hoặc vẽ lại từ phôi sạch, vẽ lớp QR vào vị trí đã lưu của thẻ (mặc định x=4.1%, y=74.2%, size=22.8%)
          if (!isAlreadyComposite && qrDataUrl) {
            const qrX = card.qrPosition?.x ?? 4.1;
            const qrY = card.qrPosition?.y ?? 74.2;
            const qrSize = card.qrPosition?.size ?? 22.8;

            const realQrX = (qrX / 100) * width;
            const realQrY = (qrY / 100) * height;
            const realQrSize = (qrSize / 100) * width;

            const qrEl = new window.Image();
            qrEl.crossOrigin = "anonymous";
            qrEl.onload = () => {
              ctx.drawImage(qrEl, realQrX, realQrY, realQrSize, realQrSize);
              finish();
            };
            qrEl.onerror = () => finish();
            qrEl.src = qrDataUrl;
          } else {
            finish();
          }

          function finish() {
            canvas.toBlob(
              (b) => {
                if (b) {
                  resolve({
                    blob: b,
                    previewUrl: canvas.toDataURL("image/png", 0.4),
                  });
                } else {
                  reject(new Error("Không thể tạo Blob từ Canvas"));
                }
              },
              "image/png",
              1.0
            );
          }
        };
        baseImg.onerror = () =>
          reject(new Error(`Không thể nạp ảnh của thẻ ${card.nameVi}`));
        baseImg.src = cardImgSrc;
      } catch (err) {
        reject(err);
      }
    });
  };

  // Thêm 1 thẻ từ Kho Thẻ Bài vào Hàng Đợi In
  const handleAddCardToPrintQueue = async (card: Animal) => {
    try {
      showToast(`Đang chuẩn bị phôi in thẻ "${card.nameVi}"...`, "info");
      const { blob, previewUrl } = await generateCardCompositeBlob(card);
      const nextOrder = printQueue.length + 1;
      const newItem: PrintQueueItem = {
        id: `queue-${Date.now()}-${card.slug}`,
        orderNumber: nextOrder,
        name: card.nameVi,
        slug: card.slug,
        category: card.category || "Động Vật",
        previewUrl,
        blob,
        addedAt: new Date().toLocaleTimeString("vi-VN"),
      };
      setPrintQueue((prev) => [...prev, newItem]);
      setIsQueueExpanded(true);
      showToast(
        `Đã thêm "${card.nameVi}" vào Hàng Đợi In (${nextOrder}.png)!`,
        "success"
      );
    } catch (err: any) {
      showToast(`Lỗi thêm thẻ vào hàng đợi: ${err.message}`, "error");
    }
  };

  // Thêm nhiều thẻ từ Kho Thẻ Bài vào Hàng Đợi In
  const handleBatchAddToPrintQueue = async (cards: Animal[]) => {
    if (!cards || cards.length === 0) return;
    try {
      showToast(`Đang nạp ${cards.length} thẻ vào Hàng Đợi In...`, "info");
      const newItems: PrintQueueItem[] = [];
      let currentOrder = printQueue.length;

      for (const card of cards) {
        currentOrder++;
        const { blob, previewUrl } = await generateCardCompositeBlob(card);
        newItems.push({
          id: `queue-${Date.now()}-${card.slug}-${currentOrder}`,
          orderNumber: currentOrder,
          name: card.nameVi,
          slug: card.slug,
          category: card.category || "Động Vật",
          previewUrl,
          blob,
          addedAt: new Date().toLocaleTimeString("vi-VN"),
        });
      }

      setPrintQueue((prev) => [...prev, ...newItems]);
      setIsQueueExpanded(true);
      showToast(
        `Đã thêm thành công ${newItems.length} thẻ vào Hàng Đợi In!`,
        "success"
      );
    } catch (err: any) {
      showToast(`Lỗi thêm hàng loạt: ${err.message}`, "error");
    }
  };

  // Tải trực tiếp file in ấn (PNG kèm QR) cho 1 thẻ bài
  const handleDownloadSingleCardPrint = async (card: Animal) => {
    try {
      showToast(`Đang xuất phôi in thẻ "${card.nameVi}"...`, "info");
      const { blob } = await generateCardCompositeBlob(card);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `polycards-${card.slug}-card-ready-to-print.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Đã xuất ảnh in "${card.nameVi}" (PNG kèm QR) thành công!`, "success");
    } catch (err: any) {
      showToast(`Lỗi xuất ảnh in: ${err.message}`, "error");
    }
  };

  // Tải file .ZIP theo Bộ Thẻ hoặc danh sách thẻ đã chọn (Toàn bộ là PNG kèm QR)
  const handleDownloadZipForCards = async (
    cards: Animal[],
    customZipName?: string
  ) => {
    if (!cards || cards.length === 0) {
      showToast("Không có thẻ bài nào để tạo tệp ZIP!", "warning");
      return;
    }

    try {
      setIsGeneratingZip(true);
      showToast(`Bắt đầu đóng gói ${cards.length} thẻ in...`, "info");
      const zip = new JSZip();

      const manifestLines: string[] = [
        `============================================================`,
        `POLY CARDS - GÓI THẺ BÀI IN ẤN XƯỞNG CHUẨN ĐỘ NÉT CAO (PNG 1:1 KÈM QR)`,
        `Tổng số thẻ: ${cards.length} thẻ`,
        `Thời gian xuất file: ${new Date().toLocaleString("vi-VN")}`,
        `Quy ước: Thứ tự file 01-[slug].png, 02-[slug].png...`,
        `============================================================\n`,
      ];

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const orderNum = String(i + 1).padStart(2, "0");
        const fileName = `${orderNum}-${card.slug}.png`;

        showToast(
          `Đang vẽ phôi in có QR (${i + 1}/${cards.length}): ${card.nameVi}...`,
          "info"
        );
        const { blob } = await generateCardCompositeBlob(card);
        zip.file(fileName, blob);

        const effectivePackCode =
          card.packCode && card.packCode.trim() !== ""
            ? card.packCode.trim()
            : card.categorySlug === "hanh-dong" || card.category === "Hành Động"
            ? "POLY30-HANHDONG"
            : card.categorySlug === "dong-vat" || card.category === "Động Vật"
            ? "POLY30-DONGVAT"
            : card.categorySlug === "xe-co" || card.category === "Xe Cộ"
            ? "POLY30-XECO"
            : card.categorySlug === "hoa-qua" || card.category === "Hoa Quả"
            ? "POLY30-HOAQUA"
            : "";

        manifestLines.push(
          `[${fileName}] ${card.nameVi} (${card.nameEn}) | Mã Bộ: ${
            effectivePackCode || "Chưa có"
          } | Danh mục: ${card.category} | WebAR: /ar/${card.slug}?ar=1${
            effectivePackCode ? `&code=${effectivePackCode}` : ""
          }`
        );
      }

      manifestLines.push(
        `\n------------------------------------------------------------`
      );
      manifestLines.push(
        `Poly Cards Studio - Chế bản & In ấn thẻ học thông minh AR 3D.`
      );
      zip.file("danh-sach-the-in.txt", manifestLines.join("\n"));

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      let rawName = (customZipName || "bo-the-polycards-in-an").trim();
      if (!rawName.toLowerCase().endsWith(".zip")) {
        rawName += ".zip";
      }

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = rawName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      showToast(
        `Đã xuất và tải xuống thành công tệp ZIP "${rawName}" (${cards.length} thẻ)!`,
        "success"
      );
    } catch (err: any) {
      console.error("Lỗi xuất ZIP:", err);
      showToast(`Lỗi xuất file ZIP: ${err.message}`, "error");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // CRUD Thẻ Bài Handlers
  const handleDeleteProduct = (product: Animal) => {
    requestConfirm({
      title: "Xác Nhận Xóa Thẻ Bài",
      message: `Bạn có chắc muốn xóa thẻ "${product.nameVi} (${product.nameEn})"? Thao tác này sẽ gỡ thẻ khỏi danh mục #products và /products.`,
      confirmText: "Xóa Thẻ Bài",
      danger: true,
      onConfirm: async () => {
        try {
          await fetch(`/api/products?id=${encodeURIComponent(product.id)}&slug=${encodeURIComponent(product.slug)}`, {
            method: "DELETE",
          });
          deleteCustomProduct(product.id);
          deleteCustomProduct(product.slug);
          setProductsList((prev) =>
            prev.filter((p) => p.id !== product.id && p.slug !== product.slug)
          );
          await loadStudioProducts(true);
          showToast(`Đã xóa thẻ bài "${product.nameVi}" thành công!`, "success");
        } catch (err: any) {
          showToast(`Lỗi xóa thẻ bài: ${err.message}`, "error");
        }
      },
    });
  };

  const handleBatchDeleteProducts = (slugs: string[]) => {
    if (!slugs || slugs.length === 0) return;
    const count = slugs.length;
    requestConfirm({
      title: "Xác Nhận Xóa Hàng Loạt",
      message: `Bạn có chắc chắn muốn xóa ${count} thẻ bài đã chọn khỏi hệ thống? Thao tác này sẽ gỡ hoàn toàn dữ liệu thẻ khỏi MongoDB và không thể hoàn tác.`,
      confirmText: `Xóa Vĩnh Viễn (${count} Thẻ)`,
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/products", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || "Lỗi xóa thẻ hàng loạt");
          }
          slugs.forEach((s) => deleteCustomProduct(s));
          setProductsList((prev) =>
            prev.filter((p) => !slugs.includes(p.slug) && !slugs.includes(p.id))
          );
          await loadStudioProducts(true);
          showToast(`Đã xóa thành công ${count} thẻ bài khỏi hệ thống!`, "success");
        } catch (err: any) {
          showToast(`Lỗi xóa hàng loạt: ${err.message}`, "error");
        }
      },
    });
  };

  const handleToggleShowOnHome = async (product: Animal) => {
    const nextPinned = !product.showOnHome;

    // 1. Optimistic UI: Cập nhật ngay tức thì trên giao diện (0ms, giữ nguyên vị trí cuộn, không tải lại danh sách)
    setProductsList((prev) =>
      prev.map((item) =>
        item.id === product.id || item.slug === product.slug
          ? { ...item, showOnHome: nextPinned }
          : item
      )
    );

    showToast(
      nextPinned
        ? `Đã ghim thẻ "${product.nameVi}" lên Trang Chủ (#products)!`
        : `Đã gỡ thẻ "${product.nameVi}" khỏi Trang Chủ (#products).`,
      "success"
    );

    const updatedData: Partial<Animal> & {
      nameEn: string;
      nameVi: string;
      category: string;
      price: number;
    } = {
      ...product,
      nameEn: product.nameEn,
      nameVi: product.nameVi,
      category: product.category || "Động Vật",
      packCode: product.packCode || "",
      price: product.price || 219000,
      showOnHome: nextPinned,
    };

    // 2. Đồng bộ ngầm xuống MongoDB và LocalStorage ở hậu cảnh
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      saveProductToLanding(updatedData);
    } catch (err: any) {
      // Hoàn tác nếu lỗi mạng
      setProductsList((prev) =>
        prev.map((item) =>
          item.id === product.id || item.slug === product.slug
            ? { ...item, showOnHome: !nextPinned }
            : item
        )
      );
      showToast(`Lỗi đồng bộ trạng thái ghim: ${err.message}`, "error");
    }
  };

  // Tiện ích nhanh: Gán Mã Bộ hàng loạt cho danh sách thẻ bài đã chọn
  const handleBatchAssignPackCode = async (slugs: string[], packCode: string) => {
    if (!slugs || slugs.length === 0) return;
    const cleanPackCode = packCode.trim();

    // 1. Optimistic update local state ngay lập tức (không reload danh sách, zero delay)
    setProductsList((prev) =>
      prev.map((item) =>
        slugs.includes(item.slug) ? { ...item, packCode: cleanPackCode } : item
      )
    );

    // 2. Cập nhật localStorage
    slugs.forEach((slug) => {
      const existing = productsList.find((p) => p.slug === slug);
      if (existing) {
        saveProductToLanding({
          ...existing,
          category: existing.category || "Động Vật",
          packCode: cleanPackCode,
        });
      }
    });

    // 3. Gửi batch update lên MongoDB qua API
    try {
      const itemsToUpdate = slugs.map((slug) => ({ slug, packCode: cleanPackCode }));
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: itemsToUpdate }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      showToast(
        cleanPackCode
          ? `Đã gán Mã Bộ "${cleanPackCode}" cho ${slugs.length} thẻ thành công!`
          : `Đã xóa Mã Bộ của ${slugs.length} thẻ thành công!`,
        "success"
      );
    } catch (err: any) {
      console.warn("Lỗi đồng bộ mã bộ lên server:", err);
      showToast(`Đã lưu cục bộ nhưng đồng bộ server bị lỗi: ${err.message}`, "warning");
    }
  };

  // Cập nhật Mã Bộ cho 1 thẻ đơn lẻ (ví dụ từ ProductDetailModal)
  const handleUpdateSinglePackCode = async (card: Animal, newPackCode: string) => {
    await handleBatchAssignPackCode([card.slug], newPackCode);
  };

  const handleOpenEditProduct = (product: Animal) => {
    setEditingProduct(product);
    setEditProductForm({
      nameVi: product.nameVi,
      nameEn: product.nameEn,
      nameZh: product.nameZh || "",
      ipa: product.ipa || `/${product.slug}/`,
      pinyinZh: product.pinyinZh || "",
      enableEnVi: product.enableEnVi !== false,
      enableZhVi:
        product.enableZhVi !== undefined
          ? product.enableZhVi
          : Boolean(product.nameZh && product.nameZh.trim()),
      category: product.category || "Động Vật",
      packCode: product.packCode || "",
      price: product.price || 219000,
      originalPrice: product.originalPrice || Math.round((product.price || 219000) * 1.3),
      badge: product.badge !== undefined ? product.badge : "Mới ra mắt",
      showOnHome: Boolean(product.showOnHome),
      description: product.description || "",
      imageUrl: product.posterUrl || (Array.isArray(product.images) && product.images[0]) || "",
      modelUrl: product.modelUrl || "/models/lion.glb",
      iosModelUrl: product.iosModelUrl || "/models/lion.usdz",
      targetUrl: product.targetUrl || `/targets/${product.slug}.mind`,
      audioUrl: product.audioUrl || "",
      audioEnUrl: product.audios?.en || "",
      audioViUrl: product.audios?.vi || "",
      audioZhUrl: product.audios?.zh || "",
    });
    setIsEditProductModalOpen(true);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setIsSavingEditProduct(true);
      const updatedData: Partial<Animal> & { nameEn: string; nameVi: string; category: string; price: number } = {
        ...editingProduct,
        nameVi: editProductForm.nameVi.trim(),
        nameEn: editProductForm.nameEn.trim() || editProductForm.nameVi.trim(),
        nameZh: editProductForm.nameZh.trim(),
        ipa: editProductForm.ipa.trim(),
        pinyinZh: editProductForm.pinyinZh.trim(),
        enableEnVi: editProductForm.enableEnVi,
        enableZhVi: editProductForm.enableZhVi,
        category: editProductForm.category.trim(),
        categorySlug: slugify(editProductForm.category),
        packCode:
          editProductForm.packCode !== undefined
            ? editProductForm.packCode.trim()
            : editingProduct.packCode || "",
        price: Number(editProductForm.price) || 219000,
        originalPrice: Number(editProductForm.originalPrice) || 299000,
        badge: editProductForm.badge.trim(),
        showOnHome: editProductForm.showOnHome,
        description: editProductForm.description.trim(),
        posterUrl: editProductForm.imageUrl.trim() || editingProduct.posterUrl,
        images: editProductForm.imageUrl.trim() ? [editProductForm.imageUrl.trim()] : editingProduct.images,
        modelUrl: editProductForm.modelUrl.trim() || editingProduct.modelUrl,
        iosModelUrl: editProductForm.iosModelUrl.trim() || editingProduct.iosModelUrl,
        targetUrl: editProductForm.targetUrl.trim() || editingProduct.targetUrl,
        audioUrl: editProductForm.audioUrl.trim() || editingProduct.audioUrl,
        audios: {
          en: editProductForm.audioEnUrl.trim(),
          vi: editProductForm.audioViUrl.trim(),
          zh: editProductForm.audioZhUrl.trim(),
        },
      };

      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      saveProductToLanding(updatedData);
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
      await loadStudioProducts(true);
      showToast(`Đã cập nhật thông tin thẻ "${updatedData.nameVi}" thành công!`, "success");
    } catch (err: any) {
      showToast(`Lỗi lưu thông tin thẻ: ${err.message}`, "error");
    } finally {
      setIsSavingEditProduct(false);
    }
  };

  // Helper đối chiếu tên danh mục chuẩn xác với danh sách categoriesList hiện có
  const resolveCanonicalCategoryName = useCallback(
    (rawCategory?: string, rawCategorySlug?: string): string => {
      const allCats = categoriesList.length > 0 ? categoriesList : getProductCategories();
      if (rawCategory) {
        const cleanRaw = rawCategory.trim().toLowerCase();
        const rawSlug = slugify(rawCategory);
        const matched = allCats.find(
          (c) =>
            c.name.trim().toLowerCase() === cleanRaw ||
            c.slug.toLowerCase() === cleanRaw ||
            c.slug.toLowerCase() === rawSlug
        );
        if (matched) return matched.name;
      }
      if (rawCategorySlug) {
        const cleanSlugVal = rawCategorySlug.trim().toLowerCase();
        const matchedBySlug = allCats.find((c) => c.slug.toLowerCase() === cleanSlugVal);
        if (matchedBySlug) return matchedBySlug.name;
      }
      if (rawCategory && rawCategory.trim()) {
        return rawCategory.trim();
      }
      return allCats[0]?.name || "Động Vật";
    },
    [categoriesList]
  );

  const handleLoadCardToCanvas = (product: Animal) => {
    // 1. Ưu tiên nạp ảnh phôi sạch (rawImageUrl) nếu có
    const hasRawTemplate = Boolean(product.rawImageUrl && product.rawImageUrl.trim());
    const cardImg = hasRawTemplate
      ? product.rawImageUrl!
      : product.posterUrl ||
        (Array.isArray(product.images) && product.images[0]) ||
        `/images/cards/${product.slug}-template.jpg`;

    setCardImageSrc(cardImg);
    setRawImageUrl(product.rawImageUrl || "");
    setRawImageBlob(null);
    setSlug(product.slug);
    setCardFileName(`${product.slug}-card.jpg`);

    // 2. Khôi phục tọa độ QR tùy chỉnh của thẻ hoặc vị trí chuẩn
    if (product.qrPosition && typeof product.qrPosition.x === "number") {
      setQrPos({
        x: product.qrPosition.x,
        y: product.qrPosition.y,
        size: product.qrPosition.size,
      });
    } else {
      setQrPos({ x: 4.1, y: 74.2, size: 22.8 });
    }

    // 3. Nếu có ảnh phôi sạch, BẬT NGAY lớp QR ghép nổi bên trên
    if (hasRawTemplate) {
      setIsQrOverlayEnabled(true);
      showToast(
        `Đã nạp phôi thẻ sạch của "${product.nameVi}". Bạn có thể tự do căn chỉnh lại mã QR nổi bên trên!`,
        "success"
      );
    } else {
      const isAlreadyHasQr = cardImg.includes("-card.") || !cardImg.includes("-template.");
      if (isAlreadyHasQr) {
        setIsQrOverlayEnabled(false);
        showToast(
          `Thẻ "${product.nameVi}" đang dùng ảnh đã in sẵn QR. Nhấn "Thay Phôi Sạch" hoặc "Tẩy QR Cũ" nếu muốn căn chỉnh lại!`,
          "info"
        );
      } else {
        setIsQrOverlayEnabled(true);
        showToast(`Đã nạp phôi thẻ "${product.nameVi}" lên Bàn Chế Bản!`, "success");
      }
    }

    const matchedProductPreset = PRESET_3D_MODELS.find(
      (p) => p.modelUrl === product.modelUrl
    );
    const resolvedCategory = resolveCanonicalCategoryName(
      product.category,
      product.categorySlug
    );

    setProductForm({
      nameEn: product.nameEn,
      nameVi: product.nameVi,
      nameZh: product.nameZh || "",
      ipa: product.ipa || `/${product.slug}/`,
      pinyinZh: product.pinyinZh || "",
      enableEnVi: product.enableEnVi !== false,
      enableZhVi:
        product.enableZhVi !== undefined
          ? product.enableZhVi
          : Boolean(product.nameZh && product.nameZh.trim()),
      category: resolvedCategory,
      packCode: product.packCode || "",
      price: product.price || 219000,
      originalPrice: product.originalPrice || Math.round((product.price || 219000) * 1.3),
      badge: product.badge !== undefined ? product.badge : "Mới ra mắt",
      showOnHome: Boolean(product.showOnHome),
      description: product.description || "",
      useCompositeCardImage: true,
      modelPresetId: matchedProductPreset ? matchedProductPreset.id : "custom",
      modelUrl: product.modelUrl || "/models/lion.glb",
      iosModelUrl: product.iosModelUrl || "/models/lion.usdz",
      targetUrl: product.targetUrl || `/targets/${product.slug}.mind`,
      audioUrl: product.audioUrl || "",
      audioEnUrl: product.audios?.en || "",
      audioViUrl: product.audios?.vi || "",
      audioZhUrl: product.audios?.zh || "",
    });
    setActiveStudioTab("editor");
  };

  const handleOpenPublishModal = () => {
    const cleanSlug = slug.trim().toLowerCase() || "jump";

    // Kiểm tra xem thẻ với slug này đã tồn tại trên hệ thống (chế độ Cập nhật) hay chưa
    const existingProduct =
      productsList.find((p) => p.slug.toLowerCase() === cleanSlug) ||
      getMergedProducts().find((p) => p.slug.toLowerCase() === cleanSlug);

    if (existingProduct) {
      const resolvedCategory = resolveCanonicalCategoryName(
        existingProduct.category,
        existingProduct.categorySlug
      );
      const matchedPreset = PRESET_3D_MODELS.find(
        (p) => p.modelUrl === existingProduct.modelUrl
      );

      setProductForm({
        nameEn: existingProduct.nameEn || cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1),
        nameVi: existingProduct.nameVi || existingProduct.nameEn,
        nameZh: existingProduct.nameZh || "",
        ipa: existingProduct.ipa || `/${cleanSlug}/`,
        pinyinZh: existingProduct.pinyinZh || "",
        enableEnVi: existingProduct.enableEnVi !== false,
        enableZhVi:
          existingProduct.enableZhVi !== undefined
            ? existingProduct.enableZhVi
            : Boolean(existingProduct.nameZh && existingProduct.nameZh.trim()),
        category: resolvedCategory,
        packCode: existingProduct.packCode || "",
        price: existingProduct.price || 219000,
        originalPrice:
          existingProduct.originalPrice ||
          Math.round((existingProduct.price || 219000) * 1.3),
        badge: existingProduct.badge !== undefined ? existingProduct.badge : "Mới ra mắt",
        showOnHome: Boolean(existingProduct.showOnHome),
        description:
          existingProduct.description ||
          `Thẻ học thông minh tương tác thực tế ảo AR Poly Cards: ${existingProduct.nameVi} (${existingProduct.nameEn}).`,
        useCompositeCardImage: true,
        modelPresetId: matchedPreset ? matchedPreset.id : "custom",
        modelUrl: existingProduct.modelUrl || "/models/lion.glb",
        iosModelUrl: existingProduct.iosModelUrl || "/models/lion.usdz",
        targetUrl: existingProduct.targetUrl || `/targets/${cleanSlug}.mind`,
        audioUrl: existingProduct.audioUrl || "",
        audioEnUrl: existingProduct.audios?.en || "",
        audioViUrl: existingProduct.audios?.vi || "",
        audioZhUrl: existingProduct.audios?.zh || "",
      });

      setIsPublishModalOpen(true);
      return;
    }

    // Trường hợp tạo thẻ mới hoàn toàn
    let defaultCat = "Động Vật";
    let defaultEn = cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);
    let defaultVi = defaultEn;
    let defaultZh = "";
    let defaultPinyin = "";

    if (cleanSlug === "jump") {
      defaultCat = "Hành Động";
      defaultVi = "Nhảy (Vui Nhộn)";
      defaultZh = "跳";
      defaultPinyin = "tiào";
    } else if (cleanSlug === "lion") {
      defaultCat = "Động Vật";
      defaultVi = "Sư Tử Vàng";
      defaultZh = "狮子";
      defaultPinyin = "shīzi";
    } else if (cleanSlug === "cat") {
      defaultCat = "Động Vật";
      defaultVi = "Con Mèo Nhỏ";
      defaultZh = "小猫";
      defaultPinyin = "xiǎomāo";
    } else if (cleanSlug === "dog") {
      defaultCat = "Động Vật";
      defaultVi = "Con Chó Con";
      defaultZh = "小狗";
      defaultPinyin = "xiǎogǒu";
    } else if (cleanSlug === "deer") {
      defaultCat = "Động Vật";
      defaultVi = "Hươu Cổ Tích";
      defaultZh = "小鹿";
      defaultPinyin = "xiǎolù";
    } else if (cleanSlug === "elephant") {
      defaultCat = "Động Vật";
      defaultVi = "Chú Voi Con";
      defaultZh = "大象";
      defaultPinyin = "dàxiàng";
    } else if (cleanSlug === "panda") {
      defaultCat = "Động Vật";
      defaultVi = "Gấu Trúc Đáng Yêu";
      defaultZh = "熊猫";
      defaultPinyin = "xióngmāo";
    }

    const resolvedDefaultCat = resolveCanonicalCategoryName(defaultCat);
    const matchedPreset = PRESET_3D_MODELS.find((p) => p.id === cleanSlug);

    // Nếu người dùng đã tải file .glb/.usdz/.mind lên trong phiên hiện tại thì giữ nguyên
    const isCurrentSlugSame = slugify(productForm.nameEn) === cleanSlug;

    setProductForm((prev) => ({
      nameEn: isCurrentSlugSame && prev.nameEn ? prev.nameEn : defaultEn,
      nameVi: isCurrentSlugSame && prev.nameVi ? prev.nameVi : defaultVi,
      nameZh: isCurrentSlugSame && prev.nameZh ? prev.nameZh : defaultZh,
      ipa: `/${cleanSlug}/`,
      pinyinZh: isCurrentSlugSame && prev.pinyinZh ? prev.pinyinZh : defaultPinyin,
      enableEnVi: prev.enableEnVi !== undefined ? prev.enableEnVi : true,
      enableZhVi: prev.enableZhVi !== undefined ? prev.enableZhVi : false,
      category: isCurrentSlugSame && prev.category ? prev.category : resolvedDefaultCat,
      packCode: prev.packCode || "",
      price: prev.price || 219000,
      originalPrice: prev.originalPrice || 299000,
      badge: prev.badge !== undefined ? prev.badge : "Mới ra mắt",
      showOnHome: prev.showOnHome !== undefined ? prev.showOnHome : true,
      description:
        isCurrentSlugSame && prev.description
          ? prev.description
          : `Thẻ học thông minh tương tác thực tế ảo AR Poly Cards: ${defaultVi} (${defaultEn}).`,
      useCompositeCardImage: true,
      modelPresetId: matchedPreset ? matchedPreset.id : prev.modelPresetId || "lion",
      modelUrl: matchedPreset
        ? matchedPreset.modelUrl
        : prev.modelUrl || "/models/lion.glb",
      iosModelUrl: matchedPreset
        ? matchedPreset.iosModelUrl
        : prev.iosModelUrl || "/models/lion.usdz",
      targetUrl: matchedPreset
        ? matchedPreset.targetUrl
        : prev.targetUrl || "/targets/lion.mind",
      audioUrl: prev.audioUrl || "",
      audioEnUrl: prev.audioEnUrl || "",
      audioViUrl: prev.audioViUrl || "",
      audioZhUrl: prev.audioZhUrl || "",
    }));

    setIsPublishModalOpen(true);
  };

  const handleSaveProductToLanding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.nameVi.trim()) {
      showToast("Vui lòng nhập tên tiếng Việt cho thẻ bài.", "warning");
      return;
    }
    if (productForm.enableEnVi && !productForm.nameEn.trim()) {
      showToast("Vui lòng nhập từ vựng Tiếng Anh khi bật chế độ Song Ngữ Anh - Việt.", "warning");
      return;
    }
    if (productForm.enableZhVi && !productForm.nameZh.trim()) {
      showToast("Vui lòng nhập từ vựng Tiếng Trung khi bật chế độ Song Ngữ Trung - Việt.", "warning");
      return;
    }
    if (!productForm.category.trim()) {
      showToast("Vui lòng chọn danh mục cho thẻ bài.", "warning");
      return;
    }

    try {
      setIsPublishingProduct(true);

      // 1. Lưu ảnh phôi sạch nguyên bản (chưa ghép QR) nếu người dùng vừa nạp phôi mới từ máy
      let savedRawImageUrl = rawImageUrl;
      if (rawImageBlob) {
        try {
          const rawFormData = new FormData();
          rawFormData.append("file", rawImageBlob, `${slug}-raw.jpg`);
          rawFormData.append("type", "image");
          rawFormData.append("name", `${slug}-raw`);
          const rawUploadRes = await fetch("/api/tools/upload", {
            method: "POST",
            body: rawFormData,
          });
          if (rawUploadRes.ok) {
            const rawJson = await rawUploadRes.json();
            if (rawJson.success && rawJson.url) {
              savedRawImageUrl = rawJson.url;
              setRawImageUrl(rawJson.url);
            }
          }
        } catch (err) {
          console.warn("Không thể tải ảnh phôi sạch lên GridFS:", err);
        }
      }

      let imageToSave = cardImageSrc;
      if (productForm.useCompositeCardImage) {
        try {
          const canvas = await generateCompositeCanvas();
          const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
          imageToSave = dataUrl;

          // Tải ảnh thẻ đã gộp lên MongoDB GridFS để có URL ngắn gọn, bền vững trên mọi thiết bị
          const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82)
          );
          if (blob) {
            const formData = new FormData();
            formData.append("file", blob, `${slug}-card.jpg`);
            formData.append("type", "image");
            formData.append("name", `${slug}-card`);
            const uploadRes = await fetch("/api/tools/upload", {
              method: "POST",
              body: formData,
            });
            if (uploadRes.ok) {
              const uploadJson = await uploadRes.json();
              if (uploadJson.success && uploadJson.url) {
                imageToSave = uploadJson.url;
              }
            }
          }
        } catch (err) {
          console.warn("Không thể chụp hoặc tải canvas thẻ, dùng ảnh mẫu gốc:", err);
        }
      }

      const selectedCatObj = categoriesList.find((c) => c.name === productForm.category);
      const catSlug = selectedCatObj?.slug || slugify(productForm.category);
      const catId = selectedCatObj?.id || `cat-${catSlug}`;

      const finalNameEn = productForm.nameEn.trim() || productForm.nameVi.trim();
      const customAudios = {
        en: productForm.audioEnUrl.trim(),
        vi: productForm.audioViUrl.trim(),
        zh: productForm.audioZhUrl.trim(),
      };

      let savedProductData: any = null;
      try {
        const apiRes = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            nameEn: finalNameEn,
            nameVi: productForm.nameVi,
            nameZh: productForm.nameZh,
            ipa: productForm.ipa,
            pinyinZh: productForm.pinyinZh,
            enableEnVi: productForm.enableEnVi,
            enableZhVi: productForm.enableZhVi,
            category: productForm.category,
            categorySlug: catSlug,
            categoryId: catId,
            packCode: productForm.packCode ? productForm.packCode.trim() : "",
            price: productForm.price,
            originalPrice: productForm.originalPrice,
            badge: productForm.badge,
            showOnHome: productForm.showOnHome,
            description: productForm.description,
            images: [imageToSave],
            posterUrl: imageToSave,
            rawImageUrl: savedRawImageUrl || "",
            qrPosition: {
              x: qrPos.x,
              y: qrPos.y,
              size: qrPos.size,
            },
            modelUrl: productForm.modelUrl || "/models/lion.glb",
            iosModelUrl: productForm.iosModelUrl || "/models/lion.usdz",
            targetUrl: productForm.targetUrl || "/targets/lion.mind",
            audioUrl: productForm.audioUrl || "",
            audios: customAudios,
          }),
        });
        const apiJson = await apiRes.json();
        if (apiJson.success && apiJson.data) {
          savedProductData = apiJson.data;
        }
      } catch (err) {
        console.warn("Lỗi khi lưu sản phẩm vào MongoDB qua API:", err);
      }

      const cleanImageUrl = savedProductData?.images?.[0] || imageToSave;

      const saved = saveProductToLanding({
        slug,
        nameEn: finalNameEn,
        nameVi: productForm.nameVi,
        nameZh: productForm.nameZh,
        ipa: productForm.ipa,
        pinyinZh: productForm.pinyinZh,
        enableEnVi: productForm.enableEnVi,
        enableZhVi: productForm.enableZhVi,
        category: productForm.category,
        categorySlug: catSlug,
        categoryId: catId,
        packCode: productForm.packCode ? productForm.packCode.trim() : "",
        price: productForm.price,
        originalPrice: productForm.originalPrice,
        badge: productForm.badge,
        showOnHome: productForm.showOnHome,
        description: productForm.description,
        images: [cleanImageUrl],
        posterUrl: cleanImageUrl,
        rawImageUrl: savedRawImageUrl || "",
        qrPosition: {
          x: qrPos.x,
          y: qrPos.y,
          size: qrPos.size,
        },
        modelUrl: productForm.modelUrl || "/models/lion.glb",
        iosModelUrl: productForm.iosModelUrl || "/models/lion.usdz",
        targetUrl: productForm.targetUrl || "/targets/lion.mind",
        audioUrl: productForm.audioUrl || "",
        audios: customAudios,
      });

      await loadStudioProducts(true);
      setIsPublishModalOpen(false);
      showToast(`Đã xuất bản thẻ "${saved.nameVi} (${saved.nameEn})" lên Hệ Thống thành công!`, "success");
    } catch (err: any) {
      console.error("Lỗi xuất bản sản phẩm:", err);
      showToast(`Lỗi xuất bản sản phẩm: ${err.message}`, "error");
    } finally {
      setIsPublishingProduct(false);
    }
  };

  // CRUD Danh Mục Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    try {
      const newCat = addProductCategory({
        name: categoryForm.name,
        description: categoryForm.description,
        iconName: categoryForm.iconName,
      });

      try {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCat),
        });
      } catch {}

      setCategoryForm({ name: "", description: "", iconName: "Layers" });
      setCategoriesList(getProductCategories());
      setProductForm((prev) => ({ ...prev, category: newCat.name }));
      showToast(`Đã thêm danh mục mới "${newCat.name}"`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    if (!name.trim()) return;
    try {
      updateProductCategory(id, { name });
      try {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name }),
        });
      } catch {}
      setEditingCategoryId(null);
      setEditingCategoryName("");
      setCategoriesList(getProductCategories());
      showToast(`Đã cập nhật danh mục thành "${name}"`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    requestConfirm({
      title: "Xác Nhận Xóa Danh Mục",
      message: `Bạn có chắc chắn muốn xóa danh mục "${name}"? Các sản phẩm trong danh mục này có thể cần được phân loại lại.`,
      confirmText: "Xóa Danh Mục",
      danger: true,
      onConfirm: async () => {
        try {
          await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
          });
        } catch {}
        deleteProductCategory(id);
        setCategoriesList(getProductCategories());
        showToast(`Đã xóa danh mục "${name}"`, "info");
      },
    });
  };

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!passcode.trim()) {
      setAuthError("Vui lòng nhập mã bảo mật của tác giả.");
      return;
    }

    try {
      setIsAuthenticating(true);
      const res = await fetch("/api/tools/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("polycards_tools_auth", "true");
      } else {
        setAuthError(data.message || "Mã bảo mật không đúng.");
      }
    } catch {
      setAuthError("Không thể kết nối đến máy chủ xác thực.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("polycards_tools_auth");
    setPasscode("");
  };

  // Màn hình khóa PIN nếu chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <AuthModal
        passcode={passcode}
        authError={authError}
        isAuthenticating={isAuthenticating}
        onChangePasscode={setPasscode}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col font-sans">
      {/* 1. Header Studio Chuyên Nghiệp */}
      <header className="sticky top-0 z-40 bg-stone-950/85 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-amber-300 hover:text-amber-200 transition-colors"
          >
            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-md">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black leading-tight flex items-center gap-1.5">
                <span>Poly Cards Studio</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  QR & CARD MAKER
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                Tạo mã QR WebAR & Kéo thả vào thẻ 1:1 chuẩn in ấn xưởng
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/#products"
            target="_blank"
            className="flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-white px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 transition-all hover:bg-emerald-500/25"
            title="Mở xem trang sản phẩm #products"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Xem #products</span>
          </Link>

          <Link
            href="/invoices"
            className="flex items-center gap-1.5 text-xs font-black text-amber-300 hover:text-stone-950 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-400 border border-amber-500/40 transition-all shadow-sm active:scale-95"
            title="Mở Module Lập Hóa Đơn Bán Hàng & POS chuyên biệt"
          >
            <Receipt className="h-3.5 w-3.5 text-amber-400" />
            <span>Hóa Đơn Bán Hàng (POS)</span>
          </Link>

          <Link
            href="/ar/cat?ar=1"
            target="_blank"
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Thử WebAR</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-rose-400 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
            title="Đăng xuất khỏi Studio"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Khóa Studio</span>
          </button>
        </div>
      </header>

      {/* THANH ĐIỀU HƯỚNG TABS PHÂN HỆ STUDIO */}
      <div className="bg-stone-900/90 border-b border-white/10 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 overflow-x-auto shrink-0 z-30">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveStudioTab("editor")}
            className={`py-2 px-3.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
              activeStudioTab === "editor"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                : "text-stone-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Chế Bản & QR Studio</span>
            {printQueue.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-950 text-amber-300 font-black">
                {printQueue.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveStudioTab("products");
              loadStudioProducts(true);
            }}
            className={`py-2 px-3.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
              activeStudioTab === "products"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                : "text-stone-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Kho Thẻ Bài Sản Phẩm</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeStudioTab === "products" ? "bg-stone-950 text-amber-300" : "bg-white/10 text-stone-300"}`}>
              {productsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStudioTab("categories")}
            className={`py-2 px-3.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
              activeStudioTab === "categories"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                : "text-stone-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Quản Lý Danh Mục</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeStudioTab === "categories" ? "bg-stone-950 text-amber-300" : "bg-white/10 text-stone-300"}`}>
              {categoriesList.length}
            </span>
          </button>
        </div>

        {/* Trạng thái hàng đợi in nhanh */}
        {printQueue.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1.5 rounded-xl">
              <FolderArchive className="h-3.5 w-3.5 text-amber-400" />
              <span>Hàng đợi: <strong>{printQueue.length}</strong> thẻ</span>
            </span>
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isGeneratingZip}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>{isGeneratingZip ? "Đang Nén..." : "Tải ZIP Hàng Đợi"}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. TAB 1: BÀN CHẾ BẢN & QR STUDIO */}
      {activeStudioTab === "editor" && (
        <EditorTab
          qrGeneratedCount={qrGeneratedCount}
          selectedPackForCard={selectedPackForCard}
          packGeneratedCode={packGeneratedCode}
          copiedPackCode={copiedPackCode}
          qrMode={qrMode}
          qrTargetEnv={qrTargetEnv}
          slug={slug}
          customUrl={customUrl}
          directAr={directAr}
          includeLicense={includeLicense}
          licenseCode={licenseCode}
          isGeneratingQr={isGeneratingQr}
          qrDataUrl={qrDataUrl}
          targetUrl={targetUrl}
          copiedUrl={copiedUrl}
          onSetSelectedPackForCard={setSelectedPackForCard}
          onGeneratePackCodeForCard={handleGeneratePackCodeForCard}
          onCopyPackCode={handleCopyPackCode}
          onSetQrMode={setQrMode}
          onSetQrTargetEnv={setQrTargetEnv}
          onSetSlug={setSlug}
          onSetCustomUrl={setCustomUrl}
          onSetDirectAr={setDirectAr}
          onSetIncludeLicense={setIncludeLicense}
          onSetLicenseCode={setLicenseCode}
          onGenerateQr={async () => {
            setIsQrOverlayEnabled(true);
            await handleGenerateQr();
            showToast(
              `Đã cập nhật mã QR (${targetUrl}) và gắn lên thẻ bài!`,
              "success"
            );
          }}
          onDownloadQrPng={handleDownloadQrPng}
          onDownloadQrSvg={handleDownloadQrSvg}
          onCopyUrl={() => {
            navigator.clipboard.writeText(targetUrl);
            setCopiedUrl(true);
            showToast("Đã sao chép link quét AR vào Clipboard!", "success");
            setTimeout(() => setCopiedUrl(false), 2000);
          }}
          cardDimensions={cardDimensions}
          cardFileName={cardFileName}
          isDraggingOverFile={isDraggingOverFile}
          onSetIsDraggingOverFile={setIsDraggingOverFile}
          onLoadImageFile={handleLoadImageFile}
          qrPos={qrPos}
          isQrOverlayEnabled={isQrOverlayEnabled}
          isExporting={isExporting}
          isAddingToQueue={isAddingToQueue}
          copiedImage={copiedImage}
          printQueue={printQueue}
          isQueueExpanded={isQueueExpanded}
          zipFileName={zipFileName}
          isGeneratingZip={isGeneratingZip}
          onSetQrPos={setQrPos}
          onAutoSnap={handleAutoSnap}
          onToggleQrOverlay={handleToggleQrOverlay}
          onDownloadCard={handleExportFullCard}
          onAddToPrintQueue={handleAddToPrintQueue}
          onCopyImage={handleCopyCardImage}
          onPrint={handlePrint}
          onSetIsQueueExpanded={setIsQueueExpanded}
          onSetZipFileName={setZipFileName}
          onRemoveQueueItem={handleRemoveQueueItem}
          onDownloadZip={handleDownloadZip}
          onClearQueue={handleClearQueue}
          onOpenPublishModal={handleOpenPublishModal}
          canvasContainerRef={canvasContainerRef}
          cardElementRef={cardElementRef}
          cardImageSrc={cardImageSrc}
          isPreviewFinal={isPreviewFinal}
          cardHasBakedQr={cardImageSrc.includes("-card.") || (!cardImageSrc.includes("-template.") && !rawImageUrl && !rawImageBlob)}
          onSetIsPreviewFinal={setIsPreviewFinal}
          onPointerDownQr={handleQrPointerDown}
          onResizePointerDown={handleResizePointerDown}
          onWorkspacePointerMove={handleWorkspacePointerMove}
          onWorkspacePointerUp={handleWorkspacePointerUp}
          onUploadCleanTemplate={handleLoadCleanTemplate}
          onRestoreOriginalImage={handleRestoreOriginalCardImage}
          onResetQrToStandard={handleResetQrToStandard}
        />
      )}

      {/* 3. TAB 2: KHO THẺ BÀI SẢN PHẨM (CRUD) */}
      {activeStudioTab === "products" && (
        <ProductsTab
          productsList={productsList}
          categoriesList={categoriesList}
          isLoadingProducts={isLoadingProducts}
          onNavigateToEditor={() => setActiveStudioTab("editor")}
          onLoadCardToCanvas={handleLoadCardToCanvas}
          onOpenEditProduct={handleOpenEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onBatchDeleteProducts={handleBatchDeleteProducts}
          onToggleShowOnHome={handleToggleShowOnHome}
          onOpenComboModal={() => setIsComboModalOpen(true)}
          onBatchAssignPackCode={handleBatchAssignPackCode}
          onUpdatePackCode={handleUpdateSinglePackCode}
          onAddToPrintQueue={handleAddCardToPrintQueue}
          onBatchAddToPrintQueue={handleBatchAddToPrintQueue}
          onDownloadSingleCard={handleDownloadSingleCardPrint}
          onDownloadZipForCards={handleDownloadZipForCards}
          printQueueCount={printQueue.length}
          isGeneratingZip={isGeneratingZip}
        />
      )}

      {/* 4. TAB 3: QUẢN LÝ DANH MỤC THẺ BÀI (CRUD) */}
      {activeStudioTab === "categories" && (
        <CategoriesTab
          categoriesList={categoriesList}
          productsList={productsList}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          handleAddCategory={handleAddCategory}
          categorySearchQuery={categorySearchQuery}
          setCategorySearchQuery={setCategorySearchQuery}
          editingCategoryId={editingCategoryId}
          setEditingCategoryId={setEditingCategoryId}
          editingCategoryName={editingCategoryName}
          setEditingCategoryName={setEditingCategoryName}
          handleUpdateCategory={handleUpdateCategory}
          handleDeleteCategory={handleDeleteCategory}
          setFilterCardCategory={setFilterCardCategory}
          setActiveStudioTab={setActiveStudioTab}
        />
      )}

      {/* 5. CÁC MODAL HỆ THỐNG */}
      <PublishProductModal
        isOpen={isPublishModalOpen}
        slug={slug}
        productForm={productForm}
        categoriesList={categoriesList}
        isPublishing={isPublishingProduct}
        onClose={() => setIsPublishModalOpen(false)}
        onChangeSlug={setSlug}
        onChangeForm={(data) => setProductForm((prev) => ({ ...prev, ...data }))}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onSubmit={handleSaveProductToLanding}
        onShowToast={showToast}
      />

      <EditProductModal
        isOpen={isEditProductModalOpen}
        editingProduct={editingProduct}
        editProductForm={editProductForm}
        categoriesList={categoriesList}
        isSaving={isSavingEditProduct}
        onClose={() => setIsEditProductModalOpen(false)}
        onChangeForm={(data) => setEditProductForm((prev) => ({ ...prev, ...data }))}
        onSubmit={handleSaveEditProduct}
        onShowToast={showToast}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        categoriesList={categoriesList}
        onClose={() => setIsCategoryModalOpen(false)}
        onSaveCategory={(data) => {
          addProductCategory(data);
          setCategoriesList(getProductCategories());
          showToast(`Đã thêm danh mục "${data.name}"`, "success");
        }}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={(cat) => handleDeleteCategory(cat.id, cat.name)}
      />

      <ComboConfigModal
        isOpen={isComboModalOpen}
        comboData={featuredCombo}
        isSaving={isSavingCombo}
        onClose={() => setIsComboModalOpen(false)}
        onSave={handleSaveFeaturedCombo}
        onShowToast={showToast}
      />

      <ConfirmModal
        confirmState={confirmDialog}
        onCancel={() => setConfirmDialog(null)}
      />

      <ToastNotification
        toasts={toasts}
        onDismiss={removeToast}
      />
    </div>
  );
}
