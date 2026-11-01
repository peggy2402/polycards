# PROMPT 1/5: Sửa lỗi camera đen khi lật trước → sau và lỗi lật gương

## Bối cảnh và ràng buộc chung
Dự án Poly Cards (Next.js + TypeScript + Three.js + MindAR, trẻ 3-8 tuổi, iPhone Safari/Chrome iOS + Android Chrome).
Ràng buộc đã có, KHÔNG được phá:
- Effect khởi tạo AR trong `webar-card-view.tsx` chỉ phụ thuộc `[animal.slug, animal.modelUrl, animal.targetUrl, loadScript]`. Mọi giá trị khác đọc qua ref.
- Không `setState` trong vòng render (trừ throttle), không cấp phát object trong render loop.
- Cleanup phải dispose đầy đủ. Bật/tắt tính năng không được khởi tạo lại MindAR/renderer/model.

## File cần đọc trước khi sửa
`src/components/ar/webar-card-view.tsx` (hàm `handleToggleCamera`, khoảng dòng 939-968, và phần JSX container camera khoảng dòng 1015), `hooks/use-ar-camera.ts` (`startFrontCamera`, `stopFrontStream`, `capturePhoto`).

## Nguyên nhân đã xác định
1. Trong `handleToggleCamera`, `videoEl` lấy bằng `querySelector("video")` CHÍNH LÀ `mindarRef.current.video`. `startFrontCamera(videoEl)` ghi đè `videoEl.srcObject` bằng stream camera trước, làm mất tham chiếu stream camera sau của MindAR.
2. Khi quay lại camera sau, code dừng stream trước rồi gán `videoEl.srcObject = mindarRef.current.video.srcObject`. Hai vế là cùng một element đang giữ stream trước đã chết, nên màn hình đen.
3. Controller MindAR vẫn xử lý khung hình selfie để dò thẻ.
4. Chế độ selfie đang dùng `scale-x-[-1]` lật CẢ container (kể cả canvas 3D), trong khi lớp bắt cử chỉ không bị lật. Hậu quả: kéo ngón sang phải thì model đi ngược chiều, raycast chạm model lệch vị trí.

## Yêu cầu
1. Viết `switchCamera(target: "user" | "environment")` trong `use-ar-camera`:
   - Dùng trực tiếp `mindarRef.current.video`, bỏ `querySelector("video")`.
   - Dừng TẤT CẢ track của `srcObject` hiện tại, chờ ~200ms (iOS cần thời gian giải phóng camera).
   - `getUserMedia({ video: { facingMode: { ideal: target }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })`.
   - Gán `srcObject` mới, đặt `video.muted = true; video.playsInline = true; await video.play()`.
   - Token chống race khi bấm liên tiếp; khóa nút trong lúc đang đổi.
   - Lỗi thì khôi phục chế độ trước đó và toast thân thiện, tuyệt đối không để màn hình đen.
2. MindAR: khi sang selfie gọi `controller.stopProcessVideo()`; khi về camera sau gọi lại `controller.processVideo(video)`. Kiểm tra API thật trong thư viện MindAR đang nạp từ `/lib`. Nếu không khả thi thì chỉ khởi động lại phần camera/controller, KHÔNG tạo lại renderer hay model. Sau khi video có metadata mới, cập nhật kích thước/aspect để canvas và video khớp.
3. Mirror: CHỈ lật phần tử `<video>` ở selfie (ví dụ `[&>video]:scale-x-[-1]`), KHÔNG lật container hay canvas. `capturePhoto` phải vẽ video đã lật gương và canvas không lật.
4. Xử lý `visibilitychange`: khi tab ẩn rồi hiện lại, nếu `video.paused` hoặc track `readyState === "ended"` thì xin lại stream của chế độ hiện tại.
5. Cleanup khi unmount dừng mọi stream (cả hai camera).

## Nghiệm thu
- Lật trước/sau 20 lần, kể cả bấm nhanh liên tục: không đen, không crash, không xin lại quyền camera vô lý.
- Ở selfie: kéo ngón sang phải thì model đi sang phải; chạm trúng model hoạt động đúng.
- Ảnh chụp ở selfie đúng chiều gương, model không bị lật.
- Test trên Safari iOS, Chrome iOS, Android Chrome.

## Không làm
Không đụng tới gyro, orbit, cử chỉ, giao diện khác.
