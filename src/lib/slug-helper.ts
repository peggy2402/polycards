import { pinyin } from "pinyin-pro";

/**
 * Kiểm tra xem chuỗi có chứa ký tự chữ Hán (tiếng Trung) hay không
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Chuyển đổi chuỗi bất kỳ (tiếng Trung, tiếng Việt, tiếng Anh, ký tự đặc biệt)
 * thành slug URL chuẩn quốc tế:
 * - Tiếng Trung: Tự động chuyển thành Pinyin không dấu, viết liền dấu gạch ngang (ví dụ: 螺蛳粉 -> luo-si-fen)
 * - Tiếng Việt: Bỏ dấu thanh tiếng Việt (ví dụ: Sư tử -> su-tu, Đi bộ -> di-bo)
 * - Ký tự đặc biệt: Loại bỏ, chỉ giữ chữ thường, số và dấu gạch ngang [a-z0-9-]
 */
export function normalizeSlugWithPinyin(input: string): string {
  if (!input) return "";

  let result = input.trim();

  // 1. Nếu có chữ Hán / tiếng Trung, convert sang pinyin không dấu
  if (containsChinese(result)) {
    try {
      const pinyinArray = pinyin(result, {
        toneType: "none",
        type: "array",
      });
      result = pinyinArray.join("-");
    } catch {
      // Fallback nếu lỗi
    }
  }

  // 2. Chuẩn hóa tiếng Việt có dấu
  result = result
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d");

  // 3. Chuyển thành chữ thường, thay khoảng trắng và ký tự không hợp lệ thành dấu gạch ngang
  result = result
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return result;
}

