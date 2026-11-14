import type { NextRequest } from "next/server";
import crypto from "crypto";

export function cleanPasscode(val: string | undefined): string {
  if (!val) return "";
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

export function getAdminSecretKey(): string {
  return cleanPasscode(process.env.POLY_KEY_TOOLS) || "polycard2025";
}

/**
 * Tạo token ký điện tử HMAC SHA-256 có thời hạn 7 ngày
 * Định dạng: <timestamp>.<hmac-signature>
 */
export function generateAdminToken(secretKey: string): string {
  const ts = Date.now().toString();
  const signature = crypto.createHmac("sha256", secretKey).update(ts).digest("hex");
  return `${ts}.${signature}`;
}

/**
 * Xác thực token ký điện tử
 */
export function verifyAdminToken(token?: string | null, secretKey?: string): boolean {
  if (!token || typeof token !== "string") return false;
  const key = secretKey || getAdminSecretKey();
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [tsStr, signature] = parts;
  const ts = Number(tsStr);
  if (isNaN(ts)) return false;

  // Thời hạn 7 ngày
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now - ts > MAX_AGE || ts > now + 60000) {
    return false;
  }

  const expectedSignature = crypto.createHmac("sha256", key).update(tsStr).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"));
  } catch {
    return false;
  }
}

/**
 * Kiểm tra quyền quản trị Admin / Author từ NextRequest:
 * 1. Kiểm tra Header: `x-tools-passcode`, `x-admin-key`, `authorization`
 * 2. Kiểm tra Cookie: `polycards_admin_token`
 */
export function verifyAdminAuth(req: NextRequest): boolean {
  const secretKey = getAdminSecretKey();

  // 1. Kiểm tra Header xác thực trực tiếp
  const headerPasscode =
    req.headers.get("x-tools-passcode") ||
    req.headers.get("x-admin-key") ||
    req.headers.get("x-api-key");

  if (headerPasscode && cleanPasscode(headerPasscode) === secretKey) {
    return true;
  }

  // 2. Kiểm tra Authorization header (Bearer token hoặc Bearer passcode)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerVal = authHeader.slice(7).trim();
    if (cleanPasscode(bearerVal) === secretKey || verifyAdminToken(bearerVal, secretKey)) {
      return true;
    }
  }

  // 3. Kiểm tra HttpOnly Cookie `polycards_admin_token`
  const cookieToken = req.cookies.get("polycards_admin_token")?.value;
  if (cookieToken && verifyAdminToken(cookieToken, secretKey)) {
    return true;
  }

  return false;
}
