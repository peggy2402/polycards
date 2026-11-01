"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ScanLine,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  CloudUpload,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Star,
  Layers,
  FileCheck,
} from "lucide-react";
import { Animal } from "@/types/animal";

interface TargetCompilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Animal[];
  initialAnimal?: Animal | null;
  onCompileSuccess?: (updatedAnimal?: Animal) => void;
}

export function TargetCompilerModal({
  isOpen,
  onClose,
  products,
  initialAnimal,
  onCompileSuccess,
}: TargetCompilerModalProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string>("");

  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileProgress, setCompileProgress] = useState<number>(0);
  const [compileStepText, setCompileStepText] = useState<string>("");
  const [compiledBuffer, setCompiledBuffer] = useState<Uint8Array | null>(null);
  const [compiledFileSizeKB, setCompiledFileSizeKB] = useState<number>(0);
  const [featureScore, setFeatureScore] = useState<number>(5);

  const [isSavingToR2, setIsSavingToR2] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo thẻ ban đầu
  useEffect(() => {
    if (initialAnimal) {
      setSelectedSlug(initialAnimal.slug);
      setCustomFile(null);
      setCustomPreviewUrl("");
    } else if (products.length > 0 && !selectedSlug) {
      setSelectedSlug(products[0].slug);
    }
  }, [initialAnimal, products]);

  // Reset trạng thái khi đóng/mở
  useEffect(() => {
    if (isOpen) {
      setCompiledBuffer(null);
      setCompiledFileSizeKB(0);
      setCompileProgress(0);
      setSaveSuccessMsg(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentAnimal = products.find((p) => p.slug === selectedSlug) || null;

  // Lấy đường dẫn ảnh phôi thẻ bài hiệu dụng
  const activeImageUrl = customPreviewUrl || currentAnimal?.rawImageUrl || currentAnimal?.images?.[0] || "";

  // Xử lý khi tải file ảnh phôi tùy biến từ máy
  const handleCustomFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Vui lòng chọn tệp định dạng hình ảnh (.jpg, .png, .webp)");
      return;
    }
    setCustomFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCustomPreviewUrl(objectUrl);
    setCompiledBuffer(null);
    setCompiledFileSizeKB(0);
    setErrorMessage(null);
  };

  /**
   * Tải động thư viện MindAR nếu chưa có trên window
   */
  const ensureMindARCompiler = async (): Promise<any> => {
    if (typeof window === "undefined") return null;

    const win = window as any;
    if (win.MINDAR?.IMAGE?.Compiler) {
      return win.MINDAR.IMAGE.Compiler;
    }

    // Nạp script MindAR Three prod đã expose Compiler
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[src*="mindar-image-three.prod.js"]');
      if (existing) {
        if (win.MINDAR?.IMAGE?.Compiler) {
          resolve();
          return;
        }
      }
      const script = document.createElement("script");
      script.src = "/lib/mindar-image-three.prod.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Không thể tải thư viện MindAR Engine."));
      document.head.appendChild(script);
    });

    return win.MINDAR?.IMAGE?.Compiler || null;
  };

  /**
   * Thực thi quá trình biên dịch ảnh phôi thành tệp .mind (WebAssembly)
   */
  const handleStartCompile = async () => {
    if (!activeImageUrl) {
      setErrorMessage("Chưa có hình ảnh phôi thẻ bài để biên dịch.");
      return;
    }

    try {
      setIsCompiling(true);
      setCompileProgress(5);
      setCompileStepText("Đang khởi tạo WebAssembly Engine...");
      setErrorMessage(null);
      setSaveSuccessMsg(null);

      const CompilerClass = await ensureMindARCompiler();
      if (!CompilerClass) {
        throw new Error("Không thể khởi tạo MindAR Compiler Engine.");
      }

      setCompileStepText("Đang nạp ảnh phôi thẻ và phân tích điểm tương phản...");
      setCompileProgress(15);

      // Nạp ảnh vào thẻ Image HTML
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = activeImageUrl;

      await new Promise<void>((resolve, reject) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Không thể nạp dữ liệu ảnh thẻ bài. Vui lòng kiểm tra liên kết ảnh."));
        }
      });

      setCompileProgress(25);
      setCompileStepText("Đang trích xuất ma trận điểm đặc trưng (Keypoint Pyramid)...");

      const compiler = new CompilerClass();

      // Tiến hành biên dịch qua Web Worker của MindAR
      await compiler.compileImageTargets([img], (percent: number) => {
        const rounded = Math.min(95, Math.round(percent));
        setCompileProgress(rounded);
        if (rounded < 40) {
          setCompileStepText(`Đang lọc nhiễu & tối ưu độ tương phản (${rounded}%)...`);
        } else if (rounded < 70) {
          setCompileStepText(`Đang huấn luyện mô hình bám nét đa tỷ lệ (${rounded}%)...`);
        } else {
          setCompileStepText(`Đang đóng gói dữ liệu tracking nhị phân (${rounded}%)...`);
        }
      });

      setCompileProgress(98);
      setCompileStepText("Đang hoàn tất đóng gói tệp .mind...");

      const exportedBuffer = await compiler.exportData();
      const uint8 = new Uint8Array(exportedBuffer);

      setCompiledBuffer(uint8);
      setCompiledFileSizeKB(Math.round(uint8.length / 1024));
      setCompileProgress(100);
      setCompileStepText("Biên dịch thành công 100%!");

      // Tính điểm chất lượng dựa trên kích thước tracking features
      if (uint8.length > 500 * 1024) {
        setFeatureScore(5);
      } else if (uint8.length > 250 * 1024) {
        setFeatureScore(4);
      } else {
        setFeatureScore(3);
      }
    } catch (err: unknown) {
      console.error("Lỗi biên dịch MindAR Target:", err);
      const msg = err instanceof Error ? err.message : "Đã xảy ra sự cố trong quá trình biên dịch.";
      setErrorMessage(msg);
    } finally {
      setIsCompiling(false);
    }
  };

  /**
   * Tải tệp .mind trực tiếp về máy tính
   */
  const handleDownloadMindFile = () => {
    if (!compiledBuffer) return;
    const effectiveSlug = selectedSlug || "target";
    const blob = new Blob([compiledBuffer as BlobPart], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${effectiveSlug}.mind`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Đẩy tệp .mind trực tiếp lên Cloudflare R2 và lưu vào MongoDB Atlas
   */
  const handleUploadToR2 = async () => {
    if (!compiledBuffer) return;
    const effectiveSlug = selectedSlug || (customFile ? customFile.name.replace(/\.[^/.]+$/, "") : "target");

    try {
      setIsSavingToR2(true);
      setErrorMessage(null);
      setSaveSuccessMsg(null);

      const blob = new Blob([compiledBuffer as BlobPart], { type: "application/octet-stream" });
      const formData = new FormData();
      formData.append("file", blob, `${effectiveSlug}.mind`);
      formData.append("slug", effectiveSlug);
      formData.append("updateDatabase", "true");

      const res = await fetch("/api/tools/save-target", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể tải lên Cloudflare R2.");
      }

      setSaveSuccessMsg(`Đã tải thành công lên R2: ${data.url}`);

      if (onCompileSuccess) {
        onCompileSuccess(data.updatedCard);
      }
    } catch (err: unknown) {
      console.error("Lỗi tải tệp .mind lên Cloudflare R2:", err);
      const msg = err instanceof Error ? err.message : "Lỗi kết nối khi đẩy tệp lên R2.";
      setErrorMessage(msg);
    } finally {
      setIsSavingToR2(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4.5 border-b border-stone-800 bg-stone-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-stone-950">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-stone-100">MindAR Target Compiler</h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  WebAssembly 100%
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Biên dịch ảnh phôi thẻ in thành tệp <code className="text-amber-400">.mind</code> bám nét camera chuẩn xác
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thân Modal */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Lựa chọn nguồn ảnh phôi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cột 1: Chọn thẻ có sẵn trong kho */}
            <div className="p-4 rounded-2xl bg-stone-950/50 border border-stone-800 space-y-3">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-400" />
                <span>1. Chọn thẻ bài trong kho Poly Cards</span>
              </label>
              <select
                value={selectedSlug}
                onChange={(e) => {
                  setSelectedSlug(e.target.value);
                  setCustomFile(null);
                  setCustomPreviewUrl("");
                  setCompiledBuffer(null);
                  setErrorMessage(null);
                }}
                disabled={isCompiling}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs font-semibold focus:outline-none focus:border-amber-500 transition-colors"
              >
                {products.map((p) => (
                  <option key={p.id || p.slug} value={p.slug}>
                    {p.nameVi} ({p.nameEn}) - [{p.category}]
                  </option>
                ))}
              </select>

              {currentAnimal && (
                <div className="text-[11px] text-stone-400 space-y-1 bg-stone-900/60 p-3 rounded-xl border border-stone-800/80">
                  <div className="flex justify-between">
                    <span>Mã định danh:</span>
                    <span className="font-mono text-stone-200">{currentAnimal.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mã bộ in:</span>
                    <span className="font-mono text-amber-300">{currentAnimal.packCode || "Mặc định"}</span>
                  </div>
                  <div className="flex justify-between truncate">
                    <span>Target hiện tại:</span>
                    <span className="font-mono text-stone-300 truncate max-w-[200px]" title={currentAnimal.targetUrl}>
                      {currentAnimal.targetUrl ? currentAnimal.targetUrl.split("/").pop() : "Chưa có (.mind)"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Cột 2: Tải ảnh phôi mới tùy chỉnh */}
            <div className="p-4 rounded-2xl bg-stone-950/50 border border-stone-800 space-y-3">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-2">
                <Upload className="h-4 w-4 text-sky-400" />
                <span>Hoặc kéo thả ảnh phôi thẻ mới (.jpg / .png)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCustomFileChange(f);
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-700 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-stone-900/40 hover:bg-stone-900/80"
              >
                <ImageIcon className="h-6 w-6 text-stone-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-stone-300">
                  {customFile ? customFile.name : "Nhấp để chọn ảnh phôi xuất xưởng"}
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5">Hỗ trợ PNG, JPG, WebP độ phân giải cao</p>
              </div>
            </div>
          </div>

          {/* Vùng xem trước ảnh phôi & Thẩm định độ bám nét */}
          <div className="p-4.5 rounded-2xl bg-stone-950/70 border border-stone-800 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-36 h-52 sm:w-44 sm:h-64 rounded-xl overflow-hidden border border-stone-700 bg-stone-900 shrink-0 shadow-lg flex items-center justify-center">
              {activeImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeImageUrl}
                  alt="Ảnh phôi thẻ bài"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-3 text-stone-600 text-xs">
                  Chưa có ảnh phôi
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 w-full">
              <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-amber-400" />
                <span>Tiêu chuẩn nhận diện của Camera WebAR</span>
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Để camera nhận diện ngay lập tức khi người dùng lia máy vào thẻ in ngoài đời thực, ảnh phôi cần nhiều góc cạnh, chi tiết chữ hoặc hình minh họa có độ tương phản cao.
              </p>

              {/* Điểm chất lượng */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-bold text-stone-300">Độ bám nét (Tracking Quality):</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= featureScore
                          ? "fill-amber-400 text-amber-400"
                          : "fill-stone-800 text-stone-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-amber-400 ml-1">
                  {featureScore === 5 ? "Cực nhạy (Xuất sắc)" : featureScore === 4 ? "Tốt" : "Trung bình"}
                </span>
              </div>

              {/* Tiến trình biên dịch */}
              {isCompiling && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-amber-400">{compileStepText}</span>
                    <span className="text-stone-300 font-bold">{compileProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-300 rounded-full"
                      style={{ width: `${compileProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Kết quả sau khi biên dịch xong */}
              {compiledBuffer && !isCompiling && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Đã tạo tệp {selectedSlug || "target"}.mind ({compiledFileSizeKB} KB) thành công!</span>
                  </div>
                  <p className="text-[11px] text-emerald-400/90">
                    File nhị phân chứa tập hợp các vector điểm đặc trưng đa tỉ lệ, sẵn sàng tải về hoặc tải thẳng lên Cloudflare R2 CDN.
                  </p>
                </div>
              )}

              {/* Lỗi nếu có */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Thông báo đẩy R2 thành công */}
              {saveSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-center gap-2">
                  <Check className="h-4 w-4 text-sky-400 shrink-0" />
                  <span className="break-all">{saveSuccessMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-7 py-4 border-t border-stone-800 bg-stone-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {compiledBuffer ? (
              <>
                <button
                  type="button"
                  onClick={handleDownloadMindFile}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Download className="h-4 w-4 text-stone-400" />
                  <span>Tải Tệp .mind Về Máy</span>
                </button>

                <button
                  type="button"
                  onClick={handleUploadToR2}
                  disabled={isSavingToR2}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isSavingToR2 ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang Đẩy Lên R2...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="h-4 w-4" />
                      <span>Đẩy Lên R2 & Gán Vào Thẻ</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartCompile}
                disabled={isCompiling || !activeImageUrl}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
              >
                {isCompiling ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Đang Biên Dịch ({compileProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Bắt Đầu Biên Dịch .mind (1 Chạm)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
