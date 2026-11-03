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

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === "polycards.vn" ||
    host === "www.polycards.vn" ||
    host === "localhost" ||
    host === "127.0.0.1"
  ) {
    return true;
  }
  if (host.endsWith(".vercel.app") && host.includes("polycards")) {
    return true;
  }
  if (host.endsWith(".ngrok-free.app") || host.endsWith(".trycloudflare.com")) {
    return true;
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
 * 5. Từ chối mọi URL lạ hoặc dữ liệu độc hại (javascript:, domain lừa đảo)
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

  // Chặn các giao thức nguy hiểm
  const lower = content.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return {
      valid: false,
      errorMessage: "Mã QR chứa lệnh không an toàn.",
    };
  }

  let detectedSlug: string | null = null;
  let detectedCode: string | undefined = undefined;

  // 1. Kiểm tra trường hợp định danh mã sản phẩm (ví dụ: AR-BUTTERFLY-001 hoặc AR-DEER-001)
  if (/^AR-[A-Z0-9-]+-[0-9]{3}$/i.test(content)) {
    const animal =
      getAnimalByQrCode(content) ||
      getMergedProducts().find((p) => p.qrCode.toUpperCase() === content.toUpperCase());
    if (animal) {
      detectedSlug = animal.slug.toLowerCase();
    } else {
      // Trích xuất slug từ định dạng AR-<SLUG>-001
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
      } else if (content.startsWith("http://") || content.startsWith("https://")) {
        const parsedUrl = new URL(content);

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

      if (pathname.startsWith("/ar/")) {
        const segments = pathname.split("/").filter(Boolean);
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

  // 3. Dự phòng thông minh: Nếu nội dung quét là slug thuần túy (ví dụ: 'polycards', 'butterfly')
  if (!detectedSlug) {
    const rawClean = content.toLowerCase().trim().replace(/^\/+|\/+$/g, "");
    if (SLUG_REGEX.test(rawClean)) {
      const directMatch =
        getAnimalBySlug(rawClean) ||
        getMergedProducts().find((p) => p.slug.toLowerCase() === rawClean);
      if (directMatch) {
        detectedSlug = directMatch.slug.toLowerCase();
      } else if (rawClean === "polycards") {
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

  // Tìm tên hiển thị
  const animal =
    getAnimalBySlug(detectedSlug) ||
    getMergedProducts().find((p) => p.slug.toLowerCase() === detectedSlug!.toLowerCase());

  const resolvedNameEn = animal?.nameEn || detectedSlug.toUpperCase();
  const resolvedNameVi = animal?.nameVi || detectedSlug;

  // 4. Nếu ở chế độ quét theo sản phẩm cụ thể (?expect=slug)
  if (expectSlug && expectSlug.trim().toLowerCase() !== detectedSlug.toLowerCase()) {
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

  return {
    valid: true,
    slug: detectedSlug,
    code: detectedCode,
    animalNameEn: resolvedNameEn,
    animalNameVi: resolvedNameVi,
  };
}
