# PROMPT 4: Sửa các lỗi còn lại sau lần triển khai /scan (commit fde5237)

Điều kiện: prompt 1 và 2 đã được triển khai. Prompt này vá những chỗ còn sai hoặc chưa kiểm chứng sau khi rà soát code đã commit.

## Quy tắc làm việc
- KHÔNG push thẳng lên `main`. Làm trên nhánh riêng, mở PR/Preview trên Vercel để kiểm tra trước.
- Mỗi mục nêu rõ "đã xác minh bằng cách nào". Nếu một nghi vấn không tái hiện được thì ghi "không tái hiện" thay vì sửa mò.
- Ràng buộc cũ vẫn giữ: không gửi hình khung camera lên server, dừng camera khi rời trang/tab ẩn, hợp đồng quét hợp lệ → `router.push("/ar/{slug}?ar=1[&code=...]")`.

## Nhóm A: Phải sửa (đã xác nhận bằng cách đọc code)

### A1. Watchdog 4 giây không khôi phục camera
`navigateToAr` (qr-camera-scanner.tsx): khi hết 4 giây vẫn ở trang, code chỉ đặt lại state (`scanStatus="scanning"`, `isNavigatingRef=false`...) nhưng KHÔNG gọi `startCamera()`, trong khi camera đã bị `stopCameraSafe()` từ trước. Kết quả: màn hình quét đen, không quét được. Ngoài ra trang `/ar/[slug]` là `force-dynamic` nên trên mạng di động chậm, 4 giây dễ bị vượt dù điều hướng vẫn đang chạy.
- Sửa: nới watchdog lên ~10 giây, hiển thị trạng thái "Đang tải thẻ..." (kèm nút "Hủy/Quét lại" sau 6 giây); khi watchdog nổ hoặc người dùng bấm "Quét lại" thì GỌI `startCamera()` qua hàng đợi. Nếu điều hướng hoàn tất sau khi camera đã mở lại thì cleanup unmount phải dừng camera (kiểm tra).

### A2. Hai luồng xử lý chạy song song khi API chậm
`handleQrDecoded` ghi `lastScannedContentRef` TRƯỚC khi `await fetch` (timeout 3.5s), nhưng cooldown chỉ 2.5s và `isNavigatingRef` chỉ bật ở `navigateToAr` (sau fetch). Cùng một mã có thể được xử lý lần hai trong lúc fetch chưa xong, dẫn tới hai lần `navigateToAr`/`router.push`.
- Sửa: thêm `isResolvingRef` bật ngay khi bắt đầu xử lý mã hợp lệ, tắt khi cảnh báo/lỗi hoặc điều hướng thất bại; mọi lần giải mã trong lúc `isResolvingRef` hoặc `isNavigatingRef` đều bị bỏ qua. Hủy `fetch` đang chạy khi unmount (`AbortController` lưu trong ref).

### A3. Effect khởi động gọi `stopCameraSafe()` ngoài hàng đợi
```ts
startCamera().then(() => { if (isCancelled) stopCameraSafe(); });
```
Lệnh này chạy ngoài `runSequentially`, nên khi đổi camera nhanh hoặc Strict Mode có thể dừng nhầm luồng của lần start kế tiếp. Cleanup đã xếp hàng một lệnh dừng rồi, nên dòng này thừa.
- Sửa: bỏ nó, hoặc đưa vào `runSequentially`. Thêm test thủ công: bấm đổi camera 10 lần liên tiếp rất nhanh, camera cuối cùng luôn chạy đúng chế độ.

### A4. Tên thẻ trên màn hình thành công là slug viết hoa
Lớp phủ dùng `parseResult.animalNameEn`, được lấy từ kho tĩnh (`getMergedProducts`/`getAnimalBySlug`), nên với thẻ chỉ có trong MongoDB sẽ hiện kiểu `JUMP`. Trong khi đó `fetch('/api/products/{slug}')` đã trả về `nameEn/nameVi` mà không được dùng.
- Sửa: sau khi API trả 200, cập nhật `detectedResult` với `nameEn/nameVi` từ API trước khi hiện lớp phủ. Dùng cùng dữ liệu để `qr-parser` hiển thị tên trong thông báo mismatch (hiện `expectSlug` được dùng thô nếu thẻ không có trong kho tĩnh).

