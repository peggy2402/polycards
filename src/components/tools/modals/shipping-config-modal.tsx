"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  X,
  Save,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  Layers,
  Banknote,
  Info,
  Sliders,
} from "lucide-react";
import {
  ShippingConfig,
  DEFAULT_SHIPPING_CONFIG,
  ShippingFreeshipCondition,
  computeShippingFee,
} from "@/types/shipping";
import { formatVndCurrency } from "@/lib/formatters";

interface ShippingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export function ShippingConfigModal({
  isOpen,
  onClose,
  onShowToast,
}: ShippingConfigModalProps) {
  const [config, setConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // State cho bộ mô phỏng (Simulator Preview)
  const [testPacksCount, setTestPacksCount] = useState<number>(1);
  const [testSubtotal, setTestSubtotal] = useState<number>(300000);

  // Tải cấu hình từ API
  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/shipping/config");
      const json = await res.json();
      if (json.success && json.data) {
        setConfig(json.data);
      }
    } catch {
      onShowToast("Không thể tải cấu hình phí vận chuyển.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Xử lý lưu cấu hình
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch("/api/shipping/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json.success) {
        onShowToast("Đã lưu cấu hình phí vận chuyển thành công!", "success");
        if (json.data) setConfig(json.data);
      } else {
        onShowToast(json.message || "Lỗi lưu cấu hình.", "error");
      }
    } catch {
      onShowToast("Lỗi kết nối khi lưu cấu hình phí vận chuyển.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Khôi phục mặc định
  const handleResetDefault = () => {
    setConfig({
      ...DEFAULT_SHIPPING_CONFIG,
      updatedAt: new Date().toISOString(),
    });
    onShowToast("Đã đưa thông số về chính sách mặc định (Mua từ 2 bộ Freeship).", "info");
  };

  // Kết quả thử nghiệm Simulator
  const previewResult = computeShippingFee(testPacksCount, testSubtotal, config);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-stone-900 border-2 border-amber-400/60 shadow-2xl shadow-amber-500/10 text-white overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400 border border-amber-400/30 shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Cấu Hình Phí Vận Chuyển
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  MongoDB Cloud
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                Quản lý phí giao hàng cố định &amp; điều kiện Miễn Phí Vận Chuyển (Freeship).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nội dung Form Cuộn */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
              <p className="text-xs font-semibold text-stone-400">Đang đồng bộ cấu hình từ database...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} id="shipping-form" className="space-y-6">
              {/* 1. Kích hoạt tính năng */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-stone-950/70">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-black text-white block">
                    Bật chính sách phí vận chuyển
                  </span>
                  <span className="text-[11px] text-stone-400 font-medium">
                    Nếu tắt, tất cả đơn hàng đều tự động tính là 0 ₫ (Freeship toàn quốc).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    config.enabled ? "bg-amber-400" : "bg-stone-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-stone-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                      config.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 2. Mức phí vận chuyển tiêu chuẩn */}
              <div className="space-y-2">
                <label className="text-xs font-black text-stone-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-amber-400" />
                    <span>Mức phí vận chuyển tiêu chuẩn (VNĐ) *</span>
                  </span>
                  <span className="text-amber-400 font-mono font-black text-xs">
                    {formatVndCurrency(config.standardFee)}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    required
                    value={config.standardFee === 0 ? "" : config.standardFee}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                      setConfig((prev) => ({ ...prev, standardFee: Math.max(0, val) }));
                    }}
                    placeholder="30000"
                    className="w-full rounded-2xl border border-white/10 bg-stone-950 px-4 py-2.5 text-sm font-black text-white focus:border-amber-400 focus:outline-hidden transition-all font-mono"
                  />
                  <div className="flex gap-1.5 shrink-0">
                    {[0, 25000, 30000, 35000].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, standardFee: fee }))}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          config.standardFee === fee
                            ? "bg-amber-400 text-stone-950 border-amber-400 font-black shadow-xs"
                            : "bg-stone-950 border-white/10 text-stone-400 hover:text-white hover:bg-stone-800"
                        }`}
                      >
                        {fee === 0 ? "0 đ" : `${fee / 1000}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Lựa chọn Quy tắc Miễn phí vận chuyển (Freeship Rules) */}
              <div className="space-y-3">
                <label className="text-xs font-black text-stone-200 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Quy tắc Miễn Phí Vận Chuyển (Freeship)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option: Theo số bộ thẻ */}
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, condition: "min_packs" }))}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      config.condition === "min_packs"
                        ? "border-amber-400 bg-amber-400/10 text-white shadow-sm ring-1 ring-amber-400/40"
                        : "border-white/10 bg-stone-950/70 text-stone-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-black text-white">Theo Số Bộ Thẻ</span>
                      {config.condition === "min_packs" && (
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400 font-medium leading-relaxed">
                      Đơn từ {config.minPacksCount} bộ trở lên thì Freeship, dưới {config.minPacksCount} bộ tính phí.
                    </span>
                  </button>

                  {/* Option: Theo giá trị đơn */}
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, condition: "min_amount" }))}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      config.condition === "min_amount"
                        ? "border-amber-400 bg-amber-400/10 text-white shadow-sm ring-1 ring-amber-400/40"
                        : "border-white/10 bg-stone-950/70 text-stone-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-black text-white">Theo Giá Trị Đơn</span>
                      {config.condition === "min_amount" && (
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400 font-medium leading-relaxed">
                      Đơn từ {formatVndCurrency(config.minOrderAmount)} trở lên thì Freeship.
                    </span>
                  </button>

                  {/* Option: Luôn luôn miễn phí */}
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, condition: "always_free" }))}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      config.condition === "always_free"
                        ? "border-amber-400 bg-amber-400/10 text-white shadow-sm ring-1 ring-amber-400/40"
                        : "border-white/10 bg-stone-950/70 text-stone-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-black text-white">Freeship Mọi Đơn</span>
                      {config.condition === "always_free" && (
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400 font-medium leading-relaxed">
                      Miễn phí 100% không giới hạn số lượng và giá trị đơn hàng.
                    </span>
                  </button>
                </div>

                {/* Chi tiết điều kiện bổ sung tương ứng */}
                {config.condition === "min_packs" && (
                  <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between gap-3 animate-in fade-in">
                    <div>
                      <span className="text-xs font-black text-amber-300 block">
                        Số bộ thẻ tối thiểu để được FREESHIP:
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">
                        (Khách mua ít hơn số này sẽ cộng thêm {formatVndCurrency(config.standardFee)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={config.minPacksCount}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            minPacksCount: Math.max(1, Number(e.target.value) || 1),
                          }))
                        }
                        className="w-16 rounded-xl border border-amber-400/40 bg-stone-950 px-2.5 py-1.5 text-center font-black text-sm text-amber-300 focus:outline-hidden"
                      />
                      <span className="text-xs font-bold text-stone-300">bộ</span>
                    </div>
                  </div>
                )}

                {config.condition === "min_amount" && (
                  <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between gap-3 animate-in fade-in">
                    <div>
                      <span className="text-xs font-black text-amber-300 block">
                        Tổng tiền hàng tối thiểu để được FREESHIP:
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">
                        (Đơn hàng dưới mức này sẽ tính thêm {formatVndCurrency(config.standardFee)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={config.minOrderAmount}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            minOrderAmount: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="w-32 rounded-xl border border-amber-400/40 bg-stone-950 px-2.5 py-1.5 text-right font-black text-sm text-amber-300 focus:outline-hidden font-mono"
                      />
                      <span className="text-xs font-bold text-stone-300">₫</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Nhãn hiển thị & Ghi chú */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-black text-stone-200 mb-1.5 block">
                    Nhãn hiển thị khi Freeship:
                  </label>
                  <input
                    type="text"
                    value={config.freeshipLabel}
                    onChange={(e) => setConfig((prev) => ({ ...prev, freeshipLabel: e.target.value }))}
                    placeholder="FREESHIP"
                    className="w-full rounded-2xl border border-white/10 bg-stone-950 px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-stone-200 mb-1.5 block">
                    Ghi chú cam kết giao hàng:
                  </label>
                  <input
                    type="text"
                    value={config.shippingNote}
                    onChange={(e) => setConfig((prev) => ({ ...prev, shippingNote: e.target.value }))}
                    placeholder="Giao hàng nhanh 2–3 ngày, kiểm tra trước khi nhận"
                    className="w-full rounded-2xl border border-white/10 bg-stone-950 px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 5. KHỐI MÔ PHỎNG TRỰC QUAN (LIVE SIMULATOR) */}
              <div className="p-4 rounded-2xl border border-white/10 bg-stone-950/80 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-black text-white">
                      Mô Phỏng Trực Quan Cho Khách Hàng (Live Simulator)
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Thử nghiệm kết quả thực tế
                  </span>
                </div>

                {/* Bộ điều khiển thử nghiệm */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 block mb-1">
                      Giả lập số bộ trong giỏ:
                    </span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setTestPacksCount(count)}
                          className={`flex-1 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                            testPacksCount === count
                              ? "bg-amber-400 text-stone-950 border-amber-400 shadow-xs"
                              : "bg-stone-900 text-stone-400 border-white/10 hover:text-white hover:bg-stone-800"
                          }`}
                        >
                          {count} bộ
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-stone-400 block mb-1">
                      Giả lập tạm tính đơn:
                    </span>
                    <input
                      type="number"
                      step={50000}
                      value={testSubtotal}
                      onChange={(e) => setTestSubtotal(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full rounded-lg border border-white/10 bg-stone-900 px-2 py-1 text-xs font-bold text-white font-mono"
                    />
                  </div>
                </div>

                {/* Kết quả mô phỏng khách nhìn thấy */}
                <div className="p-3 rounded-xl bg-stone-900 border border-white/10 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-stone-300">Phí vận chuyển khách thanh toán:</span>
                    <div className="flex items-center gap-1.5 font-black">
                      {previewResult.isFree ? (
                        <>
                          <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {previewResult.label}
                          </span>
                          <span className="text-emerald-400 font-mono">0 ₫</span>
                        </>
                      ) : (
                        <span className="text-amber-300 font-mono font-black text-sm">
                          +{formatVndCurrency(previewResult.fee)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400 font-medium">
                    • Giải thích: {previewResult.reason}
                  </p>

                  {previewResult.upsellPrompt && (
                    <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>{previewResult.upsellPrompt}</span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 bg-stone-950/60">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3.5 py-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
          >
            Khôi phục mặc định
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="shipping-form"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Lưu Cấu Hình</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

