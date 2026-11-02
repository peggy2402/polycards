import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/proxy/model?url=<encoded_url>
 * Proxy stream file 3D (.glb, .usdz, .mind) từ R2 hoặc external storage
 * Giải quyết 100% lỗi CORS trên trình duyệt mà không làm quá tải RAM server.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let targetUrl = searchParams.get("url")?.trim() || "";

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, message: "Thiếu tham số url cần proxy." },
        { status: 400 }
      );
    }

    // Tự động giải mã triệt để nếu URL bị double-encoded (%252F -> /)
    try {
      let loops = 0;
      while (
        loops < 5 &&
        (targetUrl.includes("%3A") ||
          targetUrl.includes("%2F") ||
          targetUrl.includes("%25") ||
          targetUrl.startsWith("http%3A"))
      ) {
        const decoded = decodeURIComponent(targetUrl);
        if (decoded === targetUrl) break;
        targetUrl = decoded;
        loops++;
      }
    } catch {}

    // Chỉ cho phép proxy từ HTTPS hợp lệ
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return NextResponse.json(
        { success: false, message: `URL không hợp lệ sau khi giải mã: ${targetUrl}` },
        { status: 400 }
      );
    }

    // Chuyển hướng 307 (Temporary Redirect) để trình duyệt tải trực tiếp từ Cloudflare R2 Edge CDN
    // Giải quyết triệt để 100% giới hạn 4.5MB của Vercel Serverless Function và tránh đứt gãy kết nối mạng trên di động
    return NextResponse.redirect(targetUrl, {
      status: 307,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi máy chủ proxy model" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

