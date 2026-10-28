import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function cleanKey(val: string | undefined): string {
  if (!val) return "";
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function getSecretKey(): string {
  // 1. Kiểm tra đọc trực tiếp từ các file .env.local, .env (áp dụng ngay trên môi trường Dev khi sửa file)
  const envCandidates = [".env.local", ".env"];
  for (const file of envCandidates) {
    try {
      const envPath = path.join(process.cwd(), file);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/POLY_KEY_TOOLS\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\r\n#]+))/);
        if (match) {
          const val = match[1] ?? match[2] ?? match[3];
          if (val) return cleanKey(val);
        }
      }
    } catch {
      // bỏ qua nếu không đọc được
    }
  }

  // 2. Mặc định đọc từ process.env (chuẩn trên Vercel / Production)
  return cleanKey(process.env.POLY_KEY_TOOLS) || "polycard2025";
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

    // So sánh chính xác mật mã (tự động loại bỏ khoảng trắng và dấu ngoặc kép bọc ngoài nếu người dùng paste thừa)
    const inputClean = cleanKey(passcode);
    const targetClean = cleanKey(secretKey);

    if (inputClean === targetClean) {
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
