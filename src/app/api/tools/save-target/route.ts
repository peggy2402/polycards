import { NextRequest, NextResponse } from "next/server";
import { isR2Configured, uploadToR2 } from "@/lib/r2";
import { dbGetProductBySlug, dbUpsertProduct } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/**
 * POST /api/tools/save-target
 * Nhận file .mind đã biên dịch từ browser WebAssembly, lưu lên Cloudflare R2
 * và tự động cập nhật targetUrl vào thẻ sản phẩm tương ứng trong MongoDB.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const slug = (formData.get("slug") as string | null)?.trim()?.toLowerCase();
    const file = formData.get("file") as File | null;
    const updateDatabase = formData.get("updateDatabase") !== "false";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy dữ liệu tệp .mind được tải lên." },
        { status: 400 }
      );
    }

    const cleanSlug = slug || "target";
    const fileName = `${cleanSlug}.mind`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length < 100) {
      return NextResponse.json(
        { success: false, message: "Tệp .mind không hợp lệ hoặc kích thước quá nhỏ." },
        { status: 400 }
      );
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          success: false,
          message: "Cloudflare R2 chưa được cấu hình. Vui lòng kiểm tra R2_ACCOUNT_ID và các biến môi trường.",
        },
        { status: 500 }
      );
    }

    // 1. Tải lên Cloudflare R2 CDN
    const r2Url = await uploadToR2(buffer, fileName, "application/octet-stream");

    // 2. Tự động đồng bộ vào MongoDB Atlas nếu slug tồn tại
    let updatedCard = null;
    if (updateDatabase && slug) {
      const existing = await dbGetProductBySlug(slug);
      if (existing) {
        existing.targetUrl = r2Url;
        updatedCard = await dbUpsertProduct(existing);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã biên dịch và đẩy tệp "${fileName}" lên Cloudflare R2 thành công!`,
      url: r2Url,
      fileName,
      fileSizeKB: Math.round(buffer.length / 1024),
      updatedCard,
    });
  } catch (error: unknown) {
    console.error("Lỗi khi lưu tệp .mind lên Cloudflare R2:", error);
    const msg = error instanceof Error ? error.message : "Lỗi hệ thống khi lưu tệp .mind";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
