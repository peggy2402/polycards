import { isInAppBrowser } from "../src/lib/user-agent";

console.log("=== KIỂM THỬ USER AGENT DETECTION ===");

const uaTestCases = [
  {
    name: "Zalo Android",
    ua: "Mozilla/5.0 (Linux; Android 13; SM-G998B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.5845.163 Mobile Safari/537.36 ZaloTheme/light ZaloMobile Android",
    expectInApp: true,
    expectName: "Zalo",
  },
  {
    name: "Facebook iOS",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20F66 [FBAN/FBIOS;FBDV/iPhone14,2;FBMD/iPhone;FBSN/iOS;FBSV/16.5;FBSS/3;FBID/phone;FBLC/vi_VN;FBOP/5]",
    expectInApp: true,
    expectName: "Facebook",
  },
  {
    name: "TikTok Android",
    ua: "Mozilla/5.0 (Linux; Android 12; Pixel 6 Build/SQ3A.220705.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/103.0.5060.71 Mobile Safari/537.36 BytedanceWebview app_version/25.1.3 musical_ly",
    expectInApp: true,
    expectName: "TikTok",
  },
  {
    name: "Samsung Internet (Trình duyệt thật -> KHÔNG BÁO NHẦM)",
    ua: "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.154 Mobile Safari/537.36",
    expectInApp: false,
  },
  {
    name: "Xiaomi MIUI Browser (Trình duyệt thật -> KHÔNG BÁO NHẦM)",
    ua: "Mozilla/5.0 (Linux; U; Android 12; zh-cn; Redmi K40 Build/SKQ1.211006.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.127 Mobile Safari/537.36 MiuiBrowser/16.9.11",
    expectInApp: false,
  },
  {
    name: "UC Browser Android (Trình duyệt thật -> KHÔNG BÁO NHẦM)",
    ua: "Mozilla/5.0 (Linux; U; Android 11; en-US; SM-A505F Build/RP1A.200720.012) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.108 UCBrowser/13.4.0.1306 Mobile Safari/537.36",
    expectInApp: false,
  },
  {
    name: "Chrome Android Chuẩn",
    ua: "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
    expectInApp: false,
  },
  {
    name: "Safari iOS Chuẩn",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    expectInApp: false,
  },
  {
    name: "Android WebView Không Rõ Nguồn (có ; wv)",
    ua: "Mozilla/5.0 (Linux; Android 10; SM-A205F Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/81.0.4044.138 Mobile Safari/537.36",
    expectInApp: true,
    expectName: "Trình Duyệt Nhúng (WebView)",
  },
];

let allPassed = true;

// Mock window
(globalThis as any).window = {};

for (const tc of uaTestCases) {
  Object.defineProperty(globalThis.navigator, "userAgent", {
    value: tc.ua,
    configurable: true,
    writable: true,
  });

  const res = isInAppBrowser();

  const matchInApp = res.isInApp === tc.expectInApp;
  const matchName = tc.expectName ? res.appName === tc.expectName : true;

  if (matchInApp && matchName) {
    console.log(`✅ [PASS] ${tc.name}`);
  } else {
    allPassed = false;
    console.error(`❌ [FAIL] ${tc.name}:`, res, `Expected inApp=${tc.expectInApp}`);
  }
}

if (!allPassed) {
  console.error("⚠️ Có test case thất bại!");
  process.exit(1);
} else {
  console.log("\n🎉 Toàn bộ 9/9 test cases User Agent đều VƯỢT QUA thành công!\n");
}
