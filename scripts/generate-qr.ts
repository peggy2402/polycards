import fs from "fs";
import path from "path";
import QRCode from "qrcode";

interface AnimalData {
  id: string;
  slug: string;
  qrCode: string;
  nameEn: string;
  nameVi: string;
}

async function generateQrCodes() {
  const rootDir = process.cwd();
  const animalsJsonPath = path.join(rootDir, "data", "animals.json");
  const outputDir = path.join(rootDir, "public", "qr-output");
  const rootOutputDir = path.join(rootDir, "qr-output");

  // Đảm bảo các thư mục output tồn tại
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(rootOutputDir)) {
    fs.mkdirSync(rootOutputDir, { recursive: true });
  }

  const rawData = fs.readFileSync(animalsJsonPath, "utf-8");
  const animals: AnimalData[] = JSON.parse(rawData);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://polycards.vn";

  console.log(`🚀 Đang khởi tạo mã QR cho ${animals.length} con vật với domain gốc: ${siteUrl}...`);

  for (const animal of animals) {
    // 1. Nội dung chuẩn: Đường link trực tiếp tới trang 3D AR
    const targetUrl = `${siteUrl}/ar/${animal.slug}`;

    // Tùy chọn render QR chất lượng cao, có bo viền trắng để in ấn sắc nét
    const qrOptions: QRCode.QRCodeToFileOptions = {
      type: "png",
      errorCorrectionLevel: "H", // Mức sửa lỗi cao nhất (High - 30%), giúp quét cực nhạy cả khi in nhỏ trên thẻ
      margin: 2,
      scale: 12,
      color: {
        dark: "#0F172A", // Slate 900
        light: "#FFFFFF",
      },
    };

    // Xuất file PNG
    const pngPathPublic = path.join(outputDir, `${animal.slug}-qr.png`);
    const pngPathRoot = path.join(rootOutputDir, `${animal.slug}-qr.png`);
    await QRCode.toFile(pngPathPublic, targetUrl, qrOptions);
    await QRCode.toFile(pngPathRoot, targetUrl, qrOptions);

    // Xuất file SVG (vector siêu nét cho in ấn thẻ bài thực tế)
    const svgPathPublic = path.join(outputDir, `${animal.slug}-qr.svg`);
    const svgPathRoot = path.join(rootOutputDir, `${animal.slug}-qr.svg`);
    const svgContent = await QRCode.toString(targetUrl, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
    });
    fs.writeFileSync(svgPathPublic, svgContent);
    fs.writeFileSync(svgPathRoot, svgContent);

    console.log(`✅ [${animal.nameEn}] -> URL: ${targetUrl}`);
    console.log(`   PNG: public/qr-output/${animal.slug}-qr.png`);
    console.log(`   SVG: public/qr-output/${animal.slug}-qr.svg`);
  }

  console.log("\n🎉 Đã tạo thành công toàn bộ mã QR cho 6 con vật Poly Cards!");
}

generateQrCodes().catch((err) => {
  console.error("Lỗi khi tạo mã QR:", err);
  process.exit(1);
});
