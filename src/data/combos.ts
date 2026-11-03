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

export const COMBO_PACKS: CardComboPack[] = [
  // --- GÓI COMBO VIP ĐẠI GIA ĐÌNH ---
  {
    id: "pack-all-vip-270",
    name: "Siêu Combo Trọn Bộ 9-in-1 (Toàn Bộ 270 Thẻ AR)",
    packCode: "POLY270-ALLVIP",
    categoryName: "Trọn Bộ VIP",
    categorySlug: "all-vip",
    languageType: "all",
    cardsCount: 270,
    price: 1490000,
    originalPrice: 2241000,
    discountPercent: 34,
    badge: "Tiết Kiệm 751K • Bản Giới Hạn",
    subBadge: "Đầy Đủ 9 Chủ Đề Toàn Diện Nhất Poly Cards",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    targetUrl: "/products",
    description: "Sở hữu toàn bộ 270 thẻ AR đa ngữ (Động vật, Xe cộ, Hoa quả, Hành động, Nghề nghiệp). Tặng hộp quà cao cấp và tài khoản VIP vĩnh viễn.",
    highlights: ["Trọn bộ 270 Thẻ AR 3D", "Hộp quà sơn mài cao cấp", "Bảo hành bản quyền trọn đời"],
    isFeatured: true,
  },
  {
    id: "pack-combo-vip-120",
    name: "Combo Trọn Bộ VIP 4-in-1 (120 Thẻ AR)",
    packCode: "POLY120-COMBOVIP",
    categoryName: "Trọn Bộ VIP",
    categorySlug: "all-vip",
    languageType: "all",
    cardsCount: 120,
    price: 799000,
    originalPrice: 1196000,
    discountPercent: 33,
    badge: "Tiết Kiệm 397K • Hộp Quà VIP",
    subBadge: "Gói Combo Đại Gia Đình Được Mua Nhiều Nhất",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    targetUrl: "/products",
    description: "Trọn bộ 4 chủ đề Động Vật + Hành Động + Xe Cộ + Hoa Quả. Tặng kèm Hộp quà cao cấp, thẻ bảo hành & mã kích hoạt trọn đời.",
    highlights: ["Trọn bộ 120 Thẻ AR", "Hộp quà cứng cao cấp", "Bảo hành bản quyền trọn đời"],
    isFeatured: true,
  },

  // --- CÁC BỘ 30 THẺ CHỦ ĐỀ: ĐỘNG VẬT HOANG DÃ ---
  {
    id: "pack-dongvat-envi-30",
    name: "Bộ 30 Thẻ AR Động Vật Hoang Dã (Anh - Việt)",
    packCode: "POLY30-DONGVAT-ENVI",
    categoryName: "Động Vật",
    categorySlug: "dong-vat",
    languageType: "en-vi",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Bán Chạy Nhất",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Sư tử, voi, chó, mèo, hươu, gấu trúc... Khám phá thế giới muông thú với âm thanh gầm rú chân thực và phát âm tiếng Anh chuẩn IPA.",
    highlights: ["30 Thẻ AR 3D Động Vật", "Chống nước 100%", "Phát âm chuẩn Anh - Việt"],
    isFeatured: true,
  },
  {
    id: "pack-dongvat-zhvi-30",
    name: "Bộ 30 Thẻ AR Động Vật Hoang Dã (Trung - Việt)",
    packCode: "POLY30-DONGVAT-ZHVI",
    categoryName: "Động Vật",
    categorySlug: "dong-vat",
    languageType: "zh-vi",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Song Ngữ Trung - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Học từ vựng tiếng Trung qua 30 loài động vật với Pinyin chuẩn và giọng đọc người bản xứ truyền cảm.",
    highlights: ["30 Thẻ AR Động Vật", "Pinyin chuẩn thanh điệu", "Hình ảnh 3D hoạt hình"],
  },

  // --- CÁC BỘ 30 THẺ CHỦ ĐỀ: HÀNH ĐỘNG & THỂ CHẤT ---
  {
    id: "pack-hanhdong-envi-30",
    name: "Bộ 30 Thẻ AR Hành Động & Thể Chất (Anh - Việt)",
    packCode: "POLY30-HANHDONG-ENVI",
    categoryName: "Hành Động",
    categorySlug: "hanh-dong",
    languageType: "en-vi",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Mới Ra Mắt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Nhảy, chạy, bơi lội, khiêu vũ, bắt bóng... Giúp bé vừa học động từ tiếng Anh vừa vận động thể chất dẻo dai khỏe mạnh.",
    highlights: ["30 Thẻ AR Chuyển Động", "Phát âm chuẩn IPA", "Tương tác chạm chuyển động"],
    isFeatured: true,
  },
  {
    id: "pack-hanhdong-zhvi-30",
    name: "Bộ 30 Thẻ AR Hành Động & Thể Chất (Trung - Việt)",
    packCode: "POLY30-HANHDONG-ZHVI",
    categoryName: "Hành Động",
    categorySlug: "hanh-dong",
    languageType: "zh-vi",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Song Ngữ Trung - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "30 động từ thể chất và hành động hàng ngày kèm phiên âm Pinyin và mô phỏng 3D sinh động.",
    highlights: ["30 Động từ tiếng Trung", "Mô phỏng 3D trực quan", "Kích thích vận động"],
  },

  // --- BỘ 30 THẺ CHỦ ĐỀ: HOA QUẢ & TRÁI CÂY ---
  {
    id: "pack-hoaqua-envi-30",
    name: "Bộ 30 Thẻ AR Trái Cây & Hoa Quả (Anh - Việt)",
    packCode: "POLY30-HOAQUA-ENVI",
    categoryName: "Trái Cây",
    categorySlug: "trai-cay",
    languageType: "en-vi",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Sắc Màu Tươi Sáng",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "strawberry",
    description: "Dâu tây, táo, chuối, cam, xoài, dưa hấu... Giúp bé nhận biết màu sắc, mùi vị và tên gọi các loại quả tươi mát.",
    highlights: ["30 Thẻ AR Trái Cây 3D", "Nhận biết vị giác & màu sắc", "Tương tác xoay 360°"],
    isFeatured: true,
  },

  // --- CÁC BỘ 30 THẺ CHỦ ĐỀ: NGHỀ NGHIỆP ƯỚC MƠ ---
  {
    id: "pack-nghenghiep-envi-30",
    name: "Bộ 30 Thẻ AR Nghề Nghiệp Ước Mơ (Anh - Việt)",
    packCode: "POLY30-NGHENGHIEP-ENVI",
    categoryName: "Nghề Nghiệp",
    categorySlug: "nghe-nghiep",
    languageType: "en-vi",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Nuôi Dưỡng Ước Mơ",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Bác sĩ, phi công, lính cứu hỏa, giáo viên, đầu bếp, kỹ sư... Định hướng tương lai và bồi dưỡng ước mơ cho bé ngay từ nhỏ.",
    highlights: ["30 Thẻ AR Nghề Nghiệp", "Mô phỏng trang phục 3D", "Phát âm song ngữ Anh - Việt"],
    isFeatured: true,
  },
  {
    id: "pack-nghenghiep-zhvi-30",
    name: "Bộ 30 Thẻ AR Nghề Nghiệp Ước Mơ (Trung - Việt)",
    packCode: "POLY30-NGHENGHIEP-ZHVI",
    categoryName: "Nghề Nghiệp",
    categorySlug: "nghe-nghiep",
    languageType: "zh-vi",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Song Ngữ Trung - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Khám phá 30 nghề nghiệp cao quý trong xã hội với vốn từ vựng tiếng Trung phong phú và chính xác.",
    highlights: ["30 Nghề nghiệp xã hội", "Phát âm chuẩn bản xứ", "Hình ảnh 3D chân thực"],
  },

  // --- CÁC BỘ 30 THẺ CHỦ ĐỀ: PHƯƠNG TIỆN GIAO THÔNG ---
  {
    id: "pack-xeco-envi-30",
    name: "Bộ 30 Thẻ AR Phương Tiện Giao Thông (Anh - Việt)",
    packCode: "POLY30-XECO-ENVI",
    categoryName: "Phương Tiện",
    categorySlug: "phuong-tien",
    languageType: "en-vi",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Bé Trai Yêu Thích",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Ô tô, máy bay, tàu hỏa, tàu ngầm, trực thăng... Khám phá cấu tạo các phương tiện cùng tiếng còi và động cơ chân thực.",
    highlights: ["30 Thẻ AR Phương Tiện", "Mô phỏng động cơ 3D", "Kích thích tư duy logic"],
    isFeatured: true,
  },
  {
    id: "pack-xeco-zhvi-30",
    name: "Bộ 30 Thẻ AR Phương Tiện Giao Thông (Trung - Việt)",
    packCode: "POLY30-XECO-ZHVI",
    categoryName: "Phương Tiện",
    categorySlug: "phuong-tien",
    languageType: "zh-vi",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Song Ngữ Trung - Việt",
    imageSrc: "/images/cards/butterfly-card.png",
    sampleSlug: "polycards",
    description: "Học tên gọi các phương tiện giao thông đường bộ, đường thủy, đường hàng không bằng tiếng Trung sống động.",
    highlights: ["30 Phương tiện đa dạng", "Âm thanh còi máy chân thực", "Tương tác 3D đa góc nhìn"],
  },
];

export const DEFAULT_FEATURED_COMBO: CardComboPack = COMBO_PACKS[1];
