# PROJECT: Landing page bán đồ chơi động vật + AR quét QR

## 0. Cách làm việc

- Trước khi code, hãy đề xuất: cấu trúc thư mục, danh sách file, luồng trang. Dừng lại chờ tôi xác nhận.
- Sau khi tôi xác nhận, làm theo từng bước ở mục 12. Xong mỗi bước, dừng lại để tôi test.
- Không tự thêm tính năng ngoài phạm vi (không admin, không đăng nhập, không giỏ hàng, không quiz).

## 1. Mục tiêu

Xây **một landing page bán mô hình/đồ chơi động vật vật lý cho trẻ 3-8 tuổi**. Điểm khác biệt là công nghệ AR:

Mỗi đồ chơi có một mã QR. Khách quét QR → con vật 3D hiện lên + phát audio phát âm tiếng Anh → bấm để đưa con vật vào không gian thật bằng AR.

Trang phải trông như thương hiệu đồ chơi giáo dục thật, không giống demo công nghệ.

- Phong cách: **Premium + Educational + Playful**. Màu ấm, bo tròn, ảnh lớn, typography rõ, an toàn cho trẻ.
- Tham khảo bố cục landing bán hàng hiện đại (hero lớn, section rõ, CTA nổi bật). Không clone giao diện, không copy logo, hình ảnh, nội dung từ bất kỳ website nào.
- Tên thương hiệu: **Poly Cards** (đặt trong file config để đổi dễ).
- **Mobile-first** (phần lớn khách mở bằng điện thoại).

## 2. Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `@google/model-viewer` cho 3D + AR
- Thư viện quét QR có fallback tốt trên mobile (ví dụ `html5-qrcode` hoặc `qr-scanner`). **Không dựa duy nhất vào `BarcodeDetector`.**
- Không có backend riêng. Dữ liệu sản phẩm nằm trong `data/animals.json`, đọc qua helper/API route của Next.js.
- Không yêu cầu cài app. Production chạy **HTTPS**.
- Thiết bị mục tiêu: iPhone Safari, iPhone Chrome, Android Chrome, Desktop.

## 3. Data (không hard-code trong component)

File `data/animals.json`, mỗi con vật:

```json
{
  "id": "deer-001",
  "slug": "deer",
  "qrCode": "AR-DEER-001",
  "nameEn": "Deer",
  "nameVi": "Con hươu",
  "ipa": "/dɪr/",
  "description": "A deer is a wild animal that lives in forests.",
  "price": 299000,
  "images": ["/images/deer.webp"],
  "audioUrl": "/audio/deer.mp3",
  "modelUrl": "/models/deer.glb",
  "iosModelUrl": "/models/deer.usdz",
  "posterUrl": "/images/deer-poster.webp",
  "animations": [],
  "arEnabled": true,
  "buyUrl": "https://..."
}
```

Yêu cầu:

- Tạo sẵn 4-6 con vật mẫu (Deer, Cat, Dog, Elephant, Lion, Panda). Dùng file placeholder và **đánh dấu rõ là placeholder**. Không bịa nội dung hay đánh giá.
- Thêm một con vật mới chỉ cần thêm 1 object JSON + file asset, không sửa code.
- `animations` là mảng tên animation lấy từ data (nếu rỗng thì không hiện nút).
- `buyUrl` là link mua hàng (Shopee/TikTok Shop/Zalo/Messenger). Nếu rỗng, nút Mua mở form liên hệ đơn giản hoặc link trong `config`.

## 4. Landing page (1 trang) gồm các section

