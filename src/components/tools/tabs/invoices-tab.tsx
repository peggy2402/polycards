"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Search,
  Filter,
  Printer,
  Copy,
  Check,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Plus,
  X,
  CreditCard,
  Banknote,
  User,
  Phone,
  MapPin,
  Calendar,
  Send,
  PackageCheck,
  FileText,
  ExternalLink,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { SeedOrderItem } from "@/data/seed-data";
import { OrderStatus, DeliveryMethod } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";
import { formatVnd } from "@/lib/pricing";

// Phân tích ngày tháng của hóa đơn
function parseInvoiceDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s) return null;

  // Match định dạng: "HH:mm:ss dd/MM/yyyy" hoặc "HH:mm:ss, dd/MM/yyyy" hoặc "HH:mm dd/MM/yyyy"
  const timeFirstMatch = s.match(/^(?:(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?[,\s]+)(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (timeFirstMatch) {
    const h = Number(timeFirstMatch[1]);
    const mi = Number(timeFirstMatch[2]);
    const sec = timeFirstMatch[3] ? Number(timeFirstMatch[3]) : 0;
    const d = Number(timeFirstMatch[4]);
    const m = Number(timeFirstMatch[5]) - 1;
    const y = Number(timeFirstMatch[6]);
    return new Date(y, m, d, h, mi, sec);
  }
  // Match định dạng: "dd/MM/yyyy HH:mm:ss" hoặc "dd/MM/yyyy, HH:mm:ss" hoặc "dd/MM/yyyy"
  const dateFirstMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dateFirstMatch) {
    const d = Number(dateFirstMatch[1]);
    const m = Number(dateFirstMatch[2]) - 1;
    const y = Number(dateFirstMatch[3]);
    const h = dateFirstMatch[4] ? Number(dateFirstMatch[4]) : 0;
    const mi = dateFirstMatch[5] ? Number(dateFirstMatch[5]) : 0;
    const sec = dateFirstMatch[6] ? Number(dateFirstMatch[6]) : 0;
    return new Date(y, m, d, h, mi, sec);
  }
  // Thử parse ISO dạng "YYYY-MM-DD HH:mm:ss" hoặc chuẩn ISO
  const normalizedIso = s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s;
  const parsed = new Date(normalizedIso);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Định dạng ngày giờ chuẩn: HH:mm:ss dd/MM/yyyy
function formatInvoiceDateTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = parseInvoiceDate(dateStr);
  if (!d) return dateStr;
  const pad = (n: number) => String(n).padStart(2, "0");
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const dd = pad(d.getDate());
  const MM = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  return `${hh}:${mm}:${ss} ${dd}/${MM}/${yyyy}`;
}

// Tự động suy luận Mã KH nếu đơn hàng chưa có mã
function getCustomerCode(inv: { customerId?: string; customerPhone?: string; code?: string; id?: string }): string {
  if (inv.customerId && String(inv.customerId).trim()) {
    return String(inv.customerId).trim();
  }
  const phone = String(inv.customerPhone || "").replace(/\D/g, "");
  if (phone.length >= 4) {
    return `KH-${phone.slice(-4)}`;
  }
  const cleanCode = String(inv.code || inv.id || "").replace(/\D/g, "");
  if (cleanCode.length >= 4) {
    return `KH-${cleanCode.slice(-4)}`;
  }
  return "KH-ONLINE";
}

// Định dạng số điện thoại hiển thị đẹp mắt và tránh lỗi số/ngày trên bảng tính
function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  const cleaned = String(phone).trim().replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return String(phone).trim();
}

// Xác định chính xác trạng thái thanh toán 3 nấc: Đã Thu Đủ / Thu Một Phần / Chưa Thu
function getInvoicePaymentStatus(inv: {
  status?: string;
  creditAmount?: number;
  totalPrice?: number;
  subtotal?: number;
  debitAmount?: number;
}): "Đã Thu Đủ" | "Thu Một Phần" | "Chưa Thu" {
  const total = inv.creditAmount || inv.totalPrice || inv.subtotal || 0;
  const paid = inv.debitAmount || 0;
  const remain = Math.max(0, total - paid);

  // Đã thu đủ: status là PAID, hoặc đã trả đủ tiền, hoặc không còn nợ
  if (inv.status === "PAID" || (total > 0 && paid >= total) || (total > 0 && remain === 0)) {
    return "Đã Thu Đủ";
  }

  // Thu một phần: Đã trả được một khoản > 0 nhưng vẫn còn thiếu
  if (paid > 0 && paid < total) {
    return "Thu Một Phần";
  }

  // Chưa thu: Chưa thanh toán đồng nào (paid <= 0)
  return "Chưa Thu";
}

interface InvoicesTabProps {
  onNavigateToPOS?: () => void;
  onEditInvoice?: (invoice: SeedOrderItem) => void;
}

