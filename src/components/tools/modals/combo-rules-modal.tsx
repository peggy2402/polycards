"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  RefreshCw,
  Tag,
  ToggleLeft,
  ToggleRight,
  Layers,
  Percent,
  Banknote,
  AlertTriangle,
} from "lucide-react";
import { DbComboRule } from "@/types/animal";
import { formatVnd } from "@/lib/pricing";

interface ComboRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export function ComboRulesModal({ isOpen, onClose, onShowToast }: ComboRulesModalProps) {
  const [rules, setRules] = useState<DbComboRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingRule, setEditingRule] = useState<Partial<DbComboRule> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCombos = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/combos");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRules(json.data);
      }
    } catch {
      onShowToast("Không thể tải danh sách combo ưu đãi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCombos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleActive = async (rule: DbComboRule) => {
    try {
      const updated: DbComboRule = { ...rule, isActive: !rule.isActive };
      const res = await fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
        onShowToast(`Đã ${updated.isActive ? "bật" : "tắt"} combo "${rule.name}".`, "info");
      }
    } catch {
      onShowToast("Lỗi cập nhật trạng thái combo.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/combos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
        setDeleteConfirmId(null);
        onShowToast("Đã xóa combo ưu đãi thành công.", "success");
      }
    } catch {
      onShowToast("Lỗi khi xóa combo.", "error");
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editingRule.name?.trim()) return;

    try {
      setIsSaving(true);
      const payload: DbComboRule = {
        id: editingRule.id || `combo-${Date.now().toString(36)}`,
        name: editingRule.name.trim(),
        description: editingRule.description?.trim() || "",
        minPacksCount: Math.max(1, Number(editingRule.minPacksCount) || 1),
        discountType: editingRule.discountType || "percent",
        discountValue: Math.max(0, Number(editingRule.discountValue) || 0),
        scope: editingRule.scope || "all",
        isActive: editingRule.isActive !== undefined ? editingRule.isActive : true,
        priority: Number(editingRule.priority) || 10,
        badge: editingRule.badge?.trim() || "",
      };

      const res = await fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchCombos();
        setEditingRule(null);
        onShowToast(`Đã lưu cấu hình combo "${payload.name}" thành công!`, "success");
      } else {
        onShowToast("Lỗi lưu cấu hình combo.", "error");
      }
    } catch {
      onShowToast("Lỗi kết nối khi lưu combo.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="max-w-3xl w-full max-h-[92dvh] bg-stone-900 border-2 border-amber-400/50 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-stone-950/95 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Quản Lý Combo Ưu Đãi Động</h3>
              <p className="text-[11px] text-stone-400">
                Lưu trữ MongoDB • Tự động áp dụng combo tốt nhất khi mua nhiều bộ thẻ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setEditingRule({
                  name: "",
                  description: "",
                  minPacksCount: 2,
                  discountType: "percent",
                  discountValue: 10,
                  scope: "all",
                  isActive: true,
                  priority: rules.length + 1,
                  badge: "",
                })
              }
              className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Combo Mới</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nội dung danh sách combo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-stone-400">Đang tải cấu hình combo từ MongoDB...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white/5 border border-dashed border-white/10 p-6 space-y-2">
              <Layers className="h-10 w-10 text-stone-600 mx-auto" />
              <p className="text-xs text-stone-400">Chưa có combo ưu đãi nào trong cơ sở dữ liệu.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    rule.isActive
                      ? "bg-stone-950/80 border-amber-400/30 shadow-md"
                      : "bg-stone-950/40 border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 text-stone-300">
                          #{rule.priority}
                        </span>
                        <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                        {rule.badge && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            {rule.badge}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            rule.isActive
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-stone-800 text-stone-400"
                          }`}
                        >
                          {rule.isActive ? "Đang Bật" : "Đã Tắt"}
                        </span>
                      </div>

                      {rule.description && (
                        <p className="text-xs text-stone-400">{rule.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300 pt-1">
                        <span>
                          Mua từ: <strong className="text-amber-400">{rule.minPacksCount} bộ</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Mức giảm:{" "}
                          <strong className="text-emerald-400">
                            {rule.discountType === "percent"
                              ? `${rule.discountValue}%`
                              : formatVnd(rule.discountValue)}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Phạm vi:{" "}
                          <span className="text-stone-300 font-medium">
                            {rule.scope === "all" ? "Tất cả các bộ" : "Theo danh mục / bộ chỉ định"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(rule)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                        title={rule.isActive ? "Tắt combo" : "Bật combo"}
                      >
                        {rule.isActive ? (
                          <ToggleRight className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-stone-500" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRule(rule)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                        title="Sửa combo"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(rule.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Xóa combo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Xác nhận xóa */}
                  {deleteConfirmId === rule.id && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Bạn có chắc chắn muốn xóa combo này không?</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-stone-300 font-bold"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rule.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                        >
                          Xóa Ngay
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal chỉnh sửa / tạo mới */}
        {editingRule && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="max-w-md w-full bg-stone-900 border border-amber-400/50 rounded-2xl p-5 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h4 className="text-sm font-black text-white">
                  {editingRule.id ? "Sửa Cấu Hình Combo" : "Thêm Combo Ưu Đãi Mới"}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Tên gói combo *:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRule.name || ""}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    placeholder="VD: Siêu Combo Trọn Bộ 9-in-1"
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Số bộ tối thiểu:
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editingRule.minPacksCount || 2}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, minPacksCount: Number(e.target.value) || 1 })
                      }
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold font-mono focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Thứ tự ưu tiên:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingRule.priority || 1}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, priority: Number(e.target.value) || 1 })
                      }
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Hình thức giảm giá:
                    </label>
                    <select
                      value={editingRule.discountType || "percent"}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          discountType: e.target.value as "percent" | "fixed_amount",
                        })
                      }
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
                    >
                      <option value="percent">Giảm theo %</option>
                      <option value="fixed_amount">Giảm số tiền cố định (VNĐ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      {editingRule.discountType === "percent" ? "Mức giảm (%):" : "Mức giảm (VNĐ):"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={editingRule.discountType === "percent" ? 99 : undefined}
                      required
                      value={editingRule.discountValue || 0}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, discountValue: Number(e.target.value) || 0 })
                      }
                      className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold font-mono focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Badge nổi bật (tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={editingRule.badge || ""}
                    onChange={(e) => setEditingRule({ ...editingRule, badge: e.target.value })}
                    placeholder="VD: Tiết Kiệm 751K • Bản Giới Hạn"
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Mô tả ngắn:
                  </label>
                  <textarea
                    rows={2}
                    value={editingRule.description || ""}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    placeholder="Mô tả quà tặng hoặc ưu đãi đi kèm..."
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingRule(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 text-xs font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>{isSaving ? "Đang Lưu..." : "Lưu Combo"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