### A5. Kiểm tra bản build thật
Trong log của AI, lệnh `next build` mặc định kết thúc với `Exited with code 1`, sau đó AI chạy lại bằng `--webpack` và báo "biên dịch thành công". `package.json` đang có `"build": "next build"` (Next 16 mặc định dùng Turbopack), nên Vercel sẽ dùng lệnh mặc định.
- Việc cần làm: chạy `npm run build` đúng như Vercel, ghi lại NGUYÊN VĂN lỗi gốc và sửa nó (đáng ngờ: `@tailwindcss/turbopack` trong `devDependencies`, cấu hình `next.config`, font tải từ mạng). Nếu buộc phải dùng webpack thì đặt `"build": "next build --webpack"` và giải thích lý do trong báo cáo. Xác nhận bản triển khai Vercel của commit `fde5237` đã xanh.

### A6. Chưa chứng minh lỗi hydration #418 đã hết
Báo cáo của AI quy lỗi cho `QrCameraScanner`, nhưng trang quét nằm trong `<Suspense>` có `useSearchParams()` nên scanner vốn hầu như chỉ được dựng ở client. AI không mở `layout.tsx`/thành phần dùng chung để kiểm tra.
- Việc cần làm: chạy `next build && next start`, mở `/scan` trên Chrome và Safari (có và không có tiện ích mở rộng), xác nhận Console KHÔNG còn `Minified React error #418`. Nếu còn: dùng `next dev` để lấy thông báo đầy đủ, tìm node lệch (kiểm tra `src/app/layout.tsx`, thanh điều hướng/footer/provider, nơi đọc `window`/`localStorage`/ngày giờ/`Math.random`) và sửa tận gốc. Ghi rõ nguyên nhân thật trong báo cáo.

## Nhóm B: Nên sửa

### B1. Nhận diện trình duyệt nhúng có thể báo nhầm trình duyệt thật (`user-agent.ts`)
Điều kiện `ua.includes("version/4.0") && ua.includes("chrome/")` đồng thời trùng với UA của nhiều trình duyệt Android thật (theo hiểu biết của tôi: MIUI/Xiaomi, UC Browser, Huawei Browser, trình duyệt OPPO/Vivo/HeyTap), nơi camera dùng bình thường. Người dùng trên các máy này sẽ thấy cảnh báo sai.
- Sửa: chỉ dùng dấu hiệu WebView rõ ràng `; wv)`; thêm danh sách loại trừ trước khi kết luận WebView (`miuibrowser`, `ucbrowser`, `huaweibrowser`, `heytapbrowser`, `vivobrowser`, `samsungbrowser`, `edga/`, `opr/`, `firefox/`, `fxios`, `crios`). Viết test bảng với chuỗi UA THẬT (Zalo Android/iOS, Facebook Android/iOS, TikTok, Instagram, Messenger, Line, Chrome Android, Samsung Internet, MIUI Browser, UC Browser, Safari iOS, Chrome iOS) và cho kết quả mong đợi. Nếu không chắc chuỗi nào, thêm vào bảng sau khi lấy mẫu từ thiết bị thật.

### B2. API `/api/products/[slug]` trả quá nhiều và thiếu bảo vệ
- Chỉ cần cho quét và `?expect=`: `{ slug, nameEn, nameVi, posterUrl }`. Hiện trả cả `qrCode`, `modelUrl`, `iosModelUrl`, `audioUrl`, `audios`, danh mục. Thu gọn; nếu nơi khác đang dùng route này cho dữ liệu đầy đủ thì tách route riêng cho quét (ví dụ `/api/scan/lookup`).
- Kiểm tra `slug` bằng `^[a-z0-9-]{1,64}$` ngay đầu hàm (400 nếu sai) trước khi chạm DB.
- Thêm `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` cho 200 và `s-maxage=30` cho 404.
- Gom ba khối trả về lặp thành hàm `toPublicCard(item)`.
- Tên bí danh `butterfly` ↔ `polycards` được xử lý ở API và trang `/ar/[slug]` nhưng không ở `qr-parser` (`expect=polycards` quét ra `butterfly` bị báo lệch mục tiêu). Chuẩn hóa bí danh ở MỘT chỗ dùng chung.

