"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  X,
  Send,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { AiChatMessage } from "@/types/ai";

const STORAGE_KEY = "polycards_ai_chat_session";
const BUBBLE_DISMISSED_AT_KEY = "polycards_ai_bubble_last_dismissed";
const DEFAULT_TTL_HOURS = 24;

const DEFAULT_QUICK_QUESTIONS = [
  "Giá các combo thẻ AR bao nhiêu?",
  "Siêu Combo 9-in-1 có những gì?",
  "Cách quét thẻ AR trên điện thoại?",
  "Bé 3 - 5 tuổi học bộ nào phù hợp?",
];

interface OrderPackSheetProps {
  isOpen: boolean;
}

function formatInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-black text-stone-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function RenderChatMessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1 text-xs sm:text-[13px] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-0.5">
              <span className="text-amber-600 font-bold mt-0.5 shrink-0">•</span>
              <span className="flex-1">{formatInlineMarkdown(trimmed.replace(/^[-•]\s*/, ""))}</span>
            </div>
          );
        }
        return <div key={idx}>{formatInlineMarkdown(line)}</div>;
      })}
    </div>
  );
}

export function AiChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessagePrompt, setHasNewMessagePrompt] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>(DEFAULT_QUICK_QUESTIONS);

  // Cấu hình linh hoạt từ server (đồng bộ từ Admin Tools)
  const [botName, setBotName] = useState<string>("PolyCards AI");
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    "Xin chào Ba Mẹ! Em là Trợ lý AI PolyCards. Em có thể giúp Ba Mẹ tra cứu giá các bộ thẻ học AR, tư vấn chọn bộ thẻ theo độ tuổi của bé, hoặc hướng dẫn cách quét 3D không cần cài app nhé!"
  );
  const [bubbleDurationSec, setBubbleDurationSec] = useState<number>(30);
  const [bubbleIntervalMin, setBubbleIntervalMin] = useState<number>(60);
  const [bubbleMessage, setBubbleMessage] = useState<string>(
    "Ba Mẹ cần tư vấn giá combo hoặc cách quét 3D cho bé không ạ? Chạm vào đây nhé!"
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Tắt bong bóng gợi ý và lưu lại mốc thời gian đã tắt
  const dismissPromptBubble = useCallback(() => {
    setHasNewMessagePrompt(false);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(BUBBLE_DISMISSED_AT_KEY, Date.now().toString());
      } catch {}
    }
  }, []);

  // Cuộn xuống cuối khung chat
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  // Khởi tạo lịch sử chat từ localStorage (có kiểm tra TTL hết hạn)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const savedTime = parsed.updatedAt || 0;
        const now = Date.now();
        const ttlMs = (parsed.ttlHours || DEFAULT_TTL_HOURS) * 3600 * 1000;

        // Nếu còn hạn sử dụng
        if (now - savedTime < ttlMs && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          return;
        }
      }
    } catch {}

    // Tin nhắn chào mừng ban đầu
    const initialWelcome: AiChatMessage = {
      id: `bot-welcome-${Date.now()}`,
      role: "assistant",
      content: welcomeMessage,
      createdAt: Date.now(),
    };
    setMessages([initialWelcome]);
  }, [welcomeMessage]);

  // Tải cấu hình bot, tên hiển thị, bong bóng và câu hỏi nhanh từ server
  useEffect(() => {
    fetch("/api/ai/config")
      .then((res) => res.json())
      .then((data) => {
        if (data?.config) {
          const cfg = data.config;
          const currentBotName = cfg.botName || "PolyCards AI";
          setBotName(currentBotName);
          if (cfg.welcomeMessage) setWelcomeMessage(cfg.welcomeMessage);
          if (typeof cfg.bubbleDurationSec === "number") setBubbleDurationSec(cfg.bubbleDurationSec);
          if (typeof cfg.bubbleIntervalMin === "number") setBubbleIntervalMin(cfg.bubbleIntervalMin);
          if (cfg.bubbleMessage) setBubbleMessage(cfg.bubbleMessage);
          if (Array.isArray(cfg.quickQuestions) && cfg.quickQuestions.length > 0) {
            setQuickQuestions(cfg.quickQuestions);
          }

          // Cập nhật lại tin nhắn chào mừng nếu cuộc hội thoại mới chỉ có 1 tin nhắn chào mặc định
          setMessages((prev) => {
            if (prev.length === 1 && prev[0].role === "assistant" && prev[0].id.startsWith("bot-welcome-")) {
              return [
                {
                  ...prev[0],
                  content:
                    cfg.welcomeMessage ||
                    `Xin chào Ba Mẹ! Em là ${currentBotName}. Em có thể giúp Ba Mẹ tra cứu giá các bộ thẻ học AR, tư vấn chọn bộ thẻ theo độ tuổi của bé, hoặc hướng dẫn cách quét 3D không cần cài app nhé!`,
                },
              ];
            }
            return prev;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Lưu tin nhắn vào localStorage mỗi khi có cập nhật
  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          updatedAt: Date.now(),
          ttlHours: DEFAULT_TTL_HOURS,
          messages,
        })
      );
    } catch {}
  }, [messages]);

  // Cuộn xuống khi mở chat hoặc có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom(false);
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(true);
    }
  }, [messages, isLoading, isOpen, scrollToBottom]);

  // Hiển thị lời mời trò chuyện sau 4 giây truy cập (kiểm tra khoảng cách thời gian từ lần đóng trước)
  useEffect(() => {
    if (
      !pathname ||
      pathname === "/order" ||
      pathname.startsWith("/tools") ||
      pathname.startsWith("/invoices") ||
      pathname.startsWith("/merchant") ||
      pathname.startsWith("/studio") ||
      pathname.startsWith("/ar/") ||
      isOpen
    ) {
      return;
    }

    if (typeof window !== "undefined") {
      try {
        const lastDismissed = localStorage.getItem(BUBBLE_DISMISSED_AT_KEY);
        if (lastDismissed) {
          const elapsedMin = (Date.now() - Number(lastDismissed)) / (60 * 1000);
          if (elapsedMin < bubbleIntervalMin) {
            return; // Chưa hết thời gian chờ (mặc định 60 phút)
          }
        }
      } catch {}
    }

    const timer = setTimeout(() => {
      if (!isOpen) {
        setHasNewMessagePrompt(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isOpen, pathname, bubbleIntervalMin]);

  // Tự động ẩn bóng thoại sau bubbleDurationSec giây (mặc định 30 giây) và tính thời gian chờ
  useEffect(() => {
    if (!hasNewMessagePrompt) return;

    const hideTimer = setTimeout(() => {
      dismissPromptBubble();
    }, (bubbleDurationSec || 30) * 1000);

    return () => clearTimeout(hideTimer);
  }, [hasNewMessagePrompt, bubbleDurationSec, dismissPromptBubble]);

  // Gửi tin nhắn
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setInputValue("");
    dismissPromptBubble();

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const botReplyText =
        data?.message ||
        `Dạ em là ${botName}. Hiện tại em đang tổng hợp thông tin, Ba Mẹ có thể xem chi tiết bảng giá tại mục Sản phẩm hoặc liên hệ hotline để được phục vụ chu đáo nhất ạ!`;

      const botMsg: AiChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: botReplyText,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallbackMsg: AiChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        role: "assistant",
        content:
          `Dạ em là ${botName}. Em luôn sẵn sàng hỗ trợ Ba Mẹ về bảng giá bộ thẻ, cách quét mã QR WebAR hoặc tư vấn độ tuổi cho bé. Ba Mẹ có câu hỏi nào cần giải đáp không ạ?`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Làm mới cuộc hội thoại
  const handleClearChat = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    const resetWelcome: AiChatMessage = {
      id: `bot-welcome-${Date.now()}`,
      role: "assistant",
      content:
        `Cuộc trò chuyện đã được làm mới. Em là ${botName}, Ba Mẹ cần em hỗ trợ giải đáp điều gì ạ?`,
      createdAt: Date.now(),
    };
    setMessages([resetWelcome]);
  };

  // ẨN CHAT KHI ĐANG Ở TRANG AR VIEW HOẶC CÁC TRANG QUẢN TRỊ BACK OFFICE (/tools, /invoices, /merchant, /studio)
  if (
    !pathname ||
    pathname.startsWith("/ar/") ||
    pathname.startsWith("/studio") ||
    pathname.startsWith("/merchant") ||
    pathname.startsWith("/tools") ||
    pathname.startsWith("/invoices")
  ) {
    return null;
  }

  const isOrderPage = pathname === "/order";

  return (
    <>
      {/* 1. KHUNG HỘI THOẠI AI CHATBOT NỔI */}
      {isOpen && (
        <div
          className={`print:hidden fixed right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[400px] h-[540px] max-h-[82vh] rounded-3xl bg-white/95 backdrop-blur-xl border-2 border-amber-300 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 ${
            isOrderPage
              ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-24"
              : "bottom-20 sm:bottom-24"
          }`}
        >
          {/* Header Chat */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 text-stone-950 shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-stone-950 text-amber-400 shadow-md">
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white ring-1 ring-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-stone-950">{botName}</h3>
                  <span className="rounded-md bg-stone-950/15 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-stone-900">
                    24/7
                  </span>
                </div>
                <p className="text-[10px] text-stone-800 font-bold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-amber-900" />
                  <span>Trợ lý tư vấn thẻ học WebAR 3D</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="flex h-7 w-7 items-center justify-center rounded-xl text-stone-900 hover:bg-black/10 active:scale-90 transition-all cursor-pointer"
                title="Bắt đầu cuộc trò chuyện mới"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-xl text-stone-900 hover:bg-black/10 active:scale-90 transition-all cursor-pointer"
                title="Thu nhỏ khung chat"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Vùng Tin Nhắn */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-150`}
              >
                {m.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 mr-2 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-semibold rounded-tr-xs"
                      : "bg-stone-100/90 text-stone-800 rounded-tl-xs border border-stone-200/50"
                  }`}
                >
                  <RenderChatMessageContent content={m.content} />
                </div>
              </div>
            ))}

            {/* Chỉ báo AI đang suy nghĩ */}
            {isLoading && (
              <div className="flex justify-start items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Bot className="h-4 w-4 animate-bounce" />
                </div>
                <div className="bg-stone-100 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-stone-500 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse delay-300" />
                  <span className="text-[11px] font-bold text-stone-500 ml-1">{botName} đang trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Câu Hỏi Nhanh (FAQ Chips) */}
          <div className="px-3 pt-1 pb-1.5 bg-stone-50/80 border-t border-stone-100 overflow-x-auto scrollbar-none flex items-center gap-1.5">
            <span className="text-[10px] font-black text-stone-400 shrink-0 flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-amber-500" />
              <span>Gợi ý:</span>
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white border border-stone-200/90 hover:border-amber-400 hover:bg-amber-50 text-[10px] font-bold text-stone-700 transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Khung Nhập Liệu & Nút Gửi */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-stone-200/80 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập câu hỏi (giá, combo, cách quét 3D...)"
              disabled={isLoading}
              className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-stone-950 shadow-md transition-all shrink-0 cursor-pointer"
              aria-label="Gửi tin nhắn"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Footer nhỏ dẫn hướng */}
          <div className="py-1 px-3 bg-stone-100/60 text-center text-[9px] text-stone-400 flex items-center justify-center gap-2">
            <span>Powered by {botName}</span>
            <span>•</span>
            <Link href="/order" className="text-amber-700 hover:underline font-bold flex items-center gap-0.5">
              <ShoppingBag className="h-2.5 w-2.5" />
              <span>Đặt hàng online</span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. BONG BÓNG LỜI MỜI NHỎ (HIỂN THỊ KHI CHƯA MỞ CHAT) */}
      {!isOpen && hasNewMessagePrompt && (
        <div
          className={`print:hidden fixed right-4 sm:right-7 z-40 max-w-[260px] rounded-2xl bg-white border border-amber-300 p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 transition-all ${
            isOrderPage
              ? "bottom-[calc(9.25rem+env(safe-area-inset-bottom))] lg:bottom-24"
              : "bottom-20 sm:bottom-24"
          }`}
        >
          <button
            type="button"
            onClick={dismissPromptBubble}
            className="absolute top-1.5 right-1.5 h-5 w-5 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 cursor-pointer"
            aria-label="Đóng gợi ý"
          >
            <X className="h-3 w-3" />
          </button>
          <div
            onClick={() => {
              setIsOpen(true);
              dismissPromptBubble();
            }}
            className="cursor-pointer space-y-1"
          >
            <p className="text-[11px] font-black text-amber-800 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Hỏi đáp cùng {botName}</span>
            </p>
            <p className="text-[11px] text-stone-600 leading-snug">
              {bubbleMessage}
            </p>
          </div>
        </div>
      )}

      {/* 3. NÚT NỔI AI CHAT GÓC DƯỚI PHẢI */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          dismissPromptBubble();
        }}
        className={`print:hidden fixed right-4 sm:right-6 z-40 flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ring-4 ring-amber-300/40 group ${
          isOrderPage
            ? "bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:bottom-6"
            : "bottom-[calc(1.25rem+env(safe-area-inset-bottom))] sm:bottom-6"
        }`}
        aria-label={`Mở Trợ lý AI ${botName}`}
      >
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
        </span>
        {isOpen ? (
          <X className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <Bot className="h-6 w-6 sm:h-7 sm:w-7 transition-transform group-hover:scale-110 duration-200" />
        )}
      </button>
    </>
  );
}

