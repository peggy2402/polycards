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

/**
 * Phân tích và kiểm định nội dung quét được từ QR code:
 * 1. Chấp nhận URL thuộc domain website (ví dụ https://domain/ar/deer?ar=1&code=...)
 * 2. Chấp nhận mã định danh theo chuẩn (ví dụ: AR-DEER-001)
 * 3. Giữ nguyên mã hóa đơn (?code=...) nếu được đính kèm trong QR
 * 4. Từ chối mọi URL lạ hoặc dữ liệu không thuộc hệ thống
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
  let detectedSlug: string | null = null;
  let detectedCode: string | undefined = undefined;

  // 1. Kiểm tra trường hợp định danh mã sản phẩm (ví dụ: AR-DEER-001)
  if (/^AR-[A-Z0-9-]+-[0-9]{3}$/i.test(content)) {
    const animal =
      getAnimalByQrCode(content) ||
      getMergedProducts().find((p) => p.qrCode.toUpperCase() === content.toUpperCase());
    if (animal) {
      detectedSlug = animal.slug;
    }
  }

  // 2. Kiểm tra trường hợp URL nội bộ (/ar/<slug>) hoặc Full URL
  if (!detectedSlug) {
    try {
      let pathname = "";
      if (content.startsWith("/")) {
        const fakeUrl = new URL(content, "https://polycards-one.vercel.app");
        pathname = fakeUrl.pathname;
        detectedCode =
          fakeUrl.searchParams.get("code") || fakeUrl.searchParams.get("key") || undefined;
      } else if (content.startsWith("http://") || content.startsWith("https://")) {
        const parsedUrl = new URL(content);
        const configuredHost = new URL(siteConfig.url).host.toLowerCase();
        const currentHost =
          typeof window !== "undefined"
            ? window.location.host.toLowerCase()
            : configuredHost;

        const isAllowedDomain =
          parsedUrl.host.toLowerCase() === configuredHost ||
          parsedUrl.host.toLowerCase() === currentHost ||
          parsedUrl.hostname === "polycards-one.vercel.app" ||
          (parsedUrl.hostname.endsWith(".vercel.app") &&
            parsedUrl.hostname.includes("polycards")) ||
          parsedUrl.hostname === "localhost" ||
          parsedUrl.hostname === "127.0.0.1" ||
          parsedUrl.hostname.endsWith(".ngrok-free.app") ||
          parsedUrl.hostname.endsWith(".trycloudflare.com");

        if (isAllowedDomain) {
          pathname = parsedUrl.pathname;
          detectedCode =
            parsedUrl.searchParams.get("code") ||
            parsedUrl.searchParams.get("key") ||
            undefined;
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
          detectedSlug = segments[1].toLowerCase();
        }
      }
    } catch {
      // URL parsing failed
    }
  }

  if (!detectedSlug) {
    return {
      valid: false,
      errorMessage: "Mã QR không hợp lệ hoặc không thuộc hệ thống đồ chơi Poly Cards.",
    };
  }

  const animal =
    getAnimalBySlug(detectedSlug) ||
    getMergedProducts().find((p) => p.slug.toLowerCase() === detectedSlug.toLowerCase());

  const resolvedNameEn = animal?.nameEn || detectedSlug.toUpperCase();
  const resolvedNameVi = animal?.nameVi || detectedSlug;

  // 3. Nếu ở chế độ quét theo sản phẩm cụ thể (?expect=slug)
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
