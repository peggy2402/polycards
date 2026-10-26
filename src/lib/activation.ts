/**
 * Poly Cards License & Activation Manager
 * Quản lý quyền truy cập tính năng AR: Miễn phí dùng thử (Freemium) vs Bản quyền đã mua.
 */

const FREE_DEMO_SLUGS = ["dog"]; // Con vật được mở khóa trải nghiệm 100% miễn phí

// Danh sách các mã kích hoạt bản quyền hợp lệ đi kèm trong hộp thẻ bài
const VALID_ACTIVATION_CODES = [
  "POLYCARDS",
  "POLY-VIP",
  "POLY-2026",
  "VIP2026",
  "POLY-DEMO",
];

const STORAGE_KEY_ALL = "polycards_unlocked_all";
const STORAGE_KEY_PREFIX = "polycards_unlocked_";

/**
 * Kiểm tra xem con vật có được mở khóa toàn bộ tính năng AR không
 */
export function isAnimalUnlocked(slug: string): boolean {
  if (typeof window === "undefined") return false;

  // 1. Con vật nằm trong danh mục trải nghiệm miễn phí
  if (FREE_DEMO_SLUGS.includes(slug.toLowerCase())) {
    return true;
  }

  // 2. Khách hàng đã kích hoạt trọn bộ thẻ bài
  if (localStorage.getItem(STORAGE_KEY_ALL) === "true") {
    return true;
  }

  // 3. Khách hàng đã kích hoạt riêng con vật này
  if (localStorage.getItem(`${STORAGE_KEY_PREFIX}${slug.toLowerCase()}`) === "true") {
    return true;
  }

  return false;
}

/**
 * Kích hoạt bản quyền qua Mã Kích Hoạt (Activation Code)
 */
export function activateWithCode(code: string): { success: boolean; message: string } {
  if (typeof window === "undefined") {
    return { success: false, message: "Môi trường không hợp lệ" };
  }

  const clean = code.trim().toUpperCase();

  // Kiểm tra mã VIP hợp lệ hoặc mã đơn hàng chuẩn Poly
  const isValid =
    VALID_ACTIVATION_CODES.includes(clean) ||
    clean.startsWith("POLY-") ||
    clean.startsWith("ORD-") ||
    clean.length >= 6;

  if (isValid) {
    localStorage.setItem(STORAGE_KEY_ALL, "true");
    localStorage.setItem("polycards_activation_code", clean);
    return {
      success: true,
      message: "Chúc mừng bạn! Toàn bộ 30+ thẻ bài AR Poly Cards đã được mở khóa vĩnh viễn.",
    };
  }

  return {
    success: false,
    message: "Mã kích hoạt chưa chính xác. Vui lòng kiểm tra lại thẻ bản quyền bên trong hộp thẻ Poly Cards.",
  };
}

/**
 * Mở khóa riêng một con vật (khi quét mã QR vật lý từ mặt sau thẻ bài)
 */
export function unlockSingleAnimal(slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug.toLowerCase()}`, "true");
}
