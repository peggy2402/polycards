"use client";

import React, { useState } from "react";
import {
  Box,
  FileUp,
  Upload,
  Volume2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { PRESET_3D_MODELS } from "../constants";

interface ArResourcePanelProps {
  slug: string;
  modelUrl: string;
  iosModelUrl: string;
  targetUrl: string;
  audioUrl: string;
  onChangeModelUrl: (url: string) => void;
  onChangeIosModelUrl: (url: string) => void;
  onChangeTargetUrl: (url: string) => void;
  onChangeAudioUrl: (url: string) => void;
  onSelectPreset?: (preset: typeof PRESET_3D_MODELS[0]) => void;
  onShowToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export function ArResourcePanel({
  slug,
  modelUrl,
  iosModelUrl,
  targetUrl,
  audioUrl,
  onChangeModelUrl,
  onChangeIosModelUrl,
  onChangeTargetUrl,
  onChangeAudioUrl,
  onSelectPreset,
  onShowToast,
}: ArResourcePanelProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Helper upload tệp qua API /api/tools/upload
  const handleUploadFile = async (
    file: File,
    type: "model" | "target" | "audio"
  ) => {
    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      fd.append("name", slug || "asset");

      const res = await fetch("/api/tools/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Tải lên thất bại");
      }

      const uploadedUrl = data.url;
      const isUsdz = file.name.toLowerCase().endsWith(".usdz");

      if (type === "model") {
        if (isUsdz) {
          onChangeIosModelUrl(uploadedUrl);
        } else {
          onChangeModelUrl(uploadedUrl);
        }
      } else if (type === "target") {
        onChangeTargetUrl(uploadedUrl);
      } else if (type === "audio") {
        onChangeAudioUrl(uploadedUrl);
      }

      onShowToast(`Đã tải lên tệp "${file.name}" thành công!`, "success");
    } catch (err: any) {
      onShowToast(`Lỗi tải tệp: ${err.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border border-amber-500/30 rounded-2xl overflow-hidden bg-black/40 p-3 sm:p-3.5 space-y-3">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center shrink-0">
            <Box className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-300">
              Tài Nguyên Mô Hình 3D & WebAR
            </h4>
            <p className="text-[10px] text-stone-400">
              Chọn mô hình có sẵn hoặc tải tệp .glb, .usdz, .mind, .mp3 từ máy tính
            </p>
          </div>
        </div>

        <a
          href={`/ar/${slug}?ar=1`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 hover:bg-emerald-600/50 transition-colors shrink-0"
        >
          <span>Test WebAR</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* 1. Chọn nhanh từ Mẫu 3D có sẵn */}
      <div>
        <label className="block text-[11px] font-bold text-stone-300 mb-1.5">
          Chọn nhanh từ Mô hình 3D mẫu có sẵn:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESET_3D_MODELS.map((preset) => {
            const isSelected = modelUrl === preset.modelUrl;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (onSelectPreset) {
                    onSelectPreset(preset);
                  } else {
                    onChangeModelUrl(preset.modelUrl);
                    onChangeIosModelUrl(preset.iosModelUrl);
                    onChangeTargetUrl(preset.targetUrl);
                  }
                }}
                className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/50"
                    : "bg-black/50 border-white/10 text-stone-300 hover:border-white/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-black truncate">{preset.name}</span>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                </div>
                <span className="text-[9px] text-stone-400 font-mono mt-0.5 truncate w-full">
                  {preset.modelUrl}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Upload tệp 3D riêng (.glb, .usdz) */}
      <div className="p-2.5 rounded-xl bg-stone-950/70 border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-200 flex items-center gap-1.5">
            <FileUp className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Tải Lên Tệp 3D Riêng (.glb / .usdz)</span>
          </span>
          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-stone-950 font-black text-[10px] hover:bg-amber-300 active:scale-95 transition-all shrink-0">
            <Upload className="h-3 w-3 shrink-0" />
            <span>{isUploading ? "Đang Tải..." : "Chọn File 3D"}</span>
            <input
              type="file"
              accept=".glb,.gltf,.usdz"
              disabled={isUploading}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadFile(file, "model");
              }}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-stone-400 block mb-0.5">Model WebAR (.glb):</span>
            <input
              type="text"
              value={modelUrl}
              onChange={(e) => onChangeModelUrl(e.target.value)}
              placeholder="/models/lion.glb"
              className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-mono text-amber-300 focus:outline-hidden focus:border-amber-400"
            />
          </div>
          <div>
            <span className="text-stone-400 block mb-0.5">Model Apple iOS (.usdz):</span>
            <input
              type="text"
              value={iosModelUrl}
              onChange={(e) => onChangeIosModelUrl(e.target.value)}
              placeholder="/models/lion.usdz"
              className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-mono text-stone-300 focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* 3. Tệp Target MindAR (.mind) & Âm Thanh (.mp3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Target .mind */}
        <div className="p-2.5 rounded-xl bg-stone-950/70 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-300">Target Marker (.mind):</span>
            <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[9px] border border-white/10 transition-colors shrink-0">
              <Upload className="h-2.5 w-2.5 shrink-0" />
              <span>Tải .mind</span>
              <input
                type="file"
                accept=".mind"
                disabled={isUploading}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFile(file, "target");
                }}
              />
            </label>
          </div>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => onChangeTargetUrl(e.target.value)}
            placeholder="/targets/lion.mind (Fallback tự động nếu trống)"
            className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-[10px] font-mono text-amber-300 focus:outline-hidden focus:border-amber-400"
          />
          <p className="text-[9px] text-stone-400">
            Nếu để trống, WebAR tự động dùng AR Không Gian Tự Do.
          </p>
        </div>

        {/* Âm thanh .mp3 */}
        <div className="p-2.5 rounded-xl bg-stone-950/70 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-300 flex items-center gap-1">
              <Volume2 className="h-3 w-3 text-amber-400 shrink-0" />
              <span>Âm Thanh (.mp3):</span>
            </span>
            <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[9px] border border-white/10 transition-colors shrink-0">
              <Upload className="h-2.5 w-2.5 shrink-0" />
              <span>Tải .mp3</span>
              <input
                type="file"
                accept=".mp3,.wav,.ogg"
                disabled={isUploading}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFile(file, "audio");
                }}
              />
            </label>
          </div>
          <input
            type="text"
            value={audioUrl}
            onChange={(e) => onChangeAudioUrl(e.target.value)}
            placeholder="Mặc định dùng AI Web Speech EN/VI/ZH"
            className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-[10px] font-mono text-stone-300 focus:outline-hidden focus:border-amber-400"
          />
          <p className="text-[9px] text-stone-400">
            Web Speech AI tự động phát âm chuẩn bản xứ EN/VI/ZH.
          </p>
        </div>
      </div>
    </div>
  );
}
