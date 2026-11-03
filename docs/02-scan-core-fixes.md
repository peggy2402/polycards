# PROMPT 2/3: Sửa lõi `qr-camera-scanner.tsx` (giữ nguyên html5-qrcode, sửa lỗi tại chỗ)

Điều kiện: đã làm prompt 1. Làm xong prompt này rồi mới cân nhắc prompt 3 (đổi engine).

## Bối cảnh và ràng buộc chung
Dự án Poly Cards (Next.js 16 App Router, React 19, TypeScript, Tailwind 4, MongoDB Atlas, Cloudflare R2, Vercel). Người dùng là phụ huynh và trẻ 3-8 tuổi, chủ yếu iPhone Safari/Chrome iOS và Android Chrome, thường cầm một tay, có khi thiếu sáng. Thư viện quét hiện tại: `html5-qrcode@^2.3.8` (không còn được cập nhật). Không thêm thư viện mới trong prompt này.
Ràng buộc: không gửi hình khung camera lên server; luôn dừng camera khi rời trang/tab ẩn; không phá hợp đồng: quét hợp lệ → `router.push("/ar/{slug}?ar=1[&code=...]")`; giữ props `QrCameraScanner({ expectedAnimal, onOpenGuide })`.

## Bước 0: Đọc trước khi sửa
`src/components/scanner/qr-camera-scanner.tsx` (555 dòng), `src/lib/qr-parser.ts` (`parseAndValidateQr`, `QrParseResult`), `scripts/generate-qr.ts` (xem mã QR trên thẻ thật mã hóa chuỗi gì), `src/app/ar/[slug]/page.tsx` và `ar-viewer-container` (xem tham số `code` được dùng ra sao), `node_modules/html5-qrcode` (đọc `.d.ts` và nguồn để xác minh các điều nghi vấn bên dưới). Báo lại: định dạng QR thực tế, `code` dùng để làm gì, và kết quả xác minh từng điểm nghi vấn.

## Các vấn đề đã xác định từ code (kèm dòng gần đúng)

### 1. Vòng đời camera dễ đua nhau (race) và khởi động hai lần
- Effect khởi động (dòng ~154-247) tạo `new Html5Qrcode("qr-reader-container")` MỖI lần `cameraFacingMode` đổi, trên CÙNG một container; cleanup gọi `safeStopScanner` bất đồng bộ nhưng không được chờ, trong khi instance mới đã `start()`. `handleSwitchCamera` (dòng ~250) lại dừng thêm một lần nữa. Dễ gặp "camera đang bận", hai thẻ `<video>`, hoặc màn hình đen, nhất là với React 19 Strict Mode ở dev.
- Sửa: dùng MỘT instance cho vòng đời component; mọi thao tác `start/stop/clear` đi qua một hàng đợi tuần tự (mutex bằng promise chain); đổi camera = `await stop()` rồi `start()` với `facingMode` mới trên cùng instance; có `startToken` để bỏ kết quả của lần start đã bị hủy; chỉ `clear()` khi unmount. Strict Mode (mount, unmount, mount) không được để lại camera mở.

### 2. Dùng thuộc tính nội bộ `localMediaStream`
- Dòng ~110, ~195, ~260, ~277 đọc `(scanner as any).localMediaStream`. Đây là thuộc tính nội bộ, có thể không tồn tại ở bản 2.3.8, khi đó nút đèn flash/zoom không bao giờ hiện và việc "dừng track" khi thành công không làm gì.
- Xác minh bằng cách log. Thay bằng API công khai: `getRunningTrackCapabilities()`, `getRunningTrackSettings()`, `applyVideoConstraints()`; dự phòng đọc `video.srcObject` của thẻ `<video>` bên trong container. Reset `torchOn`, `zoomAvailable`, `currentZoom` ở mỗi lần (re)start (hiện `torchOn` vẫn là `true` sau khi đổi camera).

### 3. "Tải ảnh QR" có thể luôn thất bại khi camera đang chạy
- Dòng ~298 gọi `scannerRef.current.scanFile(file, true)` trên chính instance đang quét. Theo thiết kế của html5-qrcode, `scanFile` bị từ chối khi đang `SCANNING`/`PAUSED`; lỗi lại bị `catch` nuốt và hiển thị "Không tìm thấy mã QR hợp lệ". Hãy xác minh trong nguồn thư viện.
- Sửa: giải mã ảnh bằng một instance riêng gắn vào phần tử ẩn (`<div id="qr-file-decoder" hidden>`), gọi `scanFile(file, false)` (không vẽ ảnh vào UI), tái sử dụng instance đó. Thu nhỏ ảnh quá lớn về cạnh dài ≤ 1600px trước khi giải mã (canvas tái sử dụng). Phân biệt thông báo: "ảnh không đọc được" và "không thấy mã QR trong ảnh". Sau khi xong, KHÔNG làm gián đoạn camera đang chạy.

