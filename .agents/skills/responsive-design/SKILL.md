---
name: responsive-design
description: >-
  Hướng dẫn và tiêu chuẩn kỹ thuật thiết kế Responsive UI đa nền tảng cho Poly Cards:
  Mobile-first (360px+), Safe Area insets trên iPhone, 100dvh viewport, và touch targets.
---

# Hướng Dẫn Thiết Kế Responsive UI Đa Thiết Bị

## 1. Nguyên Tắc Mobile-First
Người dùng phần lớn sẽ quét mã QR trên vỏ hộp đồ chơi bằng điện thoại thông minh. Do đó:
- Luôn viết CSS mặc định cho mobile, sau đó dùng các tiền tố `sm:`, `md:`, `lg:` để mở rộng sang Tablet và Desktop.
- Kiểm tra tính tương thích bắt đầu từ màn hình nhỏ nhất: **360px width** (iPhone SE, Galaxy A series).

## 2. Xử Lý Viewport Di Động
- Sử dụng chiều cao `min-h-screen` hoặc `h-[100dvh]` để tránh tình trạng thanh địa chỉ Safari trên iOS co giãn làm vỡ giao diện.
- Tích hợp `env(safe-area-inset-top)` và `env(safe-area-inset-bottom)` cho các phần tử ghim đáy màn hình hoặc camera viewfinder.

## 3. Quy Định Kích Thước Vùng Chạm (Touch Target)
- Các nút bấm chính (`CTA`, `Listen`, `Quét AR`, `Bật đèn flash`) phải có chiều cao tối thiểu 44px (tối ưu là 48px - 52px).
- Khoảng cách giữa các nút bấm tối thiểu 8px để tránh bấm nhầm.

## 4. Breakpoints Chuẩn
- `< 640px`: 1 cột (full width có padding `px-4`).
- `640px - 1023px` (Tablet): 2 cột cho grid sản phẩm, điều hướng ngang thu gọn.
- `>= 1024px` (Desktop): 3 cột cho grid sản phẩm, container căn giữa tối đa `max-w-7xl`.
