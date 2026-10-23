/**
 * Phát hiện xem trang web có đang được mở bên trong In-App Browser
 * (Facebook, Zalo, TikTok, Instagram, Messenger, WeChat) hay không.
 * Các trình duyệt nhúng này thường chặn quyền truy cập Camera (getUserMedia).
 */
export function isInAppBrowser(): {
  isInApp: boolean;
  appName: string;
} {
  if (typeof window === "undefined" || !navigator || !navigator.userAgent) {
    return { isInApp: false, appName: "" };
  }

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("zalo")) {
    return { isInApp: true, appName: "Zalo" };
  }
  if (ua.includes("fban") || ua.includes("fbav") || ua.includes("fb_iab")) {
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
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }

  // Android detection
  if (/android/i.test(ua)) {
    return "android";
  }

  return "other";
}
