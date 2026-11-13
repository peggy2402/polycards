import sharp from "sharp";
import fs from "fs";
import path from "path";

async function generateStaticOg() {
  const width = 1200;
  const height = 630;

  // SVG artwork with Poly Cards branding
  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1c1611"/>
        <stop offset="50%" stop-color="#140f0c"/>
        <stop offset="100%" stop-color="#0a0807"/>
      </linearGradient>
      
      <radialGradient id="glow" cx="50%" cy="10%" r="60%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
      </radialGradient>

      <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#fef3c7"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>

      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#d97706"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect width="${width}" height="${height}" fill="url(#glow)"/>

    <!-- Subtle Grid Lines -->
    <line x1="80" y1="120" x2="1120" y2="120" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <line x1="80" y1="510" x2="1120" y2="510" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

    <!-- Top Brand Bar -->
    <rect x="80" y="50" width="52" height="52" rx="16" fill="url(#brandGrad)"/>
    <text x="106" y="87" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="28" fill="#181411" text-anchor="middle">P</text>
    
    <text x="146" y="76" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="26" fill="#ffffff">POLY CARDS</text>
    <text x="146" y="96" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="12" fill="#fbbf24" letter-spacing="1">WEBAR 3D INTERACTIVE</text>

    <!-- Domain Pill -->
    <rect x="960" y="55" width="160" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)"/>
    <text x="1040" y="82" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="15" fill="#fde68a" text-anchor="middle">polycards.vn</text>

    <!-- Hero Badge -->
    <rect x="80" y="160" width="310" height="36" rx="18" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)"/>
    <text x="235" y="184" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="13" fill="#f59e0b" text-anchor="middle" letter-spacing="0.5">KHO 300 THẺ HỌC THỰC TẾ ẢO 3D</text>

    <!-- Main Title -->
    <text x="80" y="270" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="56" fill="url(#goldText)" letter-spacing="-1">
      Chạm Vào Thế Giới Thật
    </text>
    <text x="80" y="340" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="56" fill="url(#goldText)" letter-spacing="-1">
      Học Song Ngữ Chuẩn Bản Xứ
    </text>

    <!-- Description -->
    <text x="80" y="405" font-family="-apple-system, system-ui, sans-serif" font-weight="500" font-size="20" fill="#d6d3d1">
      Quét mã QR mở ngay mô hình 3D sống động trên iPhone &amp; Android.
    </text>
    <text x="80" y="440" font-family="-apple-system, system-ui, sans-serif" font-weight="500" font-size="20" fill="#a8a29e">
      Không cần cài app • Phát âm Anh - Việt - Trung • Tương tác xoay 360° &amp; học từ vựng.
    </text>

    <!-- Bottom Feature Tags -->
    <rect x="80" y="540" width="160" height="42" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
    <text x="160" y="567" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="14" fill="#fef3c7" text-anchor="middle">300 Thẻ AR 3D</text>

    <rect x="254" y="540" width="180" height="42" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
    <text x="344" y="567" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="14" fill="#fef3c7" text-anchor="middle">Không Cần Cài App</text>

    <rect x="448" y="540" width="160" height="42" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
    <text x="528" y="567" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="14" fill="#fef3c7" text-anchor="middle">Phát Âm Bản Xứ</text>

    <rect x="622" y="540" width="170" height="42" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
    <text x="707" y="567" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="14" fill="#fef3c7" text-anchor="middle">Bảo Hành Trọn Đời</text>

    <!-- Ratings -->
    <text x="1120" y="567" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="16" fill="#fbbf24" text-anchor="end">
      4.9/5 (1.250+ Phụ Huynh Tin Dùng)
    </text>
  </svg>
  `;

  const buffer = Buffer.from(svg);
  const outPath = path.join(process.cwd(), "public", "og-image.png");
  const twitterPath = path.join(process.cwd(), "public", "twitter-image.png");

  await sharp(buffer).png({ quality: 95 }).toFile(outPath);
  console.log("Saved:", outPath);

  await sharp(buffer).png({ quality: 95 }).toFile(twitterPath);
  console.log("Saved:", twitterPath);
}

generateStaticOg().catch(console.error);

