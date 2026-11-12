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
  apiKey?: string;
  model: string;
  systemPrompt: string;
  fallbackMessage: string;
  quickQuestions: string[];
  historyTtlHours: number;
  welcomeMessage: string;
  botName: string;
  temperature: number;
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

