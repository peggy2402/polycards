# PROMPT 3/3 (tùy chọn): Đo hiệu năng rồi thay engine quét và thêm tính năng

Điều kiện: đã làm xong prompt 1 và 2. Chỉ thay engine nếu số đo cho thấy lợi ích rõ ràng (quy tắc quyết định ở dưới).

## Bối cảnh
Dự án Poly Cards (Next.js 16, React 19, TS, Tailwind 4, Vercel). `html5-qrcode@2.3.8` không còn được cập nhật, giải mã QR bằng ZXing JavaScript trên main thread (Safari iOS không có `BarcodeDetector` gốc nên chậm hơn Android Chrome), đóng gói luôn giao diện video riêng khó tùy biến. Mục tiêu: nhận mã nhanh, ổn định ở thiếu sáng/ngang/dọc, giảm lỗi lạ và giảm nợ kỹ thuật.

## Bước 1: Đo trước (bắt buộc)
Thêm chế độ debug `?debug=1` hiển thị: thời gian đến khung hình đầu tiên, thời gian từ lúc mở đến lần giải mã thành công đầu tiên, FPS giải mã, bộ giải mã đang dùng. Chạy kịch bản chuẩn: thẻ in thật, cách 10-15cm, ánh sáng bình thường và thiếu sáng, 20 lần mỗi thiết bị, trên ít nhất một iPhone (Safari) và một Android tầm trung. Ghi bảng kết quả "trước".

## Bước 2: Thử nghiệm engine mới (trong nhánh riêng, đằng sau cờ cấu hình)
Xây `useQrScanner` (hook) + giữ nguyên giao diện `QrCameraScanner({ expectedAnimal, onOpenGuide })` để phần còn lại của app không đổi:
1. Tự quản `getUserMedia` (một luồng duy nhất dùng chung cho hiển thị, giải mã, đèn flash, zoom) vào `<video muted playsInline autoPlay>`; hết phụ thuộc thuộc tính nội bộ và hết khung kép.
2. Giải mã: dùng `BarcodeDetector` gốc nếu `getSupportedFormats()` có `qr_code`; nếu không thì dự phòng WASM. So sánh hai ứng viên và chọn một (nêu lý do):
   - gói ponyfill `barcode-detector` (giao diện giống `BarcodeDetector`, nền ZXing WASM). Lưu ý: mặc định nó tải file `.wasm` từ CDN; phải tự host file này (đặt trong `public/` và cấu hình `locateFile`/`overrides`) để không phụ thuộc CDN và không vướng CSP;
   - `qr-scanner` (nimiq): chỉ QR, chạy trong Web Worker, tự đóng gói, không cần WASM ngoài.
   Tải động (`import()`) chỉ khi cần.
3. Giảm tải: lấy khung bằng `requestVideoFrameCallback` (hoặc `requestAnimationFrame` có throttle ~10-15 lần/giây), cắt vùng giữa (~70% cạnh ngắn), thu về ≤ 640px cạnh dài, tái sử dụng canvas/`OffscreenCanvas`, giải mã trong worker nếu có thể. Không cấp phát trong vòng lặp.
4. Giải mã ảnh từ thư viện bằng CÙNG engine (thu nhỏ trước). Đèn flash/zoom qua `track.getCapabilities()`/`applyConstraints()`.
5. Giữ nguyên toàn bộ hành vi đã sửa ở prompt 2 (hàng đợi vòng đời, cooldown, visibilitychange, xử lý lỗi, xác thực `qr-parser`).
6. Phát hiện "quá tối": lấy mẫu độ sáng trung bình của khung đã thu nhỏ; thấp trong ~3 giây thì gợi ý bật đèn (nếu có) hoặc ra chỗ sáng. Sau 20 giây không quét được: gợi ý khoảng cách 10-15cm, giữ thẳng thẻ, lau camera, hoặc dùng "Chọn ảnh QR".

## Bước 3: Quy tắc quyết định
Chỉ chuyển hẳn sang engine mới khi (a) thời gian đến lần giải mã đầu tiên giảm ≥ 25% hoặc tỉ lệ thành công ở thiếu sáng tăng rõ rệt trên ít nhất một nền tảng, VÀ (b) không có hồi quy trên nền tảng kia, VÀ (c) kích thước bundle của trang `/scan` không tăng quá 150 KB gzip (không tính file WASM tải lười). Nếu không đạt thì giữ `html5-qrcode`, xóa nhánh thử nghiệm và ghi kết luận vào báo cáo. Khi chuyển thì gỡ `html5-qrcode` khỏi `package.json` và dọn CSS ghi đè liên quan.

## Bước 4: Tính năng bổ sung (làm dù engine nào)
1. **Nhập mã thủ công:** QR hiện đã có tham số `code` (mã gói, collection `pack_codes`). Tìm API xác minh mã gói sẵn có trong dự án và dùng lại; nếu CHƯA có thì thiết kế `POST /api/scan/resolve` nhận `{ code }`, giới hạn tốc độ theo IP, chỉ trả `{ slug }` hoặc lỗi chung (không lộ mã nào tồn tại). Giao diện: ô nhập trong bảng "⋯" cùng đường xác thực như quét QR. Nếu mô hình dữ liệu không cho phép tra mã → bỏ qua mục này và báo lại.
2. **Zoom thanh trượt** thay cho nút 1x/2x ở thiết bị hỗ trợ.
3. **Nhớ lựa chọn camera** (`localStorage`, đọc trong `useEffect` để tránh hydration mismatch).
4. **Analytics không dữ liệu cá nhân** (chỉ nếu dự án đã có analytics): `scan_start`, `permission_denied`, `scan_success` (kèm thời gian đến lần giải mã), `scan_invalid`. Không ghi nội dung QR.
5. Trợ năng: vùng `aria-live="polite"` đọc trạng thái, nhãn `aria-label` cho nút, điều hướng được bằng bàn phím trên desktop, tôn trọng `prefers-reduced-motion`.

## Nghiệm thu
1. Bảng số đo trước/sau trên iPhone và Android (thời gian đến lần giải mã đầu, tỉ lệ thành công 20 lần, thiếu sáng).
2. Mọi nghiệm thu của prompt 2 vẫn đạt.
3. Camera tắt hẳn khi rời trang; không rò rỉ listener/worker (kiểm tra bằng devtools sau 10 lần vào/ra `/scan`).
4. `/scan` chạy offline được phần giao diện; file WASM (nếu dùng) được tự host.
5. `npx tsc --noEmit`, `next build`, ESLint sạch.

## Báo cáo sau khi làm
Bảng số đo, engine được chọn và lý do (hoặc quyết định giữ nguyên), dung lượng bundle trước/sau, tính năng bổ sung đã làm/bỏ.
