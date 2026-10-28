import { NextRequest, NextResponse } from "next/server";
import { SeedOrderItem } from "@/data/seed-data";
import {
  dbGetOrders,
  dbUpsertOrder,
  dbDeleteOrder,
  dbSyncCustomerFromOrder,
  isMongoConfigured,
} from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codeParam = searchParams.get("code")?.trim().toUpperCase();

    const orders = await dbGetOrders();

    if (codeParam) {
      const matched = orders.find((o) => o.code.trim().toUpperCase() === codeParam);
      if (!matched) {
        return NextResponse.json(
          {
            success: false,
            message: "Mã hóa đơn không tồn tại trên hệ thống.",
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
        data: matched,
      });
    }

    return NextResponse.json({
      success: true,
      storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
      total: orders.length,
      data: orders,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi tải danh sách đơn hàng";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.code) {
      return NextResponse.json(
        { success: false, message: "Mã hóa đơn / bản quyền không được để trống." },
        { status: 400 }
      );
    }

    const orders = await dbGetOrders();
    const cleanCode = String(body.code).trim().toUpperCase();

    const existing = orders.find((o) => o.code === cleanCode || (body.id && o.id === body.id));

    const creditAmount = Number(body.creditAmount) || Number(body.totalPrice) || 249000;
    const debitAmount =
      body.debitAmount !== undefined && body.debitAmount !== null
        ? Number(body.debitAmount)
        : creditAmount;
    const remainingAmount = creditAmount - debitAmount;
    const paymentMethod = body.paymentMethod === "CHUYEN_KHOAN" ? "CHUYEN_KHOAN" : "TIEN_MAT";

    const newOrder: SeedOrderItem = {
      id: body.id || existing?.id || `ORD-${Date.now().toString().slice(-6)}`,
      code: cleanCode,
      customerType: body.customerType || "TRUCTIEP",
      customerName: body.customerName || "Khách Hàng Trực Tiếp",
      customerPhone: body.customerPhone || "",
      customerAddress: body.customerAddress || "",
      packId: body.packId || "cat-animals",
      packCode: body.packCode || "POLY30-DONGVAT",
      packTitle: body.packTitle || "Bộ 30 Thẻ AR Động Vật",
      allowedCategorySlug: body.allowedCategorySlug || "dong-vat",
      items: body.items || [
        {
          id: body.packId || "cat-animals",
          name: body.packTitle || "Bộ 30 Thẻ AR Động Vật",
          packCode: body.packCode || "POLY30-DONGVAT",
          categorySlug: body.allowedCategorySlug || "dong-vat",
          quantity: 1,
          unitPrice: creditAmount,
          totalPrice: creditAmount,
        },
      ],
      creditAmount,
      debitAmount,
      remainingAmount,
      paymentMethod,
      totalPrice: creditAmount,
      status: remainingAmount <= 0 ? "PAID" : "PARTIAL",
      createdAt: body.createdAt || new Date().toLocaleString("vi-VN"),
      note: body.note || "",
      directUrl:
        body.directUrl ||
        `https://polycards-one.vercel.app/ar/lion?ar=1&code=${cleanCode}`,
    };

    const saved = await dbUpsertOrder(newOrder);
    await dbSyncCustomerFromOrder(saved);

    return NextResponse.json({
      success: true,
      storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
      message: `Đã lưu đơn hàng / mã bộ ${saved.code} thành công vào MongoDB!`,
      data: saved,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi lưu đơn hàng";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const code = searchParams.get("code");

    if (!id && !code) {
      return NextResponse.json(
        { success: false, message: "Cần cung cấp id hoặc code để xóa đơn hàng." },
        { status: 400 }
      );
    }

    const remainingCount = await dbDeleteOrder(id, code);

    return NextResponse.json({
      success: true,
      message: "Đã xóa đơn hàng thành công khỏi MongoDB!",
      remainingCount,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi xóa đơn hàng";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
