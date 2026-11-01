# NHIỆM VỤ: (A) Chế độ "Quả cầu quỹ đạo" cho Camera WebAR, (B) Sửa lỗi camera đen khi lật trước/sau, (C) Nút mở AR Apple thật

Dự án Poly Cards (Next.js + TS + Three.js + MindAR, trẻ 3-8 tuổi, iPhone Safari/Chrome iOS + Android Chrome).
Đọc kỹ trước khi sửa: src/components/ar/webar-card-view.tsx, hooks/use-ar-motion.ts, hooks/use-ar-camera.ts, hooks/use-ar-gestures.ts, components/model-viewer-view.tsx.
Ràng buộc đã có, KHÔNG được phá: effect khởi tạo AR chỉ phụ thuộc [animal.slug, animal.modelUrl, animal.targetUrl, loadScript]; mọi giá trị khác đọc qua ref; không setState trong vòng render (trừ throttle); không cấp phát object trong render loop; cleanup dispose đầy đủ.

## PHẦN A. Chế độ "Quả cầu quỹ đạo" (Orbit Sphere) - thay thế hoàn toàn "orbit-lite"

### A0. Mô hình hình học (phải hiểu đúng trước khi code)

- O = TÂM bounding box của model (KHÔNG phải chân). Model đứng ở O. R = khoảng cách camera-model.
- Camera ảo nằm trên mặt cầu bán kính R, luôn nhìn vào O. Hướng nhìn f = qCam·(0,0,-1). Vị trí camera P = O - R·f.
- yaw của thiết bị = đi vòng quanh xích đạo (360°). pitch: gật máy xuống = camera lên cao nhìn xuống (về đỉnh A); ngẩng máy = camera hạ thấp (về đáy B).
- MindAR giữ camera render cố định tại gốc nhìn về -Z. Nên trong không gian camera: tâm O luôn nằm tại (0, yShift, -R) (giữa màn hình), và hướng của model = nghịch đảo hướng camera: Rmodel = qView⁻¹, trong đó qView = qCam sau khi kẹp pitch.
- Vì xoay phải diễn ra quanh O (tâm model) chứ không quanh chân, ma trận của displayRoot là:
  `anchorQuat = qView⁻¹`
  `anchorPos = P_screen - anchorQuat · O_local` với P_screen = (0, yShift, -R)
  `displayRoot.matrix.compose(anchorPos, anchorQuat, scale=1)`
  O_local = vị trí tâm model trong không gian displayRoot = pivot.position + (0, halfH·currentScale, 0), halfH = (size.y / maxDim) _ baseDim _ 0.5 (tính một lần khi nạp model, lưu ref).

### A1. Đưa tâm xoay về tâm model cho MỌI phép xoay

- Hiện model đặt chân tại y=0 trong pivot (để đứng trên blob shadow). Giữ nguyên bố cục đó nhưng mọi phép xoay (orbit, vuốt xoay của người dùng, squash/tilt phản ứng) phải xoay quanh tâm c = (0, halfH·scale, 0): với rotation Rr thì `position = userPos + c - Rr·c`. Áp dụng cho cả pivot trong use-ar-gestures.updatePhysics (hiện xoay quanh chân) và cho displayRoot như công thức A0.
- Blob shadow/mặt sàn là con của nhóm bị xoay nên tự đổi góc nhìn đúng khi camera nhìn từ trên xuống.

### A2. Lấy yaw/pitch từ cảm biến, kẹp pitch

- Từ qCam (use-ar-motion), tách Euler 'YXZ': yaw (y), pitch (x), roll (z). Yaw tự do 360°. Kẹp pitch trong [-85°, +20°] (âm = nhìn xuống, camera ở trên). Giữ roll mặc định (nhất quán với video nền); thêm cờ `lockRoll` (mặc định false).
- qView = fromEuler(pitchClamped, yaw, roll, 'YXZ'). Dùng đối tượng Euler/Quaternion tạo sẵn.

### A3. Làm mượt trong render loop (không theo sự kiện)

- Trong use-ar-motion chỉ lưu qTarget (đã bù screen angle + pose gốc). Trong render loop: `qSmooth.slerp(qTarget, 1 - Math.exp(-18 * dt))`. Bỏ slerp 0.25/event vì phụ thuộc tần số cảm biến.

### A4. Các chế độ và khi nào áp dụng

- Enum motionMode: "orbit-sphere" (MẶC ĐỊNH) | "world-lock" (giữ code hiện tại) | "off". Xóa "orbit-lite".
- Khi thẻ đang được nhận diện: MindAR 6DoF thật như hiện tại (đi vòng quanh thẻ là thấy mọi góc).
- Khi mất thẻ hoặc chưa quét: dùng orbit-sphere. Thêm nút "Xem 360°" để người dùng CHỦ ĐỘNG tách khỏi thẻ và vào orbit-sphere ngay cả khi thẻ còn trong khung; nút "Gắn lại thẻ" để quay về.
- Chuyển trạng thái giữ easing 300ms như hiện tại, không nhảy giật. Khi vào orbit-sphere: gọi resetBasePose() để hướng hiện tại = nhìn thẳng vào mặt trước model (yaw 0, pitch 0).
- Pinch zoom giữ nguyên (tương đương đổi R). Double-tap vùng trống: reset cả góc quỹ đạo (resetBasePose) lẫn transform.
- Xoay ngang màn hình: dùng freeArDist/yShift theo orientation như hiện tại; xác nhận qScreen vẫn đúng ở landscape-left và landscape-right.