### B3. `preprocessImageForQr` có thể làm hỏng việc nhận mã
Thu nhỏ mọi ảnh > 1600px có thể làm mã QR nhỏ trong ảnh chụp lớn (4000px) co lại dưới ngưỡng nhận diện.
- Sửa: thử giải mã theo thứ tự: ảnh gốc nếu ≤ 2400px, hoặc bản thu về 2048px; thất bại thì thử 1024px, rồi bản gốc. Chặn ở tổng thời gian ~6 giây, báo lỗi phân biệt "ảnh không đọc được" và "không thấy mã QR". Giải phóng `fileDecoderRef` (`clear()`) khi unmount.

### B4. Màn hình lỗi camera gỡ phần tử mà thư viện đang bám vào
Khi `cameraError` có giá trị, nhánh JSX không còn render `#qr-reader-container`, trong khi instance `Html5Qrcode` (đã gắn vào phần tử đó) được dùng lại ở lần thử lại. Dễ lệch hoặc lỗi âm thầm.
- Sửa: luôn render container, phủ màn hình lỗi lên trên (`absolute inset-0`); khi thử lại, nếu instance không còn hợp lệ thì tạo instance mới sau khi `clear()` cái cũ (qua hàng đợi).

### B5. Khung ngắm và vùng giải mã vẫn chưa là một
Khung vẽ cố định `w-64 max-w-[70vw]` (~256px) trong khi `qrbox` được tính 220-340px. Tính một kích thước duy nhất (ví dụ 70% cạnh ngắn, tối đa 320px, `ResizeObserver`) và dùng cho CẢ `qrbox` LẪN khung vẽ. Kiểm tra bằng mắt: mã chạm mép khung thì vẫn/không giải mã được đúng như người dùng kỳ vọng. Xác nhận bằng log `getRunningTrackSettings().facingMode` rằng `facingMode` ở `videoConstraints` thật sự được áp dụng (tránh xung đột với tham số đầu của `start()`).

### B6. `qr-parser.ts` nên chặt hơn ở môi trường production
- Chỉ chấp nhận `*.ngrok-free.app`, `*.trycloudflare.com`, `localhost`, `127.0.0.1` khi `NODE_ENV !== "production"`.
- Thay luật `host.endsWith(".vercel.app") && host.includes("polycards")` bằng danh sách chính xác (biến môi trường `NEXT_PUBLIC_ALLOWED_PREVIEW_HOSTS` hoặc tiền tố chính thức của dự án), vì ai cũng đăng ký được `xxx-polycards-xxx.vercel.app`.
- Hiện tại điều hướng chỉ dùng `slug` và `code` (không dùng host) nên không có open-redirect, hãy GIỮ nguyên điều đó và ghi chú rõ trong code.
- Chuẩn hóa không phân biệt hoa/thường cho tiền tố `http://`/`https://`; từ chối chuỗi bắt đầu bằng `//`; từ chối `..`, `%2e`, `%2f`, ký tự điều khiển trong đường dẫn.
- Mở rộng `scripts/test-qr-parser.ts` (hiện 9 ca): `https://polycards.vn@evil.com/ar/x`, `//evil.com/ar/x`, `HTTPS://POLYCARDS.VN/AR/LION`, `ftp://polycards.vn/ar/x`, `intent://...`, `JaVaScRiPt:alert(1)`, `/ar/../admin`, `/ar/%2e%2e/x`, slug 65 ký tự, `code` chứa dấu cách/`<script>`, `https://polycards.vn/ar/lion?code=` rỗng, và các biến thể có `www`, dấu `/` cuối, tham số lạ. Thêm script `"test:qr": "tsx scripts/test-qr-parser.ts"` vào `package.json`.

## Nhóm C: Hoàn thiện giao diện

