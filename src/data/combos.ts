export interface CardComboPack {
  id: string;
  name: string;
  packCode: string;
  categoryName: string;
  categorySlug: string;
  languageType?: "en-vi" | "zh-vi" | "all";
  cardsCount: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  badge: string;
  subBadge?: string;
  badgeVariant?: "primary" | "secondary" | "success" | "warning";
  imageSrc: string;
  sampleSlug: string;
  targetUrl?: string;
  description: string;
  highlights: string[];
  isFeatured?: boolean;
}

export const DEFAULT_FEATURED_COMBO: CardComboPack = {
  id: "pack-all-vip-300",
  name: "Siêu Combo Trọn Bộ (Toàn Bộ 300 Thẻ AR)",
  packCode: "POLY300-ALLVIP",
  categoryName: "Trọn Bộ VIP",
  categorySlug: "all-vip",
  languageType: "all",
  cardsCount: 300,
  price: 1490000,
  originalPrice: 3000000,
  discountPercent: 50,
  badge: "Tiết Kiệm 1.510K • Bản Giới Hạn",
  subBadge: "Đầy Đủ 10 Chủ Đề Toàn Diện Nhất Poly Cards",
  imageSrc: "/images/cards/butterfly-card.png",
  sampleSlug: "polycards",
  targetUrl: "/order",
  description: "Sở hữu toàn bộ 300 thẻ AR đa ngữ (Động vật, Xe cộ, Hoa quả, Hành động, Nghề nghiệp). Tặng hộp quà cao cấp và tài khoản VIP vĩnh viễn.",
  highlights: ["Trọn bộ 300 Thẻ AR 3D", "Hộp quà sơn mài cao cấp", "Bảo hành bản quyền trọn đời"],
  isFeatured: true,
};

