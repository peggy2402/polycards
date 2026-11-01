# Hướng Dẫn Chuyển Đổi Mô Hình 3D từ .GLB sang .USDZ cho Poly Cards (iOS AR Quick Look)

Tài liệu này hướng dẫn quy trình chuẩn để chuyển đổi các tệp 3D hoạt cảnh (.glb) sang định dạng Apple AR Quick Look (.usdz) để hiển thị trong phòng thật trên iPhone/iPad với kích thước thực tế và bảo toàn đầy đủ chuyển động hoạt họa (Animations).

---

## 1. Danh sách hiện trạng tệp .usdz trong Poly Cards

| Slug thẻ | Tên con vật / Thẻ | Trạng thái .usdz | Đường dẫn tệp |
|---|---|---|---|
| `lion` | Sư tử (Lion) | **Đã có** | `/public/models/usdz/lion.usdz` |
| `cat` | Mèo con (Cat) | **Đã có** | `/public/models/usdz/cat.usdz` |
| `dog` | Chó cưng (Dog) | **Đã có** | `/public/models/usdz/dog.usdz` |
| `deer` | Chú hươu (Deer) | **Đã có** | `/public/models/usdz/deer.usdz` |
| `elephant` | Voi con (Elephant) | **Đã có** | `/public/models/usdz/elephant.usdz` |
| `panda` | Gấu trúc (Panda) | **Đã có** | `/public/models/usdz/panda.usdz` |
| `polycards` | Thẻ đa năng (Poly) | **Đã có** | `/public/models/usdz/polycards.usdz` |
| `strawberry` | Dâu tây (Strawberry) | **Đã có** | `/public/models/usdz/strawberry.usdz` |
| `walk` | Đi bộ (Cô bé học sinh) | **Cần bổ sung** | Tải từ `g_walk.glb` |
| `jump` | Nhảy vui nhộn (Cậu bé) | **Cần bổ sung** | Tải từ `b_jump.glb` |

---

## 2. Cách 1: Sử dụng Apple Reality Converter (Khuyên dùng - Đồ họa trực quan trên macOS)

Apple Reality Converter là ứng dụng miễn phí chính thức của Apple giúp chuyển đổi và xem trước tệp USDZ tức thì.

### Các bước thực hiện:
1. **Tải phần mềm:** Tải [Apple Reality Converter](https://developer.apple.com/augmented-reality/tools/) từ Apple Developer Portal (yêu cầu macOS).
2. **Kéo thả tệp:** Mở Reality Converter, kéo tệp `g_walk.glb` hoặc `b_jump.glb` vào cửa sổ ứng dụng.
3. **Kiểm tra Animation & Xương:**
   - Ở thanh điều khiển góc dưới, bấm nút **Play** để kiểm tra hoạt cảnh (Idle, Walk, Jump).
   - Kiểm tra tab **Environment / Lighting**: bảo đảm vật liệu PBR (Base Color, Roughness, Normal) hiển thị sáng rõ, không bị tối.
4. **Kiểm tra Kích thước thực (Real-world Scale):**
   - Đảm bảo chiều cao nhân vật tương ứng từ `0.6m` đến `1.5m` để khi đặt xuống sàn nhà, trẻ nhìn thấy con vật vừa vặn trên thảm/bàn học.
5. **Xuất tệp (Export):**
   - Chọn menu `File` > `Export...` > Đặt tên là `walk.usdz` (hoặc `jump.usdz`).
   - Lưu tệp vào thư mục dự án: `public/models/usdz/walk.usdz`.

---

## 3. Cách 2: Sử dụng lệnh Command Line `usdzconvert` (Dành cho Pipeline tự động)

Apple cung cấp bộ công cụ Python `usd-core` và `usdzconvert` trên Terminal:

```bash
# 1. Cài đặt usd-core (nếu chưa có)
pip install usd-core

# 2. Chuyển đổi tệp .glb sang .usdz
usdzconvert g_walk.glb public/models/usdz/walk.usdz \
  -metersPerUnit 1.0 \
  -loop 1
```

---

## 4. Cách 3: Sử dụng Blender (Đa nền tảng Windows / macOS / Linux)

Nếu làm việc trên Windows hoặc Linux không có máy Mac:
1. Mở **Blender 4.0+** (miễn phí).
2. Chọn `File` > `Import` > `glTF 2.0 (.glb/.gltf)`.
3. Kiểm tra Timeline: bấm `Spacebar` để chạy thử chuyển động của nhân vật.
4. Chọn `File` > `Export` > `Universal Scene Description (.usdz)`.
   - Chọn checkbox: `Animation`, `Armatures`, `Materials`.
5. Đặt tệp vào `public/models/usdz/[slug].usdz`.

---

## 5. Quy tắc kích hoạt trong Poly Cards

Sau khi copy tệp vào `public/models/usdz/[slug].usdz`:
1. Trong `src/data/seed-data.ts`, cập nhật trường `iosModelUrl: "/models/usdz/[slug].usdz"`.
2. Hệ thống WebAR sẽ tự động phát hiện tệp hợp lệ và bật nút **"Xem AR phòng thật (Apple Quick Look)"** trong menu!
3. Những con vật chưa có tệp `.usdz` sẽ tự động ẩn nút để tránh lỗi 404 cho người dùng.

