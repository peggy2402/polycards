import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const ORDERS_FILE_PATH = path.join(process.cwd(), "data", "orders.json");
const CUSTOMERS_FILE_PATH = path.join(process.cwd(), "data", "customers.json");

interface OrderItem {
  id: string;
  code: string;
  customerType: "TRUCTIEP" | "ONLINE";
  customerName: string;
  customerPhone?: string;
  packId?: string;
  packCode?: string;
  packTitle: string;
  allowedCategorySlug?: string;
  totalPrice?: number;
  status?: string;
  createdAt?: string;
  note?: string;
  directUrl?: string;
}

interface CustomerItem {
  id: string;
  name: string;
  phone?: string;
  type: "TRUCTIEP" | "ONLINE";
  orders: string[];
  totalSpent: number;
  createdAt: string;
}

async function readOrders(): Promise<OrderItem[]> {
  try {
    if (fsSync.existsSync(ORDERS_FILE_PATH)) {
      const content = await fs.readFile(ORDERS_FILE_PATH, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("Lỗi đọc orders.json:", err);
  }
  return [];
}

async function writeOrders(orders: OrderItem[]): Promise<void> {
  await fs.writeFile(ORDERS_FILE_PATH, JSON.stringify(orders, null, 2), "utf8");
}

async function readCustomers(): Promise<CustomerItem[]> {
  try {
    if (fsSync.existsSync(CUSTOMERS_FILE_PATH)) {
      const content = await fs.readFile(CUSTOMERS_FILE_PATH, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("Lỗi đọc customers.json:", err);
  }
  return [];
}

async function writeCustomers(customers: CustomerItem[]): Promise<void> {
  await fs.writeFile(CUSTOMERS_FILE_PATH, JSON.stringify(customers, null, 2), "utf8");
}

export async function GET() {
  try {
    const orders = await readOrders();
    return NextResponse.json({
      success: true,
      total: orders.length,
      data: orders,
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
    if (!body.code) {
      return NextResponse.json(
        { success: false, message: "Mã hóa đơn / bản quyền không được để trống." },
        { status: 400 }
      );
    }

    const orders = await readOrders();
    const cleanCode = body.code.trim().toUpperCase();

    const existingIndex = orders.findIndex((o) => o.code === cleanCode || (body.id && o.id === body.id));

    const newOrder: OrderItem = {
      id: body.id || (existingIndex >= 0 ? orders[existingIndex].id : `ORD-${Date.now().toString().slice(-6)}`),
      code: cleanCode,
      customerType: body.customerType || "TRUCTIEP",
      customerName: body.customerName || "Khách Hàng Trực Tiếp",
      customerPhone: body.customerPhone || "",
      packId: body.packId || "cat-animals",
      packCode: body.packCode || "POLY30-DONGVAT",
      packTitle: body.packTitle || "Bộ 30 Thẻ AR Động Vật",
      allowedCategorySlug: body.allowedCategorySlug || "dong-vat",
      totalPrice: Number(body.totalPrice) || 249000,
      status: body.status || "PAID",
      createdAt: body.createdAt || new Date().toLocaleString("vi-VN"),
      note: body.note || "",
      directUrl: body.directUrl || `https://polycards-one.vercel.app/ar/lion?ar=1&code=${cleanCode}`,
    };

    let updatedOrders: OrderItem[];
    if (existingIndex >= 0) {
      updatedOrders = [...orders];
      updatedOrders[existingIndex] = { ...updatedOrders[existingIndex], ...newOrder };
    } else {
      updatedOrders = [newOrder, ...orders];
    }

    await writeOrders(updatedOrders);

    // Đồng bộ vào customers.json nếu có tên hoặc số điện thoại
    if (newOrder.customerName) {
      try {
        const customers = await readCustomers();
        const custIdx = customers.findIndex(
          (c) => (newOrder.customerPhone && c.phone === newOrder.customerPhone) || c.name === newOrder.customerName
        );

        if (custIdx >= 0) {
          if (!customers[custIdx].orders.includes(newOrder.id)) {
            customers[custIdx].orders.push(newOrder.id);
            customers[custIdx].totalSpent += newOrder.totalPrice || 0;
          }
        } else {
          customers.push({
            id: `CUST-${Date.now().toString().slice(-4)}`,
            name: newOrder.customerName,
            phone: newOrder.customerPhone || "",
            type: newOrder.customerType,
            orders: [newOrder.id],
            totalSpent: newOrder.totalPrice || 0,
            createdAt: new Date().toLocaleString("vi-VN"),
          });
        }
        await writeCustomers(customers);
      } catch (custErr) {
        console.warn("Lỗi sync customer:", custErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã lưu đơn hàng / mã bộ ${newOrder.code} thành công vào data/orders.json!`,
      data: newOrder,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
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

    const orders = await readOrders();
    const filtered = orders.filter((o) => (id ? o.id !== id : o.code !== code));

    await writeOrders(filtered);

    return NextResponse.json({
      success: true,
      message: "Đã xóa đơn hàng thành công khỏi data/orders.json",
      remainingCount: filtered.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
