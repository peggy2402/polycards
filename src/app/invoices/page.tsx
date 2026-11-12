"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Receipt,
  Printer,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  Layers,
  Send,
  CreditCard,
  Banknote,
  User,
  Phone,
  MapPin,
  Calendar,
  X,
  ExternalLink,
  Tag,
  KeyRound,
  Users,
  ShoppingCart,
  ShoppingBag,
  PackageCheck,
  Trash2,
  Minus,
  ArrowLeft,
  ArrowRight,
  Eye,
  FileText,
  ChevronRight,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { formatVndCurrency } from "@/lib/formatters";
import { getMergedProducts, getProductCategories } from "@/lib/products-store";
import { Animal, ProductCategory, DbComboRule, OrderStatus, DeliveryMethod } from "@/types/animal";
import { evaluateBestCombo, DEFAULT_COMBO_RULES } from "@/lib/combo-engine";
import { normalizePhoneNumber } from "@/lib/pricing";
import {
  getStoredPackCodes,
  fetchPackCodesFromApi,
  PackCodeItem,
} from "@/lib/pack-codes-store";
import {
  CatalogPickerModal,
  InvoiceCartItem,
} from "@/components/invoices/catalog-picker-modal";

export interface InvoiceLineItem {
  id: string;
  name: string;
  packCode: string;
  codeParent?: string;
  categorySlug: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleInvoice {
  id: string;
  code: string;
  codeParent?: string; // Mã Cha (Master code cho combo nhiều bộ / thẻ)
  childCodes?: string[]; // Danh sách các Mã Con thuộc Mã Cha này
  customerType: "TRUCTIEP" | "ONLINE";
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  codeType?: "SINGLE" | "MULTI" | "PACK";
  unlockedSlug?: string;
  unlockedSlugs?: string[];
  items: InvoiceLineItem[];
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  creditAmount: number; // Phát sinh Có: Số tiền khách cần phải trả
  debitAmount: number; // Phát sinh Nợ: Số tiền khách đã thanh toán
  balanceAmount?: number; // Còn lại: debitAmount - creditAmount
  remainingAmount: number;
  paymentMethod: "TIEN_MAT" | "CHUYEN_KHOAN";
  packTitle: string;
  packCode: string;
  allowedCategorySlug: string;
  allowedCategorySlugs?: string[];
  directUrl: string;
  note?: string;
  orderStatus?: OrderStatus;
  deliveryMethod?: DeliveryMethod;
  codAmount?: number;
  comboName?: string;
  comboDiscount?: number;
  source?: "ONLINE" | "POS";
  createdAt: string;
  status: "PAID" | "PARTIAL";
}

export default function InvoicesPage() {
  // ========================================================
  // 1. NAVIGATION & VIEW MODES: "LIST" | "CREATE" | "PREVIEW"
  // ========================================================
  const [activeView, setActiveView] = useState<"LIST" | "CREATE" | "PREVIEW">("LIST");
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);

  // Invoices Data & Filters
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchInvoiceQuery, setSearchInvoiceQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PAID" | "PARTIAL" | "TRUCTIEP" | "ONLINE">("ALL");

