import { NextRequest, NextResponse } from "next/server";
import { dbGetComboRules, dbUpsertComboRule, dbDeleteComboRule } from "@/lib/mongodb";
import { DbComboRule } from "@/types/animal";

export async function GET() {
  try {
    const rules = await dbGetComboRules();
    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error("[API Combos GET] Lỗi:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tải danh sách combo ưu đãi." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DbComboRule;
    if (!body.name || !body.minPacksCount || body.discountValue === undefined) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập đầy đủ tên combo, số bộ tối thiểu và mức giảm giá." },
        { status: 400 }
      );
    }

    const rule: DbComboRule = {
      ...body,
      id: body.id || `combo-${Date.now().toString(36)}`,
      minPacksCount: Number(body.minPacksCount) || 1,
      discountValue: Number(body.discountValue) || 0,
      discountType: body.discountType || "percent",
      scope: body.scope || "all",
      priority: Number(body.priority) || 10,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    };

    const saved = await dbUpsertComboRule(rule);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("[API Combos POST] Lỗi:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi lưu cấu hình combo." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Thiếu ID combo cần xóa." }, { status: 400 });
    }

    const deleted = await dbDeleteComboRule(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("[API Combos DELETE] Lỗi:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi xóa combo." },
      { status: 500 }
    );
  }
}

