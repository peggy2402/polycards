"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Layers,
  HelpCircle,
  ExternalLink,
  CreditCard,
  User,
} from "lucide-react";
import { formatVndCurrency, formatOrderDateTime } from "@/lib/formatters";

interface LookupLineItem {
  id: string;
  name: string;
  packCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface LookupOrder {
  id: string;
  code: string;
  customerId?: string;
  customerName: string;
  customerPhoneMasked: string;
  customerAddress: string;
  createdAt?: string;
  totalPrice: number;
  subtotal: number;
  shippingFee: number;
  debitAmount: number;
  remainingAmount: number;
  status?: string;
  orderStatus: string;
  statusMeta: {
    label: string;
    step: number;
    color: string;
    desc: string;
  };
  paymentMethod: string;
  deliveryMethodLabel: string;
  comboName?: string;
  comboDiscount: number;
  items: LookupLineItem[];
  directUrl?: string;
}

function LookupContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || searchParams.get("phone") || searchParams.get("code") || "";

  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [orders, setOrders] = useState<LookupOrder[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  };

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      const q = searchQuery.trim();
      if (!q) {
        setErrorMessage("Vui lòng nhập số điện thoại hoặc mã đơn hàng của bạn.");
        return;
      }

      setIsSearching(true);
      setErrorMessage(null);
      setHasSearched(true);

