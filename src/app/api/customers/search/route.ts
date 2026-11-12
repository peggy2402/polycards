import { NextRequest, NextResponse } from "next/server";
import { dbSearchCustomerByPhone } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone") || "";

    if (!phone || phone.trim().length < 4) {
      return NextResponse.json({ success: true, data: null });
    }

    const customer = await dbSearchCustomerByPhone(phone);
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error("[API Customer Search] Lỗi:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi tìm kiếm khách hàng." },
      { status: 500 }
    );
  }
}

