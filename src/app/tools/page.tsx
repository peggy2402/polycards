"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { getAllAnimals } from "@/lib/animals";
import { Animal } from "@/types/animal";
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  Palette,
  Eye,
  RefreshCw,
  Sliders,
  Settings,
  ChevronRight,
  HelpCircle,
  FileDown,
  Printer,
  Smartphone,
  Info,
} from "lucide-react";

const ANIMALS = getAllAnimals();

const COLOR_PRESETS = [
  { name: "Slate 900 (Mặc định)", hex: "#0F172A" },
  { name: "Emerald Poly", hex: "#059669" },
  { name: "Amber Gold", hex: "#D97706" },
  { name: "Indigo Modern", hex: "#4338CA" },
  { name: "Crimson Red", hex: "#DC2626" },
  { name: "Pure Black", hex: "#000000" },
];

const BG_PRESETS = [
  { name: "Trắng tinh khiết", hex: "#FFFFFF" },
  { name: "Kem ấm Poly Cards", hex: "#FCFBF7" },
  { name: "Vàng nhạt ấm", hex: "#FEF3C7" },
];

export default function ToolsPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // QR Studio states
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedAnimalSlug, setSelectedAnimalSlug] = useState<string>("lion");
  const [customSlug, setCustomSlug] = useState("dinosaur");
  const [customNameEn, setCustomNameEn] = useState("Dinosaur");
  const [customNameVi, setCustomNameVi] = useState("Khủng long");

  // Domain & Route Target
  const [domainMode, setDomainMode] = useState<"production" | "local" | "custom">("production");
  const [customDomain, setCustomDomain] = useState("https://polycards-one.vercel.app");
  const [targetType, setTargetType] = useState<"ar" | "scan">("ar");

  // Visual Customization
  const [fgColor, setFgColor] = useState("#0F172A");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("H");
  const [qrMargin, setQrMargin] = useState<number>(2);
  const [qrSize, setQrSize] = useState<number>(1024);
  const [includeCenterLogo, setIncludeCenterLogo] = useState<boolean>(true);

  // Preview & output
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrSvgString, setQrSvgString] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [previewTab, setPreviewTab] = useState<"card" | "qr">("card");
  const [batchStatus, setBatchStatus] = useState<string | null>(null);

  // Check existing session
  useEffect(() => {
    const saved = sessionStorage.getItem("polycards_tools_auth");
    if (saved === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!passcode.trim()) {
      setAuthError("Vui lòng nhập mã bảo mật của bạn.");
      return;
    }

    try {
      setIsAuthenticating(true);
      const res = await fetch("/api/tools/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("polycards_tools_auth", "true");
      } else {
        setAuthError(data.message || "Mã bảo mật không đúng.");
      }
    } catch {
      setAuthError("Không thể kết nối đến máy chủ xác thực.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("polycards_tools_auth");
    setPasscode("");
  };

  // Determine current active animal
  const currentAnimal =
    mode === "preset"
      ? ANIMALS.find((a) => a.slug === selectedAnimalSlug) || ANIMALS[0]
      : null;

  const activeSlug = mode === "preset" ? currentAnimal?.slug || "lion" : customSlug.trim().toLowerCase();
  const activeNameEn = mode === "preset" ? currentAnimal?.nameEn || "Animal" : customNameEn.trim();
  const activeNameVi = mode === "preset" ? currentAnimal?.nameVi || "Động vật" : customNameVi.trim();

  // Compute Base Domain
  const getBaseDomain = useCallback(() => {
    if (domainMode === "production") return "https://polycards-one.vercel.app";
    if (domainMode === "local") return "http://localhost:3000";
    return customDomain.trim().replace(/\/+$/, "");
  }, [domainMode, customDomain]);

  // Compute Target URL encoded in QR
  const getTargetUrl = useCallback(() => {
    const domain = getBaseDomain();
    if (targetType === "ar") {
      return `${domain}/ar/${activeSlug}`;
    }
    return `${domain}/scan?expect=${activeSlug}`;
  }, [getBaseDomain, targetType, activeSlug]);

  const targetUrl = getTargetUrl();

  // Generate QR Code data URL & SVG
  const generateCurrentQr = useCallback(async () => {
    if (!targetUrl) return;
    try {
      setIsGenerating(true);

      // 1. Generate Raw PNG Data URL
      const dataUrl = await QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: errorLevel,
        margin: qrMargin,
        width: qrSize,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });

      // 2. Generate Vector SVG
      const svgString = await QRCode.toString(targetUrl, {
        type: "svg",
        errorCorrectionLevel: errorLevel,
        margin: qrMargin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });

      // 3. If Center Logo is requested, composite logo onto canvas
      if (includeCenterLogo && typeof window !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = qrSize;
        canvas.height = qrSize;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            ctx.drawImage(img, 0, 0, qrSize, qrSize);

            // Draw center round badge
            const badgeSize = qrSize * 0.22; // 22% of QR width
            const badgeX = (qrSize - badgeSize) / 2;
            const badgeY = (qrSize - badgeSize) / 2;

            // Background circle/box with soft shadow
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.arc(qrSize / 2, qrSize / 2, badgeSize / 2 + 8, 0, Math.PI * 2);
            ctx.fill();

            // Border ring
            ctx.lineWidth = 6;
            ctx.strokeStyle = fgColor;
            ctx.stroke();

            // Logo image in center
            const logo = new window.Image();
            logo.crossOrigin = "anonymous";
            logo.onload = () => {
              const innerSize = badgeSize * 0.75;
              const innerX = (qrSize - innerSize) / 2;
              const innerY = (qrSize - innerSize) / 2;
              ctx.drawImage(logo, innerX, innerY, innerSize, innerSize);
              setQrDataUrl(canvas.toDataURL("image/png"));
              setIsGenerating(false);
            };
            logo.onerror = () => {
              setQrDataUrl(dataUrl);
              setIsGenerating(false);
            };
            logo.src = "/images/icons/logo.png";
          };
          img.src = dataUrl;
          setQrSvgString(svgString);
          return;
        }
      }

      setQrDataUrl(dataUrl);
      setQrSvgString(svgString);
    } catch (err) {
      console.error("QR Generation Error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [targetUrl, errorLevel, qrMargin, qrSize, fgColor, bgColor, includeCenterLogo]);

  // Re-generate when inputs change
  useEffect(() => {
    if (isAuthenticated) {
      generateCurrentQr();
    }
  }, [isAuthenticated, generateCurrentQr]);

  // Download PNG file
  const downloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `polycard-qr-${activeSlug}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // Download SVG file
  const downloadSvg = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `polycard-qr-${activeSlug}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy target URL
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Copy QR Image to Clipboard
  const copyImageToClipboard = async () => {
    try {
      if (!qrDataUrl) return;
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } catch {
      alert("Trình duyệt không hỗ trợ sao chép ảnh trực tiếp. Vui lòng nhấn Tải PNG.");
    }
  };

  // Batch Generation of all 6 animals
  const handleBatchDownloadAll = async () => {
    try {
      setBatchStatus("Đang tạo và tải toàn bộ 6 mã QR Poly Cards...");
      const domain = getBaseDomain();

      for (const animal of ANIMALS) {
        const url = `${domain}/ar/${animal.slug}`;
        const dataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: "H",
          margin: 2,
          width: 1024,
          color: { dark: "#0F172A", light: "#FFFFFF" },
        });

        const link = document.createElement("a");
        link.download = `polycard-qr-${animal.slug}.png`;
        link.href = dataUrl;
        link.click();
        await new Promise((r) => setTimeout(r, 400));
      }

      setBatchStatus("Đã tải xong toàn bộ 6 mã QR chất lượng cao cho xưởng in!");
      setTimeout(() => setBatchStatus(null), 5000);
    } catch (error) {
      setBatchStatus("Có lỗi xảy ra khi tạo hàng loạt.");
    }
  };

  // -------------------------------------------------------------
  // 1. LOCK SCREEN (Khi chưa xác thực)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50/70 via-[#FCFBF7] to-emerald-50/60 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border-2 border-amber-200/90 bg-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Lock Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
              <Lock className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-950 border border-amber-300">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                <span>KHU VỰC NỘI BỘ • CREATOR TOOLS</span>
              </span>
              <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                Poly Cards QR Studio
              </h1>
              <p className="mt-1 text-xs text-slate-600 font-medium">
                Module này chỉ dành riêng cho tác giả thiết kế sản phẩm Poly Cards để tạo và in ấn mã QR thẻ bài.
              </p>
            </div>
          </div>

          {/* Form Auth */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Mã Bảo Mật Truy Cập (Access Passcode)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Nhập mã truy cập..."
                  autoFocus
                  className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/40 py-2.5 pl-10 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200 animate-in fade-in">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="btn-toy-3d flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 py-2.5 px-4 text-sm font-black text-slate-950 shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang Kiểm Tra Quyền...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>Mở Khóa Studio</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-amber-100">
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-amber-800 transition-colors"
            >
              Quay lại Trang Chủ Poly Cards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MAIN CREATOR STUDIO (Đã xác thực)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FCFBF7] text-slate-900 pb-16">
      {/* Studio Topbar */}
      <header className="sticky top-0 z-40 border-b-2 border-amber-200/80 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white shadow-xs p-1 border-2 border-amber-300">
              <Image
                src="/images/icons/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Poly Cards Studio
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                  CREATOR MODE
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                Hệ thống khởi tạo & in ấn mã QR chuẩn AR cho bộ thẻ bài
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            >
              <span>Xem Web</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3 py-1.5 text-xs font-black text-red-700 hover:bg-red-100 active:scale-95 transition-all"
              title="Khóa module này lại"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Khóa Studio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {batchStatus && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-emerald-500 px-5 py-3.5 text-white shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 text-sm font-bold">
              <Check className="h-5 w-5" />
              <span>{batchStatus}</span>
            </div>
            <button
              type="button"
              onClick={() => setBatchStatus(null)}
              className="rounded-lg p-1 hover:bg-white/20 text-xs font-bold"
            >
              Đóng
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Controls & Configurations (7 cols)           */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Animal Selection & Target Settings */}
            <section className="rounded-3xl border-2 border-amber-200/90 bg-white p-5 sm:p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-black text-slate-900">
                    1. Chọn Thẻ Bài / Động Vật Cần Tạo Mã
                  </h2>
                </div>

                {/* Mode Selector */}
                <div className="flex rounded-xl bg-amber-100/70 p-1 border border-amber-200">
                  <button
                    type="button"
                    onClick={() => setMode("preset")}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                      mode === "preset"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Bộ Có Sẵn ({ANIMALS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("custom")}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                      mode === "custom"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tùy Chỉnh Mới
                  </button>
                </div>
              </div>

              {/* Preset Animals Grid Selector */}
              {mode === "preset" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ANIMALS.map((animal) => {
                    const isSelected = selectedAnimalSlug === animal.slug;
                    return (
                      <button
                        key={animal.slug}
                        type="button"
                        onClick={() => setSelectedAnimalSlug(animal.slug)}
                        className={`group flex items-center gap-2.5 rounded-2xl p-2 text-left transition-all border-2 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/80 shadow-sm"
                            : "border-amber-100 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                        }`}
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-amber-100 border border-amber-200">
                          <Image
                            src={animal.images[0] || "/images/animals/lion.jpg"}
                            alt={animal.nameEn}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-slate-900 truncate">
                            {animal.nameEn}
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-700 truncate">
                            {animal.nameVi}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Slug Định Danh (VD: lion)
                    </label>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      placeholder="dinosaur"
                      className="w-full rounded-xl border border-amber-200 bg-amber-50/30 px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Tiếng Anh
                    </label>
                    <input
                      type="text"
                      value={customNameEn}
                      onChange={(e) => setCustomNameEn(e.target.value)}
                      placeholder="Dinosaur"
                      className="w-full rounded-xl border border-amber-200 bg-amber-50/30 px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Tiếng Việt
                    </label>
                    <input
                      type="text"
                      value={customNameVi}
                      onChange={(e) => setCustomNameVi(e.target.value)}
                      placeholder="Khủng long"
                      className="w-full rounded-xl border border-amber-200 bg-amber-50/30 px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Target Destination & Domain Configuration */}
              <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Cấu Hình Tên Miền & Đích Đến Quét:
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDomainMode("production")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        domainMode === "production"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-white text-slate-700 hover:bg-amber-100"
                      }`}
                    >
                      Production Vercel
                    </button>
                    <button
                      type="button"
                      onClick={() => setDomainMode("local")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        domainMode === "local"
                          ? "bg-slate-800 text-white shadow-2xs"
                          : "bg-white text-slate-700 hover:bg-amber-100"
                      }`}
                    >
                      Localhost:3000
                    </button>
                    <button
                      type="button"
                      onClick={() => setDomainMode("custom")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        domainMode === "custom"
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "bg-white text-slate-700 hover:bg-amber-100"
                      }`}
                    >
                      Tùy Biến
                    </button>
                  </div>
                </div>

                {domainMode === "custom" && (
                  <div>
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="https://polycards-one.vercel.app"
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-600 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Route Target Radio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label
                    onClick={() => setTargetType("ar")}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      targetType === "ar"
                        ? "border-emerald-500 bg-white shadow-xs"
                        : "border-transparent bg-amber-100/50 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "ar"}
                      onChange={() => setTargetType("ar")}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        /ar/[slug] (Khuyên Dùng)
                      </div>
                      <div className="text-[11px] text-slate-600 leading-snug">
                        Mở thẳng màn hình 3D AR & tương tác âm thanh con vật.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setTargetType("scan")}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      targetType === "scan"
                        ? "border-emerald-500 bg-white shadow-xs"
                        : "border-transparent bg-amber-100/50 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "scan"}
                      onChange={() => setTargetType("scan")}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        /scan?expect=[slug]
                      </div>
                      <div className="text-[11px] text-slate-600 leading-snug">
                        Mở camera quét nhận diện thẻ bài vật lý.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Target URL Preview */}
                <div className="flex items-center gap-2 pt-2 border-t border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 shrink-0">URL Gắn Trong QR:</span>
                  <code className="flex-1 overflow-x-auto rounded-lg bg-white px-2.5 py-1.5 font-mono text-[11px] font-bold text-emerald-700 border border-amber-200">
                    {targetUrl}
                  </code>
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-amber-200 px-2.5 py-1.5 font-bold text-amber-950 hover:bg-amber-300 transition-all text-xs"
                  >
                    {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedUrl ? "Đã chép" : "Chép"}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 2. Visual & Print Settings */}
            <section className="rounded-3xl border-2 border-amber-200/90 bg-white p-5 sm:p-6 shadow-lg space-y-5">
              <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                  <Palette className="h-4 w-4" />
                </div>
                <h2 className="text-base font-black text-slate-900">
                  2. Tùy Biến Thiết Kế & Chuẩn In Ấn
                </h2>
              </div>

              {/* Color Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Foreground Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Màu Mã QR (Foreground)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-amber-200 p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-24 rounded-lg border border-amber-200 bg-amber-50/30 px-2 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setFgColor(p.hex)}
                        className="h-6 w-6 rounded-md border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                        style={{ backgroundColor: p.hex }}
                        title={p.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Màu Nền (Background)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-amber-200 p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-24 rounded-lg border border-amber-200 bg-amber-50/30 px-2 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {BG_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setBgColor(p.hex)}
                        className="h-6 w-6 rounded-md border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                        style={{ backgroundColor: p.hex }}
                        title={p.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Technical Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-amber-100 text-xs">
                {/* Error Correction Level */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mức Sửa Lỗi (Error Level)
                  </label>
                  <select
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as any)}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50/40 p-2 font-bold text-slate-900 focus:outline-hidden"
                  >
                    <option value="H">Cấp H - 30% (Khuyên dùng khi in thẻ)</option>
                    <option value="Q">Cấp Q - 25% (Rất cao)</option>
                    <option value="M">Cấp M - 15% (Tiêu chuẩn)</option>
                    <option value="L">Cấp L - 7% (Tối giản)</option>
                  </select>
                </div>

                {/* Padding Margin */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Độ Dày Viền (Quiet Zone)
                  </label>
                  <select
                    value={qrMargin}
                    onChange={(e) => setQrMargin(Number(e.target.value))}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50/40 p-2 font-bold text-slate-900 focus:outline-hidden"
                  >
                    <option value="2">2 Modules (Chuẩn thẻ đồ chơi)</option>
                    <option value="1">1 Module (Viền mỏng)</option>
                    <option value="4">4 Modules (Viền rộng tối đa)</option>
                    <option value="0">0 Module (Sát mép)</option>
                  </select>
                </div>

                {/* Resolution */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Độ Phân Giải Xuất (Size)
                  </label>
                  <select
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50/40 p-2 font-bold text-slate-900 focus:outline-hidden"
                  >
                    <option value="1024">1024px (Chuẩn in ấn sắc nét)</option>
                    <option value="2048">2048px (Ultra HD cho xưởng)</option>
                    <option value="512">512px (Bản xem trước nhẹ)</option>
                  </select>
                </div>
              </div>

              {/* Center Logo Toggle */}
              <div className="flex items-center justify-between rounded-2xl bg-amber-50/80 p-3.5 border border-amber-200">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-white p-0.5 border border-amber-300">
                    <Image
                      src="/images/icons/logo.png"
                      alt="Poly Cards"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      Gắn Logo Poly Cards ở Giữa Mã QR
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tự động tính toán vùng an toàn để camera quét 100% nhạy bén.
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCenterLogo}
                    onChange={(e) => setIncludeCenterLogo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </section>

            {/* 3. Batch Export All Animals Button */}
            <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black text-emerald-950 uppercase">
                  <Printer className="h-4 w-4 text-emerald-700" />
                  <span>Dành Riêng Cho Đợt In Hàng Loạt:</span>
                </div>
                <p className="text-xs text-slate-600">
                  Tự động khởi tạo & tải xuống toàn bộ 6 file PNG mã QR chuẩn in cho cả bộ thẻ bài.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBatchDownloadAll}
                className="btn-toy-3d shrink-0 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/25 active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Tải Trọn Bộ 6 Mã QR</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Live Interactive Mockup Preview (5 cols)    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            <section className="rounded-3xl border-2 border-amber-200/90 bg-white p-5 sm:p-6 shadow-xl space-y-4">
              {/* Preview Header & Tabs */}
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                    <Eye className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-black text-slate-900">
                    Xem Trước Thực Tế
                  </h2>
                </div>

                <div className="flex rounded-xl bg-amber-100/70 p-1 border border-amber-200">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("card")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      previewTab === "card"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Thẻ Bài Thật
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("qr")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      previewTab === "qr"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Mã QR Thuần
                  </button>
                </div>
              </div>

              {/* PREVIEW CONTAINER */}
              <div className="flex justify-center p-3 rounded-2xl bg-gradient-to-b from-amber-50/50 via-slate-50 to-amber-50/30 border border-amber-100">
                {previewTab === "card" ? (
                  /* 1. MOCKUP THẺ BÀI IN ẤN THỰC TẾ */
                  <div className="relative w-full max-w-[280px] aspect-3/4 rounded-3xl border-4 border-amber-300 bg-white p-3.5 shadow-2xl shadow-amber-900/15 flex flex-col justify-between overflow-hidden">
                    {/* Top Card Badge */}
                    <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-amber-100 p-0.5 border border-amber-300">
                          <Image
                            src="/images/icons/logo.png"
                            alt="Logo"
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        </div>
                        <span className="text-[11px] font-black tracking-wider text-slate-800">
                          POLY CARDS
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-800">
                        AR LIVE 3D
                      </span>
                    </div>

                    {/* Animal Poster Image */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-100 to-sky-100 border border-amber-200/80 my-2 shadow-inner">
                      {currentAnimal?.images[0] ? (
                        <Image
                          src={currentAnimal.images[0]}
                          alt={activeNameEn}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-black text-slate-400 text-sm">
                          {activeNameEn}
                        </div>
                      )}
                    </div>

                    {/* Animal Title Header */}
                    <div className="text-center">
                      <div className="text-base font-black text-slate-900 tracking-tight">
                        {activeNameEn}
                      </div>
                      <div className="text-xs font-bold text-emerald-700">
                        {activeNameVi}
                      </div>
                    </div>

                    {/* Bottom QR Section of Physical Card */}
                    <div className="mt-2 pt-2 border-t border-amber-100 flex items-center justify-between gap-2.5 bg-amber-50/60 rounded-xl p-2">
                      <div className="text-left flex-1 min-w-0">
                        <span className="block text-[10px] font-black text-amber-950 uppercase leading-tight">
                          Quét Mã Này:
                        </span>
                        <span className="block text-[9px] text-slate-500 font-semibold leading-tight mt-0.5">
                          Mở camera điện thoại để xem 3D AR
                        </span>
                      </div>

                      {/* Small QR placed on the card */}
                      <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-amber-300 bg-white p-0.5 shadow-2xs">
                        {qrDataUrl ? (
                          <Image
                            src={qrDataUrl}
                            alt="QR on card"
                            width={56}
                            height={56}
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. MÃ QR THUẦN LỚN ĐỂ TEST QUÉT TRỰC TIẾP */
                  <div className="flex flex-col items-center justify-center p-4">
                    <div className="relative h-64 w-64 rounded-3xl border-4 border-amber-300 bg-white p-3 shadow-2xl shadow-amber-900/10 flex items-center justify-center">
                      {qrDataUrl ? (
                        <Image
                          src={qrDataUrl}
                          alt="Generated QR Code"
                          width={240}
                          height={240}
                          className="object-contain rounded-xl"
                        />
                      ) : (
                        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                      <Smartphone className="h-4 w-4" />
                      <span>Đưa camera điện thoại vào quét thử ngay</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS: TẢI & SAO CHÉP */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={downloadPng}
                    disabled={!qrDataUrl}
                    className="btn-toy-3d flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-3 py-2 text-xs font-black text-slate-950 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải PNG (HD)</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadSvg}
                    disabled={!qrSvgString}
                    className="btn-toy-3d flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-3 py-2 text-xs font-black text-white shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <FileDown className="h-4 w-4" />
                    <span>Tải SVG (Vector)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={copyImageToClipboard}
                    className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    {copiedImage ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedImage ? "Đã Chép Ảnh" : "Chép Vào Clipboard"}</span>
                  </button>

                  <Link
                    href={`/ar/${activeSlug}`}
                    target="_blank"
                    className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/80 px-3 py-1.5 text-xs font-black text-amber-950 hover:bg-amber-100 active:scale-95 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-amber-600" />
                    <span>Mở Trang Thử Nghiệm</span>
                  </Link>
                </div>
              </div>

              {/* Guide Note Box */}
              <div className="rounded-2xl bg-slate-50 p-3.5 text-[11px] text-slate-600 space-y-1.5 border border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Info className="h-3.5 w-3.5 text-amber-600" />
                  <span>Lời Khuyên Cho Bản Thiết Kế In Ấn:</span>
                </div>
                <p>
                  - File <strong>SVG</strong> là định dạng vector tốt nhất để kéo thả vào Adobe Illustrator / Corel / Photoshop mà không sợ vỡ hạt khi in.
                </p>
                <p>
                  - Luôn giữ độ tương phản cao giữa màu mã QR và màu nền (nền trắng hoặc sáng, mã đậm) để camera của mọi điện thoại (iPhone, Samsung, Xiaomi...) đều nhận diện tức thì trong 0.2 giây.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