export function InvoicesTab({ onNavigateToPOS, onEditInvoice }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<SeedOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"ALL" | "TRUCTIEP" | "ONLINE">("ALL");
  const [filterPayment, setFilterPayment] = useState<"ALL" | "TIEN_MAT" | "CHUYEN_KHOAN">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [filterDelivery, setFilterDelivery] = useState<"ALL" | DeliveryMethod>("ALL");

  const handleEditClick = (inv: SeedOrderItem) => {
    if (onEditInvoice) {
      onEditInvoice(inv);
    } else {
      window.location.href = `/invoices?editId=${encodeURIComponent(inv.id || inv.code)}&fromTab=invoices`;
    }
  };

  // Bộ lọc thời gian
  const [timeFilter, setTimeFilter] = useState<
    "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "LAST_QUARTER" | "THIS_YEAR" | "LAST_YEAR" | "CUSTOM"
  >("ALL");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Chế độ hiển thị: Dạng Bảng (Table) hoặc Dạng Thẻ (Cards)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Hóa đơn đang chọn để xem / in
  const [selectedInvoice, setSelectedInvoice] = useState<SeedOrderItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dialog xác nhận chuyển trạng thái
  const [statusConfirm, setStatusConfirm] = useState<{
    invoice: SeedOrderItem;
    targetStatus: OrderStatus;
  } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Dialog xác nhận xóa hóa đơn
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState<SeedOrderItem | null>(null);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState<boolean>(false);

  // Dialog cập nhật nhanh tiền thực thu (Quick Payment Update)
  const [quickPaymentInvoice, setQuickPaymentInvoice] = useState<{
    invoice: SeedOrderItem;
    amount: number;
  } | null>(null);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadInvoices = async () => {
    try {
      if (invoices.length === 0) {
        setIsLoading(true);
      }
      const res = await fetch("/api/orders");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Sắp xếp phiếu mới nhất lên đầu danh sách
          const sorted = [...json.data].sort((a, b) => {
            const tA = parseInvoiceDate(a.createdAt)?.getTime() || 0;
            const tB = parseInvoiceDate(b.createdAt)?.getTime() || 0;
            return tB - tA;
          });
          setInvoices(sorted);
        }
      }
    } catch (e) {
      console.warn("Lỗi tải hóa đơn:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Lọc hóa đơn theo thời gian, từ khóa tìm kiếm và các tiêu chí
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 - 11
    const currentQuarter = Math.floor(currentMonth / 3);

    return invoices.filter((inv) => {
      // 1. Lọc theo thời gian
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

      // 2. Tìm kiếm từ khóa
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.code.toLowerCase().includes(q) ||
        inv.id.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerPhone && inv.customerPhone.includes(q)) ||
        (inv.packTitle && inv.packTitle.toLowerCase().includes(q));

      const matchesType = filterType === "ALL" || inv.customerType === filterType;
      const matchesPayment = filterPayment === "ALL" || inv.paymentMethod === filterPayment;

      const currentStatus: OrderStatus = inv.orderStatus || (inv.status === "PAID" ? "DA_NHAN" : "CHO_DUYET");
      const matchesStatus = filterStatus === "ALL" || currentStatus === filterStatus;

      const currentDelivery: DeliveryMethod = inv.deliveryMethod || "TRUC_TIEP";
      const matchesDelivery = filterDelivery === "ALL" || currentDelivery === filterDelivery;

      return matchesSearch && matchesType && matchesPayment && matchesStatus && matchesDelivery;
    });
  }, [invoices, searchQuery, filterType, filterPayment, filterStatus, filterDelivery, timeFilter, customStartDate, customEndDate]);

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

  // Thống kê doanh thu & hóa đơn theo danh sách đang lọc (Chuẩn kế toán Thực thu Cash-flow)
  const stats = useMemo(() => {
    let directCount = 0;
    let onlineCount = 0;
    let pendingCount = 0;
    let totalRevenue = 0; // Thực thu (ĐÃ THU thực tế vào tài khoản / ví)
    let totalReceivable = 0; // Tổng doanh số phát sinh (CẦN THU)
    filteredInvoices.forEach((i) => {
      if (i.customerType === "TRUCTIEP") directCount++;
      else onlineCount++;

      const st = i.orderStatus || (i.status === "PAID" ? "DA_NHAN" : "CHO_DUYET");
      if (st === "CHO_DUYET") pendingCount++;

      // Các đơn chưa hủy: tính thực thu & cần thu
      if (st !== "DA_HUY") {
        const debit = Number(i.debitAmount) || 0;
        const credit = Number(i.creditAmount) || Number(i.totalPrice) || 0;
        totalRevenue += debit;
        totalReceivable += credit;
      }
    });
    return {
      total: filteredInvoices.length,
      directCount,
      onlineCount,
      pendingCount,
      totalRevenue,
      totalReceivable,
    };
  }, [filteredInvoices]);

  // Xuất danh sách hóa đơn đang lọc ra file Excel (CSV UTF-8 BOM)
  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      showToast("Không có hóa đơn nào trong danh sách để xuất.");
      return;
    }

    const headers = [
      "STT",
      "Mã Hóa Đơn",
      "Ngày Giờ Lập (HH:mm:ss dd/MM/yyyy)",
      "Khách Hàng",
      "Mã KH",
      "Số Điện Thoại",
      "Địa Chỉ",
      "Kênh Bán",
      "Sản Phẩm Mua",
      "Tổng Tiền (VNĐ)",
      "Đã Thanh Toán (VNĐ)",
      "Còn Thiếu (VNĐ)",
      "Trạng Thái",
      "Hình Thức Giao Nhận",
      "Ghi Chú",
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredInvoices.map((inv, idx) => {
      const itemsSummary = Array.isArray(inv.items)
        ? inv.items.map((it: any) => `${it.name} (x${it.quantity})`).join("; ")
        : inv.packTitle || "";

      const totalVal = inv.creditAmount || inv.totalPrice || 0;
      const debitVal = inv.debitAmount || (inv.status === "PAID" ? totalVal : 0);
      const remainVal = Math.max(0, totalVal - debitVal);
      const invoiceCode = (inv.code || inv.id || "").toUpperCase();

      return [
        idx + 1,
        escapeCsv(invoiceCode),
        escapeCsv(" " + formatInvoiceDateTime(inv.createdAt)),
        escapeCsv(inv.customerName),
        escapeCsv(getCustomerCode(inv)),
        escapeCsv(formatPhoneNumber(inv.customerPhone)),
        escapeCsv(inv.customerAddress || ""),
        escapeCsv(inv.customerType === "TRUCTIEP" ? "Tại Quầy" : "Online"),
        escapeCsv(itemsSummary),
        totalVal,
        debitVal,
        remainVal,
        escapeCsv(getInvoicePaymentStatus(inv)),
        escapeCsv(inv.deliveryMethod || "TRUC_TIEP"),
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

    showToast(`Đã xuất thành công ${filteredInvoices.length} hóa đơn ra file Excel!`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteClick = (inv: SeedOrderItem) => {
    setDeleteConfirmInvoice(inv);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmInvoice) return;
    try {
      setIsDeletingInvoice(true);
      const res = await fetch(`/api/orders?code=${encodeURIComponent(deleteConfirmInvoice.code)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInvoices((prev) =>
          prev.filter((i) => i.id !== deleteConfirmInvoice.id && i.code !== deleteConfirmInvoice.code)
        );
        if (
          selectedInvoice?.id === deleteConfirmInvoice.id ||
          selectedInvoice?.code === deleteConfirmInvoice.code
        ) {
          setSelectedInvoice(null);
        }
        showToast("Đã xóa hóa đơn thành công.");
        setDeleteConfirmInvoice(null);
      } else {
        showToast("Lỗi khi xóa hóa đơn.");
      }
    } catch {
      showToast("Lỗi kết nối khi xóa hóa đơn.");
    } finally {
      setIsDeletingInvoice(false);
    }
  };

  const handleUpdateStatusConfirmed = async () => {
    if (!statusConfirm) return;
    try {
      setIsUpdatingStatus(true);
      const res = await fetch("/api/invoices/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: statusConfirm.invoice.id || statusConfirm.invoice.code,
          orderStatus: statusConfirm.targetStatus,
        }),
      });

      if (res.ok) {
        setInvoices((prev) =>
          prev.map((i) =>
            i.id === statusConfirm.invoice.id || i.code === statusConfirm.invoice.code
              ? {
                  ...i,
                  orderStatus: statusConfirm.targetStatus,
                  status: statusConfirm.targetStatus === "DA_NHAN" ? "PAID" : statusConfirm.targetStatus === "DA_HUY" ? "CANCELLED" : i.status,
                  debitAmount: statusConfirm.targetStatus === "DA_NHAN" ? (Number(i.creditAmount) || Number(i.totalPrice) || 0) : i.debitAmount,
                  remainingAmount: statusConfirm.targetStatus === "DA_NHAN" ? 0 : i.remainingAmount,
                }
              : i
          )
        );

        if (selectedInvoice && (selectedInvoice.id === statusConfirm.invoice.id || selectedInvoice.code === statusConfirm.invoice.code)) {
          setSelectedInvoice((prev) =>
            prev
              ? {
                  ...prev,
                  orderStatus: statusConfirm.targetStatus,
                  status: statusConfirm.targetStatus === "DA_NHAN" ? "PAID" : statusConfirm.targetStatus === "DA_HUY" ? "CANCELLED" : prev.status,
                  debitAmount: statusConfirm.targetStatus === "DA_NHAN" ? (Number(prev.creditAmount) || Number(prev.totalPrice) || 0) : prev.debitAmount,
                  remainingAmount: statusConfirm.targetStatus === "DA_NHAN" ? 0 : prev.remainingAmount,
                }
              : null
          );
        }

        const label = statusConfirm.targetStatus === "DA_NHAN" ? "Đã nhận" : statusConfirm.targetStatus === "DA_HUY" ? "Đã hủy" : "Chờ duyệt";
        showToast(`Đã chuyển trạng thái đơn hàng sang "${label}".`);
        setStatusConfirm(null);
      } else {
        showToast("Lỗi khi cập nhật trạng thái hóa đơn.");
      }
    } catch {
      showToast("Lỗi kết nối khi cập nhật trạng thái.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdatePaymentConfirmed = async () => {
    if (!quickPaymentInvoice) return;
    try {
      setIsUpdatingPayment(true);
      const { invoice, amount } = quickPaymentInvoice;
      const cleanAmount = Math.max(0, Number(amount) || 0);
      const credit = Number(invoice.creditAmount) || Number(invoice.totalPrice) || 0;

      const res = await fetch("/api/invoices/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: invoice.id || invoice.code,
          debitAmount: cleanAmount,
        }),
      });

      if (res.ok) {
        setInvoices((prev) =>
          prev.map((i) =>
            i.id === invoice.id || i.code === invoice.code
              ? {
                  ...i,
                  debitAmount: cleanAmount,
                  remainingAmount: Math.max(0, credit - cleanAmount),
                  balanceAmount: cleanAmount - credit,
                  status: cleanAmount >= credit && credit > 0 ? "PAID" : cleanAmount > 0 ? "PARTIAL" : "UNPAID",
                }
              : i
          )
        );

        if (selectedInvoice && (selectedInvoice.id === invoice.id || selectedInvoice.code === invoice.code)) {
          setSelectedInvoice((prev) =>
            prev
              ? {
                  ...prev,
                  debitAmount: cleanAmount,
                  remainingAmount: Math.max(0, credit - cleanAmount),
                  balanceAmount: cleanAmount - credit,
                  status: cleanAmount >= credit && credit > 0 ? "PAID" : cleanAmount > 0 ? "PARTIAL" : "UNPAID",
                }
              : null
          );
        }

        showToast(`Đã cập nhật tiền thực thu cho ${invoice.customerName}: ${formatVndCurrency(cleanAmount)}.`);
        setQuickPaymentInvoice(null);
      } else {
        showToast("Lỗi khi cập nhật số tiền thực thu.");
      }
    } catch {
      showToast("Lỗi kết nối khi cập nhật số tiền.");
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  // Render badge trạng thái hóa đơn
  const renderStatusBadge = (status?: OrderStatus | string) => {
    const st = status || "CHO_DUYET";
    if (st === "DA_NHAN" || st === "PAID") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
          <CheckCircle2 className="h-3 w-3" />
          <span>Đã nhận</span>
        </span>
      );
    }
    if (st === "DA_HUY" || st === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40">
          <XCircle className="h-3 w-3" />
          <span>Đã hủy</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
        <Clock className="h-3 w-3" />
        <span>Chờ duyệt</span>
      </span>
    );
  };

  // Render badge hình thức giao nhận
  const renderDeliveryBadge = (method?: DeliveryMethod, codAmount?: number) => {
    switch (method) {
      case "VAN_CHUYEN_OTO":
        return <span className="text-[11px] text-sky-300 font-medium">Ô tô</span>;
      case "CPN_NHTT":
        return <span className="text-[11px] text-sky-300 font-medium">CPN Tiêu chuẩn</span>;
      case "CPN_COD":
        return (
          <span className="text-[11px] text-amber-300 font-medium">
            CPN COD {codAmount ? `(${formatVndCurrency(codAmount)})` : ""}
          </span>
        );
      case "TRUC_TIEP":
      default:
        return <span className="text-[11px] text-stone-300 font-medium">Trực tiếp</span>;
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 border border-amber-400 text-amber-300 font-bold px-4 py-2.5 rounded-2xl shadow-2xl text-xs flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER QUẢN LÝ HÓA ĐƠN */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/50 via-stone-900 to-stone-900 border border-amber-400/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Sales &amp; Invoices Studio
            </span>
            {stats.pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse">
                {stats.pendingCount} đơn chờ duyệt
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-amber-400" />
            <span>Quản Lý Hóa Đơn &amp; Sổ Thu Bán Hàng</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Theo dõi trạng thái hóa đơn (Chờ duyệt, Đã nhận, Đã hủy), đối soát hình thức giao nhận (Trực tiếp, Ô tô, CPN COD) và in phiếu bán hàng.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="min-h-[44px] py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/40 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
            title="Xuất danh sách hóa đơn đang lọc ra file Excel/CSV"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Xuất Excel</span>
          </button>

          <button
            type="button"
            onClick={loadInvoices}
            className="min-h-[44px] py-2.5 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-all cursor-pointer"
            title="Đồng bộ lại danh sách"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm Mới</span>
          </button>

          {onNavigateToPOS && (
            <button
              type="button"
              onClick={onNavigateToPOS}
              className="min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Lập Hóa Đơn Mới (POS)</span>
            </button>
          )}
        </div>
      </div>

      {/* THỐNG KÊ DOANH THU & HÓA ĐƠN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-white/10 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 block">Tổng Số Hóa Đơn</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">{stats.total}</span>
            <span className="text-[10px] text-stone-500 font-bold">Toàn hệ thống</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/30 space-y-1">
          <span className="text-[11px] font-bold text-amber-300 block">{revenueLabel}</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {formatVndCurrency(stats.totalRevenue)}
            </span>
            <span className="text-[10px] text-amber-300/70 font-bold">Thực thu</span>
          </div>
          {stats.totalReceivable !== stats.totalRevenue && (
            <div className="text-[10px] text-stone-400 pt-1 border-t border-amber-400/10 flex items-center justify-between">
              <span>Doanh số (Cần thu):</span>
              <span className="font-mono font-bold text-stone-300">
                {formatVndCurrency(stats.totalReceivable)}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/30 space-y-1">
          <span className="text-[11px] font-bold text-emerald-300 block">Đơn Chờ Duyệt (Online)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">{stats.pendingCount}</span>
            <span className="text-[10px] text-amber-300/70 font-bold">Cần xử lý</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-400/30 space-y-1">
          <span className="text-[11px] font-bold text-sky-300 block">Khách Mua Online</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-sky-400 font-mono">{stats.onlineCount}</span>
            <span className="text-[10px] text-sky-300/70 font-bold">Web Checkout</span>
          </div>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC ĐA NĂNG */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <input
              type="text"
              placeholder="Tìm theo mã HĐ, tên khách, số điện thoại, sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-white/15 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc đối tượng khách */}
            <div className="flex items-center p-1 rounded-xl bg-stone-900 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterType === "ALL" ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-white"
                }`}
              >
                Tất Cả
              </button>
              <button
                type="button"
                onClick={() => setFilterType("TRUCTIEP")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterType === "TRUCTIEP" ? "bg-emerald-500 text-stone-950" : "text-stone-400 hover:text-white"
                }`}
              >
                Trực Tiếp
              </button>
              <button
                type="button"
                onClick={() => setFilterType("ONLINE")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterType === "ONLINE" ? "bg-sky-500 text-white" : "text-stone-400 hover:text-white"
                }`}
              >
                Online
              </button>
            </div>

            {/* Lọc Trạng Thái Hóa Đơn */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-stone-900 border border-white/15 text-stone-300 font-bold text-xs rounded-xl px-3 py-2 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="CHO_DUYET">Chờ duyệt (Vàng)</option>
              <option value="DA_NHAN">Đã nhận (Xanh lá)</option>
              <option value="DA_HUY">Đã hủy (Đỏ)</option>
            </select>

            {/* Lọc Hình Thức Giao Nhận */}
            <select
              value={filterDelivery}
              onChange={(e) => setFilterDelivery(e.target.value as any)}
              className="bg-stone-900 border border-white/15 text-stone-300 font-bold text-xs rounded-xl px-3 py-2 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Mọi giao nhận</option>
              <option value="TRUC_TIEP">Trực tiếp</option>
              <option value="VAN_CHUYEN_OTO">Gửi vận chuyển (ô tô)</option>
              <option value="CPN_NHTT">Gửi CPN NHTT</option>
              <option value="CPN_COD">Gửi CPN COD</option>
            </select>

            {/* Toggle View Mode: Bảng (Table) / Thẻ (Cards) */}
            <div className="flex items-center p-1 rounded-xl bg-stone-900 border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-amber-400 text-stone-950 shadow-xs font-black"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Hiển thị dạng bảng (Table)"
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-amber-400 text-stone-950 shadow-xs font-black"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Hiển thị dạng thẻ (Cards / List)"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
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
                className={`py-1 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
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
                  className="bg-transparent text-white font-mono focus:outline-hidden w-full cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-stone-400 shrink-0 font-bold">Đến ngày:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-white font-mono focus:outline-hidden w-full cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BẢNG DANH SÁCH HÓA ĐƠN */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-stone-400 font-bold">Đang tải danh sách hóa đơn...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-stone-900/40 border border-dashed border-white/10 p-8 space-y-3">
          <Receipt className="h-10 w-10 text-stone-600 mx-auto" />
          <h4 className="text-sm font-bold text-stone-300">Không tìm thấy hóa đơn nào phù hợp</h4>
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-2xl bg-stone-900/90 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-stone-950/80 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 min-w-[130px]">Mã Hóa Đơn</th>
                  <th className="py-3 px-4 min-w-[110px]">Trạng Thái</th>
                  <th className="py-3 px-4 min-w-[170px]">Khách Hàng</th>
                  <th className="py-3 px-4 min-w-[190px]">Sản Phẩm / Gói Mua</th>
                  <th className="py-3 px-3 min-w-[130px]">Hình Thức Giao</th>
                  <th className="py-3 px-3 min-w-[110px]">Cần Thu</th>
                  <th className="py-3 px-3 min-w-[110px]">Đã Thu</th>
                  <th className="py-3 px-3 min-w-[110px]">Thanh Toán</th>
                  <th className="py-3 px-4 text-right min-w-[140px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((inv) => {
                  const credit = inv.creditAmount || inv.totalPrice || 249000;
                  const debit = inv.debitAmount !== undefined ? inv.debitAmount : credit;
                  const currentStatus: OrderStatus = inv.orderStatus || (inv.status === "PAID" ? "DA_NHAN" : "CHO_DUYET");

                  return (
                    <tr
                      key={inv.id || inv.code}
                      onClick={() => setSelectedInvoice(inv)}
                      className="group hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {/* Mã HĐ */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-amber-300 text-xs">
                          {inv.id || inv.code}
                        </span>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {formatInvoiceDateTime(inv.createdAt) || "Hôm nay"}
                        </div>
                      </td>

                      {/* Trạng thái hóa đơn */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        {renderStatusBadge(currentStatus)}
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                          <span>{inv.customerName}</span>
                          {getCustomerCode(inv) && (
                            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded shadow-2xs">
                              {getCustomerCode(inv)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          {inv.customerPhone || "Khách vãng lai"}
                        </div>
                      </td>

                      {/* Sản phẩm / Gói */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-200 line-clamp-1">
                          {inv.packTitle || "Bộ Thẻ AR Poly Cards"}
                        </div>
                        {inv.comboName && (
                          <div className="text-[10px] text-amber-300 font-bold">
                            🎁 {inv.comboName}
                          </div>
                        )}
                        <div className="text-[10px] text-stone-500 font-mono">
                          Mã bản quyền: {inv.code}
                        </div>
                      </td>

                      {/* Hình thức giao nhận */}
                      <td className="py-3 px-3">
                        {renderDeliveryBadge(inv.deliveryMethod, inv.codAmount)}
                      </td>

                      {/* Phát sinh Có (Cần thu) */}
                      <td className="py-3 px-3 font-mono font-black text-stone-200">
                        {formatVndCurrency(credit)}
                      </td>

                      {/* Phát sinh Nợ (Đã thu) - Nhấp trực tiếp để cập nhật nhanh số tiền */}
                      <td
                        className="py-3 px-3 cursor-pointer group hover:bg-amber-400/10 transition-colors relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickPaymentInvoice({ invoice: inv, amount: debit });
                        }}
                        title="Nhấn để cập nhật nhanh số tiền khách đã trả"
                      >
                        {debit === 0 ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-mono font-bold text-rose-400 flex items-center gap-1 text-xs group-hover:text-amber-300 transition-colors">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                              0 ₫
                              <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity ml-0.5" />
                            </span>
                            <span className="text-[9px] font-semibold text-rose-300 bg-rose-500/15 px-1.5 py-0.2 rounded border border-rose-500/30 group-hover:border-amber-400/40">
                              Chưa thu tiền (chạm sửa)
                            </span>
                          </div>
                        ) : debit < credit ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-mono font-bold text-amber-300 text-xs flex items-center gap-1">
                              {formatVndCurrency(debit)}
                              <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity ml-0.5" />
                            </span>
                            <span className="text-[9px] font-medium text-amber-300/90 bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20 group-hover:border-amber-400/40">
                              Thiếu {formatVndCurrency(credit - debit)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-mono font-black text-emerald-400 text-xs flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                              {formatVndCurrency(debit)}
                              <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity ml-0.5" />
                            </span>
                            <span className="text-[9px] font-semibold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30 group-hover:border-amber-400/40">
                              Đã thu đủ
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Thanh toán */}
                      <td className="py-3 px-3 text-[11px]">
                        {inv.paymentMethod === "CHUYEN_KHOAN" ? (
                          <div>
                            <span className="font-medium text-stone-200 block">Chuyển khoản</span>
                            {debit < credit ? (
                              <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-amber-400/15 px-1.5 py-0.2 rounded border border-amber-400/30">
                                <span className="h-1 w-1 rounded-full bg-amber-400 animate-ping"></span>
                                Chờ đối soát QR
                              </span>
                            ) : (
                              <span className="mt-0.5 inline-block text-[9px] font-medium text-emerald-400/90">
                                Đã khớp lệnh QR
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium text-stone-200 block">
                              {inv.deliveryMethod === "CPN_COD" ? "Thu hộ COD" : "Tiền mặt"}
                            </span>
                            {debit < credit && inv.deliveryMethod === "CPN_COD" && (
                              <span className="mt-0.5 inline-block text-[9px] text-stone-400 font-medium">
                                Bưu tá thu khi giao
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút duyệt nhanh nếu đang Chờ duyệt */}
                          {currentStatus === "CHO_DUYET" && (
                            <button
                              type="button"
                              onClick={() => setStatusConfirm({ invoice: inv, targetStatus: "DA_NHAN" })}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-stone-950 font-bold text-[11px] transition-all cursor-pointer"
                              title="Duyệt đơn sang Đã nhận"
                            >
                              Duyệt
                            </button>
                          )}

                          {/* Nút hủy nếu chưa hủy */}
                          {currentStatus !== "DA_HUY" && (
                            <button
                              type="button"
                              onClick={() => setStatusConfirm({ invoice: inv, targetStatus: "DA_HUY" })}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                              title="Hủy đơn hàng"
                            >
                              Hủy
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                            title="Xem chi tiết phiếu hóa đơn"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditClick(inv)}
                            className="p-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-stone-950 border border-amber-400/30 transition-colors cursor-pointer"
                            title="Sửa phiếu hóa đơn trong phân hệ POS"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(inv)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-colors cursor-pointer"
                            title="Xóa hóa đơn này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DẠNG THẺ (CARDS / LIST) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredInvoices.map((inv) => {
            const credit = inv.creditAmount || inv.totalPrice || 249000;
            const debit = inv.debitAmount !== undefined ? inv.debitAmount : credit;
            const currentStatus: OrderStatus = inv.orderStatus || (inv.status === "PAID" ? "DA_NHAN" : "CHO_DUYET");

            return (
              <div
                key={inv.id || inv.code}
                onClick={() => setSelectedInvoice(inv)}
                className="cursor-pointer p-4 rounded-2xl bg-stone-900/90 border border-white/10 hover:border-amber-400/50 transition-all space-y-3 shadow-lg flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  {/* Top: Mã đơn & 2 Badge thẳng hàng */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-amber-400 truncate">
                      {inv.id || inv.code}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                          inv.customerType === "TRUCTIEP"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/25"
                            : "bg-sky-500/10 text-sky-300 border-sky-500/25"
                        }`}
                      >
                        {inv.customerType === "TRUCTIEP" ? "Tại Quầy" : "Online"}
                      </span>
                      {renderStatusBadge(currentStatus)}
                    </div>
                  </div>

                  {/* Khách hàng */}
                  <div className="space-y-0.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <h4 className="text-sm font-black text-white truncate">
                          {inv.customerName}
                        </h4>
                        {getCustomerCode(inv) && (
                          <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.2 rounded shrink-0">
                            {getCustomerCode(inv)}
                          </span>
                        )}
                      </div>
                      {inv.createdAt && (
                        <span className="text-[10px] text-stone-500 font-mono shrink-0">
                          {formatInvoiceDateTime(inv.createdAt)}
                        </span>
                      )}
                    </div>
                    {inv.customerPhone && (
                      <div className="flex items-center gap-1 text-[11px] text-stone-400 font-mono">
                        <Phone className="h-3 w-3 text-stone-500 shrink-0" />
                        <span>{inv.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Hàng hóa */}
                  <div className="p-2.5 rounded-xl bg-stone-950/70 border border-white/5 space-y-1">
                    <span className="text-xs font-bold text-stone-200 block truncate">
                      {inv.packTitle || "Chưa có tên gói"}
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>Giao: {renderDeliveryBadge(inv.deliveryMethod, inv.codAmount)}</span>
                      <span>
                        {inv.paymentMethod === "CHUYEN_KHOAN" ? (
                          <span className={debit < credit ? "text-amber-300 font-semibold" : "text-emerald-400 font-semibold"}>
                            CK {debit < credit ? "(Chờ QR)" : "(Khớp)"}
                          </span>
                        ) : (
                          "Tiền mặt"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom: Tiền & Action */}
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Cần thu</span>
                      <span className="font-mono font-black text-amber-300">
                        {formatVndCurrency(credit)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickPaymentInvoice({ invoice: inv, amount: debit });
                      }}
                      className="text-right cursor-pointer group"
                      title="Nhấn để cập nhật nhanh tiền đã thu"
                    >
                      <span className="text-[10px] text-stone-400 block group-hover:text-amber-300 transition-colors">
                        Đã thu (chạm sửa)
                      </span>
                      {debit === 0 ? (
                        <span className="font-mono font-bold text-rose-400 flex items-center justify-end gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          0 ₫ (Chưa thu)
                        </span>
                      ) : debit < credit ? (
                        <span className="font-mono font-bold text-amber-300">
                          {formatVndCurrency(debit)} (Thiếu)
                        </span>
                      ) : (
                        <span className="font-mono font-black text-emerald-400">
                          {formatVndCurrency(debit)}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                    {currentStatus === "CHO_DUYET" && (
                      <button
                        type="button"
                        onClick={() => setStatusConfirm({ invoice: inv, targetStatus: "DA_NHAN" })}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs transition-all cursor-pointer shadow-sm"
                      >
                        Duyệt
                      </button>
                    )}
                    {currentStatus !== "DA_HUY" && (
                      <button
                        type="button"
                        onClick={() => setStatusConfirm({ invoice: inv, targetStatus: "DA_HUY" })}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-500 text-stone-300 hover:text-white font-bold text-xs border border-white/10 transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Xem Chi Tiết</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(inv);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-stone-950 text-stone-300 font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                      title="Sửa phiếu hóa đơn (POS)"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(inv)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-colors cursor-pointer"
                      title="Xóa hóa đơn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIALOG XÁC NHẬN CHUYỂN TRẠNG THÁI */}
      {statusConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-sm w-full bg-stone-900 border-2 border-amber-400/60 rounded-3xl p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h4 className="text-sm font-black text-white">Xác Nhận Đổi Trạng Thái</h4>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Bạn có chắc chắn muốn chuyển hóa đơn{" "}
              <strong className="text-amber-300 font-mono">{statusConfirm.invoice.id || statusConfirm.invoice.code}</strong>{" "}
              của khách hàng <strong>{statusConfirm.invoice.customerName}</strong> sang trạng thái:
            </p>

            <div className="p-2.5 rounded-xl bg-stone-950 text-center font-bold text-sm">
              {statusConfirm.targetStatus === "DA_NHAN" && (
                <span className="text-emerald-400">ĐÃ NHẬN (ĐÃ HOÀN TẤT)</span>
              )}
              {statusConfirm.targetStatus === "DA_HUY" && (
                <span className="text-rose-400">ĐÃ HỦY ĐƠN HÀNG</span>
              )}
              {statusConfirm.targetStatus === "CHO_DUYET" && (
                <span className="text-amber-400">CHỜ DUYỆT</span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                disabled={isUpdatingStatus}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-stone-300 cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleUpdateStatusConfirmed}
                disabled={isUpdatingStatus}
                className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black shadow-md cursor-pointer"
              >
                {isUpdatingStatus ? "Đang Cập Nhật..." : "Xác Nhận Đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG CẬP NHẬT TIỀN THỰC THU NHANH (QUICK PAYMENT UPDATE) */}
      {quickPaymentInvoice && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-stone-900 border-2 border-amber-400/60 rounded-3xl p-5 sm:p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Cập Nhật Tiền Thực Thu</h4>
                  <p className="text-[11px] text-stone-400">
                    Mã đơn: <strong className="font-mono text-amber-300">{quickPaymentInvoice.invoice.code || quickPaymentInvoice.invoice.id}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPaymentInvoice(null)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Thông tin đơn */}
            <div className="p-3 rounded-2xl bg-stone-950 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-300">
                <span>Khách hàng:</span>
                <strong className="text-white">{quickPaymentInvoice.invoice.customerName}</strong>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span>Tổng tiền đơn (Cần thu):</span>
                <strong className="font-mono text-amber-300 text-sm">
                  {formatVndCurrency(quickPaymentInvoice.invoice.creditAmount || quickPaymentInvoice.invoice.totalPrice || 0)}
                </strong>
              </div>
            </div>

            {/* Nút Preset nhanh */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-stone-400 block">Chọn nhanh mức thanh toán:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setQuickPaymentInvoice((prev) =>
                      prev
                        ? {
                            ...prev,
                            amount: Number(prev.invoice.creditAmount) || Number(prev.invoice.totalPrice) || 0,
                          }
                        : null
                    )
                  }
                  className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Thu đủ 100%</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuickPaymentInvoice((prev) => (prev ? { ...prev, amount: 0 } : null))
                  }
                  className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Đã hoàn hàng (0 ₫)</span>
                </button>
              </div>
            </div>

            {/* Ô nhập số tiền tùy ý */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                <span>Số tiền thực tế đã thu (VNĐ):</span>
                <span className="text-amber-400 font-mono font-bold">
                  {formatVndCurrency(quickPaymentInvoice.amount)}
                </span>
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={quickPaymentInvoice.amount === 0 ? "" : quickPaymentInvoice.amount}
                placeholder="0"
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setQuickPaymentInvoice((prev) =>
                    prev ? { ...prev, amount: val === "" ? 0 : Math.max(0, Number(val)) } : null
                  );
                }}
                className="w-full bg-stone-950 border border-amber-400/40 rounded-xl px-3.5 py-2.5 text-base text-amber-300 font-mono font-black focus:outline-hidden focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setQuickPaymentInvoice(null)}
                disabled={isUpdatingPayment}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-300 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleUpdatePaymentConfirmed}
                disabled={isUpdatingPayment}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {isUpdatingPayment ? "Đang Lưu..." : "Xác Nhận Thu Tiền"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG XÁC NHẬN XÓA HÓA ĐƠN */}
      {deleteConfirmInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-sm w-full bg-stone-900 border-2 border-rose-500/60 rounded-3xl p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="h-5 w-5 shrink-0" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Xác Nhận Xóa Hóa Đơn</h4>
                <p className="text-[11px] text-stone-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-stone-950 border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-stone-300">
                <span className="text-stone-400">Mã hóa đơn:</span>
                <span className="font-mono font-bold text-amber-400">
                  {deleteConfirmInvoice.id || deleteConfirmInvoice.code}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span className="text-stone-400">Khách hàng:</span>
                <span className="font-bold text-white">
                  {deleteConfirmInvoice.customerName}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span className="text-stone-400">Tổng tiền:</span>
                <span className="font-bold text-amber-300">
                  {formatVnd(deleteConfirmInvoice.totalPrice || deleteConfirmInvoice.creditAmount || 0)}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn hóa đơn{" "}
              <strong className="text-rose-400 font-mono">
                {deleteConfirmInvoice.id || deleteConfirmInvoice.code}
              </strong>{" "}
              khỏi hệ thống không?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmInvoice(null)}
                disabled={isDeletingInvoice}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-stone-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingInvoice}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingInvoice ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang Xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Xác Nhận Xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT & IN PHIẾU HÓA ĐƠN BÁN HÀNG */}
      {selectedInvoice && (
        <div
          onClick={() => setSelectedInvoice(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full bg-stone-900 border-2 border-amber-400/50 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden max-h-[92dvh]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-stone-950/95 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Phiếu Thu &amp; Hóa Đơn Bán Lẻ</h3>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-amber-300 font-mono">{selectedInvoice.id || selectedInvoice.code}</span>
                    <span>•</span>
                    {renderStatusBadge(selectedInvoice.orderStatus)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedInvoice) {
                      handleEditClick(selectedInvoice);
                    }
                  }}
                  className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-stone-950 text-stone-300 font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                  title="Chỉnh sửa hóa đơn này trong phân hệ POS"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Sửa Phiếu</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>In Phiếu Thu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Phiếu in hiển thị trực quan */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-6 rounded-2xl bg-white text-stone-900 shadow-md space-y-4">
                {/* Tiêu đề tiệm + Logo chuẩn nhận diện thương hiệu Poly Cards */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-stone-900">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/icons/logo.png"
                      alt="Poly Cards Logo"
                      className="h-11 w-11 object-contain rounded-xl shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div>
                      <h4 className="text-base font-black uppercase tracking-wider text-stone-900 block leading-tight">
                        POLY CARDS VIỆT NAM
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Hệ sinh thái Thẻ bài Học tập Thực tế ảo WebAR tương tác 3D
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        Website: polycards.vn &bull; Hotline: 0356.226.707
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">
                      HÓA ĐƠN BÁN HÀNG
                    </span>
                    <span className="text-sm font-black font-mono text-stone-900 block">
                      {selectedInvoice.code || selectedInvoice.id}
                    </span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">
                      Ngày: {formatInvoiceDateTime(selectedInvoice.createdAt) || selectedInvoice.createdAt || "Hôm nay"}
                    </span>
                  </div>
                </div>

                {/* Thông tin khách hàng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <div>
                    <span className="text-stone-400 font-bold block text-[10px] uppercase">
                      Thông Tin Người Mua
                    </span>
                    <strong className="text-sm text-stone-900 block mt-0.5">
                      {selectedInvoice.customerName}
                    </strong>
                    {getCustomerCode(selectedInvoice) && (
                      <span className="text-stone-600 block text-[11px]">
                        Mã KH: <strong className="font-mono text-amber-700">{getCustomerCode(selectedInvoice)}</strong>
                      </span>
                    )}
                    {selectedInvoice.customerPhone && (
                      <span className="text-stone-600 block text-[11px]">
                        SĐT: <strong className="font-mono">{selectedInvoice.customerPhone}</strong>
                      </span>
                    )}
                    {selectedInvoice.customerAddress && (
                      <span className="text-stone-600 block text-[11px] truncate">
                        Địa chỉ: {selectedInvoice.customerAddress}
                      </span>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-stone-400 font-bold block text-[10px] uppercase">
                      Phương Thức &amp; Kênh
                    </span>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-stone-200 text-stone-800 uppercase">
                      {selectedInvoice.customerType === "TRUCTIEP" ? "Bán Tại Quầy" : "Giao Hàng Online"}
                    </span>
                    <span className="block mt-1 font-semibold text-stone-700">
                      HT Thanh Toán: {selectedInvoice.paymentMethod === "TIEN_MAT" ? "Tiền mặt" : "Chuyển khoản"}
                    </span>
                    <span className="block mt-0.5 text-[11px] text-stone-500">
                      Giao nhận: {renderDeliveryBadge(selectedInvoice.deliveryMethod, selectedInvoice.codAmount)}
                    </span>
                  </div>
                </div>

                {/* Bảng chi tiết đơn hàng */}
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-300 text-stone-600 text-[10px] uppercase font-bold">
                      <th className="py-1.5">Mục Hàng</th>
                      <th className="py-1.5 text-center">SL</th>
                      <th className="py-1.5 text-right">Đơn Giá</th>
                      <th className="py-1.5 text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-2">
                            <strong className="text-stone-900">{item.name}</strong>
                            <div className="text-[10px] text-stone-500 font-mono">
                              Mã: {item.packCode || selectedInvoice.code}
                            </div>
                          </td>
                          <td className="py-2 text-center font-bold">{item.quantity}</td>
                          <td className="py-2 text-right font-mono">
                            {formatVndCurrency(item.unitPrice)}
                          </td>
                          <td className="py-2 text-right font-mono font-bold">
                            {formatVndCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2">
                          <strong className="text-stone-900">{selectedInvoice.packTitle}</strong>
                          <div className="text-[10px] text-stone-500 font-mono">
                            Mã bản quyền: {selectedInvoice.code}
                          </div>
                        </td>
                        <td className="py-2 text-center font-bold">1</td>
                        <td className="py-2 text-right font-mono">
                          {formatVndCurrency(selectedInvoice.creditAmount || selectedInvoice.totalPrice || 249000)}
                        </td>
                        <td className="py-2 text-right font-mono font-bold">
                          {formatVndCurrency(selectedInvoice.creditAmount || selectedInvoice.totalPrice || 249000)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Tổng kết tiền hạch toán */}
                <div className="pt-2 border-t border-dashed border-stone-300 space-y-1.5 text-xs">
                  {selectedInvoice.subtotal !== undefined && (
                    <div className="flex justify-between text-stone-600">
                      <span>Tiền hàng tạm tính:</span>
                      <span className="font-mono font-bold text-stone-900">
                        {formatVndCurrency(selectedInvoice.subtotal || selectedInvoice.creditAmount)}
                      </span>
                    </div>
                  )}

                  {selectedInvoice.comboDiscount !== undefined && selectedInvoice.comboDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Khuyến mãi {selectedInvoice.comboName ? `(${selectedInvoice.comboName})` : ""}:</span>
                      <span className="font-mono">-{formatVndCurrency(selectedInvoice.comboDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-900 font-bold text-sm pt-1 border-t border-stone-200">
                    <span>Tổng Tiền (Có):</span>
                    <strong className="text-amber-800 font-mono">
                      {formatVndCurrency(selectedInvoice.creditAmount || selectedInvoice.totalPrice || 249000)}
                    </strong>
                  </div>

                  <div className="flex justify-between text-stone-700">
                    <span>Đã Thanh Toán (Nợ):</span>
                    <strong className="text-emerald-700 font-mono">
                      {formatVndCurrency(selectedInvoice.debitAmount !== undefined ? selectedInvoice.debitAmount : selectedInvoice.creditAmount || 249000)}
                    </strong>
                  </div>

                  {selectedInvoice.remainingAmount !== undefined && selectedInvoice.remainingAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold pt-0.5">
                      <span>Còn thiếu:</span>
                      <span className="font-mono">{formatVndCurrency(selectedInvoice.remainingAmount)}</span>
                    </div>
                  )}
                </div>

                {/* GHI CHÚ BẢO HÀNH & KÍCH HOẠT (ĐỒNG BỘ 100% VỚI /invoices) */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <span className="font-black text-amber-900 block uppercase text-[10px]">
                    Lưu Ý Bản Quyền &amp; Hướng Dẫn Kích Hoạt WebAR 3D:
                  </span>
                  <p className="text-[11px] leading-relaxed text-amber-900/90">
                    Sản phẩm Thẻ Học AR Poly Cards chính hãng đã được gắn sẵn mã kích hoạt và mã QR trực tiếp trên từng mặt thẻ bài khi xuất xưởng. Ba Mẹ và các bé chỉ cần mở camera điện thoại quét trực tiếp trên mặt thẻ là có thể tương tác 3D WebAR không cần cài đặt ứng dụng.
                  </p>
                </div>

                {/* Chữ Ký Người Bán & Người Mua */}
                <div className="pt-3 border-t border-stone-200 grid grid-cols-2 text-center text-xs text-stone-700">
                  <div>
                    <span className="font-bold block">Người Mua Hàng</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">(Ký và ghi rõ họ tên)</span>
                    <div className="h-8" />
                    <span className="font-bold text-stone-800">{selectedInvoice.customerName}</span>
                  </div>

                  <div>
                    <span className="font-bold block">Người Lập Phiếu / Thu Ngân</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">(Ký và ghi rõ họ tên)</span>
                    <div className="h-8" />
                    <span className="font-bold text-stone-800">Poly Cards Store</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-stone-500 pt-2 border-t border-stone-200">
                  Cảm ơn Quý phụ huynh &amp; các bé đã đồng hành cùng Poly Cards!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
