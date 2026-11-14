import { NextRequest, NextResponse } from "next/server";
import { getAiConfig, saveAiConfig, DEFAULT_AI_CONFIG } from "@/lib/ai-service";
import { AiChatConfig } from "@/types/ai";
import { verifyAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/config
 * Lấy thông tin cấu hình AI Chatbot.
 * - Khách công khai: Chỉ nhận các thông tin hiển thị giao diện an toàn (Ẩn 100% System Prompt & Thông tin máy chủ).
 * - Admin xác thực: Nhận đầy đủ cấu hình để chỉnh sửa trong Admin Tools.
 */
export async function GET(req: NextRequest) {
  try {
    const config = await getAiConfig();
    const isAdmin = verifyAdminAuth(req);

    // Nếu là khách công khai / widget chat: Chỉ trả về cấu hình an toàn cho UI
    if (!isAdmin) {
      return NextResponse.json({
        success: true,
        config: {
          enabled: config.enabled ?? true,
          botName: config.botName || "PolyCards AI",
          welcomeMessage: config.welcomeMessage,
          quickQuestions: config.quickQuestions || [],
          bubbleDurationSec: config.bubbleDurationSec,
          bubbleIntervalMin: config.bubbleIntervalMin,
          bubbleTitle: config.bubbleTitle,
          bubbleMessage: config.bubbleMessage,
        },
      });
    }

    // Nếu là Admin đã đăng nhập: Trả về đầy đủ cấu hình để chỉnh sửa
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
 * Lưu cấu hình AI Chatbot & System Prompt từ Admin Tools (Yêu cầu xác thực Admin)
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        { success: false, message: "Từ chối truy cập: Yêu cầu quyền quản trị viên Poly Cards để thay đổi cấu hình AI." },
        { status: 401 }
      );
    }

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