### A5. Camera trước (selfie)

- Cảm biến mô tả hướng camera SAU. Ở selfie camera nhìn ngược lại: dùng qCamFront = qCam · Ry(π) (kiểm chứng dấu bằng thử thực tế). Nếu không chắc chắn, MẶC ĐỊNH tắt orbit-sphere ở selfie và chỉ dùng vuốt/cử chỉ tay; không để người dùng thấy hướng bị ngược.

### A6. Debug HUD

- Hiển thị azimuth (độ), elevation (độ), R, mode, trạng thái thẻ để kiểm tra nhanh (?debug=1).

### Nghiệm thu Phần A

- Đứng yên, xoay máy trái/phải: model ở giữa màn hình và xoay vòng 360° tại chỗ, thấy lần lượt trước-bên-sau-bên.
- Gật máy xuống: thấy đỉnh đầu con vật; ngẩng lên: thấy nhìn thấp lên, dừng ở giới hạn. Model không văng lệch, không bị chân "trượt" (tâm xoay là tâm model).
- Đi vòng tròn thật quanh một điểm, giữ model ở giữa: thấy đủ các mặt như quay quanh quả cầu.
- Vuốt 1 ngón để xoay vẫn hoạt động và cộng dồn đúng quanh tâm; pinch zoom, chạm trúng model, double-tap reset vẫn đúng.
- Bật/tắt chế độ nhiều lần không khởi tạo lại AR (log đếm effect = 1), không crash, FPS không giảm.

## PHẦN B. Sửa lỗi camera đen khi lật trước → sau

Nguyên nhân đã xác định: trong handleToggleCamera, `videoEl` chính là `mindarRef.current.video`. `startFrontCamera(videoEl)` ghi đè videoEl.srcObject bằng stream trước, làm mất stream camera sau. Khi quay lại, code dừng stream trước rồi gán `videoEl.srcObject = mindarRef.current.video.srcObject` (chính là stream trước đã chết) nên màn hình đen. MindAR cũng vẫn xử lý khung hình selfie.

Yêu cầu:

1. Viết `switchCamera(target: "user" | "environment")` trong use-ar-camera: (a) dùng trực tiếp `mindarRef.current.video`, bỏ querySelector("video"); (b) dừng TẤT CẢ track của srcObject hiện tại, chờ ~200ms (iOS cần thời gian giải phóng camera); (c) `getUserMedia({ video: { facingMode: { ideal: target }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })`; (d) gán srcObject mới, `video.muted = true; video.playsInline = true; await video.play()`; (e) có token chống race khi bấm liên tiếp, khóa nút trong lúc đổi; (f) lỗi thì khôi phục chế độ trước đó và toast thân thiện, không để màn hình đen.
2. MindAR: khi sang selfie gọi `controller.stopProcessVideo()`; khi về camera sau gọi lại `controller.processVideo(video)` (kiểm tra API thật trong thư viện MindAR đang nạp từ /lib; nếu không khả thi thì khởi động lại riêng phần camera/controller, KHÔNG tạo lại renderer/model). Sau khi video có metadata mới, cập nhật kích thước/aspect để canvas và video khớp.
3. Mirror: CHỈ lật phần tử `<video>` ở selfie (ví dụ `[&>video]:scale-x-[-1]`), KHÔNG lật container/canvas. Hiện lật cả canvas làm kéo ngón sai chiều và raycast chạm lệch. capturePhoto phải vẽ video đã lật gương và canvas không lật.
4. Xử lý `visibilitychange`: khi tab ẩn rồi hiện lại, nếu video.paused hoặc track `readyState==="ended"` thì xin lại stream của chế độ hiện tại.
5. Cleanup khi unmount dừng mọi stream (cả hai camera).

Nghiệm thu Phần B: lật trước/sau 20 lần liên tiếp và bấm nhanh liên tục: không đen, không crash, không xin lại quyền camera vô lý; ở selfie kéo ngón sang phải thì model đi sang phải và chạm trúng model hoạt động đúng. Test trên Safari iOS, Chrome iOS, Android Chrome.

## PHẦN C. Nút "Xem AR thật" (AR Quick Look của Apple / WebXR trên Android)

- Dự án đã có ModelViewerView với `ar-modes` và `ios-src={animal.iosModelUrl}`. Thêm nút trong menu camera WebAR: "Xem AR thật" gọi `activateAR()` của <model-viewer> (phải nằm trong handler cử chỉ người dùng). Chỉ hiện khi có `animal.iosModelUrl` (iOS) hoặc `navigator.xr` hỗ trợ immersive-ar (Android).
- Đảm bảo mỗi con vật có file `.usdz` trong /public/models/usdz/ và trường iosModelUrl; liệt kê con vật còn thiếu và nêu cách chuyển GLB sang USDZ (Reality Converter hoặc usdzconvert, kiểm tra animation được giữ).
- Ghi chú trong UI: chế độ này chạy ngoài trang nên không có từ vựng/mic/cử chỉ.

## Báo cáo sau khi làm

Với mỗi phần A, B, C: liệt kê file đã sửa, hàm đã đổi, và các bước kiểm tra bằng tay đã chạy.
