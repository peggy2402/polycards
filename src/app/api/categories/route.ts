import { NextRequest, NextResponse } from "next/server";
import { ProductCategory } from "@/types/animal";
import {
  dbGetCategories,
  dbUpsertCategory,
  dbDeleteCategory,
  isMongoConfigured,
} from "@/lib/mongodb";
import { verifyAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  try {
    const categories = await dbGetCategories();
    return NextResponse.json(
      {
        success: true,
        storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
        total: categories.length,
        data: categories,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi tải danh mục";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, message: "Từ chối truy cập: Yêu cầu quyền tác giả để thêm/cập nhật danh mục." },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, message: "Tên danh mục không được để trống." },
        { status: 400 }
      );
    }

    const categories = await dbGetCategories();
    const cleanName = String(body.name).trim();
    const cleanSlug =
      body.slug ||
      cleanName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const existing = categories.find((c) => c.id === body.id || c.slug === cleanSlug);

    const categoryItem: ProductCategory = {
      id: body.id || existing?.id || `cat-${cleanSlug}`,
      name: cleanName,
      slug: cleanSlug,
      packCode:
        body.packCode ||
        existing?.packCode ||
        `POLY30-${cleanSlug.replace(/-/g, "").toUpperCase()}`,
      totalCards: Number(body.totalCards) || existing?.totalCards || 30,
      description: body.description || existing?.description || `Bộ thẻ bài AR ${cleanName}`,
      iconName: body.iconName || existing?.iconName || "Layers",
      createdAt: body.createdAt || existing?.createdAt || new Date().toISOString().split("T")[0],
    };

    const saved = await dbUpsertCategory(categoryItem);

    return NextResponse.json({
      success: true,
      storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
      message: `Đã lưu danh mục "${saved.name}" vào MongoDB!`,
      data: saved,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi lưu danh mục";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, message: "Từ chối truy cập: Yêu cầu quyền tác giả để xóa danh mục." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Cần cung cấp id danh mục để xóa." },
        { status: 400 }
      );
    }

    await dbDeleteCategory(id);
    const remaining = await dbGetCategories();

    return NextResponse.json({
      success: true,
      message: "Đã xóa danh mục thành công khỏi MongoDB!",
      remainingCount: remaining.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi xóa danh mục";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
