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
      config: {
        ...config,
        // Giữ nguyên apiKey để hiển thị trong input admin (vì admin cần kiểm tra/sửa)
        hasApiKey: Boolean(config.apiKey && config.apiKey.trim().length > 5),
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
 * Lưu cấu hình AI Chatbot & System Prompt từ Admin Tools
 */
export async function POST(req: NextRequest) {
  try {
    const body: Partial<AiChatConfig> = await req.json().catch(() => ({}));

    // Cập nhật cấu hình
    const updated = await saveAiConfig(body);

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
