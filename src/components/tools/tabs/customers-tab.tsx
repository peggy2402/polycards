"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  X,
  Check,
  Edit3,
  Trash2,
  ShoppingBag,
  CreditCard,
  User,
  Eye,
  Receipt,
  PackageCheck,
} from "lucide-react";
import { SeedCustomerItem, SeedOrderItem } from "@/data/seed-data";
import { formatVndCurrency } from "@/lib/formatters";

interface CustomersTabProps {
  onNavigateToPOS?: () => void;
}

export function CustomersTab({ onNavigateToPOS }: CustomersTabProps) {
  const [customers, setCustomers] = useState<SeedCustomerItem[]>([]);
  const [orders, setOrders] = useState<SeedOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"ALL" | "TRUCTIEP" | "ONLINE">("ALL");

  // State modal
  const [selectedCustomer, setSelectedCustomer] = useState<SeedCustomerItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<SeedCustomerItem | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [resCust, resOrd] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/orders"),
      ]);

      if (resCust.ok) {
        const jsonCust = await resCust.json();
        if (jsonCust.success && Array.isArray(jsonCust.data)) {
          setCustomers(jsonCust.data);
        }
      }

      if (resOrd.ok) {
        const jsonOrd = await resOrd.json();
        if (jsonOrd.success && Array.isArray(jsonOrd.data)) {
          setOrders(jsonOrd.data);
        }
      }
    } catch (e) {
      console.warn("Lỗi tải khách hàng:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q);

      const matchesType = filterType === "ALL" || c.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [customers, searchQuery, filterType]);

  const stats = useMemo(() => {
    let directCount = 0;
    let onlineCount = 0;
    let totalSpent = 0;

    customers.forEach((c) => {
      if (c.type === "TRUCTIEP") directCount++;
      else onlineCount++;
      totalSpent += c.totalSpent || 0;
    });

    return {
      total: customers.length,
      directCount,
      onlineCount,
      totalSpent,
    };
  }, [customers]);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name.trim()) return;

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCustomer),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setCustomers((prev) => {
            const idx = prev.findIndex((c) => c.id === json.data.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = json.data;
              return updated;
            }
            return [json.data, ...prev];
          });
          showToast(`Đã lưu thông tin khách hàng "${json.data.name}"!`);
          setIsEditModalOpen(false);
          setEditingCustomer(null);
        }
      }
    } catch {
      showToast("Lỗi lưu thông tin khách hàng.");
    }
  };

  const handleDeleteCustomer = async (c: SeedCustomerItem) => {
    if (!confirm(`Bạn có chắc muốn xóa khách hàng "${c.name}" khỏi hệ thống?`)) return;

    try {
      const res = await fetch(`/api/customers?id=${c.id}`, { method: "DELETE" });
      if (res.ok) {
        setCustomers((prev) => prev.filter((item) => item.id !== c.id));
        showToast(`Đã xóa khách hàng "${c.name}" thành công!`);
        if (selectedCustomer?.id === c.id) setSelectedCustomer(null);
      }
    } catch {
      showToast("Lỗi khi xóa khách hàng.");
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 border border-emerald-400 text-emerald-300 font-bold px-4 py-2.5 rounded-2xl shadow-2xl text-xs flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-stone-900 to-sky-950/40 border border-emerald-400/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Customers CRM Studio
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-emerald-400" />
            <span>Quản Lý Khách Hàng &amp; Hồ Sơ Mua Hàng</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Quản lý thông tin khách hàng, số điện thoại, tổng chi tiêu tích lũy và danh sách các mã bộ thẻ bài đã mua.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="py-2.5 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
            title="Đồng bộ lại dữ liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm Mới</span>
          </button>

          {onNavigateToPOS && (
            <button
              type="button"
              onClick={onNavigateToPOS}
              className="py-2.5 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-emerald-400/30 transition-all cursor-pointer"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Bán Tại POS</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingCustomer({
                id: `CUST-${Date.now().toString().slice(-4)}`,
                name: "",
                phone: "",
                address: "",
                type: "TRUCTIEP",
                orders: [],
                totalSpent: 0,
                createdAt: new Date().toLocaleString("vi-VN"),
              });
              setIsEditModalOpen(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-stone-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Thêm Khách Hàng Mới</span>
          </button>
        </div>
      </div>

      {/* METRIC STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-white/10 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 block">Tổng Số Khách Hàng</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">{stats.total}</span>
            <span className="text-[10px] text-stone-500 font-bold">Khách đã lưu</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/30 space-y-1">
          <span className="text-[11px] font-bold text-emerald-300 block">Khách Trực Tiếp Tại Quầy</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">{stats.directCount}</span>
            <span className="text-[10px] text-emerald-300/70 font-bold">Quầy POS</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-400/30 space-y-1">
          <span className="text-[11px] font-bold text-sky-300 block">Khách Đặt Hàng Online</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-sky-400 font-mono">{stats.onlineCount}</span>
            <span className="text-[10px] text-sky-300/70 font-bold">Online Web</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/30 space-y-1">
          <span className="text-[11px] font-bold text-amber-300 block">Tổng Chi Tiêu Tích Lũy</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {formatVndCurrency(stats.totalSpent)}
            </span>
            <span className="text-[10px] text-amber-300/70 font-bold">Doanh số</span>
          </div>
        </div>
      </div>

      {/* TÌM KIẾM & BỘ LỌC */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
          <input
            type="text"
            placeholder="Tìm theo tên khách hàng, số điện thoại, địa chỉ, mã KH..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-white/15 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-400"
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

        <div className="flex items-center p-1 rounded-xl bg-stone-900 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === "ALL" ? "bg-emerald-500 text-stone-950" : "text-stone-400 hover:text-white"
            }`}
          >
            Tất Cả
          </button>
          <button
            type="button"
            onClick={() => setFilterType("TRUCTIEP")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === "TRUCTIEP" ? "bg-emerald-500 text-stone-950" : "text-stone-400 hover:text-white"
            }`}
          >
            Trực Tiếp
          </button>
          <button
            type="button"
            onClick={() => setFilterType("ONLINE")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === "ONLINE" ? "bg-sky-500 text-white" : "text-stone-400 hover:text-white"
            }`}
          >
            Online
          </button>
        </div>
      </div>

      {/* BẢNG KHÁCH HÀNG */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-stone-400 font-bold">Đang tải danh sách khách hàng...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-stone-900/40 border border-dashed border-white/10 p-8 space-y-3">
          <Users className="h-10 w-10 text-stone-600 mx-auto" />
          <h4 className="text-sm font-bold text-stone-300">Không tìm thấy khách hàng nào</h4>
        </div>
      ) : (
        <div className="rounded-2xl bg-stone-900/90 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-stone-950/80 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 min-w-[130px]">Mã Khách Hàng</th>
                  <th className="py-3 px-4 min-w-[180px]">Họ Và Tên</th>
                  <th className="py-3 px-3 min-w-[130px]">Số Điện Thoại</th>
                  <th className="py-3 px-4 min-w-[200px]">Địa Chỉ</th>
                  <th className="py-3 px-3 min-w-[110px]">Phân Loại</th>
                  <th className="py-3 px-3 min-w-[120px]">Tổng Chi Tiêu</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Đơn Hàng</th>
                  <th className="py-3 px-4 text-right min-w-[120px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map((cust) => {
                  const customerOrders = orders.filter(
                    (o) =>
                      cust.orders.includes(o.id) ||
                      (cust.phone && o.customerPhone === cust.phone) ||
                      o.customerName === cust.name
                  );

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className="group hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {/* Mã KH */}
                      <td className="py-3 px-4 font-mono font-bold text-amber-300 text-xs">
                        {cust.id}
                      </td>

                      {/* Họ tên */}
                      <td className="py-3 px-4">
                        <strong className="text-white text-sm block group-hover:text-emerald-300 transition-colors">
                          {cust.name}
                        </strong>
                        <span className="text-[10px] text-stone-500">
                          Tạo ngày: {cust.createdAt || "Trước đó"}
                        </span>
                      </td>

                      {/* SĐT */}
                      <td className="py-3 px-3">
                        {cust.phone ? (
                          <div className="flex items-center gap-1 font-mono text-stone-300">
                            <Phone className="h-3 w-3 text-emerald-400" />
                            <span>{cust.phone}</span>
                          </div>
                        ) : (
                          <span className="text-stone-500 italic text-[11px]">Chưa cập nhật</span>
                        )}
                      </td>

                      {/* Địa chỉ */}
                      <td className="py-3 px-4 text-stone-300">
                        {cust.address ? (
                          <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                            <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                            <span className="truncate">{cust.address}</span>
                          </div>
                        ) : (
                          <span className="text-stone-500 italic text-[11px]">Mua tại quầy</span>
                        )}
                      </td>

                      {/* Phân loại */}
                      <td className="py-3 px-3">
                        {cust.type === "TRUCTIEP" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            Trực Tiếp
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                            Online Web
                          </span>
                        )}
                      </td>

                      {/* Tổng chi tiêu */}
                      <td className="py-3 px-3 font-mono font-black text-amber-400">
                        {formatVndCurrency(cust.totalSpent || 0)}
                      </td>

                      {/* Số đơn */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-white/10 font-bold text-white font-mono text-[11px]">
                          {customerOrders.length || cust.orders.length || 0}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white border border-white/10 transition-colors"
                            title="Xem lịch sử mua hàng"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer({ ...cust });
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/20 transition-colors"
                            title="Sửa thông tin khách"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-colors"
                            title="Xóa khách hàng này"
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

      {/* MODAL XEM CHI TIẾT LỊCH SỬ MUA HÀNG CỦA KHÁCH */}
      {selectedCustomer && (
        <div
          onClick={() => setSelectedCustomer(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-stone-900 border-2 border-emerald-400/50 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden max-h-[90dvh]"
          >
            <div className="px-5 py-4 border-b border-white/10 bg-stone-950 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">{selectedCustomer.name}</h3>
                <p className="text-[11px] text-stone-400 font-mono">
                  {selectedCustomer.id} • SĐT: {selectedCustomer.phone || "Chưa có"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-black/60 border border-white/10">
                <div>
                  <span className="text-stone-400 block text-[10px]">Tổng chi tiêu:</span>
                  <strong className="text-amber-400 font-mono text-base">
                    {formatVndCurrency(selectedCustomer.totalSpent || 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Phân loại khách:</span>
                  <span className="font-bold text-emerald-300">
                    {selectedCustomer.type === "TRUCTIEP" ? "Khách mua tại quầy" : "Khách đặt online"}
                  </span>
                </div>
              </div>

              {/* Danh sách các mã đơn hàng & mã bản quyền */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-300 block">
                  Lịch Sử Các Mã Bộ / Hóa Đơn Đã Cấp Cho Khách:
                </label>
                {orders.filter(
                  (o) =>
                    selectedCustomer.orders.includes(o.id) ||
                    (selectedCustomer.phone && o.customerPhone === selectedCustomer.phone) ||
                    o.customerName === selectedCustomer.name
                ).length === 0 ? (
                  <p className="text-stone-500 italic p-3 rounded-xl bg-black/30">
                    Chưa có lịch sử mã bản quyền nào được ghi nhận.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orders
                      .filter(
                        (o) =>
                          selectedCustomer.orders.includes(o.id) ||
                          (selectedCustomer.phone && o.customerPhone === selectedCustomer.phone) ||
                          o.customerName === selectedCustomer.name
                      )
                      .map((o) => (
                        <div
                          key={o.id}
                          className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-black text-amber-300 font-mono text-xs">{o.code}</div>
                            <div className="text-[11px] text-stone-300">{o.packTitle}</div>
                            <div className="text-[10px] text-stone-500">
                              Hóa đơn: {o.id} • {o.createdAt}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-emerald-400">
                            {formatVndCurrency(o.creditAmount || o.totalPrice || 249000)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA THÔNG TIN KHÁCH HÀNG */}
      {isEditModalOpen && editingCustomer && (
        <div
          onClick={() => setIsEditModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-stone-900 border-2 border-emerald-400/50 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/10 bg-stone-950 flex items-center justify-between">
              <h3 className="text-base font-black text-emerald-300 flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                <span>Cập Nhật Thông Tin Khách Hàng</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-300 mb-1">Họ Và Tên Khách Hàng *:</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  placeholder="Ví dụ: Anh Nam / Chị Mai..."
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-300 mb-1">Số Điện Thoại:</label>
                <input
                  type="tel"
                  value={editingCustomer.phone || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  placeholder="0912..."
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-300 mb-1">Địa Chỉ Nhận Hàng:</label>
                <input
                  type="text"
                  value={editingCustomer.address || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  placeholder="Số nhà, đường, quận/huyện..."
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-300 mb-1">Phân Loại Khách Hàng:</label>
                <select
                  value={editingCustomer.type}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, type: e.target.value as any })}
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="TRUCTIEP">Khách Mua Trực Tiếp Tại Quầy</option>
                  <option value="ONLINE">Khách Đặt Hàng Online</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs active:scale-95 transition-all cursor-pointer shadow-lg mt-2"
              >
                Lưu Thông Tin Khách Hàng
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

