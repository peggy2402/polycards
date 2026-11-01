# PROMPT 2c: Cử chỉ hoạt động đúng khi GYRO bật (và mọi chế độ không bám thẻ)

Làm ngay sau prompt 2b, TRƯỚC prompt 3.

## Bối cảnh và ràng buộc chung
Dự án Poly Cards (Next.js + TypeScript + Three.js + MindAR). Ràng buộc đã có, KHÔNG được phá:
- Effect khởi tạo AR chỉ phụ thuộc `[animal.slug, animal.modelUrl, animal.targetUrl, loadScript]`; mọi giá trị khác qua ref. Bật/tắt gyro không khởi tạo lại AR.
- Không `setState` trong event move và vòng render; không cấp phát object trong frame/pointermove.

## File cần đọc
`hooks/use-ar-gestures.ts` (đã viết lại ở prompt 2b), `webar-card-view.tsx` (chỗ gọi `useArGestures` KHÔNG truyền `halfHRef`; render loop: nhánh `isTargetFoundNow` và nhánh Fallback/Gyro với `displayRoot`, `anchorQuatTarget`, `anchorPosTarget`).

## Chẩn đoán (đọc code, chưa chạy thử)
Hook đặt vị trí và góc xoay của người dùng vào `pivot`, là con của `displayRoot`. Khi bật gyro, `displayRoot` bị xoay mỗi frame theo hướng máy (orbit-lite: quanh trục Y một góc `-yaw`; world-lock: xoay đầy đủ `qCam⁻¹`). Vì vậy:
1. Mọi giá trị pan/xoay của người dùng nằm trong HỆ TỌA ĐỘ ĐANG QUAY của `displayRoot`, không phải hệ màn hình. Kết quả: kéo ngón sang phải nhưng model đi chéo/ngược/ra sau; vuốt xoay quanh trục không phải trục dọc của màn hình. Đây là lý do cảm giác "bật gyro thì không dùng được cử chỉ".
2. Hệ số di chuyển `sensitivity = 0.75` là hằng số, không gắn với khoảng cách camera-model và FOV, nên ngón tay và model không đi cùng nhau 1:1.
3. Nếu sau này dùng công thức orbit-sphere ở prompt 3 với `O_local` có cộng `pivot.position`, vị trí pan của người dùng sẽ bị triệt tiêu (model luôn bị kéo về giữa màn hình). Vì vậy pan trong chế độ không bám thẻ phải được lưu riêng ở không gian camera (xem dưới).
4. Component gọi `useArGestures` mà không truyền `halfHRef`, nên tâm xoay dùng giá trị mặc định 0.36 thay vì chiều cao thật của từng con vật.

## Nguyên tắc thiết kế
Có HAI không gian cử chỉ, component báo cho hook qua `gestureSpaceRef.current` mỗi frame:
- `"tracking"` (thẻ đang được nhận diện): giữ hành vi hiện tại: xoay quanh trục của pivot, pan là `pivot.position` trong hệ `displayRoot`. Pan phải quy đổi đúng theo ma trận thế giới của `displayRoot` (xem 2b).
- `"free"` (chưa quét thẻ, hoặc mất thẻ; có gyro hay không đều như nhau): cử chỉ được hiểu trong HỆ MÀN HÌNH.

## Yêu cầu

### 1. Truyền đủ tham số
Truyền `halfHRef` (và `modelHeightRef` nếu prompt 2 đã tạo) vào `useArGestures`. Thêm ref `gestureSpaceRef` và `anchorQuatRef` (Quaternion = `anchorQuatTarget` của frame hiện tại; identity khi không gyro), component ghi mỗi frame trước khi gọi `updatePhysics`.

### 2. Xoay trong không gian "free"
- Hook vẫn giữ `yaw/pitch` người dùng như hiện nay (kẹp pitch ±80°), nhưng coi chúng là xoay quanh trục màn hình (dọc/ngang) trong hệ thế giới/camera.
- Quy đổi sang cục bộ của pivot: `Qd = anchorQuatRef` (xoay của displayRoot); `Qscreen = Euler(pitch, yaw, 0, 'YXZ')`; **`pivot.quaternion = Qd⁻¹ · Qscreen · Qd`**. Khi gyro tắt, `Qd = identity` nên kết quả giống hiện tại. Dùng đối tượng Quaternion tạo sẵn.
- Phần bù tâm model (`pivot.position = ... + c - pivotQuat·c`) của prompt 2 dùng đúng `pivot.quaternion` mới này.
- Ở `"tracking"`: giữ `pivot.rotation` theo hệ cục bộ như cũ.

