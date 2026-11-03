"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { formatVndCurrency } from "@/lib/formatters";
import { CardComboPack, COMBO_PACKS } from "@/data/combos";
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
  Box,
  Layers,
  Search,
  Check,
  ChevronRight,
  RotateCcw,
  Tag,
  Languages,
  Plus,
  Minus,
} from "lucide-react";

// Danh mục chủ đề chính để lọc nhanh
const CATEGORY_TABS = [
  { id: "all", name: "Tất cả các bộ" },
  { id: "all-vip", name: "Trọn Bộ VIP" },
  { id: "dong-vat", name: "Động Vật" },
  { id: "hanh-dong", name: "Hành Động" },
  { id: "phuong-tien", name: "Phương Tiện" },
  { id: "trai-cay", name: "Hoa Quả" },
  { id: "nghe-nghiep", name: "Nghề Nghiệp" },
];

// Bộ lọc ngôn ngữ
const LANGUAGE_FILTERS = [
  { id: "all", name: "Tất cả ngôn ngữ" },
  { id: "en-vi", name: "Anh - Việt" },
  { id: "zh-vi", name: "Trung - Việt" },
];

function OrderContent() {
  const searchParams = useSearchParams();
  const packParam = searchParams.get("pack");
  const categoryParam = searchParams.get("category");
  const animalParam = searchParams.get("animal");
  const comboParam = searchParams.get("combo");

  // Multi-step Checkout: Step 1: Chọn bộ thẻ & số lượng | Step 2: Nhập địa chỉ & thanh toán
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Danh sách các bộ thẻ (kết hợp từ COMBO_PACKS mặc định và đồng bộ động từ API MongoDB)
  const [availablePacks, setAvailablePacks] = useState<CardComboPack[]>(COMBO_PACKS);

  // Tìm bộ thẻ ban đầu dựa trên tham số URL
  const initialPackId = useMemo(() => {
    const rawParam = (packParam || comboParam || categoryParam || animalParam || "").toLowerCase();
    if (!rawParam) return "pack-combo-vip-120";

    const found = availablePacks.find(
      (p) =>
        p.id.toLowerCase() === rawParam ||
        p.packCode.toLowerCase() === rawParam ||
        p.categorySlug.toLowerCase() === rawParam ||
        p.sampleSlug.toLowerCase() === rawParam ||
        rawParam.includes(p.categorySlug)
    );

    return found ? found.id : "pack-combo-vip-120";
  }, [packParam, comboParam, categoryParam, animalParam, availablePacks]);

  const [selectedPackId, setSelectedPackId] = useState<string>(initialPackId);
  const [quantity, setQuantity] = useState<number>(1);
  const [searchPackQuery, setSearchPackQuery] = useState<string>("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");
  const [activeLanguageFilter, setActiveLanguageFilter] = useState<string>("all");

  // Form thông tin khách hàng
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "banking">("cod");

  // Trạng thái gửi đơn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lắng nghe API /api/pack-codes để cập nhật danh mục mới nhất từ MongoDB Atlas
  useEffect(() => {
    fetch("/api/pack-codes")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          // Bổ sung hoặc cập nhật thông tin nếu có mã bộ mới trong DB
          setAvailablePacks((prev) => {
            const existingCodes = new Set(prev.map((p) => p.packCode));
            const newPacks: CardComboPack[] = [];

            for (const item of res.data) {
              if (!existingCodes.has(item.code) && item.code.startsWith("POLY")) {
                const isZh = item.code.includes("ZHVI");
                newPacks.push({
                  id: `pack-${item.code.toLowerCase()}`,
                  name: item.name || `Bộ 30 Thẻ AR ${item.code}`,
                  packCode: item.code,
                  categoryName: item.categoryName || "Chủ đề Poly Cards",
                  categorySlug: item.categorySlug || "khac",
                  languageType: isZh ? "zh-vi" : "en-vi",
                  cardsCount: 30,
                  price: 249000,
                  originalPrice: 299000,
                  discountPercent: 17,
                  badge: isZh ? "Song Ngữ Trung - Việt" : "Song Ngữ Anh - Việt",
                  imageSrc: "/images/cards/butterfly-card.png",
                  sampleSlug: "polycards",
                  description: item.description || `Bộ 30 thẻ AR tương tác 3D đa góc nhìn sống động.`,
                  highlights: ["30 Thẻ AR 3D", "Phát âm chuẩn", "Chống nước 100%"],
                });
              }
            }
            return newPacks.length > 0 ? [...prev, ...newPacks] : prev;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Bộ thẻ đang được chọn
  const selectedPack = useMemo(() => {
    return availablePacks.find((p) => p.id === selectedPackId) || availablePacks[0];
  }, [availablePacks, selectedPackId]);

  // Cập nhật khi URL parameter thay đổi
  useEffect(() => {
    if (initialPackId) {
      setSelectedPackId(initialPackId);
    }
  }, [initialPackId]);

  // Lọc danh sách bộ thẻ theo Search Query, Category Tabs & Ngôn ngữ
  const filteredPacks = useMemo(() => {
    return availablePacks.filter((pack) => {
      // 1. Lọc theo danh mục
      const matchCat =
        activeCategoryTab === "all" || pack.categorySlug === activeCategoryTab;

      // 2. Lọc theo ngôn ngữ
      const matchLang =
        activeLanguageFilter === "all" ||
        pack.languageType === "all" ||
        pack.languageType === activeLanguageFilter;

      // 3. Lọc theo từ khóa tìm kiếm
      const q = searchPackQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        pack.name.toLowerCase().includes(q) ||
        pack.description.toLowerCase().includes(q) ||
        pack.categoryName.toLowerCase().includes(q);

      return matchCat && matchLang && matchQuery;
    });
  }, [availablePacks, activeCategoryTab, activeLanguageFilter, searchPackQuery]);

  // Tính giá
  const unitPrice = selectedPack.price;
  const originalUnitPrice = selectedPack.originalPrice;
  const totalPrice = unitPrice * quantity;
  const originalTotalPrice = originalUnitPrice * quantity;
  const discountTotal = originalTotalPrice - totalPrice;
  const productName = `${selectedPack.name} (${selectedPack.cardsCount} Thẻ AR)`;

  // Chuyển sang Bước 2 (Nhập thông tin giao hàng)
  const handleProceedToStep2 = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Quay lại Bước 1 (Chọn bộ thẻ)
  const handleBackToStep1 = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          productId: selectedPack.id,
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

  // ==================== MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG ====================
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
          <h1 className="text-2xl sm:text-4xl font-black text-stone-900 leading-tight">
            Cảm Ơn Bạn Đã Đặt Mua Poly Cards!
          </h1>
          <p className="text-sm sm:text-base text-stone-600 max-w-lg mx-auto font-medium">
            Đơn hàng của bạn đã được ghi nhận vào hệ thống. Đội ngũ Poly Cards sẽ liên hệ qua số điện thoại <strong>{phone}</strong> để xác nhận và gửi bộ thẻ đến tay bé.
          </p>
        </div>

        {/* Biên lai tóm tắt đơn hàng */}
        <div className="rounded-3xl border-2 border-amber-200/90 bg-white p-5 sm:p-6 shadow-xl text-left space-y-3.5">
          <h3 className="text-sm sm:text-base font-black text-stone-900 border-b border-amber-100 pb-2">
            Tóm Tắt Đơn Đặt Hàng:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-stone-700">
            <div>
              <span className="text-stone-500">Người nhận:</span>{" "}
              <strong className="text-stone-900">{fullName}</strong>
            </div>
            <div>
              <span className="text-stone-500">Số điện thoại:</span>{" "}
              <strong className="text-stone-900">{phone}</strong>
            </div>
            {email && (
              <div>
                <span className="text-stone-500">Email:</span>{" "}
                <strong className="text-stone-900">{email}</strong>
              </div>
            )}
            <div className="sm:col-span-2">
              <span className="text-stone-500">Địa chỉ giao:</span>{" "}
              <strong className="text-stone-900">{address}</strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-stone-500">Bộ thẻ đã chọn:</span>{" "}
              <strong className="text-emerald-700">{productName}</strong> (x{quantity})
            </div>
            <div>
              <span className="text-stone-500">Phương thức:</span>{" "}
              <strong className="text-stone-900">
                {paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản QR ngân hàng"}
              </strong>
            </div>
            <div>
              <span className="text-stone-500">Tổng thanh toán:</span>{" "}
              <strong className="text-base text-amber-600 font-black">
                {formatVndCurrency(totalPrice)}
              </strong>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            href="/"
            className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 text-sm font-black text-stone-950 shadow-lg hover:bg-amber-400 active:scale-95 transition-all"
          >
            <span>Về Trang Chủ</span>
          </Link>
          <Link
            href="/scan"
            className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-6 text-sm font-black text-emerald-900 hover:bg-emerald-100 active:scale-95 transition-all"
          >
            <span>Trải Nghiệm WebAR Ngay</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 sm:pb-24 max-w-full overflow-x-hidden">
      {/* Step Indicator Header (Theo chuẩn TikTok Checkout UI) */}
      <div className="mx-auto max-w-5xl px-3 sm:px-6 pt-2 pb-4">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleBackToStep1}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-stone-200 text-stone-700 active:scale-90 transition-transform cursor-pointer shadow-xs"
                title="Quay lại chọn bộ thẻ"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h1 className="text-base sm:text-xl font-black text-stone-950 flex items-center gap-2">
                <span>{currentStep === 1 ? "1. Chọn Bộ Thẻ Bạn Muốn Mua" : "2. Thông Tin Nhận Hàng & Thanh Toán"}</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-stone-500 font-medium">
                {currentStep === 1
                  ? `Đang có sẵn ${availablePacks.length} bộ thẻ AR (270 thẻ) trong kho`
                  : "Điền địa chỉ nhận hàng và chọn phương thức thanh toán"}
              </p>
            </div>
          </div>

          {/* Stepper Pill */}
          <div className="flex items-center gap-1.5 shrink-0 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300">
            <span
              className={`h-2 w-2 rounded-full ${
                currentStep === 1 ? "bg-amber-600 animate-pulse" : "bg-emerald-600"
              }`}
            />
            <span className="text-[11px] font-black text-amber-950">
              Bước {currentStep}/2
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6">
        {/* ============================================================== */}
        {/* ==================== BƯỚC 1: CHỌN BỘ THẺ ===================== */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Thanh Tìm Kiếm & Bộ Lọc Đa Tầng */}
            <div className="space-y-2.5 bg-white/95 rounded-3xl border-2 border-amber-200/80 p-3 sm:p-4 shadow-sm">
              {/* Ô Tìm Kiếm Nhanh */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchPackQuery}
                  onChange={(e) => setSearchPackQuery(e.target.value)}
                  placeholder="Tìm kiếm bộ thẻ (Động vật, Xe cộ, Hoa quả, VIP, Nghề nghiệp...)"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-amber-400 focus:outline-hidden transition-all"
                />
                {searchPackQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchPackQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700"
                  >
                    Xoá
                  </button>
                )}
              </div>

              {/* Bộ lọc 1: Chủ Đề (Horizontal Scrollable Tabs) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] sm:text-xs">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategoryTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer active:scale-95 ${
                      activeCategoryTab === tab.id
                        ? "bg-amber-400 text-stone-950 font-black shadow-xs ring-1 ring-amber-500/30"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Bộ lọc 2: Ngôn Ngữ Song Ngữ */}
              <div className="flex items-center gap-2 pt-1 border-t border-stone-100 text-[11px]">
                <span className="font-bold text-stone-500 flex items-center gap-1 shrink-0">
                  <Languages className="h-3.5 w-3.5 text-amber-600" />
                  <span>Ngôn ngữ:</span>
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {LANGUAGE_FILTERS.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setActiveLanguageFilter(lang.id)}
                      className={`px-2.5 py-0.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                        activeLanguageFilter === lang.id
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Thông báo kết quả tìm kiếm */}
            <div className="flex items-center justify-between text-xs px-1 text-stone-600 font-semibold">
              <span>Hiển thị <strong>{filteredPacks.length}</strong> bộ thẻ AR phù hợp:</span>
              <span className="text-amber-700 font-bold">270 Thẻ AR Tương Tác 3D</span>
            </div>

            {/* Danh Sách Bộ Thẻ Dạng Lưới / Card Sắc Nét */}
            {filteredPacks.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-8 text-center space-y-2">
                <Box className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
                <p className="text-sm font-bold text-stone-800">
                  Không tìm thấy bộ thẻ nào phù hợp với từ khóa &ldquo;{searchPackQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPackQuery("");
                    setActiveCategoryTab("all");
                    setActiveLanguageFilter("all");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-black text-amber-700 hover:underline cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Xóa bộ lọc để xem toàn bộ 9 bộ thẻ</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredPacks.map((pack) => {
                  const isSelected = selectedPack.id === pack.id;
                  const isVip = pack.cardsCount >= 120;

                  return (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedPackId(pack.id)}
                      className={`relative flex flex-col justify-between rounded-3xl border-2 p-4 text-left transition-all cursor-pointer active:scale-[0.99] ${
                        isSelected
                          ? "border-amber-400 bg-amber-50/95 shadow-lg ring-2 ring-amber-300"
                          : "border-amber-200/70 bg-white hover:bg-amber-50/40 hover:border-amber-300 shadow-xs"
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              isVip
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-xs"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {pack.badge}
                          </span>
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                            {pack.cardsCount} Thẻ AR
                          </span>
                          {pack.languageType && (
                            <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                              {pack.languageType === "zh-vi"
                                ? "Trung - Việt"
                                : pack.languageType === "en-vi"
                                ? "Anh - Việt"
                                : "Đa Ngữ"}
                            </span>
                          )}
                        </div>

                        {/* Radio Checkbox */}
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                            isSelected
                              ? "border-amber-500 bg-amber-400 text-stone-950 shadow-xs"
                              : "border-stone-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Tên Bộ Thẻ & Mô Tả */}
                      <div className="space-y-1 my-1">
                        <h3 className="text-sm sm:text-base font-black text-stone-950 leading-snug">
                          {pack.name}
                        </h3>
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-medium">
                          {pack.description}
                        </p>
                      </div>

                      {/* Highlights */}
                      {pack.highlights && (
                        <div className="flex items-center gap-2 py-2 flex-wrap text-[11px] text-stone-500">
                          {pack.highlights.map((h, idx) => (
                            <span key={idx} className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span>{h}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Giá Tiền & Trạng Thái Chọn */}
                      <div className="flex items-center justify-between border-t border-amber-100/90 pt-3 mt-1">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-amber-700">
                              {formatVndCurrency(pack.price)}
                            </span>
                            {pack.originalPrice && (
                              <span className="text-xs text-stone-400 line-through">
                                {formatVndCurrency(pack.originalPrice)}
                              </span>
                            )}
                          </div>
                          {pack.discountPercent > 0 && (
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-sm">
                              Tiết kiệm {pack.discountPercent}%
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-xs font-black px-3 py-1.5 rounded-xl transition-all ${
                            isSelected
                              ? "bg-amber-400 text-stone-950 shadow-xs"
                              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          }`}
                        >
                          {isSelected ? "Đang Chọn ✓" : "Chọn Bộ Này"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Chọn Số Lượng Bộ Thẻ */}
            <div className="bg-white/95 rounded-3xl border-2 border-amber-200/80 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-stone-900 block">Số lượng bộ thẻ đặt mua:</span>
                <span className="text-xs text-stone-500 font-medium">Mua từ 2 bộ nhận ngay quà tặng độc quyền</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-base font-black text-stone-700 hover:bg-amber-100 active:scale-90 transition-all cursor-pointer shadow-xs"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-base font-black text-stone-900 font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-base font-black text-stone-700 hover:bg-amber-100 active:scale-90 transition-all cursor-pointer shadow-xs"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ================= BƯỚC 2: THÔNG TIN GIAO HÀNG ================ */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
            {/* Card Tóm Tắt Bộ Thẻ Đang Chọn (Chuẩn TikTok Shop Item Card) */}
            <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/70 p-4 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden border border-amber-200 bg-white">
                  <Image
                    src={selectedPack.imageSrc || "/images/cards/butterfly-card.png"}
                    alt={selectedPack.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-stone-950 uppercase">
                      {selectedPack.badge}
                    </span>
                    <span className="text-[10px] font-bold text-stone-600">
                      {selectedPack.cardsCount} Thẻ AR
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-stone-950 truncate mt-0.5">
                    {selectedPack.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-black text-amber-700">
                      {formatVndCurrency(unitPrice)}
                    </span>
                    <span className="text-xs text-stone-500">x{quantity}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBackToStep1}
                className="shrink-0 text-xs font-black text-amber-700 hover:underline px-2.5 py-1.5 rounded-xl border border-amber-300 bg-white shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                Đổi Bộ Khác
              </button>
            </div>

            {/* Khối Nhập Thông Tin Nhận Hàng */}
            <div className="rounded-3xl border-2 border-stone-200 bg-white/95 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-600" />
                  <span>Địa Chỉ Nhận Hàng</span>
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  Poly Cards miễn phí giao hàng toàn quốc và bảo hành 1 đổi 1.
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                  {errorMessage}
                </div>
              )}

              {/* Họ và tên */}
              <div>
                <label className="text-xs font-black text-stone-800 mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-600" />
                  <span>Họ và tên người nhận *</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              {/* SĐT & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-black text-stone-800 mb-1.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-amber-600" />
                    <span>Số điện thoại nhận hàng *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-stone-800 mb-1.5 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-amber-600" />
                    <span>Email (nhận mã WebAR trọn đời)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Địa chỉ giao hàng chi tiết */}
              <div>
                <label className="text-xs font-black text-stone-800 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  <span>Địa chỉ giao hàng chi tiết *</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, ngõ/đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                  className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              {/* Ghi chú giao hàng */}
              <div>
                <label className="text-xs font-black text-stone-800 mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-amber-600" />
                  <span>Ghi chú đơn hàng (tuỳ chọn)</span>
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi đến..."
                  className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all resize-none"
                />
              </div>
            </div>

            {/* Khối Phương Thức Thanh Toán (Giữ nguyên COD & Chuyển Khoản QR Ngân Hàng) */}
            <div className="rounded-3xl border-2 border-stone-200 bg-white/95 p-4 sm:p-6 shadow-sm space-y-3">
              <div className="border-b border-stone-100 pb-2">
                <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <span>Phương Thức Thanh Toán</span>
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  Chỉ thanh toán khi nhận hàng hoặc chuyển khoản bảo đảm.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all cursor-pointer ${
                    paymentMethod === "cod"
                      ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-sm ring-2 ring-emerald-300"
                      : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      paymentMethod === "cod" ? "border-emerald-600" : "border-stone-300"
                    }`}
                  >
                    {paymentMethod === "cod" && <div className="h-2 w-2 rounded-full bg-emerald-600" />}
                  </div>
                  <div>
                    <span className="block text-xs font-black">Thanh toán khi nhận hàng (COD)</span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      Kiểm tra thẻ bài trước, thanh toán tiền mặt sau
                    </span>
                  </div>
                </button>

                {/* 2. Chuyển khoản QR */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("banking")}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all cursor-pointer ${
                    paymentMethod === "banking"
                      ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-sm ring-2 ring-emerald-300"
                      : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      paymentMethod === "banking" ? "border-emerald-600" : "border-stone-300"
                    }`}
                  >
                    {paymentMethod === "banking" && <div className="h-2 w-2 rounded-full bg-emerald-600" />}
                  </div>
                  <div>
                    <span className="block text-xs font-black">Chuyển khoản QR ngân hàng</span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      Quét mã QR thanh toán nhanh qua App ngân hàng
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Chi Tiết Hóa Đơn Tóm Tắt (TikTok Shop Summary) */}
            <div className="rounded-3xl border-2 border-stone-200 bg-white/95 p-4 sm:p-5 shadow-sm space-y-2.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Tổng tiền hàng ({quantity} bộ)</span>
                <span className="font-semibold text-stone-900">{formatVndCurrency(originalTotalPrice)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Giảm giá bộ thẻ</span>
                  <span>-{formatVndCurrency(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span className="font-bold text-emerald-600 uppercase">Miễn phí toàn quốc (0đ)</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-black text-stone-900">
                <span>Tổng thanh toán</span>
                <span className="text-base text-amber-700">{formatVndCurrency(totalPrice)}</span>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ============ STICKY BOTTOM CHECKOUT FOOTER (CHUẨN TIKTOK SHOP) =========== */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-amber-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-3 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          {/* Tổng tiền bên trái */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs text-stone-500 font-bold">
                Tổng ({quantity} bộ):
              </span>
              {discountTotal > 0 && (
                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-sm">
                  Tiết kiệm {formatVndCurrency(discountTotal)}
                </span>
              )}
            </div>
            <div className="text-base sm:text-2xl font-black text-amber-700 leading-tight">
              {formatVndCurrency(totalPrice)}
            </div>
          </div>

          {/* Nút Hành Động Bám Đáy (TikTok Style Pill Button) */}
          <div className="shrink-0">
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="btn-toy-3d flex min-h-[48px] sm:min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 sm:px-8 text-xs sm:text-sm font-black text-stone-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer hover:brightness-105"
              >
                <span>Nhập Địa Chỉ Giao Hàng</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-toy-3d flex min-h-[48px] sm:min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 sm:px-8 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer hover:brightness-105 disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{isSubmitting ? "Đang Gửi Đơn..." : "Xác Nhận Đặt Hàng"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl py-24 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-xs font-bold text-stone-500">Đang chuẩn bị trang đặt hàng Poly Cards...</p>
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}
