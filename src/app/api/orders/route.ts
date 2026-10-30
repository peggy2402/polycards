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
      const parentParam = searchParams.get("codeParent")?.trim().toUpperCase();

      const matched = orders.find((o) => {
        const orderCode = o.code.trim().toUpperCase();
        const packCode = (o.packCode || "").trim().toUpperCase();
        const codeParent = ((o as any).codeParent || "").trim().toUpperCase();
        const childCodes: string[] = Array.isArray((o as any).childCodes)
          ? (o as any).childCodes.map((c: string) => c.trim().toUpperCase())
          : [];
        const itemPackCodes: string[] = Array.isArray(o.items)
          ? o.items.map((i: any) => (i.packCode || "").trim().toUpperCase()).filter(Boolean)
          : [];

        // Nếu có parentParam, ưu tiên đối chiếu mã cha trước
        if (parentParam && (orderCode === parentParam || codeParent === parentParam)) {
          return true;
        }

        // Đối chiếu mã con hoặc mã đơn hàng trực tiếp
        return (
          orderCode === codeParam ||
          packCode === codeParam ||
          codeParent === codeParam ||
          childCodes.includes(codeParam) ||
          itemPackCodes.includes(codeParam)
        );
      });
      if (!matched) {
        return NextResponse.json(
          {
            success: false,
            message: "Mã bộ / Mã hóa đơn không tồn tại trên hệ thống.",
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
    const balanceAmount = debitAmount - creditAmount;
    const paymentMethod = body.paymentMethod === "CHUYEN_KHOAN" ? "CHUYEN_KHOAN" : "TIEN_MAT";

    const newOrder: SeedOrderItem = {
      id: body.id || existing?.id || `ORD-${Date.now().toString().slice(-6)}`,
      code: cleanCode,
      codeType: body.codeType || (cleanCode.startsWith("SINGLE-") ? "SINGLE" : cleanCode.startsWith("MULTI-") ? "MULTI" : "PACK"),
      unlockedSlug: body.unlockedSlug || (cleanCode.startsWith("SINGLE-") ? cleanCode.split("-")[1]?.toLowerCase() : undefined),
      unlockedSlugs: Array.isArray(body.unlockedSlugs) ? body.unlockedSlugs : undefined,
      customerType: body.customerType || "TRUCTIEP",
      customerId: body.customerId || "",
      customerName: body.customerName || "Khách Hàng Trực Tiếp",
      customerPhone: body.customerPhone || "",
      customerAddress: body.customerAddress || "",
      packId: body.packId || "cat-animals",
      packCode: body.packCode || cleanCode,
      packTitle: body.packTitle || "Bộ 30 Thẻ AR Động Vật",
      allowedCategorySlug: body.allowedCategorySlug || "dong-vat",
      items: body.items || [
        {
          id: body.packId || "cat-animals",
          name: body.packTitle || "Bộ 30 Thẻ AR Động Vật",
          packCode: body.packCode || cleanCode,
          categorySlug: body.allowedCategorySlug || "dong-vat",
          quantity: 1,
          unitPrice: creditAmount,
          totalPrice: creditAmount,
        },
      ],
      subtotal: Number(body.subtotal) || creditAmount,
      vatRate: Number(body.vatRate) || 0,
      vatAmount: Number(body.vatAmount) || 0,
      creditAmount,
      debitAmount,
      remainingAmount,
      balanceAmount,
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
