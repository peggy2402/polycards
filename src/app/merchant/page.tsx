"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  Phone,
  MessageCircle,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Package,
  Layers,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Download,
  Receipt,
  User,
  AlertTriangle,
  ArrowUpRight,
  Check,
  Copy,
} from "lucide-react";
import { formatVndCurrency } from "@/lib/formatters";
import { SeedOrderItem } from "@/data/seed-data";
import { OrderStatus } from "@/types/animal";

type TabFilter = "CHO_DUYET" | "ALL" | "DANG_GIAO" | "DA_NHAN" | "DA_HUY";

export default function MerchantAppPage() {
  const [orders, setOrders] = useState<SeedOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("CHO_DUYET");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Âm thanh thông báo Ting Ting khi có đơn mới
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [newOrderBanner, setNewOrderBanner] = useState<SeedOrderItem | null>(null);
  const knownOrderCodesRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

  // Modal hướng dẫn cài đặt PWA Add to Home Screen
  const [isPwaGuideOpen, setIsPwaGuideOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Trạng thái cập nhật nhanh đơn
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // 1. Hàm phát âm thanh chuông Ting Ting 2 nốt cao trong trẻo qua Web Audio API
  const playTingTing = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Nốt 1 (D5 - 587Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.4, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.25);

      // Nốt 2 (A5 - 880Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.5, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.55);

      // Nốt 3 (D6 - 1174Hz ngân vang)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.3);
      gain3.gain.setValueAtTime(0.6, ctx.currentTime + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(ctx.currentTime + 0.3);
      osc3.stop(ctx.currentTime + 0.9);

      // Rung điện thoại (nếu thiết bị hỗ trợ)
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 250, 100, 400]);
      }
    } catch {}
  }, [soundEnabled]);

  // 2. Tải danh sách đơn hàng từ API
  const fetchOrders = useCallback(async (isPolling = false) => {
    if (!isPolling) setIsRefreshing(true);
    try {
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const rawOrders: SeedOrderItem[] = json.data;

        // Phát hiện đơn hàng mới so với lần trước
        if (!isFirstLoadRef.current && isPolling) {
          const freshOrders = rawOrders.filter(
            (o) => !knownOrderCodesRef.current.has(o.code) && o.orderStatus !== "DA_HUY"
          );

          if (freshOrders.length > 0) {
            const latest = freshOrders[0];
            setNewOrderBanner(latest);
            playTingTing();
          }
        }

        // Cập nhật tập hợp mã đã biết
        const newSet = new Set<string>();
        rawOrders.forEach((o) => newSet.add(o.code));
        knownOrderCodesRef.current = newSet;

        setOrders(rawOrders);
      }
    } catch (err) {
      console.error("[Merchant App] Lỗi tải đơn hàng:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFirstLoadRef.current = false;
    }
  }, [playTingTing]);

  // Nạp lần đầu và thiết lập Polling thời gian thực mỗi 6 giây
  useEffect(() => {
    fetchOrders(false);
    const timer = setInterval(() => {
      fetchOrders(true);
    }, 6000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  // 3. Cập nhật nhanh trạng thái đơn hàng
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/invoices/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => ((o.id || o.code) === orderId ? { ...o, orderStatus: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // 4. Xác nhận đã thu tiền đủ
  const handleConfirmPaid = async (order: SeedOrderItem) => {
    const orderId = order.id || order.code;
    const fullAmount = order.totalPrice || order.creditAmount || 0;
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/invoices/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          debitAmount: fullAmount,
          orderStatus: "DA_NHAN",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            (o.id || o.code) === orderId
              ? {
                  ...o,
                  debitAmount: fullAmount,
                  remainingAmount: 0,
                  status: "PAID",
                  orderStatus: "DA_NHAN",
                }
              : o
          )
        );
      }
    } catch (err) {
      console.error("Lỗi xác nhận thanh toán:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Sao chép mã đơn
  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {}
  };

  // 5. Tính toán các chỉ số thống kê trong ngày
  const stats = useMemo(() => {
    let pendingCount = 0;
    let shippingCount = 0;
    let successCount = 0;
    let totalRevenue = 0;
    let totalExpected = 0;

    orders.forEach((o) => {
      if (o.orderStatus === "DA_HUY") return;

      const cred = Number(o.creditAmount || o.totalPrice || 0);
      const deb = Number(o.debitAmount || 0);
      totalRevenue += deb;
      totalExpected += cred;

      if (!o.orderStatus || o.orderStatus === "CHO_DUYET") {
        pendingCount++;
      } else if (o.orderStatus === "DANG_GIAO") {
        shippingCount++;
      } else if (o.orderStatus === "DA_NHAN") {
        successCount++;
      }
    });

    return {
      pendingCount,
      shippingCount,
      successCount,
      totalRevenue,
      totalExpected,
    };
  }, [orders]);

  // 6. Lọc danh sách theo tab và ô tìm kiếm
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Lọc theo tab
    if (activeTab === "CHO_DUYET") {
      result = result.filter((o) => !o.orderStatus || o.orderStatus === "CHO_DUYET");
    } else if (activeTab === "DANG_GIAO") {
      result = result.filter((o) => o.orderStatus === "DANG_GIAO");
    } else if (activeTab === "DA_NHAN") {
      result = result.filter((o) => o.orderStatus === "DA_NHAN");
    } else if (activeTab === "DA_HUY") {
      result = result.filter((o) => o.orderStatus === "DA_HUY");
    }

    // Lọc theo từ khóa tìm kiếm (Tên, SĐT, Mã đơn)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerPhone && o.customerPhone.includes(q))
      );
    }

    // Sắp xếp đơn mới nhất lên trên
    result.sort((a, b) => {
      const tA = new Date(a.createdAt || 0).getTime();
      const tB = new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });

    return result;
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 antialiased selection:bg-amber-400 selection:text-stone-950 flex flex-col">
      {/* ================= TOP NAV BAR (STANDALONE PWA HEADER) ================= */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-white/10 pt-safe-top">
        <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 max-w-4xl mx-auto">
          {/* Logo & Tên Web App */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-400/20 shrink-0">
              PC
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm text-white tracking-tight">Poly Merchant</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-stone-400 block font-medium truncate">
                Nhận Đơn Thời Gian Thực (Live)
              </span>
            </div>
          </div>

          {/* Công cụ góc phải: Chuông báo & Cài PWA */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Nút Bật/Tắt Chuông Báo */}
            <button
              type="button"
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                if (nextState) playTingTing();
              }}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                soundEnabled
                  ? "bg-amber-400/10 border-amber-400/40 text-amber-300"
                  : "bg-white/5 border-white/10 text-stone-500 hover:text-stone-300"
              }`}
              title={soundEnabled ? "Chuông báo đang BẬT" : "Chuông báo đang TẮT"}
            >
              {soundEnabled ? (
                <>
                  <Bell className="h-4 w-4 text-amber-400 animate-wiggle" />
                  <span className="hidden sm:inline text-[11px] font-black">Chuông: BẬT</span>
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 text-stone-500" />
                  <span className="hidden sm:inline text-[11px]">Chuông: TẮT</span>
                </>
              )}
            </button>

            {/* Nút Làm Mới */}
            <button
              type="button"
              onClick={() => fetchOrders(false)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 text-xs transition-colors cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            </button>

            {/* Nút Cài Đặt Ra Màn Hình Chính */}
            <button
              type="button"
              onClick={() => setIsPwaGuideOpen(true)}
              className="px-2.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Cài App</span>
            </button>
          </div>
        </div>

        {/* Banner Đơn Mới Vừa Xuất Hiện (Tự Ẩn hoặc Bấm Để Tắt) */}
        {newOrderBanner && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 px-4 py-2 border-b border-amber-300/40 animate-in slide-in-from-top duration-300 shadow-lg">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-4 w-4 shrink-0 text-stone-950 animate-bounce" />
                <span className="font-black truncate">
                  ĐƠN MỚI: #{newOrderBanner.code} • {newOrderBanner.customerName} ({formatVndCurrency(newOrderBanner.totalPrice || newOrderBanner.creditAmount || 0)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNewOrderBanner(null)}
                className="px-2 py-0.5 rounded-lg bg-stone-950/20 hover:bg-stone-950/40 text-stone-950 font-black text-[11px] shrink-0"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ================= BODY CONTENT ================= */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 space-y-4 pb-28">
        {/* KPI CARDS (TỔNG QUAN NHANH TRONG NGÀY) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* 1. Đơn Chờ Duyệt */}
          <div
            onClick={() => setActiveTab("CHO_DUYET")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "CHO_DUYET"
                ? "bg-amber-400/15 border-amber-400 shadow-md shadow-amber-400/10 scale-[1.01]"
                : "bg-stone-900/80 border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-stone-400">Chờ Duyệt</span>
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {stats.pendingCount}
            </div>
            <span className="text-[10px] text-stone-500 font-medium">Cần chuẩn bị gấp</span>
          </div>

          {/* 2. Đang Vận Chuyển */}
          <div
            onClick={() => setActiveTab("DANG_GIAO")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "DANG_GIAO"
                ? "bg-sky-400/15 border-sky-400 shadow-md shadow-sky-400/10 scale-[1.01]"
                : "bg-stone-900/80 border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-stone-400">Đang Giao</span>
              <Truck className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-400">
              {stats.shippingCount}
            </div>
            <span className="text-[10px] text-stone-500 font-medium">Bưu tá đang phát</span>
          </div>

          {/* 3. Doanh Thu Thực Thu */}
          <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-stone-400">Thực Thu</span>
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono truncate">
              {formatVndCurrency(stats.totalRevenue)}
            </div>
            <span className="text-[10px] text-stone-500 font-medium truncate block">
              Dự kiến: {formatVndCurrency(stats.totalExpected)}
            </span>
          </div>
        </div>

        {/* Ô TÌM KIẾM ĐƠN HÀNG */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khách, số điện thoại, mã đơn..."
            className="w-full bg-stone-900 border border-white/10 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-stone-500 focus:border-amber-400 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* THANH TAB LỌC TRẠNG THÁI VUỐT CHẠM MOBILE */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 touch-pan-x">
          <button
            type="button"
            onClick={() => setActiveTab("CHO_DUYET")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "CHO_DUYET"
                ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20"
                : "bg-stone-900 text-stone-400 hover:text-white"
            }`}
          >
            <span>Chờ Duyệt</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-950/20 font-black">
              {stats.pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20"
                : "bg-stone-900 text-stone-400 hover:text-white"
            }`}
          >
            Tất Cả ({orders.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DANG_GIAO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "DANG_GIAO"
                ? "bg-sky-400 text-stone-950 shadow-md shadow-sky-400/20"
                : "bg-stone-900 text-stone-400 hover:text-white"
            }`}
          >
            <span>Đang Giao</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-950/20 font-black">
              {stats.shippingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DA_NHAN")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
              activeTab === "DA_NHAN"
                ? "bg-emerald-400 text-stone-950 shadow-md shadow-emerald-400/20"
                : "bg-stone-900 text-stone-400 hover:text-white"
            }`}
          >
            Đã Nhận ({stats.successCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DA_HUY")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
              activeTab === "DA_HUY"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-stone-900 text-stone-400 hover:text-white"
            }`}
          >
            Đã Hủy
          </button>
        </div>

        {/* DANH SÁCH THẺ ĐƠN HÀNG */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="h-6 w-6 text-amber-400 animate-spin mx-auto" />
            <span className="text-xs text-stone-400 block font-medium">Đang tải đơn hàng mới nhất...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-stone-900/40 border border-white/5 space-y-3 p-6">
            <Package className="h-10 w-10 text-stone-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">Không có đơn hàng nào trong mục này</h3>
            <p className="text-xs text-stone-500">
              {searchQuery ? "Không tìm thấy đơn khớp với từ khóa." : "Hệ thống đang sẵn sàng đón nhận đơn mới!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const orderId = order.id || order.code;
              const isUpdating = updatingOrderId === orderId;
              const cleanPhone = (order.customerPhone || "").replace(/[^0-9]/g, "");
              const isPaid = (order.remainingAmount !== undefined ? order.remainingAmount : (order.creditAmount || order.totalPrice || 0) - (order.debitAmount || 0)) <= 0;
              const totalAmount = order.totalPrice || order.creditAmount || 0;
              const debitAmount = order.debitAmount || 0;
              const status = order.orderStatus || "CHO_DUYET";

              return (
                <div
                  key={orderId}
                  className={`rounded-3xl border-2 transition-all p-4 space-y-3.5 bg-stone-900/90 ${
                    status === "CHO_DUYET"
                      ? "border-amber-400/60 shadow-lg shadow-amber-400/5"
                      : status === "DANG_GIAO"
                      ? "border-sky-400/40"
                      : status === "DA_NHAN"
                      ? "border-emerald-500/30"
                      : "border-white/10 opacity-70"
                  }`}
                >
                  {/* Hàng 1: Mã đơn, Thời gian, Badge Trạng Thái */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs sm:text-sm font-black text-amber-400">
                        #{order.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(order.code)}
                        className="text-stone-500 hover:text-white p-0.5"
                        title="Sao chép mã"
                      >
                        {copiedCode === order.code ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Vừa xong"}
                      </span>
                    </div>

                    {/* Badge Trạng Thái */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        status === "CHO_DUYET"
                          ? "bg-amber-400 text-stone-950 animate-pulse"
                          : status === "DANG_GIAO"
                          ? "bg-sky-400 text-stone-950"
                          : status === "DA_NHAN"
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {status === "CHO_DUYET"
                        ? "Chờ Duyệt"
                        : status === "DANG_GIAO"
                        ? "Đang Giao"
                        : status === "DA_NHAN"
                        ? "Đã Nhận"
                        : "Đã Hủy"}
                    </span>
                  </div>

                  {/* Hàng 2: Thông tin Khách Hàng & Nút Gọi / Nhắn Zalo Ngay */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black text-white truncate">
                          {order.customerName}
                        </strong>
                        {order.customerId && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-stone-400 font-mono font-bold">
                            {order.customerId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-stone-400">
                        <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                        <span className="truncate">{order.customerAddress || "Nhận tại quầy POS"}</span>
                      </div>
                    </div>

                    {/* Nút Gọi Điện & Zalo Tức Thì Cho Khách */}
                    {cleanPhone && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="h-9 w-9 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center active:scale-95 transition-all shadow-xs"
                          title="Bấm để gọi điện thoại cho khách"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <a
                          href={`https://zalo.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-9 w-9 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-400 flex items-center justify-center active:scale-95 transition-all shadow-xs"
                          title="Bấm để chat Zalo với khách"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Hàng 3: Chi Tiết Các Bộ Thẻ Trong Đơn */}
                  <div className="rounded-2xl bg-stone-950 p-2.5 border border-white/5 space-y-1.5">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-stone-300 font-medium truncate">• {it.name}</span>
                          <span className="text-amber-400 font-bold font-mono shrink-0 ml-2">
                            x{it.quantity} ({formatVndCurrency(it.totalPrice)})
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-stone-300 font-medium">
                        {order.packTitle || "Bộ 30 Thẻ AR Poly Cards"}
                      </div>
                    )}

                    {order.comboName && (
                      <div className="text-[11px] text-emerald-400 font-bold border-t border-white/5 pt-1 flex justify-between">
                        <span>Ưu đãi: {order.comboName}</span>
                        <span>-{formatVndCurrency(order.comboDiscount || 0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Hàng 4: Hạch Toán Tiền & Hình Thức Thanh Toán */}
                  <div className="flex items-center justify-between text-xs border-t border-white/10 pt-2.5">
                    <div>
                      <span className="text-stone-500 text-[11px] block">Tổng cần thu:</span>
                      <strong className="text-sm font-black text-amber-400 font-mono">
                        {formatVndCurrency(totalAmount)}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-stone-500 text-[11px] block">Thanh toán:</span>
                      {isPaid ? (
                        <span className="text-emerald-400 font-bold text-xs">
                          Đã thu: {formatVndCurrency(debitAmount)}
                        </span>
                      ) : (
                        <span className="text-amber-300 font-bold text-xs">
                          Thu hộ COD: {formatVndCurrency(totalAmount - debitAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hàng 5: NÚT THAO TÁC 1 CHẠM CHO NGƯỜI BÁN */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                    {status === "CHO_DUYET" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(orderId, "DANG_GIAO")}
                          disabled={isUpdating}
                          className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Duyệt &amp; Giao Bưu Tá</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmPaid(order)}
                          disabled={isUpdating}
                          className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Đã Thu Tiền Đủ</span>
                        </button>
                      </>
                    )}

                    {status === "DANG_GIAO" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleConfirmPaid(order)}
                          disabled={isUpdating}
                          className="col-span-2 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Giao Thành Công &amp; Đã Thu Tiền</span>
                        </button>
                      </>
                    )}

                    {status === "DA_NHAN" && (
                      <div className="col-span-2 text-center text-xs text-emerald-400 font-bold py-1 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Đơn hàng đã hoàn tất thành công!</span>
                      </div>
                    )}

                    {status === "DA_HUY" && (
                      <div className="col-span-2 text-center text-xs text-rose-400 font-bold py-1">
                        Đơn hàng đã bị hủy.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ================= MODAL HƯỚNG DẪN CÀI ĐẶT PWA LÊN MÀN HÌNH CHÍNH ================= */}
      {isPwaGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-stone-900 border-2 border-amber-400/60 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-amber-400 text-stone-950 font-black flex items-center justify-center">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Cài Đặt App Nhận Đơn</h3>
                  <span className="text-[11px] text-stone-400">Không cần tải APK • Toàn màn hình</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPwaGuideOpen(false)}
                className="text-stone-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300">
              <div className="p-3 rounded-2xl bg-stone-950 border border-white/10 space-y-1.5">
                <strong className="text-amber-400 block font-bold">1. Dành cho iPhone (Safari):</strong>
                <p className="leading-relaxed text-stone-300">
                  Bấm biểu tượng <strong>Chia sẻ (nút hình vuông có mũi tên trỏ lên)</strong> ở cạnh dưới trình duyệt Safari, sau đó cuộn xuống chọn <strong>&quot;Thêm vào Màn hình chính&quot; (Add to Home Screen)</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-950 border border-white/10 space-y-1.5">
                <strong className="text-sky-400 block font-bold">2. Dành cho Android (Chrome):</strong>
                <p className="leading-relaxed text-stone-300">
                  Bấm dấu <strong>3 chấm ở góc trên bên phải</strong>, sau đó chọn <strong>&quot;Cài đặt ứng dụng&quot;</strong> hoặc <strong>&quot;Thêm vào màn hình chính&quot;</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Sau khi cài, app sẽ mở toàn màn hình (Standalone) và có chuông reo báo đơn mới!</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPwaGuideOpen(false)}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs transition-colors shadow-md"
            >
              Đã Hiểu
            </button>
          </div>
        </div>
      )}

      {/* ================= BOTTOM BAR ĐIỀU HƯỚNG NHANH ================= */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-white/10 pb-safe-bottom">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-around text-[10px] font-bold text-stone-400">
          <Link
            href="/merchant"
            className="flex flex-col items-center gap-1 text-amber-400 py-1"
          >
            <Bell className="h-4 w-4 text-amber-400" />
            <span>Nhận Đơn Live</span>
          </Link>

          <Link
            href="/invoices"
            className="flex flex-col items-center gap-1 hover:text-white py-1 transition-colors"
          >
            <Receipt className="h-4 w-4" />
            <span>Điểm Bán POS</span>
          </Link>

          <Link
            href="/tools?tab=inventory"
            className="flex flex-col items-center gap-1 hover:text-white py-1 transition-colors"
          >
            <Layers className="h-4 w-4" />
            <span>Tồn Kho</span>
          </Link>

          <Link
            href="/tools"
            className="flex flex-col items-center gap-1 hover:text-white py-1 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Studio Admin</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