### 3. Di chuyển 1:1 trong không gian "free"
- Tính độ sâu `depth` = khoảng cách dọc trục nhìn của camera tới tâm model (lấy tâm từ bbox tại thời điểm pointerdown/HOLD, đổi sang không gian camera, `depth = -z`). Ở chế độ free thường xấp xỉ `freeArDist`.
- Với `Δpx` của ngón (hoặc của trọng tâm khi 2 ngón): `halfH = depth * tan(fov/2)`, `halfW = halfH * aspect`; `dxCam = Δpx.x / rect.width * 2 * halfW`, `dyCam = -Δpx.y / rect.height * 2 * halfH`. Ngón tay và tâm model sẽ đi cùng nhau 1:1.
- Hook lưu `panCamRef = {x, y}` (cộng dồn `dxCam, dyCam`, kẹp trong khoảng hợp lý, ví dụ ±0.9·halfW/halfH), làm mượt bằng damping như các giá trị khác (`panCamCurrentRef`).
- **Component** cộng `panCamCurrent` vào vị trí neo SAU khi tính xong mọi chế độ (orbit/world-lock/không gyro) và TRƯỚC `displayRoot.matrix.compose(...)`: `anchorPosTarget.x += pan.x; anchorPosTarget.y += pan.y`. Nhánh world-lock có `return` sớm (khi `hasSavedWorldPose`) cũng phải áp dụng pan: sau `multiplyMatrices`, cộng `pan.x, pan.y` vào các phần tử dịch chuyển (`elements[12], elements[13]`) của `displayRoot.matrix`.
- Trong không gian "free" hook KHÔNG ghi pan vào `pivot.position` (chỉ còn thành phần bù tâm xoay + nâng lên khi giữ).
- Ở `"tracking"`: pan là `pivot.position` như cũ nhưng quy đổi 1:1: `deltaWorld = camera.quaternion · (dxCam, dyCam, 0)`; `deltaLocal = inverse(displayRoot.matrixWorld rotation) · deltaWorld / displayRoot.matrixWorld scale`. Dùng Matrix4/Vector3 tạo sẵn.

### 4. Hai bộ nhớ pan/xoay, không nhảy khi chuyển chế độ
- Lưu `panLocal` (tracking) và `panCam` (free) riêng. Xoay người dùng (`yaw/pitch`) và `scale` dùng chung. Khi thẻ vừa vào/ra khung: KHÔNG làm giá trị nhảy; component đã easing 300ms ở phần chuyển giao ma trận, hook chỉ đổi không gian tính toán.
- `resetTransform()` và reset bằng cử chỉ (2b) xóa cả `panLocal`, `panCam`, `yaw`, `pitch`, `scale`.

### 5. Hit-test trong chế độ gyro
- Raycast dùng ma trận thế giới của frame trước (OK vì model xoay mượt). Xác nhận hit-test và "chạm trúng model" vẫn đúng khi model đang xoay theo gyro; nếu cần, tạm khóa cập nhật hướng gyro (đứng yên model) trong lúc ngón đang chạm (`pointersMapRef.size > 0`) để thao tác ổn định hơn. Chọn cách đơn giản nhất mà vẫn đạt nghiệm thu, và ghi rõ trong comment.

## Nghiệm thu (iPhone thật, test LẦN LƯỢT từng chế độ)
Chế độ: (a) không gyro, thẻ chưa vào khung; (b) gyro bật, orbit-lite hiện tại; (c) gyro bật, world-lock; (d) thẻ đang được nhận diện.
Trong MỖI chế độ:
1. 1 ngón vuốt ngang: model xoay quanh trục DỌC của màn hình, chiều đúng; vuốt dọc: nghiêng đúng chiều.
2. 1 ngón nhấn giữ model rồi kéo sang phải/trái/lên/xuống: model đi ĐÚNG theo ngón, ngón không bị trượt khỏi model, kể cả khi vừa xoay máy sang hướng khác.
3. 2 ngón chụm/mở + kéo: zoom và di chuyển đúng.
4. 2 ngón chạm vùng trống: reset; double-tap vùng trống: reset.
5. Bật/tắt gyro và đổi chế độ khi model đã được xoay/di chuyển: không nhảy giật, không khởi tạo lại AR.
6. Xoay màn hình ngang/dọc: cử chỉ vẫn đúng chiều.
- FPS không giảm; không cấp phát trong `updatePhysics`/pointermove.

## Không làm
Không làm chế độ orbit-sphere (prompt 3). Không đổi camera trước, nút "Xem 360°".
