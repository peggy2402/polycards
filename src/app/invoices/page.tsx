"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  CheckSquare,
  Square,
  HelpCircle,
  ArrowRight,
  Info,
} from "lucide-react";
import { formatVndCurrency } from "@/lib/formatters";
import { getMergedProducts, getProductCategories } from "@/lib/products-store";
import { Animal } from "@/types/animal";

export interface InvoiceLineItem {
  id: string;
  name: string;
  packCode: string;
  categorySlug: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleInvoice {
  id: string;
  code: string;
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
  directUrl: string;
  note?: string;
  createdAt: string;
  status: "PAID" | "PARTIAL";
}

// Danh mục bộ thẻ mặc định
const DEFAULT_PACK_CATALOG = [
  {
    id: "cat-animals",
    name: "Bộ 30 Thẻ AR Động Vật",
    packCode: "POLY30-DONGVAT",
    slug: "dong-vat",
    sampleSlug: "lion",
    price: 249000,
    cardsCount: 30,
  },
  {
    id: "cat-actions",
    name: "Bộ 30 Thẻ AR Hành Động",
    packCode: "POLY30-HANHDONG",
    slug: "hanh-dong",
    sampleSlug: "jump",
    price: 249000,
    cardsCount: 30,
  },
  {
    id: "cat-vehicles",
    name: "Bộ 30 Thẻ AR Xe Cộ",
    packCode: "POLY30-XECO",
    slug: "xe-co",
    sampleSlug: "car",
    price: 249000,
    cardsCount: 30,
  },
  {
    id: "cat-fruits",
    name: "Bộ 30 Thẻ AR Hoa Quả",
    packCode: "POLY30-HOAQUA",
    slug: "hoa-qua",
    sampleSlug: "apple",
    price: 249000,
    cardsCount: 30,
  },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [productsCatalog, setProductsCatalog] = useState<Animal[]>([]);

  // Hóa đơn đang chọn để xem trực quan / in
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [selectedInvoiceQrUrl, setSelectedInvoiceQrUrl] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedZalo, setCopiedZalo] = useState<boolean>(false);

  // 1. Phân loại & thông tin khách hàng
  const [customerType, setCustomerType] = useState<"TRUCTIEP" | "ONLINE">("TRUCTIEP");
  const [customerName, setCustomerName] = useState<string>("Khách Mua Trực Tiếp Tại Quầy");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>(() => `KH-${Math.floor(1000 + Math.random() * 9000)}`);

  // 2. Chế độ mua hàng: "SINGLE" | "MULTI" | "PACK"
  const [purchaseMode, setPurchaseMode] = useState<"SINGLE" | "MULTI" | "PACK">("PACK");

  // Mode 1: Single Card state
  const [singleCardSlug, setSingleCardSlug] = useState<string>("lion");
  const [cardSearchQuery, setCardSearchQuery] = useState<string>("");

  // Mode 2: Multi Cards state
  const [selectedCardSlugs, setSelectedCardSlugs] = useState<string[]>(["lion", "cat"]);
  const [multiSearchQuery, setMultiSearchQuery] = useState<string>("");
  const [multiCategoryFilter, setMultiCategoryFilter] = useState<string>("ALL");

  // Mode 3: Pack state
  const [selectedPackId, setSelectedPackId] = useState<string>("cat-animals");
  const [packCodeMode, setPackCodeMode] = useState<"AUTO" | "EXISTING">("AUTO");

  // Số lượng & Đơn giá
  const [quantity, setQuantity] = useState<number>(1);
  const [customUnitPrice, setCustomUnitPrice] = useState<number | null>(null);

  // Thuế VAT: 0% / 5% / 8% / 10% (mặc định 0%)
  const [vatRate, setVatRate] = useState<number>(0);

  // Hạch toán: Nợ & Có
  const [debitAmount, setDebitAmount] = useState<number>(249000);
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

