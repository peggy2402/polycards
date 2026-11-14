import { NextRequest, NextResponse } from "next/server";
import {
  cleanPasscode,
  getAdminSecretKey,
  generateAdminToken,
  verifyAdminAuth,
} from "@/lib/admin-auth";

/**
 * GET /api/tools/auth
 * Kiểm tra trạng thái đăng nhập của Admin (dựa trên Cookie hoặc Header)
 */
export async function GET(req: NextRequest) {
  const isAuth = verifyAdminAuth(req);
  return NextResponse.json({
    success: isAuth,
    authenticated: isAuth,
  });
}

/**
 * POST /api/tools/auth
 * Xác thực mã PIN / Passcode của Tác giả & Cấp HttpOnly Cookie bảo mật
 */
export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();
    const secretKey = getAdminSecretKey();

    if (!passcode || typeof passcode !== "string") {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập mã truy cập bảo mật." },
        { status: 400 }
      );
    }

    const inputClean = cleanPasscode(passcode);
    if (inputClean === secretKey) {
      const token = generateAdminToken(secretKey);
      const res = NextResponse.json({
        success: true,
        message: "Xác thực tác giả thành công!",
      });

      // Thiết lập HttpOnly Cookie an toàn cho trình duyệt
      res.cookies.set("polycards_admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 ngày
      });

      return res;
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

/**
 * DELETE /api/tools/auth
 * Đăng xuất tác giả & Xóa Cookie xác thực
 */
export async function DELETE() {
  const res = NextResponse.json({
    success: true,
    message: "Đã đăng xuất tác giả thành công.",
  });
  res.cookies.set("polycards_admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
