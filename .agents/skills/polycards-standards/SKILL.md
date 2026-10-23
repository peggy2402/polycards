---
name: polycards-standards
description: >-
  Bộ tiêu chuẩn kỹ thuật & thiết kế bắt buộc cho dự án Poly Cards:
  1. Responsive UI hoàn hảo trên mọi thiết bị (mobile-first 360px đến desktop).
  2. Tuyệt đối không dùng ký tự emoji, chỉ dùng icon SVG chuẩn từ thư viện lucide-react.
  3. Logic backend và xử lý dữ liệu rõ ràng, tách biệt tầng (Data layer, Helper, Service).
  4. Phân chia cấu trúc project chuẩn mực, mạch lạc, dễ mở rộng.
  5. Nguyên tắc DRY (Don't Repeat Yourself), tách biệt widgets/components/layout/hooks.
---

# Tiêu Chuẩn Kỹ Thuật Dự Án Poly Cards

Tài liệu này định nghĩa 5 quy tắc cốt lõi bắt buộc tuân thủ trong toàn bộ quá trình phát triển dự án **Poly Cards**.

---

## 1. Responsive UI Trên Mọi Thiết Bị (Mobile-First)

- **Mục tiêu thiết bị**: Tối ưu từ iPhone cỡ nhỏ (SE, 12 mini - từ 360px), điện thoại Android phổ thông (390px - 412px), máy tính bảng (iPad 768px, 1024px) đến màn hình Desktop lớn.
- **Quy chuẩn hiển thị**:
  - Không để xảy ra tràn khung ngang (`overflow-x: hidden` toàn cục, flex/grid wrap thích ứng).
  - Vùng chạm (Touch Target) cho nút bấm, icon điều hướng tối thiểu **44x44px** để người lớn và trẻ nhỏ dễ tương tác trên màn hình cảm ứng.
  - Phông chữ co giãn linh hoạt (`text-base md:text-lg lg:text-xl`), độ tương phản cao, dễ đọc dưới ánh sáng ngoài trời.
  - Màn hình quét Camera (`/scan`) và màn hình kết quả AR (`/ar/[slug]`) phải chiếm trọn viewport chiều dọc (`100dvh` hoặc `100vh`), không bị che bởi navbar hay thanh địa chỉ của trình duyệt di động.

---

## 2. Tuyệt Đối Không Dùng Icon Emoji

- **Cấm hoàn toàn**: Không sử dụng emoji Unicode trực tiếp trong mã nguồn JSX/HTML/SVG (ví dụ: cấm dùng 🦌, 🐱, 🐶, 🔊, ✓, ❌, ⭐, 🚀,...).
- **Quy chuẩn thay thế**: Luôn sử dụng icon vector SVG chuyên nghiệp từ thư viện `lucide-react`:
  - Âm thanh: `<Volume2 />`, `<VolumeX />`
  - Camera & QR: `<Camera />`, `<QrCode />`, `<Flashlight />`, `<FlashlightOff />`
  - Trạng thái & cảnh báo: `<CheckCircle2 />`, `<AlertCircle />`, `<XCircle />`, `<Info />`
  - Điều hướng & tương tác: `<ArrowLeft />`, `<ChevronRight />`, `<Sparkles />`, `<ExternalLink />`
- **Mục đích**: Giữ trọn vẹn phong cách **Premium + Educational + Playful** của một thương hiệu đồ chơi giáo dục đẳng cấp quốc tế, tránh cảm giác nhái nghiệp dư hay cẩu thả.

---

## 3. Logic Backend & Xử Lý Dữ Liệu Rõ Ràng

- **Kiến trúc phân tầng rõ ràng**:
  - `data/animals.json`: Nguồn sự thật duy nhất (Single Source of Truth) cho dữ liệu đồ chơi.
  - `src/lib/animals.ts`: Tầng Data Access Layer cung cấp các hàm helper đọc, lọc, tìm kiếm dữ liệu có type-safe.
  - `src/lib/qr-parser.ts`: Tầng Domain Service xử lý giải mã, xác minh tính hợp lệ và chặn URL độc hại/ngoài hệ thống.
  - `src/lib/user-agent.ts`: Tầng Infrastructure Service phát hiện thiết bị và trình duyệt nhúng (In-App Browser).
- **Nguyên tắc kỹ thuật**:
  - Xử lý triệt để các trường hợp ngoại lệ: URL không hợp lệ, sản phẩm không tồn tại, lỗi truy cập camera, lỗi tải model 3D.
  - Đảm bảo 100% strict TypeScript types, không dùng kiểu `any`.

---

## 4. Phân Chia Bố Cục Project Cụ Thể Rõ Ràng

Dự án được tổ chức chặt chẽ theo cấu trúc sau:

```text
src/
├── app/                  # Next.js App Router (Routing, Layouts, Metadata)
│   ├── page.tsx          # Landing page chính
│   ├── scan/page.tsx     # Route quét QR full màn hình
│   └── ar/[slug]/        # Route chi tiết 3D & AR theo từng con vật
├── components/           # Tách biệt theo vai trò & phạm vi
│   ├── common/           # UI dùng chung toàn ứng dụng (Navbar, Footer, Modal, Button)
│   ├── landing/          # Các Section riêng biệt của Landing Page
│   ├── ar/               # Các Widget chuyên trách 3D, Audio, AR Actions
│   └── scanner/          # Các Widget chuyên trách Camera, Khung ngắm, Cấp quyền
├── hooks/                # Custom React Hooks tách biệt logic khỏi UI
├── lib/                  # Business logic, helpers, formatters, services
├── config/               # Cấu hình tĩnh (Site config, navigation, contact)
└── types/                # Type declarations và Interfaces
```

---

## 5. Tách Widgets/Components/Layout & Chống Lặp Hàm (DRY)

- **Nguyên tắc DRY**: Bất kỳ đoạn logic hoặc giao diện nào xuất hiện từ 2 lần trở lên phải được tách thành hàm helper hoặc component tái sử dụng.
- **Tiện ích dùng chung (`src/lib/formatters.ts`)**:
  - Định dạng tiền tệ VND (`formatVndCurrency(price)`).
  - Chuẩn hóa văn bản và link liên hệ.
- **Custom Hooks chuyên dụng (`src/hooks/`)**:
  - `useAudioPlayer`: Quản lý trạng thái phát âm thanh, xử lý chặn autoplay trên iOS.
  - `useQrScanner`: Quản lý vòng đời camera, html5-qrcode, torch toggle, và giải phóng luồng camera khi unmount.
  - `useInAppBrowser`: Kiểm tra xem người dùng có đang mở trong Zalo/Facebook/TikTok hay không.
- **Atomic UI Components (`src/components/common/`)**:
  - Tách các widget nhỏ: `SectionHeading`, `Badge`, `ActionButton`, `EmptyState`, `ErrorCard`.