### 4. Phân loại lỗi camera sai
- Dòng ~222-238 dựa vào `err.name` và `err.message`. `html5-qrcode.start()` thường reject bằng chuỗi hoặc Error bọc, nên `err.name` là `undefined` và lỗi quyền camera rơi vào thông báo chung.
- Viết `normalizeCameraError(err: unknown)` xử lý `DOMException | Error | string`, dò chuỗi (không phân biệt hoa thường) và trả mã: `permission-denied | not-found | in-use | insecure-context | unsupported | overconstrained | unknown`. Mỗi mã có màn hình riêng (tiếng Việt thân thiện cho phụ huynh), hướng dẫn bật lại quyền theo nền tảng (dùng `getMobileOperatingSystem()`: iOS Safari → Cài đặt trang Camera; Chrome Android → biểu tượng ổ khóa → Quyền), và LỐI THOÁT: "Chọn ảnh QR" + (nếu có ở prompt 3) "Nhập mã".
- Nút "Thử Cấp Quyền Lại" đang `window.location.reload()` (dòng ~434): thay bằng khởi động lại camera trong component (không tải lại trang), trừ khi mã lỗi cần tải lại.

### 5. Quét lặp, nhiều timer chồng nhau, kẹt trạng thái
- `handleQrDecoded` được gọi tới ~15 lần/giây với cùng một mã: nhánh cảnh báo (dòng ~128-142) tạo thêm `setTimeout` mỗi lần và rung liên tục; không có cooldown.
- `isNavigatingRef` được đặt `true` khi thành công nhưng không bao giờ về `false`; nếu `router.push` không chuyển (mạng, lỗi) hoặc người dùng bấm Back và trang được khôi phục từ bfcache, màn hình kẹt ở "ĐÃ KHÓA MỤC TIÊU" với camera đã tắt.
- Sửa: bỏ qua cùng một nội dung trong 2 giây; một timer cảnh báo duy nhất (`useRef`, hủy khi có cảnh báo mới và khi unmount); chỉ rung một lần mỗi sự kiện. Khi thành công đặt watchdog 4 giây: nếu vẫn còn ở trang thì khôi phục trạng thái và khởi động lại camera. Lắng nghe `pageshow` (`event.persisted`) để reset và khởi động lại.

### 6. Chưa xử lý tab ẩn/khóa màn hình
- Không có `visibilitychange` / `pagehide`. Trên iOS camera bị hệ thống dừng khi ẩn, quay lại là khung hình đen đóng băng.
- Thêm: khi `hidden` hoặc `pagehide` thì dừng camera; khi `visible` (và không đang điều hướng) thì khởi động lại qua hàng đợi ở mục 1.

### 7. Âm thanh `playBeepSuccess`
- Dòng ~32 tạo `new AudioContext()` mỗi lần và không đóng (Safari giới hạn số context), và vì không nằm trong cử chỉ người dùng nên iOS thường không phát tiếng.
- Dùng MỘT AudioContext dùng chung, tạo lười, `resume()` trước khi phát, và "mở khóa" bằng một listener `pointerdown` chạy một lần (bất kỳ chạm nào lên trang, ví dụ nút trong header). Đóng khi unmount. Ghi chú trong code: `navigator.vibrate` KHÔNG có trên iOS Safari, nên cần phản hồi thị giác (khung chuyển xanh, nháy nhẹ) đủ rõ thay cho rung.

### 8. Khung ngắm và vùng quét lệch nhau, camera bị ép khung vuông
- `aspectRatio: 1.0` (dòng ~180) yêu cầu luồng camera vuông: giảm góc nhìn và độ phân giải hữu dụng; `qrbox` (220-340px) lại KHÔNG khớp với khung vẽ tay `w-64 max-w-[70vw]` (256px), nên người dùng đặt mã vừa khung nhưng vùng giải mã khác. Thư viện còn tự vẽ vùng tối và góc riêng (`#qr-shaded-region`) khi có `qrbox`, có thể chồng lên khung tự vẽ.
- Sửa: bỏ `aspectRatio`; dùng `videoConstraints`: `facingMode` + `width: { ideal: 1280 }`, `height: { ideal: 720 }`; tính MỘT kích thước khung (vd. 70% cạnh ngắn, tối đa 320px) làm nguồn duy nhất cho cả `qrbox` lẫn khung vẽ (dùng `ResizeObserver` hoặc `orientationchange`); ẩn phần tự vẽ của thư viện bằng CSS có phạm vi (`#qr-reader-container #qr-shaded-region { display: none !important }`) hoặc bỏ `qrbox` và tự cắt; ép `<video>` phủ đầy (`object-fit: cover`, `width/height: 100%`). Kiểm tra bằng mắt rằng chỉ còn MỘT khung và vùng giải mã khớp khung.

