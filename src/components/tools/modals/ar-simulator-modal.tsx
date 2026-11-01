"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  X,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  RefreshCw,
  QrCode,
  ExternalLink,
  Sparkles,
  ScanLine,
  ShieldCheck,
  RotateCcw,
  Box,
} from "lucide-react";
import { Animal } from "@/types/animal";
import { SearchableCardSelect } from "@/components/tools/widgets/searchable-card-select";

interface PreflightCheckItem {
  id: string;
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  url?: string;
}

interface PreflightData {
  checks: PreflightCheckItem[];
  score: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  isReadyForPrint: boolean;
  qrUrl: string;
}

interface ArSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Animal[];
  initialAnimal?: Animal | null;
  onOpenDoctorModal?: (card: Animal) => void;
  onOpenTargetModal?: (card: Animal) => void;
}

export function ArSimulatorModal({
  isOpen,
  onClose,
  products,
  initialAnimal,
  onOpenDoctorModal,
  onOpenTargetModal,
}: ArSimulatorModalProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"simulator" | "preflight">("simulator");
  const [preflightData, setPreflightData] = useState<PreflightData | null>(null);
  const [isLoadingPreflight, setIsLoadingPreflight] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [playingLang, setPlayingLang] = useState<string | null>(null);

  // Khởi tạo thẻ ban đầu
  useEffect(() => {
    if (initialAnimal) {
      setSelectedSlug(initialAnimal.slug);
    } else if (products.length > 0 && !selectedSlug) {
      setSelectedSlug(products[0].slug);
    }
  }, [initialAnimal, products]);

  const currentAnimal = products.find((p) => p.slug === selectedSlug) || null;

  // Gọi API thẩm định khi đổi thẻ hoặc đổi tab
  useEffect(() => {
    if (!isOpen || !selectedSlug) return;

    let isMounted = true;
    setIsLoadingPreflight(true);

    fetch(`/api/tools/preflight-card?slug=${selectedSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setPreflightData({
            checks: data.checks,
            score: data.score,
            passCount: data.passCount,
            warnCount: data.warnCount,
            failCount: data.failCount,
            isReadyForPrint: data.isReadyForPrint,
            qrUrl: data.qrUrl,
          });

          // Sinh ảnh QR code trực quan
          QRCode.toDataURL(data.qrUrl, {
            width: 280,
            margin: 1.5,
            color: { dark: "#0f172a", light: "#ffffff" },
          }).then((url) => {
            if (isMounted) setQrDataUrl(url);
          });
        }
      })
      .catch((err) => console.error("Lỗi gọi preflight API:", err))
      .finally(() => {
        if (isMounted) setIsLoadingPreflight(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedSlug]);

  if (!isOpen) return null;

  // Phát âm thanh
  const playAudio = (url?: string, langKey?: string) => {
    if (!url) return;
    try {
      const audio = new Audio(url);
      setPlayingLang(langKey || "audio");
      audio.play().catch(() => {});
      audio.onended = () => setPlayingLang(null);
    } catch {
      setPlayingLang(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4.5 border-b border-stone-800 bg-stone-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-stone-950">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-stone-100">Virtual AR Simulator & QR Validator</h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Pre-flight QA
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Giả lập Camera AR & Thẩm định tiêu chuẩn xuất xưởng 100% trước khi gửi in
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

        {/* Thanh chọn thẻ & chuyển Tab */}
        <div className="px-5 sm:px-7 py-3 border-b border-stone-800 bg-stone-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchableCardSelect
              products={products}
              selectedSlug={selectedSlug}
              placeholder="-- Tìm hoặc chọn thẻ cần thẩm định --"
              onSelect={(slugVal) => setSelectedSlug(slugVal)}
            />
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 rounded-xl bg-stone-800/80 border border-stone-700/60">
            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "simulator"
                  ? "bg-sky-500 text-stone-950 shadow-md"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Giả Lập Camera AR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preflight")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "preflight"
                  ? "bg-sky-500 text-stone-950 shadow-md"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Thẩm Định Xuất Xưởng</span>
              {preflightData && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    preflightData.isReadyForPrint
                      ? "bg-emerald-500/30 text-emerald-300"
                      : "bg-amber-500/30 text-amber-300"
                  }`}
                >
                  {preflightData.score}%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Nội dung Modal */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {activeTab === "simulator" ? (
            /* TAB 1: GIẢ LẬP AR CAMERA & 3D VIEWPORT */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Cột trái: Khung giả lập màn hình điện thoại */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="relative w-[280px] sm:w-[320px] h-[520px] rounded-[36px] border-4 border-stone-700 bg-stone-950 overflow-hidden shadow-2xl flex flex-col">
                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-stone-900 z-20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-950 ml-auto mr-2" />
                  </div>

                  {/* Vùng Render 3D Model qua iframe WebAR */}
                  <div className="flex-1 w-full h-full relative bg-radial from-stone-800 to-stone-950">
                    {currentAnimal?.modelUrl ? (
                      <iframe
                        src={`/ar/${currentAnimal.slug}?ar=1`}
                        title="WebAR Simulator"
                        className="w-full h-full border-0"
                        allow="camera; microphone; accelerometer; gyroscope"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 text-xs p-4 text-center">
                        <Box className="h-10 w-10 text-stone-600 mb-2" />
                        <span>Chưa có liên kết mô hình 3D</span>
                      </div>
                    )}

                    {/* Lớp Overlay HUD điều khiển nhỏ */}
                    <div className="absolute bottom-3 left-3 right-3 bg-stone-950/70 backdrop-blur-md rounded-2xl p-2.5 border border-stone-800 text-[11px] text-stone-300 flex items-center justify-between pointer-events-none">
                      <div>
                        <div className="font-bold text-stone-100">{currentAnimal?.nameVi}</div>
                        <div className="text-[10px] text-amber-400 font-mono">{currentAnimal?.nameEn}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        60 FPS
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 mt-2.5">
                  Màn hình giả lập tỷ lệ chuẩn iPhone 16 Pro Max (19.5:9)
                </p>
              </div>

              {/* Cột phải: Bảng điều khiển kiểm thử âm thanh & thông số */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-2xl bg-stone-950/50 border border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-300 flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-sky-400" />
                    <span>Thử nghiệm giọng đọc 3 ngôn ngữ</span>
                  </h4>

                  <div className="space-y-2">
                    {/* Tiếng Anh */}
                    <button
                      type="button"
                      onClick={() => playAudio(currentAnimal?.audios?.en || currentAnimal?.audioUrl, "en")}
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        playingLang === "en"
                          ? "bg-sky-500/20 border-sky-400 text-sky-200"
                          : "bg-stone-900 border-stone-700/80 hover:bg-stone-800 text-stone-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sky-400">EN</span>
                        <span>{currentAnimal?.nameEn || "English"}</span>
                        {currentAnimal?.ipa && (
                          <span className="text-[10px] text-stone-400 font-mono">/{currentAnimal.ipa}/</span>
                        )}
                      </div>
                      <Volume2 className={`h-3.5 w-3.5 ${playingLang === "en" ? "animate-pulse text-sky-400" : ""}`} />
                    </button>

                    {/* Tiếng Việt */}
                    <button
                      type="button"
                      onClick={() => playAudio(currentAnimal?.audios?.vi || currentAnimal?.audioUrl, "vi")}
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        playingLang === "vi"
                          ? "bg-amber-500/20 border-amber-400 text-amber-200"
                          : "bg-stone-900 border-stone-700/80 hover:bg-stone-800 text-stone-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">VI</span>
                        <span>{currentAnimal?.nameVi || "Tiếng Việt"}</span>
                      </div>
                      <Volume2 className={`h-3.5 w-3.5 ${playingLang === "vi" ? "animate-pulse text-amber-400" : ""}`} />
                    </button>

                    {/* Tiếng Trung */}
                    <button
                      type="button"
                      onClick={() => playAudio(currentAnimal?.audios?.zh || currentAnimal?.audioUrl, "zh")}
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        playingLang === "zh"
                          ? "bg-rose-500/20 border-rose-400 text-rose-200"
                          : "bg-stone-900 border-stone-700/80 hover:bg-stone-800 text-stone-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-400">ZH</span>
                        <span>{currentAnimal?.nameZh || "中文"}</span>
                        {currentAnimal?.pinyinZh && (
                          <span className="text-[10px] text-stone-400 font-mono">({currentAnimal.pinyinZh})</span>
                        )}
                      </div>
                      <Volume2 className={`h-3.5 w-3.5 ${playingLang === "zh" ? "animate-pulse text-rose-400" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Liên kết & Tệp 3D trên R2 */}
                <div className="p-4 rounded-2xl bg-stone-950/50 border border-stone-800 space-y-2.5 text-xs">
                  <h4 className="font-bold text-stone-300 flex items-center gap-2">
                    <Box className="h-4 w-4 text-emerald-400" />
                    <span>Tài nguyên mô hình 3D trên R2 CDN</span>
                  </h4>
                  <div className="space-y-1.5 text-[11px] text-stone-400">
                    <div className="flex justify-between items-center bg-stone-900/60 p-2 rounded-xl">
                      <span className="font-semibold text-stone-300">Android & Web:</span>
                      <span className="font-mono text-emerald-400 truncate max-w-[180px]">
                        {currentAnimal?.modelUrl?.split("/").pop() || "Chưa có"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-stone-900/60 p-2 rounded-xl">
                      <span className="font-semibold text-stone-300">Apple Quick Look:</span>
                      <span className="font-mono text-sky-400 truncate max-w-[180px]">
                        {currentAnimal?.iosModelUrl?.split("/").pop() || "Chưa có"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-stone-900/60 p-2 rounded-xl">
                      <span className="font-semibold text-stone-300">Target .mind:</span>
                      <span className="font-mono text-amber-400 truncate max-w-[180px]">
                        {currentAnimal?.targetUrl?.split("/").pop() || "Chưa có"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thao tác chuyển nhanh */}
                <div className="flex flex-col gap-2 pt-1">
                  {onOpenDoctorModal && currentAnimal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDoctorModal(currentAnimal);
                      }}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                      <span>Khám Đa Giác & Tối Ưu RAM Safari</span>
                    </button>
                  )}

                  {onOpenTargetModal && currentAnimal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTargetModal(currentAnimal);
                      }}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ScanLine className="h-3.5 w-3.5 text-amber-400" />
                      <span>Biên Dịch Target .mind Bám Nét</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: THẨM ĐỊNH TIÊU CHUẨN XUẤT XƯỞNG (PRE-FLIGHT QA) */
            <div className="space-y-6">
              {/* Thẻ trạng thái tổng quát */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  preflightData?.isReadyForPrint
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      preflightData?.isReadyForPrint ? "bg-emerald-500 text-stone-950" : "bg-amber-500 text-stone-950"
                    }`}
                  >
                    {preflightData?.isReadyForPrint ? (
                      <CheckCircle2 className="h-7 w-7" />
                    ) : (
                      <AlertTriangle className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black">
                      {preflightData?.isReadyForPrint
                        ? "100% ĐẠT CHUẨN XUẤT XƯỞNG - SẴN SÀNG IN THẺ"
                        : `CẦN HOÀN THIỆN (${preflightData?.passCount || 0}/${preflightData?.checks.length || 6} TIÊU CHÍ)`}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      {preflightData?.isReadyForPrint
                        ? "Thẻ đáp ứng đầy đủ yêu cầu: Model tối ưu nhẹ, USDZ cho iPhone, Target bám dính tốt và mã mở khóa hợp lệ."
                        : "Một số tệp hoặc thuộc tính cần được tối ưu hoặc cấu hình bổ sung trước khi in hàng loạt."}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-black font-mono">
                    {preflightData ? `${preflightData.score}%` : "--"}
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">Readiness Score</div>
                </div>
              </div>

              {/* Danh sách 6 Tiêu Chí Xuất Xưởng */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-300">Chi tiết bảng kiểm tra chất lượng (Quality Checklist):</h4>

                {isLoadingPreflight ? (
                  <div className="py-12 flex flex-col items-center justify-center text-stone-500 text-xs gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
                    <span>Đang thẩm định kết nối và cấu trúc dữ liệu...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {preflightData?.checks.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-start gap-3"
                      >
                        <div className="mt-0.5 shrink-0">
                          {item.status === "pass" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                          {item.status === "warn" && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                          {item.status === "fail" && <XCircle className="h-4 w-4 text-rose-400" />}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-200">{item.name}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md uppercase font-bold ${
                                item.status === "pass"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : item.status === "warn"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 leading-snug">{item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vùng xem trước mã QR in xưởng */}
              {qrDataUrl && (
                <div className="p-4.5 rounded-2xl bg-stone-950/60 border border-stone-800 flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-32 h-32 bg-white rounded-xl p-2 shrink-0 shadow-md flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="Mã QR in thẻ" className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-2 text-xs flex-1">
                    <h4 className="font-bold text-stone-200 flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-sky-400" />
                      <span>Đường dẫn quét QR in trên phôi thẻ bài:</span>
                    </h4>
                    <p className="font-mono text-[11px] text-sky-300 bg-stone-900 p-2 rounded-xl border border-stone-800 break-all select-all">
                      {preflightData?.qrUrl}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Khi in lên thẻ, người dùng quét mã này bằng điện thoại sẽ lập tức được tự động kích hoạt mã bộ bản quyền và chuyển hướng mượt mà vào WebAR.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-t border-stone-800 bg-stone-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2.5">
            {currentAnimal && (
              <a
                href={`/ar/${currentAnimal.slug}?ar=1${currentAnimal.packCode ? `&code=${currentAnimal.packCode}` : ""}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-stone-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <span>Mở Thẻ Thực Tế</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
