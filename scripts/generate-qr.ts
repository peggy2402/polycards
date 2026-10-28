import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { INITIAL_PRODUCTS } from "../src/data/seed-data";

async function generateQrCodes() {
  const rootDir = process.cwd();
  const outputDir = path.join(rootDir, "public", "qr-output");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://polycards-one.vercel.app";

  console.log(
    `[QR Generator] Đang khởi tạo mã QR cho ${INITIAL_PRODUCTS.length} thẻ bài với domain: ${siteUrl}...`
  );

  for (const animal of INITIAL_PRODUCTS) {
    const targetUrl = `${siteUrl}/ar/${animal.slug}`;

    const qrOptions: QRCode.QRCodeToFileOptions = {
      type: "png",
      errorCorrectionLevel: "H",
      margin: 2,
      scale: 12,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    };

    const pngPathPublic = path.join(outputDir, `${animal.slug}-qr.png`);
    await QRCode.toFile(pngPathPublic, targetUrl, qrOptions);

    const svgPathPublic = path.join(outputDir, `${animal.slug}-qr.svg`);
    const svgContent = await QRCode.toString(targetUrl, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
    });
    fs.writeFileSync(svgPathPublic, svgContent);

    console.log(`[OK] [${animal.nameEn}] -> URL: ${targetUrl}`);
  }

  console.log("\n[DONE] Đã tạo thành công toàn bộ mã QR vào public/qr-output/!");
}

generateQrCodes().catch((err) => {
  console.error("Lỗi khi tạo mã QR:", err);
  process.exit(1);
});
