# PROMPT 2b: Viết lại bộ nhận diện cử chỉ (1 ngón vuốt / giữ để di chuyển / 2 ngón zoom + di chuyển / 2 ngón chạm để reset)

Làm sau prompt 2, TRƯỚC prompt 3. Làm tiếp prompt 2c ngay sau prompt này.

## Bối cảnh và ràng buộc chung
Dự án Poly Cards (Next.js + TypeScript + Three.js + MindAR, trẻ 3-8 tuổi, iPhone + Android). Ràng buộc đã có, KHÔNG được phá:
- Effect khởi tạo AR chỉ phụ thuộc `[animal.slug, animal.modelUrl, animal.targetUrl, loadScript]`; mọi giá trị khác qua ref.
- Không `setState` trong event move và vòng render (trừ throttle); không cấp phát object trong render loop và trong pointermove (tạo sẵn Vector3/Quaternion/Box3/Sphere).
- Giữ nguyên API xuất ra của hook: `pointerHandlers`, `resetTransform`, `adjustZoom`, `updatePhysics`, `currentPosRef`, `targetScaleRef`, `isHoldingModelRef`.

## File cần đọc
`hooks/use-ar-gestures.ts` (toàn bộ), `webar-card-view.tsx` (chỗ gọi `useArGestures`, lớp overlay `{...pointerHandlers}`).

## Chẩn đoán (đọc code, chưa chạy thử)
1. **1 ngón không vuốt được:** `handlePointerDown` bật `touchStartedOnModelRef = true` ngay khi chạm trúng model, và `handlePointerMove` cho mọi lần kéo bắt đầu từ model đều là di chuyển (pan). Hit-test lại nới vùng đệm 20% quanh bounding sphere, model hiển thị khá to nên gần như mọi lần chạm đều "trúng". Bộ hẹn giờ nhấn giữ 250ms đã bị bỏ, nên vuốt xoay chỉ chạy khi bắt đầu ở vùng trống rất xa model.
2. **Hai ngón:** pan lấy `dx*0.5` của TỪNG pointer rồi cộng dồn, không dựa vào trọng tâm (centroid) hai ngón; khi thêm/bớt ngón thì không đặt lại mốc nên dễ giật; chưa có "2 ngón chạm để reset".
3. Sau khi nhấc 1 trong 2 ngón, ngón còn lại bị coi là vuốt 1 ngón và có thể làm model xoay/nhảy bất ngờ.
4. `onPointerCancel` đang dùng chung hàm với pointerup, nên cử chỉ bị hệ thống hủy vẫn có thể kích hoạt "chạm model" hoặc "reset".
5. Hit-test dùng `new Box3()`/`new Sphere()` mỗi lần gọi (cấp phát), và dùng matrixWorld có thể cũ nửa khung.

## Đặc tả cử chỉ cần đạt (touch)

| Cử chỉ | Hành động |
|---|---|
| 1 ngón chạm nhanh trúng model (< 300ms, di chuyển < 12px) | Phản ứng + âm thanh (`onTapModel`) |
| 1 ngón **vuốt** (nhấn rồi kéo quá ngưỡng trượt, KỂ CẢ bắt đầu ngay trên model) | **Xoay**: kéo sang phải thì mặt trước model đi sang phải; kéo xuống thì mặt trước đi xuống. Có quán tính khi thả. |
| 1 ngón **nhấn giữ** lên model ≥ 280ms mà gần như không di chuyển | Vào chế độ **di chuyển** (model nhấc lên, rung nhẹ). Sau đó kéo = di chuyển 1:1. Thả tay = hạ xuống. |
| 2 ngón **chụm/mở** | Zoom 20%-300%, đồng thời **di chuyển theo trọng tâm** hai ngón (giống kéo 1 ngón) |
| 2 ngón **chạm nhanh** vào vùng trống | **Reset** vị trí/góc/kích thước (và gọi `onResetGesture`) |
| Chạm 2 lần vào vùng trống (giữ như cũ) | Reset như trên |
| Desktop | Chuột trái kéo = xoay; nhấn giữ trái lên model 280ms rồi kéo = di chuyển; Shift hoặc chuột phải kéo = di chuyển; lăn chuột = zoom |

Với 1 ngón: vùng trống chỉ có vuốt xoay (không có giữ để di chuyển).

## Máy trạng thái (một "phiên" từ lúc ngón đầu tiên chạm đến khi tất cả đã nhấc)
Trạng thái: `IDLE`, `ONE_PENDING`, `ROTATE`, `HOLD`, `TWO`, `DONE`.
- `IDLE` + pointerdown (ngón 1): ghi `startX/Y/time`; hit-test trúng model thì bật hẹn giờ HOLD 280ms; → `ONE_PENDING`. Dừng quán tính xoay.
- `ONE_PENDING`:
  - di chuyển > 8px (so với điểm chạm): hủy hẹn giờ → `ROTATE` (bắt đầu xoay từ vị trí hiện tại, không bị nhảy).
  - hẹn giờ nổ khi chưa vượt ngưỡng: → `HOLD` (nâng model `targetHoldLiftY`, `navigator.vibrate(10)`).
  - nhấc ngón nhanh: xử lý tap (xem dưới).
