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
} from "lucide-react";
import { formatVndCurrency } from "@/lib/formatters";

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

  // Tự động tìm kiếm nếu URL có sẵn tham số ?q=...
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
      {/* Glow Hiệu ứng nền nhẹ nhàng */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[360px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      {/* Thanh Header điều hướng */}
      <header className="sticky top-0 z-40 bg-stone-950/85 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về Trang Chủ</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-stone-400">
              Tra Cứu Đơn Hàng &amp; Bản Quyền
            </span>
          </div>

          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-black hover:bg-amber-300 active:scale-95 transition-all shadow-xs"
          >
            <Package className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đặt Mua Thêm</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 pt-8 sm:pt-12 space-y-8">
        {/* Tiêu đề & Giới thiệu */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Hệ Thống Tra Cứu Tức Thì</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Theo Dõi Đơn Hàng &amp; Kích Hoạt Thẻ AR
          </h1>

          <p className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto font-medium">
            Nhập <strong className="text-stone-200">Số Điện Thoại</strong> bạn đã dùng khi đặt mua hoặc{" "}
            <strong className="text-stone-200">Mã Đơn Hàng</strong> để xem tiến độ đóng gói, bưu tá giao hàng và mã bản quyền.
          </p>
        </div>

        {/* Thanh Tìm Kiếm To & Sang Trọng */}
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="p-1.5 sm:p-2 rounded-2xl bg-stone-900/90 border-2 border-amber-400/40 focus-within:border-amber-400 shadow-xl shadow-amber-500/5 transition-all"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2.5 px-3 py-2 flex-1 w-full min-w-0">
                <Search className="h-5 w-5 text-amber-400 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập số điện thoại (VD: 0912 345 678) hoặc mã đơn..."
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

        {/* Trạng thái chưa tìm kiếm */}
        {!hasSearched && (
          <div className="rounded-3xl border border-white/10 bg-stone-900/50 p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto backdrop-blur-xs">
            <div className="h-14 w-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
              <HelpCircle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm sm:text-base">Bạn chưa nhớ số điện thoại hoặc mã đơn?</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Khi hoàn tất đặt hàng, mã đơn dạng <code className="text-amber-300 font-mono">ORD-ONL-xxxxxx</code> đã được lưu. Nếu cần hỗ trợ khẩn cấp, hãy liên hệ trực tiếp với đội ngũ hỗ trợ qua Zalo hoặc Hotline.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href="tel:0934587229"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold border border-white/10 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-amber-400" />
                <span>Hotline: 0934.587.229</span>
              </a>
            </div>
          </div>
        )}

        {/* Trạng thái đã tìm nhưng không thấy */}
        {hasSearched && !isSearching && orders !== null && orders.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-stone-900/50 p-8 sm:p-10 text-center space-y-4 max-w-lg mx-auto animate-in fade-in">
            <div className="h-16 w-16 rounded-2xl bg-stone-800 text-stone-500 flex items-center justify-center mx-auto">
              <Package className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Không tìm thấy đơn hàng nào</h3>
              <p className="text-xs text-stone-400">
                Không tìm thấy đơn hàng nào gắn với thông tin <strong className="text-amber-400 font-mono">{query}</strong>. Vui lòng kiểm tra lại số điện thoại chính xác bạn đã dùng khi đặt mua.
              </p>
            </div>
          </div>
        )}

        {/* Danh Sách Đơn Hàng Tìm Thấy */}
        {hasSearched && !isSearching && orders !== null && orders.length > 0 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>Tìm thấy {orders.length} đơn hàng cho bạn</span>
              </h2>
              <span className="text-xs text-stone-400">Cập nhật theo thời gian thực</span>
            </div>

            <div className="space-y-5">
              {orders.map((order) => {
                const isPaid = order.remainingAmount <= 0;
                const statusMeta = order.statusMeta;

                return (
                  <div
                    key={order.id}
                    className="rounded-3xl bg-stone-900/90 border-2 border-white/10 hover:border-amber-400/50 shadow-xl overflow-hidden transition-all duration-300"
                  >
                    {/* Header Thẻ Đơn Hàng */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-900 to-stone-800/80 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm sm:text-base font-black text-amber-400">
                              #{order.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(order.code)}
                              className="text-stone-400 hover:text-white transition-colors p-1"
                              title="Sao chép mã đơn"
                            >
                              {copiedCode === order.code ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-400 font-medium">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "Vừa xong"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Badge Trạng Thái Đơn */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                            order.orderStatus === "DA_NHAN"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : order.orderStatus === "DANG_GIAO"
                              ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                              : order.orderStatus === "DA_HUY"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                          <span>{statusMeta.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Timeline Tiến Trình Giao Vận */}
                    <div className="p-4 sm:p-5 bg-stone-950/60 border-b border-white/5 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          <span>Tiến trình xử lý đơn hàng</span>
                        </span>
                        <span className="text-stone-300 font-normal italic text-[11px]">
                          {statusMeta.desc}
                        </span>
                      </div>

                      {/* Thanh Tiến Trình 3 Bước */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            statusMeta.step >= 1
                              ? "bg-amber-400/10 border-amber-400/40 text-amber-300"
                              : "bg-stone-900 border-white/5 text-stone-600"
                          }`}
                        >
                          <span className="text-[10px] block font-black uppercase">Bước 1</span>
                          <span className="text-xs font-bold block mt-0.5">Tiếp Nhận &amp; Chuẩn Bị</span>
                        </div>

                        <div
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            statusMeta.step >= 2
                              ? "bg-sky-400/10 border-sky-400/40 text-sky-300"
                              : "bg-stone-900 border-white/5 text-stone-600"
                          }`}
                        >
                          <span className="text-[10px] block font-black uppercase">Bước 2</span>
                          <span className="text-xs font-bold block mt-0.5">Bưu Tá Đang Giao</span>
                        </div>

                        <div
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            statusMeta.step >= 3
                              ? "bg-emerald-400/10 border-emerald-400/40 text-emerald-300"
                              : "bg-stone-900 border-white/5 text-stone-600"
                          }`}
                        >
                          <span className="text-[10px] block font-black uppercase">Bước 3</span>
                          <span className="text-xs font-bold block mt-0.5">Đã Giao Thành Công</span>
                        </div>
                      </div>
                    </div>

                    {/* Nội Dung Chi Tiết: Danh Sách Bộ Thẻ & Thông Tin Người Nhận */}
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
                      {/* Cột Trái (8/12): Danh sách bộ thẻ khách đã mua */}
                      <div className="md:col-span-8 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5" />
                            <span>Các Bộ Thẻ Bạn Đã Đặt ({order.items.length} mặt hàng)</span>
                          </span>
                        </div>

                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-2xl bg-stone-950 border border-white/10 flex items-center justify-between gap-3 hover:border-amber-400/30 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
                                  30
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                    {item.name}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono mt-0.5">
                                    <span>Mã: {item.packCode || "POLY30"}</span>
                                    <span>•</span>
                                    <span className="text-amber-400 font-bold">Số lượng: x{item.quantity}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono text-xs sm:text-sm font-black text-stone-200">
                                  {formatVndCurrency(item.totalPrice)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {order.comboName && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                            <span className="font-bold">Ưu đãi áp dụng: {order.comboName}</span>
                            <span className="font-mono font-black text-emerald-400">
                              -{formatVndCurrency(order.comboDiscount)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Cột Phải (4/12): Thông tin người nhận & Thanh toán */}
                      <div className="md:col-span-4 space-y-3.5 p-4 rounded-2xl bg-stone-950/80 border border-white/10 flex flex-col justify-between">
                        <div className="space-y-2.5 text-xs">
                          <span className="font-black uppercase tracking-wider text-stone-400 block border-b border-white/5 pb-1">
                            Thông Tin Người Nhận
                          </span>

                          <div>
                            <span className="text-stone-500 block text-[11px]">Họ tên khách hàng:</span>
                            <strong className="text-white font-bold">{order.customerName}</strong>
                          </div>

                          <div>
                            <span className="text-stone-500 block text-[11px]">Số điện thoại:</span>
                            <strong className="text-amber-400 font-mono font-bold">
                              {order.customerPhoneMasked}
                            </strong>
                          </div>

                          <div>
                            <span className="text-stone-500 block text-[11px]">Địa chỉ giao hàng:</span>
                            <span className="text-stone-300 font-medium leading-relaxed block">
                              {order.customerAddress || "Nhận trực tiếp tại quầy"}
                            </span>
                          </div>

                          <div>
                            <span className="text-stone-500 block text-[11px]">Hình thức giao:</span>
                            <span className="text-stone-300 font-semibold">{order.deliveryMethodLabel}</span>
                          </div>
                        </div>

                        {/* Tổng Kết Tiền */}
                        <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                          <div className="flex justify-between text-stone-400">
                            <span>Phương thức:</span>
                            <span className="text-stone-200 font-semibold text-right">
                              {order.paymentMethod}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-1">
                            <span className="font-bold text-white">Tổng thanh toán:</span>
                            <span className="font-mono text-base font-black text-amber-400">
                              {formatVndCurrency(order.totalPrice)}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] pt-1">
                            <span className="text-stone-500">Tình trạng thanh toán:</span>
                            {isPaid ? (
                              <span className="text-emerald-400 font-bold">Đã thanh toán đủ</span>
                            ) : (
                              <span className="text-amber-400 font-bold">Thu hộ COD khi nhận</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Thẻ Đơn Hàng: Nút Kích Hoạt Trải Nghiệm WebAR */}
                    <div className="p-3 sm:p-4 bg-stone-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Sản phẩm chính hãng Poly Cards bảo hành đổi mới 1-đổi-1</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                          href="/scan"
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
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

