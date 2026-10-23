---
name: clean-architecture
description: >-
  Nguyên tắc kiến trúc phân lớp sạch (Clean Architecture), tách biệt logic backend/data,
  quản lý Custom Hooks và thành phần UI (Atomic Components) cho dự án Poly Cards.
---

# Hướng Dẫn Kiến Trúc & Tách Biệt Tầng Logic (Clean Architecture)

## 1. Tách Biệt 3 Tầng Rõ Ràng
1. **Presentation Layer (`src/components/`, `src/app/`)**:
   - Chỉ chịu trách nhiệm hiển thị giao diện và lắng nghe tương tác người dùng.
   - Không chứa logic nghiệp vụ phức tạp, không đọc trực tiếp file hệ thống hoặc xử lý chuỗi QR tại đây.
2. **Domain & Application Layer (`src/hooks/`, `src/lib/`)**:
   - `src/hooks/`: Quản lý state, hiệu ứng, vòng đời camera, audio.
   - `src/lib/`: Chứa các hàm nghiệp vụ thuần túy (Pure Functions) dễ kiểm thử đơn vị.
3. **Data Layer (`data/animals.json`, `src/config/site.ts`)**:
   - Quản lý cấu hình và dữ liệu sản phẩm tập trung. Mọi thay đổi dữ liệu không làm thay đổi code logic.

## 2. Tiêu Chuẩn Tránh Lặp Code (DRY)
- **Định dạng tiền tệ**: Dùng `formatVndCurrency(price)` từ `src/lib/formatters.ts`.
- **Phát hiện trình duyệt nhúng**: Dùng `useInAppBrowser()` hook.
- **Phát âm thanh**: Dùng `useAudioPlayer(url)` hook.
- **Quản lý camera**: Dùng `useQrScanner()` hook.
- Không viết inline các logic lặp lại như kiểm tra URL, parse hostname hay validate regex.
