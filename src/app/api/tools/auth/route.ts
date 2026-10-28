import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();
    const secretKey = cleanKey(process.env.POLY_KEY_TOOLS) || "polycard2025";

    if (!passcode || typeof passcode !== "string") {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập mã truy cập bảo mật." },
        { status: 400 }
      );
    }

    const inputClean = cleanKey(passcode);
    if (inputClean === secretKey) {
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
  } catch {
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi xác thực." },
      { status: 500 }
    );
  }
}
