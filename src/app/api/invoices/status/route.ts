import { NextRequest, NextResponse } from "next/server";
import { dbUpdateOrderStatus, dbUpdateOrderDelivery, dbUpdateOrderPayment } from "@/lib/mongodb";
import { OrderStatus, DeliveryMethod } from "@/types/animal";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderStatus, deliveryMethod, codAmount, debitAmount } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Thiếu mã hóa đơn (orderId)." }, { status: 400 });
    }

    let updatedOrder = null;

    if (orderStatus) {
      updatedOrder = await dbUpdateOrderStatus(orderId, orderStatus as OrderStatus);
    }

    if (deliveryMethod) {
      updatedOrder = await dbUpdateOrderDelivery(
        orderId,
        deliveryMethod as DeliveryMethod,
        codAmount !== undefined ? Number(codAmount) : undefined
      );
    }

    if (debitAmount !== undefined && debitAmount !== null) {
      updatedOrder = await dbUpdateOrderPayment(orderId, Number(debitAmount));
    }

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("[API Invoices Status PATCH] Lỗi:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi cập nhật trạng thái hóa đơn." },
      { status: 500 }
    );
  }
}

