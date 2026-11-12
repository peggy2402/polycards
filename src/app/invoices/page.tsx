"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
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
  Edit,
  Clock,
  Filter,
  FileSpreadsheet,
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
  codeParent?: string;
  childCodes?: string[];
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
  creditAmount: number;
  debitAmount: number;
  balanceAmount?: number;
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

// Hàm chuẩn hóa chuỗi tiếng Việt phục vụ tìm kiếm mờ (Elastic-like fuzzy match)
function normalizeVi(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

// Bôi sáng từ khóa khớp trong văn bản
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !query.trim() || !text) return text;
  const qClean = query.trim();
  const escaped = qClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-400 text-stone-950 font-black px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// Phân tích ngày tháng của hóa đơn
function parseInvoiceDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const dmyMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export default function InvoicesPage() {
  // Navigation: LIST | CREATE | PREVIEW
  const [activeView, setActiveView] = useState<"LIST" | "CREATE" | "PREVIEW">("LIST");
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);

  // Invoices Data
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hóa đơn vừa tạo để highlight sáng
  const [newlyCreatedInvoiceId, setNewlyCreatedInvoiceId] = useState<string | null>(null);

  // Trạng thái Chỉnh Sửa Hóa Đơn (Edit mode)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  // Tìm kiếm Elastic-like & Gợi ý (Dropdown Autocomplete)
  const [searchInvoiceQuery, setSearchInvoiceQuery] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Bộ lọc trạng thái & Bộ lọc thời gian nâng cao
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PAID" | "PARTIAL" | "TRUCTIEP" | "ONLINE">("ALL");
  const [timeFilter, setTimeFilter] = useState<
    "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "LAST_QUARTER" | "THIS_YEAR" | "LAST_YEAR" | "CUSTOM"
  >("ALL");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Hóa đơn đang chọn để xem / in
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [copiedZalo, setCopiedZalo] = useState<boolean>(false);

  // ========================================================
  // FORM STATE: WIZARD LẬP / SỬA PHIẾU
  // ========================================================
  const [customerType, setCustomerType] = useState<"TRUCTIEP" | "ONLINE">("TRUCTIEP");
  const [customerName, setCustomerName] = useState<string>("Khách Mua Trực Tiếp Tại Quầy");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>(() => `KH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isExistingCustomer, setIsExistingCustomer] = useState<boolean>(false);
  const [isSearchingPhone, setIsSearchingPhone] = useState<boolean>(false);
  const phoneLookupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("DA_NHAN");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("TRUC_TIEP");
  const [codAmount, setCodAmount] = useState<number>(0);

  // Giỏ hàng hóa
  const [cartItems, setCartItems] = useState<InvoiceCartItem[]>([]);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);

  // Kho hàng & Cấu hình mã bộ
  const [productsCatalog, setProductsCatalog] = useState<Animal[]>([]);
  const [categoriesList, setCategoriesList] = useState<ProductCategory[]>([]);
  const [storedPackCodes, setStoredPackCodes] = useState<PackCodeItem[]>([]);
  const [selectedExistingPackCode, setSelectedExistingPackCode] = useState<string>("POLY30-DONGVAT-ENVI");
  const [packCodeMode, setPackCodeMode] = useState<"AUTO" | "EXISTING">("EXISTING");
  const [comboRules, setComboRules] = useState<DbComboRule[]>(DEFAULT_COMBO_RULES);

  // Hạch toán & Thanh toán
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

  // Tải danh mục sản phẩm & mã bộ
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const local = getMergedProducts();
        if (local && local.length > 0) setProductsCatalog(local);
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
        if (local && local.length > 0) setCategoriesList(local);
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
      if (data && data.length > 0) setStoredPackCodes(data);
    });
  }, []);

  // Tải combo rules
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

  // Tải danh sách hóa đơn từ API (sắp xếp hóa đơn mới nhất lên đầu)
  const loadInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Sắp xếp phiếu mới nhất lên đầu danh sách
        const sorted = [...json.data].sort((a, b) => {
          const tA = parseInvoiceDate(a.createdAt)?.getTime() || 0;
          const tB = parseInvoiceDate(b.createdAt)?.getTime() || 0;
          return tB - tA;
        });
        setInvoices(sorted);
        if (sorted.length > 0 && !selectedInvoice) {
          setSelectedInvoice(sorted[0]);
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

  // Click outside to close search suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ========================================================
  // TÍNH TOÁN GIỎ HÀNG & HẠCH TOÁN POS
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

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  }, [cartItems]);

  const comboDiscount = useMemo(() => {
    return bestComboResult.discountAmount || 0;
  }, [bestComboResult]);

  const amountAfterCombo = useMemo(() => {
    return Math.max(0, subtotal - comboDiscount);
  }, [subtotal, comboDiscount]);

  const vatAmount = useMemo(() => {
    if (!vatRate || vatRate <= 0) return 0;
    return Math.round((amountAfterCombo * vatRate) / 100);
  }, [amountAfterCombo, vatRate]);

  const creditAmount = useMemo(() => {
    return amountAfterCombo + vatAmount;
  }, [amountAfterCombo, vatAmount]);

  useEffect(() => {
    if (!editingInvoiceId) {
      setDebitAmount(creditAmount);
    }
  }, [creditAmount, editingInvoiceId]);

  const balance = debitAmount - creditAmount;

  const handleToggleCustomerType = (type: "TRUCTIEP" | "ONLINE") => {
    setCustomerType(type);
    if (!isExistingCustomer) {
      if (type === "TRUCTIEP" && customerName.includes("Khách Đặt Hàng")) {
        setCustomerName("Khách Mua Trực Tiếp Tại Quầy");
      } else if (type === "ONLINE" && customerName.includes("Khách Mua Trực Tiếp")) {
        setCustomerName("Khách Đặt Hàng Online");
      }
    }
  };

  // Tra cứu tự động khách hàng theo số điện thoại (từ hóa đơn cũ & Database)
  const handlePhoneLookup = useCallback(async (phoneVal: string) => {
    const cleanPhone = phoneVal.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      setIsExistingCustomer(false);
      return;
    }

    setIsSearchingPhone(true);

    // 1. Tra cứu nhanh trong lịch sử các hóa đơn đã có trên hệ thống
    const matchedInv = invoices.find((inv) => {
      const invPhone = (inv.customerPhone || "").replace(/\D/g, "");
      return (
        invPhone &&
        (invPhone === cleanPhone ||
          (cleanPhone.length >= 9 && invPhone.endsWith(cleanPhone.slice(-9))) ||
          (invPhone.length >= 9 && cleanPhone.endsWith(invPhone.slice(-9))))
      );
    });

    if (matchedInv) {
      if (matchedInv.customerId) setCustomerId(matchedInv.customerId);
      if (
        matchedInv.customerName &&
        !matchedInv.customerName.includes("Khách Mua Trực Tiếp") &&
        !matchedInv.customerName.includes("Khách Đặt Hàng")
      ) {
        setCustomerName(matchedInv.customerName);
      }
      if (matchedInv.customerAddress) {
        setCustomerAddress(matchedInv.customerAddress);
      }
      setIsExistingCustomer(true);
      setIsSearchingPhone(false);
      showToast(
        `Đã nhận diện khách quen: ${matchedInv.customerName} (${matchedInv.customerId || ""})`,
        "success"
      );
      return;
    }

    // 2. Tra cứu trong Database qua API /api/customers/search
    try {
      const res = await fetch(`/api/customers/search?phone=${encodeURIComponent(cleanPhone)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const cust = json.data;
        if (cust.id) setCustomerId(cust.id);
        if (cust.name) setCustomerName(cust.name);
        if (cust.address) setCustomerAddress(cust.address);
        setIsExistingCustomer(true);
        setIsSearchingPhone(false);
        showToast(`Đã nhận diện khách quen: ${cust.name} (${cust.id})`, "success");
        return;
      }
    } catch {
      // bỏ qua lỗi mạng
    }

    setIsExistingCustomer(false);
    setIsSearchingPhone(false);
  }, [invoices, showToast]);

  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    const clean = val.replace(/\D/g, "");
    if (clean.length >= 9) {
      if (phoneLookupTimerRef.current) clearTimeout(phoneLookupTimerRef.current);
      phoneLookupTimerRef.current = setTimeout(() => {
        handlePhoneLookup(val);
      }, 350);
    } else {
      setIsExistingCustomer(false);
    }
  };

  const handleResetToNewCustomer = () => {
    setCustomerId(`KH-${Math.floor(1000 + Math.random() * 9000)}`);
    setCustomerName(customerType === "ONLINE" ? "Khách Đặt Hàng Online" : "Khách Mua Trực Tiếp Tại Quầy");
    setCustomerPhone("");
    setCustomerAddress("");
    setIsExistingCustomer(false);
  };

  // ========================================================
  // BẮT ĐẦU TẠO PHIẾU / SỬA PHIẾU
  // ========================================================
  const handleStartCreate = () => {
    setEditingInvoiceId(null);
    setCartItems([]);
    setCustomerName("Khách Mua Trực Tiếp Tại Quầy");
    setCustomerType("TRUCTIEP");
    setCustomerId(`KH-${Math.floor(1000 + Math.random() * 9000)}`);
    setCustomerPhone("");
    setCustomerAddress("");
    setNote("");
    setDebitAmount(0);
    setVatRate(0);
    setCreateStep(1);
    setActiveView("CREATE");
  };

  const handleEditInvoice = (inv: SaleInvoice) => {
    setEditingInvoiceId(inv.id || inv.code);
    setCustomerType(inv.customerType || "TRUCTIEP");
    setCustomerName(inv.customerName || "Khách Hàng");
    setCustomerId(inv.customerId || `KH-${Math.floor(1000 + Math.random() * 9000)}`);
    setCustomerPhone(inv.customerPhone || "");
    setCustomerAddress(inv.customerAddress || "");
    setOrderStatus(inv.orderStatus || "DA_NHAN");
    setDeliveryMethod(inv.deliveryMethod || "TRUC_TIEP");
    setCodAmount(inv.codAmount || 0);
    setVatRate(inv.vatRate || 0);
    setDebitAmount(inv.debitAmount || 0);
    setPaymentMethod(inv.paymentMethod || "TIEN_MAT");
    setNote(inv.note || "");

    if (Array.isArray(inv.items) && inv.items.length > 0) {
      setCartItems(
        inv.items.map((it) => ({
          id: it.id,
          name: it.name,
          type: it.packCode?.startsWith("SINGLE-") ? "SINGLE" : "PACK",
          categorySlug: it.categorySlug,
          categoryName: it.categorySlug,
          packCode: it.packCode,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        }))
      );
    } else {
      setCartItems([]);
    }

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

  const handleViewInvoice = (inv: SaleInvoice) => {
    setSelectedInvoice(inv);
    setActiveView("PREVIEW");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleCopyZaloMessage = (inv: SaleInvoice) => {
    const childCodesText =
      inv.childCodes && inv.childCodes.length > 0
        ? `- Mã Thẻ/Bộ Đi Kèm: ${inv.childCodes.join(", ")}\n`
        : "";

    const msg = `Kính chào quý khách ${inv.customerName},
Poly Cards trân trọng gửi quý khách Hóa Đơn Bán Hàng:
- Số Hóa Đơn: ${inv.code}
- Khách hàng: ${inv.customerName} (${inv.customerId || "KH"})
- Sản phẩm: ${inv.packTitle}
- Tiền hàng tạm tính: ${formatVndCurrency(inv.subtotal || inv.creditAmount)}
${inv.vatRate ? `- Thuế VAT (${inv.vatRate}%): ${formatVndCurrency(inv.vatAmount || 0)}\n` : ""}- Tổng Tiền: ${formatVndCurrency(inv.creditAmount)}
- Đã Thanh Toán: ${formatVndCurrency(inv.debitAmount)}
${inv.remainingAmount > 0 ? `- Còn thiếu: ${formatVndCurrency(inv.remainingAmount)}\n` : ""}
${childCodesText}
Mỗi thẻ bài AR đều đã được tích hợp sẵn mã quét 3D WebAR. Quý khách chỉ cần mở camera điện thoại quét trực tiếp trên mặt thẻ là có thể tương tác 3D ngay lập tức!

Cảm ơn quý khách đã tin dùng Poly Cards! Chúc bé học tập vui vẻ!`;

    navigator.clipboard.writeText(msg);
    setCopiedZalo(true);
    showToast("Đã sao chép tin nhắn Zalo gửi khách hàng!", "success");
    setTimeout(() => setCopiedZalo(false), 2000);
  };

  // Submit Lập hoặc Cập nhật Hóa Đơn
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
    const invoiceCode = editingInvoiceId
      ? (invoices.find((i) => i.id === editingInvoiceId)?.code || `${invoicePrefix}-${Date.now().toString().slice(-4)}-${randomNum}`)
      : `${invoicePrefix}-${Date.now().toString().slice(-4)}-${randomNum}`;
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
        licenseCode = selectedExistingPackCode.trim() || singlePack.packCode || `POLY30-${catUpper}`;
        packTitle = singlePack.name;
        allowedCategorySlug = singlePack.categorySlug;
      } else {
        const sumPacks = purchasedPacks.reduce((a, b) => a + b.quantity, 0);
        licenseCode = `PACK-COMBO-${sumPacks}BO-${cleanCustCode}-${invoiceCode}`;
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

    const codeParent = licenseCode;
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

    const newInvoice: SaleInvoice = {
      id: editingInvoiceId || `INV-${Date.now()}`,
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
      directUrl: `https://polycards.vn/products`,
      note: note.trim() || (customerType === "TRUCTIEP" ? "Khách mua trực tiếp tại quầy" : "Đơn hàng online"),
      createdAt: editingInvoiceId
        ? (invoices.find((i) => i.id === editingInvoiceId)?.createdAt || new Date().toLocaleString("vi-VN"))
        : new Date().toLocaleString("vi-VN"),
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
        showToast(
          editingInvoiceId
            ? `Đã cập nhật hóa đơn ${invoiceCode} thành công!`
            : `Đã lập hóa đơn ${invoiceCode} thành công!`,
          "success"
        );
        // Đưa hóa đơn mới lên đầu danh sách
        setInvoices((prev) => {
          const filtered = prev.filter((i) => i.id !== newInvoice.id && i.code !== newInvoice.code);
          return [newInvoice, ...filtered];
        });
        setNewlyCreatedInvoiceId(newInvoice.id);
        setSelectedInvoice(newInvoice);
        setEditingInvoiceId(null);
        setNote("");
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
  // BỘ LỌC THỜI GIAN & TÌM KIẾM MỜ (ELASTIC-LIKE)
  // ========================================================
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 - 11
    const currentQuarter = Math.floor(currentMonth / 3);

    return invoices.filter((inv) => {
      // 1. Lọc theo trạng thái thanh toán & kênh bán
      if (filterStatus === "PAID" && inv.status !== "PAID") return false;
      if (filterStatus === "PARTIAL" && inv.status !== "PARTIAL") return false;
      if (filterStatus === "TRUCTIEP" && inv.customerType !== "TRUCTIEP") return false;
      if (filterStatus === "ONLINE" && inv.customerType !== "ONLINE") return false;

      // 2. Lọc theo thời gian
      const invDate = parseInvoiceDate(inv.createdAt);
      if (invDate && timeFilter !== "ALL") {
        const y = invDate.getFullYear();
        const m = invDate.getMonth();
        const q = Math.floor(m / 3);

        if (timeFilter === "THIS_MONTH" && (y !== currentYear || m !== currentMonth)) return false;
        if (timeFilter === "LAST_MONTH") {
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (y !== prevYear || m !== prevMonth) return false;
        }
        if (timeFilter === "THIS_QUARTER" && (y !== currentYear || q !== currentQuarter)) return false;
        if (timeFilter === "LAST_QUARTER") {
          const prevQ = currentQuarter === 0 ? 3 : currentQuarter - 1;
          const prevQYear = currentQuarter === 0 ? currentYear - 1 : currentYear;
          if (y !== prevQYear || q !== prevQ) return false;
        }
        if (timeFilter === "THIS_YEAR" && y !== currentYear) return false;
        if (timeFilter === "LAST_YEAR" && y !== currentYear - 1) return false;

        if (timeFilter === "CUSTOM") {
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            if (invDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (invDate > end) return false;
          }
        }
      }

      // 3. Tìm kiếm Elastic-like (Fuzzy Token Search)
      if (searchInvoiceQuery.trim()) {
        const qNorm = normalizeVi(searchInvoiceQuery);
        const codeNorm = normalizeVi(inv.code);
        const nameNorm = normalizeVi(inv.customerName);
        const phoneNorm = normalizeVi(inv.customerPhone || "");
        const packNorm = normalizeVi(inv.packTitle || "");
        const custIdNorm = normalizeVi(inv.customerId || "");

        const isMatch =
          codeNorm.includes(qNorm) ||
          nameNorm.includes(qNorm) ||
          phoneNorm.includes(qNorm) ||
          packNorm.includes(qNorm) ||
          custIdNorm.includes(qNorm);

        if (!isMatch) return false;
      }

      return true;
    });
  }, [invoices, filterStatus, timeFilter, customStartDate, customEndDate, searchInvoiceQuery]);

  // Danh sách gợi ý tìm kiếm (Dropdown suggestions)
  const searchSuggestions = useMemo(() => {
    if (!searchInvoiceQuery.trim()) return [];
    const qNorm = normalizeVi(searchInvoiceQuery);
    return invoices
      .filter((inv) => {
        return (
          normalizeVi(inv.code).includes(qNorm) ||
          normalizeVi(inv.customerName).includes(qNorm) ||
          normalizeVi(inv.customerPhone || "").includes(qNorm)
        );
      })
      .slice(0, 5);
  }, [invoices, searchInvoiceQuery]);

  const stats = useMemo(() => {
    const totalCount = filteredInvoices.length;
    const totalCredit = filteredInvoices.reduce((s, i) => s + (i.creditAmount || 0), 0);
    const totalDebit = filteredInvoices.reduce((s, i) => s + (i.debitAmount || 0), 0);
    const totalRemain = filteredInvoices.reduce((s, i) => s + Math.max(0, (i.creditAmount || 0) - (i.debitAmount || 0)), 0);
    return { totalCount, totalCredit, totalDebit, totalRemain };
  }, [filteredInvoices]);

  // Nhãn Doanh Thu động theo bộ lọc thời gian
  const revenueLabel = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1 - 12
    const currentYear = now.getFullYear();

    switch (timeFilter) {
      case "THIS_MONTH":
        return `Doanh thu T${currentMonth}`;
      case "LAST_MONTH": {
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        return `Doanh thu T${prevMonth}`;
      }
      case "THIS_QUARTER":
      case "LAST_QUARTER":
      case "CUSTOM":
        return "Doanh thu";
      case "THIS_YEAR":
        return `Doanh thu ${currentYear}`;
      case "LAST_YEAR":
        return `Doanh thu ${currentYear - 1}`;
      case "ALL":
      default:
        return "Doanh thu";
    }
  }, [timeFilter]);

  // Xuất danh sách hóa đơn đang lọc ra file Excel (CSV UTF-8 BOM)
  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      showToast("Không có hóa đơn nào trong danh sách để xuất.", "warning");
      return;
    }

    const headers = [
      "STT",
      "Mã Hóa Đơn",
      "Ngày Lập",
      "Khách Hàng",
      "Mã KH",
      "Số Điện Thoại",
      "Địa Chỉ",
      "Kênh Bán",
      "Sản Phẩm Mua",
      "Tiền Hàng (VNĐ)",
      "VAT (VNĐ)",
      "Tổng Tiền (VNĐ)",
      "Đã Thanh Toán (VNĐ)",
      "Còn Thiếu (VNĐ)",
      "Trạng Thái",
      "Hình Thức",
      "Ghi Chú",
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredInvoices.map((inv, idx) => {
      const itemsSummary = Array.isArray(inv.items)
        ? inv.items.map((it) => `${it.name} (x${it.quantity})`).join("; ")
        : inv.packTitle || "";

      return [
        idx + 1,
        escapeCsv(inv.code),
        escapeCsv(inv.createdAt),
        escapeCsv(inv.customerName),
        escapeCsv(inv.customerId || ""),
        escapeCsv(inv.customerPhone || ""),
        escapeCsv(inv.customerAddress || ""),
        escapeCsv(inv.customerType === "TRUCTIEP" ? "Tại Quầy" : "Online"),
        escapeCsv(itemsSummary),
        inv.subtotal || inv.creditAmount,
        inv.vatAmount || 0,
        inv.creditAmount,
        inv.debitAmount,
        Math.max(0, (inv.creditAmount || 0) - (inv.debitAmount || 0)),
        escapeCsv(inv.status === "PAID" ? "Đã Thu Đủ" : "Thu Một Phần"),
        escapeCsv(inv.paymentMethod === "TIEN_MAT" ? "Tiền Mặt" : "Chuyển Khoản"),
        escapeCsv(inv.note || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    link.href = url;
    link.download = `Danh_Sach_Hoa_Don_PolyCards_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Đã xuất thành công ${filteredInvoices.length} hóa đơn ra file Excel!`, "success");
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-12 sm:pb-8">
      {/* ========================================================
          HEADER TOP BAR: BRANDING, TITLE & VIEW ACTIONS
         ======================================================== */}
      <header className="border-b border-amber-500/20 bg-stone-900/80 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/icons/logo.png"
                alt="Logo"
                className="h-9 w-9 object-contain rounded-xl"
              />
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

            <div className="hidden sm:block">
              <h1 className="text-xs font-black uppercase text-amber-300">
                {activeView === "LIST" && "Phân Hệ Hóa Đơn Bán Hàng (POS)"}
                {activeView === "CREATE" && (editingInvoiceId ? "Chỉnh Sửa Hóa Đơn Bán Hàng" : "Lập Phiếu Hóa Đơn Bán Hàng")}
                {activeView === "PREVIEW" && "Form Mẫu In Hóa Đơn"}
              </h1>
            </div>
          </div>

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-400" />
                <span>Phân Hệ Hóa Đơn Bán Hàng (POS)</span>
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                Quản lý toàn bộ hóa đơn bán hàng trực tiếp tại quầy &amp; online, in phiếu xuất kho chuẩn bán lẻ
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleExportExcel}
                className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer border border-emerald-500/40"
                title="Xuất danh sách hóa đơn đang lọc ra file Excel/CSV"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Xuất Excel</span>
              </button>

              <button
                type="button"
                onClick={handleStartCreate}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo Phiếu Hóa Đơn Mới</span>
              </button>
            </div>
          </div>

          {/* 4 Thẻ Thống Kê KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-stone-400 block">Tổng Hóa Đơn Lọc</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">{stats.totalCount}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-amber-400/30 space-y-1">
              <span className="text-[11px] font-bold text-amber-300 block">{revenueLabel}</span>
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                {formatVndCurrency(stats.totalCredit)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-emerald-400/30 space-y-1">
              <span className="text-[11px] font-bold text-emerald-300 block">Đã Thanh Toán</span>
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

          {/* THANH TÌM KIẾM ELASTIC-LIKE & GỢI Ý AUTOCOMPLETE */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Ô Search với Dropdown Gợi Ý */}
              <div ref={searchContainerRef} className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchInvoiceQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchInvoiceQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  placeholder="Tìm kiếm Elastic: Mã HĐ, tên khách, SĐT (gõ không dấu)..."
                  className="w-full bg-stone-900/90 border border-white/15 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 shadow-sm"
                />
                {searchInvoiceQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInvoiceQuery("");
                      setIsSearchFocused(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs font-bold"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Dropdown Gợi Ý Tức Thì (Autocomplete Suggestions) */}
                {isSearchFocused && searchSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-stone-900 border border-amber-400/40 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-amber-400/80 flex items-center justify-between">
                      <span>Gợi ý kết quả tìm kiếm ({searchSuggestions.length})</span>
                      <span className="text-stone-500">Chạm để xem</span>
                    </div>
                    {searchSuggestions.map((inv) => (
                      <div
                        key={inv.id || inv.code}
                        onClick={() => {
                          setIsSearchFocused(false);
                          handleViewInvoice(inv);
                        }}
                        className="p-2.5 rounded-xl hover:bg-stone-800 cursor-pointer transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-black text-amber-300 block truncate">
                            {highlightMatch(inv.code, searchInvoiceQuery)}
                          </span>
                          <span className="text-xs text-white font-bold block truncate">
                            {highlightMatch(inv.customerName, searchInvoiceQuery)}
                            {inv.customerPhone ? ` • ${inv.customerPhone}` : ""}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                          {formatVndCurrency(inv.creditAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lọc Trạng Thái */}
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

            {/* BỘ LỌC THỜI GIAN THEO YÊU CẦU */}
            <div className="p-3 rounded-2xl bg-stone-900/60 border border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-300">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Bộ Lọc Thời Gian:</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {[
                  { id: "ALL", label: "Tất cả" },
                  { id: "THIS_MONTH", label: "Tháng này" },
                  { id: "LAST_MONTH", label: "Tháng trước" },
                  { id: "THIS_QUARTER", label: "Quý này" },
                  { id: "LAST_QUARTER", label: "Quý trước" },
                  { id: "THIS_YEAR", label: "Năm này" },
                  { id: "LAST_YEAR", label: "Năm trước" },
                  { id: "CUSTOM", label: "Khoảng thời gian" },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTimeFilter(tf.id as typeof timeFilter)}
                    className={`py-1 px-2.5 rounded-lg font-bold transition-all ${
                      timeFilter === tf.id
                        ? "bg-amber-500 text-stone-950 font-black shadow-xs"
                        : "bg-stone-900/90 text-stone-400 border border-white/10 hover:text-white"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Tùy chọn Khoảng thời gian (Từ ngày -> Đến ngày) */}
              {timeFilter === "CUSTOM" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs">
                    <span className="text-stone-400 shrink-0 font-bold">Từ ngày:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-transparent text-white font-mono focus:outline-hidden w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs">
                    <span className="text-stone-400 shrink-0 font-bold">Đến ngày:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-transparent text-white font-mono focus:outline-hidden w-full"
                    />
                  </div>
                </div>
              )}
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
                const isNewlyCreated = inv.id === newlyCreatedInvoiceId;

                return (
                  <div
                    key={inv.id || inv.code}
                    onClick={() => handleViewInvoice(inv)}
                    className={`cursor-pointer p-4 rounded-2xl transition-all space-y-3 shadow-lg flex flex-col justify-between group relative overflow-hidden ${
                      isNewlyCreated
                        ? "bg-amber-500/15 border-2 border-amber-400 shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/50"
                        : "bg-stone-900/90 border border-white/10 hover:border-amber-400/50"
                    }`}
                  >
                    {/* Badge Mới Tạo */}
                    {isNewlyCreated && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-[9px] uppercase tracking-wider animate-pulse">
                        MỚI TẠO
                      </span>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 pr-16">
                        <span className="font-mono text-xs font-black text-amber-400">
                          {highlightMatch(inv.code, searchInvoiceQuery)}
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
                            {highlightMatch(inv.customerName, searchInvoiceQuery)}
                          </h4>
                          {inv.customerPhone && (
                            <span className="text-[11px] text-stone-400 font-mono block">
                              {highlightMatch(inv.customerPhone, searchInvoiceQuery)}
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

                      <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed pt-1">
                        {inv.packTitle}
                      </p>
                    </div>

                    {/* Bottom: Tiền & Nút Thao Tác */}
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-stone-400 block">Tổng Tiền</span>
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
                      <div className="grid grid-cols-3 gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleViewInvoice(inv)}
                          className="py-2 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Xem In</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditInvoice(inv)}
                          className="py-2 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 border border-white/10 active:scale-95 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Sửa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyZaloMessage(inv)}
                          className="py-2 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-1 border border-white/10 active:scale-95 transition-all"
                        >
                          <Copy className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Zalo</span>
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
          VIEW 2: LẬP / SỬA PHIẾU HÓA ĐƠN BÁN HÀNG (STEPPER WIZARD)
         ======================================================== */}
      {activeView === "CREATE" && (
        <main className="max-w-3xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-5 animate-in slide-in-from-right-4 duration-200">
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
              {editingInvoiceId ? "Đang Sửa Phiếu" : "Lập Phiếu Mới"} &bull; Bước {createStep} / 3
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

          <div className="rounded-3xl bg-stone-900/90 border border-amber-400/40 p-5 sm:p-6 shadow-2xl space-y-5">
            <form onSubmit={handleCreateInvoice} className="space-y-5">
              {/* BƯỚC 1: KHÁCH HÀNG */}
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
                      <span>Khách Hàng Trực Tiếp</span>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-stone-300">
                          Số điện thoại / Zalo:
                        </label>
                        {isExistingCustomer && (
                          <button
                            type="button"
                            onClick={handleResetToNewCustomer}
                            className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                          >
                            Tạo khách mới
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={customerPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          onBlur={() => {
                            if (customerPhone.replace(/\D/g, "").length >= 9) {
                              handlePhoneLookup(customerPhone);
                            }
                          }}
                          placeholder="Nhập SĐT khách hàng (VD: 0862587229)..."
                          className={`w-full bg-black/70 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-stone-600 focus:outline-hidden min-h-[44px] transition-all ${
                            isExistingCustomer
                              ? "border-emerald-400/80 bg-emerald-950/20 text-emerald-300 shadow-sm shadow-emerald-500/10"
                              : "border-white/20 focus:border-amber-400"
                          }`}
                        />
                        {isSearchingPhone && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                        {!isSearchingPhone && isExistingCustomer && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {isExistingCustomer ? (
                        <div className="mt-1.5 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300 animate-in fade-in">
                          <span className="font-bold flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>Khách quen: <strong>{customerName}</strong> ({customerId})</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          Tự động nhận diện &amp; điền tên, mã KH, địa chỉ nếu SĐT đã có trong hệ thống
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-stone-300">
                          Địa chỉ giao hàng:
                        </label>
                        <span className="text-[10px] text-stone-500">
                          {customerType === "TRUCTIEP" ? "Tại quầy (tùy chọn)" : "Cần thiết cho giao Online"}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder={
                          customerType === "TRUCTIEP"
                            ? "Khách mua tại quầy không cần nhập (tùy chọn)..."
                            : "Số nhà, tên đường, phường/xã, quận/huyện..."
                        }
                        className="w-full bg-black/70 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400 min-h-[44px]"
                      />
                    </div>
                  </div>

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

              {/* BƯỚC 2: CHỌN HÀNG HÓA */}
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

                  {/* NÚT MỞ KHO HÀNG HÓA */}
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

                  {cartItems.length > 0 && (
                    <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1 text-xs">
                      <div className="flex justify-between text-stone-400">
                        <span>Tiền hàng tạm tính:</span>
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

              {/* BƯỚC 3: HẠCH TOÁN */}
              {createStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-white/10 pb-3">
                    <h3 className="text-sm font-black uppercase text-amber-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Bước 3: Hạch Toán &amp; Thanh Toán POS</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Xác nhận tổng tiền, thuế VAT và phương thức thanh toán
                    </p>
                  </div>

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

                  <div className="p-3.5 rounded-2xl bg-black/80 border-2 border-amber-400/50 space-y-3">
                    <div className="p-3 rounded-xl bg-stone-900 border border-amber-400/30 flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-black text-amber-300">
                          Tổng Tiền:
                        </span>
                        <span className="text-[10px] text-stone-400">
                          Tổng tiền đơn hàng sau thuế VAT
                        </span>
                      </div>
                      <span className="font-mono text-base sm:text-lg font-black text-amber-300">
                        {formatVndCurrency(creditAmount)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-900 border border-white/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-black text-emerald-400">
                            Đã Thanh Toán:
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
                      <span>{editingInvoiceId ? "Lưu Thay Đổi Hóa Đơn" : "Lập Phiếu & Xuất Hóa Đơn"}</span>
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
          {/* Action Toolbar */}
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
                onClick={() => handleEditInvoice(selectedInvoice)}
                className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-colors"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Sửa Phiếu</span>
              </button>

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
            className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none"
          >
            {/* Header Phiếu Thu: LOGO + POLY CARDS VIỆT NAM */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/icons/logo.png"
                  alt="Poly Cards Logo"
                  className="h-12 w-12 object-contain rounded-xl shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div>
                  <span className="text-lg font-black tracking-wider uppercase text-slate-900 block leading-tight">
                    POLY CARDS VIỆT NAM
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ sinh thái Thẻ bài Học tập Thực tế ảo WebAR tương tác 3D
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Website: polycards.vn &bull; Hotline: 0988.xxx.xxx
                  </p>
                </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
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

              <div className="text-left sm:text-right">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Phương Thức &amp; Kênh
                </span>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-200 text-slate-800 uppercase">
                  {selectedInvoice.customerType === "TRUCTIEP" ? "Bán Tại Quầy" : "Giao Hàng Online"}
                </span>
                <span className="block mt-1 font-semibold text-slate-700">
                  HT Thanh Toánc: {selectedInvoice.paymentMethod === "TIEN_MAT" ? "Tiền mặt" : "Chuyển khoản"}
                </span>
              </div>
            </div>

            {/* BẢNG CHI TIẾT SẢN PHẨM: RESPONSIVE CHO MOBILE & DESKTOP */}
            {/* 1. Mobile Layout (sm:hidden): Dạng Card thông thoáng, không bị bó cột */}
            <div className="sm:hidden space-y-2.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Danh Sách Sản Phẩm ({selectedInvoice.items?.length || 1}):
              </span>
              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                selectedInvoice.items.map((it, idx) => (
                  <div key={it.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs block leading-snug">
                          {idx + 1}. {it.name}
                        </span>
                        {it.packCode && (
                          <span className="font-mono text-[10px] text-slate-500 block">
                            Mã: {it.packCode}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-xs shrink-0">
                        {formatVndCurrency(it.totalPrice || it.quantity * it.unitPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>SL: <strong className="text-slate-700 font-mono font-bold">{it.quantity}</strong></span>
                      <span>Đơn giá: <strong className="font-mono text-slate-700">{formatVndCurrency(it.unitPrice)}</strong></span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{selectedInvoice.packTitle}</span>
                  <span className="font-mono font-bold text-slate-900">{formatVndCurrency(selectedInvoice.creditAmount)}</span>
                </div>
              )}
            </div>

            {/* 2. Desktop & Print Layout (hidden sm:block print:block): Table chuẩn mực */}
            <div className="hidden sm:block print:block overflow-x-auto">
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

            {/* Bảng Hạch Toán Đã Đổi Nhãn Theo Yêu Cầu */}
            <div className="border-t-2 border-slate-900 pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tiền hàng tạm tính:</span>
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
                <span>Tổng Tiền:</span>
                <span className="font-mono text-amber-600">
                  {formatVndCurrency(selectedInvoice.creditAmount)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-600 pt-1">
                <span>Đã Thanh Toán:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatVndCurrency(selectedInvoice.debitAmount)}
                </span>
              </div>

              {selectedInvoice.remainingAmount > 0 && (
                <div className="flex justify-between text-xs text-rose-600 font-bold pt-1">
                  <span>Còn thiếu:</span>
                  <span className="font-mono">{formatVndCurrency(selectedInvoice.remainingAmount)}</span>
                </div>
              )}
            </div>

            {/* GHI CHÚ BẢO HÀNH & KÍCH HOẠT (ĐÃ XÓA KHỐI QR CON SƯ TỬ VÀ MÃ CHA) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-black text-amber-900 block uppercase text-[10px]">
                Lưu Ý Bản Quyền &amp; Hướng Dẫn Kích Hoạt WebAR 3D:
              </span>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                Sản phẩm Thẻ Học AR Poly Cards chính hãng đã được gắn sẵn mã kích hoạt và mã QR trực tiếp trên từng mặt thẻ bài khi xuất xưởng. Ba Mẹ và các bé chỉ cần mở camera điện thoại quét trực tiếp trên mặt thẻ là có thể tương tác 3D WebAR không cần cài đặt ứng dụng.
              </p>
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
