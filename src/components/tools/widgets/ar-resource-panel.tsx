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
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Helper upload tệp qua API /api/tools/upload (Hỗ trợ Chunked Upload 2MB/mảnh để vượt giới hạn 4.5MB của Vercel)
  const handleUploadFile = async (
    file: File,
    type: "model" | "target" | "audio"
  ) => {
    try {
      setIsUploading(true);
      setUploadProgress(5);

      const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB / mảnh (an toàn tuyệt đối dưới ngưỡng 4.5MB của Vercel)
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
      const uploadId = `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      let finalUrl = "";

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunkBlob = file.slice(start, end, file.type || "application/octet-stream");

        const fd = new FormData();
        fd.append("file", chunkBlob, file.name);
        fd.append("originalFileName", file.name);
        fd.append("type", type);
        fd.append("name", slug || "asset");
        fd.append("uploadId", uploadId);
        fd.append("chunkIndex", String(chunkIndex));
        fd.append("totalChunks", String(totalChunks));
        fd.append("totalSize", String(file.size));

        const res = await fetch("/api/tools/upload", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          let errText = `HTTP ${res.status}`;
          try {
            const errJson = await res.json();
            if (errJson?.message) errText = errJson.message;
          } catch {}
          throw new Error(errText);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Tải lên thất bại");
        }

        setUploadProgress(Math.round(((chunkIndex + 1) / totalChunks) * 100));

        if (data.url) {
          finalUrl = data.url;
        }
      }

      const isUsdz = file.name.toLowerCase().endsWith(".usdz");

      if (type === "model") {
        if (isUsdz) {
          onChangeIosModelUrl(finalUrl);
        } else {
          onChangeModelUrl(finalUrl);
        }
      } else if (type === "target") {
        onChangeTargetUrl(finalUrl);
      } else if (type === "audio") {
        onChangeAudioUrl(finalUrl);
      }

      onShowToast(
        `Đã tải lên tệp "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) lên MongoDB GridFS thành công!`,
        "success"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      onShowToast(`Lỗi tải tệp: ${msg}`, "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper upload đồng thời cả 2 tệp model 3D (.glb và .usdz)
  const handleUploadModels = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await handleUploadFile(file, "model");
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1 border-b border-white/5">
          <div>
            <span className="text-[11px] font-bold text-stone-200 flex items-center gap-1.5">
              <FileUp className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Tải Lên Tệp 3D Riêng (.glb / .usdz)</span>
            </span>
            <p className="text-[9px] text-stone-400">
              Có thể chọn tải cùng lúc cả 2 file (.glb và .usdz) hoặc tải riêng từng định dạng bên dưới.
            </p>
          </div>

          <label className="cursor-pointer inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 font-black text-[10px] hover:bg-amber-300 active:scale-95 transition-all shrink-0 shadow-md">
            <Upload className="h-3 w-3 shrink-0" />
            <span>
              {isUploading
                ? `Đang Tải (${uploadProgress}%)...`
                : "Chọn Cả 2 File (.glb & .usdz)"}
            </span>
            <input
              type="file"
              multiple
              accept=".glb,.gltf,.usdz"
              disabled={isUploading}
              className="hidden"
              onChange={(e) => handleUploadModels(e.target.files)}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
          {/* Cột 1: Model WebAR .glb */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-300 font-bold block">Model WebAR / Android (.glb):</span>
              <label className="cursor-pointer text-[9px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10">
                <Upload className="h-2.5 w-2.5" />
                <span>Tải .glb</span>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  disabled={isUploading}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file, "model");
                  }}
                />
              </label>
            </div>
            <input
              type="text"
              value={modelUrl}
              onChange={(e) => onChangeModelUrl(e.target.value)}
              placeholder="/models/lion.glb"
              className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-mono text-amber-300 focus:outline-hidden focus:border-amber-400"
            />
            <span className="text-[9px] text-stone-500 block">Dành cho Android, Chrome, Cốc Cốc, PC.</span>
          </div>

          {/* Cột 2: Model iOS .usdz */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-300 font-bold block">Model Apple iOS (.usdz):</span>
              <label className="cursor-pointer text-[9px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10">
                <Upload className="h-2.5 w-2.5" />
                <span>Tải .usdz</span>
                <input
                  type="file"
                  accept=".usdz"
                  disabled={isUploading}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file, "model");
                  }}
                />
              </label>
            </div>
            <input
              type="text"
              value={iosModelUrl}
              onChange={(e) => onChangeIosModelUrl(e.target.value)}
              placeholder="/models/lion.usdz"
              className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-mono text-stone-300 focus:outline-hidden focus:border-amber-400"
            />
            <span className="text-[9px] text-stone-500 block">Dành riêng cho iPhone / iPad (Safari Quick Look).</span>
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
          <div className="pt-0.5 flex flex-col gap-0.5 text-[9px]">
            <a
              href="https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold underline transition-colors"
              title="Mở công cụ MindAR Compiler trực tuyến để tạo file .mind từ ảnh thẻ"
            >
              <span>Tạo file .mind online tại đây</span>
              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
            </a>
            <p className="text-stone-400">
              Kéo ảnh thẻ vào link trên để tải về file .mind, sau đó nhấn nút &quot;Tải .mind&quot; ở trên.
            </p>
          </div>
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
            Web Speech AI tự động phát âm chuẩn bản xứ EN/VI/ZH nếu không tải file riêng.
          </p>
        </div>
      </div>
    </div>
  );
}
