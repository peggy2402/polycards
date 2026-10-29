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
  slugify,
  CATEGORIES_UPDATED_EVENT,
  PRODUCTS_UPDATED_EVENT,
} from "@/lib/products-store";
import { Animal, ProductCategory } from "@/types/animal";

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

  // 5. Tọa độ & Kích thước QR trên Thẻ (% để chuẩn xác trên mọi kích thước ảnh)
  const [qrPos, setQrPos] = useState<QrPosition>({
    x: 6.2,
    y: 70.8,
    size: 25.8,
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
    category: "Hành Động",
    price: 219000,
    originalPrice: 299000,
    badge: "Mới ra mắt",
    description: "Thẻ học thông minh phát triển kỹ năng vận động và phản xạ thể chất cho trẻ.",
    useCompositeCardImage: true,
    modelPresetId: "lion",
    modelUrl: "/models/lion.glb",
    iosModelUrl: "/models/lion.usdz",
    targetUrl: "/targets/lion.mind",
    audioUrl: "",
  });
  const [isPublishingProduct, setIsPublishingProduct] = useState<boolean>(false);

  // 13. Tabs phân hệ Studio
  const [activeStudioTab, setActiveStudioTab] = useState<StudioTab>("editor");

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
    category: "Động Vật",
    price: 219000,
    originalPrice: 299000,
    badge: "Mới ra mắt",
    description: "",
    imageUrl: "",
    modelUrl: "/models/lion.glb",
    iosModelUrl: "/models/lion.usdz",
    targetUrl: "/targets/lion.mind",
    audioUrl: "",
  });
  const [isSavingEditProduct, setIsSavingEditProduct] = useState<boolean>(false);

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

  // Tải danh sách sản phẩm từ API (hoặc fallback store)
  const loadStudioProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
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
      setIsLoadingProducts(false);
    }
    setProductsList(getMergedProducts());
  }, []);

  useEffect(() => {
    loadStudioProducts();
    const handleUpdate = () => loadStudioProducts();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleUpdate);
    };
  }, [loadStudioProducts]);

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
    if (includeLicense && licenseCode.trim()) {
      params.set("code", licenseCode.trim());
    }
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }, [qrMode, qrTargetEnv, customUrl, slug, directAr, includeLicense, licenseCode]);

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
    setQrPos({ x: 6.2, y: 70.8, size: 25.8 });

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

  // Nạp ảnh thẻ mẫu mới từ máy tính
  const handleLoadImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).", "warning");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setCardImageSrc(objectUrl);
      setCardDimensions({
        width: img.naturalWidth || 709,
        height: img.naturalHeight || 1024,
      });
      setCardFileName(file.name);
      setSelectedPresetId("custom-upload");

      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const cleanSlug = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/^-+|-+$/g, "");
      if (cleanSlug && cleanSlug.length >= 2) {
        setSlug(cleanSlug);
      }
    };
    img.src = objectUrl;
  };

  const handleAutoSnap = () => {
    setQrPos({ x: 6.2, y: 70.8, size: 25.8 });
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
          await loadStudioProducts();
          showToast(`Đã xóa thẻ bài "${product.nameVi}" thành công!`, "success");
        } catch (err: any) {
          showToast(`Lỗi xóa thẻ bài: ${err.message}`, "error");
        }
      },
    });
  };

  const handleOpenEditProduct = (product: Animal) => {
    setEditingProduct(product);
    setEditProductForm({
      nameVi: product.nameVi,
      nameEn: product.nameEn,
      nameZh: product.nameZh || "",
      ipa: product.ipa || `/${product.slug}/`,
      pinyinZh: product.pinyinZh || "",
      category: product.category || "Động Vật",
      price: product.price || 219000,
      originalPrice: product.originalPrice || Math.round((product.price || 219000) * 1.3),
      badge: product.badge || "Mới ra mắt",
      description: product.description || "",
      imageUrl: product.posterUrl || (Array.isArray(product.images) && product.images[0]) || "",
      modelUrl: product.modelUrl || "/models/lion.glb",
      iosModelUrl: product.iosModelUrl || "/models/lion.usdz",
      targetUrl: product.targetUrl || `/targets/${product.slug}.mind`,
      audioUrl: product.audioUrl || "",
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
        nameEn: editProductForm.nameEn.trim(),
        nameZh: editProductForm.nameZh.trim(),
        ipa: editProductForm.ipa.trim(),
        pinyinZh: editProductForm.pinyinZh.trim(),
        category: editProductForm.category.trim(),
        categorySlug: slugify(editProductForm.category),
        price: Number(editProductForm.price) || 219000,
        originalPrice: Number(editProductForm.originalPrice) || 299000,
        badge: editProductForm.badge.trim(),
        description: editProductForm.description.trim(),
        posterUrl: editProductForm.imageUrl.trim() || editingProduct.posterUrl,
        images: editProductForm.imageUrl.trim() ? [editProductForm.imageUrl.trim()] : editingProduct.images,
        modelUrl: editProductForm.modelUrl.trim() || editingProduct.modelUrl,
        iosModelUrl: editProductForm.iosModelUrl.trim() || editingProduct.iosModelUrl,
        targetUrl: editProductForm.targetUrl.trim() || editingProduct.targetUrl,
        audioUrl: editProductForm.audioUrl.trim() || editingProduct.audioUrl,
      };

      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      saveProductToLanding(updatedData);
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
      await loadStudioProducts();
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
    const cardImg =
      product.posterUrl ||
      (Array.isArray(product.images) && product.images[0]) ||
      `/images/cards/${product.slug}-template.jpg`;
    setCardImageSrc(cardImg);
    setSlug(product.slug);
    setCardFileName(`${product.slug}-card.jpg`);
    setQrPos({ x: 6.2, y: 70.8, size: 25.8 });

    const isAlreadyHasQr = cardImg.includes("-card.") || !cardImg.includes("-template.");
    if (isAlreadyHasQr) {
      setIsQrOverlayEnabled(false);
      showToast(
        `Đã nạp thẻ "${product.nameVi}". Thẻ đã có sẵn mã QR (Đã ẩn lớp QR ghép thêm để không bị lặp 2 mã).`,
        "info"
      );
    } else {
      setIsQrOverlayEnabled(true);
      showToast(`Đã nạp phôi thẻ "${product.nameVi}" lên Bàn Chế Bản!`, "success");
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
      category: resolvedCategory,
      price: product.price || 219000,
      originalPrice: product.originalPrice || Math.round((product.price || 219000) * 1.3),
      badge: product.badge || "Mới ra mắt",
      description: product.description || "",
      useCompositeCardImage: true,
      modelPresetId: matchedProductPreset ? matchedProductPreset.id : "custom",
      modelUrl: product.modelUrl || "/models/lion.glb",
      iosModelUrl: product.iosModelUrl || "/models/lion.usdz",
      targetUrl: product.targetUrl || `/targets/${product.slug}.mind`,
      audioUrl: product.audioUrl || "",
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
        category: resolvedCategory,
        price: existingProduct.price || 219000,
        originalPrice:
          existingProduct.originalPrice ||
          Math.round((existingProduct.price || 219000) * 1.3),
        badge: existingProduct.badge || "Mới ra mắt",
        description:
          existingProduct.description ||
          `Thẻ học thông minh tương tác thực tế ảo AR Poly Cards: ${existingProduct.nameVi} (${existingProduct.nameEn}).`,
        useCompositeCardImage: true,
        modelPresetId: matchedPreset ? matchedPreset.id : "custom",
        modelUrl: existingProduct.modelUrl || "/models/lion.glb",
        iosModelUrl: existingProduct.iosModelUrl || "/models/lion.usdz",
        targetUrl: existingProduct.targetUrl || `/targets/${cleanSlug}.mind`,
        audioUrl: existingProduct.audioUrl || "",
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
      category: isCurrentSlugSame && prev.category ? prev.category : resolvedDefaultCat,
      price: prev.price || 219000,
      originalPrice: prev.originalPrice || 299000,
      badge: prev.badge || "Mới ra mắt",
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
    }));

    setIsPublishModalOpen(true);
  };

  const handleSaveProductToLanding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.nameEn.trim() || !productForm.nameVi.trim()) {
      showToast("Vui lòng nhập tên tiếng Anh và tên tiếng Việt cho thẻ bài.", "warning");
      return;
    }
    if (!productForm.category.trim()) {
      showToast("Vui lòng chọn danh mục cho thẻ bài.", "warning");
      return;
    }

    try {
      setIsPublishingProduct(true);

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

      let savedProductData: any = null;
      try {
        const apiRes = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            nameEn: productForm.nameEn,
            nameVi: productForm.nameVi,
            nameZh: productForm.nameZh,
            ipa: productForm.ipa,
            pinyinZh: productForm.pinyinZh,
            category: productForm.category,
            categorySlug: catSlug,
            categoryId: catId,
            price: productForm.price,
            originalPrice: productForm.originalPrice,
            badge: productForm.badge,
            description: productForm.description,
            images: [imageToSave],
            posterUrl: imageToSave,
            modelUrl: productForm.modelUrl || "/models/lion.glb",
            iosModelUrl: productForm.iosModelUrl || "/models/lion.usdz",
            targetUrl: productForm.targetUrl || "/targets/lion.mind",
            audioUrl: productForm.audioUrl || "",
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
        nameEn: productForm.nameEn,
        nameVi: productForm.nameVi,
        nameZh: productForm.nameZh,
        ipa: productForm.ipa,
        pinyinZh: productForm.pinyinZh,
        category: productForm.category,
        categorySlug: catSlug,
        categoryId: catId,
        price: productForm.price,
        originalPrice: productForm.originalPrice,
        badge: productForm.badge,
        description: productForm.description,
        images: [cleanImageUrl],
        posterUrl: cleanImageUrl,
        modelUrl: productForm.modelUrl || "/models/lion.glb",
        iosModelUrl: productForm.iosModelUrl || "/models/lion.usdz",
        targetUrl: productForm.targetUrl || "/targets/lion.mind",
        audioUrl: productForm.audioUrl || "",
      });

      await loadStudioProducts();
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
              loadStudioProducts();
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
          onGenerateQr={handleGenerateQr}
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
          onSetIsPreviewFinal={setIsPreviewFinal}
          onPointerDownQr={handleQrPointerDown}
          onResizePointerDown={handleResizePointerDown}
          onWorkspacePointerMove={handleWorkspacePointerMove}
          onWorkspacePointerUp={handleWorkspacePointerUp}
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
