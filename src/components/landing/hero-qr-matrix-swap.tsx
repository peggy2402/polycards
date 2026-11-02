"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, QrCode } from "lucide-react";

export function HeroQrMatrixSwap() {
  // Chuỗi số / mã code ngẫu nhiên chạy liên tục
  const [hexCode, setHexCode] = useState("POLY-8A");
  const [matrixPattern, setMatrixPattern] = useState<number[]>(() =>
    Array.from({ length: 36 }, () => (Math.random() > 0.45 ? 1 : 0))
  );

  useEffect(() => {
    const codeList = [
      "POLY-8A",
      "AR-3D-9X",
      "LION-005",
      "WEBXR-OK",
      "PASS-77F",
      "LIVE-360",
      "SMART-AR",
      "0xAF49C",
    ];

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setHexCode(codeList[count % codeList.length]);
      // Cập nhật ma trận module QR ngẫu nhiên (Digital Matrix Swap)
      setMatrixPattern(
        Array.from({ length: 36 }, (_, i) => {
          // Giữ cố định 3 góc định vị (Finder Patterns)
          if (i === 0 || i === 1 || i === 6 || i === 7) return 1;
          if (i === 4 || i === 5 || i === 10 || i === 11) return 1;
          if (i === 24 || i === 25 || i === 30 || i === 31) return 1;
          return Math.random() > 0.4 ? 1 : 0;
        })
      );
    }, 180);

    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/ar/lion"
      title="Chạm để mở trải nghiệm WebAR thực tế ảo"
      className="group absolute z-25 overflow-hidden rounded-xl border border-amber-300/80 bg-white shadow-md transition-all hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95"
      style={{
        left: "7.2%",
        bottom: "7.4%",
        width: "22.8%",
        height: "17.2%",
      }}
    >
      {/* 4 Góc Marker ngắm mục tiêu công nghệ tương lai */}
      <span className="absolute top-1 left-1 h-2 w-2 border-t-2 border-l-2 border-amber-600 group-hover:border-emerald-600 transition-colors pointer-events-none" />
      <span className="absolute top-1 right-1 h-2 w-2 border-t-2 border-r-2 border-amber-600 group-hover:border-emerald-600 transition-colors pointer-events-none" />
      <span className="absolute bottom-1 left-1 h-2 w-2 border-b-2 border-l-2 border-amber-600 group-hover:border-emerald-600 transition-colors pointer-events-none" />
      <span className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-amber-600 group-hover:border-emerald-600 transition-colors pointer-events-none" />

      {/* Lưới Ma Trận Pixel Đổi Trạng Thái Liên Tục (QR Matrix Swap Stream) */}
      <div className="flex h-full w-full flex-col items-center justify-between p-1.5 sm:p-2">
        <div className="grid grid-cols-6 gap-0.5 w-full h-[65%] place-items-center">
          {matrixPattern.map((val, idx) => (
            <div
              key={idx}
              className={`h-full w-full rounded-[1px] transition-colors duration-100 ${
                val === 1
                  ? "bg-stone-900 group-hover:bg-emerald-700"
                  : "bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Dòng Số / Hex Code Chạy Cuộn */}
        <div className="flex w-full items-center justify-between border-t border-amber-200/90 pt-0.5">
          <span className="font-mono text-[8px] font-black tracking-tighter text-amber-900 group-hover:text-emerald-700 truncate">
            {hexCode}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-[7px] font-bold text-slate-500">AR</span>
          </span>
        </div>
      </div>

      {/* Laser Scan Line Quét Lên Xuống */}
      <div
        className="pointer-events-none absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(16,185,129,0.8)]"
        style={{
          animation: "heroScanBeam 1.8s ease-in-out infinite alternate",
        }}
      />

      {/* Style animation keyframes inline */}
      <style jsx>{`
        @keyframes heroScanBeam {
          0% {
            top: 2%;
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 92%;
            opacity: 0.3;
          }
        }
      `}</style>
    </Link>
  );
}
