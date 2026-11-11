"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Save,
  RotateCcw,
  Key,
  Cpu,
  Eye,
  EyeOff,
  Send,
  HelpCircle,
  Check,
  AlertTriangle,
  Play,
  Clock,
  Layers,
  MessageSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { AiChatConfig, AiProvider } from "@/types/ai";
import { DEFAULT_AI_CONFIG } from "@/lib/ai-defaults";

interface AiTabProps {
  onShowToast: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export function AiTab({ onShowToast }: AiTabProps) {
  const [config, setConfig] = useState<AiChatConfig>(DEFAULT_AI_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [newQuestionInput, setNewQuestionInput] = useState<string>("");

  // Live Test Chat State
  const [testMessages, setTestMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        "Xin chào! Đây là Sandbox kiểm thử Trợ lý AI PolyCards. Bạn hãy thử gõ câu hỏi (ví dụ: 'Giá combo thẻ bao nhiêu?', 'Cách quét thẻ AR') để kiểm tra phản hồi theo System Prompt nhé!",
    },
  ]);
  const [testInput, setTestInput] = useState<string>("");
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Tải cấu hình từ API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch("/api/ai/config")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.config) {
          setConfig(data.config);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải cấu hình AI:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Lưu cấu hình
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Lỗi lưu cấu hình AI");
      }

      onShowToast("Đã lưu cấu hình và System Prompt cho Trợ lý AI thành công!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi lưu cấu hình";
      onShowToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Nạp System Prompt mặc định
  const handleLoadDefaultPrompt = () => {
    setConfig((prev) => ({
      ...prev,
      systemPrompt: DEFAULT_AI_CONFIG.systemPrompt,
      fallbackMessage: DEFAULT_AI_CONFIG.fallbackMessage,
      quickQuestions: DEFAULT_AI_CONFIG.quickQuestions,
    }));
    onShowToast("Đã nạp lại bộ System Prompt chuẩn PolyCards!", "info");
  };

  // Thêm câu hỏi nhanh
  const handleAddQuestion = () => {
    const q = newQuestionInput.trim();
    if (!q) return;
    if (config.quickQuestions.includes(q)) {
      onShowToast("Câu hỏi này đã tồn tại trong danh sách.", "warning");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      quickQuestions: [...prev.quickQuestions, q],
    }));
    setNewQuestionInput("");
  };

  // Xóa câu hỏi nhanh
  const handleRemoveQuestion = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      quickQuestions: prev.quickQuestions.filter((_, i) => i !== idx),
    }));
  };

  // Gửi tin nhắn thử nghiệm Sandbox
  const handleSendTest = async () => {
    const text = testInput.trim();
    if (!text || isTesting) return;

    setTestInput("");
    const newChat = [...testMessages, { role: "user" as const, content: text }];
    setTestMessages(newChat);
    setIsTesting(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newChat,
        }),
      });

      const data = await res.json();
      setTestMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message || "Không nhận được phản hồi từ mô hình.",
        },
      ]);
    } catch {
      setTestMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Lỗi kết nối tới API kiểm thử.",
        },
      ]);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Bot className="h-8 w-8 text-amber-400 animate-bounce mx-auto" />
        <p className="text-xs font-bold text-stone-400">Đang tải cấu hình Trợ lý AI PolyCards...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Tab & Nút Lưu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-900/80 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 font-black shadow-md">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">Cấu Hình & Huấn Luyện Trợ Lý AI PolyCards</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${config.enabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-stone-800 text-stone-400"}`}>
                {config.enabled ? "Đang Bật" : "Đã Tắt"}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Cài đặt System Prompt, tích hợp Model AI (Gemini, Groq), tinh chỉnh câu hỏi thường gặp và cơ chế phản hồi thông minh.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDefaultPrompt}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Nạp lại prompt mẫu chuẩn của PolyCards"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Nạp Prompt Chuẩn</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Đang Lưu..." : "Lưu Cấu Hình"}</span>
          </button>
        </div>
      </div>

      {/* 2. Grid Cấu hình Chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (8 CỘT): Cấu hình System Prompt & Nhà cung cấp */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card A: Kích hoạt & Provider AI */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-black text-amber-300 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-amber-400" />
                <span>1. Nhà Cung Cấp Model AI (Provider & API Key)</span>
              </span>

              {/* Toggle Kích Hoạt */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-300">
                <span>Bật Chatbot:</span>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Chọn Provider */}
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Nền tảng AI:
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => {
                    const prov = e.target.value as AiProvider;
                    let defaultModel = "gemini-2.0-flash";
                    if (prov === "groq") defaultModel = "llama-3.3-70b-versatile";
                    setConfig((prev) => ({ ...prev, provider: prov, model: defaultModel }));
                  }}
                  className="w-full bg-stone-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-hidden focus:border-amber-400"
                >
                  <option value="gemini">Google Gemini (Khuyên dùng - Miễn phí)</option>
                  <option value="groq">Groq Cloud (Llama 3.3 - Cực nhanh)</option>
                  <option value="fallback">Chế độ Fallback Thông Minh (Không cần Key)</option>
                </select>
              </div>

              {/* Tên Model */}
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Tên Model:
                </label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="gemini-2.0-flash, gemini-1.5-flash..."
                  className="w-full bg-stone-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* Nhiệt độ Temperature */}
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Độ sáng tạo (Temperature): {config.temperature}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={config.temperature}
                  onChange={(e) => setConfig((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Ô Nhập API Key (Nếu chọn Gemini hoặc Groq) */}
            {config.provider !== "fallback" && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-300 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-amber-400" />
                    <span>API Key {config.provider === "gemini" ? "Google AI Studio" : "Groq Cloud"}:</span>
                  </label>
                  <span className="text-[10px] text-stone-400">
                    {config.provider === "gemini" ? "Nhận Key miễn phí tại aistudio.google.com" : "Nhận Key miễn phí tại console.groq.com"}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={config.apiKey || ""}
                    onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder={config.provider === "gemini" ? "AIzaSy..." : "gsk_..."}
                    className="w-full bg-stone-950 border border-white/15 rounded-xl pl-3 pr-10 py-2 text-xs font-mono text-amber-200 focus:outline-hidden focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card B: SYSTEM PROMPT (Huấn Luyện AI) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black text-amber-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>2. Huấn Luyện AI (System Prompt & Persona)</span>
              </span>
              <span className="text-[10px] text-stone-400">
                Được nạp trực tiếp trước mọi phiên hội thoại
              </span>
            </div>

            <div>
              <p className="text-[11px] text-stone-400 mb-2 leading-relaxed">
                Định nghĩa vai trò, giọng điệu tư vấn, chính sách đổi trả và quy tắc bán hàng. Hệ thống sẽ tự động ghép thêm bảng giá các Combo thẻ và danh mục sản phẩm thời gian thực vào sau nội dung này.
              </p>
              <textarea
                rows={12}
                value={config.systemPrompt}
                onChange={(e) => setConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="Nhập System Prompt huấn luyện cho AI..."
                className="w-full bg-stone-950 border border-white/15 rounded-xl p-3 text-xs font-mono text-stone-200 leading-relaxed focus:outline-hidden focus:border-amber-400"
              />
            </div>

            {/* Thông báo dữ liệu tự động nhúng */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Tự Động Nhúng Dữ Liệu Thời Gian Thực:</span>
              </div>
              <p className="text-stone-400 leading-snug">
                Hệ thống tự động nạp bảng giá mới nhất của các gói Siêu Combo 9-in-1, Combo VIP 4-in-1 và toàn bộ thẻ bài trong database vào ngữ cảnh của Bot. Bot sẽ luôn trả lời đúng giá mà không cần cập nhật thủ công.
              </p>
            </div>
          </div>

          {/* Card C: Phản hồi dự phòng khi lỗi (Fallback Message) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>3. Câu Trả Lời Khéo Léo Khi Server Gặp Sự Cố (Fallback)</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Nếu dịch vụ AI bên ngoài bị ngắt kết nối, hết hạn mức hoặc gặp lỗi mạng, bot sẽ tự động trả lời khéo léo theo nội dung này mà không bao giờ hiện thông báo lỗi kỹ thuật thô:
            </p>
            <textarea
              rows={3}
              value={config.fallbackMessage}
              onChange={(e) => setConfig((prev) => ({ ...prev, fallbackMessage: e.target.value }))}
              className="w-full bg-stone-950 border border-white/15 rounded-xl p-3 text-xs text-stone-200 focus:outline-hidden focus:border-rose-400"
            />
          </div>
        </div>

        {/* CỘT PHẢI (4 CỘT): Câu hỏi nhanh & Kiểm thử Sandbox */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card D: Tên Bot & Câu Hỏi Nhanh (Quick FAQ Chips) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-white/10 space-y-4">
            <span className="text-xs font-black text-amber-300 flex items-center gap-2 pb-2 border-b border-white/10">
              <HelpCircle className="h-4 w-4 text-amber-400" />
              <span>4. Câu Hỏi Nhanh & Lịch Sử</span>
            </span>

            {/* Tên Bot */}
            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Tên hiển thị của Bot:
              </label>
              <input
                type="text"
                value={config.botName}
                onChange={(e) => setConfig((prev) => ({ ...prev, botName: e.target.value }))}
                className="w-full bg-stone-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>

            {/* Thời gian lưu lịch sử chat */}
            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">
                Thời gian lưu lịch sử chat (TTL):
              </label>
              <select
                value={config.historyTtlHours}
                onChange={(e) => setConfig((prev) => ({ ...prev, historyTtlHours: parseInt(e.target.value) }))}
                className="w-full bg-stone-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
              >
                <option value={12}>12 Giờ</option>
                <option value={24}>24 Giờ (1 ngày - Mặc định)</option>
                <option value={48}>48 Giờ (2 ngày)</option>
                <option value={72}>72 Giờ (3 ngày)</option>
              </select>
            </div>

            {/* Danh sách câu hỏi nhanh */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-bold text-stone-300">
                Gợi ý câu hỏi nhanh (Chips):
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {config.quickQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-stone-950 border border-white/10 text-[11px] text-stone-300"
                  >
                    <span className="truncate">{q}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-stone-500 hover:text-rose-400 px-1 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Thêm câu hỏi nhanh */}
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newQuestionInput}
                  onChange={(e) => setNewQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddQuestion())}
                  placeholder="Thêm câu hỏi mới..."
                  className="flex-1 bg-stone-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-hidden focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-colors"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>

          {/* Card E: LIVE TEST SANDBOX (Hộp Thử Nghiệm Chat Trực Tiếp) */}
          <div className="p-4 rounded-2xl bg-stone-950/90 border border-amber-400/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Hộp Thử Nghiệm Trực Tiếp (Sandbox)</span>
              </span>
              <button
                type="button"
                onClick={() => setTestMessages([testMessages[0]])}
                className="text-[10px] text-stone-400 hover:text-white"
              >
                Xóa tin nhắn
              </button>
            </div>

            {/* Khung tin nhắn test */}
            <div className="h-64 overflow-y-auto space-y-2.5 p-2 rounded-xl bg-stone-900/60 border border-white/10 text-xs">
              {testMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-amber-500 text-stone-950 font-bold"
                        : "bg-stone-800 text-stone-200 border border-white/10"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.content}</div>
                  </div>
                </div>
              ))}
              {isTesting && (
                <div className="text-[10px] text-amber-400 italic animate-pulse">
                  AI đang sinh câu trả lời...
                </div>
              )}
            </div>

            {/* Input test */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTest();
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Nhập câu hỏi test..."
                disabled={isTesting}
                className="flex-1 bg-stone-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!testInput.trim() || isTesting}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs disabled:opacity-40 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

