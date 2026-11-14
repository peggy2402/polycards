import { NextRequest, NextResponse } from "next/server";
import { dbGetOrders } from "@/lib/mongodb";
import { normalizePhoneNumber } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("q") || searchParams.get("phone") || searchParams.get("code") || "").trim();

    if (!rawQuery) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập số điện thoại hoặc mã đơn hàng để tra cứu." },
        { status: 400 }
      );
    }

    const cleanInput = rawQuery.replace(/[\s\.\-\(\)]/g, "");
    const normalizedPhone = normalizePhoneNumber(cleanInput);
    const cleanUpper = cleanInput.toUpperCase();

    const allOrders = await dbGetOrders();

    // Lọc các đơn hàng khớp với số điện thoại hoặc mã đơn hàng
    const matchedOrders = allOrders.filter((order) => {
      // 1. Đối chiếu theo mã đơn hoặc id
      const orderCode = (order.code || "").toUpperCase().replace(/[\s\.\-]/g, "");
      const orderId = (order.id || "").toUpperCase().replace(/[\s\.\-]/g, "");
      const packCode = (order.packCode || "").toUpperCase().replace(/[\s\.\-]/g, "");

      if (
        orderCode.includes(cleanUpper) ||
        cleanUpper.includes(orderCode) ||
        orderId.includes(cleanUpper) ||
        cleanUpper.includes(orderId) ||
        (packCode && (packCode.includes(cleanUpper) || cleanUpper.includes(packCode)))
      ) {
        return true;
      }

      // 2. Đối chiếu theo số điện thoại
      const custPhone = (order.customerPhone || "").replace(/[\s\.\-\(\)]/g, "");
      if (custPhone) {
        const normalizedCustPhone = normalizePhoneNumber(custPhone);
        if (
          custPhone === cleanInput ||
          (normalizedPhone && normalizedCustPhone === normalizedPhone) ||
          custPhone.endsWith(cleanInput) ||
          cleanInput.endsWith(custPhone)
        ) {
          return true;
        }
      }

      return false;
    });

    // Sắp xếp đơn mới nhất lên đầu
    matchedOrders.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    // Chuẩn hóa dữ liệu trả về an toàn cho người dùng
    const sanitizedOrders = matchedOrders.map((ord) => {
      const deliveryMethodLabelMap: Record<string, string> = {
        TRUC_TIEP: "Nhận trực tiếp tại quầy",
        VAN_CHUYEN_OTO: "Gửi xe khách / Ô tô vận tải",
        CPN_NHTT: "Chuyển phát nhanh (Người nhận trả cước)",
        CPN_COD: "Giao tận nhà thu hộ COD",
      };

      const orderStatusLabelMap: Record<string, { label: string; step: number; color: string; desc: string }> = {
        CHO_DUYET: {
          label: "Chờ Duyệt & Chuẩn Bị Hàng",
          step: 1,
          color: "amber",
          desc: "Đơn hàng đã được ghi nhận vào hệ thống. Xưởng in & đóng gói đang chuẩn bị bộ thẻ cho bạn.",
        },
        DANG_GIAO: {
          label: "Đang Vận Chuyển",
          step: 2,
          color: "sky",
          desc: "Kiện hàng đã được bàn giao cho bưu tá bưu cục để phát tới địa chỉ của bạn.",
        },
        DA_NHAN: {
          label: "Giao Thành Công",
          step: 3,
          color: "emerald",
          desc: "Đơn hàng đã được giao hoàn tất. Bạn có thể mở camera quét WebAR trải nghiệm ngay!",
        },
        DA_HUY: {
          label: "Đã Hủy",
          step: 0,
          color: "rose",
          desc: "Đơn hàng đã được hủy hoặc hoàn trả.",
        },
      };

      const currentStatusKey = (ord.orderStatus || "CHO_DUYET") as string;
      const statusMeta = orderStatusLabelMap[currentStatusKey] || orderStatusLabelMap["CHO_DUYET"];

      // Che bớt số điện thoại bảo mật (chỉ hiện 3 số đầu và 3 số cuối)
      const rawPhone = ord.customerPhone || "";
      const maskedPhone =
        rawPhone.length >= 8
          ? `${rawPhone.slice(0, 3)}****${rawPhone.slice(-3)}`
          : rawPhone;

      return {
        id: ord.id,
        code: ord.code,
        customerId: ord.customerId,
        customerName: ord.customerName,
        customerPhoneMasked: maskedPhone,
        customerAddress: ord.customerAddress || "",
        createdAt: ord.createdAt,
        totalPrice: ord.totalPrice || ord.creditAmount || 0,
        subtotal: ord.subtotal || 0,
        shippingFee: ord.shippingFee || 0,
        debitAmount: ord.debitAmount || 0,
        remainingAmount: (ord.creditAmount || ord.totalPrice || 0) - (ord.debitAmount || 0),
        status: ord.status, // PAID / UNPAID / PARTIAL
        orderStatus: ord.orderStatus || "CHO_DUYET",
        statusMeta,
        paymentMethod: ord.paymentMethod === "CHUYEN_KHOAN" ? "Chuyển khoản QR ngân hàng" : "Thanh toán khi nhận hàng (COD)",
        deliveryMethodLabel: deliveryMethodLabelMap[ord.deliveryMethod || "TRUC_TIEP"] || ord.deliveryMethod || "Chuyển phát tiêu chuẩn",
        comboName: ord.comboName,
        comboDiscount: ord.comboDiscount || 0,
        items: Array.isArray(ord.items) && ord.items.length > 0
          ? ord.items.map((it) => ({
              id: it.id,
              name: it.name,
              packCode: it.packCode,
              quantity: it.quantity || 1,
              unitPrice: it.unitPrice || 0,
              totalPrice: it.totalPrice || 0,
            }))
          : [
              {
                id: "item-default",
                name: ord.packTitle || "Bộ 30 Thẻ AR Poly Cards",
                packCode: ord.packCode || ord.code,
                quantity: 1,
                unitPrice: ord.creditAmount || ord.totalPrice || 0,
                totalPrice: ord.creditAmount || ord.totalPrice || 0,
              },
            ],
        // Mã bản quyền kích hoạt WebAR (khi đã hoàn tất)
        directUrl: ord.directUrl,
      };
    });

    return NextResponse.json({
      success: true,
      query: rawQuery,
      totalOrders: sanitizedOrders.length,
      data: sanitizedOrders,
    });
  } catch (error) {
    console.error("[API Orders Lookup] Lỗi tra cứu:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi trong quá trình tra cứu đơn hàng. Vui lòng thử lại!" },
      { status: 500 }
    );
  }
}

