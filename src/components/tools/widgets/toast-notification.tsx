"use client";

import React from "react";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { ToastItem } from "../types";

interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-2xl shadow-xl border text-xs font-bold transition-all animate-in slide-in-from-bottom-2 ${
            toast.type === "success"
              ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-200"
              : toast.type === "error"
              ? "bg-rose-950/95 border-rose-500/40 text-rose-200"
              : toast.type === "warning"
              ? "bg-amber-950/95 border-amber-500/40 text-amber-200"
              : "bg-stone-900/95 border-white/20 text-stone-200"
          }`}
          onClick={() => onDismiss(toast.id)}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : toast.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          ) : toast.type === "warning" ? (
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <HelpCircle className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-relaxed">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
