"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Boxes,
  Warehouse,
  PackagePlus,
  PackageMinus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Banknote,
  Calendar,
  X,
  Plus,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Sparkles,
  Info,
  Check,
  Eye,
  FileText,
} from "lucide-react";
import {
  InventoryItem,
  InventoryTransaction,
  InventoryStats,
  InventoryTransactionType,
} from "@/types/inventory";
import { formatVndCurrency } from "@/lib/formatters";

interface InventoryTabProps {
  onShowToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
  onNavigateToInvoices?: () => void;
}

export function InventoryTab({ onShowToast, onNavigateToInvoices }: InventoryTabProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Modal Nhập Kho Lô Mới
  const [isStockInModalOpen, setIsStockInModalOpen] = useState<boolean>(false);
  const [stockInForm, setStockInForm] = useState<{
    packCode: string;
    quantity: number;
    unitCost: number;
    note: string;
  }>({
    packCode: "POLY30-DONGVAT-ENVI",
    quantity: 50,
    unitCost: 85000,
    note: "Nhập xưởng in lô mới đóng hộp thành phẩm",
  });
  const [isSubmittingStockIn, setIsSubmittingStockIn] = useState<boolean>(false);

  // Modal Xuất Kho Thủ Công
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState<boolean>(false);
  const [stockOutForm, setStockOutForm] = useState<{
    packCode: string;
    quantity: number;
    reason: string;
    note: string;
  }>({
    packCode: "POLY30-DONGVAT-ENVI",
    quantity: 1,
    reason: "Mẫu thử nghiệm / Tặng đối tác",
    note: "",
  });
  const [isSubmittingStockOut, setIsSubmittingStockOut] = useState<boolean>(false);

  // Modal Xem chi tiết 30 thẻ con của bộ
  const [viewingPack, setViewingPack] = useState<InventoryItem | null>(null);

  // Tải dữ liệu kho từ API
  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/inventory?limit=50");
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data.items || []);
        setTransactions(json.data.transactions || []);
        setStats(json.data.stats || null);
      } else {
        onShowToast(json.message || "Không thể tải dữ liệu kho hàng.", "error");
      }
    } catch {
      onShowToast("Lỗi kết nối khi tải dữ liệu kho hàng.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Xử lý bật/tắt Đặt Hàng Trước (Allow Backorder)
  const handleToggleBackorder = async (item: InventoryItem) => {
    const nextState = !item.allowBackorder;
    // Optimistic UI
    setItems((prev) =>
      prev.map((i) => (i.packCode === item.packCode ? { ...i, allowBackorder: nextState } : i))
    );

    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packCode: item.packCode,
          allowBackorder: nextState,
        }),
      });
      if (res.ok) {
        onShowToast(
          `Đã ${nextState ? "bật" : "tắt"} chế độ Đặt Hàng Trước cho "${item.name}".`,
          "info"
        );
      } else {
        // Rollback
        setItems((prev) =>
          prev.map((i) => (i.packCode === item.packCode ? { ...i, allowBackorder: item.allowBackorder } : i))
        );
        onShowToast("Lỗi khi lưu cấu hình kho.", "error");
      }
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.packCode === item.packCode ? { ...i, allowBackorder: item.allowBackorder } : i))
      );
      onShowToast("Lỗi kết nối khi cập nhật cấu hình kho.", "error");
    }
  };

  // Xử lý submit Nhập Kho Lô Mới
  const handleSubmitStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInForm.packCode || stockInForm.quantity <= 0) {
      onShowToast("Vui lòng chọn bộ thẻ và số lượng nhập hợp lệ.", "warning");
      return;
    }

    try {
      setIsSubmittingStockIn(true);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packCode: stockInForm.packCode,
          type: "STOCK_IN",
          quantity: stockInForm.quantity,
          unitCost: stockInForm.unitCost,
          note: stockInForm.note,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onShowToast(`Nhập kho thành công +${stockInForm.quantity} hộp từ xưởng in!`, "success");
        setIsStockInModalOpen(false);
        loadInventory();
      } else {
        onShowToast(json.message || "Lỗi nhập kho.", "error");
      }
    } catch {
      onShowToast("Lỗi kết nối khi gửi phiếu nhập kho.", "error");
    } finally {
      setIsSubmittingStockIn(false);
    }
  };

  // Xử lý submit Xuất Kho Thủ Công
  const handleSubmitStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockOutForm.packCode || stockOutForm.quantity <= 0) {
      onShowToast("Vui lòng chọn bộ thẻ và số lượng xuất hợp lệ.", "warning");
      return;
    }

    try {
      setIsSubmittingStockOut(true);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packCode: stockOutForm.packCode,
          type: "STOCK_OUT",
          quantity: stockOutForm.quantity,
          note: `${stockOutForm.reason}: ${stockOutForm.note}`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onShowToast(`Đã xuất kho -${stockOutForm.quantity} hộp thành công!`, "info");
        setIsStockOutModalOpen(false);
        loadInventory();
      } else {
        onShowToast(json.message || "Lỗi xuất kho.", "error");
      }
    } catch {
      onShowToast("Lỗi kết nối khi gửi phiếu xuất kho.", "error");
    } finally {
      setIsSubmittingStockOut(false);
    }
  };

  // Lọc danh sách 10 bộ theo từ khóa & danh mục
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.packCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat =
        selectedCategory === "ALL" ||
        item.categorySlug.toLowerCase() === selectedCategory.toLowerCase();

      return matchQuery && matchCat;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* 1. THẺ THỐNG KÊ REALTIME TRẠNG THÁI KHO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng quy mô 10 bộ */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 block">Quy Mô Sản Phẩm</span>
            <Boxes className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">
              {stats?.totalPacksCount || items.length} Bộ
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-bold">
              300 Thẻ AR
            </span>
          </div>
          <p className="text-[10px] text-stone-500">Đóng hộp thành phẩm xuất xưởng</p>
        </div>

        {/* Card 2: Hộp thực tế đang cầm trên tay */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 block">Tồn Kho Thực Tế</span>
            <Warehouse className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {stats?.totalOnHand ?? 0}
            </span>
            <span className="text-[10px] text-emerald-300 font-bold">Hộp sẵn có</span>
          </div>
          <p className="text-[10px] text-stone-500">Đang nằm tại kho sẵn sàng gửi bưu tá</p>
        </div>

        {/* Card 3: Khách đặt trước (Đang nợ đơn khách) */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-400/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 block">Đang Nợ Đơn Khách</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {stats?.totalBackordered ?? 0}
            </span>
            <span className="text-[10px] text-amber-300/80 font-bold">Chờ xưởng in</span>
          </div>
          <p className="text-[10px] text-stone-500">Khách đã đặt trước qua Web/POS</p>
        </div>

        {/* Card 4: Tình trạng cần in thêm */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400 block">Cần Đặt Xưởng In Gấp</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {(stats?.outOfStockCount ?? 0) + (stats?.lowStockCount ?? 0)}
            </span>
            <span className="text-[10px] text-rose-300 font-bold">Mặt hàng</span>
          </div>
          <p className="text-[10px] text-stone-500">Tồn kho dưới ngưỡng an toàn</p>
        </div>
      </div>

      {/* 2. THANH THÔNG BÁO VẬN HÀNH "ĐẶT TRƯỚC (BACK-ORDER)" */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-stone-900 to-sky-500/10 border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              <span>Chính Sách Bán Hàng Đặt Trước (Pre-order / Backorder)</span>
              <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Đang Kích Hoạt
              </span>
            </h4>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Khách đặt online hoặc quầy POS vẫn chốt đơn bình thường khi kho chưa có hàng. Khi xưởng in giao lô mới, hệ thống sẽ tự động bù trừ số lượng nợ khách.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsStockInModalOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <PackagePlus className="h-4 w-4" />
            <span>+ Nhập Kho Lô Mới</span>
          </button>
          <button
            type="button"
            onClick={() => setIsStockOutModalOpen(true)}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PackageMinus className="h-4 w-4" />
            <span>- Xuất Thủ Công</span>
          </button>
        </div>
      </div>

      {/* 3. BỐ CỤC 2 CỘT CHUẨN MỰC: 
          CỘT TRÁI (DANH SÁCH 10 BỘ CẤU HÌNH & TỒN) | CỘT PHẢI (SỔ CÁI BIẾN ĐỘNG KHO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* CỘT TRÁI (LG: 7 CỘT): DANH MỤC 10 BỘ & TRẠNG THÁI TỒN KHO */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header & Thanh tìm kiếm lọc */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-amber-400" />
                  <span>Danh Mục 10 Bộ Thành Phẩm Poly Cards</span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  Quản lý số lượng tồn thực tế &amp; cấu hình bán đặt trước
                </p>
              </div>
              <button
                type="button"
                onClick={loadInventory}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Làm mới danh sách"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Filter Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên bộ, mã POLY30-..."
                  className="w-full bg-stone-950 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-stone-950 border border-white/10 text-stone-300 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Mọi danh mục thẻ bài</option>
                <option value="dong-vat">Động Vật Hoang Dã</option>
                <option value="xe-co">Phương Tiện Giao Thông</option>
                <option value="hoa-qua">Trái Cây &amp; Hoa Quả</option>
                <option value="hanh-dong">Hành Động &amp; Thể Chất</option>
                <option value="nghe-nghiep">Nghề Nghiệp Ước Mơ</option>
              </select>
            </div>
          </div>

          {/* Danh sách 10 Bộ */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="py-16 text-center space-y-2 bg-stone-900/40 rounded-3xl border border-white/5">
                <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-xs text-stone-400">Đang đồng bộ dữ liệu tồn kho 10 bộ...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center bg-stone-900/40 rounded-3xl border border-dashed border-white/10 p-6 space-y-2">
                <Boxes className="h-8 w-8 text-stone-600 mx-auto" />
                <p className="text-xs text-stone-400">Không tìm thấy bộ sản phẩm nào phù hợp.</p>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const onHand = item.onHand || 0;
                const backordered = item.backorderCount || 0;
                const available = onHand - backordered;

                return (
                  <div
                    key={item.packCode}
                    className="p-4 rounded-2xl bg-stone-900/80 border border-white/10 hover:border-amber-400/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Ảnh bìa */}
                        <div className="h-12 w-12 rounded-xl bg-stone-950 border border-white/10 overflow-hidden shrink-0 p-1 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageSrc}
                            alt={item.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-stone-300">
                              #{idx + 1}
                            </span>
                            <span className="font-mono text-[10px] font-black text-amber-400">
                              {item.packCode}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-white truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-stone-400">
                            <span>{item.categoryName}</span>
                            <span>•</span>
                            <span>{item.cardsCount} Thẻ AR</span>
                            <span>•</span>
                            <span className="font-mono font-bold text-amber-300">
                              {formatVndCurrency(item.price)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nút Xem 30 thẻ */}
                      <button
                        type="button"
                        onClick={() => setViewingPack(item)}
                        className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-[11px] font-bold border border-white/10 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                        title="Xem danh sách 30 thẻ bài bên trong"
                      >
                        <Eye className="h-3 w-3" />
                        <span>30 Thẻ</span>
                      </button>
                    </div>

                    {/* Khối Đo Lường Tồn Kho */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                      {/* Tồn thực tế */}
                      <div className="p-2 rounded-xl bg-stone-950/70 border border-white/5">
                        <span className="text-[10px] text-stone-400 block">Tồn Thực Tế</span>
                        <span
                          className={`font-mono text-base font-black ${
                            onHand > 0 ? "text-emerald-400" : "text-stone-500"
                          }`}
                        >
                          {onHand} hộp
                        </span>
                      </div>

                      {/* Nợ khách (Backordered) */}
                      <div className="p-2 rounded-xl bg-stone-950/70 border border-white/5">
                        <span className="text-[10px] text-stone-400 block">Đang Nợ Khách</span>
                        <span
                          className={`font-mono text-base font-black ${
                            backordered > 0 ? "text-amber-400" : "text-stone-500"
                          }`}
                        >
                          {backordered} hộp
                        </span>
                      </div>

                      {/* Khả dụng */}
                      <div className="p-2 rounded-xl bg-stone-950/70 border border-white/5">
                        <span className="text-[10px] text-stone-400 block">Khả Dụng Bán</span>
                        <span
                          className={`font-mono text-base font-black ${
                            available > 0
                              ? "text-emerald-300"
                              : available < 0
                              ? "text-rose-400"
                              : "text-amber-400"
                          }`}
                        >
                          {available} hộp
                        </span>
                      </div>
                    </div>

                    {/* Dưới cùng: Toggle Bán Đặt Trước + Cảnh báo */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleBackorder(item)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            item.allowBackorder ? "bg-emerald-500" : "bg-stone-700"
                          }`}
                          title="Bật/Tắt cho phép đặt hàng khi kho hết"
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              item.allowBackorder ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className="text-[11px] font-medium text-stone-300">
                          {item.allowBackorder
                            ? "Cho phép đặt trước khi hết kho"
                            : "Khóa đặt hàng khi kho về 0"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setStockInForm({
                            packCode: item.packCode,
                            quantity: 50,
                            unitCost: item.unitCost || 85000,
                            note: `Nhập xưởng in cho ${item.name}`,
                          });
                          setIsStockInModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <PackagePlus className="h-3 w-3" />
                        <span>Nhập Lô Này</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* CỘT PHẢI (LG: 5 CỘT): BỘ CÔNG CỤ & SỔ CÁI BIẾN ĐỘNG KHO */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card Sổ Cái Biến Động Kho */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  Sổ Cái Biến Động Kho (Audit Ledger)
                </h3>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">
                {transactions.length} giao dịch
              </span>
            </div>

            {/* Danh sách giao dịch */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  Chưa có giao dịch biến động kho nào.
                </div>
              ) : (
                transactions.map((tx) => {
                  const isPositive = tx.quantity > 0;
                  const isOrder = tx.type === "ORDER_SALE" || tx.type === "ORDER_CANCEL_RETURN";

                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-stone-950/70 border border-white/5 space-y-1.5 hover:border-white/15 transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isPositive ? (
                            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            </div>
                          )}

                          <span className="font-bold text-white text-[11px] truncate max-w-[180px]">
                            {tx.packName}
                          </span>
                        </div>

                        {/* Số lượng biến động */}
                        <span
                          className={`font-mono font-black text-xs shrink-0 ${
                            isPositive ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {isPositive ? `+${tx.quantity}` : tx.quantity} hộp
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-400 leading-relaxed">
                        {tx.note}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-white/5 font-mono">
                        <span>
                          {tx.beforeOnHand} &rarr;{" "}
                          <strong className="text-white">{tx.afterOnHand} hộp</strong>
                        </span>
                        <span>
                          {new Date(tx.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: NHẬP KHO LÔ MỚI TỪ XƯỞNG IN */}
      {/* ======================================================== */}
      {isStockInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-stone-900 border-2 border-amber-400/60 shadow-2xl text-white p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <PackagePlus className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Nhập Kho Lô Mới Từ Xưởng In</h4>
                  <p className="text-[11px] text-stone-400">
                    Cộng dồn số lượng tồn &amp; tự động bù trừ số bộ đang nợ đơn khách
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStockInModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitStockIn} className="space-y-4 text-xs">
              {/* Chọn bộ */}
              <div className="space-y-1">
                <label className="font-bold text-stone-300 block">Chọn Bộ Thẻ Nhập Về *</label>
                <select
                  value={stockInForm.packCode}
                  onChange={(e) => setStockInForm((prev) => ({ ...prev, packCode: e.target.value }))}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:border-amber-400 focus:outline-hidden"
                >
                  {items.map((i) => (
                    <option key={i.packCode} value={i.packCode}>
                      {i.name} ({i.packCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Số lượng nhập & Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-300">Số lượng hộp nhập về *</label>
                  <span className="text-amber-400 font-mono font-bold">
                    +{stockInForm.quantity} hộp
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    required
                    value={stockInForm.quantity}
                    onChange={(e) =>
                      setStockInForm((prev) => ({
                        ...prev,
                        quantity: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    className="w-full bg-stone-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono font-black focus:border-amber-400 focus:outline-hidden"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[10, 20, 50, 100].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setStockInForm((prev) => ({ ...prev, quantity: q }))}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          stockInForm.quantity === q
                            ? "bg-amber-400 text-stone-950 border-amber-400"
                            : "bg-stone-950 text-stone-400 border-white/10 hover:text-white"
                        }`}
                      >
                        +{q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Giá vốn in ấn */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-300">Đơn giá in thành phẩm / hộp (VNĐ)</label>
                  <span className="text-stone-400 font-mono">
                    {formatVndCurrency(stockInForm.unitCost)}
                  </span>
                </div>
                <input
                  type="number"
                  step={5000}
                  value={stockInForm.unitCost}
                  onChange={(e) =>
                    setStockInForm((prev) => ({
                      ...prev,
                      unitCost: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* Ghi chú */}
              <div className="space-y-1">
                <label className="font-bold text-stone-300 block">Ghi chú diễn giải lô in</label>
                <input
                  type="text"
                  value={stockInForm.note}
                  onChange={(e) => setStockInForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Ví dụ: Lô in đợt 2, xưởng in gia công hoàn thiện có seal..."
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* Footer Form */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  disabled={isSubmittingStockIn}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStockIn}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingStockIn ? "Đang Ghi Nhận..." : "Xác Nhận Nhập Kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: XUẤT KHO THỦ CÔNG */}
      {/* ======================================================== */}
      {isStockOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-stone-900 border-2 border-amber-400/60 shadow-2xl text-white p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <PackageMinus className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Xuất Kho Thủ Công</h4>
                  <p className="text-[11px] text-stone-400">
                    Xuất tặng đối tác, hàng mẫu trải nghiệm hoặc xuất hủy thẻ lỗi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStockOutModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitStockOut} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-300 block">Chọn Bộ Thẻ Xuất *</label>
                <select
                  value={stockOutForm.packCode}
                  onChange={(e) => setStockOutForm((prev) => ({ ...prev, packCode: e.target.value }))}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:border-amber-400 focus:outline-hidden"
                >
                  {items.map((i) => (
                    <option key={i.packCode} value={i.packCode}>
                      {i.name} (Tồn: {i.onHand} hộp)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-300 block">Số lượng hộp xuất *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={stockOutForm.quantity}
                  onChange={(e) =>
                    setStockOutForm((prev) => ({
                      ...prev,
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono font-black focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-300 block">Lý do xuất</label>
                <select
                  value={stockOutForm.reason}
                  onChange={(e) => setStockOutForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:border-amber-400 focus:outline-hidden"
                >
                  <option value="Mẫu thử nghiệm / Trưng bày quầy">Mẫu thử nghiệm / Trưng bày quầy</option>
                  <option value="Tặng đối tác / Trường học">Tặng đối tác / Trường học</option>
                  <option value="Xuất hủy thẻ in lỗi / hỏng seal">Xuất hủy thẻ in lỗi / hỏng seal</option>
                  <option value="Khác">Lý do khác...</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-300 block">Ghi chú chi tiết</label>
                <input
                  type="text"
                  value={stockOutForm.note}
                  onChange={(e) => setStockOutForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Ghi rõ người nhận hoặc biên bản bàn giao..."
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsStockOutModalOpen(false)}
                  disabled={isSubmittingStockOut}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStockOut}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingStockOut ? "Đang Xuất..." : "Xác Nhận Xuất Kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: XEM CHI TIẾT 30 THẺ BÀI TRONG BỘ */}
      {/* ======================================================== */}
      {viewingPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-stone-900 border-2 border-amber-400/60 shadow-2xl text-white p-5 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{viewingPack.name}</h4>
                  <p className="text-[11px] text-stone-400">
                    Mã bộ: <strong className="font-mono text-amber-300">{viewingPack.packCode}</strong> • Gồm 30 Thẻ AR
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPack(null)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs text-stone-300">
              <p className="text-[11px] text-stone-400 leading-relaxed bg-stone-950 p-3 rounded-xl border border-white/5">
                {viewingPack.description || "Bộ thẻ học thực tế ảo tương tác 3D WebAR thông minh cho bé."}
              </p>
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs">
                Khi xuất xưởng, 30 thẻ này được xếp thành 1 hộp hoàn chỉnh. Khi khách mua bộ thẻ này, kho sẽ tự động trừ 1 hộp thành phẩm tương ứng.
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setViewingPack(null)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