- `ROTATE`: pointermove cộng dồn yaw/pitch; pointerup tính quán tính.
- `HOLD`: pointermove di chuyển model; pointerup hạ model.
- Ngón thứ 2 chạm xuống ở BẤT KỲ trạng thái 1 ngón nào: hủy hẹn giờ, hạ model, → `TWO`; **đặt lại mốc**: khoảng cách ban đầu, trọng tâm ban đầu, scale ban đầu, thời điểm ngón 2 chạm.
- `TWO`: mỗi pointermove tính từ **trọng tâm**: `Δcentroid` → di chuyển; `dist/startDist` → zoom. Chỉ dùng 2 pointer đầu tiên (ngón thứ 3 trở đi bị bỏ qua).
  - Khi ngón ĐẦU TIÊN nhấc lên: nếu thỏa điều kiện "2 ngón chạm" (dưới) → reset; dù thế nào → `DONE`.
- `DONE`: bỏ qua mọi di chuyển cho đến khi TẤT CẢ ngón đã nhấc, rồi → `IDLE`. (Tránh ngón còn lại tự biến thành vuốt xoay.)
- `pointercancel`: về `DONE` ngay, KHÔNG kích hoạt tap hay reset; hạ model.

## Điều kiện "2 ngón chạm nhanh để reset"
- Từ lúc ngón thứ 2 chạm đến lúc ngón đầu nhấc: ≤ 300ms; khoảng cách giữa 2 lần chạm xuống ≤ 150ms.
- Mỗi ngón di chuyển ≤ 12px so với điểm chạm của nó; khoảng cách giữa hai ngón thay đổi < 10%.
- Trọng tâm hai ngón KHÔNG trúng model (hit-test tại trọng tâm). Nếu trúng model: bỏ qua, không làm gì.

## Hằng số (đặt thành `const GESTURE = {...}` ở đầu file để dễ chỉnh)
`SLOP_PX=8, HOLD_MS=280, TAP_MAX_MS=300, TAP_MAX_MOVE_PX=12, TWO_TAP_MAX_MS=300, TWO_TAP_SYNC_MS=150, TWO_TAP_MAX_DIST_CHANGE=0.10, DOUBLE_TAP_MS=320, DOUBLE_TAP_DIST_PX=25, SCALE_MIN=0.2, SCALE_MAX=3.0, ROT_YAW_PER_PX=0.009, ROT_PITCH_PER_PX=0.007, PITCH_LIMIT_DEG=80`. Dùng chung `SCALE_MIN/MAX` cho pinch, wheel và `adjustZoom` (hiện lệch nhau: 0.2-2.5 và 0.15-3.0).

## Hit-test
- Dùng `Raycaster.intersectObject(pivot, true)` để xác định trúng MESH thật. Vùng đệm cho trẻ nhỏ: hạ từ 20% xuống **10%** quanh bounding sphere, dùng Box3/Sphere tạo sẵn (không `new` mỗi lần).
- Trước khi raycast gọi `pivot.updateMatrixWorld(true)` để matrixWorld của model không cũ. KHÔNG gọi `updateWorldMatrix(true, ...)` lên cha nếu `displayRoot.matrixAutoUpdate` đang `false` (sẽ ghi đè ma trận tự tính). Kiểm tra giá trị này trong component trước.

## Quán tính xoay
- Tính vận tốc yaw bằng trung bình mũ (EMA) của ~80ms cuối; nếu ngón dừng > 80ms trước khi nhấc thì vận tốc = 0 (không trôi khi thả tay chậm). Hệ số suy giảm `exp(-4.5 * dt)`, dừng khi < 0.02 rad/s. Mọi phép tính theo `dt`, không theo số frame.

## Cập nhật callback
- Đổi/thêm `onResetGesture` (gọi khi reset bằng 2 ngón hoặc double-tap). Giữ `onDoubleTapEmpty` làm alias để không vỡ code cũ.
- Hiển thị trạng thái cử chỉ hiện tại (`IDLE/ROTATE/HOLD/TWO`) trong Debug HUD (`?debug=1`) qua một ref được đọc throttle ≤10 lần/giây.

## Nghiệm thu (test trên iPhone thật, GYRO TẮT, thẻ chưa vào khung)
1. Đặt 1 ngón lên giữa model và vuốt ngang ngay lập tức: model XOAY (không bị kéo đi). Xoay đủ 360°, vuốt dọc nghiêng ±80°, thả nhanh thì quay tiếp rồi chậm dần.
2. Đặt 1 ngón lên model, giữ yên ~0.3s: model nhấc lên + rung; kéo thì model đi theo ngón tay; thả thì hạ xuống.
3. Hai ngón chụm/mở: zoom mượt; đồng thời kéo cả hai ngón: model đi theo; không giật khi chạm ngón thứ 2 trong lúc đang xoay hoặc đang giữ.
4. Nhấc 1 trong 2 ngón rồi tiếp tục kéo ngón còn lại: KHÔNG có gì xảy ra cho đến khi nhấc hết.
5. Hai ngón chạm nhanh vào vùng trống: reset mượt. Hai ngón chạm nhanh lên model: không reset.
6. Chạm nhanh 1 ngón vào model: có phản ứng + âm thanh, KHÔNG kích hoạt reset.
7. FPS không giảm; không có cấp phát trong pointermove (kiểm tra bằng devtools allocation timeline nếu cần).

## Không làm
Chưa xử lý khi gyro bật (prompt 2c). Không đổi cơ chế thẻ bài, camera trước, orbit.
