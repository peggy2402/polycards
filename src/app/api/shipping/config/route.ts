import { NextRequest, NextResponse } from "next/server";
import { dbGetShippingConfig, dbSaveShippingConfig } from "@/lib/mongodb";
import { ShippingConfig, DEFAULT_SHIPPING_CONFIG } from "@/types/shipping";

export const dynamic = "force-dynamic";

/**
 * GET /api/shipping/config
 * Lấy cấu hình phí vận chuyển và chính sách Freeship hiện tại
 */
export async function GET() {
  try {
    const config = await dbGetShippingConfig();
    return NextResponse.json({
      success: true,
      data: config,
      defaultConfig: DEFAULT_SHIPPING_CONFIG,
    });
  } catch (error) {
    console.error("[API Shipping GET] Lỗi:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tải cấu hình phí vận chuyển." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shipping/config
 * Lưu/Cập nhật cấu hình phí vận chuyển từ Admin Tools
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ShippingConfig>;

    const updated = await dbSaveShippingConfig({
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
      standardFee: body.standardFee !== undefined ? Math.max(0, Number(body.standardFee) || 0) : 30000,
      condition: body.condition || "min_packs",
      minPacksCount: body.minPacksCount !== undefined ? Math.max(1, Number(body.minPacksCount) || 1) : 2,
      minOrderAmount: body.minOrderAmount !== undefined ? Math.max(0, Number(body.minOrderAmount) || 0) : 300000,
      freeshipLabel: body.freeshipLabel?.trim() || "FREESHIP",
      shippingNote: body.shippingNote?.trim() || "Giao hàng nhanh 2–3 ngày, kiểm tra trước khi nhận",
    });

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật cấu hình phí vận chuyển thành công!",
      data: updated,
    });
  } catch (error) {
    console.error("[API Shipping POST] Lỗi:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi lưu cấu hình phí vận chuyển." },
      { status: 500 }
    );
  }
}

