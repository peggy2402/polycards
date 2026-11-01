# PROMPT 2/5: Đưa tâm xoay của model về TÂM model (nền tảng cho quả cầu quỹ đạo)

## Bối cảnh và ràng buộc chung
Dự án Poly Cards (Next.js + TypeScript + Three.js + MindAR). Ràng buộc đã có, KHÔNG được phá:
- Effect khởi tạo AR chỉ phụ thuộc `[animal.slug, animal.modelUrl, animal.targetUrl, loadScript]`; mọi giá trị khác qua ref.
- Không `setState` trong vòng render (trừ throttle), không cấp phát object trong render loop.
- Cleanup dispose đầy đủ.

## File cần đọc
`webar-card-view.tsx` (phần dựng scene: `modelHolder`, `reactionSystem.reactionGroup`, `pivot`, `displayRoot`), `hooks/use-ar-gestures.ts` (`updatePhysics`), `effects/ar-reaction-system`.

## Vấn đề
Hiện cây đối tượng là `displayRoot → pivot → reactionGroup → modelHolder → model`, và model đặt CHÂN tại y = 0 (để đứng trên blob shadow). Mọi phép xoay (`pivot.rotation` do vuốt) đang xoay quanh CHÂN. Khi nghiêng nhìn từ trên xuống hoặc xoay nhiều trục, model bị văng lệch thay vì xoay tại chỗ như quả cầu có tâm O.

## Mục tiêu
Mọi phép xoay của pivot (vuốt xoay X/Y của người dùng) phải diễn ra quanh TÂM model, mà vẫn giữ nguyên bố cục hiện tại (chân chạm blob shadow, vị trí hiển thị ban đầu không đổi khi chưa xoay).

## Yêu cầu
1. Khi nạp model, lưu `modelHeightRef` = `size.y` (chiều cao thật của model sau bước sửa lỗi Mixamo scale đã có). Truyền vào `useArGestures` như một option mới (`modelHeightRef`).
2. Trong `updatePhysics`: sau khi tính `currentScale`, `currentRotX/Y`:
   - `s = (baseDim / maxDim) * currentScale` (như hiện tại).
   - `c = (0, modelHeight * s * 0.5, 0)` (tâm model, trong không gian cha của pivot).
   - Đặt `pivot.rotation` rồi lấy `pivot.quaternion`.
   - `pivot.position = userPos + c - (quaternion · c)` (dùng Vector3 tạo sẵn, `applyQuaternion`), cộng thêm `holdLiftY` như hiện tại.
   Kết quả: khi rotation = 0 thì vị trí giống hệt trước đây; khi xoay thì tâm model đứng yên.
3. Phản ứng của `ArReactionSystem` (squash/stretch, nhảy) vẫn tính từ chân/sàn như hiện tại, không đổi.
4. Hit-test, pan 1:1, pinch zoom, double-tap reset phải hoạt động y như cũ.
5. Xuất `halfHeightScaledRef` (hoặc hàm getter) để prompt sau đọc được tâm model trong không gian displayRoot: `pivot.position`-không-bù-xoay + `(0, modelHeight * s * 0.5, 0)`.

## Nghiệm thu
- Vuốt xoay mọi hướng (kể cả nghiêng dọc ±80°): tâm model đứng yên tại chỗ, không trượt/văng.
- Chưa xoay: bố cục và vị trí y như trước khi sửa.
- Pinch zoom khi đang nghiêng vẫn zoom quanh tâm, không lệch.
- FPS không giảm, không có cấp phát object trong `updatePhysics`.

## Không làm
Chưa đụng tới gyro/orbit. Đó là prompt 3.
