"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  FileDown,
  Printer,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Maximize2,
  Sliders,
  Move,
  Maximize,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  RefreshCw,
  Link as LinkIcon,
  Palette,
  FileCode,
  FileSpreadsheet,
  Users,
  Phone,
  Plus,
  Trash2,
  Send,
  Dices,
  ShoppingBag,
  Search,
  Edit3,
  X,
  Tag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Receipt,
  ArrowUpRight,
  ListPlus,
  Archive,
  FolderArchive,
  Filter,
  ArrowUpDown,
  FileArchive,
} from "lucide-react";
import JSZip from "jszip";
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
import { formatVndCurrency } from "@/lib/formatters";

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

export interface InvoiceRecord {
  id: string;
  code: string;
  type: "direct" | "online";
  customerType?: "TRUCTIEP" | "ONLINE";
  customerName: string;
  customerPhone?: string;
  packType: "combo6" | "combo30" | "vip";
  packId?: string;
  packCode?: string;
  packTitle: string;
  allowedCategorySlug?: string;
  createdAt: string;
  note?: string;
  directUrl: string;
}

// Danh sách các thẻ mẫu chuẩn sẵn có của dự án
const CARD_PRESETS: CardPreset[] = [
  {
    id: "jump-action",
    name: "Thẻ Jump - Nhảy (Hành Động)",
    slug: "jump",
    category: "Hành Động",
    imageSrc: "/images/cards/jump-template.jpg",
    width: 709,
    height: 1024,
    defaultQr: { x: 6.2, y: 70.8, size: 25.8 },
  },
  {
    id: "lion-animal",
    name: "Thẻ Lion - Sư Tử (Combo 6)",
    slug: "lion",
    category: "Động Vật",
    imageSrc: "/images/cards/lion-template.jpg",
    width: 709,
    height: 1024,
    defaultQr: { x: 6.2, y: 70.8, size: 25.8 },
  },
  {
    id: "cat-animal",
    name: "Thẻ Cat - Con Mèo (Combo 6)",
    slug: "cat",
    category: "Động Vật",
    imageSrc: "/images/animals/cat.jpg",
    width: 709,
    height: 1024,
    defaultQr: { x: 6.2, y: 70.8, size: 25.8 },
  },
  {
    id: "dog-animal",
    name: "Thẻ Dog - Con Chó (Combo 6)",
    slug: "dog",
    category: "Động Vật",
    imageSrc: "/images/animals/dog.jpg",
    width: 709,
    height: 1024,
    defaultQr: { x: 6.2, y: 70.8, size: 25.8 },
  },
  {
    id: "deer-animal",
    name: "Thẻ Deer - Con Hươu (Combo 6)",
    slug: "deer",
    category: "Động Vật",
    imageSrc: "/images/animals/deer.jpg",
    width: 709,
    height: 1024,
    defaultQr: { x: 6.2, y: 70.8, size: 25.8 },
  },
  {
    id: "elephant-animal",
    name: "Thẻ Elephant - Con Voi (Combo 6)",
    slug: "elephant",
    category: "Động Vật",
    imageSrc: "/images/animals/elephant.jpg",
    width: 709,
    height: 1024,
    defaultQr: { x: 6.2, y: 70.8, size: 25.8 },
  },
  {
    id: "panda-animal",
    name: "Thẻ Panda - Gấu Trúc (Combo 6)",
    slug: "panda",
    category: "Động Vật",
    imageSrc: "/images/animals/panda.jpg",
    width: 709,
    height: 1024,
    defaultQr: { x: 6.2, y: 70.8, size: 25.8 },
  },
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 5. Tọa độ & Kích thước QR trên Thẻ (Lưu theo % để chuẩn xác trên mọi kích thước ảnh)
  // X: % từ lề trái, Y: % từ lề trên, Size: % theo chiều rộng thẻ
  const [qrPos, setQrPos] = useState<{ x: number; y: number; size: number }>({
    x: 6.2,
    y: 70.8,
    size: 25.8,
  });

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
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // 8. Chế độ xem trước thẻ FINAL (Ẩn hoàn toàn viền và núm kéo, hiển thị 100% sạch chuẩn in)
  const [isPreviewFinal, setIsPreviewFinal] = useState<boolean>(false);

  // 9. Cấu hình Sinh Mã Bản Quyền Cho Bộ Thẻ (In Xưởng / Tem Dán)
  const [selectedPackForCard, setSelectedPackForCard] = useState<string>("POLY30-DONGVAT");
  const [packGeneratedCode, setPackGeneratedCode] = useState<string>("");
  const [copiedPackCode, setCopiedPackCode] = useState<boolean>(false);

  // Toast & Thông Báo Người Dùng
  interface ToastMessage {
    id: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
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

  // Modal Xác Nhận (Thay thế hoàn toàn window.confirm)
  interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
  }
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    danger: false,
    onConfirm: () => {},
  });

  const requestConfirm = useCallback(
    (options: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      danger?: boolean;
      onConfirm: () => void;
    }) => {
      setConfirmDialog({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || "Xác nhận",
        cancelText: options.cancelText || "Hủy",
        danger: options.danger ?? true,
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          options.onConfirm();
        },
      });
    },
    []
  );

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
  const [showAdvancedFields, setShowAdvancedFields] = useState<boolean>(false);
  const [productForm, setProductForm] = useState({
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
  });

  // Thông báo xuất bản thành công
  const [publishedSuccessInfo, setPublishedSuccessInfo] = useState<{
    productName: string;
    categoryName: string;
    categorySlug?: string;
    slug: string;
  } | null>(null);
  const [isPublishingProduct, setIsPublishingProduct] = useState<boolean>(false);

  // Tải danh mục sản phẩm từ store khi khởi động
  useEffect(() => {
    const loadCategories = () => {
      setCategoriesList(getProductCategories());
    };
    loadCategories();
    window.addEventListener(CATEGORIES_UPDATED_EVENT, loadCategories);
    return () => {
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, loadCategories);
    };
  }, []);

  // 13. Tabs phân hệ Studio: "editor" (Chế Bản & In Ấn) | "products" (Kho Thẻ CRUD) | "categories" (Danh Mục CRUD)
  const [activeStudioTab, setActiveStudioTab] = useState<"editor" | "products" | "categories">("editor");

  // 14. Hàng Đợi Xuất File In Ấn (Print Queue) & Đóng gói ZIP
  interface PrintQueueItem {
    id: string;
    orderNumber: number; // 1, 2, 3...
    name: string;
    slug: string;
    category: string;
    previewUrl: string;
    blob: Blob;
    addedAt: string;
  }
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  const [zipFileName, setZipFileName] = useState<string>("bo-the-polycards-in-an");
  const [isAddingToQueue, setIsAddingToQueue] = useState<boolean>(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [isQueueExpanded, setIsQueueExpanded] = useState<boolean>(true);

  // 15. Quản lý Thẻ Bài Sản Phẩm (CRUD Products Studio)
  const [productsList, setProductsList] = useState<Animal[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [searchCardQuery, setSearchCardQuery] = useState<string>("");
  const [filterCardCategory, setFilterCardCategory] = useState<string>("all");

  // 16. Modal Chỉnh Sửa Thông Tin Thẻ Bài
  const [editingProduct, setEditingProduct] = useState<Animal | null>(null);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState<boolean>(false);
  const [editProductForm, setEditProductForm] = useState({
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
  });
  const [isSavingEditProduct, setIsSavingEditProduct] = useState<boolean>(false);

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

  // Lắng nghe sự kiện cập nhật sản phẩm
  useEffect(() => {
    loadStudioProducts();
    const handleUpdate = () => loadStudioProducts();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleUpdate);
    };
  }, [loadStudioProducts]);

  // Danh sách sản phẩm được lọc theo từ khóa & danh mục trong Tab 2
  const filteredProducts = productsList.filter((item) => {
    const matchCategory =
      filterCardCategory === "all" ||
      item.categorySlug === filterCardCategory ||
      item.category === filterCardCategory;

    if (!matchCategory) return false;

    if (!searchCardQuery.trim()) return true;
    const q = searchCardQuery.toLowerCase().trim();
    return (
      item.nameVi.toLowerCase().includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      (item.nameZh && item.nameZh.includes(q))
    );
  });

  // Sinh mã bản quyền tự động theo bộ và gắn trực tiếp vào mã QR trên thẻ mẫu để in
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

    // Căn chuẩn vị trí QR vào ô trắng góc dưới thẻ
    setQrPos({ x: 6.2, y: 70.8, size: 25.8 });

    // Đăng ký mã bản quyền này vào hệ thống backend orders
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

    showToast(`Đã sinh mã ${newCode} cho ${selectedPackForCard} và nhúng vào mã QR trên thẻ!`, "success");
  };

  // Sao chép mã bản quyền của bộ vừa sinh
  const handleCopyPackCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPackCode(true);
    showToast(`Đã sao chép mã bản quyền: ${code}`, "success");
    setTimeout(() => setCopiedPackCode(false), 2000);
  };

  // Tự động nhận diện session bảo mật
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("polycards_tools_auth");
      if (saved === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Lắng nghe phím Alt trên toàn màn hình để kích hoạt chế độ co giãn đối xứng từ tâm
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

      // 1. Sinh vector SVG
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

      // 2. Sinh raster PNG
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

            // Vẽ huy hiệu logo bo tròn ở trung tâm QR
            const badgeSize = 1024 * 0.22;
            const center = 1024 / 2;

            // Nền trắng mềm mại bo tròn
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(center, center, badgeSize / 2 + 10, 0, Math.PI * 2);
            ctx.fill();

            // Viền ngoài sang trọng
            ctx.lineWidth = 6;
            ctx.strokeStyle = qrColor;
            ctx.stroke();

            // Logo Poly Cards
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

  // Tự động sinh QR khi tải trang hoặc khi đổi URL
  useEffect(() => {
    handleGenerateQr();
  }, [handleGenerateQr]);

  // Xử lý nạp ảnh thẻ mẫu mới từ máy tính
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

      // Trích xuất slug tự động nếu tên file có dạng "jump.jpg" hay "card-jump.png"
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const cleanSlug = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/^-+|-+$/g, "");
      if (cleanSlug && cleanSlug.length >= 2) {
        setSlug(cleanSlug);
      }
    };
    img.src = objectUrl;
  };

  // Chọn mẫu thẻ bài sẵn có trong hệ thống
  const handleSelectPreset = (preset: CardPreset) => {
    setSelectedPresetId(preset.id);
    setCardImageSrc(preset.imageSrc);
    setCardDimensions({ width: preset.width, height: preset.height });
    setCardFileName(`${preset.slug}-template.jpg`);
    setSlug(preset.slug);
    setQrPos(preset.defaultQr);
  };

  // Nút tiện ích: Tự động bắt dính vào ô vuông trắng góc dưới thẻ
  const handleAutoSnap = () => {
    setQrPos({
      x: 6.2,
      y: 70.8,
      size: 25.8,
    });
  };

  // Bắt đầu di chuyển mã QR
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

  // Bắt đầu kéo góc để đổi kích thước 1:1
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

  // Xử lý di chuyển hoặc co giãn trong quá trình kéo chuột / cảm ứng
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

    // 1. CHẾ ĐỘ DI CHUYỂN VỊ TRÍ QR (Drag to Move)
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

    // 2. CHẾ ĐỘ CO GIÃN TỈ LỆ 1:1 (Aspect Ratio Lock 1:1 like Photoshop)
    if (resizingHandle) {
      let deltaPercent = (deltaPixelX / cardRenderWidth) * 100;

      if (resizingHandle === "nw" || resizingHandle === "sw") {
        deltaPercent = -deltaPercent;
      }

      // Giữ phím Alt: Co giãn đối xứng từ tâm (Center Scale)
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

  // Tạo ảnh thẻ thành phẩm có độ phân giải gốc để in ấn xưởng in
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
        // 1. Vẽ ảnh thẻ gốc full-res
        ctx.drawImage(cardImg, 0, 0, cardDimensions.width, cardDimensions.height);

        // 2. Tính tọa độ pixel thực tế của QR trên thẻ gốc
        const realQrX = (qrPos.x / 100) * cardDimensions.width;
        const realQrY = (qrPos.y / 100) * cardDimensions.height;
        const realQrSize = (qrPos.size / 100) * cardDimensions.width;

        // 3. Vẽ mã QR độ nét cao lên canvas
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
  }, [cardDimensions, cardImageSrc, qrPos, qrDataUrl]);

  // Tải xuống ảnh thẻ hoàn thiện chuẩn In Ấn
  const handleExportFullCard = async () => {
    try {
      setIsExporting(true);
      const canvas = await generateCompositeCanvas();
      const link = document.createElement("a");
      link.download = `polycards-${slug || "card"}-ready-to-print.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();

      setExportSuccessMsg("Đã xuất tệp in ấn hoàn tất thành công!");
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err: any) {
      showToast(`Lỗi xuất file: ${err.message}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Tải riêng mã QR độ phân giải cao PNG
  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `polycards-qr-${slug || "target"}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // Tải riêng mã QR Vector SVG
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

  // Sao chép ảnh thẻ vào Clipboard (Dán ngay vào Photoshop, Zalo, Canva)
  const handleCopyCardImage = async () => {
    try {
      const canvas = await generateCompositeCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        showToast("Đã sao chép ảnh thẻ vào Clipboard!", "success");
        setTimeout(() => setCopiedImage(false), 2500);
      }, "image/png");
    } catch (err) {
      console.warn("Clipboard copy not supported:", err);
      handleExportFullCard();
    }
  };

  // In trực tiếp thẻ bài
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
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err: any) {
      showToast(`Lỗi chuẩn bị in: ${err.message}`, "error");
    }
  };

  // Thêm thẻ bài hiện tại trên Bàn Chế Bản vào Hàng Đợi In (Print Queue)
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
      showToast(`Đã thêm "${cardTitle}" vào Hàng Đợi In (Sẽ xuất thành: ${nextOrder}.png)`, "success");
    } catch (err: any) {
      showToast(`Lỗi thêm vào hàng đợi: ${err.message}`, "error");
    } finally {
      setIsAddingToQueue(false);
    }
  };

  // Xóa một thẻ khỏi hàng đợi in
  const handleRemoveQueueItem = (id: string) => {
    setPrintQueue((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered.map((item, idx) => ({ ...item, orderNumber: idx + 1 }));
    });
    showToast("Đã xóa thẻ khỏi hàng đợi in", "info");
  };

  // Làm rỗng toàn bộ hàng đợi in
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

  // Nén toàn bộ thẻ trong hàng đợi thành tệp .ZIP (1.png, 2.png, 3.png... theo thứ tự)
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

      showToast(`Đã xuất và tải xuống tệp ZIP "${rawName}" (${printQueue.length} thẻ) thành công!`, "success");
    } catch (err: any) {
      showToast(`Lỗi xuất file ZIP: ${err.message}`, "error");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Xóa thẻ bài sản phẩm khỏi hệ thống
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

  // Mở modal sửa thông tin thẻ bài
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
    });
    setIsEditProductModalOpen(true);
  };

  // Lưu thông tin sửa thẻ bài
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

  // Nạp thẻ lên Bàn Chế Bản (Load to Canvas)
  const handleLoadCardToCanvas = (product: Animal) => {
    const cardImg = product.posterUrl || (Array.isArray(product.images) && product.images[0]) || `/images/cards/${product.slug}-template.jpg`;
    setCardImageSrc(cardImg);
    setSlug(product.slug);
    setProductForm({
      nameEn: product.nameEn,
      nameVi: product.nameVi,
      nameZh: product.nameZh || "",
      ipa: product.ipa || `/${product.slug}/`,
      pinyinZh: product.pinyinZh || "",
      category: product.category || "Động Vật",
      price: product.price || 219000,
      originalPrice: product.originalPrice || Math.round((product.price || 219000) * 1.3),
      badge: product.badge || "Mới ra mắt",
      description: product.description || "",
      useCompositeCardImage: true,
    });
    setActiveStudioTab("editor");
    showToast(`Đã nạp thẻ "${product.nameVi}" lên Bàn Chế Bản!`, "success");
  };

  // Mở popup xuất bản thẻ ra Landing Page #products
  const handleOpenPublishModal = () => {
    const cleanSlug = slug.trim().toLowerCase() || "jump";
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

    // Đảm bảo danh mục tồn tại trong danh sách
    const availableCategories = getProductCategories();
    const hasCat = availableCategories.some((c) => c.name.toLowerCase() === defaultCat.toLowerCase());
    if (!hasCat && availableCategories.length > 0) {
      defaultCat = availableCategories[0].name;
    }

    setProductForm({
      nameEn: defaultEn,
      nameVi: defaultVi,
      nameZh: defaultZh,
      ipa: `/${cleanSlug}/`,
      pinyinZh: defaultPinyin,
      category: defaultCat,
      price: 219000,
      originalPrice: 299000,
      badge: "Mới ra mắt",
      description: `Thẻ học thông minh tương tác thực tế ảo AR Poly Cards: ${defaultVi} (${defaultEn}).`,
      useCompositeCardImage: true,
    });

    setCategoriesList(availableCategories);
    setShowAdvancedFields(false);
    setIsPublishModalOpen(true);
  };

  // Lưu sản phẩm ra #products trang chủ
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

      // 1. Chuẩn bị ảnh: Dùng canvas thành phẩm (đã ghép QR) hoặc ảnh mẫu gốc
      let imageToSave = cardImageSrc;
      if (productForm.useCompositeCardImage) {
        try {
          const canvas = await generateCompositeCanvas();
          // Dùng định dạng jpeg 0.85 để tối ưu hóa truyền tải mạng và nhẹ hơn 80% so với png thô
          imageToSave = canvas.toDataURL("image/jpeg", 0.85);
        } catch (err) {
          console.warn("Không thể chụp canvas thẻ, dùng ảnh mẫu gốc:", err);
        }
      }

      // 2. Tìm danh mục chuẩn từ danh sách danh mục
      const selectedCatObj = categoriesList.find((c) => c.name === productForm.category);
      const catSlug = selectedCatObj?.slug || slugify(productForm.category);
      const catId = selectedCatObj?.id || `cat-${catSlug}`;

      // 3. Gửi đồng bộ lên API endpoint trước để Server lưu file vật lý vào public/images/cards/
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
          }),
        });
        const apiJson = await apiRes.json();
        if (apiJson.success && apiJson.data) {
          savedProductData = apiJson.data;
          console.log("Đã cập nhật file data/products.json & data/animals.json:", apiJson.data);
        }
      } catch (err) {
        console.warn("Lỗi khi ghi data/products.json qua API:", err);
      }

      // 4. Lấy URL ảnh tĩnh sạch (VD: /images/cards/lion-card.jpg, chỉ ~30 bytes, KHÔNG lưu chuỗi base64 khổng lồ)
      const cleanImageUrl =
        savedProductData?.images?.[0] ||
        (imageToSave.startsWith("data:") ? `/images/cards/${slug}-card.jpg` : imageToSave);

      // 5. Lưu an toàn vào local store hệ thống với dung lượng tối ưu và danh mục chuẩn
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
      });

      setIsPublishModalOpen(false);
      setPublishedSuccessInfo({
        productName: `${saved.nameVi} (${saved.nameEn})`,
        categoryName: saved.category || "Chung",
        categorySlug: saved.categorySlug || catSlug,
        slug: saved.slug,
      });

      showToast(`Đã xuất bản thẻ "${saved.nameVi} (${saved.nameEn})" lên Hệ Thống (#products & /products) thành công!`, "success");
    } catch (err: any) {
      console.error("Lỗi xuất bản sản phẩm:", err);
      showToast(`Lỗi xuất bản sản phẩm: ${err.message}`, "error");
    } finally {
      setIsPublishingProduct(false);
    }
  };


  // Thêm mới danh mục
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

  // Cập nhật danh mục
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

  // Xóa danh mục với Modal xác nhận đẹp
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

  // Xử lý đăng nhập bảo mật
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

  // MÀN HÌNH ĐĂNG NHẬP BẢO MẬT TÁC GIẢ (Nếu chưa đăng nhập)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-white">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/20 mb-3">
              <QrCode className="h-8 w-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-300">
              Poly Cards Studio
            </h1>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              Hệ thống khởi tạo mã QR WebAR & Chế bản thẻ bài chuẩn xưởng in 30 thẻ
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-amber-200 mb-1.5">
                Mã Bảo Mật Tác Giả:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Nhập mã bảo mật để mở khóa Studio..."
                  className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                />
                <KeyRound className="absolute right-4 top-3.5 h-4 w-4 text-stone-500" />
              </div>
              {authError && (
                <div className="flex items-center gap-1.5 mt-2 text-rose-400 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm active:scale-98 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>{isAuthenticating ? "Đang Xác Thực..." : "Mở Khóa Studio"}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <Link
              href="/"
              className="text-xs text-amber-300/80 hover:text-amber-200 underline font-medium"
            >
              Quay về Trang Chủ Poly Cards
            </Link>
          </div>
        </div>
      </div>
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

      {/* THANH ĐIỀU HƯỚNG PHÂN HỆ STUDIO (Tabs: Chế Bản & QR | Kho Thẻ Bài CRUD | Quản Lý Danh Mục CRUD) */}
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

        {/* Thanh trạng thái hàng đợi in nhanh */}
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

      {/* 2. Main Workspace (2 Cột: Cột điều khiển trái & Canvas tương tác phải) */}
      {activeStudioTab === "editor" && (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* ========================================================
            CỘT TRÁI: BẢNG TẠO MÃ QR & CẤU HÌNH (Width: 5/12 hoặc 4/12)
           ======================================================== */}
        <div className="lg:col-span-5 xl:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 bg-stone-900/60 p-4 sm:p-5 overflow-y-auto space-y-5 max-h-[calc(100vh-60px)]">
          {/* LIÊN KẾT NHANH SANG PHÂN HỆ HÓA ĐƠN BÁN HÀNG (POS) */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-black text-amber-300">Hóa Đơn Bán Hàng (POS)</div>
                <div className="text-[10px] text-stone-400">Tách riêng phân hệ lập phiếu, hạch toán Nợ/Có</div>
              </div>
            </div>
            <Link
              href="/invoices"
              className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1 transition-all shadow-md active:scale-95 shrink-0"
            >
              <span>Mở POS</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-5">
            {/* KHỐI 1: BỘ KHỞI TẠO MÃ QR (QR GENERATOR STUDIO) - NỔI BẬT NHẤT */}
            <div className="rounded-2xl bg-gradient-to-b from-amber-500/15 via-black/50 to-black/60 border-2 border-amber-400/50 p-4 space-y-4 shadow-xl shadow-amber-500/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-amber-400" />
                  <span>1. Khởi Tạo Mã QR (QR Generator)</span>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  Mã số #{qrGeneratedCount}
                </span>
              </div>

              {/* TÍNH NĂNG: SINH MÃ TỰ ĐỘNG CHO BỘ THẺ (GẮN TRỰC TIẾP VÀO THẺ MẪU ĐỂ IN) */}
              <div className="rounded-xl bg-black/60 border border-amber-500/30 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Sinh Mã Bản Quyền Cho Bộ Thẻ:</span>
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Bán Theo Bộ
                  </span>
                </div>

                <p className="text-[10px] text-stone-300 leading-snug">
                  Chọn bộ thẻ cần in &rarr; sinh mã bản quyền chuẩn và tự động nhúng vào mã QR trên thẻ mẫu để in xưởng.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <select
                      value={selectedPackForCard}
                      onChange={(e) => setSelectedPackForCard(e.target.value)}
                      className="w-full bg-black/80 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-bold focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="POLY30-DONGVAT">Bộ 30 Thẻ AR Động Vật (POLY30-DONGVAT)</option>
                      <option value="POLY30-HANHDONG">Bộ 30 Thẻ AR Hành Động (POLY30-HANHDONG)</option>
                      <option value="POLY30-XECO">Bộ 30 Thẻ AR Xe Cộ (POLY30-XECO)</option>
                      <option value="POLY30-HOAQUA">Bộ 30 Thẻ AR Hoa Quả (POLY30-HOAQUA)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <button
                      type="button"
                      onClick={handleGeneratePackCodeForCard}
                      className="w-full h-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-stone-950 font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                      title="Sinh mã và gắn tự động vào QR trên thẻ"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Sinh Mã &amp; Gắn QR</span>
                    </button>
                  </div>
                </div>

                {packGeneratedCode && (
                  <div className="flex items-center justify-between bg-black/80 p-2 rounded-lg border border-amber-500/40 text-[11px]">
                    <div className="font-mono text-amber-300 font-bold flex items-center gap-1.5 truncate mr-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Mã: <strong className="text-white">{packGeneratedCode}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPackCode(packGeneratedCode)}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0"
                    >
                      {copiedPackCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedPackCode ? "Đã Chép" : "Sao Chép"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Chọn Chế Độ Tạo QR: Theo Slug AR hay Link Tùy Biến */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10">
              <button
                type="button"
                onClick={() => setQrMode("slug")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  qrMode === "slug"
                    ? "bg-amber-500 text-stone-950 font-black shadow-md"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Theo Thẻ AR (Slug)</span>
              </button>
              <button
                type="button"
                onClick={() => setQrMode("custom")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  qrMode === "custom"
                    ? "bg-amber-500 text-stone-950 font-black shadow-md"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <LinkIcon className="h-3 w-3" />
                <span>Link Tùy Biến</span>
              </button>
            </div>

            {/* Form nhập liệu tương ứng */}
            {qrMode === "slug" ? (
              <div className="space-y-3">
                {/* Chọn môi trường đích (Online Vercel vs Localhost) */}
                <div className="flex items-center justify-between text-xs font-bold text-stone-300 pb-1">
                  <span>Máy chủ đích QR:</span>
                  <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setQrTargetEnv("production")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        qrTargetEnv === "production"
                          ? "bg-amber-500 text-stone-950 shadow"
                          : "text-stone-400 hover:text-white"
                      }`}
                      title="Quét bằng camera điện thoại ngoài đời (trang web Vercel đã deploy)"
                    >
                      Online Vercel (Chuẩn in)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTargetEnv("local")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        qrTargetEnv === "local"
                          ? "bg-emerald-500 text-stone-950 shadow"
                          : "text-stone-400 hover:text-white"
                      }`}
                      title="Quét test trực tiếp trên máy tính localhost:3000"
                    >
                      Localhost
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Slug Tên Thẻ / Hành Động / Con Vật:
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="Ví dụ: lion, cat, jump, apple..."
                    className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                  />
                  
                  {/* Preset Buttons nhanh */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-stone-400">Chọn nhanh:</span>
                    {[
                      { slugKey: "lion", label: "Sư Tử" },
                      { slugKey: "cat", label: "Con Mèo" },
                      { slugKey: "dog", label: "Con Chó" },
                      { slugKey: "deer", label: "Hươu" },
                      { slugKey: "elephant", label: "Voi" },
                      { slugKey: "panda", label: "Gấu Trúc" },
                      { slugKey: "jump", label: "Nhảy" },
                    ].map((item) => (
                      <button
                        key={item.slugKey}
                        type="button"
                        onClick={() => {
                          setSlug(item.slugKey);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                          slug === item.slugKey
                            ? "bg-amber-400 text-stone-950 border-amber-300"
                            : "bg-white/5 text-stone-300 border-white/10 hover:bg-white/20"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Các tùy chọn kích hoạt AR */}
                <div className="space-y-2 pt-1 border-t border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-200">
                    <input
                      type="checkbox"
                      checked={directAr}
                      onChange={(e) => setDirectAr(e.target.checked)}
                      className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 h-4 w-4"
                    />
                    <span>Mở thẳng WebAR Camera khi quét QR (?ar=1)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-200">
                    <input
                      type="checkbox"
                      checked={includeLicense}
                      onChange={(e) => setIncludeLicense(e.target.checked)}
                      className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 h-4 w-4"
                    />
                    <span>Nhúng mã bản quyền tự kích hoạt 1 chạm (&code=...)</span>
                  </label>

                  {includeLicense && (
                    <div className="pl-6 pt-1">
                      <input
                        type="text"
                        value={licenseCode}
                        onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                        placeholder="Mã bản quyền: POLY-JUMP-2026..."
                        className="w-full bg-black/80 border border-amber-400/40 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-400 placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Đường Dẫn URL Tùy Biến:
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://polycards-one.vercel.app/ar/..."
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Có thể nhập bất kỳ đường link website, video, hoặc trang đặt hàng.
                </p>
              </div>
            )}

            {/* NÚT TẠO MÃ QR NỔI BẬT */}
            <button
              type="button"
              onClick={handleGenerateQr}
              disabled={isGeneratingQr}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm active:scale-98 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isGeneratingQr ? "animate-spin" : ""}`} />
              <span>{isGeneratingQr ? "Đang Khởi Tạo QR..." : "Tạo / Cập Nhật Mã QR Ngay"}</span>
            </button>

            {/* KHUNG XEM TRƯỚC MÃ QR RIÊNG BIỆT (QR CODE PREVIEW BOX) */}
            <div className="p-3.5 rounded-2xl bg-black/70 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-3.5">
              {/* Ảnh Mã QR To Rõ */}
              <div className="relative h-28 w-28 shrink-0 rounded-xl bg-white p-1.5 shadow-xl flex items-center justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Mã QR Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-stone-400 text-[10px]">
                    Đang tạo...
                  </div>
                )}
              </div>

              {/* Thông tin quét thử & Tải riêng mã QR */}
              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-black text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mã QR Đã Sẵn Sàng Quét Thử</span>
                  </div>
                  <div className="text-[10px] text-stone-400 truncate max-w-full font-mono mt-0.5" title={targetUrl}>
                    {targetUrl}
                  </div>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownloadQrPng}
                    className="py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                    title="Tải riêng file PNG độ nét cao (1024px)"
                  >
                    <Download className="h-3 w-3" />
                    <span>Tải PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQrSvg}
                    className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[10px] flex items-center gap-1 transition-colors"
                    title="Tải riêng file vector SVG vô hạn độ phân giải"
                  >
                    <FileCode className="h-3 w-3 text-sky-400" />
                    <span>Tải SVG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(targetUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                    title="Sao chép liên kết"
                  >
                    {copiedUrl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedUrl ? "Đã chép" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 2: NẠP THẺ BÀI MẪU (CARD TEMPLATE) */}
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-amber-400" />
                <span>2. Thẻ Bài Mẫu (Card Template)</span>
              </label>
              <span className="text-[10px] font-mono text-stone-400">
                {cardDimensions.width} x {cardDimensions.height} px
              </span>
            </div>

            {/* Dropzone Kéo Thả Ảnh Thẻ */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOverFile(true);
              }}
              onDragLeave={() => setIsDraggingOverFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOverFile(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleLoadImageFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                isDraggingOverFile
                  ? "border-amber-400 bg-amber-500/10 scale-102"
                  : "border-white/20 bg-white/5 hover:border-amber-400/60 hover:bg-white/8"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleLoadImageFile(e.target.files[0]);
                  }
                }}
              />
              <Upload className="h-6 w-6 mx-auto text-amber-400 mb-1 animate-bounce" />
              <div className="text-xs font-bold text-white">
                Kéo thả ảnh thẻ bài vào đây hoặc bấm để chọn tệp
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Đang nạp: <strong className="text-amber-300">{cardFileName}</strong>
              </p>
            </div>
          </div>

          {/* KHỐI 3: TINH CHỈNH VỊ TRÍ & KÍCH THƯỚC QR (1:1 RATIO) */}
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-amber-400" />
                <span>3. Tinh Chỉnh QR Trên Thẻ (1:1)</span>
              </label>
              <button
                type="button"
                onClick={handleAutoSnap}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-black text-[11px] shadow hover:bg-amber-400 active:scale-95 transition-all"
                title="Tự động đặt vào ô trắng góc dưới thẻ"
              >
                <Sparkles className="h-3 w-3" />
                <span>Auto-Snap Vào Ô Trắng</span>
              </button>
            </div>

            {/* Thanh trượt kích thước QR (Luôn khóa 1:1) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-stone-300">
                <span>Kích Thước Mã QR:</span>
                <span className="font-mono text-amber-300">{qrPos.size}%</span>
              </div>
              <input
                type="range"
                min="12"
                max="50"
                step="0.5"
                value={qrPos.size}
                onChange={(e) =>
                  setQrPos((prev) => ({ ...prev, size: parseFloat(e.target.value) }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Điều khiển Logo & Màu sắc */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-300 select-none">
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 h-4 w-4"
                />
                <span>Logo Trung Tâm</span>
              </label>

              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[11px] text-stone-400 font-bold">Màu QR:</span>
                <input
                  type="color"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="h-6 w-8 rounded cursor-pointer bg-transparent border-0"
                  title="Đổi màu mã QR (Khuyến nghị màu tối để quét nhạy nhất)"
                />
              </div>
            </div>

            {/* Thông số vị trí tọa độ */}
            <div className="text-[10px] font-mono text-stone-400 bg-black/50 p-2 rounded-xl flex justify-between">
              <span>X: {qrPos.x}%</span>
              <span>Y: {qrPos.y}%</span>
              <span className="text-amber-300">Tỉ Lệ: 1:1 (Square)</span>
            </div>
          </div>

          {/* KHỐI 4: XUẤT BẢN & IN ẤN + HÀNG ĐỢI XUẤT .ZIP */}
          <div className="rounded-2xl bg-gradient-to-b from-amber-500/15 via-black/60 to-black/80 border-2 border-amber-500/40 p-4 space-y-3.5 shadow-xl shadow-amber-500/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <FileDown className="h-4 w-4 text-amber-400" />
                <span>4. Xuất File In Ấn (Print Export)</span>
              </label>
              {printQueue.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  <span>{printQueue.length} thẻ trong hàng đợi</span>
                </span>
              )}
            </div>

            {/* Hàng 2 Nút Chính: Tải Trực Tiếp Thẻ Này Hoặc Thêm Vào Hàng Đợi In */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportFullCard}
                disabled={isExporting}
                className="py-3 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 border border-white/10"
                title="Tải ngay 1 thẻ này dưới định dạng PNG chuẩn in ấn xưởng"
              >
                <Download className="h-4 w-4 text-amber-400" />
                <span>{isExporting ? "Đang Xuất..." : "Tải Thẻ Này (PNG)"}</span>
              </button>

              <button
                type="button"
                onClick={handleAddToPrintQueue}
                disabled={isAddingToQueue}
                className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs active:scale-98 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5"
                title="Thêm thẻ này vào hàng đợi để nén thành tệp .ZIP nhiều thẻ"
              >
                <ListPlus className="h-4 w-4" />
                <span>{isAddingToQueue ? "Đang Thêm..." : "Thêm Vào Hàng Đợi In"}</span>
              </button>
            </div>

            {exportSuccessMsg && (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" />
                <span>{exportSuccessMsg}</span>
              </div>
            )}

            {/* Các nút phụ: Sao chép Clipboard & In Trực Tiếp */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyCardImage}
                className="py-2 px-2 rounded-xl bg-black/40 hover:bg-black/60 text-stone-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-white/5 transition-colors"
                title="Sao chép ảnh thẻ đã ghép QR vào bộ nhớ đệm (Clipboard)"
              >
                {copiedImage ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-sky-400" />
                )}
                <span>{copiedImage ? "Đã Chép" : "Chép Clipboard"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="py-2 px-2 rounded-xl bg-black/40 hover:bg-black/60 text-stone-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-white/5 transition-colors"
                title="Mở giao diện in thẻ trực tiếp từ trình duyệt"
              >
                <Printer className="h-3.5 w-3.5 text-purple-400" />
                <span>In Trực Tiếp</span>
              </button>
            </div>

            {/* GIAO DIỆN HÀNG ĐỢI IN ẤN (PRINT QUEUE & TẢI ZIP NHIỀU THẺ) */}
            <div className="pt-2 border-t border-white/10 space-y-2.5">
              <div
                onClick={() => setIsQueueExpanded(!isQueueExpanded)}
                className="flex items-center justify-between cursor-pointer select-none text-xs font-black text-amber-300 hover:text-amber-200"
              >
                <div className="flex items-center gap-1.5">
                  <FolderArchive className="h-3.5 w-3.5 text-amber-400" />
                  <span>Hàng Đợi Xuất File .ZIP ({printQueue.length})</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-stone-400">
                  <span>{isQueueExpanded ? "Thu gọn" : "Xem chi tiết"}</span>
                  {isQueueExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>

              {isQueueExpanded && (
                <div className="space-y-2.5 animate-in fade-in">
                  {printQueue.length === 0 ? (
                    <div className="p-3 rounded-xl bg-black/40 border border-dashed border-white/15 text-center space-y-1">
                      <p className="text-[11px] text-stone-400">
                        Chưa có thẻ nào trong hàng đợi in.
                      </p>
                      <p className="text-[10px] text-stone-500 leading-snug">
                        Bấm nút <strong className="text-amber-300">"Thêm Vào Hàng Đợi In"</strong> ở trên sau khi căn chỉnh thẻ để gom nhiều thẻ và tải 1 lần thành tệp <strong className="text-amber-300">.ZIP</strong> (tên ảnh tự động: <code className="text-sky-300">1.png</code>, <code className="text-sky-300">2.png</code>...).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Ô Người Dùng Tự Đặt Tên Tệp .ZIP */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-300 flex items-center justify-between">
                          <span>Tên tệp .ZIP khi tải xuống:</span>
                          <span className="text-[9px] text-amber-400 font-mono">Tự đặt tên tùy ý</span>
                        </label>
                        <div className="flex items-center rounded-xl bg-black/70 border border-white/20 overflow-hidden focus-within:border-amber-400">
                          <input
                            type="text"
                            value={zipFileName}
                            onChange={(e) => setZipFileName(e.target.value)}
                            placeholder="Ví dụ: bo-dong-vat-30-the"
                            className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden"
                          />
                          <span className="px-2.5 py-1.5 text-xs font-mono font-bold text-amber-400 bg-white/5 border-l border-white/10">
                            .zip
                          </span>
                        </div>
                      </div>

                      {/* Danh sách các thẻ trong hàng đợi theo thứ tự 1, 2, 3... */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-700">
                        {printQueue.map((item, idx) => (
                          <div
                            key={item.id}
                            className="p-2 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2 text-xs hover:border-amber-500/40 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Số thứ tự file: 1.png, 2.png... */}
                              <div className="h-6 px-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}.png
                              </div>

                              {/* Thumbnail preview */}
                              {item.previewUrl && (
                                <img
                                  src={item.previewUrl}
                                  alt={item.name}
                                  className="h-8 w-6 object-cover rounded border border-white/20 shrink-0 bg-stone-800"
                                />
                              )}

                              <div className="min-w-0">
                                <div className="font-bold text-white text-[11px] truncate">
                                  {item.name}
                                </div>
                                <div className="text-[9px] text-stone-400 flex items-center gap-1.5 font-mono">
                                  <span>slug: {item.slug}</span>
                                  <span>•</span>
                                  <span className="text-amber-400/80">{item.category}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveQueueItem(item.id)}
                              className="h-6 w-6 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center shrink-0 transition-colors"
                              title="Xóa thẻ này khỏi hàng đợi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Các nút thao tác hàng đợi: Tải ZIP & Làm Rỗng */}
                      <div className="grid grid-cols-12 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleDownloadZip}
                          disabled={isGeneratingZip || printQueue.length === 0}
                          className="col-span-8 sm:col-span-9 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-md shadow-amber-500/20"
                        >
                          <Archive className="h-4 w-4" />
                          <span>
                            {isGeneratingZip
                              ? "Đang Đóng Gói .ZIP..."
                              : `Tải Tệp .ZIP (${printQueue.length} Thẻ)`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleClearQueue}
                          disabled={isGeneratingZip || printQueue.length === 0}
                          className="col-span-4 sm:col-span-3 py-2.5 px-2 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 text-stone-300 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-1 border border-white/10 transition-colors"
                          title="Xóa toàn bộ thẻ trong hàng đợi"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Xóa Hết</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* KHỐI 5: LƯU / CẬP NHẬT THẺ VÀO #products TRANG CHỦ */}
          <div className="rounded-2xl bg-gradient-to-b from-emerald-500/20 via-black/60 to-black/80 border-2 border-emerald-400/70 p-4 space-y-3.5 shadow-2xl shadow-emerald-500/15">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-emerald-400" />
                <span>5. Đưa Thẻ Ra #products Trang Chủ</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Xuất Bản Landing
              </span>
            </div>

            <p className="text-[11px] text-stone-300 leading-relaxed">
              Cập nhật thẻ bài vừa tạo vào danh mục sản phẩm trên trang chủ (có hoặc không có mã QR), bắt buộc chọn danh mục và quản lý giá bán để khách hàng xem được ngay tại <strong className="text-amber-300">#products</strong>.
            </p>

            <button
              type="button"
              onClick={handleOpenPublishModal}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-stone-950 font-black text-xs sm:text-sm active:scale-98 transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <Layers className="h-4 w-4 text-stone-950" />
              <span>Cập Nhật / Đưa Thẻ Vào #products</span>
            </button>
          </div>
        </div>
      </div>

        {/* ========================================================
            CỘT PHẢI: KHÔNG GIAN CANVAS TƯƠNG TÁC (Interactive Workspace)
           ======================================================== */}
        <div
          ref={canvasContainerRef}
          onPointerMove={handleWorkspacePointerMove}
          onPointerUp={handleWorkspacePointerUp}
          className="lg:col-span-7 xl:col-span-8 bg-stone-950 p-4 sm:p-8 flex flex-col items-center justify-center relative select-none overflow-hidden min-h-[500px]"
        >
          {/* Thanh HUD Điều Khiển Canvas & Chế Độ Xem (Chỉnh Sửa vs Xem Thẻ FINAL) */}
          <div className="absolute top-4 inset-x-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Nút Chuyển Đổi: Chỉnh Sửa vs Xem Thẻ FINAL */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-900/90 border border-white/20 backdrop-blur-md shadow-2xl pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsPreviewFinal(false)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !isPreviewFinal
                    ? "bg-amber-500 text-stone-950 font-black shadow-md"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Chế Độ Chỉnh Sửa</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewFinal(true)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isPreviewFinal
                    ? "bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/25"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Xem Thẻ FINAL (Chuẩn In)</span>
              </button>
            </div>

            {/* Chỉ dẫn hoặc Badge trạng thái */}
            <div className="flex items-center gap-2 rounded-full bg-stone-900/90 border border-white/20 px-3.5 py-1.5 backdrop-blur-md text-xs text-stone-200 shadow-2xl pointer-events-auto">
              {isPreviewFinal ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Chế Độ Soát Thẻ FINAL: 100% Sạch Bụi, Không Viền, Chuẩn In Xưởng</span>
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>
                    Kéo ở giữa để <strong>di chuyển</strong> • Kéo 4 góc để <strong>đổi cỡ (1:1)</strong>
                  </span>
                  <span className="hidden sm:inline text-amber-300 font-mono text-[10px] pl-1 border-l border-white/20">
                    Giữ phím <strong>Alt</strong> để co giãn từ tâm
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* VÙNG CHẾ BẢN THẺ BÀI CHÍNH (Card Canvas Frame) */}
          <div
            ref={cardElementRef}
            className={`relative max-h-[82vh] w-auto aspect-[709/1024] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-2 transition-all select-none ${
              isPreviewFinal ? "border-emerald-500/60 ring-4 ring-emerald-500/20" : "border-white/20"
            } bg-stone-900`}
            style={{
              aspectRatio: `${cardDimensions.width} / ${cardDimensions.height}`,
            }}
          >
            {/* 1. Lớp Ảnh Thẻ Mẫu Bên Dưới */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardImageSrc}
              alt="Thẻ Bài AR Poly Cards"
              draggable={false}
              className="w-full h-full object-cover pointer-events-none select-none block"
            />

            {/* 2. Lớp Mã QR Nổi Bên Trên Có Thể Kéo Thả & Co Giãn 1:1 */}
            <div
              onPointerDown={!isPreviewFinal ? handleQrPointerDown : undefined}
              className={`absolute z-10 select-none touch-none ${
                !isPreviewFinal ? "cursor-move group" : "pointer-events-none"
              }`}
              style={{
                left: `${qrPos.x}%`,
                top: `${qrPos.y}%`,
                width: `${qrPos.size}%`,
                height: `${(qrPos.size * cardDimensions.width) / cardDimensions.height}%`,
              }}
            >
              {/* Ảnh Mã QR Thực Tế */}
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none rounded-xl bg-white shadow-md p-1"
                />
              )}

              {/* Chỉ hiển thị Bounding Box & 4 Núm Kéo khi KHÔNG ở chế độ xem Thẻ FINAL */}
              {!isPreviewFinal && (
                <>
                  {/* Khung Viền Chọn Tương Tác Photoshop Style (Selection Border) */}
                  <div className="absolute inset-0 rounded-xl border-2 border-dashed border-amber-400/90 pointer-events-none shadow-[0_0_15px_rgba(251,191,36,0.45)] group-hover:border-amber-300" />

                  {/* 4 Núm Kéo Góc Giữ Tỉ Lệ 1:1 (Handles) */}
                  {/* Núm Top-Left */}
                  <div
                    onPointerDown={(e) => handleResizePointerDown("nw", e)}
                    className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                    title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
                  />

                  {/* Núm Top-Right */}
                  <div
                    onPointerDown={(e) => handleResizePointerDown("ne", e)}
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                    title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
                  />

                  {/* Núm Bottom-Right */}
                  <div
                    onPointerDown={(e) => handleResizePointerDown("se", e)}
                    className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                    title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
                  />

                  {/* Núm Bottom-Left */}
                  <div
                    onPointerDown={(e) => handleResizePointerDown("sw", e)}
                    className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                    title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
                  />

                  {/* Huy hiệu hiển thị kích thước trực tiếp khi rê chuột */}
                  <div className="absolute -bottom-7 inset-x-0 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-2 py-0.5 rounded-md bg-stone-900/95 text-amber-300 font-mono text-[9px] shadow-lg border border-amber-400/40 whitespace-nowrap">
                      QR 1:1 • {qrPos.size}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Thanh Thông Tin Chân Canvas */}
          <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none text-[11px] text-stone-400">
            <div className="bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto">
              Tọa độ: <span className="font-mono text-amber-300">X: {qrPos.x}%, Y: {qrPos.y}%</span>
            </div>
            <div className="bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto">
              Độ phân giải xuất: <span className="font-mono text-emerald-400">{cardDimensions.width} x {cardDimensions.height} px</span>
            </div>
          </div>
        </div>
      </main>
      )}

      {/* ========================================================
          TAB 2: KHO QUẢN LÝ THẺ BÀI SẢN PHẨM (CRUD SẢN PHẨM)
         ======================================================== */}
      {activeStudioTab === "products" && (
        <div className="flex-1 overflow-y-auto bg-stone-950 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Kho Thẻ Bài */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                  <Layers className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Kho Thẻ Bài Sản Phẩm Poly Cards
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {productsList.length} Thẻ
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1 max-w-2xl">
                Quản lý toàn bộ thẻ bài xuất hiện tại Landing <strong className="text-amber-300">#products</strong> và Bộ lọc <strong className="text-amber-300">/products</strong>. Bạn có thể tìm kiếm, sửa thông tin giá bán, xóa thẻ, nạp thẻ lên Bàn Chế Bản để in ấn hoặc kiểm tra WebAR 3D.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveStudioTab("editor")}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Chế Bản Thẻ Mới</span>
              </button>
            </div>
          </div>

          {/* Thanh Công Cụ: Tìm Kiếm, Lọc Danh Mục */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchCardQuery}
                onChange={(e) => setSearchCardQuery(e.target.value)}
                placeholder="Tìm thẻ theo tên tiếng Việt, tiếng Anh, tiếng Trung hoặc slug..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-white/15 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
              />
              {searchCardQuery && (
                <button
                  type="button"
                  onClick={() => setSearchCardQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 border border-white/15 text-xs text-stone-300">
                <Filter className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <select
                  value={filterCardCategory}
                  onChange={(e) => setFilterCardCategory(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="all" className="bg-stone-900 text-white">Tất Cả Danh Mục ({productsList.length})</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.slug} className="bg-stone-900 text-white">
                      {cat.name} ({productsList.filter((p) => p.categorySlug === cat.slug || p.category === cat.name).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lưới Thẻ Bài Sản Phẩm */}
          {isLoadingProducts ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-stone-400 font-bold">Đang tải danh sách thẻ bài...</p>
            </div>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div className="py-16 text-center rounded-3xl bg-stone-900/40 border border-dashed border-white/10 p-8 space-y-3">
                  <Layers className="h-10 w-10 text-stone-600 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-300">Không tìm thấy thẻ bài nào phù hợp</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Thử tìm kiếm với từ khóa khác hoặc bấm nút "Chế Bản Thẻ Mới" để xuất bản thêm thẻ bài vào hệ thống.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchCardQuery("");
                      setFilterCardCategory("all");
                    }}
                    className="py-2 px-4 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/15 transition-colors"
                  >
                    Xóa Bộ Lọc Tìm Kiếm
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((card) => {
                    const cardImg = card.posterUrl || (Array.isArray(card.images) && card.images[0]) || `/images/cards/${card.slug}-template.jpg`;
                    return (
                      <div
                        key={card.id || card.slug}
                        className="rounded-2xl bg-stone-900/90 border border-white/10 hover:border-amber-500/40 p-3.5 space-y-3 transition-all hover:shadow-xl hover:shadow-black/50 flex flex-col justify-between group"
                      >
                        {/* Ảnh & Badges */}
                        <div className="space-y-2.5">
                          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-950 border border-white/10 group-hover:border-amber-500/30 transition-colors">
                            <img
                              src={cardImg}
                              alt={card.nameVi}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />

                            {/* Badges trên ảnh */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 shadow-md">
                                {card.badge || "Mới"}
                              </span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-stone-300 backdrop-blur-md border border-white/20">
                                {card.category || "Động Vật"}
                              </span>
                            </div>

                            <div className="absolute bottom-2 right-2">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/80 text-amber-300 border border-amber-500/30">
                                {card.slug}
                              </span>
                            </div>
                          </div>

                          {/* Thông Tin Tên & Giá */}
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="font-black text-sm text-white truncate" title={card.nameVi}>
                                {card.nameVi}
                              </h3>
                              <span className="text-xs font-black text-amber-400 shrink-0 font-mono">
                                {formatVndCurrency(card.price || 219000)}
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-400 truncate">
                              <span className="text-stone-300 font-bold">{card.nameEn}</span>
                              {card.nameZh && <span className="ml-1 text-stone-400">({card.nameZh})</span>}
                              {card.ipa && <span className="ml-1 font-mono text-stone-500">{card.ipa}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Các Nút Hành Động Cho Thẻ */}
                        <div className="pt-2 border-t border-white/10 space-y-1.5">
                          {/* Nút Nạp Vào Bàn Chế Bản */}
                          <button
                            type="button"
                            onClick={() => handleLoadCardToCanvas(card)}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 border border-amber-500/30 transition-all active:scale-95"
                            title="Nạp thẻ này lên Canvas Bàn Chế Bản để chỉnh sửa QR hoặc thêm vào hàng đợi in ấn"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                            <span>Chế Bản & In Thẻ Này</span>
                          </button>

                          {/* 3 Nút Nhỏ: Sửa, Xóa, Thử AR */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(card)}
                              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                              title="Chỉnh sửa thông tin thẻ bài (giá, tên, mô tả)"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-sky-400" />
                              <span>Sửa</span>
                            </button>

                            <Link
                              href={`/ar/${card.slug}?ar=1`}
                              target="_blank"
                              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                              title="Mở xem trải nghiệm AR 3D thực tế"
                            >
                              <Eye className="h-3.5 w-3.5 text-purple-400" />
                              <span>AR 3D</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(card)}
                              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                              title="Xóa thẻ này khỏi hệ thống"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: QUẢN LÝ DANH MỤC THẺ BÀI (CRUD DANH MỤC)
         ======================================================== */}
      {activeStudioTab === "categories" && (
        <div className="flex-1 overflow-y-auto bg-stone-950 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Quản Lý Danh Mục */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                  <Tag className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Quản Lý Danh Mục Thẻ Bài Poly Cards
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {categoriesList.length} Danh Mục
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1 max-w-2xl">
                Tạo mới, chỉnh sửa và phân loại danh mục sản phẩm. Mỗi thẻ bài thuộc về một danh mục sẽ tự động được gom nhóm hiển thị trên trang chủ <strong className="text-amber-300">#products</strong> và bộ lọc <strong className="text-amber-300">/products</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CỘT TRÁI: FORM THÊM MỚI DANH MỤC */}
            <div className="lg:col-span-5 xl:col-span-4">
              <form
                onSubmit={handleAddCategory}
                className="rounded-2xl bg-stone-900/90 border border-amber-500/30 p-5 space-y-4 shadow-xl shadow-amber-500/5 sticky top-4"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                  <div className="h-8 w-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-300">Thêm Danh Mục Mới</h3>
                    <p className="text-[10px] text-stone-400">Tạo phân loại mới cho các bộ thẻ tiếp theo</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Tên danh mục <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Khủng Long, Côn Trùng, Nghề Nghiệp..."
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Mô tả ngắn danh mục:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả tóm tắt nội dung học tập của danh mục này..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Biểu tượng đại diện:
                    </label>
                    <select
                      value={categoryForm.iconName}
                      onChange={(e) => setCategoryForm({ ...categoryForm, iconName: e.target.value })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Layers">Icon: Chung (Layers)</option>
                      <option value="PawPrint">Icon: Động Vật (PawPrint)</option>
                      <option value="Activity">Icon: Vận Động (Activity)</option>
                      <option value="Car">Icon: Phương Tiện (Car)</option>
                      <option value="Apple">Icon: Hoa Quả (Apple)</option>
                      <option value="Sparkles">Icon: Kỳ Ảo (Sparkles)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tạo Danh Mục Mới</span>
                  </button>
                </div>
              </form>
            </div>

            {/* CỘT PHẢI: DANH SÁCH CÁC DANH MỤC HIỆN TẠI */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-black text-stone-300 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-amber-400" />
                  <span>Danh Sách Danh Mục ({categoriesList.length})</span>
                </div>
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder="Tìm danh mục..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-white/15 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {categoriesList
                  .filter((cat) => cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                  .map((cat) => {
                    const cardCount = productsList.filter(
                      (p) => p.categorySlug === cat.slug || p.category === cat.name
                    ).length;
                    const isEditing = editingCategoryId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className="rounded-2xl bg-stone-900/80 border border-white/10 hover:border-amber-500/30 p-4 space-y-2.5 transition-colors flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
                                <Tag className="h-4 w-4" />
                              </div>
                              <div>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingCategoryName}
                                    onChange={(e) => setEditingCategoryName(e.target.value)}
                                    className="bg-black border border-amber-400 rounded-lg px-2 py-0.5 text-xs text-white font-bold"
                                    autoFocus
                                  />
                                ) : (
                                  <h4 className="font-black text-sm text-white">{cat.name}</h4>
                                )}
                                <span className="text-[10px] text-stone-400 font-mono">slug: {cat.slug}</span>
                              </div>
                            </div>

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-stone-300 font-mono">
                              {cardCount} Thẻ
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">
                            {cat.description || "Danh mục thẻ học tương tác Poly Cards"}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateCategory(cat.id, editingCategoryName)}
                                className="py-1 px-2.5 rounded-lg bg-emerald-500 text-stone-950 font-black text-xs flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" />
                                <span>Lưu</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryId(null)}
                                className="py-1 px-2 rounded-lg bg-white/10 text-stone-300 font-bold text-xs"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategoryId(cat.id);
                                  setEditingCategoryName(cat.name);
                                }}
                                className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors"
                              >
                                <Edit3 className="h-3 w-3 text-sky-400" />
                                <span>Sửa</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="py-1 px-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 font-bold text-xs flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Xóa</span>
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setFilterCardCategory(cat.slug);
                              setActiveStudioTab("products");
                            }}
                            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                          >
                            <span>Xem thẻ ({cardCount})</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CHỈNH SỬA THÔNG TIN THẺ BÀI (CRUD EDIT MODAL)
         ======================================================== */}
      {isEditProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-xl w-full max-h-[92dvh] bg-stone-900 border-2 border-amber-400/60 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="px-5 py-3.5 border-b border-white/10 bg-stone-900/95 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-amber-300">
                    Chỉnh Sửa Thông Tin Thẻ Bài
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Cập nhật chi tiết thẻ: {editingProduct.nameVi} ({editingProduct.slug})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditProductModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEditProduct} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Tên Tiếng Việt <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={editProductForm.nameVi}
                    onChange={(e) => setEditProductForm({ ...editProductForm, nameVi: e.target.value })}
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Tên Tiếng Anh <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={editProductForm.nameEn}
                    onChange={(e) => setEditProductForm({ ...editProductForm, nameEn: e.target.value })}
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Tên Tiếng Trung (Kèm Pinyin):
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Chữ Hán: 跳"
                      value={editProductForm.nameZh}
                      onChange={(e) => setEditProductForm({ ...editProductForm, nameZh: e.target.value })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                    <input
                      type="text"
                      placeholder="Pinyin: tiào"
                      value={editProductForm.pinyinZh}
                      onChange={(e) => setEditProductForm({ ...editProductForm, pinyinZh: e.target.value })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Phiên Âm Quốc Tế (IPA):
                  </label>
                  <input
                    type="text"
                    placeholder="/dʒʌmp/"
                    value={editProductForm.ipa}
                    onChange={(e) => setEditProductForm({ ...editProductForm, ipa: e.target.value })}
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Danh Mục Sản Phẩm <span className="text-rose-400">*</span>:
                  </label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.name} className="bg-stone-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Huy Hiệu (Badge):
                  </label>
                  <input
                    type="text"
                    value={editProductForm.badge}
                    onChange={(e) => setEditProductForm({ ...editProductForm, badge: e.target.value })}
                    placeholder="Mới ra mắt, Bán chạy..."
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Giá Bán Ưu Đãi (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={editProductForm.price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, price: Number(e.target.value) })}
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold font-mono focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Giá Gốc Niêm Yết (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={editProductForm.originalPrice}
                    onChange={(e) => setEditProductForm({ ...editProductForm, originalPrice: Number(e.target.value) })}
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-stone-400 font-mono focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Đường Dẫn Ảnh Thẻ (Poster URL):
                </label>
                <input
                  type="text"
                  value={editProductForm.imageUrl}
                  onChange={(e) => setEditProductForm({ ...editProductForm, imageUrl: e.target.value })}
                  placeholder="/images/cards/... hoặc URL ảnh tĩnh"
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Mô Tả Sản Phẩm:
                </label>
                <textarea
                  rows={3}
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                  placeholder="Mô tả nội dung thẻ học..."
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400 resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditProductModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white font-bold text-xs transition-colors"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSavingEditProduct}
                  className="py-2.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  {isSavingEditProduct ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang Lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Lưu Thay Đổi Thẻ Bài</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: CẬP NHẬT SẢN PHẨM RA LANDING PAGE (#products)
         ======================================================== */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-xl w-full max-h-[92dvh] sm:max-h-[86vh] bg-stone-900 border-2 border-amber-400/60 rounded-2xl sm:rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden ring-1 ring-amber-400/20">
            {/* STICKY HEADER */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 shrink-0 bg-stone-900/95 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shrink-0">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm md:text-base font-black text-amber-300 truncate">
                    Cập Nhật Thẻ Vào #products Trang Chủ
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">
                    Bắt buộc chọn danh mục để thẻ bài hiển thị đúng vị trí
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors shrink-0 ml-2"
                title="Đóng modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* FORM CONTAINER WITH FLEX LAYOUT */}
            <form onSubmit={handleSaveProductToLanding} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* SCROLLABLE BODY */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin scrollbar-thumb-stone-700">
                {/* 1. BẮT BUỘC CHỌN DANH MỤC */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>Danh Mục Sản Phẩm (Bắt buộc) *</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] sm:text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 transition-colors shrink-0"
                    >
                      <Sliders className="h-3 w-3" />
                      <span>Quản Lý Danh Mục</span>
                    </button>
                  </div>

                  <select
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-black/80 border border-amber-400/60 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-amber-300 focus:outline-hidden focus:border-amber-300 cursor-pointer"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name} className="bg-stone-900 text-white">
                        Danh mục: {cat.name} ({cat.slug})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-stone-400">
                    Thẻ bài sẽ được xuất bản đồng thời lên Trang chủ <code className="text-amber-300">#products</code> và Kho Thẻ Bài <code className="text-amber-300">/products</code>.
                  </p>
                </div>

                {/* 2. THÔNG TIN CỐT LÕI (EN & VI) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Tên tiếng Anh (EN) *:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Lion, Cat, Jump..."
                      value={productForm.nameEn}
                      onChange={(e) => setProductForm({ ...productForm, nameEn: e.target.value })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Tên tiếng Việt (VI) *:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Sư Tử Vàng, Con Mèo..."
                      value={productForm.nameVi}
                      onChange={(e) => setProductForm({ ...productForm, nameVi: e.target.value })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 font-bold"
                    />
                  </div>
                </div>

                {/* 3. GIÁ TIỀN ƯU ĐÃI & GIÁ GỐC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-stone-300">
                        Giá bán ưu đãi (VNĐ) *:
                      </label>
                      <span className="text-[10px] font-bold text-emerald-400">
                        {formatVndCurrency(productForm.price)}
                      </span>
                    </div>
                    <input
                      type="number"
                      required
                      step="1000"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-stone-300">
                        Giá gốc niêm yết:
                      </label>
                      <span className="text-[10px] text-stone-400 line-through">
                        {formatVndCurrency(productForm.originalPrice)}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={productForm.originalPrice}
                      onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-stone-300 line-through focus:outline-hidden focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                {/* 4. HUY HIỆU & SLUG AR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Huy hiệu nổi bật (Badge):
                    </label>
                    <select
                      value={productForm.badge}
                      onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Mới ra mắt">Mới ra mắt</option>
                      <option value="Bán chạy">Bán chạy</option>
                      <option value="Yêu thích nhất">Yêu thích nhất</option>
                      <option value="Hot">Hot</option>
                      <option value="Thân thiện">Thân thiện</option>
                      <option value="Combo tiết kiệm">Combo tiết kiệm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Slug AR (Trang mở 3D):
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 5. TÙY CHỌN ẢNH THẺ TỪ CANVAS */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-200">
                    <input
                      type="checkbox"
                      checked={productForm.useCompositeCardImage}
                      onChange={(e) => setProductForm({ ...productForm, useCompositeCardImage: e.target.checked })}
                      className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 h-4 w-4"
                    />
                    <span>Sử dụng ảnh thẻ thành phẩm từ Canvas (Đã gắn QR chuẩn in)</span>
                  </label>
                  <p className="text-[10px] text-stone-400 pl-6">
                    Nếu bỏ tích, hệ thống sẽ sử dụng ảnh thẻ mẫu gốc (chưa ghép QR).
                  </p>
                </div>

                {/* 6. THÔNG TIN NÂNG CAO (ACCORDION THU GỌN / MỞ RỘNG) */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/30">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                    className="w-full flex items-center justify-between p-3 bg-stone-800/40 hover:bg-stone-800/70 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>Thông Tin Nâng Cao (Tiếng Trung, IPA & Mô Tả)</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-stone-400 font-medium">
                      <span>{showAdvancedFields ? "Thu gọn" : "Mở rộng"}</span>
                      {showAdvancedFields ? (
                        <ChevronUp className="h-3.5 w-3.5 text-stone-400" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {showAdvancedFields && (
                    <div className="p-3 border-t border-white/10 space-y-3 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-300 mb-1">
                            Tên tiếng Trung (ZH) - Tùy chọn:
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: 狮子, 小猫, 跳..."
                            value={productForm.nameZh}
                            onChange={(e) => setProductForm({ ...productForm, nameZh: e.target.value })}
                            className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-300 mb-1">
                            Phiên âm IPA - Tùy chọn:
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: /ˈlaɪ.ən/, /kæt/..."
                            value={productForm.ipa}
                            onChange={(e) => setProductForm({ ...productForm, ipa: e.target.value })}
                            className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">
                          Mô tả chi tiết thẻ học:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Mô tả công dụng hoặc kiến thức trên thẻ..."
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-400 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* STICKY FOOTER ACTION BUTTONS */}
              <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-white/10 shrink-0 bg-stone-900/95 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="h-10 sm:h-11 px-4 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white font-bold text-xs sm:text-sm transition-colors"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={isPublishingProduct}
                  className="h-10 sm:h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm active:scale-95 transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="h-4 w-4 text-stone-950 shrink-0" />
                  <span>
                    {isPublishingProduct ? "Đang Xuất Bản..." : "Xác Nhận Xuất Bản Thẻ Bài"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: QUẢN LÝ DANH MỤC (THÊM / SỬA / XÓA / TÌM KIẾM)
         ======================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-lg animate-in fade-in">
          <div className="max-w-lg w-full bg-stone-900 border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl text-white shadow-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
            {/* STICKY HEADER */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 shrink-0 bg-stone-900/95 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shrink-0">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm md:text-base font-black text-amber-300 truncate">
                    Quản Lý Danh Mục Thẻ Bài
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">
                    Thêm, sửa, xóa và tìm kiếm danh mục sản phẩm
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors shrink-0 ml-2"
                title="Đóng modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin scrollbar-thumb-stone-700">
              {/* FORM THÊM DANH MỤC MỚI */}
              <form onSubmit={handleAddCategory} className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                <div className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm Danh Mục Mới</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Tên danh mục (Khủng Long, Côn Trùng...)"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <select
                      value={categoryForm.iconName}
                      onChange={(e) => setCategoryForm({ ...categoryForm, iconName: e.target.value })}
                      className="w-full bg-black/80 border border-white/20 rounded-xl px-2 py-2 text-xs text-amber-300 focus:outline-hidden focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Layers">Icon: Chung</option>
                      <option value="PawPrint">Icon: Động Vật</option>
                      <option value="Activity">Icon: Vận Động</option>
                      <option value="Car">Icon: Xe Cộ</option>
                      <option value="Apple">Icon: Hoa Quả</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-stone-950" />
                  <span>Thêm Danh Mục Ngay</span>
                </button>
              </form>

              {/* TÌM KIẾM DANH MỤC */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm danh mục..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* DANH SÁCH DANH MỤC HIỆN TẠI */}
              <div className="space-y-2">
                {categoriesList
                  .filter((c) =>
                    categorySearchQuery.trim()
                      ? c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                      : true
                  )
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2 text-xs"
                    >
                      {editingCategoryId === cat.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="flex-1 bg-black border border-amber-400 rounded-lg px-2 py-1 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCategory(cat.id, editingCategoryName)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-stone-950 font-black text-[10px]"
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryId(null)}
                            className="px-2 py-1 rounded-lg bg-white/10 text-stone-400 hover:text-white text-[10px]"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {cat.name.charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <span className="font-bold text-stone-200 block truncate">
                                {cat.name}
                              </span>
                              <span className="text-[10px] text-stone-500 font-mono">
                                slug: {cat.slug}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryId(cat.id);
                                setEditingCategoryName(cat.name);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-amber-300 transition-colors"
                              title="Chỉnh sửa danh mục"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors"
                              title="Xóa danh mục"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className="px-4 py-3 sm:px-6 sm:py-3 border-t border-white/10 shrink-0 bg-stone-900/95 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Hoàn Tất & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          POPUP THÔNG BÁO XUẤT BẢN THÀNH CÔNG VÀ LINK MỞ #products
         ======================================================== */}
      {publishedSuccessInfo && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-4 text-white shadow-2xl border-2 border-emerald-300 animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-200 shrink-0" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-100">
                  Đã Đưa Thẻ Ra Trang Chủ!
                </h4>
                <p className="text-xs text-white font-bold mt-0.5">
                  {publishedSuccessInfo.productName}
                </p>
                <span className="text-[10px] text-emerald-200 block">
                  Danh mục: {publishedSuccessInfo.categoryName}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPublishedSuccessInfo(null)}
              className="text-emerald-200 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={`/ar/${publishedSuccessInfo.slug}?ar=1`}
              target="_blank"
              className="flex-1 min-w-[120px] py-2 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs text-center flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <span>Xem Thử AR</span>
              <ExternalLink className="h-3 w-3" />
            </Link>

            <Link
              href="/#products"
              target="_blank"
              onClick={() => setPublishedSuccessInfo(null)}
              className="flex-1 min-w-[120px] py-2 px-2.5 rounded-xl bg-white text-stone-950 font-black text-xs text-center flex items-center justify-center gap-1 shadow-md hover:bg-emerald-50 active:scale-95 transition-all"
            >
              <span>Xem Tại #products</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            <Link
              href={`/products?category=${publishedSuccessInfo.categorySlug || ""}`}
              target="_blank"
              onClick={() => setPublishedSuccessInfo(null)}
              className="flex-1 min-w-[120px] py-2 px-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs text-center flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all border border-emerald-400/50"
            >
              <span>Mở Kho Thẻ (/products)</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>

            <button
              type="button"
              onClick={() => setPublishedSuccessInfo(null)}
              className="py-2 px-2 rounded-xl bg-black/20 hover:bg-black/30 text-white text-xs font-bold transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TOAST NOTIFICATION CONTAINER (Góc phải trên màn hình)
         ======================================================== */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-top-3 ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-400/60 text-emerald-100"
                : toast.type === "error"
                ? "bg-rose-950/90 border-rose-400/60 text-rose-100"
                : toast.type === "warning"
                ? "bg-amber-950/90 border-amber-400/60 text-amber-100"
                : "bg-stone-900/90 border-stone-600 text-stone-100"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === "error" && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === "warning" && <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === "info" && <HelpCircle className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />}

            <div className="text-xs font-semibold leading-relaxed flex-1">
              {toast.message}
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white p-0.5 rounded-md transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ========================================================
          MODAL XÁC NHẬN TÙY BIẾN (Custom Confirm Dialog)
         ======================================================== */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-stone-900 border border-white/20 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black ${
                  confirmDialog.danger
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-black uppercase text-white">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white font-bold text-xs transition-colors"
              >
                {confirmDialog.cancelText || "Hủy"}
              </button>

              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`py-2 px-4 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 ${
                  confirmDialog.danger
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-amber-400 hover:bg-amber-300 text-stone-950"
                }`}
              >
                {confirmDialog.confirmText || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
