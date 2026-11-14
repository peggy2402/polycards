"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { formatVndCurrency } from "@/lib/formatters";
import { formatVnd, computePackDynamicPricing } from "@/lib/pricing";
import { CardComboPack, COMBO_PACKS } from "@/data/combos";
import { DeliveryMethod, DbComboRule, Animal } from "@/types/animal";
import {
  ShippingConfig,
  DEFAULT_SHIPPING_CONFIG,
  computeShippingFee,
  ShippingCalculationResult,
} from "@/types/shipping";
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
  Receipt,
  Tag,
  QrCode,
  Building2,
  Copy,
  Check,
  AlertCircle,
  Search,
} from "lucide-react";

// Cấu hình tài khoản ngân hàng thụ hưởng Poly Cards
const BANK_INFO = {
  bankName: "Techcombank",
  bankFullName: "Ngân hàng TMCP Kỹ thương Việt Nam",
  accountNumber: "19076530674018",
  accountHolder: "NGUYEN THANH TRA",
};

function OrderContent() {
  const searchParams = useSearchParams();
  const packParam = searchParams.get("pack");
  const categoryParam = searchParams.get("category");
  const animalParam = searchParams.get("animal");
  const comboParam = searchParams.get("combo");

  // Danh sách các bộ thẻ có sẵn (chỉ giữ các bộ có thẻ thực tế, loại trừ các mã rỗng)
  const [availablePacks, setAvailablePacks] = useState<CardComboPack[]>(() =>
    COMBO_PACKS.filter((p) => !["POLY30-NGHENGHIEP", "POLY30-HANHDONG"].includes(p.packCode))
  );

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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Quản lý trạng thái lỗi viền đỏ trực quan ở các trường bắt buộc (*)
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: boolean;
    phone?: boolean;
    address?: boolean;
  }>({});

  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const handleCopyText = (text: string, fieldName: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => {
        setCopiedField((prev) => (prev === fieldName ? null : prev));
      }, 2000);
    }
  };
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("CPN_COD");
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);
  const [comboRules, setComboRules] = useState<DbComboRule[]>(DEFAULT_COMBO_RULES);

  // Trạng thái gửi đơn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrderCode, setCreatedOrderCode] = useState<string>("");
  const [createdCustomerCode, setCreatedCustomerCode] = useState<string>("");
  const [isSwitchingToCod, setIsSwitchingToCod] = useState<boolean>(false);

  // Xử lý chuyển đổi sang COD khi khách đang ở màn hình QR mà đổi ý
  const handleSwitchToCod = async () => {
    try {
      setIsSwitchingToCod(true);
      if (createdOrderCode) {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: createdOrderCode,
            paymentMethod: "TIEN_MAT",
            deliveryMethod: "CPN_COD",
            codAmount: finalTotalPrice,
          }),
        });
      }
      setPaymentMethod("cod");
    } catch {
      setPaymentMethod("cod");
    } finally {
      setIsSwitchingToCod(false);
    }
  };

  // Nạp danh sách combo rules và cấu hình phí vận chuyển từ API
  useEffect(() => {
    fetch("/api/combos")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setComboRules(res.data);
        }
      })
      .catch(() => {});

    fetch("/api/shipping/config")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setShippingConfig(res.data);
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
            imageSrc: cfg?.imageSrc || pack.imageSrc,
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
                imageSrc: item.imageSrc || "/images/cards/butterfly-card.png",
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
    packDiscountPercent,
    comboDiscountTotal,
    totalSavings,
    totalSavingsPercent,
    shippingFee,
    shippingResult,
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
    const packDiscountPercent = origSum > 0 ? Math.round((packDiscount / origSum) * 100) : 0;
    const totalSavings = packDiscount + comboEval.discountAmount;
    const totalSavingsPercent = origSum > 0 ? Math.round((totalSavings / origSum) * 100) : 0;

    // Tính toán phí vận chuyển linh hoạt theo cấu hình MongoDB
    const shippingResult: ShippingCalculationResult = computeShippingFee(
      packsCount,
      comboEval.finalPrice,
      shippingConfig
    );
    const calculatedShippingFee = shippingResult.fee;

    return {
      totalPacksCount: packsCount,
      totalCardsCount: cardsCount,
      subtotalPrice: comboEval.subtotal,
      originalTotalPrice: origSum,
      packDiscountTotal: packDiscount,
      packDiscountPercent,
      comboDiscountTotal: comboEval.discountAmount,
      totalSavings,
      totalSavingsPercent,
      shippingFee: calculatedShippingFee,
      shippingResult,
      finalTotalPrice: comboEval.finalPrice + calculatedShippingFee,
      appliedComboRule: comboEval.rule,
      comboSuggestion: comboEval.nextSuggestion,
    };
  }, [selectedItems, comboRules, shippingConfig]);

  // Cú pháp nội dung chuyển khoản ngân hàng: PCVN + SĐT (Ví dụ: PCVN0862587229)
  const cleanPhone = phone.replace(/\D/g, "");
  const transferDes = cleanPhone ? `PCVN${cleanPhone}` : "PCVN";
  const vietQrUrl = `https://vietqr.app/img?acc=${BANK_INFO.accountNumber}&bank=${BANK_INFO.bankName}&amount=${finalTotalPrice}&des=${encodeURIComponent(transferDes)}&holder=${encodeURIComponent(BANK_INFO.accountHolder)}&template=qronly&showinfo=false`;

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

    // Kiểm tra các trường bắt buộc (*) và đánh dấu viền đỏ
    const newErrors: { fullName?: boolean; phone?: boolean; address?: boolean } = {};
    if (!fullName.trim()) newErrors.fullName = true;
    const rawPhoneDigits = phone.replace(/\D/g, "");
    if (!phone.trim() || rawPhoneDigits.length < 9) newErrors.phone = true;
    if (!address.trim()) newErrors.address = true;

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setErrorMessage("Vui lòng điền đầy đủ các thông tin giao hàng bắt buộc được đánh dấu (*).");

      // Tự động cuộn mượt và đưa trỏ chuột vào ô lỗi đầu tiên
      if (newErrors.fullName) {
        fullNameInputRef.current?.focus();
        fullNameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (newErrors.phone) {
        phoneInputRef.current?.focus();
        phoneInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (newErrors.address) {
        addressInputRef.current?.focus();
        addressInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
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
          shippingFee,
          totalPrice: finalTotalPrice,
          discountTotal: packDiscountTotal + comboDiscountTotal,
          comboName: appliedComboRule?.name || "",
          comboDiscount: comboDiscountTotal,
          paymentMethod,
          deliveryMethod: paymentMethod === "banking" ? "CPN_NHTT" : "CPN_COD",
          codAmount: paymentMethod === "banking" ? 0 : finalTotalPrice,
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
    const orderShortSuffix = createdOrderCode ? createdOrderCode.replace("ORD-ONL-", "") : "";
    const successTransferDes = cleanPhone
      ? `PCVN${cleanPhone}${orderShortSuffix ? ` ${orderShortSuffix}` : ""}`
      : `PCVN${orderShortSuffix || ""}`;
    const successVietQrUrl = `https://vietqr.app/img?acc=${BANK_INFO.accountNumber}&bank=${BANK_INFO.bankName}&amount=${finalTotalPrice}&des=${encodeURIComponent(successTransferDes)}&holder=${encodeURIComponent(BANK_INFO.accountHolder)}&template=qronly&showinfo=false`;

    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16 text-center space-y-6">
        {paymentMethod === "banking" ? (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-xl shadow-amber-500/20 animate-pulse">
            <QrCode className="h-10 w-10" />
          </div>
        ) : (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        )}

        <div className="space-y-2">
          {paymentMethod === "banking" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-950 border border-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>ĐƠN HÀNG ĐÃ GHI NHẬN • CHỜ THANH TOÁN QR</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black text-emerald-950 border border-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>ĐẶT HÀNG THÀNH CÔNG (COD)</span>
            </span>
          )}

          <h1 className="text-2xl sm:text-4xl font-black text-stone-900 leading-tight">
            {paymentMethod === "banking"
              ? "Đơn Hàng Đã Tạo — Quét Mã QR Để Hoàn Tất"
              : "Cảm Ơn Bạn Đã Đặt Mua Poly Cards!"}
          </h1>

          <p className="text-sm sm:text-base text-stone-600 max-w-lg mx-auto font-medium">
            Đơn hàng của bạn đã được lưu chắc chắn vào hệ thống với mã đơn:{" "}
            <strong className="text-amber-700 font-mono text-base">{createdOrderCode || "Đang xử lý..."}</strong>
            {createdCustomerCode && (
              <> (Mã Khách Hàng: <strong className="text-emerald-700 font-mono">{createdCustomerCode}</strong>)</>
            )}
            . {paymentMethod === "banking"
              ? "Vui lòng quét mã QR bên dưới để đơn hàng được ưu tiên đóng gói và chuyển phát ngay hôm nay!"
              : `Bưu tá sẽ liên hệ số điện thoại ${phone} để giao tận nhà, bạn được kiểm tra thẻ bài trước khi thanh toán.`}
          </p>
        </div>

        {/* Biên lai tóm tắt đơn hàng */}
        <div className="rounded-3xl border-2 border-amber-200/90 bg-white p-5 sm:p-6 shadow-xl text-left space-y-3.5">
          <h3 className="text-sm sm:text-base font-black text-stone-900 border-b border-amber-100 pb-2 flex items-center justify-between">
            <span>Chi Tiết Đơn Đặt Hàng:</span>
            <span className="text-xs font-mono font-bold text-stone-500">#{createdOrderCode}</span>
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

        {/* Nếu khách chọn chuyển khoản, hiển thị mã QR và thông tin để khách quét ngay */}
        {paymentMethod === "banking" && (
          <div className="rounded-3xl border-2 border-amber-300/90 bg-gradient-to-br from-amber-50/50 via-white to-stone-50 p-5 sm:p-6 shadow-xl text-left space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#E51937] text-white font-black text-xs flex items-center justify-center shadow-xs">
                  TCB
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-stone-900 block">
                    Quét Mã VietQR Hoàn Tất Thanh Toán
                  </h4>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {BANK_INFO.bankFullName} (Techcombank)
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-full border border-amber-300/80 shrink-0">
                VietQR 24/7
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs">
                <div className="p-2 bg-white rounded-xl border border-stone-100 shadow-inner">
                  <img
                    src={successVietQrUrl}
                    alt="Mã QR Chuyển Khoản Techcombank"
                    className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                    loading="lazy"
                  />
                </div>
                <span className="text-[11px] text-stone-600 font-medium text-center mt-2 flex items-center justify-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Quét bằng mọi ứng dụng ngân hàng</span>
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  Đã tự động điền STK, Số tiền &amp; Mã đơn
                </span>
              </div>

              <div className="sm:col-span-7 space-y-2 text-xs">
                {/* Số tài khoản */}
                <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 block font-medium">Số tài khoản nhận:</span>
                    <span className="font-mono text-sm sm:text-base font-black text-stone-900 tracking-wider">
                      {BANK_INFO.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(BANK_INFO.accountNumber, "account_success")}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-400 hover:text-stone-950 text-stone-700 text-[11px] font-bold border border-stone-200 flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {copiedField === "account_success" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Chủ tài khoản */}
                <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 block font-medium">Chủ tài khoản:</span>
                    <span className="font-black text-xs sm:text-sm text-stone-900 uppercase">
                      {BANK_INFO.accountHolder}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-semibold bg-stone-100 px-2 py-0.5 rounded-md">
                    Techcombank
                  </span>
                </div>

                {/* Số tiền thanh toán */}
                <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 block font-medium">Số tiền thanh toán:</span>
                    <span className="font-mono text-sm sm:text-base font-black text-amber-700">
                      {formatVndCurrency(finalTotalPrice)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(String(finalTotalPrice), "amount_success")}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-400 hover:text-stone-950 text-stone-700 text-[11px] font-bold border border-stone-200 flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {copiedField === "amount_success" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Cú pháp nội dung chuyển khoản */}
                <div className="p-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between gap-2 shadow-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] text-amber-800 block font-bold">
                      Nội dung chuyển khoản (Bắt buộc):
                    </span>
                    <span className="font-mono text-sm sm:text-base font-black text-amber-950 tracking-wide">
                      {successTransferDes}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(successTransferDes, "des_success")}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-black shadow-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {copiedField === "des_success" ? (
                      <>
                        <Check className="h-3 w-3 text-stone-950" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Nút cứu đơn: Đổi sang COD nếu khách không muốn quét QR nữa */}
                <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-500 font-medium">
                    Bạn muốn nhận hàng rồi mới trả tiền mặt?
                  </span>
                  <button
                    type="button"
                    onClick={handleSwitchToCod}
                    disabled={isSwitchingToCod}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Truck className="h-3.5 w-3.5 text-amber-600" />
                    <span>{isSwitchingToCod ? "Đang đổi..." : "Đổi Sang Nhận Hàng Trả Tiền (COD)"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            href={`/lookup?q=${encodeURIComponent(cleanPhone || createdOrderCode)}`}
            className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-amber-400 bg-amber-50 px-6 text-sm font-black text-amber-950 hover:bg-amber-100 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Search className="h-4 w-4 text-amber-700" />
            <span>Theo Dõi &amp; Tra Cứu Đơn Này</span>
          </Link>
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
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-stone-700 hover:text-amber-700 active:scale-95 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Trang Chủ</span>
            </Link>

            <Link
              href="/lookup"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold transition-all active:scale-95"
            >
              <Search className="h-3 w-3 text-amber-700" />
              <span>Tra Cứu Đơn</span>
            </Link>
          </div>

          <h1 className="text-sm sm:text-lg font-black text-stone-950">
            Đặt Mua Bộ Thẻ Thực Tế Ảo Poly Cards
          </h1>

          <div className="flex items-center gap-1.5 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300 text-[11px] font-black text-amber-950">
            <Truck className="h-3 w-3 text-amber-600" />
            <span>
              {shippingConfig.condition === "always_free"
                ? "Freeship Toàn Quốc"
                : shippingConfig.condition === "min_packs"
                ? `Freeship Từ ${shippingConfig.minPacksCount} Bộ`
                : "Ưu Đãi Vận Chuyển"}
            </span>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-amber-600" />
                      <span>Họ và tên người nhận <span className="text-rose-600">*</span></span>
                    </label>
                    {fieldErrors.fullName && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3" />
                        <span>Bắt buộc</span>
                      </span>
                    )}
                  </div>
                  <input
                    ref={fullNameInputRef}
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: false }));
                    }}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className={`w-full rounded-2xl border-2 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-hidden transition-all ${
                      fieldErrors.fullName
                        ? "border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-300/50 focus:border-rose-600 focus:bg-white"
                        : "border-stone-200 bg-stone-50 focus:border-amber-400 focus:bg-white"
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Vui lòng nhập họ và tên người nhận hàng</span>
                    </p>
                  )}
                </div>

                {/* SĐT & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-amber-600" />
                        <span>Số điện thoại <span className="text-rose-600">*</span></span>
                      </label>
                      {fieldErrors.phone && (
                        <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                          <AlertCircle className="h-3 w-3" />
                          <span>Bắt buộc</span>
                        </span>
                      )}
                    </div>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: false }));
                      }}
                      placeholder="Ví dụ: 0912 345 678"
                      className={`w-full rounded-2xl border-2 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-hidden transition-all ${
                        fieldErrors.phone
                          ? "border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-300/50 focus:border-rose-600 focus:bg-white"
                          : "border-stone-200 bg-stone-50 focus:border-amber-400 focus:bg-white"
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Vui lòng nhập số điện thoại hợp lệ (từ 9–11 số)</span>
                      </p>
                    )}
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-600" />
                      <span>Địa chỉ giao hàng chi tiết <span className="text-rose-600">*</span></span>
                    </label>
                    {fieldErrors.address && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3" />
                        <span>Bắt buộc</span>
                      </span>
                    )}
                  </div>
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: false }));
                    }}
                    placeholder="Số nhà, ngõ/đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                    className={`w-full rounded-2xl border-2 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-hidden transition-all ${
                      fieldErrors.address
                        ? "border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-300/50 focus:border-rose-600 focus:bg-white"
                        : "border-stone-200 bg-stone-50 focus:border-amber-400 focus:bg-white"
                    }`}
                  />
                  {fieldErrors.address && (
                    <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Vui lòng nhập địa chỉ nhận hàng chi tiết để bưu tá giao tận tay</span>
                    </p>
                  )}
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
              <div className="rounded-3xl border-2 border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-amber-600" />
                      <span>Phương Thức Thanh Toán</span>
                    </h2>
                    <p className="text-xs text-stone-500 font-medium">
                      Linh hoạt lựa chọn: Nhận hàng kiểm tra thanh toán (COD) hoặc Chuyển khoản bảo đảm qua QR.
                    </p>
                  </div>
                </div>

                {/* Grid 2 nút lựa chọn phương thức thanh toán */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`relative flex items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all cursor-pointer ${
                      paymentMethod === "cod"
                        ? "border-amber-400 bg-amber-50/70 text-stone-900 shadow-sm ring-2 ring-amber-300/40"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        paymentMethod === "cod"
                          ? "bg-amber-400 text-stone-950 shadow-xs"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs sm:text-sm font-black text-stone-900">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                      <span className="text-[11px] text-stone-500 font-medium leading-relaxed block">
                        Kiểm tra thẻ bài trước, thanh toán tiền mặt sau
                      </span>
                    </div>
                    <div className="shrink-0">
                      {paymentMethod === "cod" ? (
                        <CheckCircle2 className="h-5 w-5 text-amber-600 fill-amber-100" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-stone-300" />
                      )}
                    </div>
                  </button>

                  {/* Chuyển khoản QR */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("banking")}
                    className={`relative flex items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all cursor-pointer ${
                      paymentMethod === "banking"
                        ? "border-amber-400 bg-amber-50/70 text-stone-900 shadow-sm ring-2 ring-amber-300/40"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        paymentMethod === "banking"
                          ? "bg-amber-400 text-stone-950 shadow-xs"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="block text-xs sm:text-sm font-black text-stone-900">
                          Chuyển khoản QR ngân hàng
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded-md border border-amber-300/80">
                          Khuyên dùng
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500 font-medium leading-relaxed block">
                        Quét mã VietQR 24/7 tiện lợi, xác nhận đơn tức thì
                      </span>
                    </div>
                    <div className="shrink-0">
                      {paymentMethod === "banking" ? (
                        <CheckCircle2 className="h-5 w-5 text-amber-600 fill-amber-100" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-stone-300" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Hướng dẫn chuyển khoản QR khi khách chọn Banking (Ghi nhận đơn trước, quét QR ở màn hình hoàn tất) */}
                {paymentMethod === "banking" && (
                  <div className="rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 p-4 shadow-xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-[#E51937] text-white font-black text-[10px] flex items-center justify-center shadow-2xs tracking-wider">
                          TCB
                        </div>
                        <span className="text-xs font-black text-stone-900">
                          Chuyển khoản VietQR Techcombank (24/7)
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300">
                        Bảo đảm 100%
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-stone-600">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-stone-800">
                          Mã QR thanh toán chính thức sẽ hiển thị ngay sau khi bạn bấm{" "}
                          <strong className="text-amber-700">"Xác Nhận Đặt Mua &amp; Lấy Mã QR"</strong>.
                        </p>
                        <p className="text-[11px] text-stone-500">
                          • Hệ thống sẽ lưu thông tin đơn hàng và địa chỉ nhận hàng của bạn trước để đảm bảo đơn hàng không bị thất lạc.
                          <br />
                          • Mã QR ở bước tiếp theo sẽ tự động điền sẵn STK, Số Tiền và Mã Đơn Hàng của bạn chuẩn xác.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================= CỘT PHẢI (5 COLS): TỔNG QUAN HÓA ĐƠN TRÊN DESKTOP ================= */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
              <div className="rounded-3xl border-2 border-amber-300/90 bg-white p-5 sm:p-6 shadow-md space-y-4">
                {/* Tiêu đề & Badge số lượng */}
                <div className="border-b border-amber-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-stone-900">
                        Tóm Tắt Hóa Đơn ({totalPacksCount} Bộ)
                      </h3>
                      <span className="text-[11px] text-stone-500 font-medium block">
                        Đã chọn {selectedItems.length} sản phẩm
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {totalCardsCount} Thẻ AR
                  </span>
                </div>

                {/* Danh sách các bộ trong hóa đơn */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
                  {selectedItems.length === 0 ? (
                    <p className="text-stone-400 italic py-2">Chưa chọn bộ thẻ nào...</p>
                  ) : (
                    selectedItems.map(({ pack, quantity }, i) => {
                      const itemTotal = pack.price * quantity;
                      const origItemTotal = (pack.originalPrice || pack.price) * quantity;
                      const hasItemDiscount = pack.originalPrice && pack.originalPrice > pack.price;
                      const itemDiscountPct = hasItemDiscount
                        ? Math.round(((pack.originalPrice! - pack.price) / pack.originalPrice!) * 100)
                        : 0;

                      return (
                        <div key={i} className="flex justify-between items-start py-1.5 border-b border-stone-100 gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-stone-900 block truncate" title={pack.name}>
                              {pack.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                              <span>Số lượng: <strong className="text-stone-800 font-bold">{quantity}</strong></span>
                              <span>•</span>
                              <span>Đơn giá: <strong className="text-stone-800 font-mono font-bold">{formatVndCurrency(pack.price)}</strong></span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-stone-900 font-mono">
                              {formatVndCurrency(itemTotal)}
                            </div>
                            {hasItemDiscount && (
                              <div className="flex items-center justify-end gap-1 text-[10px] mt-0.5">
                                <span className="line-through text-stone-400 font-mono">
                                  {formatVndCurrency(origItemTotal)}
                                </span>
                                <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded-sm">
                                  -{itemDiscountPct}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bảng Kê Tính Tiền & Giảm Giá Minh Bạch */}
                <div className="rounded-2xl bg-stone-50/80 p-3.5 border border-stone-200/70 space-y-2 text-xs">
                  {/* Tạm tính giá gốc niêm yết */}
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Tạm tính (Giá gốc niêm yết):</span>
                    <span className="font-bold text-stone-900 font-mono">
                      {formatVndCurrency(originalTotalPrice)}
                    </span>
                  </div>

                  {/* Giảm giá trực tiếp theo bộ thẻ */}
                  {packDiscountTotal > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>Ưu đãi giảm giá bộ thẻ:</span>
                        {packDiscountPercent > 0 && (
                          <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-md">
                            -{packDiscountPercent}%
                          </span>
                        )}
                      </div>
                      <span className="font-bold font-mono">
                        -{formatVndCurrency(packDiscountTotal)}
                      </span>
                    </div>
                  )}

                  {/* Ưu đãi combo mua nhiều bộ */}
                  {comboDiscountTotal > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-medium pt-1 border-t border-stone-200/50">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span className="font-bold text-amber-900">{appliedComboRule?.name || "Ưu Đãi Combo"}:</span>
                        {appliedComboRule?.discountType === "percent" && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                            -{appliedComboRule.discountValue}%
                          </span>
                        )}
                      </div>
                      <span className="font-bold font-mono">
                        -{formatVndCurrency(comboDiscountTotal)}
                      </span>
                    </div>
                  )}

                  {/* Phí vận chuyển: Cấu hình linh hoạt từ MongoDB, Freeship hiển thị gọn gàng */}
                  <div className="flex justify-between items-center pt-1.5 border-t border-stone-200/50 text-xs">
                    <span className="text-stone-600 whitespace-nowrap">Phí vận chuyển:</span>
                    {shippingResult.isFree ? (
                      <span className="font-black text-emerald-800 font-mono bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] border border-emerald-300 uppercase tracking-wider">
                        {shippingResult.label}
                      </span>
                    ) : (
                      <span className="font-bold text-stone-900 font-mono">
                        +{formatVndCurrency(shippingFee)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hộp Gợi Ý Freeship Upsell (Thúc đẩy khách chọn thêm bộ thẻ để được miễn phí ship) */}
                {shippingResult.upsellPrompt && (
                  <div className="p-2.5 rounded-2xl bg-sky-50/90 border border-sky-200 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <Truck className="h-4 w-4 text-sky-600 shrink-0" />
                      <span className="text-[11px] font-bold text-sky-950 truncate sm:whitespace-normal">
                        {shippingResult.upsellPrompt}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSheetOpen(true)}
                      className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-black text-[10px] shrink-0 active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      + Thêm Bộ
                    </button>
                  </div>
                )}

                {/* Hộp Gợi Ý Combo Upsell (Không dùng emoji thô) */}
                {comboSuggestion && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-start gap-2.5 shadow-xs">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-950 leading-relaxed font-medium">
                      {comboSuggestion.message}
                    </div>
                  </div>
                )}

                {/* Khối Tổng Thanh Toán Cuối Cùng */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-orange-500/10 border-2 border-amber-300 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide block">
                        Tổng thanh toán:
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        (Đã gồm VAT &amp; {shippingResult.isFree ? shippingResult.reason : "Phí vận chuyển"})
                      </span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
                      {formatVndCurrency(finalTotalPrice)}
                    </span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                      <span>Tổng tiền tiết kiệm được:</span>
                      <span className="font-mono font-black text-emerald-700">
                        {formatVndCurrency(totalSavings)} {totalSavingsPercent > 0 ? `(-${totalSavingsPercent}%)` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nút đặt mua trên Desktop */}
                <div className="hidden lg:block pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedItems.length === 0}
                    className="btn-toy-3d flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 text-sm font-black text-stone-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer hover:brightness-105 disabled:opacity-50"
                  >
                    {paymentMethod === "banking" ? (
                      <>
                        <QrCode className="h-5 w-5" />
                        <span>{isSubmitting ? "Đang Khởi Tạo Đơn Hàng..." : "Xác Nhận Đặt Mua & Lấy Mã QR"}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        <span>{isSubmitting ? "Đang Gửi Đơn Hàng..." : "Xác Nhận Đặt Mua Ngay"}</span>
                      </>
                    )}
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
                className="btn-toy-3d flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 sm:px-8 text-xs sm:text-sm font-black text-stone-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer hover:brightness-105 disabled:opacity-50"
              >
                {paymentMethod === "banking" ? (
                  <>
                    <QrCode className="h-4 w-4" />
                    <span>{isSubmitting ? "Đang Tạo Đơn..." : "Xác Nhận & Lấy Mã QR"}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>{isSubmitting ? "Đang Gửi..." : "Xác Nhận Đặt Mua"}</span>
                  </>
                )}
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
