"use client";

import React from "react";
import Link from "next/link";
import { Lock, Unlock, KeyRound, Sparkles } from "lucide-react";

interface AuthModalProps {
  passcode: string;
  authError: string | null;
  isAuthenticating: boolean;
  onChangePasscode: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AuthModal({
  passcode,
  authError,
  isAuthenticating,
  onChangePasscode,
  onSubmit,
}: AuthModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border-2 border-amber-400/40 bg-stone-900 p-6 sm:p-8 text-white shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-amber-300">
            Khu Vực Tác Giả & Chế Bản Poly Cards
          </h2>
          <p className="text-xs text-stone-400">
            Vui lòng nhập mã bảo mật tác giả (PIN) để mở khóa công cụ tạo mã QR và xuất file in ấn.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5">
              Mã PIN Bảo Mật:
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="password"
                maxLength={20}
                placeholder="Nhập mã PIN tác giả..."
                value={passcode}
                onChange={(e) => onChangePasscode(e.target.value)}
                autoFocus
                className="w-full bg-black/60 border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
              />
            </div>
            {authError && (
              <p className="text-[11px] font-bold text-rose-400 mt-1.5 animate-in fade-in">
                {authError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isAuthenticating || !passcode.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm shadow-lg shadow-amber-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Unlock className="h-4 w-4 text-stone-950" />
            <span>{isAuthenticating ? "Đang Xác Thực..." : "Mở Khóa Studio"}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/10">
          <Link
            href="/"
            className="text-xs font-semibold text-stone-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
          >
            <span>Quay lại trang chủ Poly Cards</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
