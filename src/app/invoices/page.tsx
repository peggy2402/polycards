"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  FileText,
  Printer,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  Layers,
  Send,
  CreditCard,
  Banknote,
  Receipt,
  User,
  Phone,
  MapPin,
  Calendar,
  X,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { formatVndCurrency } from "@/lib/formatters";

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
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceLineItem[];
  creditAmount: number; // Phát sinh Có: Số tiền khách hàng cần phải trả
  debitAmount: number; // Phát sinh Nợ: Số tiền khách hàng đã trả ngay
  remainingAmount: number; // Còn lại
  totalPrice?: number;
  paymentMethod: "TIEN_MAT" | "CHUYEN_KHOAN";
  packTitle: string;
  packCode: string;
  allowedCategorySlug: string;
  directUrl: string;
  note?: string;
  createdAt: string;
  status: "PAID" | "PARTIAL";
}

// Danh sách các bộ thẻ chuẩn có sẵn của Poly Cards
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"ALL" | "TRUCTIEP" | "ONLINE">("ALL");
  const [filterPayment, setFilterPayment] = useState<"ALL" | "TIEN_MAT" | "CHUYEN_KHOAN">("ALL");

  // Hóa đơn đang chọn để xem trực quan / in
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [selectedInvoiceQrUrl, setSelectedInvoiceQrUrl] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedZalo, setCopiedZalo] = useState<boolean>(false);

  // Form Lập Hóa Đơn Mới
  const [customerType, setCustomerType] = useState<"TRUCTIEP" | "ONLINE">("TRUCTIEP");
  const [customerName, setCustomerName] = useState<string>("Khách Mua Trực Tiếp Tại Quầy");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [selectedPackId, setSelectedPackId] = useState<string>("cat-animals");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(249000);
  const [paymentMethod, setPaymentMethod] = useState<"TIEN_MAT" | "CHUYEN_KHOAN">("TIEN_MAT");

  // Tài chính: Phát sinh Có & Phát sinh Nợ
  // Phát sinh Có = Số tiền khách cần phải trả (mặc định = quantity * unitPrice)
  const creditAmount = quantity * unitPrice;
  // Phát sinh Nợ = Số tiền khách đã thanh toán ngay
  const [debitAmount, setDebitAmount] = useState<number>(249000);
  const [note, setNote] = useState<string>("");

  // Toast & Modal Xác Nhận
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: string }>>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showToast = useCallback((message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Tự động đồng bộ Phát sinh Nợ khi Phát sinh Có thay đổi (nếu khách trả đủ ngay)
  useEffect(() => {
    setDebitAmount(creditAmount);
  }, [creditAmount]);

  // Cập nhật tên mặc định theo loại khách
  const handleToggleCustomerType = (type: "TRUCTIEP" | "ONLINE") => {
    setCustomerType(type);
    if (type === "TRUCTIEP" && customerName.includes("Khách Đặt Hàng Online")) {
      setCustomerName("Khách Mua Trực Tiếp Tại Quầy");
    } else if (type === "ONLINE" && customerName.includes("Khách Mua Trực Tiếp")) {
      setCustomerName("Khách Đặt Hàng Online");
    }
  };

  // Cập nhật giá khi đổi bộ thẻ
  const handleSelectPack = (packId: string) => {
    setSelectedPackId(packId);
    const found = DEFAULT_PACK_CATALOG.find((p) => p.id === packId);
    if (found) {
      setUnitPrice(found.price);
    }
  };

  // Tải danh sách hóa đơn từ API backend
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

  // Xử lý tạo Phiếu Hóa Đơn Bán Hàng Mới
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast("Vui lòng nhập tên khách hàng.", "warning");
      return;
    }

    const pack = DEFAULT_PACK_CATALOG.find((p) => p.id === selectedPackId) || DEFAULT_PACK_CATALOG[0];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoicePrefix = customerType === "TRUCTIEP" ? "HD-DIR" : "HD-ONL";
    const invoiceCode = `${invoicePrefix}-${Date.now().toString().slice(-4)}-${randomNum}`;

    // Mã bản quyền theo bộ thẻ đã chọn
    const licenseCode = `${pack.packCode}-${randomNum}`;
    const directUrl = `https://polycards-one.vercel.app/ar/${pack.sampleSlug}?ar=1&code=${licenseCode}`;

    const remaining = creditAmount - debitAmount;

    const newInvoice: SaleInvoice = {
      id: `INV-${Date.now()}`,
      code: invoiceCode,
      customerType,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      items: [
        {
          id: pack.id,
          name: pack.name,
          packCode: licenseCode,
          categorySlug: pack.slug,
          quantity,
          unitPrice,
          totalPrice: creditAmount,
        },
      ],
      creditAmount, // Phát sinh Có
      debitAmount, // Phát sinh Nợ
      remainingAmount: remaining,
      paymentMethod,
      packTitle: pack.name,
      packCode: licenseCode,
      allowedCategorySlug: pack.slug,
      directUrl,
      note: note.trim() || (customerType === "TRUCTIEP" ? "Khách mua trực tiếp tại quầy" : "Đơn hàng online"),
      createdAt: new Date().toLocaleString("vi-VN"),
      status: remaining <= 0 ? "PAID" : "PARTIAL",
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoice),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã lập hóa đơn ${invoiceCode} thành công!`, "success");
        setInvoices((prev) => [newInvoice, ...prev]);
        setSelectedInvoice(newInvoice);
        // Reset form ghi chú
        setNote("");
      } else {
        showToast(data.message || "Không thể lưu hóa đơn.", "error");
      }
    } catch (err: any) {
      showToast(`Lỗi tạo hóa đơn: ${err.message}`, "error");
    }
  };

  // Xóa hóa đơn
  const handleDeleteInvoice = (inv: SaleInvoice) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa Hóa Đơn Bán Hàng",
      message: `Bạn có chắc chắn muốn xóa hóa đơn "${inv.code}" của khách hàng "${inv.customerName}" không? Dữ liệu này sẽ được xóa khỏi hệ thống.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/orders?code=${encodeURIComponent(inv.code)}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            setInvoices((prev) => prev.filter((i) => i.code !== inv.code));
            if (selectedInvoice?.code === inv.code) {
              setSelectedInvoice(null);
            }
            showToast(`Đã xóa hóa đơn ${inv.code}`, "info");
          }
        } catch {
          showToast("Lỗi khi xóa hóa đơn.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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
Poly Cards trân trọng gửi quý khách Hóa Đơn Bán Hàng & Mã Kích Hoạt AR:
- Số Hóa Đơn: ${inv.code}
- Sản phẩm: ${inv.packTitle}
- Phát sinh Có (Cần thanh toán): ${formatVndCurrency(inv.creditAmount)}
- Phát sinh Nợ (Đã thanh toán): ${formatVndCurrency(inv.debitAmount)}
- Hình thức: ${inv.paymentMethod === "TIEN_MAT" ? "Tiền mặt" : "Chuyển khoản"}
- Mã Bản Quyền Bộ 30 Thẻ: ${inv.packCode}
- Link mở WebAR 1-chạm: ${inv.directUrl}

(Hướng dẫn: Quý khách bấm vào link trên, camera WebAR sẽ tự động mở và kích hoạt trọn bộ 30 thẻ bài của bộ này trên điện thoại của quý khách!).
Cảm ơn quý khách đã tin dùng Poly Cards!`;

    navigator.clipboard.writeText(msg);
    setCopiedZalo(true);
    showToast("Đã sao chép tin nhắn Zalo kèm mã bản quyền!", "success");
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  // Lọc hóa đơn theo bộ lọc
  const filteredInvoices = invoices.filter((inv) => {
    if (filterType !== "ALL" && inv.customerType !== filterType) return false;
    if (filterPayment !== "ALL" && inv.paymentMethod !== filterPayment) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = inv.code.toLowerCase().includes(q);
      const matchName = inv.customerName.toLowerCase().includes(q);
      const matchPhone = inv.customerPhone?.toLowerCase().includes(q);
      const matchPack = inv.packTitle.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchPhone && !matchPack) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* ========================================================
          HEADER NAVIGATION MODULE HÓA ĐƠN
         ======================================================== */}
      <header className="sticky top-0 z-40 bg-stone-900/95 border-b border-white/10 backdrop-blur-md px-4 sm:px-6 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="h-10 w-10 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 transition-colors"
              title="Về Trang Chủ"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-400" />
                <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
                  Phân Hệ Hóa Đơn Bán Hàng (POS)
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Poly Cards POS
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Lập phiếu hóa đơn, quy ước Phát Sinh Nợ/Có, thanh toán &amp; cấp mã bản quyền bộ thẻ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Link
              href="/tools"
              className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/10"
            >
              <Layers className="h-4 w-4 text-amber-400" />
              <span>Chế Bản Thẻ &amp; QR Studio</span>
            </Link>

            <button
              type="button"
              onClick={loadInvoices}
              className="py-2 px-3 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center gap-1 border border-amber-400/20 transition-colors"
              title="Tải lại danh sách hóa đơn"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Đồng Bộ</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          BODY: CHIA 2 CỘT CHUYÊN BIỆT (POS FORM & INVOICE PREVIEW)
         ======================================================== */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (5/12): FORM LẬP PHIẾU HÓA ĐƠN BÁN HÀNG */}
        <div className="lg:col-span-5 space-y-5 print:hidden">
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
                    Thu tiền, hạch toán &amp; tự động cấp mã bản quyền
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {/* 1. Phân Loại Khách Hàng (Trực Tiếp / Online) */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  1. Đối Tượng Khách Hàng *:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleCustomerType("TRUCTIEP")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      customerType === "TRUCTIEP"
                        ? "bg-amber-500 text-stone-950 font-black border-amber-400 shadow-md shadow-amber-500/20 scale-102"
                        : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Khách Mua Trực Tiếp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleCustomerType("ONLINE")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      customerType === "ONLINE"
                        ? "bg-sky-500 text-white font-black border-sky-400 shadow-md shadow-sky-500/20 scale-102"
                        : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Khách Đặt Online</span>
                  </button>
                </div>
              </div>

              {/* 2. Thông Tin Khách Hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
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
              </div>

              {customerType === "ONLINE" && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Địa chỉ giao hàng (nếu có):
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Số nhà, đường, quận/huyện, tỉnh thành..."
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-sky-400"
                  />
                </div>
              )}

              {/* 3. Chọn Bộ Thẻ Sản Phẩm Cần Bán */}
              <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-2.5">
                <label className="block text-xs font-black uppercase text-amber-300">
                  2. Chọn Bộ Thẻ Mua *:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {DEFAULT_PACK_CATALOG.map((pack) => (
                    <label
                      key={pack.id}
                      onClick={() => handleSelectPack(pack.id)}
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
                          onChange={() => handleSelectPack(pack.id)}
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

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5 font-bold">
                      Số lượng bộ:
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
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono font-bold text-center focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Kế Toán & Thu Ngân (Quy ước: Phát Sinh Có & Phát Sinh Nợ) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/10 to-black/80 border-2 border-amber-400/50 space-y-3">
                <div className="text-xs font-black uppercase text-amber-300 flex items-center justify-between">
                  <span>3. Hạch Toán &amp; Thanh Toán</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    Quy tắc Kế toán bán lẻ
                  </span>
                </div>

                {/* Phát Sinh Có */}
                <div className="p-2.5 rounded-xl bg-black/80 border border-amber-400/30 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-black text-amber-300">
                      Phát Sinh Có (Cần Phải Trả):
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Tổng số tiền khách hàng cần thanh toán
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
                        Số tiền khách thanh toán tại quầy / chuyển khoản
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDebitAmount(creditAmount)}
                      className="text-[10px] text-amber-300 hover:text-white px-2 py-0.5 rounded-md bg-white/10"
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

                {/* Số tiền còn lại nếu có */}
                {creditAmount - debitAmount > 0 && (
                  <div className="flex items-center justify-between text-xs px-2 text-rose-400 font-bold">
                    <span>Còn nợ chưa thanh toán:</span>
                    <span className="font-mono">{formatVndCurrency(creditAmount - debitAmount)}</span>
                  </div>
                )}

                {/* Hình Thức Thanh Toán (Tiền mặt / Chuyển khoản) */}
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

              {/* Ghi chú đơn hàng */}
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Ghi chú phiếu hóa đơn:
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="In kèm tem cào / Khách thân thiết / Giao tận nơi..."
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* Nút Tạo Phiếu Hóa Đơn */}
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
        <div className="lg:col-span-7 space-y-5">
          {selectedInvoice ? (
            <div className="space-y-4">
              {/* THANH THAO TÁC NHANH TRÊN HÓA ĐƠN */}
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

                  <button
                    type="button"
                    onClick={() => handleDeleteInvoice(selectedInvoice)}
                    className="py-1.5 px-2 rounded-xl hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors"
                    title="Xóa hóa đơn này"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* BẢN IN TRỰC QUAN PHIẾU HÓA ĐƠN BÁN HÀNG (PRINTABLE BILL) */}
              <div
                id="invoice-print-area"
                className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300/80 space-y-6 relative overflow-hidden font-sans print:p-0 print:border-none print:shadow-none"
              >
                {/* Dải trang trí đầu phiếu */}
                <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400" />

                {/* Header Phiếu */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-200 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xl shadow-md">
                      P
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                        POLY CARDS VIỆT NAM
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Hệ Thống Thẻ Học Thông Minh Thực Tế Ảo AR 3D
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Hotline: 1900 8866 22 | Website: polycards.vn
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                      Phiếu Hóa Đơn Bán Lẻ
                    </span>
                    <div className="font-mono text-base font-black text-slate-900 mt-1">
                      {selectedInvoice.code}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 sm:justify-end mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{selectedInvoice.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Thông Tin Khách Hàng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Khách Hàng Mua:
                    </span>
                    <strong className="text-sm font-black text-slate-900 block">
                      {selectedInvoice.customerName}
                    </strong>
                    {selectedInvoice.customerPhone && (
                      <span className="font-mono text-slate-600 block mt-0.5">
                        Điện thoại / Zalo: {selectedInvoice.customerPhone}
                      </span>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Loại Khách Hàng:
                    </span>
                    <span className="font-bold text-slate-800 block">
                      {selectedInvoice.customerType === "TRUCTIEP"
                        ? "Bán Trực Tiếp Tại Quầy"
                        : "Bán Hàng Online (Zalo/SMS)"}
                    </span>
                    {selectedInvoice.customerAddress && (
                      <span className="text-slate-600 text-[11px] block mt-0.5">
                        Địa chỉ: {selectedInvoice.customerAddress}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bảng Mặt Hàng Chi Tiết */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-800 text-[11px] font-black uppercase text-slate-700">
                        <th className="py-2.5 px-2">STT</th>
                        <th className="py-2.5 px-2">Tên Bộ Sản Phẩm</th>
                        <th className="py-2.5 px-2 text-center">SL</th>
                        <th className="py-2.5 px-2 text-right">Đơn Giá</th>
                        <th className="py-2.5 px-2 text-right">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-2 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-2">
                              <strong className="text-slate-900 block font-bold">
                                {item.name}
                              </strong>
                              <span className="font-mono text-[10px] text-amber-700">
                                Mã bộ: {item.packCode}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center font-bold">{item.quantity}</td>
                            <td className="py-3 px-2 text-right font-mono text-slate-600">
                              {formatVndCurrency(item.unitPrice)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono font-black text-slate-900">
                              {formatVndCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-3 px-2 font-mono text-slate-500">1</td>
                          <td className="py-3 px-2">
                            <strong className="text-slate-900 block font-bold">
                              {selectedInvoice.packTitle}
                            </strong>
                            <span className="font-mono text-[10px] text-amber-700">
                              Mã bộ: {selectedInvoice.packCode}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-bold">1</td>
                          <td className="py-3 px-2 text-right font-mono text-slate-600">
                            {formatVndCurrency(selectedInvoice.creditAmount)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-black text-slate-900">
                            {formatVndCurrency(selectedInvoice.creditAmount)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* BẢNG KẾ TOÁN / THU NGÂN: PHÁT SINH NỢ & PHÁT SINH CÓ */}
                <div className="border-t-2 border-slate-300 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="font-bold text-slate-700">
                      Phát Sinh Có (Số tiền khách cần phải trả):
                    </span>
                    <span className="font-mono font-black text-base text-slate-900">
                      {formatVndCurrency(selectedInvoice.creditAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 text-emerald-700">
                    <span className="font-bold">
                      Phát Sinh Nợ (Số tiền khách đã trả ngay):
                    </span>
                    <span className="font-mono font-black text-base text-emerald-700">
                      {formatVndCurrency(selectedInvoice.debitAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-t border-slate-200">
                    <span className="font-bold text-slate-600">Hình thức thanh toán:</span>
                    <span className="font-bold text-slate-900 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-300">
                      {selectedInvoice.paymentMethod === "TIEN_MAT" ? "Tiền Mặt" : "Chuyển Khoản"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 font-bold">
                    <span className="text-slate-600">Còn lại (Dư nợ):</span>
                    <span
                      className={`font-mono font-black ${
                        selectedInvoice.remainingAmount > 0 ? "text-rose-600" : "text-slate-800"
                      }`}
                    >
                      {formatVndCurrency(selectedInvoice.remainingAmount || 0)}
                    </span>
                  </div>
                </div>

                {/* KHUNG MÃ BẢN QUYỀN MỞ KHÓA BỘ THẺ & MÃ QR 1-CHẠM */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      Mã Bản Quyền Kích Hoạt Trọn Bộ 30 Thẻ AR:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-amber-950 bg-white px-3 py-1 rounded-xl border border-amber-300 shadow-xs tracking-wider select-all">
                        {selectedInvoice.packCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(selectedInvoice.packCode)}
                        className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors print:hidden"
                        title="Sao chép mã"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      Quét mã QR bên cạnh để camera tự động kích hoạt 30 thẻ thuộc bộ này. Khách hàng không cần phải nhập mã tay.
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

                {/* Footer Chữ Ký */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-700">
                  <div>
                    <span className="font-bold block">Người Mua Hàng</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">(Ký và ghi rõ họ tên)</span>
                    <div className="h-12" />
                    <span className="font-bold text-slate-800">{selectedInvoice.customerName}</span>
                  </div>

                  <div>
                    <span className="font-bold block">Người Lập Phiếu / Thu Ngân</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">(Ký và ghi rõ họ tên)</span>
                    <div className="h-12" />
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
                Hãy lập phiếu hóa đơn mới bên cột trái hoặc bấm chọn 1 hóa đơn từ danh sách bên dưới!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================
          DANH SÁCH LỊCH SỬ HÓA ĐƠN BÁN HÀNG DƯỚI CÙNG
         ======================================================== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 border-t border-white/10 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              Danh Sách Lịch Sử Hóa Đơn ({filteredInvoices.length})
            </h3>
          </div>

          {/* Bộ lọc & Tìm kiếm */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Ô tìm kiếm */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-500" />
              <input
                type="text"
                placeholder="Tìm mã, tên khách, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900 border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            {/* Lọc đối tượng */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-stone-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">Tất cả khách</option>
              <option value="TRUCTIEP">Khách Trực Tiếp</option>
              <option value="ONLINE">Khách Online</option>
            </select>

            {/* Lọc thanh toán */}
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value as any)}
              className="bg-stone-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">Mọi hình thức</option>
              <option value="TIEN_MAT">Tiền Mặt</option>
              <option value="CHUYEN_KHOAN">Chuyển Khoản</option>
            </select>
          </div>
        </div>

        {/* Bảng Danh Sách Hóa Đơn */}
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 rounded-2xl bg-stone-900/40 border border-white/5">
            Không tìm thấy hóa đơn nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredInvoices.map((inv) => {
              const isSelected = selectedInvoice?.code === inv.code;
              return (
                <div
                  key={inv.id || inv.code}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10 scale-101"
                      : "bg-stone-900/80 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-300">
                      {inv.code}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        inv.customerType === "TRUCTIEP"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      }`}
                    >
                      {inv.customerType === "TRUCTIEP" ? "Trực Tiếp" : "Online"}
                    </span>
                  </div>

                  <div>
                    <strong className="text-xs text-white block font-bold">
                      {inv.customerName}
                    </strong>
                    {inv.customerPhone && (
                      <span className="font-mono text-[11px] text-stone-400 block">
                        {inv.customerPhone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                    <span className="text-[11px] text-stone-400 font-bold truncate max-w-[160px]">
                      {inv.packTitle}
                    </span>
                    <span className="font-mono font-black text-amber-300">
                      {formatVndCurrency(inv.creditAmount || inv.totalPrice || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-stone-500 pt-0.5">
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5">
                      {inv.paymentMethod === "CHUYEN_KHOAN" ? "Chuyển khoản" : "Tiền mặt"}
                    </span>
                    <span>{inv.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================
          TOAST THÔNG BÁO TÙY BIẾN
         ======================================================== */}
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

      {/* ========================================================
          CONFIRM MODAL TÙY BIẾN
         ======================================================== */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-stone-900 border border-white/20 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black uppercase text-white">{confirmModal.title}</h3>
            <p className="text-xs text-stone-300 leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 text-xs font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-md"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
