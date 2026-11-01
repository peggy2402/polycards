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
    const targetUrl = searchParams.get("url")?.trim();

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, message: "Thiếu tham số url cần proxy." },
        { status: 400 }
      );
    }

    // Chỉ cho phép proxy từ R2 CDN của dự án hoặc HTTPS hợp lệ
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return NextResponse.json(
        { success: false, message: "URL không hợp lệ." },
        { status: 400 }
      );
    }

    const upstreamRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "PolyCards-Model-Proxy/1.0",
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      return NextResponse.json(
        {
          success: false,
          message: `Không thể tải tệp từ nguồn gốc: ${upstreamRes.status} ${upstreamRes.statusText}`,
        },
        { status: upstreamRes.status }
      );
    }

    let contentType = upstreamRes.headers.get("content-type") || "model/gltf-binary";
    if (targetUrl.endsWith(".glb")) contentType = "model/gltf-binary";
    if (targetUrl.endsWith(".gltf")) contentType = "model/gltf+json";
    if (targetUrl.endsWith(".usdz")) contentType = "model/vnd.usdz+zip";
    if (targetUrl.endsWith(".mind")) contentType = "application/octet-stream";

    const contentLength = upstreamRes.headers.get("content-length");
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "*");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new NextResponse(upstreamRes.body as any, {
      status: 200,
      headers,
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

