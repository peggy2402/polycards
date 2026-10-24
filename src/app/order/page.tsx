"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { getAllAnimals, getAnimalBySlug } from "@/lib/animals";
import { formatVndCurrency } from "@/lib/formatters";
import { Animal } from "@/types/animal";
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
} from "lucide-react";

function OrderContent() {
  const searchParams = useSearchParams();
  const animalParam = searchParams.get("animal");
  const allAnimals = getAllAnimals();

  // Sản phẩm đang chọn: "full-set" hoặc animal.slug
  const [selectedProductType, setSelectedProductType] = useState<string>(
    animalParam && getAnimalBySlug(animalParam) ? animalParam : "full-set"
  );
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

  // Determine current product details
  const isFullSet = selectedProductType === "full-set";
  const selectedAnimal = !isFullSet ? getAnimalBySlug(selectedProductType) : null;

  const unitPrice = isFullSet ? 599000 : selectedAnimal ? selectedAnimal.price : 249000;
  const totalPrice = unitPrice * quantity;
  const productName = isFullSet
    ? "Trọn Bộ 6 Thẻ AR Thông Minh Poly Cards (Full Set)"
    : `Thẻ Bài AR ${selectedAnimal?.nameEn} (${selectedAnimal?.nameVi})`;

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
          productId: selectedProductType,
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
            Đơn hàng của bạn đã được chuyển thẳng tới đội ngũ phát triển sản phẩm Poly Cards. Chúng tôi sẽ liên hệ qua số điện thoại <strong>{phone}</strong> trong thời gian sớm nhất để xác nhận và gửi thẻ bài đến tay bé.
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
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    );
  }

  // ORDER FORM SCREEN
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-black text-slate-800 hover:bg-amber-50 transition-all shadow-xs max-w-fit"
        >
          <ArrowLeft className="h-4 w-4 text-amber-600" />
          <span>Quay Lại Trang Chủ</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-black text-emerald-950 bg-emerald-100/90 px-4 py-1.5 rounded-full border border-emerald-300 max-w-fit">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Sản Phẩm Thiết Kế Độc Quyền • Đặt Mua Trực Tiếp Từ Tác Giả</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customer Information Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-[2.5rem] border-2 border-amber-200/90 bg-white/95 p-6 sm:p-8 shadow-xl shadow-amber-950/5 space-y-6">
            <div>
              <span className="text-xs font-extrabold text-amber-700 uppercase tracking-widest block">
                Thông Tin Giao Hàng
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Đặt Mua Thẻ Bài AR Poly Cards
              </h1>
              <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
                Vui lòng điền thông tin để chúng tôi đóng gói và gửi bộ thẻ bài thông minh có tích hợp mã QR AR đến tận tay bé yêu.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-xs font-black text-rose-900">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Họ tên */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  Họ và tên phụ huynh / người nhận <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Thị Mai"
                    className="w-full rounded-2xl border-2 border-amber-200/80 bg-amber-50/20 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* SĐT & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-800">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full rounded-2xl border-2 border-amber-200/80 bg-amber-50/20 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-800">
                    Email nhận xác nhận
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="baome@example.com"
                      className="w-full rounded-2xl border-2 border-amber-200/80 bg-amber-50/20 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Địa chỉ nhận hàng */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  Địa chỉ nhận hàng (Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số 123 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội"
                    className="w-full rounded-2xl border-2 border-amber-200/80 bg-amber-50/20 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Ghi chú */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  Ghi chú cho đơn hàng (Ví dụ: Giao giờ hành chính, lời nhắn cho bé...)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Bé tên An 4 tuổi, xin gửi tặng thêm thiệp sinh nhật..."
                    className="w-full rounded-2xl border-2 border-amber-200/80 bg-amber-50/20 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-black text-slate-800">
                  Hình thức thanh toán
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
                        Kiểm tra thẻ bài an toàn trước khi thanh toán
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
              {/* Option 1: Full Set (Khuyên Dùng) */}
              <button
                type="button"
                onClick={() => setSelectedProductType("full-set")}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                  isFullSet
                    ? "border-amber-400 bg-amber-50/90 shadow-md ring-2 ring-amber-300/60"
                    : "border-amber-200 bg-white hover:bg-amber-50/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-amber-300 bg-amber-100">
                    <Image
                      src="/images/cards/lion-card.jpg"
                      alt="Trọn bộ 6 thẻ AR Poly Cards"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900">Trọn Bộ 6 Thẻ AR (Full Set)</span>
                      <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                        HOT
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Đủ 6 bạn thú + Tặng mã QR không giới hạn
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-amber-950 block">599.000 đ</span>
                  <span className="text-[10px] text-slate-400 line-through">799.000 đ</span>
                </div>
              </button>

              {/* Or Select Individual Animal Cards */}
              <div className="pt-2">
                <span className="text-[11px] font-black text-slate-500 block mb-2">
                  Hoặc chọn lẻ theo từng bạn thú:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {allAnimals.map((a) => {
                    const isSelected = selectedProductType === a.slug;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedProductType(a.slug)}
                        className={`flex items-center gap-2 rounded-xl border-2 p-2 text-left transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300"
                            : "border-amber-200 bg-white text-slate-700 hover:bg-amber-50"
                        }`}
                      >
                        <div className="relative h-8 w-8 shrink-0 rounded-lg overflow-hidden border border-amber-300">
                          <Image
                            src={a.images[0] || "/images/animals/lion.jpg"}
                            alt={a.nameVi}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-black truncate">{a.nameEn}</span>
                          <span className="block text-[10px] text-amber-900 font-bold">
                            {formatVndCurrency(a.price)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between border-t border-b border-amber-100 py-3.5">
              <span className="text-xs font-black text-slate-900">Số lượng bộ thẻ:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-amber-200 bg-white font-black text-slate-800 hover:bg-amber-100 active:scale-95 disabled:opacity-40"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-black text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-amber-200 bg-white font-black text-slate-800 hover:bg-amber-100 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Đơn giá:</span>
                <span>{formatVndCurrency(unitPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Số lượng:</span>
                <span>x {quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển toàn quốc:</span>
                <span className="font-bold text-emerald-600">MIỄN PHÍ</span>
              </div>
              <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2 border-t border-amber-100">
                <span>Tổng tiền:</span>
                <span className="text-2xl font-black text-amber-950">
                  {formatVndCurrency(totalPrice)}
                </span>
              </div>
            </div>

            {/* Card Highlights */}
            <div className="rounded-2xl bg-amber-50/80 p-3.5 border border-amber-200/80 space-y-2 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Mỗi thẻ bài đều in mã QR công nghệ cao độc quyền.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Không cần cài app, quét là xem được 3D và nghe phát âm.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Chất liệu giấy chống nước, bo tròn 4 góc an toàn cho trẻ.</span>
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
    <div className="min-h-screen bg-[#FCFBF7] text-slate-800">
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <OrderContent />
      </Suspense>
    </div>
  );
}
