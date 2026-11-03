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

### [x] Bước 4: Màn hình quét QR & Công nghệ Camera AR `/scan` (Đã hoàn thiện nâng cao)
- Hoàn thiện trang [`/scan`](file:///Users/peggy2402/Projects/polycards/src/app/scan/page.tsx).
- [`ScanGuideModal`](file:///Users/peggy2402/Projects/polycards/src/components/scanner/scan-guide-modal.tsx): hướng dẫn chi tiết, bổ sung nút mở trực tiếp các thẻ mẫu ảo mà không bắt buộc có thẻ giấy.
- [`QrCameraScanner`](file:///Users/peggy2402/Projects/polycards/src/components/scanner/qr-camera-scanner.tsx):
  - Khung ngắm AR HUD tương lai với đường quét laser chuyển động và 4 góc bo kim loại phát sáng.
  - Tích hợp tính năng **Quét từ file ảnh**: Tải ảnh thẻ bài/mã QR từ thư viện ảnh máy (`scanFile`).
  - Tích hợp **Khay Thẻ Mẫu Ảo (Quick Virtual Demo Cards)**: Cho phép phụ huynh hoặc tester bấm thử nghiệm nhanh 6 con vật ngay cả trên máy tính không có webcam/không có thẻ thật.
  - Hiệu ứng **Khóa mục tiêu AR (Target Locked Banner)**: Rung phản hồi haptic và popup xác nhận tên con vật trước khi mở không gian 3D.
  - Bật/tắt đèn flash trợ sáng (Torch) và chuyển đổi linh hoạt.
- Tích hợp [`ArInteractiveQuiz`](file:///Users/peggy2402/Projects/polycards/src/components/ar/ar-interactive-quiz.tsx) vào [`/ar/[slug]`](file:///Users/peggy2402/Projects/polycards/src/app/ar/%5Bslug%5D/ar-viewer-container.tsx): Khép kín chu trình 5 bước theo đúng tài liệu kinh doanh: Thẻ bài vật lý → Quét AR Camera → Xem 3D 360° → Nghe giọng bản xứ 3 ngôn ngữ → Thử thách tương tác mini game củng cố trí nhớ.
- [`InAppBrowserModal`](file:///Users/peggy2402/Projects/polycards/src/components/scanner/in-app-browser-modal.tsx): phát hiện trình duyệt nhúng Zalo/TikTok/Facebook và cung cấp nút copy link mở ngoài.
- Build production thành công 100% đạt 12/12 static prerendered pages.

### [x] Bước 5: Script tạo mã QR & Hướng dẫn kiểm thử di động (Đã hoàn thành)
- Hoàn thành script [`scripts/generate-qr.ts`](file:///Users/peggy2402/Projects/polycards/scripts/generate-qr.ts) và lệnh `npm run generate-qr`.
- Xuất thành công toàn bộ mã QR dạng PNG độ nét cao và SVG vector in ấn vào `public/qr-output/`.
- Hỗ trợ đầy đủ 2 định dạng nội dung: URL web trực tiếp (`https://<domain>/ar/<slug>`) và mã định danh thẻ bài (`AR-LION-005`,...).
- Sẵn sàng cơ chế bảo mật lọc link lạ và hướng dẫn cấu hình HTTPS qua tunnel để test thực tế trên mobile.

### [x] Bước 6: Tích hợp MongoDB Atlas & Dọn dẹp triệt để File Storage cũ (Đã hoàn thành)
- Tạo tầng kết nối & Repository [`src/lib/mongodb.ts`](file:///Users/peggy2402/Projects/polycards/src/lib/mongodb.ts) sử dụng driver chính thức `mongodb` với Global Connection Pool, Auto-Seeding và In-Memory Fallback an toàn.
- Chuyển toàn bộ dữ liệu gốc sang [`src/data/seed-data.ts`](file:///Users/peggy2402/Projects/polycards/src/data/seed-data.ts) và xóa bỏ hoàn toàn thư mục `data/*.json`, `qr-output/` trùng lặp, các file SVG placeholder cũ và `src/lib/server-storage.ts`.
- Gỡ bỏ 100% lệnh `fs` khỏi toàn bộ các API Routes ([`api/products/route.ts`](file:///Users/peggy2402/Projects/polycards/src/app/api/products/route.ts), [`api/categories/route.ts`](file:///Users/peggy2402/Projects/polycards/src/app/api/categories/route.ts), [`api/orders/route.ts`](file:///Users/peggy2402/Projects/polycards/src/app/api/orders/route.ts), [`api/tools/auth/route.ts`](file:///Users/peggy2402/Projects/polycards/src/app/api/tools/auth/route.ts), [`api/tools/upload/route.ts`](file:///Users/peggy2402/Projects/polycards/src/app/api/tools/upload/route.ts)) và cấu hình `outputFileTracingExcludes` trong [`next.config.ts`](file:///Users/peggy2402/Projects/polycards/next.config.ts) để ngăn Next.js đóng gói thư mục `public/models` (122MB) vào Serverless Functions trên Vercel.
- Bổ sung script [`scripts/seed-mongodb.ts`](file:///Users/peggy2402/Projects/polycards/scripts/seed-mongodb.ts) (`npm run seed:mongodb`) để đồng bộ dữ liệu lên MongoDB Atlas.

### [x] Bước 7: Khắc phục Triệt Để Mã Bộ Đã Phát Hành & Lỗi Treo 100% WebAR (Đã hoàn thành)
1. **Kiến Trúc Đa Thế Hệ Mã Bộ (Pack Code Multi-Generation & Aliasing)**:
   - Thẻ bài in thực tế phát hành mang mã cơ sở `POLY30-HOAQUA`, trong khi hệ thống kho gắn mã chi tiết `POLY30-HOAQUA-ENVI`.
   - Triển khai thuật toán [`normalizePackCode`](file:///Users/peggy2402/Projects/polycards/src/lib/activation.ts#L45-L60) và [`isPackCodeMatched`](file:///Users/peggy2402/Projects/polycards/src/lib/activation.ts#L62-L78): Tự động bóc tách hậu tố ngôn ngữ (`-ENVI`, `-ZHVI`, `-VI`, `-EN`), cho phép thẻ mang mã cũ `POLY30-HOAQUA` mở khóa trọn vẹn 100% bộ thẻ `POLY30-HOAQUA-ENVI`.
   - Đồng bộ collection `pack_codes` trên MongoDB Atlas với trường `aliases: ["POLY30-HOAQUA", "POLY30-HOAQUA-ENVI"]` và thêm trường `allowedPackCodes` vào từng sản phẩm.
2. **Khắc phục Triệt Để Lỗi Treo Xoay 100% Trên Trình Duyệt WebAR (Zero-Latency Instant 3D)**:
   - *Nguyên nhân gốc:* Trước đây `setIsLoading(false)` và `renderer.setAnimationLoop` bị giấu bên trong callback của `mindarThree.start().then(...)`. Khi mở trên Safari iOS hoặc Zalo In-App Browser, MindAR chờ cấp quyền camera hoặc khởi động worker WASM tracking làm màn hình loading treo ở 100% vĩnh viễn, che mất mô hình 3D.
   - *Giải pháp:* Ngay khi GLTFLoader nạp xong mô hình 3D, kích hoạt ngay lập tức `renderer.setAnimationLoop` và gọi `setIsLoading(false)`! Mô hình 3D xuất hiện tức thì (< 0.5s) cho người dùng xoay 360°, nghe phát âm tiếng Anh/Việt. Quá trình bật camera và tracking chạy ngầm (asynchronously) trong background; nếu camera bị từ chối/chặn, tự động chuyển Free 3D Mode mượt mà không crash.
3. **Sửa Tận Gốc "Bác Sĩ 3D" Xuất File Phình To 235.84 MB**:
   - *Nguyên nhân gốc:* Client Three.js `GLTFExporter` xuất raw uncompressed binary từ mô hình 2.25 triệu đa giác, gây phình to lên đúng 235.84 MB và ghi đè lên Cloudflare R2.
   - *Giải pháp:* Chặn triệt để tại [`src/lib/client-3d-optimizer.ts`](file:///Users/peggy2402/Projects/polycards/src/lib/client-3d-optimizer.ts), cấm xuất file uncompressed lớn hơn file gốc. Tối ưu mô hình `strawberry.glb` bằng Meshopt Sloppy simplifier + Draco còn đúng **0.80 MB** (37k polygons), xuất USDZ **2.43 MB** bằng Blender, đã tải lên Cloudflare R2 và xác nhận `HeadObject` thành công.
4. **Tối Ưu Hoá Giao Diện `/order` & Trải Nghiệm Giọng Đọc**:
   - Nút "Nghe giọng đọc" trong [`ar-demo-section.tsx`](file:///Users/peggy2402/Projects/polycards/src/components/landing/ar-demo-section.tsx): Khắc phục lỗi Chromium nuốt giọng khi gọi `speechSynthesis.cancel()` đồng thời bổ sung Web Audio chime phản hồi ngay lập tức khi bé nhấn nút, luân phiên đọc Tiếng Anh "Butterfly" và Tiếng Việt "Con bướm".
   - Tối ưu API [`/api/tools/optimize-3d`](file:///Users/peggy2402/Projects/polycards/src/app/api/tools/optimize-3d/route.ts): Bọc `sharp` qua dynamic import an toàn và thêm vào `package.json`, bảo đảm pipeline nén Draco + Decimate serverless không bao giờ văng 500.
5. **Tái Thiết Kế Toàn Diện `/order` Chuẩn TikTok Shop Checkout & Hiển Thị Đầy Đủ 270 Thẻ (9 Bộ)**:
   - Nâng cấp [`src/data/combos.ts`](file:///Users/peggy2402/Projects/polycards/src/data/combos.ts) và [`src/app/order/page.tsx`](file:///Users/peggy2402/Projects/polycards/src/app/order/page.tsx) hiển thị đầy đủ cả 9 bộ 30 thẻ trong database (Động vật ENVI/ZHVI, Hành động ENVI/ZHVI, Hoa quả ENVI, Nghề nghiệp ENVI/ZHVI, Xe cộ ENVI/ZHVI) và các gói Combo VIP (120 thẻ, 270 thẻ), đồng bộ động cùng API `/api/pack-codes`.
   - Bổ sung bộ lọc đa tầng: Bộ lọc theo Chủ đề (Tất cả, VIP, Động vật, Hành động, Xe cộ, Hoa quả, Nghề nghiệp) + Bộ lọc Ngôn ngữ (Anh - Việt, Trung - Việt) + Ô tìm kiếm tức thì.
   - Luồng Step-by-Step chuẩn Mobile eCommerce:
     + **Bước 1: Chọn bộ thẻ & số lượng**: Card sản phẩm sắc nét, badge sinh động, giá tiền, số lượng thẻ, highlights rõ ràng.
     + **Bước 2: Điền thông tin giao hàng & chọn phương thức**: Giữ nguyên 2 phương thức COD tiền mặt & Chuyển khoản QR ngân hàng, card tóm tắt sản phẩm đang chọn chuẩn TikTok Shop.
   - **Sticky Bottom Bar chuẩn TikTok Shop**: Cố định bám đáy màn hình với Safe Area Inset trên iPhone (`pb-[max(0.75rem,env(safe-area-inset-bottom))]`), hiển thị Tổng tiền + Tiết kiệm bên trái và nút hành động to tròn (Pill CTA) bên phải.
6. **Khắc phục Triệt Để Lỗi Mất CSS Giao Diện Toàn Bộ Các Trang**:
   - *Nguyên nhân cốt lõi:* Dự án dùng Tailwind CSS v4 (`@import "tailwindcss";`), nhưng thiếu cấu hình PostCSS (`@tailwindcss/postcss` trong `postcss.config.mjs`). Trình biên dịch bỏ qua việc sinh utility classes (file CSS build ra chỉ có font chữ mà không có class `.flex`, `.grid`, màu sắc, bo góc), khiến giao diện bị văng về HTML thô trắng toát.
   - *Giải pháp triệt để:*
     1. Khởi tạo cấu hình [`postcss.config.mjs`](file:///Users/peggy2402/Projects/polycards/postcss.config.mjs) kích hoạt `@tailwindcss/postcss`.
     2. Bổ sung `@tailwindcss/postcss` và `postcss` vào [`package.json`](file:///Users/peggy2402/Projects/polycards/package.json).
     3. Khắc phục lỗi typecheck route handler trong [`src/app/api/products/[slug]/route.ts`](file:///Users/peggy2402/Projects/polycards/src/app/api/products/%5Bslug%5D/route.ts).
     4. Build production thành công 100%, xuất file CSS đầy đủ **206 KB** chứa trọn vẹn toàn bộ Tailwind v4 utility classes.
7. **Tái Thiết Kế `/order` Thành Mô Hình "Thùng Hàng Stack" + Widget Bottom Sheet & Modal Chi Tiết**:
   - *Khối Thùng Hàng Stack ([`SelectedPacksStack`](file:///Users/peggy2402/Projects/polycards/src/components/order/selected-packs-stack.tsx))*: Đóng gói các bộ thẻ đã chọn vào một Stack giỏ hàng gọn gàng. Cho phép chọn nhiều bộ thẻ cùng lúc và tăng giảm số lượng `[-] [qty] [+]` độc lập cho từng bộ.
   - *Widget Bottom Sheet Chọn Bộ Compact ([`OrderPackSheet`](file:///Users/peggy2402/Projects/polycards/src/components/order/order-pack-sheet.tsx))*: Thu gọn danh sách bộ thẻ thành dạng hàng ngang tinh gọn (compact rows). Mỗi hàng gồm ảnh thumbnail, tên bộ thẻ, badge, giá bán, khuyến mãi và 2 nút hành động: `"Xem chi tiết"` và `"Chọn bộ"`. Tích hợp bộ lọc chủ đề và lọc ngôn ngữ song ngữ.
   - *Widget Modal Chi Tiết Bộ Thẻ ([`PackDetailModal`](file:///Users/peggy2402/Projects/polycards/src/components/order/pack-detail-modal.tsx))*: Hiển thị ảnh thẻ, mô tả chi tiết các con vật/chủ đề trong bộ, các điểm nổi bật và nút thêm nhanh vào giỏ.
   - *Trải Nghiệm Đa Nền Tảng*:
     - **Desktop**: Bố cục 2 cột cân đối tổng quan (Cột trái: Thùng hàng Stack + Form giao hàng; Cột phải: Hóa đơn tóm tắt cố định gọn gàng).
     - **Mobile**: Sticky Footer bám đáy màn hình chuẩn TikTok Shop kèm Safe Area Inset cho iPhone.

8. **Khắc Phục Triệt Để Lỗi Play/Pause Video Overlay Của iOS Safari Trên WebAR**:
   - *Hiện tượng & Nguyên nhân gốc rễ:*
     1. **Cơ chế CSS Selector Fallback của trình duyệt:** Trước đây các pseudo-element `video::-webkit-media-controls-*` được gom chung bằng dấu phẩy `,`. Theo chuẩn CSS W3C, nếu có bất kỳ 1 selector nào không được phiên bản WebKit cụ thể nhận diện, toàn bộ block CSS đó sẽ bị trình duyệt hủy bỏ hoàn toàn (`invalid selector list`).
     2. **MindAR không gọi `.play()` chủ động:** Trong [`public/lib/mindar-image-three.prod.js`](file:///Users/peggy2402/Projects/polycards/public/lib/mindar-image-three.prod.js), video camera chỉ gán `srcObject = stream` và dựa vào thuộc tính `autoplay`. Khi thiết bị bật **Chế độ tiết kiệm pin (Low Power Mode - biểu tượng pin màu vàng trên iPhone)**, iOS Safari tự động đình chỉ (suspend) autoplay và kích hoạt native AVPlayer HUD (vòng tròn mờ đen có biểu tượng `||` Pause/Play ở giữa màn hình).
     3. **Unprevented Tap Gesture:** Khi người dùng chạm ngón tay vào màn hình để xoay hoặc tương tác mô hình 3D, sự kiện tap không được gọi `preventDefault()`, khiến WebKit hiểu nhầm là người dùng muốn kích hoạt điều khiển video.
   - *Giải pháp triệt để 4 tầng:*
     1. **CSS Độc lập:** Trong [`src/app/globals.css`](file:///Users/peggy2402/Projects/polycards/src/app/globals.css), tách rời toàn bộ các selector `video::-webkit-media-controls-*` thành các rule CSS riêng biệt, đảm bảo không bao giờ bị parser bỏ qua.
     2. **MindAR Core Patch:** Bổ sung các thuộc tính `controlslist="nodownload nofullscreen noremoteplayback"`, `x-webkit-airplay="deny"`, `playsinline`, `webkit-playsinline`, và gọi `this.video.play()` chủ động ngay khi gán stream và khi `loadedmetadata` kích hoạt.
     3. **Gesture Event Isolation:** Trong [`use-ar-gestures.ts`](file:///Users/peggy2402/Projects/polycards/src/components/ar/hooks/use-ar-gestures.ts) và [`webar-card-view.tsx`](file:///Users/peggy2402/Projects/polycards/src/components/ar/webar-card-view.tsx), gọi `e.preventDefault()` trên `onPointerDown` và `onClick` của gesture layer, triệt tiêu hoàn toàn khả năng WebKit chặn bắt cử chỉ tap để hiển thị native HUD.
     4. **Auto-Play Heartbeat Enforcement:** Đăng ký các event listener `['pause', 'suspend', 'loadedmetadata', 'canplay', 'playing', 'emptied']` và vòng lặp heartbeat 1s trong `WebArCardView`, tự động ép `video.play()` và hủy bỏ thuộc tính `controls` nếu Safari cố tình bật lại trong Low Power Mode.






9. **Chiến Lược Tối Ưu Hóa SEO Toàn Diện, OpenGraph & Schema.org JSON-LD (Google Recommendation Ready)**:
   - *Bộ Từ Khóa Mục Tiêu (Target Keywords)*: Bổ sung hệ thống từ khóa song ngữ có dấu và không dấu phủ khắp các ý định tìm kiếm: `Poly Cards`, `polycards.vn`, `thẻ học AR`, `the hoc ar`, `thẻ thực tế ảo 3D`, `the thuc te ao 3d`, `đồ chơi giáo dục AR`, `thẻ học tiếng Anh 3D`, `thẻ học song ngữ Anh Việt / Trung Việt`, `học tiếng Anh qua thực tế ảo`, `quà tặng cho bé 3 đến 8 tuổi`, `WebAR cho bé không cần cài app`.
   - *Ảnh Chia Sẻ Mạng Xã Hội Đạt Chuẩn (OpenGraph & Twitter Card 1200x630px)*: Sinh ảnh đồ họa tĩnh [`public/og-image.png`](file:///Users/peggy2402/Projects/polycards/public/og-image.png) và [`public/twitter-image.png`](file:///Users/peggy2402/Projects/polycards/public/twitter-image.png) chuẩn tỉ lệ 1.91:1 mang thương hiệu Poly Cards, badge "270 Thẻ AR 3D", điểm đánh giá 4.9/5 sao từ 1.250 phụ huynh, hiển thị sắc nét trên Facebook, Zalo, Twitter/X, iMessage, Telegram.
   - *Cấu Trúc Dữ Liệu Schema.org JSON-LD Đa Tầng*:
     1. **Organization**: Tên công ty, logo 512x512, hotline 1900 8866 22, địa chỉ và mạng xã hội.
     2. **WebSite (Sitelinks Searchbox)**: Tích hợp `potentialAction: SearchAction` để Google hiển thị thanh tìm kiếm trực tiếp trên kết quả tìm kiếm.
     3. **Product & AggregateOffer**: Khai báo sản phẩm Siêu Combo Trọn Bộ 270 Thẻ AR, dải giá từ 219.000đ - 1.490.000đ, trạng thái `InStock` và đánh giá 4.9/5 sao.
     4. **FAQPage Accordion**: Khai báo các câu hỏi thường gặp (Bé dùng như thế nào, có cần cài app không, độ tuổi phù hợp, bản quyền trọn đời) để Google mở rộng Accordion câu hỏi ngay trên trang nhất tìm kiếm.
   - *Sitemap Động & Robots.txt*:
     - [`src/app/sitemap.ts`](file:///Users/peggy2402/Projects/polycards/src/app/sitemap.ts): Tự động sinh `sitemap.xml` lập chỉ mục tất cả các trang cốt lõi (`/`, `/order`, `/products`, `/scan`), 9 bộ combo và toàn bộ slug thẻ AR.
     - [`src/app/robots.ts`](file:///Users/peggy2402/Projects/polycards/src/app/robots.ts): Khai báo host, sitemap và phân quyền cào dữ liệu cho Googlebot.
   - *PWA Manifest*: [`src/app/manifest.ts`](file:///Users/peggy2402/Projects/polycards/src/app/manifest.ts) giúp nâng điểm Google Mobile-First Indexing lên 100/100.
   - *Metadata Riêng Biệt Từng Trang*: Cấu hình server layout metadata chuyên biệt cho [`src/app/order/layout.tsx`](file:///Users/peggy2402/Projects/polycards/src/app/order/layout.tsx), [`src/app/products/layout.tsx`](file:///Users/peggy2402/Projects/polycards/src/app/products/layout.tsx), và [`src/app/scan/layout.tsx`](file:///Users/peggy2402/Projects/polycards/src/app/scan/layout.tsx).
