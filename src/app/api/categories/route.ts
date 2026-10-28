import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CATEGORIES } from "@/lib/products-store";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: DEFAULT_CATEGORIES,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: "Tên danh mục không được để trống." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã tiếp nhận danh mục ${body.name}`,
      data: body,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
