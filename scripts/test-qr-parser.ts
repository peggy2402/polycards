import { parseAndValidateQr } from "../src/lib/qr-parser";

console.log("=== KIỂM THỬ PARSER & VALIDATOR QR POLY CARDS ===");

const testCases = [
  {
    name: "1. URL chuẩn polycards.vn",
    input: "https://polycards.vn/ar/butterfly?ar=1",
    expectValid: true,
    expectedSlug: "butterfly",
  },
  {
    name: "2. URL với www",
    input: "https://www.polycards.vn/ar/butterfly?ar=1",
    expectValid: true,
    expectedSlug: "butterfly",
  },
  {
    name: "3. URL kèm mã kích hoạt ?code=VIP123",
    input: "https://polycards.vn/ar/polycards?ar=1&code=VIP123",
    expectValid: true,
    expectedSlug: "polycards",
    expectedCode: "VIP123",
  },
  {
    name: "4. URL đường dẫn tương đối /ar/butterfly",
    input: "/ar/butterfly",
    expectValid: true,
    expectedSlug: "butterfly",
  },
  {
    name: "5. Mã định danh AR-BUTTERFLY-001",
    input: "AR-BUTTERFLY-001",
    expectValid: true,
    expectedSlug: "butterfly",
  },
  {
    name: "6. Chặn URL ngoài hệ sinh thái",
    input: "https://evil.com/ar/butterfly",
    expectValid: false,
  },
  {
    name: "7. Chặn hostname giả dạng (phishing)",
    input: "https://polycards.vn.evil.com/ar/butterfly",
    expectValid: false,
  },
  {
    name: "8. Chặn javascript: payload",
    input: "javascript:alert(1)",
    expectValid: false,
  },
  {
    name: "9. Chế độ kiểm tra expectSlug (không khớp)",
    input: "https://polycards.vn/ar/butterfly?ar=1",
    expectSlug: "lion",
    expectValid: false,
    expectMismatch: true,
  },
];

let allPassed = true;

for (const tc of testCases) {
  const result = parseAndValidateQr(tc.input, tc.expectSlug);
  const passValid = result.valid === tc.expectValid;
  const passSlug = tc.expectedSlug ? result.slug === tc.expectedSlug : true;
  const passCode = tc.expectedCode ? result.code === tc.expectedCode : true;
  const passMismatch = tc.expectMismatch ? result.isMismatched === true : true;

  if (passValid && passSlug && passCode && passMismatch) {
    console.log(`✅ [PASS] ${tc.name}`);
  } else {
    allPassed = false;
    console.error(`❌ [FAIL] ${tc.name}:`, result);
  }
}

if (allPassed) {
  console.log("\n🎉 Toàn bộ test cases của QR Parser đều VƯỢT QUA thành công!");
} else {
  console.error("\n⚠️ Có test case thất bại!");
  process.exit(1);
}

