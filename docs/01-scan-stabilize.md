# PROMPT 1/2: Ổn định trang /scan (sửa lỗi nền trước khi nâng cấp)

## Bối cảnh và ràng buộc chung
Dự án Poly Cards (Next.js App Router + TypeScript + Tailwind, dữ liệu ở MongoDB Atlas, file nặng ở Cloudflare R2; triển khai trên Vercel; người dùng chủ yếu là phụ huynh và trẻ 3-8 tuổi trên điện thoại). Tên miền: `https://polycards.vn`. Trang cần sửa: `src/app/scan/page.tsx` cùng `src/components/scanner/*`.
Gần đây dữ liệu mockdata trong `src/lib/animals.ts` đã bị lược bỏ (chỉ còn thẻ demo `SYSTEM_POLYCARDS_ANIMAL`, slug `polycards`), nhiều file ảnh tĩnh trong `public/images/animals` và `public/images/cards` đã bị xóa. Không được phá lại luồng: quét QR → `/ar/[slug]`.

## Bước 0: Đọc trước khi sửa
`src/app/scan/page.tsx`, `src/components/scanner/qr-camera-scanner.tsx`, `scan-guide-modal.tsx`, `in-app-browser-modal.tsx`, `src/lib/user-agent.ts`, `src/lib/animals.ts`, `src/app/ar/[slug]/page.tsx`, API trả sản phẩm (tìm trong `src/app/api/products`). Báo lại ngắn gọn cấu trúc hiện tại và thư viện quét QR đang dùng.

## Vấn đề cần sửa (đã xác định từ code và log)

### 1. Lỗi hydration `Minified React error #418`
- Trình duyệt báo HTML do server render khác HTML client dựng. `suppressHydrationWarning` ở `<div>` ngoài cùng KHÔNG che được sai khác nội dung văn bản.
- Hãy tái hiện bằng `next dev` để có thông báo đầy đủ chỉ ra node bị lệch, rồi sửa tận gốc. Các nguyên nhân cần kiểm tra: giá trị phụ thuộc `window`/`navigator`/`localStorage`/ngày giờ/`Math.random` được dùng trong lần render đầu của `QrCameraScanner` hoặc layout/component dùng chung (banner, header, cookie notice).
- Lưu ý: `ScanContent` dùng `useSearchParams()` trong `<Suspense>`, nên phần nội dung (kể cả `QrCameraScanner`) hầu như chỉ được dựng ở client; thủ phạm nhiều khả năng nằm ở thành phần dùng chung được render từ server ở trang này: `src/app/layout.tsx`, thanh điều hướng/footer/provider, banner, hoặc script chèn từ ngoài. Hãy kiểm tra các nơi đọc `window`, `localStorage`, ngôn ngữ trình duyệt, ngày giờ, `Math.random()`, hoặc render khác nhau giữa server và client.
- Cách xử lý ưu tiên: đưa mọi giá trị chỉ có ở client vào `useEffect` hoặc `useSyncExternalStore`; chỉ dùng `next/dynamic` với `ssr: false` cho thành phần nào thật sự cần (ví dụ `QrCameraScanner`) và nêu lý do. Xóa các `suppressHydrationWarning` không còn cần thiết. Ghi rõ trong báo cáo thành phần nào gây lệch.
- Nghiệm thu: mở `/scan` trên production build (`next build && next start`) với Console trống lỗi #418 và không còn cảnh báo hydration ở dev.

### 2. Bật camera trước khi biết đang ở trình duyệt nhúng (Zalo/Facebook/TikTok)
- `isInAppBrowser()` chỉ chạy trong `useEffect`, còn `QrCameraScanner` mount ngay nên nó xin camera trước khi modal cảnh báo hiện ra.
- Sửa: dùng trạng thái ba giá trị `checking | normal | inapp`. Khi `checking` hiển thị khung chờ nhẹ (không xin camera). Khi `inapp` KHÔNG mount scanner mà hiện `InAppBrowserModal`. Khi `normal` mới mount scanner.
- `InAppBrowserModal` đang chặn hoàn toàn: thêm nút phụ "Vẫn thử quét" (cho trường hợp một số app nhúng vẫn mở được camera) để người dùng tự chọn, và trên Android thử mở bằng Chrome qua `intent://` (dựa trên host/path hiện tại), kèm nút sao chép liên kết như cũ.
- Sao chép liên kết phải chắc chắn: bọc `navigator.clipboard.writeText` bằng try/catch, có phương án dự phòng `document.execCommand("copy")` qua một `<textarea>` ẩn, và hiện thông báo thất bại thân thiện.
- Mở rộng `src/lib/user-agent.ts`: `isInAppBrowser()` hiện chỉ nhận Zalo, Facebook, TikTok, Instagram, Messenger, WeChat. Thêm Line, KakaoTalk, Snapchat, Twitter/X, LinkedIn, Pinterest, ứng dụng Google (`GSA`), và WebView Android chung (`; wv)`), nhưng KHÔNG gắn nhầm Chrome/Safari thường. Trả thêm trường `os` (dùng `getMobileOperatingSystem()` đã có) để chọn hướng dẫn đúng cho iOS/Android. Viết test bảng cho các chuỗi User-Agent mẫu (mỗi app một chuỗi thật, và Safari iOS, Chrome Android, CriOS làm ca âm tính).

