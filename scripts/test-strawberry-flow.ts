import { parseAndValidateQr } from "../src/lib/qr-parser";
import { dbGetProductBySlug } from "../src/lib/mongodb";
import {
  normalizePackCode,
  isPackCodeMatched,
} from "../src/lib/activation";

console.log("=== KIỂM THỬ TOÀN DIỆN QUY TRÌNH THẺ STRAWBERRY & MÃ BỘ ===");

// 1. Kiểm tra parse QR thực tế của người dùng
const qrUrl = "https://polycards.vn/ar/strawberry?ar=1&code=POLY30-HOAQUA";
console.log("\n1. Quét QR URL:", qrUrl);
const parseRes = parseAndValidateQr(qrUrl);
console.log("-> Kết quả Parse:", parseRes);

if (!parseRes.valid || parseRes.slug !== "strawberry" || parseRes.code !== "POLY30-HOAQUA") {
  console.error("❌ Lỗi parse QR!");
  process.exit(1);
}
console.log("✅ Parse QR thành công!");

// 2. Kiểm tra truy vấn sản phẩm
async function testProduct() {
  console.log("\n2. Truy vấn thông tin thẻ 'strawberry' từ Database:");
  const product = await dbGetProductBySlug("strawberry");
  if (!product) {
    console.error("❌ Không tìm thấy thẻ 'strawberry' trong MongoDB!");
    process.exit(1);
  }

  console.log({
    slug: product.slug,
    nameEn: product.nameEn,
    nameVi: product.nameVi,
    category: product.category,
    categorySlug: product.categorySlug,
    packCode: product.packCode,
    modelUrl: product.modelUrl,
    iosModelUrl: product.iosModelUrl,
    arEnabled: product.arEnabled,
  });

  // 3. Kiểm tra so khớp mã bộ
  console.log("\n3. Kiểm tra so khớp mã bộ POLY30-HOAQUA vs POLY30-HOAQUA-ENVI:");
  const baseCodeIn = normalizePackCode("POLY30-HOAQUA");
  const baseCodeProduct = normalizePackCode(product.packCode);
  const isMatch = isPackCodeMatched("POLY30-HOAQUA", product.packCode);

  console.log(`- Mã quét: POLY30-HOAQUA -> Base: ${baseCodeIn}`);
  console.log(`- Mã thẻ: ${product.packCode} -> Base: ${baseCodeProduct}`);
  console.log(`- Kết quả so khớp: ${isMatch ? "TRÙNG KHỚP 100%" : "KHÔNG KHỚP"}`);

  if (!isMatch) {
    console.error("❌ Không khớp mã bộ!");
    process.exit(1);
  }
  console.log("✅ So khớp mã bộ thành công!");

  console.log("\n🎉 TOÀN BỘ QUY TRÌNH KIỂM THỬ ĐẠT CHUẨN!");
}

testProduct().catch(console.error);
