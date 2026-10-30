import { NextRequest, NextResponse } from "next/server";
import {
  dbGetCustomers,
  dbUpsertCustomer,
  dbDeleteCustomer,
  isMongoConfigured,
} from "@/lib/mongodb";
import { SeedCustomerItem } from "@/data/seed-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const query = searchParams.get("q")?.toLowerCase().trim();

    const customers = await dbGetCustomers();

    if (id) {
      const found = customers.find((c) => c.id === id);
      if (!found) {
        return NextResponse.json({ success: false, message: "Khách hàng không tồn tại." }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: found });
    }

    let filtered = customers;
    if (query) {
      filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.phone && c.phone.includes(query)) ||
          (c.address && c.address.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      success: true,
      storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
      total: filtered.length,
      data: filtered,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi tải danh sách khách hàng";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: "Tên khách hàng không được để trống." },
        { status: 400 }
      );
    }

    const customer: SeedCustomerItem = {
      id: body.id || `CUST-${Date.now().toString().slice(-4)}`,
      name: body.name.trim(),
      phone: body.phone ? body.phone.trim() : "",
      address: body.address ? body.address.trim() : "",
      type: body.type === "ONLINE" ? "ONLINE" : "TRUCTIEP",
      orders: Array.isArray(body.orders) ? body.orders : [],
      totalSpent: Number(body.totalSpent) || 0,
      createdAt: body.createdAt || new Date().toLocaleString("vi-VN"),
    };

    const saved = await dbUpsertCustomer(customer);

    return NextResponse.json({
      success: true,
      message: `Đã lưu thông tin khách hàng "${saved.name}" thành công!`,
      data: saved,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi lưu khách hàng";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Thiếu ID khách hàng cần xóa." }, { status: 400 });
    }

    const remaining = await dbDeleteCustomer(id);

    return NextResponse.json({
      success: true,
      message: "Đã xóa khách hàng thành công!",
      remaining,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi xóa khách hàng";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
