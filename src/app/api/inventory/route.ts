import { NextRequest, NextResponse } from "next/server";
import {
  getInventoryItems,
  getInventoryTransactions,
  getInventoryStats,
  recordInventoryTransaction,
  updateInventoryConfig,
} from "@/lib/inventory";
import { InventoryTransactionType } from "@/types/inventory";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get("limit")) || 50;

    const [items, transactions, stats] = await Promise.all([
      getInventoryItems(),
      getInventoryTransactions(limitParam),
      getInventoryStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        transactions,
        stats,
      },
    });
  } catch (error) {
    console.error("[API Inventory GET] Lỗi:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi tải dữ liệu kho hàng." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packCode, type, quantity, unitCost, note, customerName, orderCode } = body;

    if (!packCode || !type || quantity === undefined) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin giao dịch kho (packCode, type, quantity)." },
        { status: 400 }
      );
    }

    const result = await recordInventoryTransaction({
      packCode: String(packCode).trim().toUpperCase(),
      type: type as InventoryTransactionType,
      quantity: Number(quantity),
      unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
      note: note || "Giao dịch kho thủ công",
      customerName,
      orderCode,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    const stats = await getInventoryStats();

    return NextResponse.json({
      success: true,
      message: "Đã ghi nhận giao dịch kho thành công!",
      data: {
        item: result.item,
        stats,
      },
    });
  } catch (error) {
    console.error("[API Inventory POST] Lỗi:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi ghi nhận giao dịch kho." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { packCode, allowBackorder, minAlertLevel, unitCost, onHand } = body;

    if (!packCode) {
      return NextResponse.json({ success: false, message: "Thiếu mã bộ packCode." }, { status: 400 });
    }

    const updated = await updateInventoryConfig(String(packCode).trim().toUpperCase(), {
      allowBackorder: allowBackorder !== undefined ? Boolean(allowBackorder) : undefined,
      minAlertLevel: minAlertLevel !== undefined ? Number(minAlertLevel) : undefined,
      unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
      onHand: onHand !== undefined ? Number(onHand) : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy bộ sản phẩm để cập nhật." },
        { status: 404 }
      );
    }

    const stats = await getInventoryStats();

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật cấu hình kho cho ${updated.name}`,
      data: {
        item: updated,
        stats,
      },
    });
  } catch (error) {
    console.error("[API Inventory PATCH] Lỗi:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi cập nhật cấu hình kho." },
      { status: 500 }
    );
  }
}

