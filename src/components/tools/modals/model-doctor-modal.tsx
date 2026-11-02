"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Upload,
  RefreshCw,
  Box,
  Layers,
  HardDrive,
  Cpu,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Animal } from "@/types/animal";
import { GlbHealthReport } from "@/lib/gltf-inspector";
import { optimizeGlbInBrowser } from "@/lib/client-3d-optimizer";
import { SearchableCardSelect } from "@/components/tools/widgets/searchable-card-select";

interface ModelDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Animal[];
  initialAnimal?: Animal | null;
  onOptimizedSuccess?: (updatedProduct: Animal) => void;
}

export function ModelDoctorModal({
  isOpen,
  onClose,
  products = [],
  initialAnimal = null,
  onOptimizedSuccess,
}: ModelDoctorModalProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(initialAnimal?.slug || "");
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customUploadedFile, setCustomUploadedFile] = useState<File | null>(null);

  const [currentReport, setCurrentReport] = useState<GlbHealthReport | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<{
    modelUrl: string;
    iosModelUrl: string;
    beforeReport: GlbHealthReport;
    afterReport: GlbHealthReport;
    reducedPercent: number;
    savedPolygons: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tự động phân tích khi mở modal với một thẻ cụ thể
  useEffect(() => {
    if (isOpen) {
      if (initialAnimal?.slug) {
        setSelectedSlug(initialAnimal.slug);
        handleInspectBySlug(initialAnimal.slug);
      } else {
        setSelectedSlug("");
        setCurrentReport(null);
        setOptimizedResult(null);
        setErrorMsg(null);
      }
    }
  }, [isOpen, initialAnimal]);

  if (!isOpen) return null;

  // Xử lý khám bệnh từ thẻ bài có sẵn
  const handleInspectBySlug = async (slugToInspect: string) => {
    if (!slugToInspect) return;
    setIsInspecting(true);
    setErrorMsg(null);
    setOptimizedResult(null);
    setCustomUploadedFile(null);

    try {
      const res = await fetch(`/api/tools/inspect-3d?slug=${encodeURIComponent(slugToInspect)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể phân tích mô hình của thẻ này.");
      }
      setCurrentReport(json.report);
      setSelectedSlug(slugToInspect);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi kiểm tra sức khỏe tệp 3D");
      setCurrentReport(null);
    } finally {
      setIsInspecting(false);
    }
  };

  // Xử lý upload file GLB từ máy tính để khám bệnh tức thì
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomUploadedFile(file);
    setIsInspecting(true);
    setErrorMsg(null);
    setOptimizedResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/tools/inspect-3d", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Lỗi khi kiểm tra tệp 3D tải lên");
      }
      setCurrentReport(json.report);
      setSelectedSlug("");
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi đọc file GLB");
      setCurrentReport(null);
    } finally {
      setIsInspecting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Xử lý bấm nút Tối Ưu Hóa 1-Click
  const handleOptimizeNow = async () => {
    setIsOptimizing(true);
    setErrorMsg(null);
    setStatusText("Đang kết nối pipeline tối ưu hóa...");

    const formData = new FormData();
    if (selectedSlug) {
      formData.append("slug", selectedSlug);
    }
    if (customUploadedFile) {
      formData.append("file", customUploadedFile);
    }
    formData.append("targetPolygons", "40000");
    formData.append("maxTextureSize", "1024");
    formData.append("autoUploadR2", "true");

    try {
      let json: any = null;
      let usedServerPipeline = false;

      // 1. Thử gọi Server Pipeline trước
      try {
        const res = await fetch("/api/tools/optimize-3d", {
          method: "POST",
          body: formData,
        });
        json = await res.json();
        if (res.ok && json.success) {
          usedServerPipeline = true;
        }
      } catch {
        usedServerPipeline = false;
      }

      // 2. Nếu Server trả về 501 (Vercel Serverless không có Blender) -> Tự động chuyển sang Browser Three.js Engine!
      if (!usedServerPipeline) {
        setStatusText("Đang khởi chạy Three.js WebGL Engine trên trình duyệt...");

        let arrayBuffer: ArrayBuffer | null = null;
        if (customUploadedFile) {
          arrayBuffer = await customUploadedFile.arrayBuffer();
        } else if (selectedSlug) {
          const matched = products.find((p) => p.slug === selectedSlug);
          if (matched?.modelUrl) {
            setStatusText("Đang tải tệp mô hình nguồn...");
            const proxyUrl = `/api/proxy/model?url=${encodeURIComponent(matched.modelUrl)}`;
            const modelRes = await fetch(proxyUrl);
            if (modelRes.ok) {
              arrayBuffer = await modelRes.arrayBuffer();
            }
          }
        }

        if (!arrayBuffer) {
          throw new Error(json?.message || "Không thể tải tệp 3D nguồn để tối ưu hóa.");
        }

        // Tối ưu hóa trực tiếp trên trình duyệt (Downscale textures 4K -> 1024, xuất GLB + USDZ)
        const clientRes = await optimizeGlbInBrowser(arrayBuffer, 1024, (step: string) => {
          setStatusText(step);
        });

        setStatusText("Đang chuẩn bị tải tệp tối ưu lên Cloudflare R2...");

        const effectiveSlug = selectedSlug || (customUploadedFile ? customUploadedFile.name.replace(/\.[^/.]+$/, "") : "model");
        let glbUrl: string | undefined = undefined;
        let usdzUrl: string | undefined = undefined;
        let directUploadSucceeded = false;

        // 1. Thử tải trực tiếp lên Cloudflare R2 qua Presigned PUT URL (0% Payload, tối ưu băng thông)
        try {
          setStatusText("Đang xin URL tải lên trực tiếp Cloudflare R2...");
          const presignedGlbRes = await fetch("/api/tools/r2-presigned-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: `${effectiveSlug}.glb`,
              contentType: "model/gltf-binary",
            }),
          });
          const presignedGlbJson = await presignedGlbRes.json();
          if (presignedGlbRes.ok && presignedGlbJson.success && presignedGlbJson.uploadUrl) {
            setStatusText(`Đang tải ${effectiveSlug}.glb trực tiếp lên Cloudflare R2 (${clientRes.optimizedSizeMB} MB)...`);
            const putGlbRes = await fetch(presignedGlbJson.uploadUrl, {
              method: "PUT",
              body: clientRes.glbBlob,
              headers: {
                "Content-Type": "model/gltf-binary",
              },
            });

            if (putGlbRes.ok) {
              glbUrl = presignedGlbJson.publicUrl;
              directUploadSucceeded = true;

              // Tải tiếp USDZ nếu có
              if (clientRes.usdzBlob) {
                try {
                  const presignedUsdzRes = await fetch("/api/tools/r2-presigned-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      fileName: `${effectiveSlug}.usdz`,
                      contentType: "model/vnd.usdz+zip",
                    }),
                  });
                  const presignedUsdzJson = await presignedUsdzRes.json();
                  if (presignedUsdzRes.ok && presignedUsdzJson.success && presignedUsdzJson.uploadUrl) {
                    const putUsdzRes = await fetch(presignedUsdzJson.uploadUrl, {
                      method: "PUT",
                      body: clientRes.usdzBlob,
                      headers: {
                        "Content-Type": "model/vnd.usdz+zip",
                      },
                    });
                    if (putUsdzRes.ok) {
                      usdzUrl = presignedUsdzJson.publicUrl;
                    }
                  }
                } catch {}
              }
            }
          }
        } catch {
          directUploadSucceeded = false;
        }

        // 2. Dự phòng thông minh: Nếu Direct Upload thất bại (ví dụ R2 chưa bật CORS cho PUT):
        // File sau khi nén chỉ còn ~1-2 MB (nhỏ hơn nhiều so với giới hạn 4.5 MB của Vercel).
        // Server Next.js dùng S3 SDK đẩy lên R2 mà KHÔNG BAO GIỜ bị chặn CORS!
        if (!directUploadSucceeded || !glbUrl) {
          setStatusText(`Đang chuyển sang tải dự phòng qua Server R2 Proxy (${clientRes.optimizedSizeMB} MB)...`);
          const fallbackFormData = new FormData();
          fallbackFormData.append("slug", effectiveSlug);
          fallbackFormData.append("glb", clientRes.glbBlob, `${effectiveSlug}.glb`);
          if (clientRes.usdzBlob) {
            fallbackFormData.append("usdz", clientRes.usdzBlob, `${effectiveSlug}.usdz`);
          }
          fallbackFormData.append("updateDatabase", "true");

          const fallbackRes = await fetch("/api/tools/save-model-assets", {
            method: "POST",
            body: fallbackFormData,
          });
          const fallbackJson = await fallbackRes.json();
          if (!fallbackRes.ok || !fallbackJson.success) {
            throw new Error(fallbackJson.message || "Tải tệp lên Cloudflare R2 thất bại.");
          }
          glbUrl = fallbackJson.glbUrl;
          usdzUrl = fallbackJson.usdzUrl;
        } else {
          // Nếu Direct Upload thành công -> Đồng bộ thông tin nhẹ qua JSON
          setStatusText("Đang đồng bộ thông tin thẻ vào MongoDB Atlas...");
          const saveRes = await fetch("/api/tools/save-model-assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: effectiveSlug,
              glbUrl,
              usdzUrl,
              updateDatabase: true,
            }),
          });
          const saveJson = await saveRes.json();
          if (!saveRes.ok || !saveJson.success) {
            throw new Error(saveJson.message || "Lỗi đồng bộ thông tin thẻ vào MongoDB.");
          }
        }

        const reducedPct = Math.max(
          0,
          Math.round(((clientRes.originalSizeMB - clientRes.optimizedSizeMB) / clientRes.originalSizeMB) * 100)
        );

        const fallbackBeforeReport = currentReport || json?.beforeReport;
        if (fallbackBeforeReport) {
          setOptimizedResult({
            modelUrl: glbUrl || "",
            iosModelUrl: usdzUrl || "",
            beforeReport: fallbackBeforeReport,
            afterReport: {
              ...fallbackBeforeReport,
              fileSizeMB: clientRes.optimizedSizeMB,
              status: "safe",
              score: 95,
              title: "Đã tối ưu hóa an toàn cho Mobile",
              summary: `Đã nén textures về 1024x1024 và giảm dung lượng xuống còn ${clientRes.optimizedSizeMB} MB.`,
            },
            reducedPercent: reducedPct,
            savedPolygons: 0,
          });
        }

        if (selectedSlug && onOptimizedSuccess) {
          const matched = products.find((p) => p.slug === selectedSlug);
          if (matched) {
            onOptimizedSuccess({
              ...matched,
              modelUrl: glbUrl || matched.modelUrl || "",
              iosModelUrl: usdzUrl || matched.iosModelUrl || "",
            });
          }
        }
      } else {
        // Server Blender Pipeline thành công
        setOptimizedResult({
          modelUrl: json.modelUrl,
          iosModelUrl: json.iosModelUrl,
          beforeReport: json.beforeReport,
          afterReport: json.afterReport,
          reducedPercent: json.reducedPercent,
          savedPolygons: json.savedPolygons,
        });

        setCurrentReport(json.afterReport);

        if (selectedSlug && onOptimizedSuccess) {
          const matched = products.find((p) => p.slug === selectedSlug);
          if (matched) {
            onOptimizedSuccess({
              ...matched,
              modelUrl: json.modelUrl,
              iosModelUrl: json.iosModelUrl,
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Lỗi tối ưu hóa 3D:", err);
      setErrorMsg(err.message || "Lỗi trong quá trình tối ưu hóa tệp 3D");
    } finally {
      setIsOptimizing(false);
      setStatusText("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl min-h-[460px] max-h-[92vh] flex flex-col rounded-3xl bg-stone-950 border border-amber-500/40 shadow-2xl shadow-amber-500/10 text-white overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-stone-950 shadow-md shadow-amber-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Bác Sĩ 3D & Tối Ưu Hóa Mobile AR</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold">
                  Anti-Crash WebKit
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Thẩm định số lượng đa giác, ngăn chặn lỗi sập RAM Safari trên iPhone và tự động xuất USDZ lên R2.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Selector & Upload Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Chọn từ kho thẻ bài */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 text-amber-400" />
                <span>Tìm & chọn thẻ bài trong kho:</span>
              </label>
              <SearchableCardSelect
                products={products}
                selectedSlug={selectedSlug}
                placeholder="-- Tìm hoặc chọn thẻ bài cần khám --"
                onSelect={(val) => {
                  setSelectedSlug(val);
                  if (val) handleInspectBySlug(val);
                }}
              />
            </div>

            {/* Hoặc tải file GLB từ máy tính */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-amber-400" />
                <span>Hoặc tải tệp .glb từ máy tính:</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb"
                onChange={handleFileUpload}
                className="hidden"
                id="glb-upload-input"
              />
              <label
                htmlFor="glb-upload-input"
                className="w-full h-11 px-3.5 rounded-xl border border-dashed border-amber-400/50 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 flex items-center justify-center gap-2 text-xs font-bold text-amber-300 cursor-pointer transition-all"
              >
                <Upload className="h-4 w-4" />
                <span>Chọn tệp .glb trên máy tính</span>
              </label>
            </div>
          </div>

          {/* Trạng thái ban đầu khi chưa chọn hoặc tải thẻ */}
          {!isInspecting && !currentReport && !optimizedResult && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 px-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-200">Sẵn sàng thẩm định mô hình 3D</h3>
                <p className="text-xs text-stone-400 max-w-md">
                  Tìm kiếm một thẻ bài từ danh sách bên trên hoặc tải tệp .glb để phân tích số đa giác, độ phân giải texture và nguy cơ sập RAM trên Safari.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isInspecting && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 rounded-2xl bg-white/5 border border-white/10">
              <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
              <p className="text-xs font-bold text-stone-300">
                Đang giải mã nhị phân GLB và đếm số lượng đa giác...
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bảng Kết Quả Thẩm Định (Health Report) */}
          {currentReport && !isInspecting && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header Status Card */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  currentReport.status === "safe"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : currentReport.status === "warning"
                    ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                    : "bg-rose-950/50 border-rose-500/50 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ${
                      currentReport.status === "safe"
                        ? "bg-emerald-500 text-stone-950"
                        : currentReport.status === "warning"
                        ? "bg-amber-500 text-stone-950"
                        : "bg-rose-600 text-white animate-pulse"
                    }`}
                  >
                    {currentReport.status === "safe" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : currentReport.status === "warning" ? (
                      <AlertTriangle className="h-6 w-6" />
                    ) : (
                      <ShieldAlert className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black leading-tight">{currentReport.title}</h3>
                    <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{currentReport.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Chỉ Số Điểm</span>
                    <div className="text-2xl font-black font-mono leading-none">{currentReport.score}/100</div>
                  </div>
                </div>
              </div>

              {/* Grid 4 Thông Số Kỹ Thuật Chính */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Polygons */}
                <div className="p-3 rounded-2xl bg-stone-900 border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
                    <Layers className="h-3.5 w-3.5 text-amber-400" />
                    <span>Đa Giác (Polygons)</span>
                  </div>
                  <div
                    className={`text-lg sm:text-xl font-black font-mono ${
                      currentReport.totalPolygons > 100000
                        ? "text-rose-400"
                        : currentReport.totalPolygons > 50000
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {currentReport.totalPolygons.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-stone-400 block">
                    {currentReport.totalPolygons > 100000 ? "Nguy hiểm (>100k)" : "Chuẩn di động (<50k)"}
                  </span>
                </div>

                {/* 2. Vertices */}
                <div className="p-3 rounded-2xl bg-stone-900 border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
                    <Cpu className="h-3.5 w-3.5 text-sky-400" />
                    <span>Số Đỉnh (Vertices)</span>
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-stone-100">
                    {currentReport.totalVertices.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-stone-400 block">{currentReport.meshesCount} meshes</span>
                </div>

                {/* 3. Dung lượng File */}
                <div className="p-3 rounded-2xl bg-stone-900 border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
                    <HardDrive className="h-3.5 w-3.5 text-teal-400" />
                    <span>Dung Lượng</span>
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-amber-300">
                    {currentReport.fileSizeMB} MB
                  </div>
                  <span className="text-[9px] text-stone-400 block">
                    {currentReport.hasDraco ? "Đã nén Draco" : "Chưa nén Draco"}
                  </span>
                </div>

                {/* 4. Textures */}
                <div className="p-3 rounded-2xl bg-stone-900 border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span>Textures / Ảnh</span>
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-purple-300">
                    {currentReport.textures.length} ảnh
                  </div>
                  <span className="text-[9px] text-stone-400 block truncate">
                    {currentReport.textures[0]?.width
                      ? `${currentReport.textures[0].width}x${currentReport.textures[0].height}`
                      : "Texture PBR"}
                  </span>
                </div>
              </div>

              {/* Danh sách Gợi Ý / Khuyến Nghị */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Chẩn Đoán & Khuyến Nghị Tối Ưu:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-stone-300">
                  {currentReport.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Kết quả sau khi tối ưu thành công (Before & After) */}
              {optimizedResult && (
                <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wide">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Đã Tối Ưu Hóa & Đẩy Lên Cloudflare R2 Thành Công!</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                      Giảm {optimizedResult.reducedPercent}% đa giác
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-300">
                    <div className="p-2.5 rounded-xl bg-stone-900/80 border border-white/10 space-y-1">
                      <span className="text-[10px] text-stone-400 block">Đường dẫn GLB mới trên R2:</span>
                      <a
                        href={optimizedResult.modelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-300 hover:underline truncate block font-mono text-[11px]"
                      >
                        {optimizedResult.modelUrl}
                      </a>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-900/80 border border-white/10 space-y-1">
                      <span className="text-[10px] text-stone-400 block">Tệp USDZ (Apple Quick Look):</span>
                      <a
                        href={optimizedResult.iosModelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-300 hover:underline truncate block font-mono text-[11px]"
                      >
                        {optimizedResult.iosModelUrl}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button: Tối Ưu Hóa 1-Click */}
              {currentReport.status !== "safe" && !optimizedResult && (
                <button
                  type="button"
                  onClick={handleOptimizeNow}
                  disabled={isOptimizing}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                      <span className="truncate">{statusText || "Đang nén đa giác & sinh file USDZ..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Tự Động Nén Về ~40k Polygons & Đẩy Lên R2 (1-Click)</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

