"use client";

import React, { useState, useMemo, useEffect } from "react";
import QRCode from "qrcode";
import {
  PackageCheck,
  Search,
  Filter,
  Copy,
  Check,
  Eye,
  Trash2,
  Sparkles,
  ExternalLink,
  Layers,
  User,
  Phone,
  Calendar,
  Receipt,
  Plus,
  X,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Tag,
  CreditCard,
  Banknote,
} from "lucide-react";
import { SeedOrderItem } from "@/data/seed-data";
import { Animal, ProductCategory } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";

interface LicensesTabProps {
  productsList: Animal[];
  categoriesList: ProductCategory[];
  onNavigateToPOS?: () => void;
}

export function LicensesTab({
  productsList,
  categoriesList,
  onNavigateToPOS,
}: LicensesTabProps) {
  const [orders, setOrders] = useState<SeedOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"ALL" | "SINGLE" | "MULTI" | "PACK">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // State xem chi tiết mã bản quyền
  const [selectedOrder, setSelectedOrder] = useState<SeedOrderItem | null>(null);
  const [detailQrUrl, setDetailQrUrl] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal tạo mã thủ công
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newCodeType, setNewCodeType] = useState<"SINGLE" | "MULTI" | "PACK">("SINGLE");
  const [newSingleSlug, setNewSingleSlug] = useState<string>("");
  const [newMultiSlugs, setNewMultiSlugs] = useState<string[]>([]);
  const [newPackCategory, setNewPackCategory] = useState<string>("dong-vat");
  const [newCustomerName, setNewCustomerName] = useState<string>("Khách Hàng Quầy");
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>("");
  const [isSubmittingNewCode, setIsSubmittingNewCode] = useState<boolean>(false);

  // Toast thông báo
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrders(json.data);
        }
      }
    } catch (e) {
      console.warn("Lỗi tải orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Lọc danh sách mã
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.packTitle && o.packTitle.toLowerCase().includes(q)) ||
        (o.unlockedSlug && o.unlockedSlug.toLowerCase().includes(q));

      const type =
        o.codeType ||
        (o.code.startsWith("SINGLE-")
          ? "SINGLE"
          : o.code.startsWith("MULTI-")
          ? "MULTI"
          : "PACK");

      const matchesType = filterType === "ALL" || type === filterType;

      const matchesCat =
        filterCategory === "all" ||
        o.allowedCategorySlug === filterCategory ||
        o.packId === filterCategory;

      return matchesSearch && matchesType && matchesCat;
    });
  }, [orders, searchQuery, filterType, filterCategory]);

  // Thống kê phân loại mã
  const stats = useMemo(() => {
    let single = 0;
    let multi = 0;
    let pack = 0;
    orders.forEach((o) => {
      const type =
        o.codeType ||
        (o.code.startsWith("SINGLE-")
          ? "SINGLE"
          : o.code.startsWith("MULTI-")
          ? "MULTI"
          : "PACK");
      if (type === "SINGLE") single++;
      else if (type === "MULTI") multi++;
      else pack++;
    });
    return { total: orders.length, single, multi, pack };
  }, [orders]);

  // Tạo QR khi xem chi tiết
  useEffect(() => {
    if (selectedOrder) {
      const url =
        selectedOrder.directUrl ||
        `https://polycards-one.vercel.app/ar/${selectedOrder.unlockedSlug || "lion"}?ar=1&code=${selectedOrder.code}`;
      QRCode.toDataURL(url, {
        margin: 1,
        width: 400,
        color: { dark: "#0F172A", light: "#FFFFFF" },
      })
        .then(setDetailQrUrl)
        .catch(() => setDetailQrUrl(""));
    } else {
      setDetailQrUrl("");
    }
  }, [selectedOrder]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Đã sao chép mã bản quyền: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteOrder = async (order: SeedOrderItem) => {
    if (!confirm(`Bạn có chắc muốn xóa mã bản quyền "${order.code}" khỏi hệ thống?`)) return;
    try {
      const res = await fetch(`/api/orders?id=${order.id}&code=${encodeURIComponent(order.code)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== order.id && o.code !== order.code));
        showToast(`Đã xóa mã bản quyền ${order.code} thành công!`);
        if (selectedOrder?.id === order.id) setSelectedOrder(null);
      }
    } catch {
      showToast("Lỗi khi xóa mã bản quyền.");
    }
  };

  const handleCreateNewCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewCode(true);

    try {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const custPrefix = "KH" + Date.now().toString().slice(-3);
      const invPrefix = "HD" + randomNum;

      let code = "";
      let packTitle = "";
      let allowedCategorySlug = "";
      let unlockedSlug: string | undefined = undefined;
      let unlockedSlugs: string[] | undefined = undefined;
      let creditAmount = 249000;
      let sampleSlug = "lion";

      if (newCodeType === "SINGLE") {
        const card = productsList.find((p) => p.slug === newSingleSlug) || productsList[0];
        const cardSlugUpper = (card?.slug || "lion").toUpperCase();
        const catSlugClean = (card?.categorySlug || "DONGVAT").toUpperCase().replace(/-/g, "");
        code = `SINGLE-${cardSlugUpper}-${catSlugClean}-${custPrefix}-${invPrefix}`;
        packTitle = `Thẻ Lẻ: ${card?.nameVi || "Sư Tử"} (${cardSlugUpper})`;
        allowedCategorySlug = card?.categorySlug || "dong-vat";
        unlockedSlug = card?.slug || "lion";
        creditAmount = card?.price || 219000;
        sampleSlug = card?.slug || "lion";
      } else if (newCodeType === "MULTI") {
        if (newMultiSlugs.length === 0) {
          alert("Vui lòng chọn ít nhất 1 thẻ bài cho gói nhiều thẻ!");
          setIsSubmittingNewCode(false);
          return;
        }
        const countStr = String(newMultiSlugs.length).padStart(2, "0") + "THE";
        code = `MULTI-${countStr}-TONGHOP-${custPrefix}-${invPrefix}`;
        packTitle = `Gói ${newMultiSlugs.length} Thẻ Tự Chọn Poly Cards`;
        unlockedSlugs = [...newMultiSlugs];
        allowedCategorySlug = "tong-hop";
        creditAmount = newMultiSlugs.length * 219000;
        sampleSlug = newMultiSlugs[0] || "lion";
      } else {
        const catClean = newPackCategory.toUpperCase().replace(/-/g, "");
        code = `PACK-${catClean}-${custPrefix}-${invPrefix}`;
        const catObj = categoriesList.find((c) => c.slug === newPackCategory);
        packTitle = `Bộ 30 Thẻ AR ${catObj?.name || "Động Vật"}`;
        allowedCategorySlug = newPackCategory;
        creditAmount = 249000;
        sampleSlug = newPackCategory === "hanh-dong" ? "jump" : newPackCategory === "xe-co" ? "car" : "lion";
      }

      const newOrderPayload: Partial<SeedOrderItem> = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        code,
        codeType: newCodeType,
        unlockedSlug,
        unlockedSlugs,
        customerType: "TRUCTIEP",
        customerName: newCustomerName.trim() || "Khách Hàng Quầy",
        customerPhone: newCustomerPhone.trim(),
        packId: `cat-${allowedCategorySlug}`,
        packCode: code,
        packTitle,
        allowedCategorySlug,
        creditAmount,
        debitAmount: creditAmount,
        remainingAmount: 0,
        paymentMethod: "TIEN_MAT",
        status: "PAID",
        directUrl: `https://polycards-one.vercel.app/ar/${sampleSlug}?ar=1&code=${code}`,
        note: `Mã bản quyền sinh thủ công trong Studio`,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrderPayload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOrders((prev) => [json.data, ...prev]);
          showToast(`Đã sinh mã [${code}] thành công!`);
          setIsCreateModalOpen(false);
          setSelectedOrder(json.data);
        }
      }
    } catch (e: any) {
      showToast(`Lỗi tạo mã: ${e.message}`);
    } finally {
      setIsSubmittingNewCode(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 border border-amber-400 text-amber-300 font-bold px-4 py-2.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 text-xs flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER QUẢN LÝ MÃ THẺ / BỘ */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-stone-900 to-amber-950/40 border border-purple-400/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-400/30">
              License &amp; Code Studio
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <PackageCheck className="h-6 w-6 text-purple-400" />
            <span>Quản Lý Mã Bản Quyền Thẻ &amp; Bộ</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Quản lý, tra cứu và kiểm thử toàn bộ mã bản quyền phân quyền: <strong>Thẻ Lẻ (SINGLE)</strong>, <strong>Nhiều Thẻ (MULTI)</strong> và <strong>Trọn Bộ (PACK)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadOrders}
            className="py-2.5 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
            title="Đồng bộ lại danh sách mã"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm Mới</span>
          </button>

          {onNavigateToPOS && (
            <button
              type="button"
              onClick={onNavigateToPOS}
              className="py-2.5 px-3.5 rounded-xl bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-purple-400/30 transition-all cursor-pointer"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Bán Tại POS</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Cấp Mã Bản Quyền Mới</span>
          </button>
        </div>
      </div>

      {/* METRIC STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-white/10 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 block">Tổng Mã Bản Quyền</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">{stats.total}</span>
            <span className="text-[10px] text-stone-500 font-bold">Tất cả định dạng</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-400/30 space-y-1">
          <span className="text-[11px] font-bold text-sky-300 block">Mã Thẻ Lẻ (SINGLE)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-sky-400 font-mono">{stats.single}</span>
            <span className="text-[10px] text-sky-300/70 font-bold">1 thẻ duy nhất</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-400/30 space-y-1">
          <span className="text-[11px] font-bold text-indigo-300 block">Mã Nhiều Thẻ (MULTI)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-400 font-mono">{stats.multi}</span>
            <span className="text-[10px] text-indigo-300/70 font-bold">Gói $N$ thẻ tự chọn</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/30 space-y-1">
          <span className="text-[11px] font-bold text-purple-300 block">Mã Theo Bộ (PACK)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-300 font-mono">{stats.pack}</span>
            <span className="text-[10px] text-purple-300/70 font-bold">Trọn bộ 30 thẻ</span>
          </div>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
          <input
            type="text"
            placeholder="Tìm theo mã code, khách hàng, số điện thoại, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-white/15 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-purple-400"
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
          {/* Lọc phân loại mã */}
          <div className="flex items-center p-1 rounded-xl bg-stone-900 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === "ALL" ? "bg-purple-500 text-white" : "text-stone-400 hover:text-white"
              }`}
            >
              Tất Cả
            </button>
            <button
              type="button"
              onClick={() => setFilterType("SINGLE")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === "SINGLE" ? "bg-sky-500 text-white" : "text-stone-400 hover:text-white"
              }`}
            >
              Thẻ Lẻ
            </button>
            <button
              type="button"
              onClick={() => setFilterType("MULTI")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === "MULTI" ? "bg-indigo-500 text-white" : "text-stone-400 hover:text-white"
              }`}
            >
              Nhiều Thẻ
            </button>
            <button
              type="button"
              onClick={() => setFilterType("PACK")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === "PACK" ? "bg-purple-500 text-white" : "text-stone-400 hover:text-white"
              }`}
            >
              Theo Bộ
            </button>
          </div>

          {/* Lọc danh mục */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-stone-900 border border-white/15 text-stone-300 font-bold text-xs rounded-xl px-3 py-2 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Tất cả danh mục</option>
            {categoriesList.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BẢNG DANH SÁCH MÃ BẢN QUYỀN */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs text-stone-400 font-bold">Đang tải danh sách mã bản quyền...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-stone-900/40 border border-dashed border-white/10 p-8 space-y-3">
          <PackageCheck className="h-10 w-10 text-stone-600 mx-auto" />
          <h4 className="text-sm font-bold text-stone-300">Không tìm thấy mã bản quyền nào</h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Thử tìm kiếm với từ khóa khác hoặc bấm nút "+ Cấp Mã Bản Quyền Mới" ở góc trên.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-stone-900/90 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-stone-950/80 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 min-w-[200px]">Mã Bản Quyền</th>
                  <th className="py-3 px-3 min-w-[100px]">Phân Loại</th>
                  <th className="py-3 px-4 min-w-[220px]">Quyền Mở Khóa</th>
                  <th className="py-3 px-3 min-w-[160px]">Khách Hàng</th>
                  <th className="py-3 px-3 min-w-[110px]">Thanh Toán</th>
                  <th className="py-3 px-3 min-w-[120px]">Thời Gian</th>
                  <th className="py-3 px-4 text-right min-w-[120px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => {
                  const type =
                    order.codeType ||
                    (order.code.startsWith("SINGLE-")
                      ? "SINGLE"
                      : order.code.startsWith("MULTI-")
                      ? "MULTI"
                      : "PACK");

                  return (
                    <tr
                      key={order.id || order.code}
                      onClick={() => setSelectedOrder(order)}
                      className="group hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {/* Mã Bản Quyền */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-300 text-xs bg-black/50 px-2 py-1 rounded-lg border border-amber-400/30">
                            {order.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(order.code);
                            }}
                            className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Sao chép mã"
                          >
                            {copiedCode === order.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Phân Loại */}
                      <td className="py-3 px-3">
                        {type === "SINGLE" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/30">
                            THẺ LẺ
                          </span>
                        ) : type === "MULTI" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                            NHIỀU THẺ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/30">
                            THEO BỘ
                          </span>
                        )}
                      </td>

                      {/* Quyền Mở Khóa */}
                      <td className="py-3 px-4">
                        {type === "SINGLE" ? (
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                            <span className="font-bold text-white">
                              {order.unlockedSlug
                                ? `Thẻ: /${order.unlockedSlug}`
                                : order.packTitle}
                            </span>
                          </div>
                        ) : type === "MULTI" ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                              <Layers className="h-3.5 w-3.5" />
                              <span>{order.unlockedSlugs?.length || 0} thẻ bài:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {order.unlockedSlugs?.slice(0, 3).map((s) => (
                                <span
                                  key={s}
                                  className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/60 text-stone-300 border border-white/10"
                                >
                                  {s}
                                </span>
                              ))}
                              {(order.unlockedSlugs?.length || 0) > 3 && (
                                <span className="text-[9px] text-stone-500">
                                  +{(order.unlockedSlugs?.length || 0) - 3} thẻ
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <PackageCheck className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                            <span className="font-bold text-purple-200 truncate max-w-[200px]">
                              {order.packTitle || `Bộ ${order.allowedCategorySlug}`}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Khách Hàng */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="h-3 w-3 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{order.customerName}</span>
                        </div>
                        {order.customerPhone && (
                          <div className="text-[10px] text-stone-400 font-mono">
                            {order.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Thanh Toán */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-black text-amber-400 block">
                          {formatVndCurrency(order.creditAmount || order.totalPrice || 219000)}
                        </span>
                        <span className="text-[9px] text-stone-500">
                          {order.paymentMethod === "CHUYEN_KHOAN" ? "Chuyển khoản" : "Tiền mặt"}
                        </span>
                      </td>

                      {/* Thời Gian */}
                      <td className="py-3 px-3 text-[11px] text-stone-400">
                        {order.createdAt || "Vừa tạo"}
                      </td>

                      {/* Thao Tác */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white border border-white/10 transition-colors"
                            title="Xem chi tiết & mã QR"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-colors"
                            title="Xóa mã này"
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

      {/* MODAL CHI TIẾT MÃ BẢN QUYỀN & MÃ QR WEBAR */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full bg-stone-900 border-2 border-purple-400/50 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden max-h-[92dvh]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-stone-950/95 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-black">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Chi Tiết Mã Bản Quyền Thẻ</h3>
                  <p className="text-[11px] text-purple-300/80 font-mono">{selectedOrder.code}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                {/* QR Code preview */}
                <div className="sm:col-span-5 text-center space-y-2.5">
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white p-3 border-2 border-amber-400/60 shadow-xl mx-auto max-w-[220px]">
                    {detailQrUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={detailQrUrl} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                        Đang tạo QR...
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Quét camera điện thoại để kiểm thử mở khóa thực tế ảo AR
                  </p>
                  <a
                    href={selectedOrder.directUrl || `/ar/${selectedOrder.unlockedSlug || "lion"}?ar=1&code=${selectedOrder.code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-400 text-stone-950 font-black text-xs hover:bg-amber-300 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Mở Link Trực Tiếp</span>
                  </a>
                </div>

                {/* Thông tin chi tiết */}
                <div className="sm:col-span-7 space-y-3 text-xs">
                  {/* Mã code */}
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Mã Bản Quyền Định Danh:
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-amber-300">
                        {selectedOrder.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedOrder.code)}
                        className="py-1 px-2 rounded bg-white/10 hover:bg-white/20 text-stone-200 text-[10px] font-bold flex items-center gap-1"
                      >
                        {copiedCode === selectedOrder.code ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedCode === selectedOrder.code ? "Đã Chép" : "Chép"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Phạm vi bản quyền */}
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-400/30 space-y-1.5">
                    <span className="text-[10px] text-purple-300 uppercase font-bold block">
                      Phạm Vi Quyền Mở Khóa:
                    </span>
                    <div className="font-bold text-white">
                      {selectedOrder.packTitle}
                    </div>
                    {selectedOrder.unlockedSlug && (
                      <div className="text-[11px] text-sky-300 font-mono">
                        Chỉ mở khóa thẻ: <strong>/{selectedOrder.unlockedSlug}</strong>
                      </div>
                    )}
                    {Array.isArray(selectedOrder.unlockedSlugs) && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {selectedOrder.unlockedSlugs.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-200 border border-purple-400/40 text-[10px] font-mono font-bold"
                          >
                            /{s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thông tin khách hàng & hóa đơn */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Khách hàng:</span>
                      <strong className="text-white">{selectedOrder.customerName}</strong>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Số điện thoại:</span>
                        <strong className="text-stone-200 font-mono">{selectedOrder.customerPhone}</strong>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Mã hóa đơn:</span>
                      <strong className="text-amber-400 font-mono">{selectedOrder.id}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Số tiền:</span>
                      <strong className="text-amber-400 font-mono">
                        {formatVndCurrency(selectedOrder.creditAmount || selectedOrder.totalPrice || 219000)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẤP MÃ BẢN QUYỀN MỚI THỦ CÔNG */}
      {isCreateModalOpen && (
        <div
          onClick={() => setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full bg-stone-900 border-2 border-amber-400/50 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden max-h-[90dvh]"
          >
            <div className="px-5 py-4 border-b border-white/10 bg-stone-950 flex items-center justify-between">
              <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                <Plus className="h-5 w-5 text-amber-400" />
                <span>Cấp Mã Bản Quyền Mới Thủ Công</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCode} className="p-5 space-y-4 overflow-y-auto">
              {/* Chọn loại mã */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  1. Chọn Loại Bản Quyền *:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCodeType("SINGLE")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      newCodeType === "SINGLE"
                        ? "bg-sky-500 text-white border-sky-400 shadow-md font-black"
                        : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                    }`}
                  >
                    1 Thẻ Lẻ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCodeType("MULTI")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      newCodeType === "MULTI"
                        ? "bg-indigo-500 text-white border-indigo-400 shadow-md font-black"
                        : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                    }`}
                  >
                    Nhiều Thẻ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCodeType("PACK")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      newCodeType === "PACK"
                        ? "bg-purple-500 text-white border-purple-400 shadow-md font-black"
                        : "bg-black/50 text-stone-400 border-white/10 hover:text-white"
                    }`}
                  >
                    Theo Bộ (30 Thẻ)
                  </button>
                </div>
              </div>

              {/* Chi tiết theo loại */}
              {newCodeType === "SINGLE" && (
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Chọn Thẻ Bài Cần Mở Khóa *:
                  </label>
                  <select
                    value={newSingleSlug}
                    onChange={(e) => setNewSingleSlug(e.target.value)}
                    className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-amber-400 cursor-pointer"
                  >
                    {productsList.map((p) => (
                      <option key={p.id || p.slug} value={p.slug}>
                        {p.nameVi} ({p.nameEn}) - /{p.slug} - {p.category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newCodeType === "MULTI" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-300">
                    Chọn Các Thẻ Trong Gói (Đã chọn: {newMultiSlugs.length} thẻ):
                  </label>
                  <div className="max-h-40 overflow-y-auto p-2 rounded-xl bg-black/60 border border-white/10 grid grid-cols-2 gap-1.5 text-[11px]">
                    {productsList.map((p) => {
                      const isChecked = newMultiSlugs.includes(p.slug);
                      return (
                        <label
                          key={p.id || p.slug}
                          className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? "bg-indigo-500/30 text-white" : "hover:bg-white/5 text-stone-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setNewMultiSlugs((prev) => [...prev, p.slug]);
                              else setNewMultiSlugs((prev) => prev.filter((s) => s !== p.slug));
                            }}
                            className="rounded border-stone-700 text-indigo-500"
                          />
                          <span className="truncate">{p.nameVi} ({p.nameEn})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {newCodeType === "PACK" && (
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Chọn Danh Mục Bộ Thẻ *:
                  </label>
                  <select
                    value={newPackCategory}
                    onChange={(e) => setNewPackCategory(e.target.value)}
                    className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-amber-400 cursor-pointer"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.slug}>
                        Bộ 30 Thẻ {c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Thông tin khách */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Tên Khách Hàng:
                  </label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Anh Nam / Quầy 1..."
                    className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Số Điện Thoại:
                  </label>
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingNewCode}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSubmittingNewCode ? "Đang Sinh Mã..." : "Sinh Mã Bản Quyền & Lưu Hệ Thống"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
