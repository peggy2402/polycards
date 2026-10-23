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

### [ ] Bước 2: Xây dựng Landing Page + Grid sản phẩm (Chờ nghiệm thu Bước 1 để làm)
- Xây dựng 9 sections chuẩn mực: Navbar, Hero, Why Choose Us, How It Works, Products Grid, AR Demo Section, Benefits, FAQ, CTA + Footer.
- Sử dụng icon từ `lucide-react`, màu sắc ấm áp, bo tròn mềm mại.

### [ ] Bước 3: Trang kết quả `/ar/[slug]`
- Tích hợp `<model-viewer>` với camera-controls, auto-rotate, poster, AR WebXR & iOS Quick Look.
- Nút phát âm thanh tiếng Anh (bấm để nghe qua Audio API).
- Nút chọn animation (nếu con vật có khai báo).
- Trạng thái fallback khi thiết bị không hỗ trợ AR (vẫn xem được 3D).

### [ ] Bước 4: Màn hình quét QR `/scan`
- Màn hình hướng dẫn chuẩn bị mô hình trước khi xin quyền camera.
- Quét toàn màn hình bằng camera sau (`facingMode: "environment"`).
- Nút bật/tắt đèn pin (nếu thiết bị hỗ trợ).
- Xử lý 2 chế độ: Quét tự do và Quét theo sản phẩm (`?expect=slug`).
- Modal cảnh báo trình duyệt nhúng (Zalo/Facebook/TikTok) + Nút sao chép liên kết.

### [ ] Bước 5: Script tạo mã QR & Hướng dẫn kiểm thử di động
- Script Node sinh QR SVG/PNG vào `qr-output/`.
- Hướng dẫn cấu hình HTTPS nội bộ hoặc tunnel (Cloudflare / ngrok) để test camera trực tiếp trên điện thoại.
