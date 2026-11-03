import { getAnimalByQrCode, getAnimalBySlug } from "./animals";
import { getMergedProducts } from "./products-store";
import { siteConfig } from "@/config/site";

export interface QrParseResult {
  valid: boolean;
  slug?: string;
  code?: string;
  animalNameEn?: string;
  animalNameVi?: string;
  errorMessage?: string;
  isMismatched?: boolean;
}

// Regex kiểm tra an toàn cho slug và code
const SLUG_REGEX = /^[a-z0-9-]{1,64}$/;
const CODE_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Chuẩn hóa alias hệ thống: 'butterfly' và 'polycards' là hai tên gọi tương đương
 */
export function normalizeSystemSlug(raw: string): string {
  const clean = raw.toLowerCase().trim();
  if (clean === "butterfly" || clean === "polycards") {
    return "polycards";
  }
  return clean;
}

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const isDev = process.env.NODE_ENV !== "production";

  if (host === "polycards.vn" || host === "www.polycards.vn") {
    return true;
  }

  // Cho phép domain preview chính thức của dự án trên Vercel
  if (
    host === "polycards-preview.vercel.app" ||
    host === "polycards.vercel.app" ||
    (host.endsWith(".vercel.app") && host.startsWith("polycards-"))
  ) {
    return true;
  }

  // Chỉ cho phép localhost và tunnel URL ở môi trường phát triển (Dev)
  if (isDev) {
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".ngrok-free.app") ||
      host.endsWith(".trycloudflare.com")
    ) {
      return true;
    }
  }

  try {
    const configuredHost = new URL(siteConfig.url).hostname.toLowerCase();
    if (host === configuredHost) return true;
  } catch {}

  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname.toLowerCase();
    if (host === currentHost) return true;
  }

  return false;
}

/**
 * Phân tích và kiểm định nội dung quét được từ QR code:
 * 1. Chấp nhận URL thuộc domain website (ví dụ https://domain/ar/butterfly?ar=1&code=...)
 * 2. Chấp nhận mã định danh theo chuẩn (ví dụ: AR-BUTTERFLY-001)
 * 3. Chấp nhận đường dẫn tương đối (/ar/butterfly)
 * 4. Chấp nhận slug trực tiếp nếu trùng khớp hệ thống
 * 5. Từ chối mọi URL lạ, protocol-relative (//evil.com), path traversal (..), hoặc dữ liệu độc hại
 */
