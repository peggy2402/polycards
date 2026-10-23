# Quy Tắc Cốt Lõi Dự Án Poly Cards

1. **Responsive UI**:
   - Mọi giao diện phải thích ứng hoàn hảo trên di động (tối thiểu 360px), tablet và desktop.
   - Vùng chạm tối thiểu 44x44px. Không để tràn ngang viewport.

2. **Nghiêm Cấm Emoji**:
   - Tuyệt đối không dùng ký tự emoji (như 🦌, 🐱, 🔊, ✓, ❌) trong UI/JSX/SVG.
   - Luôn sử dụng icon SVG chuyên nghiệp từ `lucide-react`.

3. **Logic Backend & Data Rõ Ràng**:
   - Tách biệt Data Access (`src/lib/animals.ts`), QR Verification (`src/lib/qr-parser.ts`), và Browser Detection (`src/lib/user-agent.ts`).
   - Xử lý lỗi đầy đủ, strict TypeScript, không dùng `any`.

4. **Bố Cục Dự Án Ngăn Nắp**:
   - Phân chia rõ ràng: `src/app/`, `src/components/{common,landing,ar,scanner}`, `src/hooks/`, `src/lib/`, `src/config/`, `src/types/`, `data/`.

5. **Không Lặp Code (DRY)**:
   - Tách các hàm định dạng vào `src/lib/formatters.ts`.
   - Tách logic stateful phức tạp thành Custom Hooks trong `src/hooks/`.
   - Tách các thành phần UI dùng chung thành atomic components.
