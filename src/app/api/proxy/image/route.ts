import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/proxy/image?url=<encoded_url>
 * Proxy stream file ảnh (JPEG, PNG, WEBP) từ Cloudflare R2 hoặc external CDN
 * Giải quyết 100% lỗi CORS khi vẽ lên HTML5 Canvas để xuất ảnh in & mã QR.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let targetUrl = searchParams.get("url")?.trim() || "";

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, message: "Thiếu tham số url cần proxy ảnh." },
        { status: 400 }
      );
    }

    // Tự động giải mã nếu bị double-encoded
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

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return NextResponse.json(
        { success: false, message: `URL không hợp lệ: ${targetUrl}` },
        { status: 400 }
      );
    }

    // Nếu là Cloudflare R2 CDN (đã có sẵn CORS *), chuyển hướng 307 ngay lập tức
    // Trình duyệt tải thẳng từ R2 với 0% chi phí băng thông Vercel (Fast Origin Transfer = 0 bytes)
    const isR2Url =
      targetUrl.includes(".r2.dev") ||
      targetUrl.includes(".r2.cloudflarestorage.com");

    if (isR2Url) {
      return NextResponse.redirect(targetUrl, {
        status: 307,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Cache-Control": "public, max-age=604800, immutable",
        },
      });
    }

    // Server-to-Server fetch (đối với external URL lạ không hỗ trợ CORS)
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "PolyCards-Image-Proxy/1.0",
      },
      cache: "force-cache",
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `Không thể tải ảnh từ nguồn (${res.status} ${res.statusText})` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "public, max-age=604800, immutable", // Cache 7 ngày
      },
    });
  } catch (error: any) {
    console.error("[Image Proxy Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi máy chủ proxy ảnh" },
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

