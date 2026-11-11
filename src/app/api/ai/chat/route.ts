import { NextRequest, NextResponse } from "next/server";
import { callAiModel } from "@/lib/ai-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: "Danh sách tin nhắn không hợp lệ." },
        { status: 400 }
      );
    }

    // Giới hạn độ dài lịch sử gửi lên (tối đa 12 tin nhắn gần nhất) để tối ưu token
    const recentMessages: Array<{ role: "user" | "assistant"; content: string }> = messages.slice(-12).map((m: any) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: String(m.content || "").slice(0, 1500),
    }));

    const result = await callAiModel(recentMessages);

    return NextResponse.json({
      success: true,
      message: result.message,
      providerUsed: result.providerUsed,
      isFallback: result.isFallback,
    });
  } catch (err: unknown) {
    console.error("[API AI Chat Error]:", err);
    // Luôn trả về phản hồi fallback thân thiện, không bao giờ để crash giao diện người dùng
    return NextResponse.json({
      success: true,
      message:
        "Dạ em là PolyCards AI. Hiện đường truyền mạng đang hơi chậm một chút, Ba Mẹ có thể bấm xem trực tiếp các Bộ Thẻ AR tại trang Sản phẩm hoặc liên hệ hotline để được hỗ trợ tức thì nhé!",
      providerUsed: "fallback-safe",
      isFallback: true,
    });
  }
}
