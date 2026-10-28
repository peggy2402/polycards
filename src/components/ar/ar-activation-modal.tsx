"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Animal } from "@/types/animal";
import { activateWithCodeAsync, normalizeCategorySlug } from "@/lib/activation";
import {
  X,
  Sparkles,
  KeyRound,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ArActivationModalProps {
  animal: Animal;
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
  onActivated: () => void;
}

export function ArActivationModal({
  animal,
  isOpen,
  onClose,
  onStartTrial,
  onActivated,
}: ArActivationModalProps) {
  const [tab, setTab] = useState<"options" | "enter_code">("options");
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Khóa cuộn trang khi modal mở - Chuẩn iOS Safari không bị nhảy background
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevPosition = document.body.style.position;
      const prevWidth = document.body.style.width;

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";

      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.position = prevPosition;
        document.body.style.width = prevWidth;
      };
    } else {
      setTab("options");
      setCode("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg("Vui lòng nhập mã hóa đơn / mã bộ trên hộp thẻ Poly Cards.");
      return;
    }

    try {
      setIsActivating(true);
      setErrorMsg(null);
      const currentCatSlug = normalizeCategorySlug(animal.categorySlug || animal.category);
      const result = await activateWithCodeAsync(code, currentCatSlug);
      if (result.success) {
        setSuccessMsg(result.message);
        setErrorMsg(null);
        setTimeout(() => {
          onActivated();
          onClose();
        }, 1200);
      } else {
        setErrorMsg(result.message);
      }
    } finally {
      setIsActivating(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4 overflow-y-auto overflow-x-hidden w-full max-w-[100vw]"
      style={{ width: "100vw", maxWidth: "100vw" }}
      onClick={onClose}
    >
      {/* Container: Chuẩn Mobile Bottom Sheet (<640px) và Centered Modal (>=640px) - Chống tràn ngang tuyệt đối */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-full sm:max-w-md max-h-[90dvh] sm:max-h-[88vh] overflow-x-hidden rounded-t-[32px] sm:rounded-3xl border-t-2 sm:border-2 border-amber-300/90 bg-white shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 box-border"
        style={{ maxWidth: "100vw" }}
      >
        {/* Grab handle nhỏ nhắn trên Mobile */}
        <div className="w-12 h-1.5 rounded-full bg-stone-900/20 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header: Responsive chuẩn 360px+, không bị va chạm nút đóng, Touch Target >= 44px */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3.5 sm:px-6 py-3.5 text-stone-950 shrink-0 overflow-hidden w-full">
          <div className="flex items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-amber-400 shadow-md">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/15 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-stone-950 truncate max-w-full">
                  <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                  <span className="truncate">Poly Cards AR Bản Quyền</span>
                </span>
                <h3 className="text-sm sm:text-base font-black leading-tight text-stone-950 truncate mt-0.5">
                  Mở Khóa {animal.nameVi} ({animal.nameEn})
                </h3>
              </div>
            </div>

            {/* Nút đóng Touch Target 44x44px chuẩn W3C & Mobile-First */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-950/20 text-stone-950 hover:bg-stone-950/30 active:scale-90 transition-all cursor-pointer"
              title="Đóng cửa sổ"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Nội dung có thanh cuộn mượt mà khi mở bàn phím điện thoại */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-3.5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] w-full">
          {tab === "options" ? (
            <>
              <p className="text-xs text-stone-600 leading-relaxed">
                Công nghệ Camera AR tương tác 3 ngôn ngữ (Anh - Việt - Trung) và con vật 3D đồng hành là tính năng cao cấp dành riêng cho khách hàng sở hữu <strong>Bộ thẻ bài vật lý Poly Cards</strong>.
              </p>

              {/* Lựa chọn 1: Trải nghiệm thử 30 giây */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartTrial();
                }}
                className="w-full min-h-[58px] flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border-2 border-amber-300 bg-amber-50/80 hover:bg-amber-100/80 transition-all active:scale-98 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-1.5">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-stone-950 font-black shadow-xs">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-stone-900 group-hover:text-amber-900 truncate">
                      Trải Nghiệm Thử 30 Giây
                    </h4>
                    <span className="text-[10px] sm:text-[11px] text-stone-500 truncate block">
                      Dùng thử camera AR trực tiếp trên màn hình
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-amber-600 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Lựa chọn 2: Đặt mua trọn bộ thẻ */}
              <Link
                href={`/order?animal=${animal.slug}`}
                onClick={onClose}
                className="w-full min-h-[58px] flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border-2 border-emerald-400 bg-emerald-50/80 hover:bg-emerald-100/80 transition-all active:scale-98 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-1.5">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black shadow-xs">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-black text-stone-900 group-hover:text-emerald-900 truncate">
                        Đặt Mua Bộ Thẻ Bài AR
                      </h4>
                      <span className="rounded-full bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 shrink-0">
                        Ưu đãi
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-stone-500 truncate block">
                      Bộ 30+ thẻ bài cứng cao cấp, bảo hành học tập
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Lựa chọn 3: Đã có thẻ bài -> Nhập mã kích hoạt */}
              <button
                type="button"
                onClick={() => setTab("enter_code")}
                className="w-full min-h-[58px] flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border-2 border-stone-200 bg-stone-50/90 hover:bg-stone-100 transition-all active:scale-98 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-1.5">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-amber-300 font-black shadow-xs">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-stone-900 group-hover:text-stone-950 truncate">
                      Tôi Đã Mua Thẻ Bài
                    </h4>
                    <span className="text-[10px] sm:text-[11px] text-stone-500 truncate block">
                      Nhập mã VIP đi kèm bên trong hộp thẻ
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-stone-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          ) : (
            /* Tab: Nhập mã kích hoạt */
            <form onSubmit={handleActivate} className="space-y-4 w-full min-w-0">
              <div className="w-full min-w-0">
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Mã Bản Quyền Trên Thẻ VIP Poly Cards:
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Nhập mã của bạn"
                  className="w-full max-w-full box-border min-h-[48px] rounded-2xl border-2 border-amber-300 px-4 py-2.5 text-base sm:text-sm font-mono font-bold tracking-normal text-stone-900 uppercase focus:border-amber-500 focus:outline-hidden bg-white"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setTab("options");
                  }}
                  className="flex-1 min-h-[48px] rounded-2xl border-2 border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
                >
                  Quay Lại
                </button>
                <button
                  type="submit"
                  disabled={isActivating}
                  className="flex-1 min-h-[48px] rounded-2xl bg-amber-500 text-xs font-black text-stone-950 hover:bg-amber-600 disabled:opacity-60 active:scale-95 transition-all shadow-md shadow-amber-500/25 cursor-pointer"
                >
                  {isActivating ? "Đang Kiểm Tra Mã..." : "Kích Hoạt Ngay"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
