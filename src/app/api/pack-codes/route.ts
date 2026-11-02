import { NextRequest, NextResponse } from "next/server";
import {
  dbGetPackCodes,
  dbUpsertPackCode,
  dbDeletePackCode,
  isMongoConfigured,
  DbPackCodeItem,
} from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const packCodes = await dbGetPackCodes();
    return NextResponse.json(
      {
        success: true,
        storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
        total: packCodes.length,
        data: packCodes,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi tải danh sách mã bộ";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.code || !String(body.code).trim()) {
      return NextResponse.json(
        { success: false, message: "Mã bộ (code) không được để trống." },
        { status: 400 }
      );
    }

    const cleanCode = String(body.code).trim().toUpperCase();
    const itemData: Partial<DbPackCodeItem> & { code: string } = {
      code: cleanCode,
      name: body.name ? String(body.name).trim() : `Bộ Thẻ ${cleanCode}`,
      categorySlug: body.categorySlug || "khac",
      categoryName: body.categoryName || "Khác",
      description: body.description ? String(body.description).trim() : undefined,
    };

    const saved = await dbUpsertPackCode(itemData);
    return NextResponse.json({
      success: true,
      message: `Đã lưu mã bộ ${saved.code} thành công vào Database MongoDB.`,
      data: saved,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi lưu mã bộ";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    let code = url.searchParams.get("code");

    if (!code) {
      try {
        const body = await request.json();
        code = body.code;
      } catch {
        // bỏ qua nếu body rỗng
      }
    }

    if (!code || !String(code).trim()) {
      return NextResponse.json(
        { success: false, message: "Thiếu tham số code để xóa." },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();
    const count = await dbDeletePackCode(cleanCode);

    return NextResponse.json({
      success: true,
      message: `Đã xóa mã bộ ${cleanCode} khỏi Database MongoDB.`,
      totalRemaining: count,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi xóa mã bộ";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
