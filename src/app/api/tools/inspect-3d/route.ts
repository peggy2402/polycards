import { NextRequest, NextResponse } from "next/server";
import { inspectGlbBuffer } from "@/lib/gltf-inspector";
import { dbGetProductBySlug } from "@/lib/mongodb";
import { INITIAL_PRODUCTS } from "@/data/seed-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/tools/inspect-3d?slug=... hoặc ?url=...
 * Phân tích và chấm điểm sức khỏe mô hình 3D từ xa
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const rawUrl = searchParams.get("url");

    let targetUrl = rawUrl;

    if (!targetUrl && slug) {
      const cleanSlug = slug.toLowerCase().trim();
      const product = (await dbGetProductBySlug(cleanSlug)) || INITIAL_PRODUCTS.find((p) => p.slug === cleanSlug);
      if (product?.modelUrl) {
        targetUrl = product.modelUrl;
      }
    }

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, message: "Vui lòng cung cấp tham số 'slug' hoặc 'url' của mô hình 3D." },
        { status: 400 }
      );
    }

    // Tải dữ liệu tệp GLB
    let fileBuffer: Buffer;
    if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
      const res = await fetch(targetUrl, {
        headers: { "User-Agent": "PolyCards-Asset-Doctor/1.0" },
      });
      if (!res.ok) {
        return NextResponse.json(
          { success: false, message: `Không thể tải tệp 3D từ URL (${res.status} ${res.statusText})` },
          { status: 400 }
        );
      }
      fileBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      return NextResponse.json(
        { success: false, message: "URL mô hình phải là đường dẫn HTTP/HTTPS hợp lệ." },
        { status: 400 }
      );
    }

    const report = inspectGlbBuffer(fileBuffer);

    return NextResponse.json({
      success: true,
      url: targetUrl,
      report,
    });
  } catch (error: any) {
    console.error("[Inspect 3D Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi khi phân tích tệp 3D" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/inspect-3d
 * Nhận tệp tải lên trực tiếp từ trình duyệt để phân tích ngay lập tức
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy tệp 3D (.glb) trong yêu cầu." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const report = inspectGlbBuffer(buffer);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      report,
    });
  } catch (error: any) {
    console.error("[Inspect 3D Upload Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi phân tích tệp 3D tải lên" },
      { status: 500 }
    );
  }
}
