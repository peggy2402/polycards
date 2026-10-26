import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getSecretKey(): string {
  // 1. Kiểm tra đọc trực tiếp từ file .env (giúp áp dụng ngay khi lưu file mà không cần khởi động lại dev server)
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/POLY_KEY_TOOLS\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\r\n#]+))/);
      if (match) {
        const val = match[1] ?? match[2] ?? match[3];
        if (val) return val.trim();
      }
    }
  } catch {
    // Không đọc được file thì dùng process.env
  }

  // 2. Mặc định đọc từ process.env (chuẩn trên Vercel / Production)
  return process.env.POLY_KEY_TOOLS || "polycard2025";
}

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();
    const secretKey = getSecretKey();

    if (!passcode || typeof passcode !== "string") {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập mã truy cập bảo mật." },
        { status: 400 }
      );
    }

    // So sánh chính xác mật mã (bỏ khoảng trắng thừa ở 2 đầu)
    if (passcode.trim() === secretKey.trim()) {
      return NextResponse.json({
        success: true,
        message: "Xác thực tác giả thành công!",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Mã bảo mật không chính xác. Chỉ dành cho tác giả Poly Cards.",
      },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi xác thực." },
      { status: 500 }
    );
  }
}