1. **Navbar**: logo, link anchor, nút "Trải nghiệm AR". Navbar không được che camera ở màn hình scan.
2. **Hero**: tiêu đề kiểu "Học tiếng Anh bằng cách chạm vào thế giới thật", mô tả ngắn, 2 CTA: [Khám phá sản phẩm] và [Quét QR trải nghiệm AR]. Visual: đồ chơi + 3D animal + khung camera + QR.
3. **Vì sao chọn sản phẩm này**: học mà chơi, ít phụ thuộc màn hình, an toàn (không quảng cáo, không link ngoài trong trải nghiệm AR, nội dung kiểm soát).
4. **Cách hoạt động** (4 bước, trực quan): Chọn mô hình → Quét QR → Nghe và khám phá → Đưa vào AR.
5. **Sản phẩm**: grid card (ảnh, tên EN, tên VI, giá, badge "AR EXPERIENCE" nếu `arEnabled`, nút [Mua ngay] và [Trải nghiệm AR]).
6. **AR Demo**: section nổi bật nhất. Thông điệp "Quét. Nghe. Khám phá. Tương tác." kèm một `<model-viewer>` mẫu xoay được ngay trên trang.
7. **Lợi ích cho phụ huynh và giáo viên**.
8. **FAQ** (thiết bị nào hỗ trợ AR, cần cài app không, QR ở đâu, trẻ dùng có an toàn không...).
9. **CTA cuối + Footer** (liên hệ, link Facebook/Zalo/TikTok lấy từ config).

Không làm mục Testimonials, vì chưa có đánh giá thật.
Animation nhẹ, không lạm dụng.

## 5. QR: hai cách vào, cùng một trang kết quả

**QR in trên đồ chơi chứa URL:** `https://<domain>/ar/deer` (hoặc `/ar/<slug>`). Nên khách quét bằng camera gốc cũng vào thẳng được.

Route chính: `/ar/[slug]` = trang kết quả AR của con vật đó.

**Quét trong web:** route `/scan`, UI toàn màn hình, dùng camera sau (`facingMode: "environment"`). Hai chế độ:

- **Quét tự do** (nút ở hero/navbar): quét QR của bất kỳ con vật nào → chuyển sang `/ar/[slug]`.
- **Quét theo sản phẩm** (nút "Trải nghiệm AR" ở card): `/scan?expect=deer`. QR phải khớp con vật này.

Bộ parse QR chấp nhận: URL đúng domain của mình, hoặc mã `AR-XXX-001`. Từ chối mọi nội dung khác (không redirect tới URL lạ).

## 6. Luồng khi bấm [Trải nghiệm AR]

1. Hiện **màn hình hướng dẫn** trước (không xin camera ngay): "Cho phép camera → chuẩn bị mô hình → tìm QR → đưa QR vào khung" + nút [Mở Camera].
2. Chỉ khi bấm [Mở Camera] mới gọi `getUserMedia`.
3. Scanner full-screen: khung quét, dòng hướng dẫn, nút quay lại, nút đèn pin (**chỉ hiện nếu thiết bị hỗ trợ**).
4. Quét đúng → "✓ Đã nhận diện mô hình Deer" → sang trang kết quả.
5. Quét sai (chế độ theo sản phẩm): "QR này thuộc về sản phẩm khác. Bạn đang trải nghiệm Deer, vui lòng quét QR của Deer." Không mở nhầm nội dung.

## 7. Trang kết quả `/ar/[slug]`

- Hiển thị: tên EN lớn, nghĩa tiếng Việt, phiên âm IPA, nút 🔊 "Listen".
- Audio: phát file mp3 từ `audioUrl` khi người dùng bấm (iOS yêu cầu thao tác chạm, nên không tự phát). Không dùng TTS của trình duyệt làm giải pháp chính.
- 3D: `<model-viewer>` với `camera-controls`, `auto-rotate`, `poster`, `shadow-intensity`, hỗ trợ xoay và zoom.
- AR: nút [Đưa Deer vào không gian] dùng cơ chế AR có sẵn của model-viewer với `ar-modes="webxr scene-viewer quick-look"`, `src` = `modelUrl`, `ios-src` = `iosModelUrl` (**iPhone Quick Look cần file .usdz**).
- Nút animation (Idle/Walk/...) sinh từ `animations`, chỉ dùng ở chế độ xem 3D trên web.
- Lưu ý đúng với thực tế: khi vào AR, Scene Viewer (Android) và Quick Look (iPhone) dùng giao diện của hệ thống để đặt, xoay, zoom. Web không điều khiển được. Không giả lập AR bằng video hay CSS.
- Nếu `ar-status` cho thấy thiết bị không hỗ trợ AR: hiện "AR chưa được hỗ trợ trên thiết bị này" nhưng vẫn cho xem 3D đầy đủ.
- Trang này **không có quảng cáo, không link ra ngoài**. Chỉ có nút quay lại và nút quét con vật khác.

