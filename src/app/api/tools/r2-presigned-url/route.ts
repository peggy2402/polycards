import { NextRequest, NextResponse } from "next/server";
import { isR2Configured, getPresignedUploadUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

/**
 * POST /api/tools/r2-presigned-url
 * Cấp Presigned URL để trình duyệt tải trực tiếp tệp lên Cloudflare R2
 * Tránh 100% lỗi 413 Payload Too Large của Vercel Serverless Function (4.5MB limit)
 */
export async function POST(req: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, message: "Cloudflare R2 chưa được cấu hình đầy đủ biến môi trường." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const fileName = (body.fileName as string | undefined)?.trim();
    const contentType = (body.contentType as string | undefined)?.trim() || "application/octet-stream";

    if (!fileName) {
      return NextResponse.json(
        { success: false, message: "Vui lòng cung cấp fileName." },
        { status: 400 }
      );
    }

    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(fileName, contentType);

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
    });
  } catch (error: unknown) {
    console.error("Lỗi tạo Presigned URL cho R2:", error);
    const msg = error instanceof Error ? error.message : "Lỗi tạo Presigned URL";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

