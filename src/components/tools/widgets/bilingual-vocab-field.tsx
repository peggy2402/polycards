"use client";

import React from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface BilingualVocabFieldProps {
  label: string;
  labelColorClass?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  onAutoTranslate?: () => void;
  isTranslating?: boolean;
  fontFamily?: string;
  tooltip?: string;
}

/**
 * Ô nhập từ vựng chuẩn Poly Cards với nút "Tự sinh" nằm gọn gàng bên trong ô input (bên phải),
 * đảm bảo 100% độ cao của các ô input trong cùng một hàng luôn bằng nhau và thẳng tắp.
 */
export function BilingualVocabField({
  label,
  labelColorClass = "text-stone-300",
  value,
  onChange,
  placeholder,
  required = false,
  onAutoTranslate,
  isTranslating = false,
  fontFamily,
  tooltip,
}: BilingualVocabFieldProps) {
  return (
    <div className="space-y-1.5 flex-1 min-w-0">
      <label className={`block text-[11px] font-bold tracking-tight truncate ${labelColorClass}`}>
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onAutoTranslate) {
              e.preventDefault();
              onAutoTranslate();
            }
          }}
          placeholder={placeholder}
          style={fontFamily ? { fontFamily } : undefined}
          className={`w-full bg-black/80 border border-white/15 focus:border-amber-400 rounded-xl py-2 pl-3 text-xs text-white placeholder-stone-600 focus:outline-hidden transition-colors font-medium shadow-inner ${
            onAutoTranslate ? "pr-22" : "pr-3"
          }`}
        />

        {onAutoTranslate && (
          <button
            type="button"
            onClick={onAutoTranslate}
            disabled={isTranslating || !value.trim()}
            title={tooltip || "Bấm để tự động dịch và sinh phiên âm ngữ cảnh"}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-400/40 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-amber-500/20 disabled:hover:text-amber-300 cursor-pointer shadow-xs shrink-0"
          >
            {isTranslating ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin shrink-0 text-amber-300" />
                <span className="hidden sm:inline">Đang dịch</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 shrink-0 text-amber-300 group-hover:text-stone-950" />
                <span>Tự sinh</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
