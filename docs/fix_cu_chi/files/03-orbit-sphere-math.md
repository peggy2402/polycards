# PROMPT 3/5: Toán "camera trên mặt cầu" (Orbit Sphere): yaw + pitch, kẹp góc, làm mượt

Điều kiện: đã hoàn thành prompt 2, 2b và 2c (tâm xoay ở TÂM model; cử chỉ đã đúng trong không gian không bám thẻ, có `panCamCurrent`).

## Bối cảnh và ràng buộc chung
Dự án Poly Cards (Next.js + TypeScript + Three.js + MindAR). Ràng buộc đã có, KHÔNG được phá:
- Effect khởi tạo AR chỉ phụ thuộc `[animal.slug, animal.modelUrl, animal.targetUrl, loadScript]`; mọi giá trị khác qua ref.
- Không `setState` trong vòng render (trừ throttle), không cấp phát object trong render loop (tạo sẵn Vector3/Quaternion/Euler ngoài vòng lặp).
- Cleanup dispose đầy đủ; bật/tắt gyro không khởi tạo lại AR.

## File cần đọc
`hooks/use-ar-motion.ts`, `webar-card-view.tsx` (render loop, nhánh "Fallback / Free AR", đang có `orbit-lite` và `world-lock`).

## Mô hình hình học (hiểu đúng trước khi code)
- O = tâm model. R = khoảng cách camera-model. Camera ảo nằm trên mặt cầu bán kính R, luôn nhìn vào O.
- Hướng nhìn `f = qCam · (0,0,-1)`. Vị trí camera `P = O - R·f`.
- yaw của thiết bị: camera đi vòng xích đạo 360°. pitch: gật máy xuống = camera lên cao nhìn xuống (về đỉnh A); ngẩng máy = camera hạ thấp (về đáy B).
- MindAR giữ camera render cố định ở gốc, nhìn về -Z. Trong không gian camera, tâm O luôn ở `(0, yShift, -R)` (giữa màn hình) và hướng model = nghịch đảo hướng camera.
- `orbit-lite` hiện tại SAI vì chỉ dùng yaw (không lên A/xuống B được) và xoay quanh chân.

## Yêu cầu
1. `use-ar-motion.ts`: bỏ `qCamRef.slerp(target, 0.25)` theo sự kiện (phụ thuộc tần số cảm biến). Ghi thẳng `target` vào `qCamRef` (đã bù pose gốc + screen angle). Giữ nguyên tên `gyroQuatRef` để không vỡ chỗ dùng khác.
2. Trong render loop, tạo sẵn `qSmooth` và mỗi frame (trước khi rẽ nhánh theo mode): `qSmooth.slerp(qCam, 1 - Math.exp(-18 * dt))`. Mọi nhánh gyro (orbit-sphere lẫn world-lock) đều dùng `qSmooth`, không dùng `qCam` thô.
3. Thay nhánh `orbit-lite` bằng `orbit-sphere` (giữ nhánh `world-lock` hiện có):
   - Tách Euler 'YXZ' từ `qSmooth`: `yaw (y)`, `pitch (x)`, `roll (z)`.
   - Yaw tự do. Kẹp pitch trong `[-85°, +20°]` (âm = nhìn xuống, camera ở trên). Roll giữ nguyên, thêm cờ `lockRoll` (mặc định `false`; nếu `true` thì roll = 0).
   - `qView = fromEuler(pitchClamped, yaw, roll, 'YXZ')`.
   - `anchorQuat = qView⁻¹`.
   - `P_screen = (0, yShift, -R) + (panCamCurrent.x, panCamCurrent.y, 0)` với `R = freeArDist` (đã có: 1.9 dọc / 2.4 ngang) và `yShift` như hiện tại.
   - Tâm model trong không gian displayRoot: `O_local = (0, halfHeightScaled, 0)` (lấy từ prompt 2). KHÔNG cộng pan của người dùng vào đây: pan ở chế độ này đã nằm riêng trong không gian camera (`panCamCurrent`, prompt 2c) và được cộng vào `P_screen` bên dưới; nếu cộng vào `O_local` thì model luôn bị kéo về giữa màn hình và cử chỉ di chuyển mất tác dụng.
   - `anchorPos = P_screen - anchorQuat · O_local`.
   - `displayRoot.matrix.compose(anchorPos, anchorQuat, (1,1,1))`.
4. Chưa sửa logic chuyển giao với thẻ bài: giữ nguyên điều kiện nhánh hiện tại (chỉ chạy khi thẻ chưa được nhận). Prompt 4 sẽ xử lý.
5. Pinch zoom tiếp tục là đổi `scale` (tương đương đổi R). Không thêm logic mới.

## Nghiệm thu (test trên điện thoại thật, gyro bật, thẻ chưa vào khung)
- Đứng yên, xoay máy trái/phải: model ở giữa màn hình và xoay vòng 360° tại chỗ (thấy trước → bên → sau → bên).
- Gật máy xuống: thấy đỉnh đầu con vật; ngẩng lên: nhìn thấp lên và DỪNG ở giới hạn.
- Model không văng lệch hay trượt chân khi nghiêng (tâm xoay đúng là tâm model).
- Không còn rung do tần số cảm biến; chuyển động mượt như nhau ở máy 60Hz và 120Hz.
- Nếu hướng xoay bị NGƯỢC (trái/phải hoặc lên/xuống), sửa dấu rồi ghi rõ trong comment dấu nào đã được kiểm chứng trên máy thật.
- Đi vòng tròn thật quanh một điểm, giữ model ở giữa màn hình: lần lượt thấy các mặt như quay quanh quả cầu.
- FPS không giảm, không cấp phát object trong frame.

## Không làm
Chưa làm nút "Xem 360°", selfie, HUD, chuyển giao thẻ bài (prompt 4).