- **C1. Modal hướng dẫn (`scan-guide-modal.tsx`):** dùng `next/image` với `posterUrl` từ R2 cần `images.remotePatterns` trong `next.config` cho domain R2; nếu thiếu thì modal sẽ lỗi lúc chạy. Kiểm tra hoặc đổi sang `SubjectFocusImage`/`<img>` có `onError` fallback. Thêm quản lý focus: đưa focus vào hộp thoại khi mở, bẫy Tab bên trong, trả focus về nút mở khi đóng.
- **C2. Mất tính năng "xem nhanh không cần thẻ giấy":** bản trước có danh sách thẻ để xem AR ngay; bản mới đã bỏ. Quyết định cùng chủ dự án: nếu muốn giữ thì thêm mục "Xem thử không cần thẻ" trong bảng "⋯" của scanner, lấy tối đa 8 thẻ từ `/api/products` (ảnh R2, skeleton khi tải).
- **C3. Bảng "⋯":** đóng khi chạm ra ngoài và khi nhấn Esc; đóng khi mở modal hướng dẫn.
- **C4. Trình duyệt nhúng (`in-app-browser-modal.tsx`):** khi sao chép thất bại phải hiển thị thông báo và một ô chỉ-đọc chứa liên kết để người dùng tự chọn-sao chép (hiện chỉ `console.warn`). Với Android: nếu sau ~1.5 giây trang vẫn còn hiển thị (intent không mở được Chrome), hiện gợi ý dùng nút sao chép. Xóa import không dùng (`ShieldAlert`).
- **C5. `page.tsx` của `/scan`:** gom ba màn hình chờ (fallback Suspense, `checking`, `loading` của dynamic import) về MỘT component dùng chung với cùng nội dung để không nháy giữa ba câu chữ khác nhau. Khi `expectSlug` thay đổi hoặc bị bỏ, hủy yêu cầu `fetch` cũ (`AbortController`) và xóa `expectedAnimal`. Ép kiểu `json.data as Animal` hiện không an toàn: định nghĩa kiểu riêng `ScanCardSummary` cho dữ liệu rút gọn.
- **C6. Quét lại sau `pageshow`/`visibilitychange`:** hai sự kiện có thể cùng gọi `startCamera()` khiến camera khởi động lại hai lần (nháy). Gộp bằng cờ "đang khởi động" hoặc bỏ qua nếu camera đã đang chạy khỏe (`scanner.isScanning` và track `readyState === "live"`).

## Nghiệm thu (thiết bị thật, trên bản Preview của Vercel)
1. Quét thẻ thật trên iPhone Safari, Chrome iOS, Android Chrome, trình duyệt Xiaomi/UC (nếu có máy): vào đúng `/ar/{slug}`; Back quay lại quét tiếp được.
2. Giả lập mạng chậm (Slow 3G) khi quét: không có hai lần điều hướng; sau watchdog camera mở lại hoặc trang AR vào bình thường, không bao giờ kẹt màn hình đen.
3. Đổi camera 10 lần rất nhanh: không đen, không bận camera.
4. Chọn ảnh QR nhỏ trong ảnh chụp lớn từ thư viện: giải mã được; ảnh không có QR: thông báo đúng.
5. Console `/scan` sạch lỗi hydration trên bản production.
6. Thiết bị Xiaomi/UC/Samsung Internet KHÔNG thấy cảnh báo trình duyệt nhúng; Zalo/Facebook/TikTok vẫn thấy.
7. `npm run build` (lệnh mặc định) xanh trên Vercel; `npx tsc --noEmit`, ESLint sạch; `npm run test:qr` toàn bộ ca (kể cả ca tấn công) xanh.
8. API `/api/products/{slug}` chỉ trả trường rút gọn, có header cache; slug sai định dạng trả 400.

## Báo cáo sau khi làm
Nguyên nhân gốc của lỗi build mặc định và của hydration #418 (nếu còn), kết quả từng mục A/B/C (đã sửa/không tái hiện), ảnh hoặc ghi chú test trên thiết bị thật, đường dẫn bản Preview.
