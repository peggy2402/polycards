import nodemailer from "nodemailer";

interface SendOrderEmailParams {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  totalPrice: number;
  subtotal: number;
  shippingFee: number;
  paymentMethod: string;
  deliveryMethodLabel: string;
  items: Array<{
    name: string;
    packCode?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  comboName?: string;
  comboDiscount?: number;
  note?: string;
}

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, ""), // Bỏ khoảng trắng nếu có
    },
  });
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export async function sendOrderNotificationEmails(params: SendOrderEmailParams): Promise<{
  adminSuccess: boolean;
  customerSuccess: boolean;
  error?: string;
}> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[Mailer] Chưa cấu hình SMTP_USER hoặc SMTP_PASS.");
    return { adminSuccess: false, customerSuccess: false, error: "Chưa cấu hình SMTP" };
  }

  const fromSender = process.env.SMTP_FROM || `Poly Cards <${process.env.SMTP_USER}>`;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || "hello@polycards.vn";
  const fallbackAdmin = process.env.FALLBACK_ADMIN_EMAIL || process.env.SMTP_USER;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://polycards.vn";
  const lookupUrl = `${siteUrl}/lookup?q=${encodeURIComponent(params.customerPhone || params.orderCode)}`;

  // Tạo bảng HTML các bộ thẻ đã đặt
  const itemsHtml = params.items
    .map(
      (it, idx) => `
      <tr style="border-bottom: 1px solid #292524;">
        <td style="padding: 10px 8px; color: #f5f5f4; font-size: 13px;">
          <strong>${idx + 1}. ${it.name}</strong>
          ${it.packCode ? `<br/><span style="color: #a8a29e; font-size: 11px; font-family: monospace;">Mã: ${it.packCode}</span>` : ""}
        </td>
        <td style="padding: 10px 8px; color: #fbbf24; text-align: center; font-weight: bold; font-size: 13px;">
          x${it.quantity}
        </td>
        <td style="padding: 10px 8px; color: #fafaf9; text-align: right; font-weight: bold; font-size: 13px; font-family: monospace;">
          ${formatVnd(it.totalPrice)}
        </td>
      </tr>
    `
    )
    .join("");

  // 1. MẪU EMAIL THÔNG BÁO CHO QUẢN TRỊ VIÊN (ADMIN)
  const adminSubject = `[ĐƠN HÀNG MỚI] #${params.orderCode} - ${params.customerName} (${formatVnd(params.totalPrice)})`;
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Đơn hàng mới #${params.orderCode}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #1c1917; border-radius: 16px; border: 2px solid #f59e0b; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <!-- Header -->
        <tr>
          <td style="padding: 24px 24px 16px; background: linear-gradient(135deg, #292524 0%, #1c1917 100%); border-bottom: 1px solid #44403c;">
            <div style="font-size: 11px; font-weight: 900; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
              POLY CARDS • HỆ THỐNG THÔNG BÁO TỰ ĐỘNG
            </div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff;">
              Có Đơn Đặt Mua Mới: <span style="color: #fbbf24;">#${params.orderCode}</span>
            </h1>
          </td>
        </tr>

        <!-- Nội dung chính -->
        <tr>
          <td style="padding: 24px;">
            <!-- Khối thông tin khách hàng -->
            <table width="100%" style="background-color: #292524; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #44403c;">
              <tr>
                <td style="font-size: 12px; color: #a8a29e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;" colspan="2">
                  THÔNG TIN KHÁCH HÀNG &amp; GIAO NHẬN
                </td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #d6d3d1; padding: 4px 0; width: 120px;">Họ tên:</td>
                <td style="font-size: 13px; color: #ffffff; font-weight: bold; padding: 4px 0;">${params.customerName}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #d6d3d1; padding: 4px 0;">Số điện thoại:</td>
                <td style="font-size: 14px; color: #fbbf24; font-weight: bold; font-family: monospace; padding: 4px 0;">
                  <a href="tel:${params.customerPhone}" style="color: #fbbf24; text-decoration: none;">${params.customerPhone}</a>
                </td>
              </tr>
              ${
                params.customerEmail
                  ? `<tr>
                      <td style="font-size: 13px; color: #d6d3d1; padding: 4px 0;">Email:</td>
                      <td style="font-size: 13px; color: #ffffff; padding: 4px 0;">${params.customerEmail}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="font-size: 13px; color: #d6d3d1; padding: 4px 0; vertical-align: top;">Địa chỉ:</td>
                <td style="font-size: 13px; color: #ffffff; font-weight: 500; padding: 4px 0; line-height: 1.4;">${params.customerAddress}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #d6d3d1; padding: 4px 0;">Hình thức giao:</td>
                <td style="font-size: 13px; color: #38bdf8; font-weight: bold; padding: 4px 0;">${params.deliveryMethodLabel}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #d6d3d1; padding: 4px 0;">Thanh toán:</td>
                <td style="font-size: 13px; color: #34d399; font-weight: bold; padding: 4px 0;">${params.paymentMethod}</td>
              </tr>
              ${
                params.note
                  ? `<tr>
                      <td style="font-size: 13px; color: #d6d3d1; padding: 4px 0; vertical-align: top;">Ghi chú:</td>
                      <td style="font-size: 13px; color: #fde047; font-style: italic; padding: 4px 0;">"${params.note}"</td>
                    </tr>`
                  : ""
              }
            </table>

            <!-- Bảng danh sách sản phẩm -->
            <table width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="border-bottom: 2px solid #f59e0b; background-color: #292524;">
                  <th align="left" style="padding: 10px 8px; color: #fbbf24; font-size: 11px; text-transform: uppercase;">Bộ Thẻ Đặt Mua</th>
                  <th align="center" style="padding: 10px 8px; color: #fbbf24; font-size: 11px; text-transform: uppercase; width: 60px;">SL</th>
                  <th align="right" style="padding: 10px 8px; color: #fbbf24; font-size: 11px; text-transform: uppercase; width: 100px;">Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Tổng kết tiền -->
            <table width="100%" style="background-color: #292524; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
              ${
                params.comboName
                  ? `<tr>
                      <td style="font-size: 12px; color: #fbbf24; padding: 3px 0;">Ưu đãi Combo:</td>
                      <td style="font-size: 12px; color: #34d399; text-align: right; font-weight: bold; padding: 3px 0;">-${formatVnd(params.comboDiscount || 0)}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="font-size: 12px; color: #a8a29e; padding: 3px 0;">Phí vận chuyển:</td>
                <td style="font-size: 12px; color: #ffffff; text-align: right; font-weight: bold; padding: 3px 0;">
                  ${params.shippingFee > 0 ? formatVnd(params.shippingFee) : "Miễn Phí (Freeship)"}
                </td>
              </tr>
              <tr style="border-top: 1px dashed #44403c;">
                <td style="font-size: 15px; color: #ffffff; font-weight: 900; padding: 8px 0 0;">TỔNG THU:</td>
                <td style="font-size: 18px; color: #f59e0b; text-align: right; font-weight: 900; font-family: monospace; padding: 8px 0 0;">
                  ${formatVnd(params.totalPrice)}
                </td>
              </tr>
            </table>

            <!-- Nút bấm duyệt đơn -->
            <div style="text-align: center; margin-top: 20px;">
              <a href="${siteUrl}/tools?tab=invoices" style="display: inline-block; background-color: #f59e0b; color: #0c0a09; font-weight: 900; font-size: 13px; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                Mở Quản Trị Duyệt Đơn
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 16px 24px; background-color: #141211; border-top: 1px solid #292524; text-align: center; font-size: 11px; color: #78716c;">
            Hệ thống quản lý đơn hàng Poly Cards • Bản quyền © ${new Date().getFullYear()} polycards.vn
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  let adminSuccess = false;
  let customerSuccess = false;
  let lastError: string | undefined;

  // Gửi cho Admin (Gửi cả hello@polycards.vn và fallback)
  try {
    const recipients = [adminEmail];
    if (fallbackAdmin && fallbackAdmin !== adminEmail && !recipients.includes(fallbackAdmin)) {
      recipients.push(fallbackAdmin);
    }

    await transporter.sendMail({
      from: fromSender,
      to: recipients.join(", "),
      subject: adminSubject,
      html: adminHtml,
    });
    adminSuccess = true;
  } catch (err: any) {
    console.error("[Mailer] Lỗi gửi email cho Admin:", err);
    lastError = err?.message || String(err);
  }

  // 2. MẪU EMAIL XÁC NHẬN CHO KHÁCH HÀNG (Nếu khách có nhập email)
  if (params.customerEmail && params.customerEmail.includes("@")) {
    try {
      const customerSubject = `Xác nhận đơn đặt mua Poly Cards #${params.orderCode}`;
      const customerHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Xác nhận đơn hàng #${params.orderCode}</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding: 24px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); text-align: center;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff;">
                  POLY CARDS • THẾ GIỚI THẺ BÀI AR
                </h1>
                <p style="margin: 4px 0 0; font-size: 13px; color: #fef3c7; font-weight: 500;">
                  Cảm ơn bạn đã đặt mua sản phẩm!
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 24px;">
                <p style="font-size: 14px; color: #44403c; line-height: 1.5; margin-top: 0;">
                  Xin chào <strong>${params.customerName}</strong>,<br/>
                  Đơn đặt mua thẻ bài tương tác 3D WebAR của bạn đã được ghi nhận với mã đơn: <strong style="color: #b45309; font-family: monospace;">#${params.orderCode}</strong>.
                </p>

                <table width="100%" style="border-collapse: collapse; margin: 20px 0; background-color: #f5f5f4; border-radius: 12px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #e7e5e4;">
                      <th align="left" style="padding: 10px 12px; font-size: 12px; color: #44403c;">Bộ Thẻ Đã Đặt</th>
                      <th align="center" style="padding: 10px 12px; font-size: 12px; color: #44403c; width: 50px;">SL</th>
                      <th align="right" style="padding: 10px 12px; font-size: 12px; color: #44403c; width: 90px;">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${params.items
                      .map(
                        (it) => `
                      <tr style="border-bottom: 1px solid #e7e5e4;">
                        <td style="padding: 10px 12px; font-size: 13px; color: #1c1917; font-weight: 600;">${it.name}</td>
                        <td style="padding: 10px 12px; font-size: 13px; color: #b45309; text-align: center; font-weight: bold;">x${it.quantity}</td>
                        <td style="padding: 10px 12px; font-size: 13px; color: #1c1917; text-align: right; font-weight: bold; font-family: monospace;">${formatVnd(it.totalPrice)}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>

                <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                  <div style="font-size: 13px; color: #92400e; margin-bottom: 4px;">
                    <strong>Tổng thanh toán:</strong> <span style="font-size: 16px; font-weight: 900; color: #b45309; font-family: monospace;">${formatVnd(params.totalPrice)}</span>
                  </div>
                  <div style="font-size: 12px; color: #78350f;">
                    <strong>Hình thức:</strong> ${params.paymentMethod} • ${params.deliveryMethodLabel}
                  </div>
                  <div style="font-size: 12px; color: #78350f; margin-top: 4px;">
                    <strong>Địa chỉ giao:</strong> ${params.customerAddress}
                  </div>
                </div>

                <div style="text-align: center; margin: 24px 0 10px;">
                  <a href="${lookupUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25);">
                    Theo Dõi &amp; Tra Cứu Đơn Hàng Này
                  </a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding: 16px 24px; background-color: #f5f5f4; border-top: 1px solid #e7e5e4; text-align: center; font-size: 11px; color: #78716c;">
                Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ Hotline/Zalo: <strong>0934.587.229</strong> hoặc email <strong>hello@polycards.vn</strong>.
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: fromSender,
        to: params.customerEmail.trim(),
        subject: customerSubject,
        html: customerHtml,
      });
      customerSuccess = true;
    } catch (err: any) {
      console.error("[Mailer] Lỗi gửi email cho Khách hàng:", err);
    }
  }

  return { adminSuccess, customerSuccess, error: lastError };
}