export function parseAndValidateQr(
  rawContent: string,
  expectSlug?: string | null
): QrParseResult {
  if (!rawContent || typeof rawContent !== "string") {
    return {
      valid: false,
      errorMessage: "Không phát hiện được nội dung mã QR hợp lệ.",
    };
  }

  const content = rawContent.trim();
  if (content.length > 500) {
    return {
      valid: false,
      errorMessage: "Nội dung mã QR vượt quá độ dài cho phép.",
    };
  }

  // Chặn protocol-relative URL (//evil.com/ar/...)
  if (content.startsWith("//")) {
    return {
      valid: false,
      errorMessage: "Định dạng liên kết không an toàn.",
    };
  }

  // Chặn path traversal (.., %2e, %2f)
  const lower = content.toLowerCase();
  if (
    lower.includes("/..") ||
    lower.includes("../") ||
    lower.includes("%2e%2e") ||
    lower.includes("%2f")
  ) {
    return {
      valid: false,
      errorMessage: "Mã QR chứa ký tự điều hướng không hợp lệ.",
    };
  }

  // Chặn các giao thức nguy hiểm
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:") ||
    lower.startsWith("ftp:") ||
    lower.startsWith("intent:")
  ) {
    return {
      valid: false,
      errorMessage: "Mã QR chứa lệnh không an toàn.",
    };
  }

  let detectedSlug: string | null = null;
  let detectedCode: string | undefined = undefined;

  // 1. Kiểm tra trường hợp định danh mã sản phẩm (ví dụ: AR-BUTTERFLY-001)
  if (/^AR-[A-Z0-9-]+-[0-9]{3}$/i.test(content)) {
    const animal =
      getAnimalByQrCode(content) ||
      getMergedProducts().find((p) => p.qrCode.toUpperCase() === content.toUpperCase());
    if (animal) {
      detectedSlug = animal.slug.toLowerCase();
    } else {
      const parts = content.split("-");
      if (parts.length >= 3) {
        const potentialSlug = parts.slice(1, -1).join("-").toLowerCase();
        if (SLUG_REGEX.test(potentialSlug)) {
          detectedSlug = potentialSlug;
        }
      }
    }
  }

  // 2. Kiểm tra trường hợp URL nội bộ (/ar/<slug>) hoặc Full URL
  if (!detectedSlug) {
    try {
      let pathname = "";
      if (content.startsWith("/")) {
        const fakeUrl = new URL(content, "https://polycards.vn");
        pathname = fakeUrl.pathname;
        const codeParam = fakeUrl.searchParams.get("code") || fakeUrl.searchParams.get("key");
        if (codeParam && CODE_REGEX.test(codeParam)) {
          detectedCode = codeParam;
        }
      } else if (lower.startsWith("http://") || lower.startsWith("https://")) {
        const parsedUrl = new URL(content);

        // Chặn userinfo trong URL (ví dụ https://polycards.vn@evil.com/ar/...)
        if (parsedUrl.username || parsedUrl.password) {
          return {
            valid: false,
            errorMessage: "Địa chỉ liên kết chứa thông tin xác thực giả mạo.",
          };
        }

        if (isAllowedHost(parsedUrl.hostname)) {
          pathname = parsedUrl.pathname;
          const codeParam =
            parsedUrl.searchParams.get("code") || parsedUrl.searchParams.get("key");
          if (codeParam && CODE_REGEX.test(codeParam)) {
            detectedCode = codeParam;
          }
        } else {
          return {
            valid: false,
            errorMessage:
              "Mã QR này chứa liên kết bên ngoài không thuộc hệ thống Poly Cards an toàn.",
          };
        }
      }

      const lowerPath = pathname.toLowerCase();
      if (lowerPath.startsWith("/ar/")) {
        const segments = lowerPath.split("/").filter(Boolean);
        if (segments.length >= 2 && segments[0] === "ar") {
          const rawSlug = segments[1].toLowerCase();
          if (SLUG_REGEX.test(rawSlug)) {
            detectedSlug = rawSlug;
          }
        }
      }
    } catch {
      // URL parsing failed
    }
  }

  // 3. Dự phòng: Nếu nội dung quét là slug thuần túy
  if (!detectedSlug) {
    const rawClean = content.toLowerCase().trim().replace(/^\/+|\/+$/g, "");
    if (SLUG_REGEX.test(rawClean)) {
      const directMatch =
        getAnimalBySlug(rawClean) ||
        getMergedProducts().find((p) => p.slug.toLowerCase() === rawClean);
      if (directMatch) {
        detectedSlug = directMatch.slug.toLowerCase();
      } else if (rawClean === "polycards" || rawClean === "butterfly") {
        detectedSlug = "polycards";
      }
    }
  }

  if (!detectedSlug) {
    return {
      valid: false,
      errorMessage: "Mã QR không hợp lệ hoặc không thuộc hệ sinh thái Poly Cards.",
    };
  }

  // Tìm tên hiển thị ban đầu từ kho tĩnh
  const animal =
    getAnimalBySlug(detectedSlug) ||
    getMergedProducts().find((p) => p.slug.toLowerCase() === detectedSlug!.toLowerCase());

  const resolvedNameEn = animal?.nameEn || detectedSlug.toUpperCase();
  const resolvedNameVi = animal?.nameVi || detectedSlug;

  // 4. Kiểm tra mismatch với expectSlug (chuẩn hóa cả 2 qua normalizeSystemSlug)
  if (expectSlug) {
    const normExpect = normalizeSystemSlug(expectSlug);
    const normDetected = normalizeSystemSlug(detectedSlug);

    if (normExpect !== normDetected) {
      const expectedAnimal = getAnimalBySlug(expectSlug);
      const expectedName = expectedAnimal
        ? `${expectedAnimal.nameEn} (${expectedAnimal.nameVi})`
        : expectSlug;
      return {
        valid: false,
        isMismatched: true,
        slug: detectedSlug,
        code: detectedCode,
        animalNameEn: resolvedNameEn,
        animalNameVi: resolvedNameVi,
        errorMessage: `QR này thuộc về ${resolvedNameEn} (${resolvedNameVi}). Bạn đang trải nghiệm ${expectedName}, vui lòng quét đúng QR của sản phẩm này.`,
      };
    }
  }

  return {
    valid: true,
    slug: detectedSlug,
    code: detectedCode,
    animalNameEn: resolvedNameEn,
    animalNameVi: resolvedNameVi,
  };
}
