/**
 * Poly Cards - Tiện ích chuẩn hóa và làm sạch phiên âm (Pinyin Tiếng Trung, IPA Tiếng Anh)
 * Giải quyết triệt để lỗi lặp dấu gạch chéo // trong toàn bộ hệ sinh thái.
 */

/**
 * Loại bỏ toàn bộ dấu gạch chéo dư thừa ở đầu và cuối chuỗi phiên âm
 * Ví dụ: "//huǒ chē//" -> "huǒ chē", "/gōng gòng qì chē/" -> "gōng gòng qì chē"
 */
export function cleanPhonetic(raw?: string): string {
  if (!raw || typeof raw !== "string") return "";
  return raw.replace(/^\/+|\/+$/g, "").trim();
}

/**
 * Định dạng phiên âm chuẩn với đúng 1 dấu gạch chéo hai bên: /pinyin/ hoặc /ipa/
 * Ví dụ: "huǒ chē" -> "/huǒ chē/", "//huǒ chē//" -> "/huǒ chē/"
 */
export function formatPhonetic(raw?: string): string {
  const cleaned = cleanPhonetic(raw);
  return cleaned ? `/${cleaned}/` : "";
}

/**
 * Định dạng phiên âm đặt trong ngoặc đơn: (pinyin)
 * Ví dụ: "//huǒ chē//" -> "(huǒ chē)", "qì chē" -> "(qì chē)"
 */
export function formatParenthesizedPhonetic(raw?: string): string {
  const cleaned = cleanPhonetic(raw);
  return cleaned ? `(${cleaned})` : "";
}

