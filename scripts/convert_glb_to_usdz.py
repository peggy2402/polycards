import sys
import os
import glob
import zipfile
import shutil
import subprocess

# Tải module bpy (Blender Python API) một cách động.
# Không dùng cú pháp 'import bpy' trực tiếp để IDE không báo lỗi thiếu module trong môi trường Python ngoài.
try:
    bpy = __import__("bpy")
except Exception:
    blender_bin = shutil.which("blender") or "/opt/homebrew/bin/blender"
    if not os.path.exists(blender_bin):
        print("Lỗi: Không tìm thấy Blender trên máy Mac. Hãy dùng lệnh: npm run convert-usdz <tên_con_vật>")
        sys.exit(1)
    
    # Tự động chuyển tiếp lệnh vào Blender ngầm nếu người dùng gõ python3
    args = sys.argv[1:]
    cmd = [blender_bin, "--background", "--python", os.path.abspath(__file__), "--"] + args
    result = subprocess.run(cmd)
    sys.exit(result.returncode)

def convert_single_model(input_glb, output_usdz):
    print(f"\n==========================================")
    print(f"Bắt đầu chuyển đổi: {os.path.basename(input_glb)} -> {os.path.basename(output_usdz)}")
    print(f"==========================================")

    if not os.path.exists(input_glb):
        print(f"Lỗi: Không tìm thấy file {input_glb}")
        return False

    actual_glb_path = input_glb
    temp_dir = None

    # Kiểm tra nếu file thực chất là ZIP archive bị đổi đuôi thành .glb
    try:
        with open(input_glb, "rb") as f:
            magic = f.read(4)
        if magic == b"PK\x03\x04":
            print(f"-> Phát hiện file là tệp ZIP (Sketchfab archive). Đang tự động trích xuất file .glb bên trong...")
            temp_dir = f"/tmp/polycards_extract_{os.path.basename(input_glb)}"
            os.makedirs(temp_dir, exist_ok=True)
            with zipfile.ZipFile(input_glb, "r") as z:
                glb_members = [m for m in z.namelist() if m.lower().endswith(".glb")]
                if glb_members:
                    extracted_path = z.extract(glb_members[0], temp_dir)
                    actual_glb_path = extracted_path
                    print(f"-> Đã trích xuất tệp GLB nguồn: {glb_members[0]}")
    except Exception as e:
        print(f"Cảnh báo kiểm tra header: {e}")

    # Xóa sạch scene hiện tại
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import file GLB
    bpy.ops.import_scene.gltf(filepath=actual_glb_path)

    print("Các object đã import:", [obj.name for obj in bpy.data.objects])
    print("Khung xương (armatures):", [arm.name for arm in bpy.data.armatures])
    print("Danh sách animation (actions):", [act.name for act in bpy.data.actions])

    # Thiết lập khoảng frame timeline của animation chính xác theo action
    min_frame = None
    max_frame = None

    if bpy.data.actions:
        for act in bpy.data.actions:
            print(f"- Hoạt ảnh '{act.name}' (Frames: {act.frame_range[0]} -> {act.frame_range[1]})")
            if min_frame is None or act.frame_range[0] < min_frame:
                min_frame = int(act.frame_range[0])
            if max_frame is None or act.frame_range[1] > max_frame:
                max_frame = int(act.frame_range[1])
        bpy.context.scene.frame_start = min_frame
        bpy.context.scene.frame_end = max_frame
        print(f"-> Cấu hình timeline: {min_frame} đến {max_frame} frames")
    else:
        print("-> Cảnh báo: File không có action animation riêng biệt.")

    print(f"Đang xuất file USDZ chuẩn Apple AR Quick Look...")

    # Xuất USDZ với đầy đủ xương, animation và texture
    bpy.ops.wm.usd_export(
        filepath=output_usdz,
        check_existing=False,
        export_animation=True,
        export_armatures=True,
        export_shapekeys=True,
        export_materials=True,
        generate_preview_surface=True,
        export_uvmaps=True,
        export_normals=True,
    )

    # Dọn dẹp thư mục tạm nếu có
    if temp_dir and os.path.exists(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)

    print(f"Hoàn thành chuyển đổi thành công: {output_usdz}\n")
    return True

def main():
    # Lấy arguments truyền sau ký hiệu '--'
    args = []
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]

    target = args[0] if args else "cat"

    models_dir = os.path.abspath("public/models")

    if target.lower() == "all":
        glb_files = sorted(glob.glob(os.path.join(models_dir, "*.glb")))
        print(f"Tìm thấy {len(glb_files)} file GLB cần chuyển đổi trong {models_dir}")
        for glb in glb_files:
            base_name = os.path.splitext(os.path.basename(glb))[0]
            usdz_path = os.path.join(models_dir, f"{base_name}.usdz")
            convert_single_model(glb, usdz_path)
    else:
        # Nếu truyền vào tên con vật (ví dụ 'cat' hoặc 'dog') hoặc đường dẫn file
        if not target.endswith(".glb"):
            input_glb = os.path.join(models_dir, f"{target}.glb")
            output_usdz = os.path.join(models_dir, f"{target}.usdz")
        else:
            input_glb = os.path.abspath(target)
            output_usdz = os.path.splitext(input_glb)[0] + ".usdz"

        convert_single_model(input_glb, output_usdz)

if __name__ == "__main__":
    main()
