"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { formatVndCurrency } from "@/lib/formatters";
import { Animal, ProductCategory } from "@/types/animal";
import { CardComboPack, DEFAULT_FEATURED_COMBO } from "@/data/combos";
import {
  getMergedProducts,
  getFeaturedCombo,
  getProductCategories,
  resolveValidProductImage,
} from "@/lib/products-store";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Sparkles,
  Phone,
  User,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  ShoppingBag,
  RotateCcw,
  Box,
  Layers,
  Search,
  Filter,
} from "lucide-react";

function OrderContent() {
  const searchParams = useSearchParams();
  const animalParam = searchParams.get("animal");

  // Danh sách sản phẩm thực từ MongoDB & Local Cache
  const [products, setProducts] = useState<Animal[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("poly_cached_products_catalog");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return getMergedProducts();
  });

  const [categories, setCategories] = useState<ProductCategory[]>(() => getProductCategories());
  const [featuredCombo, setFeaturedCombo] = useState<CardComboPack>(() => getFeaturedCombo());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Nạp dữ liệu mới nhất từ MongoDB API
  useEffect(() => {
    async function syncRealData() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const merged = getMergedProducts(json.data);
            setProducts(merged);
            try {
              localStorage.setItem("poly_cached_products_catalog", JSON.stringify(merged));
            } catch {}
          }
        }
      } catch {}

      try {
        const comboRes = await fetch("/api/featured-combo");
        if (comboRes.ok) {
          const comboJson = await comboRes.json();
          if (comboJson.success && comboJson.data) {
            setFeaturedCombo(comboJson.data);
          }
        }
      } catch {}
    }

    syncRealData();
  }, []);

  // Sản phẩm đang chọn: "combo-featured" hoặc `card_${animal.slug}`
  const [selectedProductType, setSelectedProductType] = useState<string>(() => {
    if (animalParam) {
      return `card_${animalParam.toLowerCase()}`;
    }
    return "combo-featured";
  });

  const [quantity, setQuantity] = useState<number>(1);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "banking">("cod");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tìm thẻ bài đang được chọn
  const isCombo = selectedProductType === "combo-featured";
  const selectedCard = useMemo(() => {
    if (isCombo) return null;
    const cleanSlug = selectedProductType.replace(/^card_/, "").toLowerCase();
    return products.find(
      (p) => p.slug.toLowerCase() === cleanSlug || p.id.toLowerCase() === cleanSlug
    ) || null;
  }, [selectedProductType, isCombo, products]);

  // Tự động chọn đúng thẻ nếu URL thay đổi
  useEffect(() => {
    if (animalParam) {
      setSelectedProductType(`card_${animalParam.toLowerCase()}`);
    }
  }, [animalParam]);

  // Đơn giá và Tên sản phẩm
  const unitPrice = isCombo
    ? featuredCombo.price || 599000
    : selectedCard
    ? selectedCard.price || 219000
    : 219000;

  const originalUnitPrice = isCombo
    ? featuredCombo.originalPrice || 799000
    : selectedCard
    ? selectedCard.originalPrice || Math.round((selectedCard.price || 219000) * 1.3)
    : 299000;

  const totalPrice = unitPrice * quantity;
  const productName = isCombo
    ? `${featuredCombo.name} (${featuredCombo.cardsCount} Thẻ AR)`
    : `Thẻ Bài AR ${selectedCard?.nameEn || "Poly Cards"} (${selectedCard?.nameVi || ""})`;

  // Lọc danh sách thẻ bài hiển thị theo category và search query
  const filteredCards = useMemo(() => {
    return products.filter((card) => {
      const matchCat =
        activeCategoryFilter === "all" ||
        card.categorySlug === activeCategoryFilter ||
        card.category === activeCategoryFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        card.nameEn.toLowerCase().includes(q) ||
        card.nameVi.toLowerCase().includes(q) ||
        card.slug.toLowerCase().includes(q) ||
        (card.nameZh && card.nameZh.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [products, activeCategoryFilter, searchQuery]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          address,
          productId: isCombo ? featuredCombo.id : selectedCard?.slug || selectedProductType,
          productName,
          quantity,
          totalPrice,
          paymentMethod,
          note,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErrorMessage(data.message || "Đã xảy ra lỗi khi gửi đơn hàng. Vui lòng thử lại!");
      }
    } catch {
      setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (submitSuccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16 text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black text-emerald-950 border border-emerald-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>ĐẶT HÀNG THÀNH CÔNG</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Cảm Ơn Bạn Đã Đặt Mua Poly Cards!
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto font-medium">
            Đơn hàng của bạn đã được ghi nhận vào hệ thống Poly Cards. Chúng tôi sẽ liên hệ qua số điện thoại <strong>{phone}</strong> trong thời gian sớm nhất để xác nhận và gửi thẻ bài đến tay bé.
          </p>
        </div>

        {/* Order Details Receipt Box */}
        <div className="rounded-3xl border-2 border-amber-200/90 bg-white p-6 shadow-xl text-left space-y-3.5">
          <h3 className="text-base font-black text-slate-900 border-b border-amber-100 pb-2">
            Tóm Tắt Đơn Đặt Hàng:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
            <div>
              <span className="text-slate-500">Người nhận:</span>{" "}
              <strong className="text-slate-900">{fullName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Số điện thoại:</span>{" "}
              <strong className="text-slate-900">{phone}</strong>
            </div>
            {email && (
              <div>
                <span className="text-slate-500">Email:</span>{" "}
                <strong className="text-slate-900">{email}</strong>
              </div>
            )}
            <div>
              <span className="text-slate-500">Thanh toán:</span>{" "}
              <strong className="text-emerald-700">
                {paymentMethod === "banking" ? "Chuyển khoản QR ngân hàng" : "Thanh toán khi nhận hàng (COD)"}
              </strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500">Địa chỉ giao:</span>{" "}
              <strong className="text-slate-900">{address}</strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500">Sản phẩm:</span>{" "}
              <strong className="text-slate-900">{productName} (x{quantity})</strong>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-amber-100 flex justify-between items-center text-sm font-black">
              <span>Tổng thanh toán dự kiến:</span>
              <span className="text-xl text-amber-950 font-black">{formatVndCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/scan"
            className="btn-toy-3d inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-black text-white shadow-md"
          >
            <Box className="h-4 w-4" />
            <span>Thử Nghiệm Quét AR Trực Tuyến</span>
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-white px-6 py-3 text-sm font-black text-slate-800 hover:bg-amber-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    );
  }

  // ORDER FORM SCREEN
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:px-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-amber-50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại trang chủ</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Checkout Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-[2.5rem] border-2 border-amber-200/90 bg-white/95 p-6 sm:p-8 shadow-xl shadow-amber-950/5">
            <div className="border-b border-amber-100 pb-5 mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-black text-amber-950 mb-2">
                <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                <span>Đặt Mua Thẻ Thật Chính Hãng</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Thông Tin Giao Hàng & Thanh Toán
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
                Giao hàng toàn quốc tận nhà. Quý phụ huynh nhận hàng kiểm tra thẻ trước khi thanh toán.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-800">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-600" />
                  <span>Họ và tên phụ huynh / người nhận *</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-2xl border-2 border-amber-200 bg-amber-50/30 px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-amber-600" />
                    <span>Số điện thoại nhận hàng *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full rounded-2xl border-2 border-amber-200 bg-amber-50/30 px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-amber-600" />
                    <span>Email (nhận hướng dẫn kích hoạt)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-2xl border-2 border-amber-200 bg-amber-50/30 px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  <span>Địa chỉ giao hàng chi tiết (Số nhà, đường, phường/xã, quận/huyện) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: Số 18 ngõ 45 phố Mai Dịch, Cầu Giấy, Hà Nội"
                  className="w-full rounded-2xl border-2 border-amber-200 bg-amber-50/30 px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-amber-600" />
                  <span>Ghi chú cho shipper (Không bắt buộc)</span>
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                  className="w-full rounded-2xl border-2 border-amber-200 bg-amber-50/30 px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              {/* Payment Methods */}
              <div className="pt-2">
                <label className="block text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                  <span>Phương thức thanh toán</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      paymentMethod === "cod"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950 shadow-xs"
                        : "border-amber-200 bg-white text-slate-700 hover:bg-amber-50/50"
                    }`}
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600">
                      {paymentMethod === "cod" && <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />}
                    </div>
                    <div>
                      <span className="block text-xs font-black">Thanh toán khi nhận hàng (COD)</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Nhận hàng, kiểm tra bộ thẻ bài rồi mới trả tiền
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("banking")}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      paymentMethod === "banking"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950 shadow-xs"
                        : "border-amber-200 bg-white text-slate-700 hover:bg-amber-50/50"
                    }`}
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600">
                      {paymentMethod === "banking" && <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />}
                    </div>
                    <div>
                      <span className="block text-xs font-black">Chuyển khoản QR ngân hàng</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Nhận mã QR thanh toán nhanh qua ứng dụng ngân hàng
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-toy-3d flex min-h-[54px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/30 active:scale-98 transition-all disabled:opacity-50"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>{isSubmitting ? "Đang gửi đơn hàng..." : "Xác Nhận Đặt Thẻ Poly Cards"}</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 text-center text-xs font-semibold text-slate-500 pt-2">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Miễn phí giao hàng</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Bảo hành 1 đổi 1 trong 30 ngày</span>
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Order Summary & Product Selector (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[2.5rem] border-2 border-amber-200/90 bg-white/95 p-6 shadow-xl shadow-amber-950/5 space-y-5">
            <h2 className="text-lg font-black text-slate-900 border-b border-amber-100 pb-3">
              Lựa Chọn Bộ Thẻ Bạn Muốn Mua
            </h2>

            {/* Product Type Selector */}
            <div className="space-y-3">
              {/* Option 1: Combo Nổi Bật (Khuyên Dùng) */}
              <button
                type="button"
                onClick={() => setSelectedProductType("combo-featured")}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                  isCombo
                    ? "border-amber-400 bg-amber-50/90 shadow-md ring-2 ring-amber-300/60"
                    : "border-amber-200 bg-white hover:bg-amber-50/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-amber-300 bg-amber-100">
                    <Image
                      src={featuredCombo.imageSrc || "/images/cards/lion-card.jpg"}
                      alt={featuredCombo.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900 truncate">
                        {featuredCombo.name}
                      </span>
                      <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white shrink-0">
                        {featuredCombo.badge || "HOT"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block truncate">
                      {featuredCombo.description || `Trọn bộ ${featuredCombo.cardsCount} thẻ + Mã kích hoạt WebAR`}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-amber-950 block">
                    {formatVndCurrency(featuredCombo.price || 599000)}
                  </span>
                  {featuredCombo.originalPrice && (
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatVndCurrency(featuredCombo.originalPrice)}
                    </span>
                  )}
                </div>
              </button>

              {/* Option 2: Chọn Thẻ Bài Lẻ Từ Toàn Bộ Danh Sách Thật */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black text-slate-700">
                    Hoặc chọn lẻ theo từng bạn thú / thẻ bài ({products.length} thẻ có sẵn):
                  </span>
                </div>

                {/* Search & Category Filter */}
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm thẻ (sư tử, xe cộ, walk, jump...)"
                      className="w-full rounded-xl border border-amber-200 bg-amber-50/40 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setActiveCategoryFilter("all")}
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                        activeCategoryFilter === "all"
                          ? "bg-amber-400 text-stone-950"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      Tất cả ({products.length})
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id || c.slug}
                        type="button"
                        onClick={() => setActiveCategoryFilter(c.slug)}
                        className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                          activeCategoryFilter === c.slug
                            ? "bg-amber-400 text-stone-950"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danh Sách Thẻ Cuộn Nhẹ */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {filteredCards.map((a) => {
                    const cardTypeKey = `card_${a.slug}`;
                    const isSelected = selectedProductType === cardTypeKey;
                    const cardImg = resolveValidProductImage(a.images?.[0], a.posterUrl);
                    return (
                      <button
                        key={a.id || a.slug}
                        type="button"
                        onClick={() => setSelectedProductType(cardTypeKey)}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 p-2 text-left transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300"
                            : "border-amber-200/70 bg-white text-slate-700 hover:bg-amber-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-amber-200 bg-amber-50">
                            <Image
                              src={cardImg}
                              alt={a.nameVi}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-black text-slate-900 truncate">
                              {a.nameEn} <span className="text-[11px] font-normal text-slate-500">({a.nameVi})</span>
                            </span>
                            <span className="text-[10px] text-amber-700 font-bold block">
                              {a.category || "Động Vật"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="block text-xs text-amber-950 font-black">
                            {formatVndCurrency(a.price || 219000)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between border-t border-amber-100 pt-4">
              <div>
                <span className="text-xs font-black text-slate-800 block">Số lượng</span>
                <span className="text-[11px] text-slate-500 font-medium">Chọn số bộ/thẻ cần đặt</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 font-black text-slate-700 hover:bg-amber-100 active:scale-95 transition-all"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-black text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 font-black text-slate-700 hover:bg-amber-100 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total Price Box */}
            <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Đơn giá niêm yết:</span>
                <span className="line-through text-slate-400">{formatVndCurrency(originalUnitPrice * quantity)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Khuyến mãi Poly Cards:</span>
                <span className="font-bold text-rose-600">
                  -{formatVndCurrency((originalUnitPrice - unitPrice) * quantity)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Phí vận chuyển:</span>
                <span className="font-bold text-emerald-600">Miễn phí (Toàn quốc)</span>
              </div>
              <div className="border-t border-amber-200/80 pt-2 flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">Tổng thanh toán:</span>
                <span className="text-xl font-black text-amber-950">{formatVndCurrency(totalPrice)}</span>
              </div>
            </div>

            {/* Bonus Features List */}
            <div className="space-y-2 pt-1 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Bao gồm mã QR bản quyền mở khóa WebAR vĩnh viễn</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Giọng đọc bản xứ 3 ngôn ngữ Anh - Việt - Trung</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Thẻ bài bo góc an toàn chứng nhận chuẩn FSC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-amber-50/30">
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        }
      >
        <OrderContent />
      </Suspense>
    </main>
  );
}
