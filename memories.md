# Nhật Ký Phát Triển & Ký Ức Dự Án Poly Cards (Memories)

> **File này lưu lại toàn bộ tiến độ, kiến trúc kỹ thuật, quy tắc bất di bất dịch và quyết định quan trọng trong suốt quá trình xây dựng dự án.**

---

## 1. Thông Tin Tổng Quan Dự Án

- **Tên dự án:** Poly Cards
- **Khẩu hiệu:** "Học tiếng Anh bằng cách chạm vào thế giới thật"
- **Mục tiêu:** Xây dựng Landing Page bán mô hình/đồ chơi thẻ động vật vật lý kết hợp công nghệ AR quét mã QR cho trẻ 3-8 tuổi.
- **Phong cách thiết kế:** **Premium + Educational + Playful** (Ấm áp, bo tròn an toàn, typography rõ ràng, không dùng emoji, giao diện hiện đại chuẩn quốc tế).
- **Nguyên tắc làm việc:** Tuân thủ mục 0 & 12, thực hiện theo từng bước, nghiệm thu qua test rồi mới sang bước tiếp theo. Không thêm tính năng ngoài phạm vi (không admin, không đăng nhập, không giỏ hàng, không quiz).

---

## 2. Tech Stack & Thư Viện

| Thành phần | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) + React 19 | Xây dựng SSR/SSG, điều hướng linh hoạt |
| **Ngôn ngữ** | TypeScript 5 (Strict Mode) | Đảm bảo an toàn kiểu dữ liệu 100% |
| **Giao diện** | Tailwind CSS v4 | Thiết kế Utility-first, responsive đa thiết bị |
| **3D & AR** | `@google/model-viewer` | Xem 3D tương tác, hỗ trợ Android WebXR & iOS Quick Look |
| **Quét QR** | `html5-qrcode` | Quét QR camera sau, fallback mượt trên mọi mobile browser |
| **Biểu tượng** | `lucide-react` | Bộ icon SVG chuyên nghiệp, chuẩn mực (thay thế hoàn toàn emoji) |
| **Sinh mã QR** | `qrcode` + `tsx` | Script tự động tạo QR PNG/SVG từ `data/animals.json` |

---

## 3. Bộ Kỹ Năng & Quy Chuẩn Bắt Buộc (Skills & Guidelines)

Dự án áp dụng 5 tiêu chuẩn kỹ thuật cốt lõi (được lưu tại `.agents/skills/` và `.agents/rules/`):

1. **Responsive UI Hoàn Hảo**:
   - Thiết kế Mobile-First từ chiều rộng tối thiểu 360px (iPhone SE) đến Tablet (768px) và Desktop (1280px+).
   - Vùng chạm (Touch Target) tối thiểu 44x44px, an toàn cho trẻ nhỏ và phụ huynh.
   - Chiều cao `100dvh` và hỗ trợ Safe Area insets (`env(safe-area-inset-top)` / `bottom`).
2. **Nghiêm Cấm Dùng Icon Emoji**:
   - Tuyệt đối không dùng ký tự emoji (như 🦌, 🐱, 🔊, ✓, ❌) trong mã nguồn UI/JSX/SVG.
   - Toàn bộ biểu tượng chuyển sang vector SVG chuyên nghiệp từ `lucide-react`.
3. **Logic Backend Rõ Ràng**:
   - Tách biệt rõ ràng Data Layer (`data/animals.json`), Data Access (`src/lib/animals.ts`), Verification Service (`src/lib/qr-parser.ts`), và Browser Service (`src/lib/user-agent.ts`).
   - Xử lý triệt để các trường hợp ngoại lệ (URL lạ, camera bị chặn, quét sai sản phẩm, thiếu model 3D).
4. **Bố Cục Dự Án Ngăn Nắp**:
   - Phân chia module rõ rệt: `src/app/`, `src/components/{common, landing, ar, scanner}`, `src/hooks/`, `src/lib/`, `src/config/`, `src/types/`.