  // Tải danh mục sản phẩm hợp nhất
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
      } catch {
        // Giữ fallback local
      }
    };
    loadCatalog();
  }, []);

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
        .catch(() => setSelectedInvoiceQrUrl(""));
    } else {
      setSelectedInvoiceQrUrl("");
    }
  }, [selectedInvoice]);

  // Cập nhật Customer ID khi đổi loại khách hoặc nhập SĐT
  useEffect(() => {
    if (customerPhone.trim().length >= 9) {
      setCustomerId(`KH-${customerPhone.trim().slice(-4)}`);
    }
  }, [customerPhone]);

  // Tìm thẻ đơn được chọn
  const currentSingleCard = useMemo(() => {
    return (
      productsCatalog.find((p) => p.slug === singleCardSlug) ||
      productsCatalog[0] ||
      ({
        id: "lion",
        slug: "lion",
        nameVi: "Con Sư Tử",
        nameEn: "Lion",
        ipa: "/ˈlaɪ.ən/",
        description: "Sư tử dũng mãnh",
        category: "Động Vật",
        categorySlug: "dong-vat",
        price: 219000,
        images: ["/images/cards/lion-template.jpg"],
        audioUrl: "",
        modelUrl: "",
        iosModelUrl: "",
        posterUrl: "/images/cards/lion-template.jpg",
        qrCode: "",
      } as Animal)
    );
  }, [productsCatalog, singleCardSlug]);

  // Danh sách thẻ được chọn ở chế độ Multi
  const selectedCardsList = useMemo(() => {
    return productsCatalog.filter((p) => selectedCardSlugs.includes(p.slug));
  }, [productsCatalog, selectedCardSlugs]);

  // Tìm bộ thẻ được chọn ở chế độ Pack
  const currentPack = useMemo(() => {
    return DEFAULT_PACK_CATALOG.find((p) => p.id === selectedPackId) || DEFAULT_PACK_CATALOG[0];
  }, [selectedPackId]);

  // Tính đơn giá chuẩn theo chế độ
  const calculatedUnitPrice = useMemo(() => {
    if (customUnitPrice !== null && customUnitPrice >= 0) {
      return customUnitPrice;
    }
    if (purchaseMode === "SINGLE") {
      return currentSingleCard.price || 219000;
    }
    if (purchaseMode === "MULTI") {
      const sum = selectedCardsList.reduce((acc, c) => acc + (c.price || 219000), 0);
      return sum > 0 ? sum : 219000;
    }
    return currentPack.price || 249000;
  }, [purchaseMode, customUnitPrice, currentSingleCard, selectedCardsList, currentPack]);

  // Tạm tính (Subtotal)
  const subtotal = useMemo(() => {
    return Math.round(calculatedUnitPrice * quantity);
  }, [calculatedUnitPrice, quantity]);

  // Tiền thuế VAT
  const vatAmount = useMemo(() => {
    if (vatRate <= 0) return 0;
    return Math.round(subtotal * (vatRate / 100));
  }, [subtotal, vatRate]);

  // Phát sinh Có = Tổng tiền khách cần trả
  const creditAmount = useMemo(() => {
    return subtotal + vatAmount;
  }, [subtotal, vatAmount]);

  // Tự động gán Phát sinh Nợ = Phát sinh Có khi người dùng chưa sửa Nợ tùy ý
  useEffect(() => {
    setDebitAmount(creditAmount);
  }, [creditAmount]);

  // Tính Còn lại (Phát sinh Nợ - Phát sinh Có)
  // âm (< 0): Trả thiếu (Khách trả thêm)
  // dương (> 0): Trả thừa (Trả lại khách)
  // 0: Trả đủ
  const balance = useMemo(() => {
    return debitAmount - creditAmount;
  }, [debitAmount, creditAmount]);

  // Chuyển loại khách
  const handleToggleCustomerType = (type: "TRUCTIEP" | "ONLINE") => {
    setCustomerType(type);
    if (type === "TRUCTIEP" && customerName.includes("Khách Đặt Hàng Online")) {
      setCustomerName("Khách Mua Trực Tiếp Tại Quầy");
    } else if (type === "ONLINE" && customerName.includes("Khách Mua Trực Tiếp")) {
      setCustomerName("Khách Đặt Hàng Online");
    }
  };

  // Toggle chọn/bỏ chọn thẻ trong chế độ Multi
  const handleToggleCardSelection = (slug: string) => {
    setSelectedCardSlugs((prev) => {
      if (prev.includes(slug)) {
        if (prev.length <= 1) {
          showToast("Vui lòng giữ ít nhất 1 thẻ được chọn.", "warning");
          return prev;
        }
        return prev.filter((s) => s !== slug);
      }
      return [...prev, slug];
    });
  };

  // Tạo phiếu hóa đơn & sinh mã bản quyền chuẩn hóa
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast("Vui lòng nhập tên khách hàng.", "warning");
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoicePrefix = customerType === "TRUCTIEP" ? "HD-DIR" : "HD-ONL";
    const invoiceCode = `${invoicePrefix}-${Date.now().toString().slice(-4)}-${randomNum}`;
    const cleanCustCode = customerId.trim() || `KH${randomNum}`;

    let licenseCode = "";
    let directUrl = "";
    let packTitle = "";
    let allowedCategorySlug = "";
    let lineItems: InvoiceLineItem[] = [];
    let unlockedSlug: string | undefined = undefined;
    let unlockedSlugs: string[] | undefined = undefined;

    if (purchaseMode === "SINGLE") {
      const catSlug = (currentSingleCard.categorySlug || "DONGVAT")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      const cardSlugUpper = currentSingleCard.slug.toUpperCase().replace(/[^A-Z0-9]/g, "");
      licenseCode = `SINGLE-${cardSlugUpper}-${catSlug}-${cleanCustCode}-${invoiceCode}`;
      const cardTitle = currentSingleCard.nameVi || currentSingleCard.nameEn || currentSingleCard.slug;
      packTitle = `Thẻ Lẻ: ${cardTitle} (${currentSingleCard.nameEn || currentSingleCard.slug})`;
      allowedCategorySlug = currentSingleCard.categorySlug || "dong-vat";
      directUrl = `https://polycards-one.vercel.app/ar/${currentSingleCard.slug}?ar=1&code=${licenseCode}`;
      unlockedSlug = currentSingleCard.slug;
      lineItems = [
        {
          id: currentSingleCard.id || currentSingleCard.slug,
          name: packTitle,
          packCode: licenseCode,
          categorySlug: allowedCategorySlug,
          quantity,
          unitPrice: calculatedUnitPrice,
          totalPrice: subtotal,
        },
      ];
    } else if (purchaseMode === "MULTI") {
      const count = selectedCardsList.length;
      const catSummaries = Array.from(
        new Set(selectedCardsList.map((c) => (c.categorySlug || "THE").toUpperCase().replace(/[^A-Z0-9]/g, "")))
      );
      const catTag = catSummaries.length === 1 ? catSummaries[0] : "TONGHOP";
      licenseCode = `MULTI-${count}THE-${catTag}-${cleanCustCode}-${invoiceCode}`;
      packTitle = `Combo ${count} Thẻ Tùy Chọn (${selectedCardsList.map((c) => c.nameVi || c.nameEn).slice(0, 3).join(", ")}${
        count > 3 ? "..." : ""
      })`;
      allowedCategorySlug = catSummaries[0] || "dong-vat";
      const firstSlug = selectedCardsList[0]?.slug || "lion";
      directUrl = `https://polycards-one.vercel.app/ar/${firstSlug}?ar=1&code=${licenseCode}`;
      unlockedSlugs = selectedCardsList.map((c) => c.slug);
      lineItems = selectedCardsList.map((card) => ({
        id: card.id || card.slug,
        name: card.nameVi || card.nameEn || card.slug,
        packCode: licenseCode,
        categorySlug: card.categorySlug || "dong-vat",
        quantity,
        unitPrice: card.price || 219000,
        totalPrice: (card.price || 219000) * quantity,
      }));
    } else {
      // PACK Mode
      const catUpper = currentPack.slug.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (packCodeMode === "AUTO") {
        licenseCode = `PACK-${catUpper}-${cleanCustCode}-${invoiceCode}`;
      } else {
        licenseCode = `${currentPack.packCode}-${randomNum}`;
      }
      packTitle = currentPack.name;
      allowedCategorySlug = currentPack.slug;
      directUrl = `https://polycards-one.vercel.app/ar/${currentPack.sampleSlug}?ar=1&code=${licenseCode}`;
      lineItems = [
        {
          id: currentPack.id,
          name: currentPack.name,
          packCode: licenseCode,
          categorySlug: currentPack.slug,
          quantity,
          unitPrice: calculatedUnitPrice,
          totalPrice: subtotal,
        },
      ];
    }

    const newInvoice: SaleInvoice = {
      id: `INV-${Date.now()}`,
      code: invoiceCode,
      customerType,
      customerId: cleanCustCode,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      codeType: purchaseMode,
      unlockedSlug,
      unlockedSlugs,
      items: lineItems,
      subtotal,
      vatRate,
      vatAmount,
      creditAmount,
      debitAmount,
      balanceAmount: balance,
      remainingAmount: creditAmount - debitAmount,
      paymentMethod,
      packTitle,
      packCode: licenseCode,
      allowedCategorySlug,
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
      } else {
        showToast(data.message || "Không thể lưu hóa đơn.", "error");
      }
    } catch (err: any) {
      showToast(`Lỗi tạo hóa đơn: ${err.message}`, "error");
    }
  };

  // In hóa đơn trực tiếp
  const handlePrintInvoice = () => {
    window.print();
  };

  // Sao chép mã bản quyền
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(`Đã sao chép mã bản quyền: ${code}`, "success");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Soạn tin nhắn Zalo gửi khách
  const handleCopyZaloMessage = (inv: SaleInvoice) => {
    const msg = `Kính chào quý khách ${inv.customerName},
Poly Cards trân trọng gửi quý khách Hóa Đơn Bán Hàng & Mã Kích Hoạt WebAR:
- Số Hóa Đơn: ${inv.code}
- Khách hàng: ${inv.customerName} (${inv.customerId || "KH"})
- Sản phẩm: ${inv.packTitle}
- Tạm tính: ${formatVndCurrency(inv.subtotal || inv.creditAmount)}
${inv.vatRate ? `- Thuế VAT (${inv.vatRate}%): ${formatVndCurrency(inv.vatAmount || 0)}\n` : ""}- Tổng thanh toán (Phát sinh Có): ${formatVndCurrency(inv.creditAmount)}
- Đã thanh toán (Phát sinh Nợ): ${formatVndCurrency(inv.debitAmount)}
- Hình thức: ${inv.paymentMethod === "TIEN_MAT" ? "Tiền mặt" : "Chuyển khoản"}
- Mã Kích Hoạt Bản Quyền: ${inv.packCode}
- Link mở WebAR 1-chạm: ${inv.directUrl}

(Hướng dẫn: Quý khách nhấn vào link trên, camera WebAR sẽ tự động mở và mở khóa thẻ bài tương ứng trên điện thoại của quý khách!).
Cảm ơn quý khách đã tin dùng Poly Cards!`;

    navigator.clipboard.writeText(msg);
    setCopiedZalo(true);
    showToast("Đã sao chép tin nhắn Zalo kèm mã bản quyền!", "success");
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  // Lọc thẻ phục vụ tab Multi
  const filteredProductsForMulti = useMemo(() => {
    return productsCatalog.filter((card) => {
      if (multiCategoryFilter !== "ALL" && card.categorySlug !== multiCategoryFilter) {
        return false;
      }
      if (multiSearchQuery.trim()) {
        const q = multiSearchQuery.toLowerCase();
        const matchName = (card.nameVi || "").toLowerCase().includes(q);
        const matchEn = (card.nameEn || "").toLowerCase().includes(q);
        const matchSlug = card.slug.toLowerCase().includes(q);
        if (!matchName && !matchEn && !matchSlug) return false;
      }
      return true;
    });
  }, [productsCatalog, multiCategoryFilter, multiSearchQuery]);

  // Lọc thẻ phục vụ tab Single
  const filteredProductsForSingle = useMemo(() => {
    if (!cardSearchQuery.trim()) return productsCatalog;
    const q = cardSearchQuery.toLowerCase();
    return productsCatalog.filter((card) => {
      const matchName = (card.nameVi || "").toLowerCase().includes(q);
      const matchEn = (card.nameEn || "").toLowerCase().includes(q);
      const matchSlug = card.slug.toLowerCase().includes(q);
      return matchName || matchEn || matchSlug;
    });
  }, [productsCatalog, cardSearchQuery]);

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* ========================================================
          HEADER NAVIGATION: ĐẦY ĐỦ CÁC PHÂN HỆ STUDIO & POS
         ======================================================== */}
      <header className="border-b border-white/10 bg-stone-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-wide uppercase text-white">
                  Phân Hệ Hóa Đơn Bán Hàng (POS)
                </h1>
                <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live POS
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Lập hóa đơn, tự động sinh mã thẻ/bộ &amp; hạch toán trực tiếp
              </p>
            </div>
          </div>

          {/* CÁC NÚT ĐIỀU HƯỚNG NHANH SANG STUDIO & TABS */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-stretch sm:self-auto">
            <Link
              href="/tools?tab=products"
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/10"
            >
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>Kho Thẻ Bài</span>
            </Link>

            <Link
              href="/tools?tab=licenses"
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/10"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
              <span>Quản Lý Mã Thẻ/Bộ</span>
            </Link>

            <Link
              href="/tools?tab=invoices"
              className="py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-amber-500/30"
            >
              <Receipt className="h-3.5 w-3.5 text-amber-400" />
              <span>Quản Lý Hóa Đơn</span>
            </Link>

            <Link
              href="/tools?tab=customers"
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/10"
            >
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span>Khách Hàng</span>
            </Link>

            <button
              type="button"
              onClick={loadInvoices}
              className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 font-bold text-xs flex items-center gap-1 border border-white/10 transition-colors"
              title="Đồng bộ hóa đơn"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          BODY: CHIA 2 CỘT (POS FORM LẬP HÓA ĐƠN & PREVIEW IN ẤN)
         ======================================================== */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (5/12): FORM LẬP PHIẾU HÓA ĐƠN BÁN HÀNG */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4 print:hidden">
          <div className="rounded-3xl bg-stone-900/90 border border-amber-400/40 p-5 shadow-2xl shadow-amber-950/20 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase text-amber-300">
                    Lập Phiếu Hóa Đơn Bán Hàng
                  </h2>
                  <p className="text-[10px] text-stone-400">
                    Chọn thẻ/bộ, thuế VAT &amp; tự động sinh mã bản quyền chuẩn
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {/* 1. ĐỐI TƯỢNG KHÁCH HÀNG */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-300">
                  1. Đối Tượng Khách Hàng *:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleCustomerType("TRUCTIEP")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      customerType === "TRUCTIEP"
                        ? "bg-amber-500 text-stone-950 font-black border-amber-400 shadow-md shadow-amber-500/20"
                        : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Khách Trực Tiếp Tại Quầy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleCustomerType("ONLINE")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      customerType === "ONLINE"
                        ? "bg-sky-500 text-white font-black border-sky-400 shadow-md shadow-sky-500/20"
                        : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Khách Đặt Hàng Online</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Tên khách hàng *:
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ví dụ: Anh Dũng, Chị Mai..."
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Mã KH:
                    </label>
                    <input
                      type="text"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Số điện thoại / Zalo:
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0912..."
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Địa chỉ nhận hàng (nếu có):
                    </label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Số nhà, đường, quận/huyện..."
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 2. CHỌN HÌNH THỨC MUA HÀNG (3 CHẾ ĐỘ) */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase text-amber-300">
                    2. Chọn Thẻ Hoặc Bộ Mua *:
                  </label>
                  <span className="text-[10px] text-stone-400">
                    3 hình thức bán linh hoạt
                  </span>
                </div>

                {/* TAB CHUYỂN 3 CHẾ ĐỘ: 1 THẺ / NHIỀU THẺ / THEO BỘ */}
                <div className="grid grid-cols-3 gap-1 bg-stone-950 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseMode("SINGLE");
                      setCustomUnitPrice(null);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                      purchaseMode === "SINGLE"
                        ? "bg-amber-500 text-stone-950 font-black shadow"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    1. Chọn 1 thẻ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseMode("MULTI");
                      setCustomUnitPrice(null);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                      purchaseMode === "MULTI"
                        ? "bg-amber-500 text-stone-950 font-black shadow"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    2. Chọn nhiều thẻ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseMode("PACK");
                      setCustomUnitPrice(null);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                      purchaseMode === "PACK"
                        ? "bg-amber-500 text-stone-950 font-black shadow"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    3. Chọn theo bộ
                  </button>
                </div>

                {/* GIAO DIỆN CHẾ ĐỘ 1: CHỌN 1 THẺ */}
                {purchaseMode === "SINGLE" && (
                  <div className="space-y-2.5 pt-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-500" />
                      <input
                        type="text"
                        placeholder="Tìm thẻ lẻ theo tên tiếng Việt hoặc tiếng Anh..."
                        value={cardSearchQuery}
                        onChange={(e) => setCardSearchQuery(e.target.value)}
                        className="w-full bg-stone-900 border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {filteredProductsForSingle.slice(0, 15).map((card) => {
                        const isSelected = singleCardSlug === card.slug;
                        return (
                          <div
                            key={card.slug}
                            onClick={() => setSingleCardSlug(card.slug)}
                            className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "bg-amber-500/20 border-amber-400 text-white"
                                : "bg-black/30 border-white/10 text-stone-300 hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-9 w-7 rounded-md bg-stone-800 overflow-hidden shrink-0 border border-white/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={card.images?.[0] || card.posterUrl || "/images/cards/lion-template.jpg"}
                                  alt={card.nameVi || card.nameEn}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate text-white">{card.nameVi || card.nameEn}</div>
                                <div className="text-[10px] text-stone-400 truncate">
                                  {card.nameEn || card.slug} &bull; {card.category || "Động Vật"}
                                </div>
                              </div>
                            </div>
                            <span className="font-mono text-xs font-bold text-amber-300 shrink-0">
                              {formatVndCurrency(card.price || 219000)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-center justify-between">
                      <span>Định dạng mã:</span>
                      <code className="font-mono text-[10px] text-amber-300 font-bold">
                        SINGLE-{currentSingleCard.slug.toUpperCase()}-...-{customerId}
                      </code>
                    </div>
                  </div>
                )}

                {/* GIAO DIỆN CHẾ ĐỘ 2: CHỌN NHIỀU THẺ */}
                {purchaseMode === "MULTI" && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-500" />
                        <input
                          type="text"
                          placeholder="Tìm thẻ..."
                          value={multiSearchQuery}
                          onChange={(e) => setMultiSearchQuery(e.target.value)}
                          className="w-full bg-stone-900 border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                      <select
                        value={multiCategoryFilter}
                        onChange={(e) => setMultiCategoryFilter(e.target.value)}
                        className="bg-stone-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
                      >
                        <option value="ALL">Tất cả danh mục</option>
                        <option value="dong-vat">Động Vật</option>
                        <option value="hanh-dong">Hành Động</option>
                        <option value="xe-co">Xe Cộ</option>
                        <option value="hoa-qua">Hoa Quả</option>
                      </select>
                    </div>

                    {/* Chips danh sách thẻ đã chọn */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-stone-400 font-bold">
                        <span>Đã chọn: <strong className="text-amber-400">{selectedCardSlugs.length}</strong> thẻ</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCardSlugs([])}
                          className="text-[10px] text-rose-400 hover:underline"
                        >
                          Xóa hết
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1.5 rounded-xl bg-black/40 border border-white/10">
                        {selectedCardsList.map((card) => (
                          <span
                            key={card.slug}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] font-bold"
                          >
                            <span>{card.nameVi || card.nameEn}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleCardSelection(card.slug)}
                              className="text-stone-400 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Danh sách thẻ cho phép tick chọn */}
                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                      {filteredProductsForMulti.slice(0, 20).map((card) => {
                        const isChecked = selectedCardSlugs.includes(card.slug);
                        return (
                          <div
                            key={card.slug}
                            onClick={() => handleToggleCardSelection(card.slug)}
                            className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? "bg-amber-500/15 border-amber-400 text-white"
                                : "bg-black/30 border-white/10 text-stone-400 hover:text-stone-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-amber-400 shrink-0" />
                              ) : (
                                <Square className="h-4 w-4 text-stone-500 shrink-0" />
                              )}
                              <span className="text-xs font-bold">{card.nameVi || card.nameEn}</span>
                              <span className="text-[10px] text-stone-500">({card.category})</span>
                            </div>
                            <span className="font-mono text-xs font-bold text-amber-300">
                              {formatVndCurrency(card.price || 219000)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-center justify-between">
                      <span>Định dạng mã:</span>
                      <code className="font-mono text-[10px] text-amber-300 font-bold">
                        MULTI-{selectedCardSlugs.length}THE-...-{customerId}
                      </code>
                    </div>
                  </div>
                )}

                {/* GIAO DIỆN CHẾ ĐỘ 3: CHỌN THEO BỘ */}
                {purchaseMode === "PACK" && (
                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-1 gap-1.5">
                      {DEFAULT_PACK_CATALOG.map((pack) => (
                        <label
                          key={pack.id}
                          onClick={() => setSelectedPackId(pack.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            selectedPackId === pack.id
                              ? "bg-amber-500/15 border-amber-400 text-white"
                              : "bg-black/30 border-white/10 text-stone-400 hover:text-stone-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="packSelection"
                              checked={selectedPackId === pack.id}
                              onChange={() => setSelectedPackId(pack.id)}
                              className="text-amber-500 focus:ring-0 h-3.5 w-3.5"
                            />
                            <span className="text-xs font-bold">{pack.name}</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-amber-300">
                            {formatVndCurrency(pack.price)}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Tùy chọn sinh mã bộ */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPackCodeMode("AUTO")}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                          packCodeMode === "AUTO"
                            ? "bg-amber-500/20 border-amber-400 text-amber-200"
                            : "bg-black/40 border-white/10 text-stone-400"
                        }`}
                      >
                        Tự sinh mã bộ mới
                      </button>
                      <button
                        type="button"
                        onClick={() => setPackCodeMode("EXISTING")}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                          packCodeMode === "EXISTING"
                            ? "bg-amber-500/20 border-amber-400 text-amber-200"
                            : "bg-black/40 border-white/10 text-stone-400"
                        }`}
                      >
                        Dùng mã bộ có sẵn ({currentPack.packCode})
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-center justify-between">
                      <span>Định dạng mã:</span>
                      <code className="font-mono text-[10px] text-amber-300 font-bold">
                        {packCodeMode === "AUTO"
                          ? `PACK-${currentPack.slug.toUpperCase()}-...-${customerId}`
                          : `${currentPack.packCode}-...`}
                      </code>
                    </div>
                  </div>
                )}

                {/* SỐ LƯỢNG & ĐƠN GIÁ & THUẾ VAT */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5 font-bold">
                      Số lượng:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-bold text-center focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5 font-bold">
                      Đơn giá:
                    </label>
                    <input
                      type="number"
                      value={calculatedUnitPrice}
                      onChange={(e) => setCustomUnitPrice(Number(e.target.value) || 0)}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono font-bold text-center focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5 font-bold">
                      Thuế VAT:
                    </label>
                    <select
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value))}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-2 py-1.5 text-xs text-stone-200 font-bold text-center focus:outline-hidden focus:border-amber-400 cursor-pointer"
                    >
                      <option value={0}>0% (Không thuế)</option>
                      <option value={5}>5% VAT</option>
                      <option value={8}>8% VAT</option>
                      <option value={10}>10% VAT</option>
                    </select>
                  </div>
                </div>

                {/* HIỂN THỊ TẠM TÍNH & VAT */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-stone-400">
                    <span>Tạm tính ({quantity} {purchaseMode === "PACK" ? "bộ" : "thẻ"}):</span>
                    <span className="font-mono font-bold text-stone-300">{formatVndCurrency(subtotal)}</span>
                  </div>
                  {vatRate > 0 && (
                    <div className="flex items-center justify-between text-stone-400">
                      <span>Tiền thuế VAT ({vatRate}%):</span>
                      <span className="font-mono font-bold text-amber-300">+{formatVndCurrency(vatAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. HẠCH TOÁN & THANH TOÁN (PHÁT SINH CÓ, NỢ & CÒN LẠI) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/10 to-black/80 border-2 border-amber-400/50 space-y-3">
                <div className="text-xs font-black uppercase text-amber-300 flex items-center justify-between">
                  <span>3. Hạch Toán &amp; Thanh Toán</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    Chuẩn Kế Toán Bán Lẻ
                  </span>
                </div>

                {/* Phát Sinh Có */}
                <div className="p-2.5 rounded-xl bg-black/80 border border-amber-400/30 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-black text-amber-300">
                      Phát Sinh Có (Cần Phải Trả):
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Tổng tiền cần thanh toán (đã gồm VAT)
                    </span>
                  </div>
                  <span className="font-mono text-base font-black text-amber-300">
                    {formatVndCurrency(creditAmount)}
                  </span>
                </div>

                {/* Phát Sinh Nợ */}
                <div className="p-2.5 rounded-xl bg-black/80 border border-white/20 space-y-1.5">
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
                    className="w-full bg-black border border-emerald-400/60 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-black focus:outline-hidden focus:border-emerald-300"
                  />
                </div>

                {/* CÒN LẠI (DƯỚI PHÁT SINH NỢ) THEO 3 TRẠNG THÁI: ÂM / DƯƠNG / 0 */}
                <div className="p-2.5 rounded-xl bg-black/90 border border-white/10 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-stone-300 block">Còn Lại:</span>
                    <span className="text-[10px] text-stone-500">(Phát sinh Nợ - Phát sinh Có)</span>
                  </div>

                  {balance < 0 ? (
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-black text-xs">
                        Trả thiếu: {formatVndCurrency(Math.abs(balance))} (Khách trả thêm)
                      </span>
                    </div>
                  ) : balance > 0 ? (
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 font-mono font-black text-xs">
                        Trả thừa: +{formatVndCurrency(balance)} (Trả lại khách)
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xs">
                        Trả đủ (0 đ)
                      </span>
                    </div>
                  )}
                </div>

                {/* HÌNH THỨC THANH TOÁN */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1.5">
                    Hình thức thanh toán *:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("TIEN_MAT")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                        paymentMethod === "TIEN_MAT"
                          ? "bg-emerald-500 text-stone-950 font-black border-emerald-400 shadow-md shadow-emerald-500/20"
                          : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                      }`}
                    >
                      <Banknote className="h-4 w-4" />
                      <span>Tiền Mặt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CHUYEN_KHOAN")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                        paymentMethod === "CHUYEN_KHOAN"
                          ? "bg-sky-500 text-white font-black border-sky-400 shadow-md shadow-sky-500/20"
                          : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Chuyển Khoản</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* GHI CHÚ */}
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Ghi chú hóa đơn:
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="In tem kèm / Quà tặng thêm / Khách quen..."
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* NÚT TẠO PHIẾU HÓA ĐƠN */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Receipt className="h-4 w-4" />
                <span>Lập Phiếu &amp; Xuất Hóa Đơn Bán Hàng</span>
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI (7/12): XEM TRỰC QUAN PHIẾU HÓA ĐƠN & IN ẤN */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          {selectedInvoice ? (
            <div className="space-y-4">
              {/* THANH THAO TÁC NHANH TRÊN HÓA ĐƠN ĐANG CHỌN */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-stone-900 border border-white/10 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-400 font-mono">
                    {selectedInvoice.code}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      selectedInvoice.customerType === "TRUCTIEP"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    }`}
                  >
                    {selectedInvoice.customerType === "TRUCTIEP" ? "Khách Trực Tiếp" : "Khách Online"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyZaloMessage(selectedInvoice)}
                    className="py-1.5 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors border border-emerald-500/30"
                    title="Sao chép tin nhắn Zalo gửi khách"
                  >
                    {copiedZalo ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedZalo ? "Đã Chép" : "Chép Zalo"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintInvoice}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>In Hóa Đơn</span>
                  </button>

                  <Link
                    href="/tools?tab=invoices"
                    className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 font-bold text-xs flex items-center gap-1 transition-colors border border-white/10"
                    title="Mở Quản Lý Hóa Đơn"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Quản Lý Hóa Đơn</span>
                  </Link>
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
                      Website: polycards-one.vercel.app &bull; Hotline: 0988.xxx.xxx
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
                        selectedInvoice.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 font-bold text-slate-900">
                              <div>{item.name}</div>
                              <span className="font-mono text-[10px] text-slate-400">
                                Mã: {item.packCode}
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-bold text-slate-800">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 text-right font-mono text-slate-700">
                              {formatVndCurrency(item.unitPrice)}
                            </td>
                            <td className="py-2.5 text-right font-mono font-black text-slate-900">
                              {formatVndCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-2.5 text-slate-400 font-mono">1</td>
                          <td className="py-2.5 font-bold text-slate-900">
                            <div>{selectedInvoice.packTitle}</div>
                            <span className="font-mono text-[10px] text-slate-400">
                              Mã: {selectedInvoice.packCode}
                            </span>
                          </td>
                          <td className="py-2.5 text-center font-bold text-slate-800">1</td>
                          <td className="py-2.5 text-right font-mono text-slate-700">
                            {formatVndCurrency(selectedInvoice.creditAmount)}
                          </td>
                          <td className="py-2.5 text-right font-mono font-black text-slate-900">
                            {formatVndCurrency(selectedInvoice.creditAmount)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bảng Kế Toán: Tạm Tính, Thuế, Phát Sinh Có, Nợ & Còn Lại */}
                <div className="border-t-2 border-slate-900 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính:</span>
                    <span className="font-mono font-bold">
                      {formatVndCurrency(selectedInvoice.subtotal || selectedInvoice.creditAmount)}
                    </span>
                  </div>

                  {selectedInvoice.vatRate ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Thuế VAT ({selectedInvoice.vatRate}%):</span>
                      <span className="font-mono font-bold">
                        +{formatVndCurrency(selectedInvoice.vatAmount || 0)}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>Phát Sinh Có (Cần Phải Trả):</span>
                    <span className="font-mono text-base text-amber-600">
                      {formatVndCurrency(selectedInvoice.creditAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-bold text-emerald-700">
                    <span>Phát Sinh Nợ (Đã Trả Ngay):</span>
                    <span className="font-mono">
                      {formatVndCurrency(selectedInvoice.debitAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-dashed border-slate-300">
                    <span>Còn Lại:</span>
                    {selectedInvoice.debitAmount < selectedInvoice.creditAmount ? (
                      <span className="font-mono text-rose-600 font-black">
                        Trả thiếu: {formatVndCurrency(selectedInvoice.creditAmount - selectedInvoice.debitAmount)} (Khách trả thêm)
                      </span>
                    ) : selectedInvoice.debitAmount > selectedInvoice.creditAmount ? (
                      <span className="font-mono text-sky-700 font-black">
                        Trả thừa: +{formatVndCurrency(selectedInvoice.debitAmount - selectedInvoice.creditAmount)} (Trả lại khách)
                      </span>
                    ) : (
                      <span className="font-mono text-emerald-700 font-black">
                        Trả đủ (0 đ)
                      </span>
                    )}
                  </div>
                </div>

                {/* Khối Thông Tin Kích Hoạt Bản Quyền WebAR 1-Chạm */}
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                      MÃ BẢN QUYỀN WEBAR KÍCH HOẠT ĐI KÈM
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs sm:text-sm font-mono font-black text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded-lg break-all">
                        {selectedInvoice.packCode}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(selectedInvoice.packCode)}
                        className="p-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 shrink-0 print:hidden"
                        title="Sao chép mã"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      Quét mã QR bên cạnh để mở khóa tự động camera WebAR cho các thẻ thuộc hóa đơn này.
                    </p>
                  </div>

                  {/* QR Image */}
                  {selectedInvoiceQrUrl && (
                    <div className="h-24 w-24 rounded-xl bg-white p-1 border-2 border-amber-300 shrink-0 shadow-sm flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedInvoiceQrUrl}
                        alt="QR Kích Hoạt 1-Chạm"
                        className="h-full w-full object-contain"
                      />
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
            </div>
          ) : (
            <div className="rounded-3xl bg-stone-900/50 border border-white/10 p-12 text-center text-stone-500 space-y-3">
              <Receipt className="h-12 w-12 text-stone-700 mx-auto" />
              <p className="text-sm">Chưa có hóa đơn nào được chọn để hiển thị.</p>
              <p className="text-xs text-stone-600">
                Hãy lập phiếu hóa đơn mới bên cột trái!
              </p>
            </div>
          )}
        </div>
      </main>

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
