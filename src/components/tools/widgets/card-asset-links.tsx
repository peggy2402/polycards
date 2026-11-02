"use client";

import React from "react";
import {
  Image as ImageIcon,
  FileImage,
  Box,
  ScanLine,
  QrCode,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Animal } from "@/types/animal";

interface CardAssetLinksProps {
  card: Animal;
  layout?: "compact" | "expanded"; // compact cho Card Grid, expanded cho Table/List
}

function getFileName(url?: string): string {
  if (!url) return "";
  try {
    const clean = url.split("?")[0].split("#")[0];
    const parts = clean.split("/");
    const last = parts[parts.length - 1];
    return last ? decodeURIComponent(last) : "";
  } catch {
    return "";
  }
}

export function CardAssetLinks({ card, layout = "compact" }: CardAssetLinksProps) {
  const rawFileName = getFileName(card.rawImageUrl);
  const cardFileName = getFileName(card.images?.[0]);
  const modelFileName = getFileName(card.modelUrl);
  const targetFileName = getFileName(card.targetUrl);
  const iosFileName = getFileName(card.iosModelUrl);

  const qrUrl = `/ar/${card.slug}?ar=1${card.packCode ? `&code=${encodeURIComponent(card.packCode)}` : ""}`;

  // 1. Phôi ảnh thô (Raw Image)
  const rawItem = card.rawImageUrl
    ? {
        label: "raw",
        fileName: rawFileName || "raw.jpg",
        url: card.rawImageUrl,
        icon: ImageIcon,
        borderStyle:
          "border-purple-500/30 text-purple-300 bg-purple-500/10 hover:border-purple-400 hover:text-purple-200 hover:bg-purple-500/25 hover:shadow-[0_0_8px_rgba(168,85,247,0.35)]",
      }
    : null;

  // 2. Ảnh thẻ thành phẩm (Card Image đã ghép QR)
  const cardItem = card.images?.[0]
    ? {
        label: "card",
        fileName: cardFileName || "card.png",
        url: card.images[0],
        icon: FileImage,
        borderStyle:
          "border-sky-500/30 text-sky-300 bg-sky-500/10 hover:border-sky-400 hover:text-sky-200 hover:bg-sky-500/25 hover:shadow-[0_0_8px_rgba(56,189,248,0.35)]",
      }
    : null;

  // 3. Mô hình 3D (.glb)
  const modelItem = card.modelUrl
    ? {
        label: "model",
        fileName: modelFileName || "model.glb",
        url: card.modelUrl,
        icon: Box,
        borderStyle:
          "border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:border-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/25 hover:shadow-[0_0_8px_rgba(52,211,153,0.35)]",
      }
    : null;

  // 4. Target Mind (.mind AR)
  const targetItem = card.targetUrl
    ? {
        label: "mind",
        fileName: targetFileName || "target.mind",
        url: card.targetUrl,
        icon: ScanLine,
        borderStyle:
          "border-amber-500/30 text-amber-300 bg-amber-500/10 hover:border-amber-400 hover:text-amber-200 hover:bg-amber-500/25 hover:shadow-[0_0_8px_rgba(251,191,36,0.35)]",
      }
    : null;

  // 5. Mô hình USDZ (Apple iOS)
  const iosItem = card.iosModelUrl
    ? {
        label: "usdz",
        fileName: iosFileName || "model.usdz",
        url: card.iosModelUrl,
        icon: Layers,
        borderStyle:
          "border-rose-500/30 text-rose-300 bg-rose-500/10 hover:border-rose-400 hover:text-rose-200 hover:bg-rose-500/25 hover:shadow-[0_0_8px_rgba(244,63,94,0.35)]",
      }
    : null;

  // 6. Link WebAR Thực Tế (QR Web Link)
  const qrItem = {
    label: "ar",
    fileName: `/${card.slug}`,
    url: qrUrl,
    icon: QrCode,
    borderStyle:
      "border-yellow-500/30 text-yellow-300 bg-yellow-500/10 hover:border-yellow-400 hover:text-yellow-200 hover:bg-yellow-500/25 hover:shadow-[0_0_8px_rgba(234,179,8,0.35)]",
  };

  const assets = [rawItem, cardItem, modelItem, targetItem, iosItem, qrItem].filter(Boolean) as {
    label: string;
    fileName: string;
    url: string;
    icon: React.ElementType;
    borderStyle: string;
  }[];

  if (layout === "compact") {
    // Dạng Lưới Thẻ Bài (Card Grid)
    return (
      <div className="flex flex-col gap-1 pt-1.5 border-t border-white/5 text-[9px] font-mono">
        <div className="flex flex-wrap items-center gap-1">
          {assets.map((asset) => {
            const Icon = asset.icon;
            return (
              <a
                key={asset.label}
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition-all duration-150 cursor-pointer group ${asset.borderStyle}`}
                title={`Mở tệp ${asset.label}: ${asset.fileName}`}
              >
                <Icon className="w-2.5 h-2.5 shrink-0" />
                <span className="font-semibold">{asset.label}:</span>
                <span className="truncate max-w-[75px]">/{asset.fileName}</span>
                <ExternalLink className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-0.5" />
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // Dạng Bảng Danh Sách (Table / List)
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] font-mono">
      {assets.map((asset) => {
        const Icon = asset.icon;
        return (
          <a
            key={asset.label}
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all duration-200 cursor-pointer group ${asset.borderStyle}`}
            title={`Mở tệp ${asset.label}: ${asset.fileName}\nNhấn để xem trực tiếp trên tab mới`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span className="font-semibold">{asset.label}:</span>
            <span className="truncate max-w-[120px] sm:max-w-[180px]">/{asset.fileName}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </a>
        );
      })}
    </div>
  );
}
