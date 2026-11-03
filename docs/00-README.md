# Poly Cards: prompt nâng cấp module /scan

Đưa từng file cho AI theo thứ tự. Mỗi file tự chứa đủ bối cảnh.

| Thứ tự | File | Nội dung |
|---|---|---|
| 1 | `01-scan-stabilize.md` | Lỗi nền của trang: hydration #418, camera bị xin trước khi biết đang ở trình duyệt nhúng, modal hướng dẫn sai khung, `?expect=` hỏng sau khi bỏ mockdata, ảnh 404 |
| 2 | `02-scan-core-fixes.md` | Sửa lõi `qr-camera-scanner.tsx` tại chỗ (11 vấn đề cụ thể đã tìm thấy trong code) |
| 3 | `03-scan-engine-upgrade.md` | Tùy chọn: đo hiệu năng, thử thay engine `html5-qrcode`, thêm nhập mã tay và vài tính năng |

## Những gì đã đọc
`scan/page.tsx`, `qr-camera-scanner.tsx` (đủ 555 dòng; hai bản bạn gửi giống hệt nhau), `scan-guide-modal.tsx`, `in-app-browser-modal.tsx`, `user-agent.ts`, `/ar/[slug]/page.tsx`, `package.json`, `subject-focus-image.tsx`, log trình duyệt.

## Còn thiếu (AI sẽ tự đọc, nhưng gửi thêm thì prompt chính xác hơn)
1. `src/lib/qr-parser.ts` (kiểm tra bảo mật mã QR nằm ở đây)
2. `scripts/generate-qr.ts` (mã QR trên thẻ thật mã hóa chuỗi gì)
3. `src/app/ar/[slug]/ar-viewer-container.tsx` (tham số `code` được dùng ra sao)
4. `src/lib/products-store.ts` (hàm `resolveValidProductImage`)
5. `src/app/layout.tsx` (nghi vấn nguồn lỗi hydration #418)

## Ghi chú nhanh
- Cảnh báo `contentscript.js`, `MaxListenersExceededWarning`, `ObjectMultiplex` trong log là của tiện ích mở rộng trình duyệt, bỏ qua.
- Stack hiện tại: Next 16.4.3, React 19.3, `html5-qrcode` 2.3.8 và không có thư viện quét khác.
- Trang `/ar/[slug]` có `export const dynamic = "force-dynamic"` cùng với `generateStaticParams`: hai cái này mâu thuẫn nhau (cái sau bị bỏ qua). Không thuộc phạm vi /scan nhưng nên dọn khi có dịp.
