import {
  calculatePricing,
  calculateOriginalFromSaleAndPercent,
  calculatePackOriginalPrice,
  roundPrice,
  sanitizeDiscountPercent,
  normalizePhoneNumber,
} from "../src/lib/pricing";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log("=== BẮT ĐẦU KIỂM THỬ PRICING ENGINE ===");

// 1. Nhập Giá gốc 300.000đ + % KM 17% -> Giá bán = 249.000đ
{
  const res = calculatePricing({
    originalPrice: 300000,
    discountPercent: 17,
    sourceField: "discountPercent",
  });
  assert(res.salePrice === 249000, "300.000đ giảm 17% phải bằng 249.000đ");
  assert(res.discountAmount === 51000, "Tiền giảm phải là 51.000đ");
  assert(res.isValid === true, "Phải hợp lệ");
}

// 2. Nhập Giá gốc 300.000đ + Giá bán 249.000đ -> % KM = 17%
{
  const res = calculatePricing({
    originalPrice: 300000,
    salePrice: 249000,
    sourceField: "salePrice",
  });
  assert(res.discountPercent === 17, "300.000đ bán 249.000đ phải ra %KM = 17%");
  assert(res.isValid === true, "Phải hợp lệ");
}

// 3. Nhập % KM 17% + Giá bán 249.000đ -> Giá gốc ~ 300.000đ
{
  const res = calculateOriginalFromSaleAndPercent(249000, 17);
  assert(res.originalPrice === 300000, "249.000đ với 17% KM phải ra giá gốc 300.000đ");
}

// 4. Case 0% Khuyến mãi
{
  const res = calculatePricing({
    originalPrice: 249000,
    discountPercent: 0,
    sourceField: "discountPercent",
  });
  assert(res.salePrice === 249000, "0% KM thì giá bán = giá gốc 249.000đ");
  assert(res.discountAmount === 0, "0% KM thì tiền giảm = 0");
}

// 5. Case 99% Khuyến mãi (giới hạn tối đa)
{
  const res = calculatePricing({
    originalPrice: 100000,
    discountPercent: 99,
    sourceField: "discountPercent",
  });
  assert(res.salePrice === 1000, "100.000đ giảm 99% ra 1.000đ");
  assert(res.discountPercent === 99, "% KM là 99%");
}

// 6. Case nhập % KM vượt quá 99 hoặc âm -> tự ép về [0..99]
{
  assert(sanitizeDiscountPercent(120) === 99, "Giảm 120% bị ép về 99%");
  assert(sanitizeDiscountPercent(-10) === 0, "Giảm âm bị ép về 0%");
}

// 7. Case Giá bán > Giá gốc (VD trong ảnh lỗi: Giá bán 219k > Giá gốc 10k)
{
  const res = calculatePricing({
    originalPrice: 10000,
    salePrice: 219000,
    sourceField: "salePrice",
  });
  assert(res.isValid === false, "Giá bán 219k > Giá gốc 10k phải báo lỗi isValid = false");
  assert(Boolean(res.errorMessage), "Phải có thông báo lỗi chi tiết");
}

// 8. Case tính giá gốc bộ từ thẻ lẻ
{
  const packPrice = calculatePackOriginalPrice(10000, 30);
  assert(packPrice === 300000, "30 thẻ x 10.000đ = 300.000đ");
}

// 9. Case làm tròn đến 1.000đ
{
  const rounded1k = roundPrice(248765, 1000);
  assert(rounded1k === 249000, "248.765đ làm tròn theo bước 1.000đ ra 249.000đ");
}

// 10. Case chuẩn hóa số điện thoại
{
  assert(normalizePhoneNumber("+84 912 345 678") === "0912345678", "Chuẩn hóa +84 có khoảng trắng");
  assert(normalizePhoneNumber("84912345678") === "0912345678", "Chuẩn hóa 84 liền");
  assert(normalizePhoneNumber("0912.345.678") === "0912345678", "Chuẩn hóa có dấu chấm");
  assert(normalizePhoneNumber("  0912-345-678  ") === "0912345678", "Chuẩn hóa có dấu gạch ngang");
}

console.log("=== TẤT CẢ CÁC TEST PRICING ĐÃ ĐẠT 100% ===");

