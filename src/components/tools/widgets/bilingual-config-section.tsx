"use client";

import React from "react";
import { Sparkles, Languages } from "lucide-react";
import { BilingualVocabField } from "./bilingual-vocab-field";

export interface BilingualConfigData {
  enableEnVi?: boolean;
  nameEn: string;
  nameVi: string;
  ipa?: string;
  enableZhVi?: boolean;
  nameZh?: string;
  pinyinZh?: string;
}

interface BilingualConfigSectionProps {
  data: BilingualConfigData;
  onChange: (updates: Partial<BilingualConfigData>) => void;
  onAutoTranslate: (text: string, sourceLang: "en" | "vi" | "zh") => void;
  isTranslating?: boolean;
}

/**
 * Khối cấu hình Song Ngữ (Anh - Việt EN-VI và Trung - Việt ZH-VI)
 * Đã tách thành Widget độc lập theo chuẩn Clean Architecture & DRY.
 */
export function BilingualConfigSection({
  data,
  onChange,
  onAutoTranslate,
  isTranslating = false,
}: BilingualConfigSectionProps) {
  const showEn = data.enableEnVi !== false;
  const showZh = Boolean(data.enableZhVi);

  return (
    <div className="space-y-4">
      {/* 1. KHỐI SONG NGỮ ANH - VIỆT (EN - VI) */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-amber-400" />
            <div>
              <span className="text-xs font-black text-amber-300">
                Song Ngữ Anh – Việt (EN – VI)
              </span>
              <p className="text-[10px] text-stone-400 hidden sm:block">
                Hiển thị phát âm từ vựng Tiếng Anh & Tiếng Việt trên WebAR
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange({ enableEnVi: !showEn })}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              showEn ? "bg-amber-500" : "bg-stone-700"
            }`}
            title="Bật / Tắt chế độ song ngữ Anh - Việt"
          >
            <div
              className={`bg-stone-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                showEn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {showEn && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-400/20 animate-in fade-in duration-150">
            <BilingualVocabField
              label="1. Từ vựng Tiếng Anh (EN) *:"
              labelColorClass="text-amber-200"
              value={data.nameEn || ""}
              onChange={(nameEn) => onChange({ nameEn })}
              placeholder="VD: Train, Airplane, Lion..."
              required={showEn}
              onAutoTranslate={() => onAutoTranslate(data.nameEn || "", "en")}
              isTranslating={isTranslating}
              tooltip="Tự động dịch sang Tiếng Việt, Tiếng Trung & sinh IPA/Pinyin"
            />

            <BilingualVocabField
              label="2. Từ Tiếng Việt (VI) *:"
              labelColorClass="text-emerald-300"
              value={data.nameVi || ""}
              onChange={(nameVi) => onChange({ nameVi })}
              placeholder="VD: Tàu hỏa, Máy bay, Sư tử..."
              required
              onAutoTranslate={() => onAutoTranslate(data.nameVi || "", "vi")}
              isTranslating={isTranslating}
              tooltip="Tự động dịch sang Tiếng Anh, Tiếng Trung & sinh IPA/Pinyin"
            />

            <BilingualVocabField
              label="3. Phiên âm (IPA):"
              labelColorClass="text-stone-300"
              value={data.ipa || ""}
              onChange={(ipa) => onChange({ ipa })}
              placeholder="VD: treɪn, ˈeər.pleɪn..."
            />
          </div>
        )}
      </div>

      {/* 2. KHỐI SONG NGỮ TRUNG - VIỆT (ZH - VI) */}
      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-400/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-rose-400" />
            <div>
              <span className="text-xs font-black text-rose-300">
                Song Ngữ Trung – Việt (ZH – VI)
              </span>
              <p className="text-[10px] text-stone-400 hidden sm:block">
                Hiển thị phát âm Tiếng Trung (chữ Hán + Pinyin) & Tiếng Việt trên WebAR
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange({ enableZhVi: !showZh })}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              showZh ? "bg-rose-500" : "bg-stone-700"
            }`}
            title="Bật / Tắt chế độ song ngữ Trung - Việt"
          >
            <div
              className={`bg-stone-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                showZh ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {showZh && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-rose-400/20 animate-in fade-in duration-150">
            <BilingualVocabField
              label="1. Từ vựng Tiếng Trung (ZH) *:"
              labelColorClass="text-rose-300"
              value={data.nameZh || ""}
              onChange={(nameZh) => onChange({ nameZh })}
              placeholder="Chữ Hán: 火车, 飞机, 汽车..."
              required={showZh}
              onAutoTranslate={() => onAutoTranslate(data.nameZh || "", "zh")}
              isTranslating={isTranslating}
              fontFamily='"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif'
              tooltip="Tự động dịch sang Tiếng Việt, Tiếng Anh & sinh Pinyin"
            />

            <BilingualVocabField
              label="2. Từ Tiếng Việt (VI) *:"
              labelColorClass="text-emerald-300"
              value={data.nameVi || ""}
              onChange={(nameVi) => onChange({ nameVi })}
              placeholder="VD: Tàu hỏa, Máy bay..."
              required
              onAutoTranslate={() => onAutoTranslate(data.nameVi || "", "vi")}
              isTranslating={isTranslating}
              tooltip="Tự động dịch sang Tiếng Trung, Tiếng Anh & sinh Pinyin"
            />

            <BilingualVocabField
              label="3. Phiên âm (Pinyin):"
              labelColorClass="text-stone-300"
              value={data.pinyinZh || ""}
              onChange={(pinyinZh) => onChange({ pinyinZh })}
              placeholder="VD: huǒ chē, fēi jī, qì chē..."
              fontFamily='"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif'
            />
          </div>
        )}
      </div>
    </div>
  );
}