### 3. `expect` bị hỏng sau khi bỏ mockdata
- `page.tsx` gọi `getAnimalBySlug(expectSlug)` ở client. Sau khi `animals.ts` chỉ còn thẻ demo, mọi `?expect=<slug>` khác sẽ cho `undefined` dù thẻ có thật trong MongoDB.
- Sửa: tạo hoặc dùng sẵn API công khai `GET /api/products/[slug]` (hoặc truy vấn ở Server Component rồi truyền xuống) trả về trường tối thiểu `{ slug, nameEn, nameVi, imageUrl }` (ảnh là URL R2), có cache ngắn. `ScanContent` lấy `expectedAnimal` từ đó (kèm trạng thái loading/không tìm thấy). Không để lộ trường nhạy cảm.
- Giữ nguyên hành vi: nếu không có `expect` thì quét bình thường.

### 4. Khung modal hướng dẫn bị sai
- `ScanGuideModal` là bố cục NGUYÊN TRANG (`min-h-[100dvh]`, có header "Về Trang Chủ" và badge "Camera AR Live") nhưng đang bị đặt trong container `max-h-[90dvh] overflow-y-auto` ở `page.tsx`: luôn tràn và phải cuộn, nút đóng (X) đè lên badge "Camera AR Live".
- Viết lại thành **bottom sheet gọn** cho di động và hộp thoại giữa màn hình cho desktop: bỏ `min-h-[100dvh]`, bỏ header trùng lặp (chỉ còn một nút đóng), chỉ giữ tiêu đề + 3 bước + vài thẻ gợi ý. Nút chính đổi thành "Đã hiểu" (vì camera đã bật sẵn phía sau), không còn "Bật Máy Ảnh & Bắt Đầu Quét".
- Khóa cuộn nền khi mở, đóng bằng phím Esc/chạm nền, focus được trả về nút mở, có `role="dialog"` và `aria-modal`.
- Phần "Chưa có thẻ bài giấy?": `getAllAnimals()` bây giờ chỉ còn thẻ demo, nên danh sách này gần như rỗng. Lấy danh sách thật từ API (`/api/products`, giới hạn ~8, có ảnh R2 và `slug`), có skeleton khi tải và xử lý lỗi. Thẻ mẫu mô phỏng trong modal dùng ảnh từ R2 (qua `SubjectFocusImage` sẵn có trong `src/components/.../subject-focus-image.tsx` để tự cắt bỏ vùng QR/ô chữ của phôi thẻ) thay vì `/images/animals/*`.
- Xóa mã trỏ tới `/qr-output/*` nếu còn.

### 5. Tham chiếu ảnh tĩnh đã xóa (404)
Log Console có nhiều 404: `/images/animals/{cat,elephant,deer,dog,panda,lion}.jpg`, `/images/cards/{lion-cards,walk-card,jump-template}.jpg`. Trang `/scan` mặc định không tải các ảnh này, nên hãy:
- Tìm toàn bộ nơi còn tham chiếu (`grep` trong `src/`, `seed-data`, cấu hình, và dữ liệu MongoDB: các trường `images`, `cardImage`...). Lập bảng "nơi tham chiếu → xử lý".
- Với dữ liệu MongoDB: viết script migrate an toàn (chế độ `--dry-run` mặc định, sao lưu trước, chỉ đổi đường dẫn cục bộ cũ sang URL R2 tương ứng nếu file có trên R2; nếu không có thì để trống để UI dùng ảnh placeholder). KHÔNG tự chạy ghi vào DB production; chỉ cung cấp script và báo cáo.
- Đọc `src/lib/products-store.ts` (`resolveValidProductImage`) và `SubjectFocusImage`: component này đang mặc định `fallbackUrl="/images/cards/butterfly-card.png"` và phân loại ảnh theo tiền tố cục bộ như `/images/animals/`, `/images/cards/`. Rà lại để chắc các fallback trỏ vào file thật còn tồn tại, và quy tắc nhận diện phôi thẻ vẫn đúng với URL R2 (tên file có `-card`, `-template`...).
- `SubjectFocusImage` cắt ảnh bằng canvas với `crossOrigin="anonymous"`; nếu bucket R2 chưa bật CORS cho `GET` từ `https://polycards.vn` thì thao tác này luôn thất bại và rơi về cách cắt bằng CSS. Kiểm tra và ghi vào báo cáo cấu hình CORS cần có (`AllowedOrigins`: `https://polycards.vn`, `https://www.polycards.vn`, domain preview Vercel; `AllowedMethods`: `GET`, `HEAD`).
- Thêm component ảnh có `onError` fallback sang placeholder để một ảnh hỏng không làm vỡ giao diện.

## Ràng buộc
- Không đổi hợp đồng giữa trang quét và `/ar/[slug]`.
- Không thêm thư viện nặng; không đổi thư viện quét QR trong prompt này.
- Không đụng tới logic giải mã QR (sẽ làm ở prompt 2), chỉ gắn lại cho đúng thứ tự mount.

## Nghiệm thu
1. Console không có lỗi #418 (production build); không có cảnh báo hydration ở dev.
2. Mở `/scan` trong trình duyệt Zalo/Facebook: camera KHÔNG được xin trước khi thấy cảnh báo; có "Sao chép liên kết", "Vẫn thử quét", và (Android) mở bằng Chrome.
3. `?expect=<slug thật trong MongoDB>` hiển thị đúng tên/ảnh con vật kỳ vọng.
4. Modal hướng dẫn: không còn tràn, không đè nút, đóng bằng X/Esc/chạm nền, cuộn nền bị khóa; danh sách thẻ nhanh lấy từ MongoDB.
5. Bảng rà soát ảnh 404 và script migrate (dry-run) được bàn giao.
6. `npx tsc --noEmit` và `next build` sạch lỗi.

## Báo cáo sau khi làm
File đã sửa/thêm, nguyên nhân thật của lỗi #418 (tên component và dòng), kết quả rà soát ảnh 404.
