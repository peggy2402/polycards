/**
 * Phát hiện xem trang web có đang được mở bên trong In-App Browser
 * (Facebook, Zalo, TikTok, Instagram, Messenger, WeChat, Line, Kakao, Twitter/X, Snapchat, Pinterest, LinkedIn, Google App, WebView) hay không.
 * Các trình duyệt nhúng này thường chặn quyền truy cập Camera (getUserMedia) hoặc hạn chế WebXR.
 */
export function isInAppBrowser(): {
  isInApp: boolean;
  appName: string;
} {
  if (typeof window === "undefined" || !navigator || !navigator.userAgent) {
    return { isInApp: false, appName: "" };
  }

  const ua = navigator.userAgent.toLowerCase();

  // 1. Nhận diện các ứng dụng in-app cụ thể
  if (ua.includes("zalo")) {
    return { isInApp: true, appName: "Zalo" };
  }
  if (
    ua.includes("fban") ||
    ua.includes("fbav") ||
    ua.includes("fb_iab") ||
    ua.includes("fb4a") ||
    ua.includes("fbios")
  ) {
    return { isInApp: true, appName: "Facebook" };
  }
  if (ua.includes("musical_ly") || ua.includes("tiktok") || ua.includes("bytedance")) {
    return { isInApp: true, appName: "TikTok" };
  }
  if (ua.includes("instagram")) {
    return { isInApp: true, appName: "Instagram" };
  }
  if (ua.includes("messenger")) {
    return { isInApp: true, appName: "Messenger" };
  }
  if (ua.includes("micromessenger")) {
    return { isInApp: true, appName: "WeChat" };
  }
  if (ua.includes("line/")) {
    return { isInApp: true, appName: "Line" };
  }
  if (ua.includes("kakaotalk")) {
    return { isInApp: true, appName: "KakaoTalk" };
  }
  if (ua.includes("snapchat")) {
    return { isInApp: true, appName: "Snapchat" };
  }
  if (ua.includes("twitter") || ua.includes("tweetie")) {
    return { isInApp: true, appName: "Twitter / X" };
  }
  if (ua.includes("linkedin")) {
    return { isInApp: true, appName: "LinkedIn" };
  }
  if (ua.includes("pinterest")) {
    return { isInApp: true, appName: "Pinterest" };
  }
  if (ua.includes("gsa/")) {
    return { isInApp: true, appName: "Google App" };
  }

  // 2. Danh sách loại trừ các trình duyệt Android thật (chạy camera bình thường, không được coi là WebView bị hạn chế)
  const isKnownFullBrowser =
    ua.includes("samsungbrowser") ||
    ua.includes("miuibrowser") ||
    ua.includes("ucbrowser") ||
    ua.includes("huaweibrowser") ||
    ua.includes("heytapbrowser") ||
    ua.includes("vivobrowser") ||
    ua.includes("edga/") ||
    ua.includes("opr/") ||
    ua.includes("opera") ||
    ua.includes("firefox/") ||
    ua.includes("fxios") ||
    ua.includes("crios");

  if (isKnownFullBrowser) {
    return { isInApp: false, appName: "" };
  }

  // 3. Nhận diện Android WebView độc lập khi có cờ đặc trưng "; wv)"
  if (ua.includes("; wv") || ua.includes("; wv;")) {
    return { isInApp: true, appName: "Trình Duyệt Nhúng (WebView)" };
  }

  return { isInApp: false, appName: "" };
}

/**
 * Kiểm tra xem thiết bị hiện tại có phải là iOS hay Android
 */
export function getMobileOperatingSystem(): "ios" | "android" | "other" {
  if (typeof window === "undefined" || !navigator || !navigator.userAgent) {
    return "other";
  }

  const ua = navigator.userAgent;

  // iOS detection
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }

  // Android detection
  if (/android/i.test(ua)) {
    return "android";
  }

  return "other";
}