      try {
        const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(q)}`);
        const json = await res.json();

        if (json.success) {
          setOrders(json.data || []);
        } else {
          setOrders([]);
          setErrorMessage(json.message || "Không tìm thấy thông tin đơn hàng.");
        }
      } catch (err) {
        setOrders([]);
        setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng!");
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 antialiased selection:bg-amber-400 selection:text-stone-950 pb-24">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent rounded-full blur-3xl opacity-80" />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-stone-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Trang Chủ</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-400">
              Tra Cứu Đơn Hàng &amp; Kích Hoạt AR
            </span>
          </div>

          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black active:scale-95 transition-all shadow-xs"
          >
            <Package className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đặt Mua Thêm</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 pt-6 sm:pt-10 space-y-7">
        {/* Tiêu đề & Giới thiệu */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Hệ Thống Theo Dõi Đơn Hàng</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Tra Cứu Đơn Đặt Mua Poly Cards
          </h1>

          <p className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto font-medium">
            Nhập <strong className="text-amber-300">Số Điện Thoại</strong> hoặc <strong className="text-amber-300">Mã Đơn Hàng</strong> để xem chi tiết các bộ thẻ, tiến trình vận chuyển bưu tá và mã WebAR.
          </p>
        </div>

        {/* Thanh Tìm Kiếm Sang Trọng */}
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="p-1.5 sm:p-2 rounded-2xl bg-stone-900/90 border-2 border-amber-400/50 focus-within:border-amber-400 shadow-xl shadow-amber-500/10 transition-all"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2.5 px-3 py-2 flex-1 w-full min-w-0">
                <Search className="h-5 w-5 text-amber-400 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập số điện thoại (VD: 0394 260 488) hoặc mã đơn..."
                  className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-stone-500 focus:outline-hidden font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-60 disabled:pointer-events-none shrink-0"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-stone-950" />
                    <span>Đang Tra Cứu...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 text-stone-950" />
                    <span>Tra Cứu Ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Chưa tìm kiếm */}
        {!hasSearched && (
          <div className="rounded-3xl border border-white/10 bg-stone-900/50 p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto backdrop-blur-xs">
            <div className="h-14 w-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
              <HelpCircle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm sm:text-base">Cách tra cứu nhanh nhất</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Bạn chỉ cần gõ đúng <strong className="text-stone-200">Số điện thoại</strong> đã đăng ký khi đặt mua. Hệ thống sẽ tự động tổng hợp toàn bộ các đơn hàng và danh sách bộ thẻ kèm theo.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href="tel:0356226707"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold border border-white/10 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-amber-400" />
                <span>Hotline: 0356.226.707</span>
              </a>
            </div>
          </div>
        )}

        {/* Không tìm thấy đơn */}
        {hasSearched && !isSearching && orders !== null && orders.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-stone-900/50 p-8 sm:p-10 text-center space-y-4 max-w-lg mx-auto animate-in fade-in">
            <div className="h-16 w-16 rounded-2xl bg-stone-800 text-stone-500 flex items-center justify-center mx-auto">
              <Package className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Chưa tìm thấy đơn hàng nào</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Không tìm thấy đơn hàng nào khớp với <strong className="text-amber-400 font-mono">{query}</strong>. Vui lòng kiểm tra lại số điện thoại chính xác khi đặt hàng.
              </p>
            </div>
          </div>
        )}

        {/* Danh Sách Đơn Hàng (UI ĐƯỢC THIẾT KẾ LẠI ĐẲNG CẤP) */}
        {hasSearched && !isSearching && orders !== null && orders.length > 0 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Tìm thấy {orders.length} đơn hàng</span>
              </h2>
              <span className="text-[11px] text-stone-400 font-medium">Cập nhật tự động</span>
            </div>

            <div className="space-y-6">
              {orders.map((order) => {
                const isPaid = order.remainingAmount <= 0;
                const statusMeta = order.statusMeta;
                const formattedDate = formatOrderDateTime(order.createdAt, order.id);

                return (
                  <div
                    key={order.id}
                    className="rounded-3xl bg-stone-900/95 border-2 border-amber-400/40 hover:border-amber-400/70 shadow-2xl overflow-hidden transition-all duration-300"
                  >
                    {/* Header Thẻ Đơn Hàng: Mã đơn, Ngày giờ, Badge trạng thái */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/20 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base sm:text-lg font-black text-amber-400 tracking-wide">
                              #{order.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(order.code)}
                              className="text-stone-400 hover:text-white transition-colors p-1"
                              title="Sao chép mã đơn"
                            >
                              {copiedCode === order.code ? (
                                <Check className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {/* ĐÃ SỬA LỖI DÍNH CHỮ NGÀY GIỜ: có khoảng trắng chuẩn HH:mm:ss dd/MM/yyyy */}
                          <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium mt-0.5 font-mono">
                            <Calendar className="h-3.5 w-3.5 text-stone-500" />
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badge Trạng Thái Nổi Bật */}
                      <div className="self-start sm:self-auto">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide ${
                            order.orderStatus === "DA_NHAN"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : order.orderStatus === "DANG_GIAO"
                              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                              : order.orderStatus === "DA_HUY"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                          <span>{statusMeta.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Stepper Tiến Trình 3 Bước Tinh Tế */}
                    <div className="p-4 sm:p-5 bg-stone-950/70 border-b border-white/5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-stone-400">
                        <span className="flex items-center gap-1.5 font-bold text-stone-300">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          <span>Tiến trình xử lý đơn</span>
                        </span>
                        <span className="italic text-stone-400 text-[11px]">
                          {statusMeta.desc}
                        </span>
                      </div>

                      {/* Stepper Bar 3 Bước */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {/* Bước 1 */}
                        <div
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            statusMeta.step >= 1
                              ? "bg-amber-400/10 border-amber-400/50 text-amber-300 shadow-sm"
                              : "bg-stone-900 border-white/5 text-stone-600"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider mb-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            <span>Bước 1</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold block leading-snug">
                            Tiếp Nhận &amp; Chuẩn Bị
                          </span>
                        </div>

                        {/* Bước 2 */}
                        <div
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            statusMeta.step >= 2
                              ? "bg-sky-400/10 border-sky-400/50 text-sky-300 shadow-sm"
                              : "bg-stone-900 border-white/5 text-stone-600"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider mb-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            <span>Bước 2</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold block leading-snug">
                            Bưu Tá Đang Giao
                          </span>
                        </div>

                        {/* Bước 3 */}
                        <div
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            statusMeta.step >= 3
                              ? "bg-emerald-400/10 border-emerald-400/50 text-emerald-300 shadow-sm"
                              : "bg-stone-900 border-white/5 text-stone-600"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider mb-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            <span>Bước 3</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold block leading-snug">
                            Giao Thành Công
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bố Cục Chi Tiết 2 Cột Rõ Ràng & Thoáng Đãng */}
                    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Cột Trái (7/12): Danh sách các bộ thẻ */}
                      <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                            <Layers className="h-4 w-4" />
                            <span>Các Bộ Thẻ Bạn Đã Đặt ({order.items.length} mặt hàng)</span>
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-2xl bg-stone-950/80 border border-white/10 hover:border-amber-400/40 transition-all flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                                  30
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                                    {item.name}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono">
                                    {item.packCode && (
                                      <span className="text-stone-400">Mã: {item.packCode}</span>
                                    )}
                                    <span>•</span>
                                    <span className="text-amber-400 font-bold">Số lượng: x{item.quantity}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono text-sm sm:text-base font-black text-amber-400">
                                  {formatVndCurrency(item.totalPrice)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {order.comboName && (
                          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                              <span>Ưu đãi Combo: {order.comboName}</span>
                            </span>
                            <span className="font-mono font-black text-emerald-400">
                              -{formatVndCurrency(order.comboDiscount)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Cột Phải (5/12): Thông tin người nhận & Hạch toán thanh toán */}
                      <div className="lg:col-span-5 rounded-2xl bg-stone-950/90 border border-white/10 p-4 sm:p-5 space-y-4">
                        {/* Thông Tin Người Nhận */}
                        <div className="space-y-2 text-xs">
                          <span className="font-black uppercase tracking-wider text-amber-400 text-[11px] block border-b border-white/10 pb-1.5">
                            Thông Tin Người Nhận
                          </span>

                          <div className="flex justify-between items-start gap-2 py-0.5">
                            <span className="text-stone-400 shrink-0">Người nhận:</span>
                            <strong className="text-white font-bold text-right">{order.customerName}</strong>
                          </div>

                          <div className="flex justify-between items-center gap-2 py-0.5">
                            <span className="text-stone-400 shrink-0">Số điện thoại:</span>
                            <strong className="text-amber-300 font-mono font-bold text-right">
                              {order.customerPhoneMasked}
                            </strong>
                          </div>

                          <div className="flex justify-between items-start gap-2 py-0.5">
                            <span className="text-stone-400 shrink-0">Địa chỉ giao:</span>
                            <span className="text-stone-300 font-medium text-right leading-relaxed max-w-[200px]">
                              {order.customerAddress || "Nhận trực tiếp tại quầy"}
                            </span>
                          </div>

                          <div className="flex justify-between items-center gap-2 py-0.5">
                            <span className="text-stone-400 shrink-0">Hình thức giao:</span>
                            <span className="text-sky-300 font-bold text-right text-[11px]">
                              {order.deliveryMethodLabel}
                            </span>
                          </div>
                        </div>

                        {/* Tổng Kết Tiền Thanh Toán */}
                        <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-stone-400">
                            <span>Phương thức:</span>
                            <span className="text-stone-200 font-medium text-right text-[11px]">
                              {order.paymentMethod}
                            </span>
                          </div>

                          {order.shippingFee > 0 && (
                            <div className="flex justify-between items-center text-stone-400">
                              <span>Phí giao hàng:</span>
                              <span className="font-mono text-stone-200">
                                {formatVndCurrency(order.shippingFee)}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-white/10">
                            <span className="font-bold text-white text-sm">Tổng thanh toán:</span>
                            <span className="font-mono text-lg font-black text-amber-400">
                              {formatVndCurrency(order.totalPrice)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-0.5 text-[11px]">
                            <span className="text-stone-400">Tình trạng thanh toán:</span>
                            {isPaid ? (
                              <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/30">
                                Đã thanh toán đủ
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
                                Thu hộ COD khi nhận hàng
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Thẻ: Cam kết & Nút Quét WebAR */}
                    <div className="p-3.5 sm:p-4 bg-stone-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Sản phẩm chính hãng Poly Cards • Bảo hành đổi mới 1-đổi-1</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                          href="/scan"
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Mở Trình Quét Thẻ WebAR 3D</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LookupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Đang tải hệ thống tra cứu Poly Cards...</span>
          </div>
        </div>
      }
    >
      <LookupContent />
    </Suspense>
  );
}
