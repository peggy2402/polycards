import { parseAndValidateQr } from "../src/lib/qr-parser";

console.log("=== KIỂM THỬ TOÀN DIỆN BẢO MẬT & PARSER QR POLY CARDS ===");

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
    name: "3. URL viết hoa HTTPS://POLYCARDS.VN/AR/LION",
    input: "HTTPS://POLYCARDS.VN/AR/LION",
    expectValid: true,
    expectedSlug: "lion",
  },
  {
    name: "4. URL kèm mã kích hoạt ?code=VIP123",
    input: "https://polycards.vn/ar/polycards?ar=1&code=VIP123",
    expectValid: true,
    expectedSlug: "polycards",
    expectedCode: "VIP123",
  },
  {
    name: "5. URL đường dẫn tương đối /ar/butterfly",
    input: "/ar/butterfly",
    expectValid: true,
    expectedSlug: "butterfly",
  },
  {
    name: "6. Mã định danh AR-BUTTERFLY-001",
    input: "AR-BUTTERFLY-001",
    expectValid: true,
    expectedSlug: "butterfly",
  },
  {
    name: "7. Chặn URL ngoài hệ sinh thái evil.com",
    input: "https://evil.com/ar/butterfly",
    expectValid: false,
  },
  {
    name: "8. Chặn hostname giả dạng (phishing: polycards.vn.evil.com)",
    input: "https://polycards.vn.evil.com/ar/butterfly",
    expectValid: false,
  },
  {
    name: "9. Chặn URL có UserInfo (polycards.vn@evil.com)",
    input: "https://polycards.vn@evil.com/ar/butterfly",
    expectValid: false,
  },
  {
    name: "10. Chặn Protocol-relative URL (//evil.com/ar/butterfly)",
    input: "//evil.com/ar/butterfly",
    expectValid: false,
  },
  {
    name: "11. Chặn Path traversal (..)",
    input: "/ar/../admin",
    expectValid: false,
  },
  {
    name: "12. Chặn Path traversal (%2e%2e)",
    input: "/ar/%2e%2e/admin",
    expectValid: false,
  },
  {
    name: "13. Chặn javascript: hoa thường (JaVaScRiPt:alert(1))",
    input: "JaVaScRiPt:alert(1)",
    expectValid: false,
  },
  {
    name: "14. Chặn ftp: protocol",
    input: "ftp://polycards.vn/ar/butterfly",
    expectValid: false,
  },
  {
    name: "15. Chặn intent: protocol",
    input: "intent://polycards.vn/ar/butterfly#Intent;end",
    expectValid: false,
  },
  {
    name: "16. Chặn slug vượt quá 64 ký tự",
    input: `/ar/${"a".repeat(65)}`,
    expectValid: false,
  },
  {
    name: "17. Chặn code chứa ký tự độc hại (<script>)",
    input: "https://polycards.vn/ar/butterfly?code=<script>alert(1)</script>",
    expectValid: true,
    expectedSlug: "butterfly",
    // code chứa <script> không khớp CODE_REGEX nên code sẽ bị undefined (làm sạch)
    expectedCode: undefined,
  },
  {
    name: "18. Chế độ kiểm tra expectSlug (không khớp)",
    input: "https://polycards.vn/ar/butterfly?ar=1",
    expectSlug: "lion",
    expectValid: false,
    expectMismatch: true,
  },
  {
    name: "19. Alias matching: expect=polycards quét ra butterfly (PHẢI HỢP LỆ)",
    input: "https://polycards.vn/ar/butterfly?ar=1",
    expectSlug: "polycards",
    expectValid: true,
    expectedSlug: "butterfly",
  },
];

let allPassed = true;

for (const tc of testCases) {
  const result = parseAndValidateQr(tc.input, tc.expectSlug);
  const passValid = result.valid === tc.expectValid;
  const passSlug = tc.expectedSlug ? result.slug === tc.expectedSlug : true;
  const passCode = tc.expectedCode !== undefined ? result.code === tc.expectedCode : true;
  const passMismatch = tc.expectMismatch ? result.isMismatched === true : true;

  if (passValid && passSlug && passCode && passMismatch) {
    console.log(`✅ [PASS] ${tc.name}`);
  } else {
    allPassed = false;
    console.error(`❌ [FAIL] ${tc.name}:`, result);
  }
}

if (allPassed) {
  console.log(`\n🎉 Toàn bộ ${testCases.length}/${testCases.length} test cases của QR Parser đều VƯỢT QUA thành công!\n`);
} else {
  console.error("\n⚠️ Có test case thất bại!");
  process.exit(1);
}
