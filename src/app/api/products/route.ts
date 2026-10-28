import { NextRequest, NextResponse } from "next/server";
import animalsData from "../../../../data/animals.json";
import { Animal } from "@/types/animal";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q");

    let list = (animalsData as Animal[]).map((a) => ({
      ...a,
      category: a.category || "Động Vật",
      categorySlug: a.categorySlug || "dong-vat",
    }));

    if (category && category !== "all") {
      list = list.filter(
        (item) => item.categorySlug === category || item.category === category
      );
    }

    if (query) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.nameEn.toLowerCase().includes(q) ||
          item.nameVi.toLowerCase().includes(q) ||
          (item.nameZh && item.nameZh.includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      total: list.length,
      data: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.nameEn || !body.nameVi || !body.category) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin bắt buộc (Tên thẻ, Danh mục)." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thẻ sản phẩm đã được tiếp nhận và xử lý thành công.",
      data: body,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