### 9. Giao diện chật ở màn 360px
- Header có "Trang Chủ", nhãn giữa và tới 5 nút (zoom, đổi camera, flash, tải ảnh, hướng dẫn) trên một hàng: tràn ở máy nhỏ. Đáy có nút "Tải Ảnh Mã QR" TRÙNG với nút trên header và dòng quảng bá "Poly Cards WebXR • Hỗ trợ ... Quick Look" chiếm chỗ.
- Sửa: tối đa 3 nút hiện trực tiếp ở header (đổi camera, flash nếu có, "⋯"); "⋯" mở bảng nhỏ chứa zoom, tải ảnh, hướng dẫn. Bỏ dòng quảng bá ở đáy; chỉ giữ MỘT nút "Tải ảnh QR" (đáy). "Trang Chủ" thu thành icon khi < 380px; nhãn giữa ẩn khi hẹp. Mục tiêu chạm ≥ 44px, tôn trọng `env(safe-area-inset-*)`, chạy tốt khi xoay ngang.

### 10. Hiển thị sau khi nhận mã
- Lớp phủ thành công đang in `detectedSlug` viết hoa thô. Dùng `parseResult.animalNameEn`/`animalNameVi` (nếu có), kèm thanh tiến trình ngắn.
- Mismatch với `expectedAnimal` (dòng ~125-137) đang chặn cứng và tự tắt sau 3 giây. Giữ hành vi này mặc định, nhưng thêm prop tùy chọn `allowMismatchContinue` (mặc định `false`); khi `true`, hiện hai nút "Xem thẻ này" / "Quét lại".

### 11. Xác thực mã QR (đọc kỹ `qr-parser.ts`)
- Đảm bảo `parseAndValidateQr` chỉ chấp nhận host cho phép (`polycards.vn`, `www.polycards.vn`, domain preview của dự án, `localhost` khi dev), đường dẫn `/ar/{slug}`, `slug` khớp `^[a-z0-9-]{1,64}$`, và `code` được làm sạch (độ dài, ký tự cho phép) rồi `encodeURIComponent` khi ghép URL. Từ chối `javascript:`, `data:`, URL không có giao thức, host giống tên miền thật (vd. `polycards.vn.evil.com`, `polycards.vn@evil.com`).
- Trước `router.push`, kiểm tra `slug` tồn tại bằng `GET /api/products/[slug]` (hoặc API sẵn có) với timeout ~4 giây và `AbortController`: không tồn tại → "Mã này chưa có trong Poly Cards" + nút quét lại; lỗi mạng → thông báo + thử lại. (`/ar/[slug]` hiện trả `notFound()` nếu không có trong DB, nên tránh để người dùng rơi vào trang 404 sau khi quét.)
- Viết test bảng (Vitest/Jest nếu dự án có, nếu chưa thì script `tsx`) cho `parseAndValidateQr`: URL hợp lệ có/không `www`, có/không dấu `/` cuối, chữ hoa/thường, thêm tham số lạ, chỉ slug (nếu định dạng QR cho phép), và toàn bộ ca tấn công nêu trên.

## Nghiệm thu (iPhone Safari, Chrome iOS, Android Chrome; thẻ thật và QR in thử)
1. Mở `/scan`, đổi camera 20 lần liên tiếp (kể cả bấm nhanh): luôn đúng một video, không màn hình đen, không lỗi "camera đang bận". Strict Mode (dev) không để camera mở thừa.
2. "Tải ảnh QR" hoạt động KHI camera đang chạy, và camera không bị gián đoạn.
3. Từ chối quyền camera, camera bị app khác chiếm, mất camera: mỗi trường hợp có màn hình và lối thoát đúng; thông báo đúng cả khi thư viện reject bằng chuỗi.
4. Quét một mã hợp lệ: chuyển đúng trang; Back lại thì quét lại được bình thường (không kẹt). Quét QR lạ hoặc slug không tồn tại: KHÔNG chuyển trang và báo đúng; không rung/timer lặp.
5. Khóa màn hình hoặc đổi tab rồi quay lại: camera tắt hẳn khi ẩn (đèn camera iPhone tắt) và tự mở lại khi hiện.
6. Chỉ còn MỘT khung ngắm; mã đặt trong khung giải mã được; video phủ đầy cả dọc lẫn ngang.
7. Màn hình 360px: không tràn, chỉ một nút tải ảnh, nút ≥ 44px.
8. Âm báo phát được trên Android và (sau cử chỉ chạm đầu tiên) trên iPhone; có phản hồi thị giác rõ ràng khi không rung được.
9. `npx tsc --noEmit`, `next build`, ESLint sạch; test của `qr-parser` xanh.

## Báo cáo sau khi làm
Kết quả xác minh từng điểm nghi vấn (1-4, 8), file đã sửa, định dạng QR thực tế, những điểm chưa kiểm chứng được trên máy thật.
