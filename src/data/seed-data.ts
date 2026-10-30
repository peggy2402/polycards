import { Animal, ProductCategory } from "@/types/animal";

export interface SeedOrderLineItem {
  id: string;
  name: string;
  packCode?: string;
  categorySlug?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SeedOrderItem {
  id: string;
  code: string;
  codeType?: "SINGLE" | "MULTI" | "PACK";
  unlockedSlug?: string;
  unlockedSlugs?: string[];
  customerType: "TRUCTIEP" | "ONLINE";
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  packId?: string;
  packCode?: string;
  packTitle: string;
  allowedCategorySlug?: string;
  items?: SeedOrderLineItem[];
  subtotal?: number;
  vatRate?: number; // 0, 5, 8, 10
  vatAmount?: number;
  creditAmount: number; // Phát sinh Có: Số tiền khách hàng cần thanh toán
  debitAmount: number; // Phát sinh Nợ: Số tiền khách hàng đã thanh toán
  remainingAmount?: number;
  balanceAmount?: number; // debitAmount - creditAmount (dương: trả thừa, âm: trả thiếu)
  paymentMethod: "TIEN_MAT" | "CHUYEN_KHOAN";
  totalPrice?: number;
  status?: string;
  createdAt?: string;
  note?: string;
  directUrl?: string;
}

export interface SeedCustomerItem {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  type: "TRUCTIEP" | "ONLINE";
  orders: string[];
  totalSpent: number;
  createdAt: string;
}

export const INITIAL_CATEGORIES: ProductCategory[] = [
  {
    id: "cat-animals",
    name: "Động Vật",
    slug: "dong-vat",
    packCode: "POLY30-DONGVAT",
    totalCards: 30,
    iconName: "PawPrint",
    description:
      "Bộ 30 thẻ thế giới động vật hoang dã và vật nuôi thông minh tương tác thực tế ảo AR sống động.",
    createdAt: "2026-10-27",
  },
  {
    id: "cat-actions",
    name: "Hành Động",
    slug: "hanh-dong",
    packCode: "POLY30-HANHDONG",
    totalCards: 30,
    iconName: "Activity",
    description:
      "Bộ 30 thẻ rèn luyện thể chất, phản xạ và thói quen vận động vui tươi phát triển thể chất cho trẻ.",
    createdAt: "2026-10-27",
  },
  {
    id: "cat-vehicles",
    name: "Xe Cộ & Giao Thông",
    slug: "xe-co",
    packCode: "POLY30-XECO",
    totalCards: 30,
    iconName: "Car",
    description:
      "Bộ 30 phương tiện giao thông đường bộ, hàng không, đường thủy tương tác 3D chân thực.",
    createdAt: "2026-10-27",
  },
  {
    id: "cat-fruits",
    name: "Hoa Quả & Trái Cây",
    slug: "hoa-qua",
    packCode: "POLY30-HOAQUA",
    totalCards: 30,
    iconName: "Apple",
    description:
      "Bộ 30 loại hoa quả và rau củ bổ dưỡng giúp trẻ học tiếng Anh và nhận biết màu sắc chuẩn xác.",
    createdAt: "2026-10-27",
  },
];

export const INITIAL_PRODUCTS: Animal[] = [
  {
    id: "deer-001",
    slug: "deer",
    qrCode: "AR-DEER-001",
    nameEn: "Deer",
    nameVi: "Con hươu",
    nameZh: "小鹿",
    ipa: "/dɪr/",
    pinyinZh: "xiǎolù",
    categoryId: "cat-animals",
    category: "Động Vật",
    categorySlug: "dong-vat",
    packCode: "POLY30-DONGVAT",
    description:
      "Chú hươu sao hiền lành với bộ lông đốm trắng tuyệt đẹp và đôi sừng nhánh cây sống giữa khu rừng cổ tích xanh mát.",
    price: 239000,
    originalPrice: 299000,
    images: ["/images/animals/deer.jpg"],
    audioUrl: "/audio/deer.mp3",
    audios: {
      en: "/audio/en/deer.mp3",
      vi: "/audio/vi/deer.mp3",
      zh: "/audio/zh/deer.mp3",
    },
    modelUrl: "/models/deer.glb",
    iosModelUrl: "/models/deer.usdz",
    posterUrl: "/images/posters/deer-poster.jpg",
    animations: ["Idle", "Walk"],
    arEnabled: true,
    buyUrl: "/order?animal=deer",
    badge: "Yêu thích",
  },
  {
    id: "cat-002",
    slug: "cat",
    qrCode: "AR-CAT-002",
    nameEn: "Cat",
    nameVi: "Con mèo",
    nameZh: "小猫",
    ipa: "/kæt/",
    pinyinZh: "xiǎomāo",
    categoryId: "cat-animals",
    category: "Động Vật",
    categorySlug: "dong-vat",
    packCode: "POLY30-DONGVAT",
    description:
      "Mèo con bốn chân tinh nghịch, thích cuộn tròn sưởi nắng và có đôi tai vô cùng nhạy bén với âm thanh xung quanh.",
    price: 219000,
    originalPrice: 299000,
    images: ["/images/animals/cat.jpg"],
    audioUrl: "/audio/cat.mp3",
    audios: {
      en: "/audio/en/cat.mp3",
      vi: "/audio/vi/cat.mp3",
      zh: "/audio/zh/cat.mp3",
    },
    modelUrl: "/models/cat.glb",
    iosModelUrl: "/models/cat.usdz",
    posterUrl: "/images/posters/cat-poster.jpg",
    animations: ["Walk", "Idle"],
    arEnabled: true,
    buyUrl: "/order?animal=cat",
    badge: "Thân thiện",
  },
  {
    id: "dog-003",
    slug: "dog",
    qrCode: "AR-DOG-003",
    nameEn: "Dog",
    nameVi: "Con chó",
    nameZh: "小狗",
    ipa: "/dɔːɡ/",
    pinyinZh: "xiǎogǒu",
    categoryId: "cat-animals",
    category: "Động Vật",
    categorySlug: "dong-vat",
    packCode: "POLY30-DONGVAT",
    description:
      "Chú chó trung thành và tinh khôn, luôn sẵn sàng vẫy đuôi chào đón bé và tham gia vào những trò chơi vui nhộn.",
    price: 219000,
    originalPrice: 299000,
    images: ["/images/animals/dog.jpg"],
    audioUrl: "/audio/dog.mp3",
    audios: {
      en: "/audio/en/dog.mp3",
      vi: "/audio/vi/dog.mp3",
      zh: "/audio/zh/dog.mp3",
    },
    modelUrl: "/models/dog.glb",
    iosModelUrl: "/models/dog.usdz",
    posterUrl: "/images/posters/dog-poster.jpg",
    animations: ["Idle", "Walk"],
    arEnabled: true,
    buyUrl: "/order?animal=dog",
    badge: "Bán chạy",
  },
  {
    id: "elephant-004",
    slug: "elephant",
    qrCode: "AR-ELEPHANT-004",
    nameEn: "Elephant",
    nameVi: "Con voi",
    nameZh: "大象",
    ipa: "/ˈel.ə.fənt/",
    pinyinZh: "dàxiàng",
    categoryId: "cat-animals",
    category: "Động Vật",
    categorySlug: "dong-vat",
    packCode: "POLY30-DONGVAT",
    description:
      "Voi khổng lồ tốt bụng với đôi tai to như cánh quạt và chiếc vòi khéo léo biết phun nước vui đùa dưới ánh mặt trời.",
    price: 269000,
    originalPrice: 329000,
    images: ["/images/animals/elephant.jpg"],
    audioUrl: "/audio/elephant.mp3",
    audios: {
      en: "/audio/en/elephant.mp3",
      vi: "/audio/vi/elephant.mp3",
      zh: "/audio/zh/elephant.mp3",
    },
    modelUrl: "/models/elephant.glb",
    iosModelUrl: "/models/elephant.usdz",
    posterUrl: "/images/posters/elephant-poster.jpg",
    animations: ["Idle", "Walk"],
    arEnabled: true,
    buyUrl: "/order?animal=elephant",
    badge: "Mới ra mắt",
  },
  {
    id: "lion-005",
    slug: "lion",
    qrCode: "AR-LION-005",
    nameEn: "Lion",
    nameVi: "Sư tử",
    nameZh: "狮子",
    ipa: "/ˈlaɪ.ən/",
    pinyinZh: "shīzi",
    categoryId: "cat-animals",
    category: "Động Vật",
    categorySlug: "dong-vat",
    packCode: "POLY30-DONGVAT",
    description:
      "Chúa sơn lâm dũng mãnh của thảo nguyên xanh, sở hữu chiếc bờm vàng óng ánh và tiếng gầm vang dội uy nghiêm.",
    price: 279000,
    originalPrice: 349000,
    images: ["/images/animals/lion.jpg"],
    audioUrl: "/audio/lion.mp3",
    audios: {
      en: "/audio/en/lion.mp3",
      vi: "/audio/vi/lion.mp3",
      zh: "/audio/zh/lion.mp3",
    },
    modelUrl: "/models/lion.glb",
    iosModelUrl: "/models/lion.usdz",
    posterUrl: "/images/posters/lion-poster.jpg",
    animations: ["Object_0", "Roar", "Idle"],
    arEnabled: true,
    buyUrl: "/order?animal=lion",
    badge: "Dũng mãnh",
  },
  {
    id: "panda-006",
    slug: "panda",
    qrCode: "AR-PANDA-006",
    nameEn: "Panda",
    nameVi: "Gấu trúc",
    nameZh: "熊猫",
    ipa: "/ˈpæn.də/",
    pinyinZh: "xióngmāo",
    categoryId: "cat-animals",
    category: "Động Vật",
    categorySlug: "dong-vat",
    packCode: "POLY30-DONGVAT",
    description:
      "Gấu trúc con tròn xoe cực kỳ dễ thương với đôi mắt đen láy, thích ngồi nhai cành trúc non giữa rừng tre xanh biếc.",
    price: 259000,
    originalPrice: 299000,
    images: ["/images/animals/panda.jpg"],
    audioUrl: "/audio/panda.mp3",
    audios: {
      en: "/audio/en/panda.mp3",
      vi: "/audio/vi/panda.mp3",
      zh: "/audio/zh/panda.mp3",
    },
    modelUrl: "/models/panda.glb",
    iosModelUrl: "/models/panda.usdz",
    posterUrl: "/images/posters/panda-poster.jpg",
    animations: ["Idle"],
    arEnabled: true,
    buyUrl: "/order?animal=panda",
    badge: "Dễ thương",
  },
  {
    id: "jump-007",
    slug: "jump",
    qrCode: "AR-JUMP-007",
    nameEn: "Jump",
    nameVi: "Nhảy vui nhộn",
    nameZh: "跳",
    ipa: "/dʒʌmp/",
    pinyinZh: "tiào",
    categoryId: "cat-actions",
    category: "Hành Động",
    categorySlug: "hanh-dong",
    packCode: "POLY30-HANHDONG",
    description:
      "Thẻ học thông minh AR Poly Cards: Bé tập nhảy và vận động vui tươi phát triển thể chất.",
    price: 219000,
    originalPrice: 299000,
    images: ["/images/animals/lion.jpg"],
    audioUrl: "/audio/en/jump.mp3",
    audios: {
      en: "/audio/en/jump.mp3",
      vi: "/audio/vi/jump.mp3",
      zh: "/audio/zh/jump.mp3",
    },
    modelUrl: "/models/lion.glb",
    iosModelUrl: "/models/lion.usdz",
    posterUrl: "/images/posters/lion-poster.jpg",
    animations: ["Idle", "Walk"],
    arEnabled: true,
    buyUrl: "/order?animal=jump",
    badge: "Mới ra mắt",
  },
  {
    id: "walk-008",
    slug: "walk",
    qrCode: "AR-WALK-008",
    nameEn: "Walk",
    nameVi: "Đi bộ (Walk)",
    nameZh: "走",
    ipa: "/wɔːk/",
    pinyinZh: "zǒu",
    categoryId: "cat-actions",
    category: "Hành Động",
    categorySlug: "hanh-dong",
    packCode: "POLY30-HANHDONG",
    badge: "Mới ra mắt",
    price: 219000,
    originalPrice: 299000,
    description:
      "Thẻ học thông minh tương tác thực tế ảo AR Poly Cards: Đi bộ (Walk).",
    images: ["/images/cards/walk-card.jpg"],
    posterUrl: "/images/cards/walk-card.jpg",
    audioUrl: "/audio/walk.mp3",
    audios: {
      en: "/audio/en/walk.mp3",
      vi: "/audio/vi/walk.mp3",
      zh: "/audio/zh/walk.mp3",
    },
    modelUrl: "/models/lion.glb",
    iosModelUrl: "/models/lion.usdz",
    animations: ["Idle", "Walk"],
    arEnabled: true,
    buyUrl: "/order?animal=walk",
    updatedAt: "2026-10-28T05:41:11.724Z",
  },
];

export const INITIAL_ORDERS: SeedOrderItem[] = [];

export const INITIAL_CUSTOMERS: SeedCustomerItem[] = [];