export const COMBO_PACKS: CardComboPack[] = [
  // --- 1. ĐỘNG VẬT HOANG DÃ (ANH - VIỆT) ---
  {
    id: "pack-dongvat-envi-30",
    name: "Bộ 30 Thẻ AR Động Vật Hoang Dã (Anh - Việt)",
    packCode: "POLY30-DONGVAT-ENVI",
    categoryName: "Động Vật",
    categorySlug: "dong-vat",
    languageType: "en-vi",
    cardsCount: 30,
    price: 300000,
    originalPrice: 300000,
    discountPercent: 0,
    badge: "Song Ngữ Anh - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Sư tử, voi, chó, mèo, hươu, gấu trúc... Khám phá thế giới muông thú với âm thanh gầm rú chân thực và phát âm tiếng Anh chuẩn IPA.",
    highlights: ["30 Thẻ AR 3D Động Vật", "Chống nước 100%", "Phát âm chuẩn Anh - Việt"],
    isFeatured: true,
  },

  // --- 2. ĐỘNG VẬT HOANG DÃ (TRUNG - VIỆT) ---
  {
    id: "pack-dongvat-zhvi-30",
    name: "Bộ 30 Thẻ AR Động Vật Hoang Dã (Trung - Việt)",
    packCode: "POLY30-DONGVAT-ZHVI",
    categoryName: "Động Vật",
    categorySlug: "dong-vat",
    languageType: "zh-vi",
    cardsCount: 30,
    price: 300000,
    originalPrice: 300000,
    discountPercent: 0,
    badge: "Song Ngữ Trung - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Học từ vựng tiếng Trung qua 30 loài động vật với Pinyin chuẩn và giọng đọc người bản xứ truyền cảm.",
    highlights: ["30 Thẻ AR Động Vật", "Pinyin chuẩn thanh điệu", "Hình ảnh 3D hoạt hình"],
  },

  // --- 3. HÀNH ĐỘNG & THỂ CHẤT (ANH - VIỆT) ---
  {
    id: "pack-hanhdong-envi-30",
    name: "Bộ 30 Thẻ AR Hành Động & Thể Chất (Anh - Việt)",
    packCode: "POLY30-HANHDONG-ENVI",
    categoryName: "Hành Động",
    categorySlug: "hanh-dong",
    languageType: "en-vi",
    cardsCount: 30,
    price: 300000,
    originalPrice: 300000,
    discountPercent: 0,
    badge: "Song Ngữ Anh - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Nhảy, chạy, bơi lội, khiêu vũ, bắt bóng... Giúp bé vừa học động từ tiếng Anh vừa vận động thể chất dẻo dai khỏe mạnh.",
    highlights: ["30 Thẻ AR Chuyển Động", "Phát âm chuẩn IPA", "Tương tác chạm chuyển động"],
    isFeatured: true,
  },

  // --- 4. HÀNH ĐỘNG & THỂ CHẤT (TRUNG - VIỆT) ---
  {
    id: "pack-hanhdong-zhvi-30",
    name: "Bộ 30 Thẻ AR Hành Động & Thể Chất (Trung - Việt)",
    packCode: "POLY30-HANHDONG-ZHVI",
    categoryName: "Hành Động",
    categorySlug: "hanh-dong",
    languageType: "zh-vi",
    cardsCount: 30,
    price: 300000,
    originalPrice: 300000,
    discountPercent: 0,
    badge: "Song Ngữ Trung - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "30 động từ thể chất và hành động hàng ngày kèm phiên âm Pinyin và mô phỏng 3D sinh động.",
    highlights: ["30 Động từ tiếng Trung", "Mô phỏng 3D trực quan", "Kích thích vận động"],
  },

  // --- 5. HOA QUẢ & TRÁI CÂY (ANH - VIỆT) ---
  {
    id: "pack-hoaqua-envi-30",
    name: "Bộ 30 Thẻ AR Trái Cây & Hoa Quả (Anh - Việt)",
    packCode: "POLY30-HOAQUA-ENVI",
    categoryName: "Hoa Quả & Trái Cây",
    categorySlug: "hoa-qua",
    languageType: "en-vi",
    cardsCount: 30,
    price: 300000,
    originalPrice: 300000,
    discountPercent: 0,
    badge: "Song Ngữ Anh - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "strawberry",
    description: "Dâu tây, táo, chuối, cam, xoài, dưa hấu... Giúp bé nhận biết màu sắc, mùi vị và tên gọi các loại quả tươi mát.",
    highlights: ["30 Thẻ AR Trái Cây 3D", "Nhận biết vị giác & màu sắc", "Tương tác xoay 360°"],
    isFeatured: true,
  },

  // --- 6. HOA QUẢ & TRÁI CÂY (TRUNG - VIỆT) ---
  {
    id: "pack-hoaqua-zhvi-30",
    name: "Bộ 30 Thẻ AR Trái Cây & Hoa Quả (Trung - Việt)",
    packCode: "POLY30-HOAQUA-ZHVI",
    categoryName: "Hoa Quả & Trái Cây",
    categorySlug: "hoa-qua",
    languageType: "zh-vi",
    cardsCount: 30,
    price: 300000,
    originalPrice: 300000,
    discountPercent: 0,
    badge: "Song Ngữ Trung - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "strawberry",
    description: "Khám phá thế giới hoa quả tươi ngon với từ vựng tiếng Trung và phát âm chuẩn bản xứ.",
    highlights: ["30 Thẻ AR Trái Cây 3D", "Pinyin chuẩn thanh điệu", "Tương tác xoay 360°"],
  },

  // --- 7. NGHỀ NGHIỆP ƯỚC MƠ (ANH - VIỆT) ---
  {
    id: "pack-nghenghiep-envi-30",
    name: "Bộ 30 Thẻ AR Nghề Nghiệp Ước Mơ (Anh - Việt)",
    packCode: "POLY30-NGHENGHIEP-ENVI",
    categoryName: "Nghề Nghiệp",
    categorySlug: "nghe-nghiep",
    languageType: "en-vi",
    cardsCount: 30,
    price: 300000,
    originalPrice: 300000,
    discountPercent: 0,
    badge: "Song Ngữ Anh - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Bác sĩ, phi công, lính cứu hỏa, giáo viên, đầu bếp, kỹ sư... Định hướng tương lai và bồi dưỡng ước mơ cho bé ngay từ nhỏ.",
    highlights: ["30 Thẻ AR Nghề Nghiệp", "Mô phỏng trang phục 3D", "Phát âm song ngữ Anh - Việt"],
    isFeatured: true,
  },

  // --- 8. NGHỀ NGHIỆP ƯỚC MƠ (TRUNG - VIỆT) ---
  {
    id: "pack-nghenghiep-zhvi-30",
    name: "Bộ 30 Thẻ AR Nghề Nghiệp Ước Mơ (Trung - Việt)",
    packCode: "POLY30-NGHENGHIEP-ZHVI",
    categoryName: "Nghề Nghiệp",
    categorySlug: "nghe-nghiep",
    languageType: "zh-vi",
    cardsCount: 30,
    price: 300000,
    originalPrice: 300000,
    discountPercent: 0,
    badge: "Song Ngữ Trung - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Khám phá 30 nghề nghiệp cao quý trong xã hội với vốn từ vựng tiếng Trung phong phú và chính xác.",
    highlights: ["30 Nghề nghiệp xã hội", "Phát âm chuẩn bản xứ", "Hình ảnh 3D chân thực"],
  },

  // --- 9. PHƯƠNG TIỆN GIAO THÔNG (ANH - VIỆT) ---
  {
    id: "pack-xeco-envi-30",
    name: "Bộ 30 Thẻ AR Phương Tiện Giao Thông (Anh - Việt)",
    packCode: "POLY30-XECO-ENVI",
    categoryName: "Xe Cộ & Giao Thông",
    categorySlug: "xe-co",
    languageType: "en-vi",
    cardsCount: 30,
    price: 300000,
    originalPrice: 300000,
    discountPercent: 0,
    badge: "Song Ngữ Anh - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Ô tô, máy bay, tàu hỏa, tàu ngầm, trực thăng... Khám phá cấu tạo các phương tiện cùng tiếng còi và động cơ chân thực.",
    highlights: ["30 Thẻ AR Phương Tiện", "Mô phỏng động cơ 3D", "Kích thích tư duy logic"],
    isFeatured: true,
  },

  // --- 10. PHƯƠNG TIỆN GIAO THÔNG (TRUNG - VIỆT) ---
  {
    id: "pack-xeco-zhvi-30",
    name: "Bộ 30 Thẻ AR Phương Tiện Giao Thông (Trung - Việt)",
    packCode: "POLY30-XECO-ZHVI",
    categoryName: "Xe Cộ & Giao Thông",
    categorySlug: "xe-co",
    languageType: "zh-vi",
    cardsCount: 30,
    price: 300000,
    originalPrice: 300000,
    discountPercent: 0,
    badge: "Song Ngữ Trung - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Học tên gọi các phương tiện giao thông đường bộ, đường thủy, đường hàng không bằng tiếng Trung sống động.",
    highlights: ["30 Phương tiện đa dạng", "Âm thanh còi máy chân thực", "Tương tác 3D đa góc nhìn"],
  },
];