5. **Nguyên Tắc DRY (Không Lặp Lại Code)**:
   - Gom các hàm xử lý định dạng vào `src/lib/formatters.ts`.
   - Đưa logic có trạng thái phức tạp (Camera, Audio, Browser detect) thành Custom Hooks.
   - Chia nhỏ UI thành các atomic components có khả năng tái sử dụng cao.

---

## 4. Tiến Độ Thực Hiện Từng Bước (Roadmap)

### [x] Bước 1: Khởi tạo cấu trúc dự án, Data & Helper (Đã hoàn thành)
- Khởi tạo Next.js, cài đặt thư viện cần thiết.
- Tạo [`data/animals.json`](file:///Users/peggy2402/Projects/polycards/data/animals.json) cho 6 con vật mẫu (Deer, Cat, Dog, Elephant, Lion, Panda).
- Tạo [`src/types/animal.ts`](file:///Users/peggy2402/Projects/polycards/src/types/animal.ts) và [`src/types/model-viewer.d.ts`](file:///Users/peggy2402/Projects/polycards/src/types/model-viewer.d.ts).
- Tạo cấu hình thương hiệu [`src/config/site.ts`](file:///Users/peggy2402/Projects/polycards/src/config/site.ts).
- Tạo helper đọc dữ liệu [`src/lib/animals.ts`](file:///Users/peggy2402/Projects/polycards/src/lib/animals.ts) và parser QR an toàn [`src/lib/qr-parser.ts`](file:///Users/peggy2402/Projects/polycards/src/lib/qr-parser.ts).
- Tạo tiện ích nhận diện trình duyệt nhúng [`src/lib/user-agent.ts`](file:///Users/peggy2402/Projects/polycards/src/lib/user-agent.ts) và bộ formatters [`src/lib/formatters.ts`](file:///Users/peggy2402/Projects/polycards/src/lib/formatters.ts).
- Tạo bộ kỹ năng dự án trong `.agents/skills/` và quy tắc toàn cục `.agents/rules/`.
- Chuẩn hóa placeholder assets không emoji (SVG vector, MP3 audio, 3D GLB/USDZ).
- Chạy test kiểm thử tự động [`scripts/test-step1.ts`](file:///Users/peggy2402/Projects/polycards/scripts/test-step1.ts) và TypeScript check đạt 100% PASS.

### [x] Bước 2: Xây dựng Landing Page + Grid sản phẩm (Đã hoàn thành)
- Xây dựng đầy đủ 9 sections chuẩn mực theo spec: [`Navbar`](file:///Users/peggy2402/Projects/polycards/src/components/common/navbar.tsx), [`HeroSection`](file:///Users/peggy2402/Projects/polycards/src/components/landing/hero-section.tsx), [`WhyChooseSection`](file:///Users/peggy2402/Projects/polycards/src/components/landing/why-choose-section.tsx), [`HowItWorksSection`](file:///Users/peggy2402/Projects/polycards/src/components/landing/how-it-works-section.tsx), [`ProductsGrid`](file:///Users/peggy2402/Projects/polycards/src/components/landing/products-grid.tsx), [`ArDemoSection`](file:///Users/peggy2402/Projects/polycards/src/components/landing/ar-demo-section.tsx), [`BenefitsSection`](file:///Users/peggy2402/Projects/polycards/src/components/landing/benefits-section.tsx), [`FaqSection`](file:///Users/peggy2402/Projects/polycards/src/components/landing/faq-section.tsx), [`CtaBanner`](file:///Users/peggy2402/Projects/polycards/src/components/landing/cta-banner.tsx) + [`Footer`](file:///Users/peggy2402/Projects/polycards/src/components/common/footer.tsx).
- Thay thế toàn bộ SVG placeholder bằng bộ ảnh **3D hoạt hình Pixar/Disney cao cấp (.jpg)** cho 6 con vật (Lion, Deer, Cat, Dog, Elephant, Panda), không còn các ô chữ nhật tạm bợ che mặt nhân vật.
- Tích hợp ảnh thẻ bài thật Poly Cards [`lion-card.jpg`](file:///Users/peggy2402/Projects/polycards/public/images/cards/lion-card.jpg) và logo chính thức [`logo.png`](file:///Users/peggy2402/Projects/polycards/public/images/icons/logo.png).
- **Hiệu ứng Parallax 3D Tilt**: Mỗi card tự động nghiêng theo chuột với lớp ánh sáng Holographic Glare và chiều sâu 3D chân thực.
- **Hiệu ứng Parallax Scrolling**: Tích hợp [`ParallaxBackground`](file:///Users/peggy2402/Projects/polycards/src/components/landing/parallax-background.tsx) với các luồng mây và ánh sáng bay bổng theo tốc độ cuộn trang.
- **Hệ thống Phát Âm Đa Ngôn Ngữ**: Hỗ trợ bộ 3 ngôn ngữ Tiếng Anh (kèm IPA), Tiếng Việt, và Tiếng Trung (kèm Pinyin), bấm nghe tức thì ngay trên từng card.
- Chuyển đổi toàn diện sang phong cách **Tươi sáng, Ấm áp & Trực quan (Bright & Playful)**, loại bỏ triệt để màu nền tối.
- Build production thành công 100% không cảnh báo (`next build` đạt 4/4 static prerender).

### [x] Bước 3: Trang kết quả `/ar/[slug]` (Đã hoàn thành)
- Hoàn thiện trang [`/ar/[slug]`](file:///Users/peggy2402/Projects/polycards/src/app/ar/%5Bslug%5D/page.tsx) hỗ trợ generateStaticParams cho toàn bộ 6 con vật.
- Tích hợp [`ModelViewerView`](file:///Users/peggy2402/Projects/polycards/src/components/ar/model-viewer-view.tsx): tải model 3D qua WebXR (Android Scene Viewer) và iOS Quick Look (.usdz).
- Tích hợp [`ArAudioPlayer`](file:///Users/peggy2402/Projects/polycards/src/components/ar/ar-audio-player.tsx): phát âm 3 ngôn ngữ EN/VI/ZH với hiệu ứng sóng âm thanh.
- Tích hợp [`AnimationControls`](file:///Users/peggy2402/Projects/polycards/src/components/ar/animation-controls.tsx): chuyển đổi động tác nhân vật (Roar, Walk, Idle).
- Trải nghiệm an toàn 100%: Không quảng cáo, không pop-up, không link ngoài độc hại.

### [x] Bước 4: Màn hình quét QR `/scan` (Đã hoàn thành)
- Hoàn thiện trang [`/scan`](file:///Users/peggy2402/Projects/polycards/src/app/scan/page.tsx).
- [`ScanGuideModal`](file:///Users/peggy2402/Projects/polycards/src/components/scanner/scan-guide-modal.tsx): hiển thị hướng dẫn chuẩn bị trước khi người dùng bấm [Mở Camera] (không tự ý xin quyền).
- [`QrCameraScanner`](file:///Users/peggy2402/Projects/polycards/src/components/scanner/qr-camera-scanner.tsx): quét camera sau (`environment`), hỗ trợ nút bật/tắt đèn pin (flash), reticle quét công nghệ cao, phản hồi rung (vibration) và âm thanh.
- Xử lý 2 chế độ: Quét tự do (chuyển ngay sang `/ar/[slug]`) và Quét theo sản phẩm (`?expect=slug`, cảnh báo nếu quét nhầm sang con khác).
- [`InAppBrowserModal`](file:///Users/peggy2402/Projects/polycards/src/components/scanner/in-app-browser-modal.tsx): tự động phát hiện trình duyệt nhúng Zalo/TikTok/Facebook và cung cấp nút copy link mở ngoài.
- Trang tùy chỉnh [`not-found.tsx`](file:///Users/peggy2402/Projects/polycards/src/app/not-found.tsx) thân thiện.
- Build production thành công 100% đạt 12/12 static prerendered pages.

### [ ] Bước 5: Script tạo mã QR & Hướng dẫn kiểm thử di động
- Script Node sinh QR SVG/PNG vào `qr-output/`.
- Hướng dẫn cấu hình HTTPS nội bộ hoặc tunnel (Cloudflare / ngrok) để test camera trực tiếp trên điện thoại.
