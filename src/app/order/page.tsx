"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { formatVndCurrency } from "@/lib/formatters";
import { formatVnd, computePackDynamicPricing } from "@/lib/pricing";
import { CardComboPack, COMBO_PACKS } from "@/data/combos";
import { DeliveryMethod, DbComboRule, Animal } from "@/types/animal";
import { evaluateBestCombo, DEFAULT_COMBO_RULES } from "@/lib/combo-engine";
import { SelectedPacksStack, SelectedPackItem } from "@/components/order/selected-packs-stack";
import { OrderPackSheet } from "@/components/order/order-pack-sheet";
import { PackDetailModal } from "@/components/order/pack-detail-modal";
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
  ChevronRight,
  PackageOpen,
} from "lucide-react";

function OrderContent() {
  const searchParams = useSearchParams();
  const packParam = searchParams.get("pack");
  const categoryParam = searchParams.get("category");
  const animalParam = searchParams.get("animal");
  const comboParam = searchParams.get("combo");

  // Danh sách các bộ thẻ có sẵn (kết hợp tĩnh + nạp từ MongoDB)
  const [availablePacks, setAvailablePacks] = useState<CardComboPack[]>(COMBO_PACKS);

  // Sheet & Modal States
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [detailPack, setDetailPack] = useState<CardComboPack | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Khởi tạo các bộ thẻ được chọn xếp vào Thùng hàng (Stack)
  const [selectedItems, setSelectedItems] = useState<SelectedPackItem[]>(() => {
    const rawParam = (packParam || comboParam || categoryParam || animalParam || "").toLowerCase();
    const defaultPack = COMBO_PACKS.find(
      (p) =>
        p.id.toLowerCase() === rawParam ||
        p.packCode.toLowerCase() === rawParam ||
        p.categorySlug.toLowerCase() === rawParam ||
        p.sampleSlug.toLowerCase() === rawParam ||
        rawParam.includes(p.categorySlug)
    ) || COMBO_PACKS[0]; // Mặc định là Bộ 30 Thẻ AR Động Vật Hoang Dã (Anh - Việt)

    return [{ pack: defaultPack, quantity: 1 }];
  });

  // Form thông tin khách hàng
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "banking">("cod");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("CPN_COD");
  const [comboRules, setComboRules] = useState<DbComboRule[]>(DEFAULT_COMBO_RULES);

  // Trạng thái gửi đơn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrderCode, setCreatedOrderCode] = useState<string>("");
  const [createdCustomerCode, setCreatedCustomerCode] = useState<string>("");

  // Nạp danh sách combo rules từ API
  useEffect(() => {
    fetch("/api/combos")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setComboRules(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Đồng bộ giá bộ thẻ động thời gian thực từ Thẻ Lẻ (products) + Cấu hình mã bộ (pack_codes)
  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/pack-codes").then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([productsRes, packsRes]) => {
      const allCards: Animal[] = Array.isArray(productsRes?.data) ? productsRes.data : [];
      const packConfigsList: any[] = Array.isArray(packsRes?.data) ? packsRes.data : [];
      const packConfigMap = new Map<string, any>();
      for (const p of packConfigsList) {
        if (p?.code) packConfigMap.set(p.code.toUpperCase(), p);
      }

      setAvailablePacks((prev) => {
        // 1. Cập nhật lại giá động cho tất cả các bộ hiện có dựa trên thẻ lẻ thật trong kho
        const updated = prev.map((pack) => {
          const cfg = packConfigMap.get(pack.packCode.toUpperCase());
          const dynamicPricing = computePackDynamicPricing(pack.packCode, cfg, allCards);

          return {
            ...pack,
            cardsCount: dynamicPricing.cardsCount,
            price: dynamicPricing.price,
            originalPrice: dynamicPricing.originalPrice,
            discountPercent: dynamicPricing.discountPercent,
          };
        });

        // 2. Bổ sung các mã bộ mới từ database nếu chưa có trong danh sách
        const existingCodes = new Set(updated.map((p) => p.packCode.toUpperCase()));
        const newPacks: CardComboPack[] = [];

        for (const item of packConfigsList) {
          const codeUpper = (item.code || "").toUpperCase();
          if (!existingCodes.has(codeUpper) && codeUpper.startsWith("POLY")) {
            const dynamicPricing = computePackDynamicPricing(item.code, item, allCards);

            // Chỉ thêm mã bộ mới nếu thực sự có thẻ trong kho (cardsCount > 0)
            if (dynamicPricing.cardsCount > 0) {
              const nameUpper = (item.name || "").toUpperCase();
              const isZh = codeUpper.includes("ZHVI") || nameUpper.includes("TRUNG");
              const isEn = codeUpper.includes("ENVI") || nameUpper.includes("ANH");

              const badge = isZh
                ? "Song Ngữ Trung - Việt"
                : isEn
                ? "Song Ngữ Anh - Việt"
                : "Bộ Thẻ AR 3D";

              newPacks.push({
                id: `pack-${item.code.toLowerCase()}`,
                name: item.name || `Bộ 30 Thẻ AR ${item.code}`,
                packCode: item.code,
                categoryName: item.categoryName || "Chủ đề Poly Cards",
                categorySlug: item.categorySlug || "khac",
                languageType: isZh ? "zh-vi" : "en-vi",
                cardsCount: dynamicPricing.cardsCount,
                price: dynamicPricing.price,
                originalPrice: dynamicPricing.originalPrice,
                discountPercent: dynamicPricing.discountPercent,
                badge,
                imageSrc: "/images/cards/butterfly-card.png",
                sampleSlug: "polycards",
                description: item.description || `Bộ 30 thẻ AR tương tác 3D đa góc nhìn sống động.`,
                highlights: ["30 Thẻ AR 3D", "Phát âm chuẩn", "Chống nước 100%"],
              });
            }
          }
        }

        // 3. Lọc bỏ triệt để các mã bộ rỗng (cardsCount === 0) như POLY30-NGHENGHIEP, POLY30-HANHDONG...
        const combined = newPacks.length > 0 ? [...updated, ...newPacks] : updated;
        const finalPacks = combined.filter((p) => (p.cardsCount || 0) > 0);

        // 4. Tự động cập nhật lại các bộ đang có trong thùng hàng (selectedItems) theo giá mới nhất
        setSelectedItems((currItems) =>
          currItems.map((it) => {
            const freshPack = finalPacks.find((p) => p.packCode === it.pack.packCode);
            return freshPack ? { ...it, pack: freshPack } : it;
          })
        );

        return finalPacks;
      });
    });
  }, []);

  // Danh sách ID các bộ đang có trong thùng hàng
  const selectedPackIds = useMemo(() => {
    return selectedItems.map((item) => item.pack.id);
  }, [selectedItems]);

  // Cập nhật số lượng của từng bộ thẻ trong thùng
  const handleUpdateQuantity = (packId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.pack.id === packId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SelectedPackItem[]
    );
  };

  // Xóa bộ thẻ khỏi thùng
  const handleRemoveItem = (packId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.pack.id !== packId));
  };

  // Toggle chọn / bỏ chọn bộ thẻ từ Bottom Sheet
  const handleToggleSelectPack = (pack: CardComboPack) => {
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.pack.id === pack.id);
      if (exists) {
        return prev.filter((item) => item.pack.id !== pack.id);
      } else {
        return [...prev, { pack, quantity: 1 }];
      }
    });
  };

  // Thêm bộ thẻ vào giỏ từ Modal xem chi tiết
  const handleAddFromDetail = (pack: CardComboPack) => {
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.pack.id === pack.id);
      if (exists) {
        return prev.map((item) =>
          item.pack.id === pack.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { pack, quantity: 1 }];
      }
    });
  };

  // Mở modal xem chi tiết bộ thẻ
  const handleOpenDetail = (pack: CardComboPack) => {
    setDetailPack(pack);
    setIsDetailModalOpen(true);
  };

  // Tính tổng tiền & giảm giá (kết hợp Best Combo Engine)
  const {
    totalPacksCount,
    totalCardsCount,
    subtotalPrice,
    originalTotalPrice,
    packDiscountTotal,
    comboDiscountTotal,
    finalTotalPrice,
    appliedComboRule,
    comboSuggestion,
  } = useMemo(() => {
    let packsCount = 0;
    let cardsCount = 0;
    let origSum = 0;

    for (const item of selectedItems) {
      packsCount += item.quantity;
      cardsCount += item.pack.cardsCount * item.quantity;
      origSum += (item.pack.originalPrice || item.pack.price) * item.quantity;
    }

    const evaluationItems = selectedItems.map((item) => ({
      packCode: item.pack.packCode,
      categorySlug: item.pack.categorySlug,
      quantity: item.quantity,
      salePrice: item.pack.price,
      originalPrice: item.pack.originalPrice,
    }));

    const comboEval = evaluateBestCombo(evaluationItems, comboRules);
    const packDiscount = Math.max(0, origSum - comboEval.subtotal);

    return {
      totalPacksCount: packsCount,
      totalCardsCount: cardsCount,
      subtotalPrice: comboEval.subtotal,
      originalTotalPrice: origSum,
      packDiscountTotal: packDiscount,
      comboDiscountTotal: comboEval.discountAmount,
      finalTotalPrice: comboEval.finalPrice,
      appliedComboRule: comboEval.rule,
      comboSuggestion: comboEval.nextSuggestion,
    };
  }, [selectedItems, comboRules]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Chặn double submit
    setErrorMessage(null);

    if (selectedItems.length === 0) {
      setErrorMessage("Thùng hàng đang trống. Vui lòng chọn ít nhất 1 bộ thẻ AR để đặt hàng.");
      setIsSheetOpen(true);
      return;
    }

    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng.");
      return;
    }

    const itemsSummary = selectedItems
      .map((item) => `${item.pack.name} (x${item.quantity})`)
      .join(", ");

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
          productName: `[${totalPacksCount} Bộ, ${totalCardsCount} Thẻ]: ${itemsSummary}`,
          quantity: totalPacksCount,
          subtotal: subtotalPrice,
          totalPrice: finalTotalPrice,
          discountTotal: packDiscountTotal + comboDiscountTotal,
          comboName: appliedComboRule?.name || "",
          comboDiscount: comboDiscountTotal,
          paymentMethod,
          deliveryMethod,
          codAmount: deliveryMethod === "CPN_COD" ? finalTotalPrice : 0,
          items: selectedItems,
          note,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.data?.orderCode) setCreatedOrderCode(data.data.orderCode);
        if (data.data?.customerCode) setCreatedCustomerCode(data.data.customerCode);
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
            Đơn hàng của bạn đã được ghi nhận vào hệ thống với mã đơn:{" "}
            <strong className="text-amber-700 font-mono text-base">{createdOrderCode || "Đang tạo..."}</strong>
            {createdCustomerCode && (
              <> (Mã Khách Hàng: <strong className="text-emerald-700 font-mono">{createdCustomerCode}</strong>)</>
            )}
            . Đội ngũ Poly Cards sẽ liên hệ qua số điện thoại <strong>{phone}</strong> để xác nhận và gửi bộ thẻ đến tay bé.
          </p>
        </div>

        {/* Biên lai tóm tắt đơn hàng */}
        <div className="rounded-3xl border-2 border-amber-200/90 bg-white p-5 sm:p-6 shadow-xl text-left space-y-3.5">
          <h3 className="text-sm sm:text-base font-black text-stone-900 border-b border-amber-100 pb-2">
            Tóm Tắt Đơn Đặt Hàng:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-medium text-stone-700">
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
            <div className="sm:col-span-2 space-y-1">
              <span className="text-stone-500 block">Các bộ thẻ trong thùng ({totalPacksCount} bộ - {totalCardsCount} thẻ AR):</span>
              <div className="rounded-xl bg-amber-50/70 p-2.5 border border-amber-200/80 space-y-1">
                {selectedItems.map(({ pack, quantity }, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="font-bold text-stone-900">• {pack.name}</span>
                    <span className="text-amber-800 font-black">x{quantity} ({formatVndCurrency(pack.price * quantity)})</span>
                  </div>
                ))}
              </div>
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
                {formatVndCurrency(finalTotalPrice)}
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
      {/* Top Header Checkout Bar */}
      <div className="mx-auto max-w-5xl px-3 sm:px-6 pt-3 pb-4">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-stone-700 hover:text-amber-700 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Trang Chủ</span>
          </Link>

          <h1 className="text-sm sm:text-lg font-black text-stone-950">
            Đặt Mua Bộ Thẻ Thực Tế Ảo Poly Cards
          </h1>

          <div className="flex items-center gap-1.5 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300 text-[11px] font-black text-amber-950">
            <Sparkles className="h-3 w-3 text-amber-600" />
            <span>Freeship Toàn Quốc</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6">
        <form onSubmit={handleSubmit}>
          {/* Bố cục 2 cột tổng quan trên Desktop & 1 cột mượt mà trên Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* ================= CỘT TRÁI (7 COLS): THÙNG HÀNG & THÔNG TIN ================= */}
            <div className="lg:col-span-7 space-y-5">
              {/* Error Message */}
              {errorMessage && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                  {errorMessage}
                </div>
              )}

              {/* 1. KHỐI THÙNG HÀNG THÔNG MINH (STACK CÁC BỘ ĐÃ CHỌN) */}
              <SelectedPacksStack
                items={selectedItems}
                onOpenSheet={() => setIsSheetOpen(true)}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />

              {/* 2. KHỐI ĐỊA CHỈ GIAO HÀNG */}
              <div className="rounded-3xl border-2 border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                <div className="border-b border-stone-100 pb-2.5">
                  <h2 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-amber-600" />
                    <span>Thông Tin Khách Hàng</span>
                  </h2>
                  <p className="text-xs text-stone-500 font-medium">
                    Nhân viên bưu điện sẽ giao tận tay và cho phép kiểm tra thẻ trước khi nhận.
                  </p>
                </div>

                {/* Họ tên */}
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
                    className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                  />
                </div>

                {/* SĐT & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-black text-stone-800 mb-1.5 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-amber-600" />
                      <span>Số điện thoại *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ví dụ: 0912 345 678"
                      className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-stone-800 mb-1.5 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-amber-600" />
                      <span>Email</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Địa chỉ giao */}
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
                    className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all"
                  />
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="text-xs font-black text-stone-800 mb-1.5 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                    <span>Ghi chú giao hàng (tuỳ chọn)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi đến..."
                    className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-hidden transition-all resize-none"
                  />
                </div>
              </div>

              {/* 3. KHỐI PHƯƠNG THỨC THANH TOÁN (COD & BANKING) */}
              <div className="rounded-3xl border-2 border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-3">
                <div className="border-b border-stone-100 pb-2">
                  <h2 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-amber-600" />
                    <span>Phương Thức Thanh Toán</span>
                  </h2>
                  <p className="text-xs text-stone-500 font-medium">
                    Chỉ thanh toán khi nhận hàng hoặc chuyển khoản bảo đảm.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all cursor-pointer ${
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

                  {/* Chuyển khoản QR */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("banking")}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all cursor-pointer ${
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
            </div>

            {/* ================= CỘT PHẢI (5 COLS): TỔNG QUAN HÓA ĐƠN TRÊN DESKTOP ================= */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
              <div className="rounded-3xl border-2 border-amber-300/90 bg-white p-5 sm:p-6 shadow-md space-y-4">
                <div className="border-b border-amber-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-black text-stone-900">
                    Tóm Tắt Hóa Đơn ({totalPacksCount} Bộ)
                  </h3>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {totalCardsCount} Thẻ AR
                  </span>
                </div>

                {/* Danh sách các bộ trong hóa đơn */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                  {selectedItems.length === 0 ? (
                    <p className="text-stone-400 italic">Chưa chọn bộ thẻ nào...</p>
                  ) : (
                    selectedItems.map(({ pack, quantity }, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-stone-50">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-stone-900 block truncate">{pack.name}</span>
                          <span className="text-[11px] text-stone-500">Số lượng: x{quantity}</span>
                        </div>
                        <span className="font-black text-stone-900 shrink-0">
                          {formatVndCurrency(pack.price * quantity)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Tính toán tiền theo chuẩn POS/Hóa Đơn */}
                <div className="space-y-2 border-t border-amber-100 pt-3 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Tạm tính (Giá gốc niêm yết):</span>
                    <span className="font-semibold text-stone-900 font-mono">
                      {formatVndCurrency(originalTotalPrice)}
                    </span>
                  </div>

                  {packDiscountTotal > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Giảm giá theo bộ thẻ:</span>
                      <span className="font-semibold text-rose-600 font-mono">
                        -{formatVndCurrency(packDiscountTotal)}
                      </span>
                    </div>
                  )}

                  {comboDiscountTotal > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 space-y-1">
                      <div className="flex justify-between items-center text-amber-900 font-bold">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>{appliedComboRule?.name || "Ưu Đãi Combo"}</span>
                        </span>
                        <span className="font-mono text-emerald-700">
                          -{formatVndCurrency(comboDiscountTotal)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Gợi ý Upsell Combo nếu có */}
                  {comboSuggestion && (
                    <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900 font-medium">
                      💡 {comboSuggestion.message}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>Phí vận chuyển:</span>
                    <span className="font-bold text-emerald-600 uppercase text-[11px]">
                      Miễn phí toàn quốc (0đ)
                    </span>
                  </div>

                  <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline text-sm font-black text-stone-900">
                    <span>Tổng thanh toán:</span>
                    <span className="text-xl font-black text-amber-700 font-mono">
                      {formatVndCurrency(finalTotalPrice)}
                    </span>
                  </div>
                </div>

                {/* Nút đặt mua trên Desktop */}
                <div className="hidden lg:block pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedItems.length === 0}
                    className="btn-toy-3d flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 text-sm font-black text-stone-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer hover:brightness-105 disabled:opacity-50"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span>{isSubmitting ? "Đang Gửi Đơn Hàng..." : "Xác Nhận Đặt Mua Ngay"}</span>
                  </button>
                </div>

                {/* Cam kết */}
                <div className="space-y-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Giao hàng nhanh 2-3 ngày, kiểm tra trước khi nhận</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Bảo hành 1 đổi 1 trong 30 ngày nếu có lỗi in ấn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* ============ STICKY BOTTOM CHECKOUT FOOTER (CHUẨN TIKTOK SHOP) =========== */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-amber-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-3 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          {/* Tổng tiền bên trái */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs text-stone-500 font-bold">
                Tổng ({totalPacksCount} bộ):
              </span>
              {(packDiscountTotal + comboDiscountTotal) > 0 && (
                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-sm">
                  Tiết kiệm {formatVndCurrency(packDiscountTotal + comboDiscountTotal)}
                </span>
              )}
            </div>
            <div className="text-base sm:text-xl font-black text-amber-700 leading-tight font-mono">
              {formatVndCurrency(finalTotalPrice)}
            </div>
          </div>

          {/* Nút Đặt Hàng Bám Footer (TikTok Style Pill Button) */}
          <div className="shrink-0 flex items-center gap-2">
            {selectedItems.length === 0 ? (
              <button
                type="button"
                onClick={() => setIsSheetOpen(true)}
                className="btn-toy-3d flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-amber-500 px-5 text-xs font-black text-stone-950 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>+ Chọn Bộ Thẻ</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-toy-3d flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 sm:px-8 text-xs sm:text-sm font-black text-stone-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer hover:brightness-105 disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{isSubmitting ? "Đang Gửi..." : "Xác Nhận Đặt Mua"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ============ BOTTOM SHEET / MODAL CHỌN BỘ THẺ DẠNG HÀNG COMPACT ========= */}
      {/* ========================================================================= */}
      <OrderPackSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        availablePacks={availablePacks}
        selectedPackIds={selectedPackIds}
        onToggleSelectPack={handleToggleSelectPack}
        onOpenDetail={handleOpenDetail}
      />

      {/* ========================================================================= */}
      {/* =================== MODAL XEM CHI TIẾT BỘ THẺ =========================== */}
      {/* ========================================================================= */}
      <PackDetailModal
        pack={detailPack}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSelectAndAdd={handleAddFromDetail}
        isAlreadySelected={detailPack ? selectedPackIds.includes(detailPack.id) : false}
      />
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
