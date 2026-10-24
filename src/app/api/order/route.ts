import { NextRequest, NextResponse } from "next/server";

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
      paymentMethod = "cod",
      note = "",
    } = body;

    // Validate required fields
    if (!fullName || !phone || !address) {
      return NextResponse.json(
        { success: false, message: "Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng." },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    // Format currency string
    const formattedPrice = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    })
      .format(totalPrice)
      .replace("₫", "đ");

    // Format Discord Webhook Embed Payload
    if (webhookUrl) {
      const discordPayload = {
        username: "Poly Cards Bot",
        avatar_url: "https://polycards.vercel.app/images/icons/logo.png",
        embeds: [
          {
            title: "🎉 ĐƠN ĐẶT HÀNG THẺ BÀI AR POLY CARDS MỚI!",
            description: `Khách hàng vừa hoàn tất biểu mẫu đặt thẻ bài AR thông minh trên website **Poly Cards**.`,
            color: 0x10b981, // Emerald green #10B981
            fields: [
              {
                name: "👤 Người Nhận Hàng",
                value: `**${fullName.trim()}**`,
                inline: true,
              },
              {
                name: "📞 Số Điện Thoại",
                value: `**${phone.trim()}**`,
                inline: true,
              },
              {
                name: "✉️ Email",
                value: email ? email.trim() : "Không cung cấp",
                inline: true,
              },
              {
                name: "📍 Địa Chỉ Giao Hàng",
                value: `>>> ${address.trim()}`,
                inline: false,
              },
              {
                name: "📦 Bộ Thẻ Đặt Mua",
                value: `**${productName || "Bộ Thẻ Poly Cards"}**\nSố lượng: **${quantity}** bộ`,
                inline: true,
              },
              {
                name: "💰 Tổng Tiền Dự Kiến",
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
                name: "📝 Lời Nhắn / Ghi Chú",
                value: note && note.trim() !== "" ? note.trim() : "*Không có ghi chú thêm*",
                inline: false,
              },
            ],
            footer: {
              text: "Poly Cards System • Thông báo đơn hàng tự động",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

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
    } else {
      console.warn("DISCORD_WEBHOOK_URL is not configured in .env!");
    }

    return NextResponse.json({
      success: true,
      message: "Đơn đặt hàng của bạn đã được tiếp nhận thành công!",
    });
  } catch (error: any) {
    console.error("Order processing error:", error);
    return NextResponse.json(
      { success: false, message: "Đã có lỗi xảy ra trong quá trình xử lý đơn hàng. Vui lòng thử lại!" },
      { status: 500 }
    );
  }
}
