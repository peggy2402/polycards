import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { inspectGlbBuffer } from "@/lib/gltf-inspector";
import { isR2Configured, uploadToR2 } from "@/lib/r2";
import { dbGetProductBySlug, dbUpsertProduct } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

/**
 * Tìm đường dẫn thực thi Blender trên máy
 */
function findBlenderPath(): string | null {
  const candidates = [
    "/opt/homebrew/bin/blender",
    "/usr/local/bin/blender",
    "/Applications/Blender.app/Contents/MacOS/Blender",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * POST /api/tools/optimize-3d
 * Tự động tối ưu hóa đa giác (Decimate), nén Texture và xuất USDZ lên Cloudflare R2
 */
export async function POST(req: NextRequest) {
  const tmpFilesToClean: string[] = [];

  try {
    const formData = await req.formData();
    const slug = (formData.get("slug") as string | null)?.trim()?.toLowerCase();
    const sourceUrl = (formData.get("url") as string | null)?.trim();
    const file = formData.get("file") as File | null;
    const targetPolygons = Number(formData.get("targetPolygons") || 40000);
    const maxTextureSize = Number(formData.get("maxTextureSize") || 1024);
    const autoUploadR2 = formData.get("autoUploadR2") !== "false";

    let inputBuffer: Buffer | null = null;
    let effectiveSlug = slug || "model";

    // 1. Thu thập dữ liệu tệp nguồn
    if (file) {
      inputBuffer = Buffer.from(await file.arrayBuffer());
      if (!slug && file.name) {
        effectiveSlug = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      }
    } else if (sourceUrl) {
      const res = await fetch(sourceUrl);
      if (!res.ok) {
        return NextResponse.json(
          { success: false, message: `Không thể tải file nguồn từ URL: ${sourceUrl}` },
          { status: 400 }
        );
      }
      inputBuffer = Buffer.from(await res.arrayBuffer());
    } else if (slug) {
      const product = await dbGetProductBySlug(slug);
      if (!product?.modelUrl) {
        return NextResponse.json(
          { success: false, message: `Không tìm thấy URL mô hình 3D cho thẻ "${slug}" trong hệ thống.` },
          { status: 404 }
        );
      }
      const res = await fetch(product.modelUrl);
      if (!res.ok) {
        return NextResponse.json(
          { success: false, message: `Không thể nạp file nguồn từ R2 của sản phẩm "${slug}".` },
          { status: 400 }
        );
      }
      inputBuffer = Buffer.from(await res.arrayBuffer());
    }

    if (!inputBuffer) {
      return NextResponse.json(
        { success: false, message: "Vui lòng cung cấp file upload, tham số 'slug' hoặc 'url' của mô hình." },
        { status: 400 }
      );
    }

    // 2. Phân tích trước khi tối ưu (Before Report)
    const beforeReport = inspectGlbBuffer(inputBuffer);

    const blenderBin = findBlenderPath();
    if (!blenderBin) {
      return NextResponse.json(
        {
          success: false,
          message: "Máy chủ chưa cài đặt Blender để chạy pipeline tối ưu hóa tự động (yêu cầu Blender 4.0+ hoặc 5.0+).",
          beforeReport,
        },
        { status: 501 }
      );
    }

    // 3. Chuẩn bị tệp tạm
    const sessionTag = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tmpDir = os.tmpdir();
    const inputGlbPath = path.join(tmpDir, `pc_in_${sessionTag}.glb`);
    const outputGlbPath = path.join(tmpDir, `pc_out_${sessionTag}.glb`);
    const outputUsdzPath = path.join(tmpDir, `pc_out_${sessionTag}.usdz`);
    const scriptPath = path.join(tmpDir, `pc_script_${sessionTag}.py`);

    tmpFilesToClean.push(inputGlbPath, outputGlbPath, outputUsdzPath, scriptPath);

    fs.writeFileSync(inputGlbPath, inputBuffer);

    // 4. Sinh script Python cho Blender Headless
    const pythonScript = `
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r"${inputGlbPath}")

mesh_objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
total_polys = sum(len(o.data.polygons) for o in mesh_objs)

target_total = ${targetPolygons}
if total_polys > target_total:
    ratio = min(1.0, max(0.015, target_total / total_polys))
    for obj in mesh_objs:
        bpy.context.view_layer.objects.active = obj
        if len(obj.data.polygons) > 500:
            mod = obj.modifiers.new(name="Decimate", type="DECIMATE")
            mod.ratio = ratio
            bpy.ops.object.modifier_apply(modifier=mod.name)

# Scale textures
max_tex = ${maxTextureSize}
for img in bpy.data.images:
    if img.size[0] > max_tex or img.size[1] > max_tex:
        img.scale(max_tex, max_tex)

# Export GLB với Draco
bpy.ops.export_scene.gltf(
    filepath=r"${outputGlbPath}",
    export_format="GLB",
    export_apply=True,
    export_materials="EXPORT",
    export_draco_mesh_compression_enable=True
)

# Export USDZ cho iOS AR Quick Look
try:
    bpy.ops.wm.usd_export(filepath=r"${outputUsdzPath}", export_materials=True)
except Exception as e:
    print("USD export error:", e)
`;

    fs.writeFileSync(scriptPath, pythonScript, "utf8");

    // 5. Chạy Blender ngầm
    await execFileAsync(blenderBin, ["--background", "--python", scriptPath], {
      timeout: 120000, // tối đa 2 phút
    });

    if (!fs.existsSync(outputGlbPath)) {
      throw new Error("Blender không xuất được tệp GLB tối ưu.");
    }

    const optimizedGlbBuffer = fs.readFileSync(outputGlbPath);
    const afterReport = inspectGlbBuffer(optimizedGlbBuffer);

    let outputGlbUrl = `/models/${effectiveSlug}.glb`;
    let outputUsdzUrl = `/models/usdz/${effectiveSlug}.usdz`;

    // 6. Upload thẳng lên Cloudflare R2 CDN nếu cấu hình
    if (autoUploadR2 && isR2Configured()) {
      const glbFileName = `${effectiveSlug}.glb`;
      const usdzFileName = `${effectiveSlug}.usdz`;

      outputGlbUrl = await uploadToR2(optimizedGlbBuffer, glbFileName, "model/gltf-binary");

      if (fs.existsSync(outputUsdzPath)) {
        const usdzBuffer = fs.readFileSync(outputUsdzPath);
        outputUsdzUrl = await uploadToR2(usdzBuffer, usdzFileName, "model/vnd.usdz+zip");
      }

      // Tự động cập nhật sản phẩm trong MongoDB Atlas nếu có slug
      if (slug) {
        const existing = await dbGetProductBySlug(slug);
        if (existing) {
          await dbUpsertProduct({
            ...existing,
            modelUrl: outputGlbUrl,
            iosModelUrl: outputUsdzUrl,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã tối ưu hóa mô hình "${effectiveSlug}" thành công!`,
      slug: effectiveSlug,
      modelUrl: outputGlbUrl,
      iosModelUrl: outputUsdzUrl,
      beforeReport,
      afterReport,
      savedBytes: beforeReport.fileSizeBytes - afterReport.fileSizeBytes,
      savedPolygons: beforeReport.totalPolygons - afterReport.totalPolygons,
      reducedPercent: Math.round(
        ((beforeReport.totalPolygons - afterReport.totalPolygons) / (beforeReport.totalPolygons || 1)) * 100
      ),
    });
  } catch (error: any) {
    console.error("[Optimize 3D Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi trong quá trình tối ưu hóa 3D" },
      { status: 500 }
    );
  } finally {
    // Dọn dẹp tệp tạm
    for (const f of tmpFilesToClean) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    }
  }
}