  // Hóa đơn đang chọn để xem / in
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [selectedInvoiceQrUrl, setSelectedInvoiceQrUrl] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedZalo, setCopiedZalo] = useState<boolean>(false);

  // ========================================================
  // 2. FORM STATE CHO BƯỚC LẬP PHIẾU (CREATE WIZARD)
  // ========================================================
  // Bước 1: Khách hàng
  const [customerType, setCustomerType] = useState<"TRUCTIEP" | "ONLINE">("TRUCTIEP");
  const [customerName, setCustomerName] = useState<string>("Khách Mua Trực Tiếp Tại Quầy");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>(() => `KH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isExistingCustomer, setIsExistingCustomer] = useState<boolean>(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("DA_NHAN");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("TRUC_TIEP");
  const [codAmount, setCodAmount] = useState<number>(0);

  // Bước 2: Giỏ hàng hóa (Khởi tạo rỗng, người dùng chọn chuẩn từ kho)
  const [cartItems, setCartItems] = useState<InvoiceCartItem[]>([]);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);

  // Dữ liệu kho hàng
  const [productsCatalog, setProductsCatalog] = useState<Animal[]>([]);
  const [categoriesList, setCategoriesList] = useState<ProductCategory[]>([]);
  const [storedPackCodes, setStoredPackCodes] = useState<PackCodeItem[]>([]);
  const [selectedExistingPackCode, setSelectedExistingPackCode] = useState<string>("POLY30-DONGVAT-ENVI");
  const [packCodeMode, setPackCodeMode] = useState<"AUTO" | "EXISTING">("EXISTING");
  const [comboRules, setComboRules] = useState<DbComboRule[]>(DEFAULT_COMBO_RULES);

  // Bước 3: Hạch toán & Thanh toán
  const [vatRate, setVatRate] = useState<number>(0);
  const [debitAmount, setDebitAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"TIEN_MAT" | "CHUYEN_KHOAN">("TIEN_MAT");
  const [note, setNote] = useState<string>("");

  // Toast
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: string }>>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Tải danh mục sản phẩm & mã bộ trong kho
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const local = getMergedProducts();
        if (local && local.length > 0) {
          setProductsCatalog(local);
        }
        const res = await fetch("/api/products");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProductsCatalog(json.data);
        }
      } catch {}
    };

    const loadCategories = async () => {
      try {
        const local = getProductCategories();
        if (local && local.length > 0) {
          setCategoriesList(local);
        }
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setCategoriesList(json.data);
          }
        }
      } catch {}
    };

    loadCatalog();
    loadCategories();
    setStoredPackCodes(getStoredPackCodes());
    fetchPackCodesFromApi().then((data) => {
      if (data && data.length > 0) {
        setStoredPackCodes(data);
      }
    });
  }, []);

  // Tải danh sách quy tắc combo
  useEffect(() => {
    fetch("/api/combos")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setComboRules(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Tự động nhận diện khách hàng cũ khi nhập SĐT
  useEffect(() => {
    const cleanPhone = normalizePhoneNumber(customerPhone);
    if (!cleanPhone || cleanPhone.length < 9) {
      setIsExistingCustomer(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers/search?phone=${encodeURIComponent(cleanPhone)}`);
        const data = await res.json();
        if (data.success && data.customer) {
          const c = data.customer;
          setIsExistingCustomer(true);
          setCustomerId(c.id || c.code || `KH-${cleanPhone.slice(-4)}`);
          if (c.name && (!customerName || customerName.includes("Khách Mua Trực Tiếp"))) {
            setCustomerName(c.name);
          }
          if (c.address && !customerAddress) {
            setCustomerAddress(c.address);
          }
          showToast(`Nhận diện khách quen: ${c.name} (${c.id})`, "info");
        } else {
          setIsExistingCustomer(false);
        }
      } catch {}
    }, 400);

    return () => clearTimeout(timer);
  }, [customerPhone, customerName, customerAddress, showToast]);

  // Tải danh sách hóa đơn từ API
  const loadInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setInvoices(json.data);
        if (json.data.length > 0 && !selectedInvoice) {
          setSelectedInvoice(json.data[0]);
        }
      }
    } catch (err) {
      console.warn("Lỗi tải hóa đơn:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedInvoice]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Sinh QR Code cho hóa đơn đang được chọn xem
  useEffect(() => {
    if (selectedInvoice && selectedInvoice.directUrl) {
      QRCode.toDataURL(selectedInvoice.directUrl, {
        width: 240,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then((url) => setSelectedInvoiceQrUrl(url))
        .catch(() => {});
    }
  }, [selectedInvoice]);

  // ========================================================
  // 3. TÍNH TOÁN GIỎ HÀNG & HẠCH TOÁN POS
  // ========================================================
  const handleAddToCart = (item: Omit<InvoiceCartItem, "quantity">) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((it) => it.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    showToast(`Đã thêm vào giỏ: ${item.name}`, "success");
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((it) => {
          if (it.id === id) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as InvoiceCartItem[];
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Tính số lượng
  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.quantity, 0);
  }, [cartItems]);

  const totalPacksCount = useMemo(() => {
    return cartItems
      .filter((it) => it.type === "PACK")
      .reduce((acc, it) => acc + it.quantity, 0);
  }, [cartItems]);

  const totalSinglesCount = useMemo(() => {
    return cartItems
      .filter((it) => it.type === "SINGLE")
      .reduce((acc, it) => acc + it.quantity, 0);
  }, [cartItems]);

  // Đánh giá khuyến mãi Combo thông minh
  const bestComboResult = useMemo(() => {
    const evalItems = cartItems.map((it) => ({
      id: it.id,
      packCode: it.packCode || "",
      categorySlug: it.categorySlug,
      quantity: it.quantity,
      salePrice: it.unitPrice,
      originalPrice: it.originalPrice || it.unitPrice,
    }));
    return evaluateBestCombo(evalItems, comboRules);
  }, [cartItems, comboRules]);

  // Tổng tiền trước thuế (Subtotal)
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  }, [cartItems]);

  // Số tiền giảm giá theo Combo
  const comboDiscount = useMemo(() => {
    return bestComboResult.discountAmount || 0;
  }, [bestComboResult]);

  // Tổng tiền sau giảm giá combo
  const amountAfterCombo = useMemo(() => {
    return Math.max(0, subtotal - comboDiscount);
  }, [subtotal, comboDiscount]);

  // Tiền thuế VAT
  const vatAmount = useMemo(() => {
    if (!vatRate || vatRate <= 0) return 0;
    return Math.round((amountAfterCombo * vatRate) / 100);
  }, [amountAfterCombo, vatRate]);

  // Phát sinh CÓ (Credit Amount): Số tiền khách cần phải trả
  const creditAmount = useMemo(() => {
    return amountAfterCombo + vatAmount;
  }, [amountAfterCombo, vatAmount]);

  // Tự động gán debitAmount theo creditAmount khi đổi sản phẩm
  useEffect(() => {
    setDebitAmount(creditAmount);
  }, [creditAmount]);

  // Còn lại: Nợ - Có
  const balance = debitAmount - creditAmount;

  // Toggle đối tượng khách hàng
  const handleToggleCustomerType = (type: "TRUCTIEP" | "ONLINE") => {
    setCustomerType(type);
    if (type === "TRUCTIEP" && customerName.includes("Khách Đặt Hàng")) {
      setCustomerName("Khách Mua Trực Tiếp Tại Quầy");
    } else if (type === "ONLINE" && customerName.includes("Khách Mua Trực Tiếp")) {
      setCustomerName("Khách Đặt Hàng Online");
    }
  };

  // ========================================================
  // 4. BẮT ĐẦU TẠO PHIẾU & CHUYỂN BƯỚC WIZARD
  // ========================================================
  const handleStartCreate = () => {
    setCartItems([]);
    setCustomerName("Khách Mua Trực Tiếp Tại Quầy");
    setCustomerType("TRUCTIEP");
    setCustomerId(`KH-${Math.floor(1000 + Math.random() * 9000)}`);
    setCustomerPhone("");
    setCustomerAddress("");
    setNote("");
    setCreateStep(1);
    setActiveView("CREATE");
  };

  const handleNextToStep2 = () => {
    if (!customerName.trim()) {
      showToast("Vui lòng nhập tên khách hàng.", "warning");
      return;
    }
    setCreateStep(2);
  };

  const handleNextToStep3 = () => {
    if (cartItems.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 sản phẩm từ kho.", "warning");
      return;
    }
    setCreateStep(3);
  };

  // Xem chi tiết hóa đơn
  const handleViewInvoice = (inv: SaleInvoice) => {
    setSelectedInvoice(inv);
    setActiveView("PREVIEW");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // In hóa đơn trực tiếp
  const handlePrintInvoice = () => {
    window.print();
  };

  // Sao chép tin nhắn Zalo gửi khách
  const handleCopyZaloMessage = (inv: SaleInvoice) => {
    const childCodesText =
      inv.childCodes && inv.childCodes.length > 0
        ? `- Danh Sách Mã Con (in trên từng bộ/thẻ): ${inv.childCodes.join(", ")}\n`
        : "";

    const msg = `Kính chào quý khách ${inv.customerName},
Poly Cards trân trọng gửi quý khách Hóa Đơn Bán Hàng & Mã Kích Hoạt WebAR:
- Số Hóa Đơn: ${inv.code}
- Khách hàng: ${inv.customerName} (${inv.customerId || "KH"})
- Sản phẩm: ${inv.packTitle}
- Tạm tính: ${formatVndCurrency(inv.subtotal || inv.creditAmount)}
${inv.vatRate ? `- Thuế VAT (${inv.vatRate}%): ${formatVndCurrency(inv.vatAmount || 0)}\n` : ""}- Tổng thanh toán (Phát sinh Có): ${formatVndCurrency(inv.creditAmount)}
- Đã thanh toán (Phát sinh Nợ): ${formatVndCurrency(inv.debitAmount)}
${inv.remainingAmount > 0 ? `- Còn thiếu: ${formatVndCurrency(inv.remainingAmount)}\n` : ""}
- Mã Bản Quyền Kích Hoạt WebAR: ${inv.packCode}
${childCodesText}
- Đường link mở quét 3D ngay không cần cài App:
${inv.directUrl}

Cảm ơn quý khách đã tin dùng Poly Cards! Chúc bé học tập vui vẻ!`;

    navigator.clipboard.writeText(msg);
    setCopiedZalo(true);
    showToast("Đã sao chép tin nhắn Zalo gửi khách hàng!", "success");
    setTimeout(() => setCopiedZalo(false), 2000);
  };

  // Tạo phiếu hóa đơn & sinh mã bản quyền chuẩn hóa
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast("Vui lòng nhập tên khách hàng.", "warning");
      return;
    }

    if (cartItems.length === 0) {
      showToast("Vui lòng thêm ít nhất 1 sản phẩm vào giỏ hàng.", "warning");
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoicePrefix = customerType === "TRUCTIEP" ? "HD-DIR" : "HD-ONL";
    const invoiceCode = `${invoicePrefix}-${Date.now().toString().slice(-4)}-${randomNum}`;
    const cleanCustCode = customerId.trim() || `KH${randomNum}`;

    const purchasedPacks = cartItems.filter((i) => i.type === "PACK");
    const purchasedSingles = cartItems.filter((i) => i.type === "SINGLE");
    const allowedCategorySlugs = Array.from(new Set(purchasedPacks.map((i) => i.categorySlug)));
    const unlockedSlugs = purchasedSingles.map((i) => i.slug).filter(Boolean) as string[];

    let licenseCode = "";
    let packTitle = "";
    let codeType: "SINGLE" | "MULTI" | "PACK" = "PACK";
    let allowedCategorySlug = "";

    if (purchasedPacks.length > 0 && purchasedSingles.length === 0) {
      codeType = "PACK";
      if (purchasedPacks.length === 1 && purchasedPacks[0].quantity === 1) {
        const singlePack = purchasedPacks[0];
        const catUpper = (singlePack.categorySlug || "THE").toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (packCodeMode === "AUTO") {
          licenseCode = `PACK-${catUpper}-${cleanCustCode}-${invoiceCode}`;
        } else {
          licenseCode = selectedExistingPackCode.trim() || singlePack.packCode || `POLY30-${catUpper}`;
        }
        packTitle = singlePack.name;
        allowedCategorySlug = singlePack.categorySlug;
      } else {
        const sumPacks = purchasedPacks.reduce((a, b) => a + b.quantity, 0);
        const catCodes = Array.from(
          new Set(purchasedPacks.map((p) => (p.categorySlug || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4)))
        ).join("-");
        licenseCode = `PACK-COMBO-${sumPacks}BO-${catCodes || "ALL"}-${cleanCustCode}-${invoiceCode}`;
        packTitle = `Combo ${sumPacks} Bộ Thẻ (${purchasedPacks.map((p) => `${p.quantity} ${p.categoryName || p.name}`).join(", ")})`;
        allowedCategorySlug = purchasedPacks[0]?.categorySlug || "dong-vat";
      }
    } else if (purchasedPacks.length === 0 && purchasedSingles.length > 0) {
      if (purchasedSingles.length === 1 && purchasedSingles[0].quantity === 1) {
        codeType = "SINGLE";
        const single = purchasedSingles[0];
        const catSlug = (single.categorySlug || "THE").toUpperCase().replace(/[^A-Z0-9]/g, "");
        const cardSlug = (single.slug || "CARD").toUpperCase().replace(/[^A-Z0-9]/g, "");
        licenseCode = `SINGLE-${cardSlug}-${catSlug}-${cleanCustCode}-${invoiceCode}`;
        packTitle = `Thẻ Lẻ: ${single.name}`;
        allowedCategorySlug = single.categorySlug;
      } else {
        codeType = "MULTI";
        const sumCards = purchasedSingles.reduce((a, b) => a + b.quantity, 0);
        licenseCode = `MULTI-${sumCards}THE-CUSTOM-${cleanCustCode}-${invoiceCode}`;
        packTitle = `Combo ${sumCards} Thẻ Lẻ (${purchasedSingles.map((s) => s.name).slice(0, 3).join(", ")}${purchasedSingles.length > 3 ? "..." : ""})`;
        allowedCategorySlug = purchasedSingles[0]?.categorySlug || "dong-vat";
      }
    } else {
      codeType = "PACK";
      const sumPacks = purchasedPacks.reduce((a, b) => a + b.quantity, 0);
      const sumCards = purchasedSingles.reduce((a, b) => a + b.quantity, 0);
      licenseCode = `COMBO-${sumPacks}BO-${sumCards}THE-${cleanCustCode}-${invoiceCode}`;
      packTitle = `Combo Đặc Biệt: ${sumPacks} Bộ + ${sumCards} Thẻ Lẻ`;
      allowedCategorySlug = purchasedPacks[0]?.categorySlug || purchasedSingles[0]?.categorySlug || "dong-vat";
    }

    // Chọn thẻ mẫu để mở WebAR
    const sampleCard = productsCatalog.find(
      (p) => allowedCategorySlugs.includes(p.categorySlug || "") || (unlockedSlugs.length > 0 && unlockedSlugs.includes(p.slug))
    ) || productsCatalog[0];
    const sampleSlug = sampleCard?.slug || "jump";

    // 1. Mã Cha (Master Code / Parent Code)
    const codeParent = licenseCode;

    // 2. Sinh Mã Con (Child Code) cho từng món hàng trong hóa đơn
    const childCodes: string[] = [];
    const lineItems: InvoiceLineItem[] = cartItems.map((item, idx) => {
      let childCode = "";
      if (item.type === "PACK") {
        const catSlugUpper = (item.categorySlug || "THE").toUpperCase().replace(/[^A-Z0-9]/g, "");
        childCode = item.packCode || `POLY30-${catSlugUpper}${cartItems.length > 1 ? `-${idx + 1}` : ""}`;
      } else {
        const cardSlug = (item.slug || "CARD").toUpperCase().replace(/[^A-Z0-9]/g, "");
        childCode = `SINGLE-${cardSlug}-${cleanCustCode}`;
      }
      childCodes.push(childCode);

      return {
        id: item.id,
        name: item.name,
        packCode: childCode,
        codeParent,
        categorySlug: item.categorySlug,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      };
    });

    const firstChildCode = childCodes[0] || licenseCode;
    const directUrl = `https://polycards.vn/ar/${sampleSlug}?ar=1&code=${encodeURIComponent(
      firstChildCode
    )}&codeParent=${encodeURIComponent(codeParent)}`;

    const newInvoice: SaleInvoice = {
      id: `INV-${Date.now()}`,
      code: invoiceCode,
      codeParent,
      childCodes,
      customerType,
      customerId: cleanCustCode,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      codeType,
      unlockedSlug: unlockedSlugs.length === 1 ? unlockedSlugs[0] : undefined,
      unlockedSlugs: unlockedSlugs.length > 0 ? unlockedSlugs : undefined,
      items: lineItems,
      subtotal,
      vatRate,
      vatAmount,
      creditAmount,
      debitAmount,
      balanceAmount: balance,
      remainingAmount: creditAmount - debitAmount,
      paymentMethod,
      orderStatus,
      deliveryMethod,
      codAmount: deliveryMethod === "CPN_COD" ? (codAmount || creditAmount) : 0,
      comboName: bestComboResult.rule?.name || undefined,
      comboDiscount,
      source: customerType === "ONLINE" ? "ONLINE" : "POS",
      packTitle,
      packCode: licenseCode,
      allowedCategorySlug: allowedCategorySlug || "dong-vat",
      allowedCategorySlugs: allowedCategorySlugs.length > 0 ? allowedCategorySlugs : [allowedCategorySlug || "dong-vat"],
      directUrl,
      note: note.trim() || (customerType === "TRUCTIEP" ? "Khách mua trực tiếp tại quầy" : "Đơn hàng online"),
      createdAt: new Date().toLocaleString("vi-VN"),
      status: debitAmount >= creditAmount ? "PAID" : "PARTIAL",
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoice),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã lập hóa đơn ${invoiceCode} và cấp mã ${licenseCode} thành công!`, "success");
        setInvoices((prev) => [newInvoice, ...prev]);
        setSelectedInvoice(newInvoice);
        setNote("");
        // Tự động chuyển qua màn hình xem mẫu in hóa đơn riêng biệt
        setActiveView("PREVIEW");
      } else {
        showToast(data.message || "Không thể lưu hóa đơn.", "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      showToast(`Lỗi tạo hóa đơn: ${msg}`, "error");
    }
  };

  // ========================================================
  // 5. DANH SÁCH HÓA ĐƠN ĐƯỢC LỌC & THỐNG KÊ KPI
  // ========================================================
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Lọc trạng thái
      if (filterStatus === "PAID" && inv.status !== "PAID") return false;
      if (filterStatus === "PARTIAL" && inv.status !== "PARTIAL") return false;
      if (filterStatus === "TRUCTIEP" && inv.customerType !== "TRUCTIEP") return false;
      if (filterStatus === "ONLINE" && inv.customerType !== "ONLINE") return false;

      // Lọc từ khóa tìm kiếm
      if (searchInvoiceQuery.trim()) {
        const q = searchInvoiceQuery.toLowerCase().trim();
        const matchCode = (inv.code || "").toLowerCase().includes(q);
        const matchName = (inv.customerName || "").toLowerCase().includes(q);
        const matchPhone = (inv.customerPhone || "").toLowerCase().includes(q);
        const matchPack = (inv.packTitle || "").toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone && !matchPack) return false;
      }
      return true;
    });
  }, [invoices, filterStatus, searchInvoiceQuery]);

  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const totalCredit = invoices.reduce((s, i) => s + (i.creditAmount || 0), 0);
    const totalDebit = invoices.reduce((s, i) => s + (i.debitAmount || 0), 0);
    const totalRemain = invoices.reduce((s, i) => s + Math.max(0, (i.creditAmount || 0) - (i.debitAmount || 0)), 0);
    return { totalCount, totalCredit, totalDebit, totalRemain };
  }, [invoices]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-12 sm:pb-8">
      {/* ========================================================
          HEADER TOP BAR: BRANDING, TITLE & VIEW ACTIONS
         ======================================================== */}
      <header className="border-b border-amber-500/20 bg-stone-900/80 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo & Tiêu đề */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group transition-transform active:scale-95"
            >
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-stone-950 shadow-md shadow-amber-500/20">
                PC
              </div>
              <div>
                <span className="text-sm font-black tracking-wider uppercase text-white block leading-none">
                  Poly Cards
                </span>
                <span className="text-[10px] text-amber-400 font-bold tracking-widest block uppercase mt-0.5">
                  POS &bull; Bán Hàng
                </span>
              </div>
            </Link>

            <span className="h-5 w-px bg-white/10 hidden sm:block" />

            {/* Breadcrumb / Screen Title */}
            <div className="hidden sm:block">
              <h1 className="text-xs font-black uppercase text-amber-300">
                {activeView === "LIST" && "Phân Hệ Hóa Đơn Bán Hàng (POS)"}
                {activeView === "CREATE" && "Lập Phiếu Hóa Đơn Bán Hàng"}
                {activeView === "PREVIEW" && "Form Mẫu In Hóa Đơn"}
              </h1>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-2">
            {activeView === "LIST" && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="py-2 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 transition-all shrink-0 min-h-[38px]"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo Phiếu</span>
              </button>
            )}

            {activeView !== "LIST" && (
              <button
                type="button"
                onClick={() => setActiveView("LIST")}
                className="py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/10 shrink-0 min-h-[38px]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Danh Sách</span>
              </button>
            )}

            <Link
              href="/tools?tab=licenses"
              className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white font-bold text-xs hidden md:flex items-center gap-1.5 transition-colors border border-white/10 min-h-[38px]"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
              <span>Mã Thẻ/Bộ</span>
            </Link>

            <button
              type="button"
              onClick={loadInvoices}
              className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 font-bold text-xs flex items-center gap-1 border border-white/10 transition-colors shrink-0 min-h-[38px]"
              title="Đồng bộ hóa đơn"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          VIEW 1: DANH SÁCH HÓA ĐƠN BÁN HÀNG (POS LIST)
         ======================================================== */}
      {activeView === "LIST" && (
        <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-5 animate-in fade-in duration-200">
          {/* Header & Thống Kê Nhanh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-400" />
                <span>Phân Hệ Hóa Đơn Bán Hàng (POS)</span>
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                Theo dõi toàn bộ đơn hàng bán trực tiếp tại quầy &amp; giao online, in hóa đơn chuẩn bán lẻ
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartCreate}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo Phiếu Hóa Đơn Mới</span>
            </button>
          </div>

          {/* 4 Thẻ Thống Kê Nhanh (KPI Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-stone-400 block">Tổng Hóa Đơn</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">{stats.totalCount}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-amber-400/30 space-y-1">
              <span className="text-[11px] font-bold text-amber-300 block">Tổng Phát Sinh Có</span>
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                {formatVndCurrency(stats.totalCredit)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-emerald-400/30 space-y-1">
              <span className="text-[11px] font-bold text-emerald-300 block">Thực Thu (Đã Trả)</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {formatVndCurrency(stats.totalDebit)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-rose-400/30 space-y-1">
              <span className="text-[11px] font-bold text-rose-300 block">Còn Thiếu / Công Nợ</span>
              <span className="text-base sm:text-lg font-black text-rose-400 font-mono">
                {formatVndCurrency(stats.totalRemain)}
              </span>
            </div>
          </div>

          {/* Thanh Tìm Kiếm & Bộ Lọc Nhanh */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Ô Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchInvoiceQuery}
                onChange={(e) => setSearchInvoiceQuery(e.target.value)}
                placeholder="Tìm mã hóa đơn, tên khách, số điện thoại..."
                className="w-full bg-stone-900/90 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
              />
              {searchInvoiceQuery && (
                <button
                  type="button"
                  onClick={() => setSearchInvoiceQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs font-bold"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {[
                { id: "ALL", label: `Tất cả (${invoices.length})` },
                { id: "PAID", label: "Đã TT" },
                { id: "PARTIAL", label: "Còn thiếu" },
                { id: "TRUCTIEP", label: "Tại quầy" },
                { id: "ONLINE", label: "Online" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id as typeof filterStatus)}
                  className={`py-1.5 px-3 rounded-xl font-bold shrink-0 transition-all ${
                    filterStatus === tab.id
                      ? "bg-amber-400 text-stone-950 font-black shadow-sm"
                      : "bg-stone-900 text-stone-300 border border-white/10 hover:bg-stone-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh Sách Hóa Đơn (Responsive Cards) */}
          {filteredInvoices.length === 0 ? (
            <div className="rounded-3xl bg-stone-900/50 border border-white/10 p-12 text-center text-stone-500 space-y-3">
              <Receipt className="h-12 w-12 text-stone-700 mx-auto" />
              <p className="text-sm font-bold text-stone-400">Không tìm thấy hóa đơn nào phù hợp.</p>
              <button
                type="button"
                onClick={handleStartCreate}
                className="py-2 px-4 rounded-xl bg-amber-500 text-stone-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Lập Phiếu Hóa Đơn Mới</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === "PAID" || (inv.debitAmount >= inv.creditAmount);
                const remain = Math.max(0, (inv.creditAmount || 0) - (inv.debitAmount || 0));

                return (
                  <div
                    key={inv.id || inv.code}
                    className="p-4 rounded-2xl bg-stone-900/90 border border-white/10 hover:border-amber-400/50 transition-all space-y-3 shadow-lg flex flex-col justify-between group"
                  >
                    {/* Top Row: Code + Date + Status */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black text-amber-400">
                          {inv.code}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isPaid
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {isPaid ? "Đã Thanh Toán" : "Còn Thiếu"}
                        </span>
                      </div>

                      {/* Khách hàng */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-white truncate">
                            {inv.customerName}
                          </h4>
                          {inv.customerPhone && (
                            <span className="text-[11px] text-stone-400 font-mono block">
                              {inv.customerPhone}
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                            inv.customerType === "TRUCTIEP"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-sky-500/15 text-sky-300"
                          }`}
                        >
                          {inv.customerType === "TRUCTIEP" ? "Tại Quầy" : "Online"}
                        </span>
                      </div>

                      {/* Tên sản phẩm */}
                      <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed pt-1">
                        {inv.packTitle}
                      </p>
                    </div>

                    {/* Bottom: Tiền & Nút Thao Tác */}
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-stone-400 block">Tổng tiền</span>
                          <span className="font-mono font-black text-amber-300">
                            {formatVndCurrency(inv.creditAmount)}
                          </span>
                        </div>

                        {remain > 0 ? (
                          <div className="text-right">
                            <span className="text-[10px] text-rose-400 block">Còn thiếu</span>
                            <span className="font-mono font-black text-rose-400">
                              {formatVndCurrency(remain)}
                            </span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-400 block">Hình thức</span>
                            <span className="font-bold text-stone-300 text-[11px]">
                              {inv.paymentMethod === "TIEN_MAT" ? "Tiền mặt" : "Chuyển khoản"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewInvoice(inv)}
                          className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Xem Phiếu In</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyZaloMessage(inv)}
                          className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                        >
                          <Copy className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Chép Zalo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* ========================================================
          VIEW 2: LẬP PHIẾU HÓA ĐƠN BÁN HÀNG (STEPPER WIZARD)
         ======================================================== */}
      {activeView === "CREATE" && (
        <main className="max-w-3xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-5 animate-in slide-in-from-right-4 duration-200">
          {/* Header & Back Button */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => setActiveView("LIST")}
              className="text-xs font-bold text-stone-400 hover:text-white flex items-center gap-1.5 transition-colors py-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay Lại Danh Sách</span>
            </button>

            <span className="text-xs font-mono font-bold text-amber-400">
              Bước {createStep} / 3
            </span>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { step: 1, title: "1. Khách Hàng" },
              { step: 2, title: "2. Chọn Hàng" },
              { step: 3, title: "3. Thanh Toán" },
            ].map((s) => (
              <div
                key={s.step}
                onClick={() => {
                  if (s.step < createStep) setCreateStep(s.step as typeof createStep);
                }}
                className={`py-2 px-3 rounded-xl text-center border text-xs font-black transition-all cursor-pointer ${
                  createStep === s.step
                    ? "bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20"
                    : s.step < createStep
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                    : "bg-stone-900 text-stone-500 border-white/10"
                }`}
              >
                {s.title}
              </div>
            ))}
          </div>

          {/* Form Container */}
          <div className="rounded-3xl bg-stone-900/90 border border-amber-400/40 p-5 sm:p-6 shadow-2xl space-y-5">
            <form onSubmit={handleCreateInvoice} className="space-y-5">
              {/* ==============================================
                  BƯỚC 1: KHÁCH HÀNG & GIAO NHẬN
                 ============================================== */}
              {createStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-white/10 pb-3">
                    <h3 className="text-sm font-black uppercase text-amber-300 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Bước 1: Đối Tượng Khách Hàng</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Chọn kênh bán và thông tin người mua để in lên hóa đơn
                    </p>
                  </div>

                  {/* Kênh bán: Tại quầy vs Online */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCustomerType("TRUCTIEP")}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border min-h-[44px] ${
                        customerType === "TRUCTIEP"
                          ? "bg-amber-500 text-stone-950 font-black border-amber-400 shadow-md shadow-amber-500/20"
                          : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span>Khách Trực Tiếp Tại Quầy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleCustomerType("ONLINE")}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border min-h-[44px] ${
                        customerType === "ONLINE"
                          ? "bg-sky-500 text-white font-black border-sky-400 shadow-md shadow-sky-500/20"
                          : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                      }`}
                    >
                      <Send className="h-4 w-4" />
                      <span>Khách Đặt Hàng Online</span>
                    </button>
                  </div>

                  {/* Tên & Mã KH */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Tên khách hàng *:
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ví dụ: Chị Mai, Anh Tuấn..."
                        className="w-full bg-black/70 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400 min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Mã KH:
                      </label>
                      <input
                        type="text"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        className="w-full bg-black/70 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-amber-300 font-mono font-bold focus:outline-hidden focus:border-amber-400 min-h-[44px]"
                      />
                    </div>
                  </div>

                  {/* SĐT & Địa chỉ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Số điện thoại / Zalo:
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0912..."
                        className="w-full bg-black/70 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-stone-600 focus:outline-hidden focus:border-amber-400 min-h-[44px]"
                      />
                      {isExistingCustomer && (
                        <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-flex items-center gap-1">
                          <Check className="h-3 w-3" /> Khách hàng đã lưu trong hệ thống
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Địa chỉ giao hàng:
                      </label>
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Số nhà, đường, quận/huyện..."
                        className="w-full bg-black/70 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400 min-h-[44px]"
                      />
                    </div>
                  </div>

                  {/* Nút Điều Hướng Bước 1 -> 2 */}
                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextToStep2}
                      className="py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all min-h-[44px]"
                    >
                      <span>Tiếp Tục: Chọn Hàng Hóa (Bước 2)</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ==============================================
                  BƯỚC 2: CHỌN HÀNG HÓA TỪ KHO
                 ============================================== */}
              {createStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase text-amber-300 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Bước 2: Chọn Hàng Hóa &amp; Bộ Thẻ AR</span>
                      </h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Mở kho chọn bộ thẻ bản quyền hoặc thẻ lẻ theo danh mục
                      </p>
                    </div>

                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {totalPacksCount} bộ &bull; {totalSinglesCount} thẻ lẻ
                    </span>
                  </div>

                  {/* NÚT MỞ KHO HÀNG HÓA DUY NHẤT (ĐÃ LOẠI BỎ CÁC BUTTON RÁC) */}
                  <button
                    type="button"
                    onClick={() => setIsCatalogModalOpen(true)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border-2 border-amber-400/60 text-amber-200 text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 shadow-md shadow-amber-500/10 transition-all active:scale-98 min-h-[48px]"
                  >
                    <ShoppingCart className="h-5 w-5 text-amber-400" />
                    <span>Mở Kho Hàng Hóa Chọn Bộ &amp; Thẻ Lẻ (Tìm kiếm &amp; Thêm)</span>
                  </button>

                  {/* Danh sách giỏ hàng */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                      <span>Các sản phẩm đã chọn ({cartItems.length} món):</span>
                      {cartItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCartItems([])}
                          className="text-[11px] text-rose-400 hover:underline"
                        >
                          Xóa tất cả
                        </button>
                      )}
                    </div>

                    {cartItems.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-black/40 border border-dashed border-white/15 text-center text-stone-500 space-y-3">
                        <ShoppingBag className="h-10 w-10 mx-auto text-stone-600" />
                        <p className="text-xs sm:text-sm">Chưa có sản phẩm nào trong giỏ hàng.</p>
                        <button
                          type="button"
                          onClick={() => setIsCatalogModalOpen(true)}
                          className="py-2 px-4 rounded-xl bg-amber-500 text-stone-950 font-black text-xs inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Mở kho chọn bộ thẻ</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl bg-black/80 border border-white/10 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                    item.type === "PACK"
                                      ? "bg-amber-500/20 text-amber-300"
                                      : "bg-purple-500/20 text-purple-300"
                                  }`}
                                >
                                  {item.type === "PACK" ? "BỘ THẺ" : "THẺ LẺ"}
                                </span>
                                <span className="text-xs font-bold text-white truncate">
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-[11px] text-amber-400 font-mono font-bold block mt-0.5">
                                {formatVndCurrency(item.unitPrice)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center bg-stone-900 border border-white/20 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQuantity(item.id, -1)}
                                  className="h-7 w-7 flex items-center justify-center text-stone-400 hover:text-white"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="font-mono text-xs font-black px-2 text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQuantity(item.id, 1)}
                                  className="h-7 w-7 flex items-center justify-center text-stone-400 hover:text-white"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="h-7 w-7 flex items-center justify-center text-stone-500 hover:text-rose-400 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tạm tính & Khuyến mãi nếu có */}
                  {cartItems.length > 0 && (
                    <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1 text-xs">
                      <div className="flex justify-between text-stone-400">
                        <span>Tạm tính hàng hóa:</span>
                        <span className="font-mono font-bold text-white">
                          {formatVndCurrency(subtotal)}
                        </span>
                      </div>
                      {comboDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Khuyến mãi ({bestComboResult.rule?.name || "Combo"}):</span>
                          <span className="font-mono">-{formatVndCurrency(comboDiscount)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nút Điều Hướng Bước 2: Quay lại hoặc Sang Bước 3 */}
                  <div className="pt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateStep(1)}
                      className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center gap-1.5 min-h-[44px]"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Bước 1</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextToStep3}
                      className="py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all min-h-[44px]"
                    >
                      <span>Tiếp Tục: Thanh Toán (Bước 3)</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ==============================================
                  BƯỚC 3: HẠCH TOÁN & XUẤT HÓA ĐƠN
                 ============================================== */}
              {createStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-white/10 pb-3">
                    <h3 className="text-sm font-black uppercase text-amber-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Bước 3: Hạch Toán &amp; Thanh Toán POS</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Xác nhận số tiền thu, thuế VAT và phương thức thanh toán
                    </p>
                  </div>

                  {/* Thuế VAT */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Thuế Giá Trị Gia Tăng (VAT):
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 5, 8, 10].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setVatRate(rate)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all min-h-[40px] ${
                            vatRate === rate
                              ? "bg-amber-500 text-stone-950 font-black border-amber-400 shadow-sm"
                              : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                          }`}
                        >
                          {rate === 0 ? "Không VAT (0%)" : `${rate}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Khung Hạch Toán Có - Nợ - Còn Lại */}
                  <div className="p-3.5 rounded-2xl bg-black/80 border-2 border-amber-400/50 space-y-3">
                    {/* Phát Sinh Có (Cần Phải Trả) */}
                    <div className="p-3 rounded-xl bg-stone-900 border border-amber-400/30 flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-black text-amber-300">
                          Phát Sinh Có (Cần Phải Trả):
                        </span>
                        <span className="text-[10px] text-stone-400">
                          Tổng tiền đơn hàng sau thuế VAT
                        </span>
                      </div>
                      <span className="font-mono text-base sm:text-lg font-black text-amber-300">
                        {formatVndCurrency(creditAmount)}
                      </span>
                    </div>

                    {/* Phát Sinh Nợ (Đã Trả Ngay) */}
                    <div className="p-3 rounded-xl bg-stone-900 border border-white/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-black text-emerald-400">
                            Phát Sinh Nợ (Đã Trả Ngay):
                          </span>
                          <span className="text-[10px] text-stone-400">
                            Khách thanh toán tiền mặt / CK
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDebitAmount(creditAmount)}
                          className="text-[10px] text-amber-300 hover:text-white px-2 py-0.5 rounded-md bg-white/10 font-bold"
                        >
                          Trả đủ 100%
                        </button>
                      </div>

                      <input
                        type="number"
                        value={debitAmount}
                        onChange={(e) => setDebitAmount(Number(e.target.value) || 0)}
                        className="w-full bg-black border border-emerald-400/60 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-black focus:outline-hidden focus:border-emerald-300 min-h-[44px]"
                      />
                    </div>

                    {/* Còn lại */}
                    <div className="p-2.5 rounded-xl bg-black/90 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-300 block">Còn Lại:</span>
                        <span className="text-[10px] text-stone-500">(Nợ - Có)</span>
                      </div>

                      {balance < 0 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-black">
                          Khách còn thiếu: {formatVndCurrency(Math.abs(balance))}
                        </span>
                      ) : balance > 0 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-mono font-black">
                          Thu thừa trả lại: {formatVndCurrency(balance)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-black">
                          Đã thanh toán đủ (0 ₫)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Phương thức thanh toán */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Hình thức thanh toán:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("TIEN_MAT")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border min-h-[44px] ${
                          paymentMethod === "TIEN_MAT"
                            ? "bg-amber-500 text-stone-950 font-black border-amber-400 shadow-sm"
                            : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                        }`}
                      >
                        <Banknote className="h-4 w-4" />
                        <span>Tiền Mặt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CHUYEN_KHOAN")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border min-h-[44px] ${
                          paymentMethod === "CHUYEN_KHOAN"
                            ? "bg-sky-500 text-white font-black border-sky-400 shadow-sm"
                            : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                        }`}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Chuyển Khoản</span>
                      </button>
                    </div>
                  </div>

                  {/* Ghi chú */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Ghi chú hóa đơn:
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Quà tặng kèm / Khách quen / Hộp quà..."
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400 min-h-[44px]"
                    />
                  </div>

                  {/* Nút Điều Hướng & Xuất Hóa Đơn */}
                  <div className="pt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateStep(2)}
                      className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center gap-1.5 min-h-[44px]"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Bước 2</span>
                    </button>

                    <button
                      type="submit"
                      className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <Receipt className="h-4 w-4" />
                      <span>Lập Phiếu &amp; Xuất Hóa Đơn</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </main>
      )}

      {/* ========================================================
          VIEW 3: FORM MẪU IN HÓA ĐƠN RIÊNG BIỆT (PRINT PREVIEW)
         ======================================================== */}
      {activeView === "PREVIEW" && selectedInvoice && (
        <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-4 animate-in zoom-in-95 duration-200">
          {/* Action Toolbar Phía Trên Tờ In */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl bg-stone-900 border border-white/10 print:hidden shadow-lg">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("LIST")}
                className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Danh Sách</span>
              </button>

              <span className="font-mono text-xs font-black text-amber-400">
                {selectedInvoice.code}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartCreate}
                className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-amber-400" />
                <span>Tạo Phiếu Mới</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyZaloMessage(selectedInvoice)}
                className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-emerald-500/30"
              >
                {copiedZalo ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedZalo ? "Đã Chép" : "Chép Zalo"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintInvoice}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>In Hóa Đơn</span>
              </button>
            </div>
          </div>

          {/* TỜ PHIẾU HÓA ĐƠN BÁN HÀNG CHUẨN IN ẤN (WHITE THEME PRINTABLE) */}
          <div
            id="printable-invoice"
            className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 print:m-0 print:p-6 print:border-none print:shadow-none print:rounded-none"
          >
            {/* Header Phiếu Thu */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-stone-950 text-sm">
                    PC
                  </div>
                  <span className="text-lg font-black tracking-wider uppercase text-slate-900">
                    POLY CARDS VIỆT NAM
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Hệ sinh thái Thẻ bài Học tập Thực tế ảo WebAR tương tác 3D
                </p>
                <p className="text-[11px] text-slate-500">
                  Website: polycards.vn &bull; Hotline: 0988.xxx.xxx
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                  HÓA ĐƠN BÁN HÀNG
                </span>
                <span className="text-base font-black font-mono text-slate-900 block">
                  {selectedInvoice.code}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Ngày: {selectedInvoice.createdAt}
                </span>
              </div>
            </div>

            {/* Thông Tin Khách Hàng */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Thông Tin Người Mua
                </span>
                <strong className="text-sm text-slate-900 block mt-0.5">
                  {selectedInvoice.customerName}
                </strong>
                {selectedInvoice.customerId && (
                  <span className="text-slate-600 block text-[11px]">
                    Mã KH: <strong className="font-mono">{selectedInvoice.customerId}</strong>
                  </span>
                )}
                {selectedInvoice.customerPhone && (
                  <span className="text-slate-600 block text-[11px]">
                    SĐT: <strong className="font-mono">{selectedInvoice.customerPhone}</strong>
                  </span>
                )}
                {selectedInvoice.customerAddress && (
                  <span className="text-slate-600 block text-[11px]">
                    Địa chỉ: {selectedInvoice.customerAddress}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Phương Thức &amp; Kênh
                </span>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-200 text-slate-800 uppercase">
                  {selectedInvoice.customerType === "TRUCTIEP" ? "Bán Tại Quầy" : "Giao Hàng Online"}
                </span>
                <span className="block mt-1 font-semibold text-slate-700">
                  Hình thức: {selectedInvoice.paymentMethod === "TIEN_MAT" ? "Tiền mặt" : "Chuyển khoản"}
                </span>
              </div>
            </div>

            {/* Bảng Chi Tiết Sản Phẩm */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-600 uppercase text-[10px]">
                    <th className="py-2 font-black">STT</th>
                    <th className="py-2 font-black">Tên Sản Phẩm / Thẻ</th>
                    <th className="py-2 text-center font-black">SL</th>
                    <th className="py-2 text-right font-black">Đơn Giá</th>
                    <th className="py-2 text-right font-black">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5">
                          <span className="font-bold text-slate-900 block">{it.name}</span>
                          {it.packCode && (
                            <span className="font-mono text-[10px] text-slate-500 block">
                              Mã con: {it.packCode}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold">{it.quantity}</td>
                        <td className="py-2.5 text-right font-mono">
                          {formatVndCurrency(it.unitPrice)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                          {formatVndCurrency(it.totalPrice || it.quantity * it.unitPrice)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2.5 text-slate-400 font-mono">1</td>
                      <td className="py-2.5 font-bold text-slate-900">{selectedInvoice.packTitle}</td>
                      <td className="py-2.5 text-center font-mono font-bold">1</td>
                      <td className="py-2.5 text-right font-mono">
                        {formatVndCurrency(selectedInvoice.creditAmount)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatVndCurrency(selectedInvoice.creditAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bảng Hạch Toán Tổng Tiền & VAT */}
            <div className="border-t-2 border-slate-900 pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatVndCurrency(selectedInvoice.subtotal || selectedInvoice.creditAmount)}
                </span>
              </div>

              {selectedInvoice.comboDiscount !== undefined && selectedInvoice.comboDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Khuyến mãi {selectedInvoice.comboName ? `(${selectedInvoice.comboName})` : ""}:</span>
                  <span className="font-mono">-{formatVndCurrency(selectedInvoice.comboDiscount)}</span>
                </div>
              )}

              {selectedInvoice.vatRate !== undefined && selectedInvoice.vatRate > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Thuế VAT ({selectedInvoice.vatRate}%):</span>
                  <span className="font-mono font-bold text-slate-900">
                    +{formatVndCurrency(selectedInvoice.vatAmount || 0)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Tổng Phát Sinh Có (Cần Phải Trả):</span>
                <span className="font-mono text-amber-600">
                  {formatVndCurrency(selectedInvoice.creditAmount)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-600 pt-1">
                <span>Phát Sinh Nợ (Đã thanh toán):</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatVndCurrency(selectedInvoice.debitAmount)}
                </span>
              </div>

              {selectedInvoice.remainingAmount > 0 && (
                <div className="flex justify-between text-xs text-rose-600 font-bold pt-1">
                  <span>Còn lại chưa thanh toán:</span>
                  <span className="font-mono">{formatVndCurrency(selectedInvoice.remainingAmount)}</span>
                </div>
              )}
            </div>

            {/* Khối Mã Bản Quyền & QR Code Quét 3D WebAR */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-dashed border-amber-300 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-900 block">
                    Mã Cha Kích Hoạt Bản Quyền (License Master Code)
                  </span>
                  <div className="font-mono text-sm sm:text-base font-black text-amber-950 bg-white px-3 py-1.5 rounded-xl border border-amber-300 inline-block shadow-xs">
                    {selectedInvoice.packCode}
                  </div>
                  <p className="text-[11px] text-amber-900/80">
                    Dùng mã này để quét trực tiếp hoặc mở khóa toàn bộ danh mục thẻ đi kèm
                  </p>
                </div>

                {selectedInvoiceQrUrl && (
                  <div className="flex flex-col items-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedInvoiceQrUrl}
                      alt="QR Code"
                      className="h-24 w-24 rounded-xl border-2 border-slate-900 p-1 bg-white shadow-md"
                    />
                    <span className="text-[9px] font-bold text-slate-700 mt-1 uppercase">
                      Quét mở WebAR 3D
                    </span>
                  </div>
                )}
              </div>

              {/* Danh sách các mã con nếu có nhiều bộ */}
              {selectedInvoice.childCodes && selectedInvoice.childCodes.length > 0 && (
                <div className="pt-2 border-t border-amber-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-amber-950 block">
                    Các Mã Con Từng Bộ / Thẻ Lẻ (In trên thẻ bài &amp; vỏ hộp):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInvoice.childCodes.map((cc, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] bg-white border border-amber-300 text-amber-900 px-2 py-0.5 rounded-md font-bold"
                      >
                        {cc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chữ Ký Người Bán & Người Mua */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-700">
              <div>
                <span className="font-bold block">Người Mua Hàng</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">(Ký và ghi rõ họ tên)</span>
                <div className="h-10" />
                <span className="font-bold text-slate-800">{selectedInvoice.customerName}</span>
              </div>

              <div>
                <span className="font-bold block">Người Lập Phiếu / Thu Ngân</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">(Ký và ghi rõ họ tên)</span>
                <div className="h-10" />
                <span className="font-bold text-slate-800">Poly Cards Store</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* MODAL KHO HÀNG HÓA CHỌN BỘ & THẺ LẺ */}
      <CatalogPickerModal
        isOpen={isCatalogModalOpen}
        categoriesList={categoriesList}
        productsCatalog={productsCatalog}
        packCodesList={storedPackCodes}
        cartItems={cartItems}
        onClose={() => setIsCatalogModalOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* TOAST THÔNG BÁO TÙY BIẾN */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none print:hidden">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-top-3 ${
              t.type === "success"
                ? "bg-emerald-950/90 border-emerald-400/60 text-emerald-100"
                : t.type === "error"
                ? "bg-rose-950/90 border-rose-400/60 text-rose-100"
                : t.type === "warning"
                ? "bg-amber-950/90 border-amber-400/60 text-amber-100"
                : "bg-stone-900/90 border-stone-600 text-stone-100"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === "error" && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />}
            {t.type === "warning" && <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />}
            <span className="text-xs font-semibold leading-relaxed flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
