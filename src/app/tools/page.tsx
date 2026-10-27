"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  FileDown,
  Printer,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Maximize2,
  Sliders,
  Move,
  Maximize,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

interface CardPreset {
  id: string;
  name: string;
  slug: string;
  category: string;
  imageSrc: string;
  width: number;
  height: number;
  defaultQr: { x: number; y: number; size: number };
}

// Danh sách các thẻ mẫu chuẩn sẵn có của dự án
const CARD_PRESETS: CardPreset[] = [
  {
    id: "jump-action",
    name: "Thẻ Jump - Nhảy (Hành Động)",
    slug: "jump",
    category: "Hành Động",
    imageSrc: "/images/cards/jump-template.jpg",
    width: 709,
    height: 1024,
    defaultQr: { x: 6.2, y: 70.8, size: 25.8 },
  },
  {
    id: "lion-animal",
    name: "Thẻ Lion - Sư Tử (Động Vật)",
    slug: "lion",
    category: "Động Vật",
    imageSrc: "/images/cards/lion-template.jpg",
    width: 709,
    height: 1024,
    defaultQr: { x: 6.2, y: 70.8, size: 25.8 },
  },
];

export default function ToolsPage() {
  // 1. Quản lý xác thực bảo mật tác giả Poly Cards
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 2. Trạng thái Thẻ Mẫu (Card Template)
  const [selectedPresetId, setSelectedPresetId] = useState<string>("jump-action");
  const [cardImageSrc, setCardImageSrc] = useState<string>("/images/cards/jump-template.jpg");
  const [cardDimensions, setCardDimensions] = useState<{ width: number; height: number }>({
    width: 709,
    height: 1024,
  });
  const [cardFileName, setCardFileName] = useState<string>("jump-template.jpg");
  const [isDraggingOverFile, setIsDraggingOverFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Trạng thái cấu hình AR & URL Đích
  const [slug, setSlug] = useState<string>("jump");
  const [directAr, setDirectAr] = useState<boolean>(true);
  const [includeLicense, setIncludeLicense] = useState<boolean>(false);
  const [licenseCode, setLicenseCode] = useState<string>("POLY-JUMP-2026");

  // 4. Trạng thái Mã QR (QR Style & Rendering)
  const [qrColor, setQrColor] = useState<string>("#0F172A");
  const [includeLogo, setIncludeLogo] = useState<boolean>(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);

  // 5. Tọa độ & Kích thước QR trên Thẻ (Lưu theo % để chuẩn xác trên mọi kích thước ảnh)
  // X: % từ lề trái, Y: % từ lề trên, Size: % theo chiều rộng thẻ
  const [qrPos, setQrPos] = useState<{ x: number; y: number; size: number }>({
    x: 6.2,
    y: 70.8,
    size: 25.8,
  });

  // 6. Tương tác Canvas (Kéo thả di chuyển, Kéo góc đổi kích thước 1:1, Phím Alt)
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const [isDraggingQr, setIsDraggingQr] = useState<boolean>(false);
  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const [isAltKeyPressed, setIsAltKeyPressed] = useState<boolean>(false);
  const interactionStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    initialQrX: number;
    initialQrY: number;
    initialQrSize: number;
    cardRenderWidth: number;
    cardRenderHeight: number;
  }>({
    pointerX: 0,
    pointerY: 0,
    initialQrX: 0,
    initialQrY: 0,
    initialQrSize: 0,
    cardRenderWidth: 1,
    cardRenderHeight: 1,
  });

  // 7. Trạng thái xuất file & Feedback
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Tự động nhận diện session bảo mật
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("polycards_tools_auth");
      if (saved === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Lắng nghe phím Alt trên toàn màn hình để kích hoạt chế độ co giãn đối xứng từ tâm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltKeyPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltKeyPressed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Tính toán URL đích khi quét mã QR
  const computedTargetUrl = useCallback(() => {
    const cleanSlug = slug.trim().toLowerCase() || "jump";
    let url = `https://polycards-one.vercel.app/ar/${cleanSlug}`;
    const params = new URLSearchParams();
    if (directAr) {
      params.set("ar", "1");
    }
    if (includeLicense && licenseCode.trim()) {
      params.set("code", licenseCode.trim());
    }
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }, [slug, directAr, includeLicense, licenseCode]);

  const targetUrl = computedTargetUrl();

  // Tạo ảnh mã QR có độ phân giải cao kết hợp logo tròn thương hiệu Poly Cards
  const generateQrImage = useCallback(async () => {
    if (!targetUrl) return;
    try {
      setIsGeneratingQr(true);
      const rawDataUrl = await QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 1024,
        color: {
          dark: qrColor,
          light: "#FFFFFF",
        },
      });

      if (includeLogo && typeof window !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const qrImg = new window.Image();
          qrImg.crossOrigin = "anonymous";
          qrImg.onload = () => {
            ctx.drawImage(qrImg, 0, 0, 1024, 1024);

            // Vẽ huy hiệu logo bo tròn ở trung tâm QR
            const badgeSize = 1024 * 0.22;
            const center = 1024 / 2;

            // Nền trắng mềm mại bo tròn
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(center, center, badgeSize / 2 + 10, 0, Math.PI * 2);
            ctx.fill();

            // Viền ngoài sang trọng
            ctx.lineWidth = 6;
            ctx.strokeStyle = qrColor;
            ctx.stroke();

            // Logo Poly Cards
            const logo = new window.Image();
            logo.crossOrigin = "anonymous";
            logo.onload = () => {
              const innerSize = badgeSize * 0.8;
              ctx.drawImage(
                logo,
                center - innerSize / 2,
                center - innerSize / 2,
                innerSize,
                innerSize
              );
              setQrDataUrl(canvas.toDataURL("image/png"));
              setIsGeneratingQr(false);
            };
            logo.onerror = () => {
              setQrDataUrl(rawDataUrl);
              setIsGeneratingQr(false);
            };
            logo.src = "/images/icons/logo.png";
          };
          qrImg.src = rawDataUrl;
          return;
        }
      }

      setQrDataUrl(rawDataUrl);
    } catch (err) {
      console.error("QR Generation Error:", err);
    } finally {
      setIsGeneratingQr(false);
    }
  }, [targetUrl, qrColor, includeLogo]);

  // Sinh lại QR khi URL hoặc cấu hình logo/màu thay đổi
  useEffect(() => {
    generateQrImage();
  }, [generateQrImage]);

  // Xử lý nạp ảnh thẻ mẫu mới từ máy tính
  const handleLoadImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setCardImageSrc(objectUrl);
      setCardDimensions({
        width: img.naturalWidth || 709,
        height: img.naturalHeight || 1024,
      });
      setCardFileName(file.name);
      setSelectedPresetId("custom-upload");

      // Trích xuất slug tự động nếu tên file có dạng "jump.jpg" hay "card-jump.png"
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const cleanSlug = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/^-+|-+$/g, "");
      if (cleanSlug && cleanSlug.length >= 2) {
        setSlug(cleanSlug);
      }
    };
    img.src = objectUrl;
  };

  // Chọn mẫu thẻ bài sẵn có trong hệ thống
  const handleSelectPreset = (preset: CardPreset) => {
    setSelectedPresetId(preset.id);
    setCardImageSrc(preset.imageSrc);
    setCardDimensions({ width: preset.width, height: preset.height });
    setCardFileName(`${preset.slug}-template.jpg`);
    setSlug(preset.slug);
    setQrPos(preset.defaultQr);
  };

  // Nút tiện ích: Tự động bắt dính vào ô vuông trắng góc dưới thẻ
  const handleAutoSnap = () => {
    setQrPos({
      x: 6.2,
      y: 70.8,
      size: 25.8,
    });
  };

  // Bắt đầu di chuyển mã QR
  const handleQrPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!cardElementRef.current) return;

    const rect = cardElementRef.current.getBoundingClientRect();
    interactionStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialQrX: qrPos.x,
      initialQrY: qrPos.y,
      initialQrSize: qrPos.size,
      cardRenderWidth: rect.width,
      cardRenderHeight: rect.height,
    };
    setIsDraggingQr(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Bắt đầu kéo góc để đổi kích thước 1:1
  const handleResizePointerDown = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation();
    if (!cardElementRef.current) return;

    const rect = cardElementRef.current.getBoundingClientRect();
    interactionStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialQrX: qrPos.x,
      initialQrY: qrPos.y,
      initialQrSize: qrPos.size,
      cardRenderWidth: rect.width,
      cardRenderHeight: rect.height,
    };
    setResizingHandle(handle);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Xử lý di chuyển hoặc co giãn trong quá trình kéo chuột / cảm ứng
  const handleWorkspacePointerMove = (e: React.PointerEvent) => {
    const {
      pointerX,
      pointerY,
      initialQrX,
      initialQrY,
      initialQrSize,
      cardRenderWidth,
      cardRenderHeight,
    } = interactionStartRef.current;

    if (cardRenderWidth <= 0 || cardRenderHeight <= 0) return;

    const deltaPixelX = e.clientX - pointerX;
    const deltaPixelY = e.clientY - pointerY;

    // 1. CHẾ ĐỘ DI CHUYỂN VỊ TRÍ QR (Drag to Move)
    if (isDraggingQr) {
      const deltaPercentX = (deltaPixelX / cardRenderWidth) * 100;
      const deltaPercentY = (deltaPixelY / cardRenderHeight) * 100;

      const cardAspect = cardDimensions.height / cardDimensions.width;
      const qrHeightPercent = initialQrSize / cardAspect;

      const nextX = Math.max(0, Math.min(100 - initialQrSize, initialQrX + deltaPercentX));
      const nextY = Math.max(0, Math.min(100 - qrHeightPercent, initialQrY + deltaPercentY));

      setQrPos((prev) => ({
        ...prev,
        x: Math.round(nextX * 10) / 10,
        y: Math.round(nextY * 10) / 10,
      }));
      return;
    }

    // 2. CHẾ ĐỘ CO GIÃN TỈ LỆ 1:1 (Aspect Ratio Lock 1:1 like Photoshop)
    if (resizingHandle) {
      // Tính độ chênh lệch theo chiều ngang (% chiều rộng)
      let deltaPercent = (deltaPixelX / cardRenderWidth) * 100;

      if (resizingHandle === "nw" || resizingHandle === "sw") {
        deltaPercent = -deltaPercent;
      }

      // Giữ phím Alt: Co giãn đối xứng từ tâm (Center Scale)
      const isAlt = e.altKey || isAltKeyPressed;
      const scaleMultiplier = isAlt ? 2 : 1;

      let nextSize = initialQrSize + deltaPercent * scaleMultiplier;
      nextSize = Math.max(12, Math.min(55, nextSize)); // Giới hạn kích thước từ 12% đến 55%

      const sizeDiff = nextSize - initialQrSize;
      const cardAspect = cardDimensions.height / cardDimensions.width;

      let nextX = initialQrX;
      let nextY = initialQrY;

      if (isAlt) {
        // Tâm QR giữ nguyên vị trí, dời x và y ngược lại một nửa độ chênh lệch
        nextX = initialQrX - sizeDiff / 2;
        nextY = initialQrY - (sizeDiff / 2) / cardAspect;
      } else {
        // Cố định góc đối diện
        if (resizingHandle === "nw") {
          nextX = initialQrX - sizeDiff;
          nextY = initialQrY - sizeDiff / cardAspect;
        } else if (resizingHandle === "ne") {
          nextY = initialQrY - sizeDiff / cardAspect;
        } else if (resizingHandle === "sw") {
          nextX = initialQrX - sizeDiff;
        }
      }

      setQrPos({
        x: Math.max(0, Math.min(100 - nextSize, Math.round(nextX * 10) / 10)),
        y: Math.max(0, Math.min(100 - (nextSize / cardAspect), Math.round(nextY * 10) / 10)),
        size: Math.round(nextSize * 10) / 10,
      });
    }
  };

  const handleWorkspacePointerUp = (e: React.PointerEvent) => {
    setIsDraggingQr(false);
    setResizingHandle(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Tạo ảnh thẻ thành phẩm có độ phân giải gốc để in ấn xưởng in
  const generateCompositeCanvas = useCallback((): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = cardDimensions.width;
      canvas.height = cardDimensions.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Không thể khởi tạo Canvas 2D"));
        return;
      }

      const cardImg = new window.Image();
      cardImg.crossOrigin = "anonymous";
      cardImg.onload = () => {
        // 1. Vẽ ảnh thẻ gốc full-res
        ctx.drawImage(cardImg, 0, 0, cardDimensions.width, cardDimensions.height);

        // 2. Tính tọa độ pixel thực tế của QR trên thẻ gốc
        const realQrX = (qrPos.x / 100) * cardDimensions.width;
        const realQrY = (qrPos.y / 100) * cardDimensions.height;
        const realQrSize = (qrPos.size / 100) * cardDimensions.width;

        // 3. Vẽ mã QR độ nét cao lên canvas
        const qrImg = new window.Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.onload = () => {
          ctx.drawImage(qrImg, realQrX, realQrY, realQrSize, realQrSize);
          resolve(canvas);
        };
        qrImg.onerror = () => reject(new Error("Lỗi nạp ảnh mã QR"));
        qrImg.src = qrDataUrl;
      };
      cardImg.onerror = () => reject(new Error("Lỗi nạp ảnh thẻ bài"));
      cardImg.src = cardImageSrc;
    });
  }, [cardDimensions, cardImageSrc, qrPos, qrDataUrl]);

  // Tải xuống ảnh thẻ hoàn thiện chuẩn In Ấn
  const handleExportFullCard = async () => {
    try {
      setIsExporting(true);
      const canvas = await generateCompositeCanvas();
      const link = document.createElement("a");
      link.download = `polycards-${slug || "card"}-ready-to-print.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();

      setExportSuccessMsg("Đã xuất tệp in ấn hoàn tất thành công!");
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Lỗi xuất file: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Tải riêng mã QR độ phân giải cao
  const handleDownloadQrOnly = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `polycards-qr-${slug || "target"}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // Sao chép ảnh thẻ vào Clipboard (Dán ngay vào Photoshop, Zalo, Canva)
  const handleCopyCardImage = async () => {
    try {
      const canvas = await generateCompositeCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      }, "image/png");
    } catch (err) {
      console.warn("Clipboard copy not supported:", err);
      handleExportFullCard();
    }
  };

  // In trực tiếp thẻ bài
  const handlePrint = async () => {
    try {
      const canvas = await generateCompositeCanvas();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>In Thẻ Poly Cards - ${slug}</title>
              <style>
                @page { size: auto; margin: 0; }
                body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
                img { max-width: 95vw; max-height: 95vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${canvas.toDataURL("image/png")}" />
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err: any) {
      alert(`Lỗi chuẩn bị in: ${err.message}`);
    }
  };

  // Xử lý đăng nhập bảo mật
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!passcode.trim()) {
      setAuthError("Vui lòng nhập mã bảo mật của tác giả.");
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

  // MÀN HÌNH ĐĂNG NHẬP BẢO MẬT TÁC GIẢ (Nếu chưa đăng nhập)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-white">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/20 mb-3">
              <QrCode className="h-8 w-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-300">
              Poly Cards Studio
            </h1>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              Hệ thống chế bản thẻ bài & ghép mã QR WebAR chuẩn xưởng in 30 thẻ
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-amber-200 mb-1.5">
                Mã Bảo Mật Tác Giả:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Nhập mã bảo mật để mở khóa Studio..."
                  className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                />
                <KeyRound className="absolute right-4 top-3.5 h-4 w-4 text-stone-500" />
              </div>
              {authError && (
                <div className="flex items-center gap-1.5 mt-2 text-rose-400 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm active:scale-98 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>{isAuthenticating ? "Đang Xác Thực..." : "Mở Khóa Studio"}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <Link
              href="/"
              className="text-xs text-amber-300/80 hover:text-amber-200 underline font-medium"
            >
              Quay về Trang Chủ Poly Cards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col font-sans">
      {/* 1. Header Studio Chuyên Nghiệp */}
      <header className="sticky top-0 z-40 bg-stone-950/85 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-amber-300 hover:text-amber-200 transition-colors"
          >
            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-md">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black leading-tight flex items-center gap-1.5">
                <span>Poly Cards Studio</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                Chế bản thẻ bài AR & Kéo thả QR 1:1 chuẩn in ấn
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/ar/cat?ar=1"
            target="_blank"
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Thử WebAR</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-rose-400 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
            title="Đăng xuất khỏi Studio"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Khóa Studio</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace (2 Cột: Cột điều khiển trái & Canvas tương tác phải) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* ========================================================
            CỘT TRÁI: BẢNG ĐIỀU KHIỂN & CẤU HÌNH (Width: 5/12 hoặc 4/12)
           ======================================================== */}
        <div className="lg:col-span-5 xl:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 bg-stone-900/60 p-4 sm:p-5 overflow-y-auto space-y-5 max-h-[calc(100vh-60px)]">
          {/* KHỐI 1: NẠP THẺ BÀI MẪU */}
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-amber-400" />
                <span>1. Thẻ Bài Mẫu (Card Template)</span>
              </label>
              <span className="text-[10px] font-mono text-stone-400">
                {cardDimensions.width} x {cardDimensions.height} px
              </span>
            </div>

            {/* Dropzone Kéo Thả Ảnh Thẻ */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOverFile(true);
              }}
              onDragLeave={() => setIsDraggingOverFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOverFile(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleLoadImageFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                isDraggingOverFile
                  ? "border-amber-400 bg-amber-500/10 scale-102"
                  : "border-white/20 bg-white/5 hover:border-amber-400/60 hover:bg-white/8"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleLoadImageFile(e.target.files[0]);
                  }
                }}
              />
              <Upload className="h-6 w-6 mx-auto text-amber-400 mb-1 animate-bounce" />
              <div className="text-xs font-bold text-white">
                Kéo thả ảnh thẻ bài vào đây hoặc bấm để chọn tệp
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Đang nạp: <strong className="text-amber-300">{cardFileName}</strong>
              </p>
            </div>

            {/* Chọn nhanh thẻ mẫu có sẵn */}
            <div>
              <div className="text-[11px] font-bold text-stone-400 mb-1.5">
                Hoặc chọn thẻ mẫu có sẵn:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CARD_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`py-2 px-2.5 rounded-xl text-left border text-xs font-bold transition-all flex flex-col gap-0.5 ${
                      selectedPresetId === preset.id
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md"
                        : "bg-black/40 border-white/10 text-stone-300 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{preset.name}</span>
                    <span className="text-[9px] text-stone-400 font-mono">
                      slug: {preset.slug}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KHỐI 2: CẤU HÌNH AR & TỰ ĐỘNG SINH LINK */}
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>2. Cấu Hình AR & URL Đích</span>
            </label>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">
                Slug Định Danh Bài Học / Con Vật / Hành Động:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="Ví dụ: jump, lion, run, apple..."
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Mỗi thẻ trong bộ 30 thẻ sẽ tương ứng với 1 slug riêng biệt.
              </p>
            </div>

            {/* Các tùy chọn kích hoạt AR */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-200">
                <input
                  type="checkbox"
                  checked={directAr}
                  onChange={(e) => setDirectAr(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <span>Mở thẳng WebAR Camera khi quét QR (?ar=1)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-200">
                <input
                  type="checkbox"
                  checked={includeLicense}
                  onChange={(e) => setIncludeLicense(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <span>Nhúng mã bản quyền tự kích hoạt 1 chạm (&code=...)</span>
              </label>

              {includeLicense && (
                <div className="pl-6 pt-1">
                  <input
                    type="text"
                    value={licenseCode}
                    onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã bản quyền: POLY-JUMP-2026..."
                    className="w-full bg-black/60 border border-amber-400/40 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-400 placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* URL Xem Trước & Nút Copy */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                  Link nhúng trong mã QR:
                </div>
                <div className="text-xs font-mono text-amber-300 truncate">
                  {targetUrl}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(targetUrl);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Sao chép liên kết"
                >
                  {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Mở liên kết kiểm tra"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* KHỐI 3: TINH CHỈNH VỊ TRÍ & KÍCH THƯỚC QR (1:1 RATIO) */}
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-amber-400" />
                <span>3. Tinh Chỉnh QR (Chuẩn 1:1)</span>
              </label>
              <button
                type="button"
                onClick={handleAutoSnap}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-black text-[11px] shadow hover:bg-amber-400 active:scale-95 transition-all"
                title="Tự động đặt vào ô trắng góc dưới thẻ"
              >
                <Sparkles className="h-3 w-3" />
                <span>Auto-Snap Vào Ô Trắng</span>
              </button>
            </div>

            {/* Thanh trượt kích thước QR (Luôn khóa 1:1) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-stone-300">
                <span>Kích Thước Mã QR:</span>
                <span className="font-mono text-amber-300">{qrPos.size}%</span>
              </div>
              <input
                type="range"
                min="12"
                max="50"
                step="0.5"
                value={qrPos.size}
                onChange={(e) =>
                  setQrPos((prev) => ({ ...prev, size: parseFloat(e.target.value) }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Điều khiển Logo & Màu sắc */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-300 select-none">
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 h-4 w-4"
                />
                <span>Logo Trung Tâm</span>
              </label>

              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[11px] text-stone-400 font-bold">Màu QR:</span>
                <input
                  type="color"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="h-6 w-8 rounded cursor-pointer bg-transparent border-0"
                  title="Đổi màu mã QR (Khuyến nghị màu tối để quét nhạy nhất)"
                />
              </div>
            </div>

            {/* Thông số vị trí tọa độ */}
            <div className="text-[10px] font-mono text-stone-400 bg-black/50 p-2 rounded-xl flex justify-between">
              <span>X: {qrPos.x}%</span>
              <span>Y: {qrPos.y}%</span>
              <span className="text-amber-300">Tỉ Lệ: 1:1 (Square)</span>
            </div>
          </div>

          {/* KHỐI 4: XUẤT BẢN & IN ẤN */}
          <div className="rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 p-4 space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <FileDown className="h-4 w-4 text-amber-400" />
              <span>4. Xuất File In Ấn (Print Export)</span>
            </label>

            {/* Nút Xuất File Thẻ Toàn Diện */}
            <button
              type="button"
              onClick={handleExportFullCard}
              disabled={isExporting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm active:scale-98 transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>
                {isExporting ? "Đang Xuất File Cao Cấp..." : "Tải Thẻ Hoàn Thiện (PNG Chuẩn In)"}
              </span>
            </button>

            {exportSuccessMsg && (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" />
                <span>{exportSuccessMsg}</span>
              </div>
            )}

            {/* Các nút phụ: Tải riêng QR, Sao chép, In */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownloadQrOnly}
                className="py-2 px-1 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-colors"
                title="Tải riêng file ảnh mã QR kích thước 1024px"
              >
                <QrCode className="h-4 w-4 text-amber-400" />
                <span>Tải Mã QR</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCardImage}
                className="py-2 px-1 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-colors"
                title="Sao chép ảnh thẻ đã ghép QR vào bộ nhớ đệm"
              >
                {copiedImage ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 text-sky-400" />
                )}
                <span>{copiedImage ? "Đã Chép" : "Chép Ảnh"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="py-2 px-1 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-colors"
                title="Mở giao diện in thẻ trực tiếp"
              >
                <Printer className="h-4 w-4 text-purple-400" />
                <span>In Thẻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            CỘT PHẢI: KHÔNG GIAN CANVAS TƯƠNG TÁC (Interactive Workspace)
           ======================================================== */}
        <div
          ref={canvasContainerRef}
          onPointerMove={handleWorkspacePointerMove}
          onPointerUp={handleWorkspacePointerUp}
          className="lg:col-span-7 xl:col-span-8 bg-stone-950 p-4 sm:p-8 flex flex-col items-center justify-center relative select-none overflow-hidden min-h-[500px]"
        >
          {/* Thanh HUD Hướng Dẫn Kéo Thả Trực Quan Trên Canvas */}
          <div className="absolute top-4 inset-x-4 z-20 flex justify-center pointer-events-none">
            <div className="flex items-center gap-2 rounded-full bg-stone-900/90 border border-white/20 px-4 py-1.5 backdrop-blur-md text-xs text-stone-200 shadow-2xl pointer-events-auto">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                Kéo ở giữa để <strong>di chuyển</strong> • Kéo 4 góc để <strong>đổi kích thước (1:1)</strong>
              </span>
              <span className="hidden sm:inline text-amber-300 font-mono text-[10px] pl-1 border-l border-white/20">
                Giữ phím <strong>Alt</strong> để co giãn từ tâm
              </span>
            </div>
          </div>

          {/* VÙNG CHẾ BẢN THẺ BÀI CHÍNH (Card Canvas Frame) */}
          <div
            ref={cardElementRef}
            className="relative max-h-[82vh] w-auto aspect-[709/1024] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-2 border-white/20 bg-stone-900 transition-all select-none"
            style={{
              aspectRatio: `${cardDimensions.width} / ${cardDimensions.height}`,
            }}
          >
            {/* 1. Lớp Ảnh Thẻ Mẫu Bên Dưới */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardImageSrc}
              alt="Thẻ Bài AR Poly Cards"
              draggable={false}
              className="w-full h-full object-cover pointer-events-none select-none block"
            />

            {/* 2. Lớp Mã QR Nổi Bên Trên Có Thể Kéo Thả & Co Giãn 1:1 */}
            <div
              onPointerDown={handleQrPointerDown}
              className="absolute z-10 cursor-move group select-none touch-none"
              style={{
                left: `${qrPos.x}%`,
                top: `${qrPos.y}%`,
                width: `${qrPos.size}%`,
                height: `${(qrPos.size * cardDimensions.width) / cardDimensions.height}%`,
              }}
            >
              {/* Ảnh Mã QR Thực Tế */}
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none rounded-xl bg-white shadow-md p-1"
                />
              )}

              {/* Khung Viền Chọn Tương Tác Photoshop Style (Selection Border) */}
              <div className="absolute inset-0 rounded-xl border-2 border-dashed border-amber-400/90 pointer-events-none shadow-[0_0_15px_rgba(251,191,36,0.45)] group-hover:border-amber-300" />

              {/* 4 Núm Kéo Góc Giữ Tỉ Lệ 1:1 (Handles) */}
              {/* Núm Top-Left */}
              <div
                onPointerDown={(e) => handleResizePointerDown("nw", e)}
                className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
              />

              {/* Núm Top-Right */}
              <div
                onPointerDown={(e) => handleResizePointerDown("ne", e)}
                className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
              />

              {/* Núm Bottom-Right */}
              <div
                onPointerDown={(e) => handleResizePointerDown("se", e)}
                className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
              />

              {/* Núm Bottom-Left */}
              <div
                onPointerDown={(e) => handleResizePointerDown("sw", e)}
                className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                title="Kéo để đổi kích thước 1:1 (Giữ Alt để co giãn từ tâm)"
              />

              {/* Huy hiệu hiển thị kích thước trực tiếp khi rê chuột */}
              <div className="absolute -bottom-7 inset-x-0 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-2 py-0.5 rounded-md bg-stone-900/95 text-amber-300 font-mono text-[9px] shadow-lg border border-amber-400/40 whitespace-nowrap">
                  QR 1:1 • {qrPos.size}%
                </span>
              </div>
            </div>
          </div>

          {/* Thanh Thông Tin Chân Canvas */}
          <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none text-[11px] text-stone-400">
            <div className="bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto">
              Tọa độ: <span className="font-mono text-amber-300">X: {qrPos.x}%, Y: {qrPos.y}%</span>
            </div>
            <div className="bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto">
              Độ phân giải xuất: <span className="font-mono text-emerald-400">{cardDimensions.width} x {cardDimensions.height} px</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
