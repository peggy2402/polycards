"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { ConfirmState } from "../types";

interface ConfirmModalProps {
  confirmState: ConfirmState | null;
  onCancel: () => void;
}

export function ConfirmModal({ confirmState, onCancel }: ConfirmModalProps) {
  if (!confirmState) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="max-w-md w-full bg-stone-900 border-2 border-amber-400/50 rounded-3xl p-5 text-white shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
              confirmState.danger
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">{confirmState.title}</h3>
            <p className="text-xs text-stone-400 mt-0.5">{confirmState.message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-stone-300 transition-colors"
          >
            {confirmState.cancelText || "Hủy Bỏ"}
          </button>
          <button
            type="button"
            onClick={() => {
              confirmState.onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              confirmState.danger
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                : "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg shadow-amber-500/30"
            }`}
          >
            {confirmState.confirmText || "Xác Nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
