import { NextRequest, NextResponse } from "next/server";
import { dbUpsertOrder, dbSyncCustomerFromOrder } from "@/lib/mongodb";
import { SeedOrderItem, SeedOrderLineItem } from "@/data/seed-data";
import { OrderStatus, DeliveryMethod } from "@/types/animal";
import { normalizePhoneNumber } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      address,
      productName,
      quantity = 1,
      totalPrice = 0,
      subtotal = 0,
      shippingFee = 0,
      discountTotal = 0,
      comboName = "",
      comboDiscount = 0,
      paymentMethod = "cod",
      deliveryMethod = "TRUC_TIEP",
      codAmount = 0,
      items = [],
      note = "",
    } = body;

    // Validate required fields
    if (!fullName || !phone || !address) {
      return NextResponse.json(
        { success: false, message: "Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const orderTimestamp = Date.now();
    const orderCode = `ORD-ONL-${orderTimestamp.toString().slice(-6)}`;
    const orderId = `order-onl-${orderTimestamp}`;

    // Map line items snapshot
    const lineItems: SeedOrderLineItem[] = Array.isArray(items) && items.length > 0
      ? items.map((item: any, idx: number) => ({
          id: item.pack?.id || `item-${idx}`,
          name: item.pack?.name || item.name || "Bộ Thẻ AR Poly Cards",
          packCode: item.pack?.packCode || item.packCode,
          categorySlug: item.pack?.categorySlug || item.categorySlug,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.pack?.price || item.unitPrice || 0),
          originalPrice: Number(item.pack?.originalPrice || item.originalPrice || 0),
          totalPrice: Number(item.pack?.price || item.unitPrice || 0) * (Number(item.quantity) || 1),
        }))
      : [
          {
            id: "default-pack",
            name: productName || "Bộ Thẻ Poly Cards",
            quantity: Number(quantity) || 1,
            unitPrice: Number(totalPrice) || 0,
            totalPrice: Number(totalPrice) || 0,
          },
        ];

    const finalTotal = Number(totalPrice) || 0;
    const finalSubtotal = Number(subtotal) || finalTotal;

    const cleanCustName = fullName.trim();
    const cleanCustPhone = normalizedPhone || phone.trim();
    const cleanCustAddress = address.trim();

    // 1. Đồng bộ / tạo hồ sơ khách hàng để cấp Mã Khách Hàng (ví dụ KH-2853)
    const customer = await dbSyncCustomerFromOrder({
      id: orderId,
      customerName: cleanCustName,
      customerPhone: cleanCustPhone,
      customerAddress: cleanCustAddress,
      customerType: "ONLINE",
      totalPrice: finalTotal,
      creditAmount: finalTotal,
    } as any);

    const assignedCustomerId = customer?.id || (cleanCustPhone.length >= 4 ? `KH-${cleanCustPhone.slice(-4)}` : "KH-ONLINE");

    const isBanking = paymentMethod === "banking";
    const effectiveDeliveryMethod: DeliveryMethod = isBanking
      ? "CPN_NHTT"
      : ((deliveryMethod as DeliveryMethod) || "CPN_COD");
    const effectiveCodAmount = isBanking
      ? 0
      : (effectiveDeliveryMethod === "CPN_COD" ? (Number(codAmount) || finalTotal) : 0);

    // 2. Chuẩn bị bản ghi Order để lưu MongoDB
    // LƯU Ý KẾ TOÁN: Khách mới đặt hàng trực tuyến, tiền chưa về tài khoản nên debitAmount = 0 và status = "UNPAID"
    const newOrder: SeedOrderItem = {
      id: orderId,
      code: orderCode,
      codeType: "PACK",
      customerId: assignedCustomerId,
      customerName: cleanCustName,
      customerPhone: cleanCustPhone,
      customerAddress: cleanCustAddress,
      customerType: "ONLINE",
      source: "ONLINE",
      orderStatus: "CHO_DUYET" as OrderStatus,
      deliveryMethod: effectiveDeliveryMethod,
      shippingFee: Number(shippingFee) || 0,
      codAmount: effectiveCodAmount,
      packTitle: productName || (lineItems[0]?.name ?? "Bộ Thẻ Poly Cards"),
      items: lineItems,
      subtotal: finalSubtotal,
      creditAmount: finalTotal,
      debitAmount: 0, // Đơn mới đặt: Chưa thu tiền thực tế
      remainingAmount: finalTotal,
      totalPrice: finalTotal,
      status: "UNPAID", // Trạng thái: Chưa thanh toán
      paymentMethod: isBanking ? "CHUYEN_KHOAN" : "TIEN_MAT",
      comboName: comboName || undefined,
      comboDiscount: Number(comboDiscount) || 0,
      note: note && note.trim() !== "" ? note.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    // 3. Lưu vào cơ sở dữ liệu MongoDB
    await dbUpsertOrder(newOrder);

    // 4. Gửi thông báo Discord Webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const formattedPrice = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    })
      .format(finalTotal)
      .replace("₫", "đ");

    const deliveryMethodLabelMap: Record<string, string> = {
      TRUC_TIEP: "Trực tiếp",
      VAN_CHUYEN_OTO: "Gửi vận chuyển (ô tô)",
      CPN_NHTT: "Gửi CPN NHTT (Người nhận trả cước)",
      CPN_COD: `Gửi CPN COD (Thu hộ: ${new Intl.NumberFormat("vi-VN").format(newOrder.codAmount || finalTotal)} đ)`,
    };

    if (webhookUrl) {
      const itemsListText = lineItems
        .map((it) => `• **${it.name}** x ${it.quantity} (${new Intl.NumberFormat("vi-VN").format(it.totalPrice)} đ)`)
        .join("\n");

      const discordPayload = {
        username: "Poly Cards Bot",
        avatar_url: "https://polycards.vercel.app/images/icons/logo.png",
        embeds: [
          {
            title: `🎉 ĐƠN ĐẶT HÀNG MỚI: ${orderCode}`,
            description: `Khách hàng vừa đặt mua thẻ bài AR trên website **Poly Cards**.\nTrạng thái: 🟡 **Chờ duyệt** | Nguồn: **Online**`,
            color: 0xf59e0b, // Amber / Yellow #F59E0B cho Chờ duyệt
            fields: [
              {
                name: "🔖 Mã Hóa Đơn",
                value: `**${orderCode}**`,
                inline: true,
              },
              {
                name: "👤 Khách Hàng",
                value: `**${fullName.trim()}** ${customer?.id ? `(${customer.id})` : ""}`,
                inline: true,
              },
              {
                name: "📞 Số Điện Thoại",
                value: `**${normalizedPhone || phone.trim()}**`,
                inline: true,
              },
              {
                name: "✉️ Email",
                value: email ? email.trim() : "Không cung cấp",
                inline: true,
              },
              {
                name: "🚚 Hình Thức Giao Nhận",
                value: deliveryMethodLabelMap[deliveryMethod] || deliveryMethod,
                inline: true,
              },
              {
                name: "📍 Địa Chỉ Giao Hàng",
                value: `>>> ${address.trim()}`,
                inline: false,
              },
              {
                name: "📦 Danh Sách Bộ Thẻ",
                value: itemsListText || `**${productName || "Bộ Thẻ Poly Cards"}**\nSố lượng: **${quantity}** bộ`,
                inline: false,
              },
              ...(comboName
                ? [
                    {
                      name: "🎁 Ưu Đãi Combo Áp Dụng",
                      value: `**${comboName}** (Tiết kiệm -${new Intl.NumberFormat("vi-VN").format(Number(comboDiscount) || 0)} đ)`,
                      inline: false,
                    },
                  ]
                : []),
              {
                name: "💰 Tổng Tiền Thanh Toán",
                value: `**${formattedPrice}**`,
                inline: true,
              },
              {
                name: "💳 Thanh Toán",
                value:
                  paymentMethod === "banking"
                    ? "Chuyển khoản QR ngân hàng"
                    : "Thanh toán khi nhận hàng (COD)",
                inline: true,
              },
              {
                name: "📝 Ghi Chú Đơn Hàng",
                value: note && note.trim() !== "" ? note.trim() : "*Không có ghi chú thêm*",
                inline: false,
              },
            ],
            footer: {
              text: `Poly Cards System • Mã KH: ${customer?.id || "Mới"} • Cần duyệt tại /tools`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      try {
        const discordRes = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(discordPayload),
        });

        if (!discordRes.ok) {
          console.error("Discord Webhook Error:", await discordRes.text());
        }
      } catch (webhookErr) {
        console.error("Lỗi gửi Discord webhook:", webhookErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Đơn đặt hàng của bạn đã được tiếp nhận thành công!",
      data: {
        orderId,
        orderCode,
        customerCode: assignedCustomerId,
      },
    });
  } catch (error: any) {
    console.error("Order processing error:", error);
    return NextResponse.json(
      { success: false, message: "Đã có lỗi xảy ra trong quá trình xử lý đơn hàng. Vui lòng thử lại!" },
      { status: 500 }
    );
  }
}
