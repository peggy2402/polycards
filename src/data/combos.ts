export interface CardComboPack {
  id: string;
  name: string;
  packCode: string;
  categoryName: string;
  categorySlug: string;
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
  {
    id: "pack-animals-30",
    name: "Bộ 30 Thẻ AR Động Vật Hoang Dã",
    packCode: "POLY30-DONGVAT",
    categoryName: "Động Vật",
    categorySlug: "dong-vat",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Bán Chạy Nhất",
    imageSrc: "/images/cards/lion-card.jpg",
    sampleSlug: "lion",
    description: "Sư tử, voi, chó, mèo, hươu, gấu trúc... Khám phá thế giới muông thú với âm thanh gầm rú chân thực và cử động 3D sống động.",
    highlights: ["30 Thẻ AR 3D", "Chống nước 100%", "3 Ngôn ngữ Anh - Việt - Trung"],
    isFeatured: true,
  },
  {
    id: "pack-actions-30",
    name: "Bộ 30 Thẻ AR Hành Động & Thể Chất",
    packCode: "POLY30-HANHDONG",
    categoryName: "Hành Động",
    categorySlug: "hanh-dong",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Mới Ra Mắt",
    imageSrc: "/images/cards/jump-template.jpg",
    sampleSlug: "jump",
    description: "Nhảy, chạy, bơi lội, khiêu vũ, bắt bóng... Giúp bé vừa học động từ tiếng Anh vừa vận động thể chất dẻo dai khỏe mạnh.",
    highlights: ["30 Thẻ AR Chuyển Động", "Phát âm chuẩn IPA", "Hình ảnh 3D hoạt hình"],
    isFeatured: true,
  },
  {
    id: "pack-vehicles-30",
    name: "Bộ 30 Thẻ AR Phương Tiện Giao Thông",
    packCode: "POLY30-XECO",
    categoryName: "Phương Tiện",
    categorySlug: "phuong-tien",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Bé Trai Yêu Thích",
    imageSrc: "/images/animals/elephant.jpg",
    sampleSlug: "lion",
    description: "Ô tô, máy bay, tàu hỏa, tàu ngầm, trực thăng... Khám phá cấu tạo các phương tiện cùng tiếng còi và động cơ chân thực.",
    highlights: ["30 Thẻ AR Phương Tiện", "Mô phỏng động cơ 3D", "Kích thích tư duy logic"],
  },
  {
    id: "pack-fruits-30",
    name: "Bộ 30 Thẻ AR Trái Cây & Hoa Quả",
    packCode: "POLY30-HOAQUA",
    categoryName: "Trái Cây",
    categorySlug: "trai-cay",
    cardsCount: 30,
    price: 249000,
    originalPrice: 299000,
    discountPercent: 17,
    badge: "Sắc Màu Tươi Sáng",
    imageSrc: "/images/animals/deer.jpg",
    sampleSlug: "cat",
    description: "Táo, chuối, cam, dâu tây, xoài, dưa hấu... Giúp bé nhận biết màu sắc, mùi vị và tên gọi các loại quả tốt cho sức khỏe.",
    highlights: ["30 Thẻ AR Trái Cây", "Nhận biết màu sắc & vị giác", "Tương tác chạm xoay 360°"],
  },
  {
    id: "pack-combo-vip-120",
    name: "Combo Trọn Bộ VIP 4-in-1 (120 Thẻ AR)",
    packCode: "POLY120-COMBOVIP",
    categoryName: "Trọn Bộ VIP",
    categorySlug: "all-vip",
    cardsCount: 120,
    price: 799000,
    originalPrice: 1196000,
    discountPercent: 33,
    badge: "Tiết Kiệm 397K • Hộp Quà VIP",
    subBadge: "Gói Combo Đại Gia Đình Toàn Diện Nhất",
    imageSrc: "/images/cards/lion-cards.jpg",
    sampleSlug: "jump",
    targetUrl: "/products",
    description: "Trọn bộ 4 chủ đề Động Vật + Hành Động + Xe Cộ + Hoa Quả. Tặng kèm Hộp quà cao cấp, thẻ bảo hành & mã kích hoạt trọn đời.",
    highlights: ["Trọn bộ 120 Thẻ AR", "Hộp quà cứng cao cấp", "Bảo hành bản quyền trọn đời"],
    isFeatured: true,
  },
];

export const DEFAULT_FEATURED_COMBO: CardComboPack = COMBO_PACKS[4];
