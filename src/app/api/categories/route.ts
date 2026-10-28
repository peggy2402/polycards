import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { DEFAULT_CATEGORIES } from "@/lib/products-store";
import { ProductCategory } from "@/types/animal";

const CATEGORIES_FILE_PATH = path.join(process.cwd(), "data", "categories.json");

async function readCategories(): Promise<ProductCategory[]> {
  try {
    if (fsSync.existsSync(CATEGORIES_FILE_PATH)) {
      const content = await fs.readFile(CATEGORIES_FILE_PATH, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("Lỗi đọc categories.json:", err);
  }
  return DEFAULT_CATEGORIES;
}

async function writeCategories(list: ProductCategory[]): Promise<void> {
  await fs.writeFile(CATEGORIES_FILE_PATH, JSON.stringify(list, null, 2), "utf8");
}

export async function GET() {
  const categories = await readCategories();
  return NextResponse.json({
    success: true,
    total: categories.length,
    data: categories,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: "Tên danh mục không được để trống." },
        { status: 400 }
      );
    }

    const categories = await readCategories();
    const cleanName = body.name.trim();
    const cleanSlug = body.slug || cleanName.toLowerCase().replace(/\s+/g, "-");

    const existingIdx = categories.findIndex((c) => c.id === body.id || c.slug === cleanSlug);

    const categoryItem: ProductCategory = {
      id: body.id || (existingIdx >= 0 ? categories[existingIdx].id : `cat-${cleanSlug}`),
      name: cleanName,
      slug: cleanSlug,
      description: body.description || `Bộ thẻ bài AR ${cleanName}`,
      iconName: body.iconName || "Layers",
      createdAt: body.createdAt || new Date().toISOString().split("T")[0],
    };

    let updated: ProductCategory[];
    if (existingIdx >= 0) {
      updated = [...categories];
      updated[existingIdx] = { ...updated[existingIdx], ...categoryItem };
    } else {
      updated = [...categories, categoryItem];
    }

    await writeCategories(updated);

    return NextResponse.json({
      success: true,
      message: `Đã lưu danh mục "${categoryItem.name}" vào data/categories.json`,
      data: categoryItem,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Cần cung cấp id danh mục để xóa." },
        { status: 400 }
      );
    }

    const categories = await readCategories();
    const updated = categories.filter((c) => c.id !== id);
    await writeCategories(updated);

    return NextResponse.json({
      success: true,
      message: "Đã xóa danh mục thành công khỏi data/categories.json",
      remainingCount: updated.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

