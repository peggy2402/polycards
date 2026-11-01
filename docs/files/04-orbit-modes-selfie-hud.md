# PROMPT 4/5: Chế độ Orbit Sphere, chuyển giao với thẻ bài, nút "Xem 360°", selfie, Debug HUD

Điều kiện: đã hoàn thành prompt 2 và 3 (và nên làm prompt 1 trước vì liên quan camera trước).

## Bối cảnh và ràng buộc chung
Dự án Poly Cards (Next.js + TypeScript + Three.js + MindAR). Ràng buộc đã có, KHÔNG được phá:
- Effect khởi tạo AR chỉ phụ thuộc `[animal.slug, animal.modelUrl, animal.targetUrl, loadScript]`; mọi giá trị khác qua ref. Đổi mode không được khởi tạo lại AR (có log đếm effect, phải luôn bằng 1).
- Không `setState` trong vòng render (trừ throttle), không cấp phát object trong render loop.

## File cần đọc
`webar-card-view.tsx` (render loop, state `motionMode`, menu Gyro, nút camera), `hooks/use-ar-motion.ts`, `components/ar-hud`.

## Yêu cầu

### 4.1 Mode
- `motionMode: "orbit-sphere" | "world-lock" | "off"`. Xóa hoàn toàn `orbit-lite` và mọi nhãn UI liên quan. Mặc định `"orbit-sphere"`.
- Menu Gyro có lựa chọn 3 mode (nhãn thân thiện, ví dụ "Xoay quanh model", "Đứng yên trong phòng", "Tắt cảm biến"). Chuyển mode chỉ đổi ref, không khởi tạo lại AR.

### 4.2 Chuyển giao với thẻ bài
- Thẻ đang được nhận diện và chưa tách: MindAR 6DoF thật (giữ nguyên).
- Thẻ mất/chưa quét: dùng mode đang chọn (orbit-sphere hoặc world-lock).
- Thêm cờ `isDetachedRef`. Nút "Xem 360°" (icon nhỏ, trong dải điều khiển hoặc menu) đặt `isDetachedRef = true`: dùng orbit-sphere NGAY CẢ khi thẻ còn trong khung. Nút "Gắn lại thẻ" đặt về `false`.
- Khi vào orbit-sphere (do mất thẻ hoặc nhấn "Xem 360°") gọi `resetBasePose()` để hướng hiện tại = nhìn thẳng mặt trước model (yaw 0, pitch 0). Giữ easing 300ms khi chuyển qua lại, không nhảy giật.
- Double-tap vùng trống: reset cả góc quỹ đạo (`resetBasePose`) lẫn transform của người dùng.

### 4.3 Xoay ngang màn hình
- Kiểm tra `qScreen` (bù `screen.orientation.angle`) đúng ở landscape-left và landscape-right: xoay máy trái/phải vẫn là đi vòng quanh model, không bị hoán đổi trục. Sửa nếu sai. Cập nhật `freeArDist`/`yShift` theo orientation như hiện tại.

### 4.4 Camera trước (selfie)
- Cảm biến mô tả hướng camera SAU; camera trước nhìn ngược lại. Mặc định: TẮT orbit-sphere ở selfie (chỉ dùng vuốt xoay và cử chỉ), hiện toast nhẹ một lần.
- Tùy chọn kèm cờ debug: thử `qCamFront = qCam · Ry(π)`; chỉ bật mặc định nếu đã kiểm chứng trên máy thật rằng hướng không bị ngược.

### 4.5 Debug HUD (`?debug=1`)
- Hiển thị: azimuth (độ), elevation (độ, đã kẹp), R, mode, thẻ đang thấy/đã tách, FPS. Cập nhật throttle ≤ 10 lần/giây.

## Nghiệm thu
- Bật/tắt/đổi mode 20 lần liên tiếp trên iPhone (Safari + Chrome iOS): không crash, không tải lại model, không nhấp nháy camera.
- Thẻ vào/ra khung: chuyển giao mượt, không nhảy vị trí.
- "Xem 360°" khi thẻ còn trong khung: model giữ giữa màn hình và xoay quanh theo hướng máy; "Gắn lại thẻ" quay về bám thẻ.
- Landscape (cả hai chiều): xoay máy vẫn đúng chiều.
- Selfie: không có hành vi ngược chiều; vuốt vẫn hoạt động.
- HUD hiển thị đúng số liệu.

## Không làm
Không thêm tính năng ngoài danh sách trên.
