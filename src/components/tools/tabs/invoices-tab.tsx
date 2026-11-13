"use client";

import React, { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import {
  Receipt,
  Search,
  Filter,
  Printer,
  Copy,
  Check,
  Eye,
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
} from "lucide-react";
import { SeedOrderItem } from "@/data/seed-data";
import { OrderStatus, DeliveryMethod } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";
import { formatVnd } from "@/lib/pricing";

interface InvoicesTabProps {
  onNavigateToPOS?: () => void;
}

export function InvoicesTab({ onNavigateToPOS }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<SeedOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"ALL" | "TRUCTIEP" | "ONLINE">("ALL");
  const [filterPayment, setFilterPayment] = useState<"ALL" | "TIEN_MAT" | "CHUYEN_KHOAN">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [filterDelivery, setFilterDelivery] = useState<"ALL" | DeliveryMethod>("ALL");

  // Hóa đơn đang chọn để xem / in
  const [selectedInvoice, setSelectedInvoice] = useState<SeedOrderItem | null>(null);
  const [invoiceQrUrl, setInvoiceQrUrl] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dialog xác nhận chuyển trạng thái
  const [statusConfirm, setStatusConfirm] = useState<{
    invoice: SeedOrderItem;
    targetStatus: OrderStatus;
  } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setInvoices(json.data);
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

  // Lọc hóa đơn
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
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
  }, [invoices, searchQuery, filterType, filterPayment, filterStatus, filterDelivery]);

  // Thống kê doanh thu & hóa đơn
  const stats = useMemo(() => {
    let directCount = 0;
    let onlineCount = 0;
    let pendingCount = 0;
    let totalRevenue = 0;
    invoices.forEach((i) => {
      if (i.customerType === "TRUCTIEP") directCount++;
      else onlineCount++;

      const st = i.orderStatus || (i.status === "PAID" ? "DA_NHAN" : "CHO_DUYET");
      if (st === "CHO_DUYET") pendingCount++;

      if (st !== "DA_HUY") {
        totalRevenue += i.debitAmount || i.creditAmount || i.totalPrice || 0;
      }
    });
    return {
      total: invoices.length,
      directCount,
      onlineCount,
      pendingCount,
      totalRevenue,
    };
  }, [invoices]);

  // Tạo QR khi xem hóa đơn
  useEffect(() => {
    if (selectedInvoice) {
      const url =
        selectedInvoice.directUrl ||
        `https://polycards.vn/ar/${selectedInvoice.unlockedSlug || "lion"}?ar=1&code=${selectedInvoice.code}`;
      QRCode.toDataURL(url, {
        margin: 1,
        width: 300,
        color: { dark: "#0F172A", light: "#FFFFFF" },
      })
        .then(setInvoiceQrUrl)
        .catch(() => setInvoiceQrUrl(""));
    } else {
      setInvoiceQrUrl("");
    }
  }, [selectedInvoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (inv: SeedOrderItem) => {
    if (!confirm(`Bạn có chắc muốn xóa hóa đơn ${inv.id || inv.code} không?`)) return;
    try {
      const res = await fetch(`/api/orders?code=${encodeURIComponent(inv.code)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInvoices((prev) => prev.filter((i) => i.id !== inv.id && i.code !== inv.code));
        if (selectedInvoice?.id === inv.id || selectedInvoice?.code === inv.code) {
          setSelectedInvoice(null);
        }
        showToast("Đã xóa hóa đơn.");
      }
    } catch {
      showToast("Lỗi khi xóa hóa đơn.");
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
                }
              : i
          )
        );

        if (selectedInvoice && (selectedInvoice.id === statusConfirm.invoice.id || selectedInvoice.code === statusConfirm.invoice.code)) {
          setSelectedInvoice((prev) => prev ? { ...prev, orderStatus: statusConfirm.targetStatus } : null);
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
        return <span className="text-[11px] text-purple-300 font-medium">CPN NHTT</span>;
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
          <span className="text-[11px] font-bold text-amber-300 block">Doanh Thu Thu Được</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {formatVndCurrency(stats.totalRevenue)}
            </span>
            <span className="text-[10px] text-amber-300/70 font-bold">Thực thu</span>
          </div>
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
          </div>
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
      ) : (
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
                          {inv.createdAt || "Hôm nay"}
                        </div>
                      </td>

                      {/* Trạng thái hóa đơn */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        {renderStatusBadge(currentStatus)}
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{inv.customerName}</span>
                          {inv.customerId && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded">
                              {inv.customerId}
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

                      {/* Phát sinh Có */}
                      <td className="py-3 px-3 font-mono font-black text-stone-200">
                        {formatVndCurrency(credit)}
                      </td>

                      {/* Phát sinh Nợ */}
                      <td className="py-3 px-3 font-mono font-black text-emerald-400">
                        {formatVndCurrency(debit)}
                      </td>

                      {/* Thanh toán */}
                      <td className="py-3 px-3 text-[11px] text-stone-400">
                        {inv.paymentMethod === "CHUYEN_KHOAN" ? "Chuyển khoản" : "Tiền mặt"}
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
                            onClick={() => handleDelete(inv)}
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
                {/* Tiêu đề tiệm */}
                <div className="text-center pb-3 border-b border-dashed border-stone-300 space-y-1">
                  <h4 className="text-lg font-black uppercase tracking-wider text-amber-900">
                    POLY CARDS • THẾ GIỚI THẺ BÀI AR
                  </h4>
                  <p className="text-xs text-stone-600">Thực tế ảo 3D tương tác song ngữ thông minh cho bé</p>
                  <p className="text-[11px] font-mono text-stone-500">
                    Số phiếu: <strong>{selectedInvoice.id}</strong> • Mã bản quyền: <strong>{selectedInvoice.code}</strong>
                  </p>
                </div>

                {/* Thông tin khách hàng */}
                <div className="grid grid-cols-2 gap-2 text-xs text-stone-700">
                  <div>
                    <span className="text-stone-500 block text-[10px]">Khách hàng:</span>
                    <strong className="text-stone-900 text-sm">{selectedInvoice.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px]">Số điện thoại:</span>
                    <strong className="text-stone-900 font-mono">{selectedInvoice.customerPhone || "Khách vãng lai"}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px]">Hình thức giao nhận:</span>
                    <span>{renderDeliveryBadge(selectedInvoice.deliveryMethod, selectedInvoice.codAmount)}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px]">Thời gian:</span>
                    <span>{selectedInvoice.createdAt || "Hôm nay"}</span>
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
                  {selectedInvoice.comboName && (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>Ưu đãi Combo ({selectedInvoice.comboName}):</span>
                      <span>-{formatVndCurrency(selectedInvoice.comboDiscount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-700">
                    <span>Tổng tiền thanh toán (Có):</span>
                    <strong className="text-stone-950 font-mono text-sm">
                      {formatVndCurrency(selectedInvoice.creditAmount || selectedInvoice.totalPrice || 249000)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Số tiền khách đã trả (Nợ):</span>
                    <strong className="text-emerald-700 font-mono text-sm">
                      {formatVndCurrency(selectedInvoice.debitAmount !== undefined ? selectedInvoice.debitAmount : selectedInvoice.creditAmount || 249000)}
                    </strong>
                  </div>
                </div>

                {/* QR Code kích hoạt */}
                <div className="pt-3 border-t border-dashed border-stone-300 flex items-center justify-between gap-4">
                  <div className="space-y-1 text-xs text-stone-600">
                    <strong className="text-stone-900 block text-sm">Quét Mã Kích Hoạt AR:</strong>
                    <p className="text-[11px] leading-relaxed">
                      Dùng Camera điện thoại quét mã QR bên cạnh để mở khóa trọn bộ thẻ và trải nghiệm mô hình 3D AR ngay lập tức.
                    </p>
                    <span className="font-mono font-bold text-[10px] text-amber-800">
                      Website: polycards.vn
                    </span>
                  </div>

                  {invoiceQrUrl && (
                    <div className="h-24 w-24 shrink-0 rounded-xl bg-white p-1.5 border border-stone-300 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={invoiceQrUrl} alt="QR Code" className="h-full w-full object-contain" />
                    </div>
                  )}
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
