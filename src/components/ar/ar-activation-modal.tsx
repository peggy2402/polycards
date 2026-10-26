"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Animal } from "@/types/animal";
import { activateWithCode } from "@/lib/activation";
import {
  X,
  Sparkles,
  KeyRound,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Gift,
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

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg("Vui lòng nhập mã kích hoạt trên thẻ bản quyền.");
      return;
    }

    const result = activateWithCode(code);
    if (result.success) {
      setSuccessMsg(result.message);
      setErrorMsg(null);
      setTimeout(() => {
        onActivated();
        onClose();
      }, 1500);
    } else {
      setErrorMsg(result.message);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-amber-300/80 bg-white shadow-2xl">
        {/* Header với dải màu ấm áp */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-5 text-stone-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-950 text-amber-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-950/80">
                  Poly Cards AR Bản Quyền
                </span>
                <h3 className="text-lg font-black leading-tight text-stone-950">
                  Mở Khóa {animal.nameVi} ({animal.nameEn})
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-stone-950 hover:bg-black/30 active:scale-90 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nội dung chính */}
        <div className="p-6 space-y-4">
          {tab === "options" ? (
            <>
              <p className="text-xs text-stone-600 leading-relaxed">
                Công nghệ Camera AR tương tác 3 ngôn ngữ (Anh - Việt - Trung) và nhận diện thẻ bài 3D là tính năng đặc biệt đi kèm cùng <strong>Bộ thẻ bài vật lý Poly Cards</strong>.
              </p>

              {/* Lựa chọn 1: Trải nghiệm thử 30s */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartTrial();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 transition-all active:scale-98 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-stone-950 font-black shadow-xs">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-stone-900 group-hover:text-amber-800">
                      Trải Nghiệm Thử 30 Giây
                    </h4>
                    <span className="text-[11px] text-stone-500">
                      Dùng thử camera AR trực tiếp trên màn hình
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Lựa chọn 2: Đặt mua trọn bộ thẻ */}
              <Link
                href={`/order?animal=${animal.slug}`}
                onClick={onClose}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 transition-all active:scale-98 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black shadow-xs">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-stone-900 group-hover:text-emerald-800">
                        Đặt Mua Bộ Thẻ Bài AR
                      </h4>
                      <span className="rounded-full bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2">
                        Ưu đãi
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Bộ 30+ thẻ bài cứng cao cấp, bảo hành học tập
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Lựa chọn 3: Đã có thẻ bài -> Nhập mã kích hoạt */}
              <button
                type="button"
                onClick={() => setTab("enter_code")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-all active:scale-98 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-amber-300 font-black shadow-xs">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-stone-900">
                      Tôi Đã Mua Thẻ Bài
                    </h4>
                    <span className="text-[11px] text-stone-500">
                      Nhập mã bản quyền đi kèm trong hộp thẻ
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          ) : (
            /* Tab: Nhập mã kích hoạt */
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Mã Bản Quyền Trên Thẻ VIP Poly Cards:
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Ví dụ: POLY-VIP hoặc POLY-2026"
                  className="w-full rounded-2xl border-2 border-amber-300 px-4 py-3 text-sm font-mono font-bold tracking-wider text-stone-900 uppercase focus:border-amber-500 focus:outline-hidden"
                  autoFocus
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  (Mẹo: Bạn có thể nhập mã dùng thử: <strong>POLYCARDS</strong> hoặc <strong>POLY-VIP</strong>)
                </span>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTab("options")}
                  className="flex-1 min-h-[44px] rounded-2xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100 active:scale-95 transition-all"
                >
                  Quay Lại
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] rounded-2xl bg-amber-500 text-xs font-black text-stone-950 hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/20"
                >
                  Kích Hoạt Ngay
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
