# PROMPT 5/5: Nút "Xem AR thật" (AR Quick Look iOS / WebXR Android)

## Bối cảnh và ràng buộc chung
Dự án Poly Cards (Next.js + TypeScript + Three.js + MindAR + @google/model-viewer). Không phá ràng buộc: effect khởi tạo AR chỉ phụ thuộc `[animal.slug, animal.modelUrl, animal.targetUrl, loadScript]`; không `setState` trong vòng render.

## Lý do
Giống Apple 100% (đi bộ quanh model, máy tự biết tịnh tiến) cần SLAM; web trên iPhone không có. Cách duy nhất là AR Quick Look của Apple (iOS) và WebXR/Scene Viewer (Android). Dự án đã có `components/model-viewer-view.tsx` dùng `<model-viewer ar ar-modes="..." ios-src={animal.iosModelUrl}>`.

## File cần đọc
`components/model-viewer-view.tsx`, `webar-card-view.tsx` (menu và dải điều khiển), `types/animal` (trường `iosModelUrl`), thư mục `/public/models`.

## Yêu cầu
1. Trong menu camera WebAR thêm mục "Xem AR thật". Chỉ hiện khi:
   - iOS: `animal.iosModelUrl` tồn tại, bắt đầu bằng `/models/`, và `document.createElement('a').relList.supports('ar')` đúng.
   - Android: `navigator.xr?.isSessionSupported('immersive-ar')` trả về true, hoặc Scene Viewer khả dụng.
2. Khi bấm: gọi `activateAR()` của `<model-viewer>` ngay trong handler cử chỉ (bắt buộc, kẻo bị chặn). Thiết kế một trong hai cách và nêu lý do chọn:
   - (a) Giữ một `<model-viewer>` ẩn (`ar` + `ios-src`) trong WebAR view chỉ để gọi `activateAR()`.
   - (b) Đóng WebAR và mở `ModelViewerView` rồi kích hoạt AR.
   Không làm gián đoạn camera WebAR khi người dùng quay lại; nếu AR native đóng lại thì khôi phục stream camera (xem xử lý visibilitychange ở prompt 1).
3. Rà soát toàn bộ danh sách con vật: liệt kê con nào THIẾU `iosModelUrl`/file `.usdz` trong `/public/models/usdz/`. Với những con thiếu, nút ẩn (không hiện nút lỗi). Viết hướng dẫn ngắn (`docs/usdz-export.md`) cách chuyển GLB sang USDZ (Reality Converter hoặc `usdzconvert`), lưu ý giữ animation và kích thước thực (`ar-scale`).
4. UI: một dòng ghi chú nhỏ cho phụ huynh: "Chế độ này chạy ngoài ứng dụng nên không có từ vựng và micro".

## Nghiệm thu
- iPhone (Safari và Chrome iOS): bấm nút mở được AR Quick Look với con vật có USDZ, đi vòng quanh được; con vật thiếu USDZ thì không hiện nút.
- Android Chrome: mở được WebXR/Scene Viewer, đặt model lên sàn.
- Quay lại WebAR sau khi đóng AR: camera hoạt động bình thường, không đen.

## Không làm
Không thay đổi logic orbit/gyro/cử chỉ.
