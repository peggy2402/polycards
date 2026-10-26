import { getAnimalByQrCode, getAnimalBySlug } from "./animals";
import { siteConfig } from "@/config/site";

export interface QrParseResult {
  valid: boolean;
  slug?: string;
  animalNameEn?: string;
  animalNameVi?: string;
  errorMessage?: string;
  isMismatched?: boolean;
}

/**
 * Phân tích và kiểm định nội dung quét được từ QR code:
 * 1. Chấp nhận URL thuộc domain website (ví dụ https://domain/ar/deer hoặc /ar/deer)
 * 2. Chấp nhận mã định danh theo chuẩn (ví dụ: AR-DEER-001)
 * 3. Nếu có tham số expectSlug, kiểm tra xem có khớp con vật mong đợi không
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

  // 1. Kiểm tra trường hợp định danh mã sản phẩm (ví dụ: AR-DEER-001)
  if (/^AR-[A-Z0-9]+-[0-9]{3}$/i.test(content)) {
    const animal = getAnimalByQrCode(content);
    if (animal) {
      detectedSlug = animal.slug;
    }
  }

  // 2. Kiểm tra trường hợp URL nội bộ (/ar/<slug>) hoặc Full URL
  if (!detectedSlug) {
    try {
      let pathname = "";
      if (content.startsWith("/")) {
        pathname = content;
      } else if (content.startsWith("http://") || content.startsWith("https://")) {
        const parsedUrl = new URL(content);
        const configuredHost = new URL(siteConfig.url).host.toLowerCase();
        const currentHost =
          typeof window !== "undefined"
            ? window.location.host.toLowerCase()
            : configuredHost;

        // Cho phép URL thuộc configured domain, window.location.host, hoặc localhost/127.0.0.1
        const isAllowedDomain =
          parsedUrl.host.toLowerCase() === configuredHost ||
          parsedUrl.host.toLowerCase() === currentHost ||
          parsedUrl.hostname === "polycards-one.vercel.app" ||
          (parsedUrl.hostname.endsWith(".vercel.app") && parsedUrl.hostname.includes("polycards")) ||
          parsedUrl.hostname === "localhost" ||
          parsedUrl.hostname === "127.0.0.1" ||
          parsedUrl.hostname.endsWith(".ngrok-free.app") ||
          parsedUrl.hostname.endsWith(".trycloudflare.com");

        if (isAllowedDomain) {
          pathname = parsedUrl.pathname;
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
      // URL parsing failed, fall through
    }
  }

  if (!detectedSlug) {
    return {
      valid: false,
      errorMessage: "Mã QR không hợp lệ hoặc không thuộc hệ thống đồ chơi Poly Cards.",
    };
  }

  const animal = getAnimalBySlug(detectedSlug);
  if (!animal) {
    return {
      valid: false,
      errorMessage: `Không tìm thấy thông tin sản phẩm tương ứng với mã "${detectedSlug}".`,
    };
  }

  // 3. Nếu ở chế độ quét theo sản phẩm cụ thể (?expect=slug)
  if (expectSlug && expectSlug.trim().toLowerCase() !== animal.slug.toLowerCase()) {
    const expectedAnimal = getAnimalBySlug(expectSlug);
    const expectedName = expectedAnimal
      ? `${expectedAnimal.nameEn} (${expectedAnimal.nameVi})`
      : expectSlug;
    return {
      valid: false,
      isMismatched: true,
      slug: animal.slug,
      animalNameEn: animal.nameEn,
      animalNameVi: animal.nameVi,
      errorMessage: `QR này thuộc về ${animal.nameEn} (${animal.nameVi}). Bạn đang trải nghiệm ${expectedName}, vui lòng quét đúng QR của sản phẩm này.`,
    };
  }

  return {
    valid: true,
    slug: animal.slug,
    animalNameEn: animal.nameEn,
    animalNameVi: animal.nameVi,
  };
}
