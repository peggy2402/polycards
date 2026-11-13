/**
 * Poly Cards - Types for AI Assistant & System Prompt Configuration
 */

export type AiProvider = "gemini" | "openrouter" | "groq" | "openai" | "fallback" | "auto";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
}

export interface AiChatConfig {
  id?: string;
  enabled: boolean;
  provider: AiProvider;
  model: string;
  systemPrompt: string;
  fallbackMessage: string;
  quickQuestions: string[];
  historyTtlHours: number;
  welcomeMessage: string;
  botName: string;
  temperature: number;
  bubbleDurationSec?: number; // Thời gian bong bóng tự biến mất (giây) - mặc định 30
  bubbleIntervalMin?: number; // Thời gian chờ hiển thị lại bong bóng (phút) - mặc định 60
  bubbleTitle?: string;       // Tiêu đề bong bóng
  bubbleMessage?: string;     // Lời nhắn trên bong bóng
  updatedAt?: string;
}

export interface AiChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  userSessionId?: string;
}

export interface AiChatResponse {
  success: boolean;
  message: string;
  providerUsed: string;
  isFallback: boolean;
}

