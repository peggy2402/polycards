# Poly Cards AR: bộ prompt thực hiện lần lượt

Đưa CHO AI TỪNG FILE MỘT, theo đúng thứ tự. Xong file nào, test trên điện thoại thật rồi mới sang file kế tiếp. Mỗi file đã tự chứa đủ bối cảnh, nên có thể mở cuộc trò chuyện mới cho từng file.

| Thứ tự | File | Nội dung | Phụ thuộc |
|---|---|---|---|
| 1 | `01-fix-camera-flip-black.md` | Sửa camera đen khi lật trước → sau, sửa lỗi lật gương sai | Không |
| 2 | `02-orbit-center-pivot.md` | Đưa tâm xoay của model về TÂM model (điều kiện cần cho quả cầu quỹ đạo) | Không |
| 3 | `03-orbit-sphere-math.md` | Toán "camera trên mặt cầu": yaw + pitch, kẹp góc, làm mượt | File 2 |
| 4 | `04-orbit-modes-selfie-hud.md` | Chế độ, chuyển giao với thẻ bài, nút "Xem 360°", selfie, Debug HUD | File 3 |
| 5 | `05-native-ar-button.md` | Nút "Xem AR thật" (Quick Look iOS / WebXR Android) | Không |

File 1 và 5 độc lập, có thể làm bất cứ lúc nào. Chuỗi 2 → 3 → 4 phải đi theo thứ tự.

## Hình dung mô hình quả cầu (đọc một lần)

- O = tâm model. R = khoảng cách camera-model. Camera ảo nằm trên mặt cầu bán kính R và luôn nhìn vào O: vị trí camera `P = O - R·f`, với `f` là hướng nhìn.
- Xoay máy trái/phải: camera đi vòng quanh xích đạo. Gật máy xuống: camera lên phía đỉnh (A), nhìn từ trên xuống. Ngẩng máy: camera hạ về phía đáy (B), có giới hạn.
- Trong WebAR, camera render cố định, nên "camera đi quanh model" được thực hiện bằng cách giữ model ở giữa màn hình và xoay model theo NGHỊCH ĐẢO hướng máy, quanh TÂM model.

## Giới hạn cần biết
- Giống Apple 100% (đi bộ quanh model, máy tự biết đã tịnh tiến) cần SLAM, iPhone không cho web dùng. Cách duy nhất là AR Quick Look (file 5).
- Khi thẻ bài còn trong khung thì MindAR đã là 6DoF thật.

## Quy tắc chung cho mọi file
- Không sửa ngoài phạm vi file prompt đang làm.
- Sau khi làm xong, báo cáo: file đã sửa, hàm đã đổi, các bước kiểm tra bằng tay đã chạy.