## 8. Các trạng thái bắt buộc có UI

- Loading (camera, model 3D, audio)
- Camera bị từ chối (hướng dẫn bật lại quyền) / không có camera
- QR không hợp lệ
- QR sai sản phẩm
- Không tìm thấy sản phẩm (slug/mã không có trong data)
- Model 3D tải lỗi (có nút thử lại)
- Audio lỗi
- AR không hỗ trợ (fallback 3D)
- **Đang mở trong trình duyệt của Zalo/Facebook/TikTok/Instagram**: phát hiện in-app browser và hiện hướng dẫn "Mở bằng Safari/Chrome để dùng camera", kèm nút copy link.

## 9. Responsive và UX

- Mobile-first, kiểm tra từ 360px.
- Màn hình scan chiếm gần như toàn bộ viewport, ẩn navbar/footer.
- Vùng chạm lớn, chữ dễ đọc, phù hợp phụ huynh cầm điện thoại cho trẻ.
- Tối ưu ảnh (webp), lazy-load model, dùng `poster` cho model-viewer.
- SEO cơ bản và Open Graph cho landing.

## 10. Công cụ tạo QR

Viết script Node (`scripts/generate-qr.ts`) đọc `animals.json` và xuất file PNG/SVG QR cho từng con vật vào `/qr-output`, nội dung là URL `https://<domain>/ar/<slug>`. Domain đọc từ biến môi trường `NEXT_PUBLIC_SITE_URL`.

## 11. KHÔNG được làm

- Hard-code sản phẩm, model, audio trong component
- Giả lập camera bằng video, giả lập AR bằng animation CSS
- Giả định WebXR hay `BarcodeDetector` luôn có
- Tự redirect tới URL tùy ý từ nội dung QR
- Xin quyền camera trước khi người dùng bấm [Mở Camera]
- Copy nội dung, logo, hình ảnh của website tham khảo
- Bịa đánh giá khách hàng hoặc số liệu

## 12. Các bước thực hiện

1. Cấu trúc project, `animals.json`, helper đọc data, config thương hiệu/link
2. Landing page + grid sản phẩm (chưa có AR)
3. Trang `/ar/[slug]`: model-viewer + audio + fallback + not-found
4. Trang `/scan`: camera, parse QR, hai chế độ, các state lỗi, phát hiện in-app browser
5. Hoàn thiện responsive, script tạo QR, hướng dẫn chạy HTTPS để test trên điện thoại (ví dụ tunnel) và hướng dẫn deploy

## 13. Tiêu chí hoàn thành

- [ ] Landing responsive, đủ section ở mục 4
- [ ] Sản phẩm đọc từ `animals.json`, thêm con mới không cần sửa code
- [ ] Quét được QR bằng camera sau trên điện thoại (HTTPS)
- [ ] Quét QR bằng camera gốc cũng mở đúng `/ar/[slug]`
- [ ] Chế độ theo sản phẩm validate đúng/sai
- [ ] Hiển thị tên EN, nghĩa VI, IPA; bấm 🔊 phát được mp3
- [ ] Load `.glb`, xoay, zoom được
- [ ] AR mở được trên thiết bị hỗ trợ (Android Scene Viewer/WebXR, iPhone Quick Look với .usdz)
- [ ] Có fallback 3D khi không hỗ trợ AR
- [ ] Đủ các trạng thái ở mục 8
- [ ] Script tạo QR chạy được
