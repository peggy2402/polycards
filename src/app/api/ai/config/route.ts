import { NextRequest, NextResponse } from "next/server";
import { getAiConfig, saveAiConfig, DEFAULT_AI_CONFIG } from "@/lib/ai-service";
import { AiChatConfig } from "@/types/ai";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/config
 * Lấy thông tin cấu hình AI Chatbot & System Prompt
 */
export async function GET() {
  try {
    const config = await getAiConfig();
    return NextResponse.json({
      success: true,
      config,
      envStatus: {
        hasGemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5),
        hasOpenRouter: Boolean(
          (process.env.OPEN_ROUTER_API_KEY && process.env.OPEN_ROUTER_API_KEY.trim().length > 5) ||
          (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 5)
        ),
        hasGroq: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 5),
      },
      defaultConfig: DEFAULT_AI_CONFIG,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi đọc cấu hình AI";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

/**
 * POST /api/ai/config
 * Lưu cấu hình AI Chatbot & System Prompt từ Admin Tools (Tuyệt đối không lưu API Key)
 */
export async function POST(req: NextRequest) {
  try {
    const body: Partial<AiChatConfig> = await req.json().catch(() => ({}));

    // Loại bỏ mọi trường apiKey nếu client vô tình gửi lên
    const { apiKey, ...safeBody } = body as any;

    // Cập nhật cấu hình
    const updated = await saveAiConfig(safeBody);

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật cấu hình Trợ lý AI PolyCards thành công!",
      config: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi lưu cấu hình AI";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

