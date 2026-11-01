import { NextRequest, NextResponse } from "next/server";
import { isR2Configured, uploadToR2 } from "@/lib/r2";
import { dbGetProductBySlug, dbUpsertProduct } from "@/lib/mongodb";
import { inspectGlbBuffer } from "@/lib/gltf-inspector";

export const dynamic = "force-dynamic";

/**
 * POST /api/tools/save-model-assets
 * Tiếp nhận trực tiếp các tệp .glb và .usdz đã được nén/tối ưu hóa từ Browser Three.js Engine
 * Tải thẳng lên Cloudflare R2 CDN và đồng bộ MongoDB Atlas (Hoạt động hoàn hảo trên Vercel Serverless)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const slug = (formData.get("slug") as string | null)?.trim()?.toLowerCase();
    const glbFile = formData.get("glb") as File | null;
    const usdzFile = formData.get("usdz") as File | null;
    const updateDatabase = formData.get("updateDatabase") !== "false";

    if (!glbFile) {
      return NextResponse.json(
        { success: false, message: "Thiếu tệp mô hình GLB cần lưu." },
        { status: 400 }
      );
    }

    const effectiveSlug = slug || "model";
    const glbBuffer = Buffer.from(await glbFile.arrayBuffer());

    // Thẩm định nhanh file GLB mới
    let afterReport = null;
    try {
      afterReport = inspectGlbBuffer(glbBuffer);
    } catch (e) {
      console.warn("Không thể parse report sau nén:", e);
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, message: "Cloudflare R2 chưa được cấu hình các biến môi trường." },
        { status: 500 }
      );
    }

    // 1. Tải GLB lên Cloudflare R2
    const glbFileName = `${effectiveSlug}.glb`;
    const glbUrl = await uploadToR2(glbBuffer, glbFileName, "model/gltf-binary");

    // 2. Tải USDZ lên Cloudflare R2 nếu có
    let usdzUrl: string | undefined = undefined;
    if (usdzFile) {
      const usdzBuffer = Buffer.from(await usdzFile.arrayBuffer());
      const usdzFileName = `${effectiveSlug}.usdz`;
      usdzUrl = await uploadToR2(usdzBuffer, usdzFileName, "model/vnd.usdz+zip");
    }

    // 3. Cập nhật vào MongoDB
    let updatedCard = null;
    if (updateDatabase && slug) {
      const existing = await dbGetProductBySlug(slug);
      if (existing) {
        existing.modelUrl = glbUrl;
        if (usdzUrl) {
          existing.iosModelUrl = usdzUrl;
        }
        existing.updatedAt = new Date().toISOString();
        updatedCard = await dbUpsertProduct(existing);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã tối ưu và đẩy thành công mô hình "${effectiveSlug}" lên Cloudflare R2!`,
      glbUrl,
      usdzUrl,
      afterReport,
      updatedCard,
    });
  } catch (error: unknown) {
    console.error("Lỗi lưu model assets lên R2:", error);
    const msg = error instanceof Error ? error.message : "Lỗi lưu tài nguyên 3D lên R2";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

