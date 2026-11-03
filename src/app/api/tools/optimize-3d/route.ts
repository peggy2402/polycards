import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { inspectGlbBuffer } from "@/lib/gltf-inspector";
import { isR2Configured, uploadToR2 } from "@/lib/r2";
import { dbGetProductBySlug, dbUpsertProduct } from "@/lib/mongodb";
import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { draco, dedup, prune } from "@gltf-transform/functions";
// @ts-ignore
import draco3d from "draco3dgltf";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

/**
 * Tối ưu hóa mô hình 3D bằng pipeline @gltf-transform + draco3d + MeshoptSimplifier
 * Đạt chuẩn Mobile WebAR an toàn: ~40k Polygons, Textures <= 1024, Nén Draco
 */
async function optimizeGlbWithGltfTransform(
  inputBuffer: Buffer,
  targetPolygons: number = 40000,
  maxTextureSize: number = 1024
): Promise<Buffer> {
  const [dracoDecoder, dracoEncoder] = await Promise.all([
    draco3d.createDecoderModule(),
    draco3d.createEncoderModule(),
  ]);
  await MeshoptSimplifier.ready;

  const io = new NodeIO()
    .registerExtensions(KHRONOS_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": dracoDecoder,
      "draco3d.encoder": dracoEncoder,
    });

  const doc = await io.readBinary(new Uint8Array(inputBuffer));

  // 1. Đếm tổng số đa giác hiện tại
  let origPolys = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      origPolys += (prim.getIndices()?.getCount() || 0) / 3;
    }
  }

  // 2. Decimate (giảm số đa giác) nếu vượt targetPolygons
  if (origPolys > targetPolygons) {
    const ratio = Math.max(0.015, Math.min(1.0, targetPolygons / origPolys));
    for (const mesh of doc.getRoot().listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute("POSITION");
        const indices = prim.getIndices();
        if (!pos || !indices) continue;

        const posArray = pos.getArray();
        const rawIndices = indices.getArray();
        if (!posArray || !rawIndices) continue;

        const posFloat = posArray instanceof Float32Array ? posArray : new Float32Array(posArray);
        const indicesArray = new Uint32Array(rawIndices);
        const primPolys = indicesArray.length / 3;
        if (primPolys < 500) continue; // Giữ nguyên các chi tiết nhỏ

        const targetCount = Math.floor((indicesArray.length * ratio) / 3) * 3;
        let [dstIndices] = MeshoptSimplifier.simplify(indicesArray, posFloat, 3, targetCount, 0.05);

        // Nếu simplify thông thường bị kẹt bởi topology, chuyển sang simplifySloppy để bảo đảm giảm đa giác
        if (dstIndices.length > targetCount * 1.3) {
          const [sloppyIndices] = MeshoptSimplifier.simplifySloppy(
            indicesArray,
            posFloat,
            3,
            null,
            targetCount,
            0.1
          );
          if (sloppyIndices && sloppyIndices.length > 0) {
            dstIndices = sloppyIndices;
          }
        }
        indices.setArray(dstIndices as any);
      }
    }
  }

  // 3. Tối ưu & Resize texture bằng sharp nếu vượt quá maxTextureSize (giảm hàng chục MB dung lượng)
  for (const texture of doc.getRoot().listTextures()) {
    const rawImage = texture.getImage();
    if (!rawImage || rawImage.byteLength === 0) continue;
    try {
      const meta = await sharp(Buffer.from(rawImage)).metadata();
      if (meta.width && meta.height && (meta.width > maxTextureSize || meta.height > maxTextureSize)) {
        const resizedBuffer = await sharp(Buffer.from(rawImage))
          .resize({ width: maxTextureSize, height: maxTextureSize, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        texture.setImage(new Uint8Array(resizedBuffer));
        texture.setMimeType("image/jpeg");
      }
    } catch {
      // bỏ qua nếu sharp không parse được định dạng ảnh lạ
    }
  }

  // 4. Nén Draco + Dedup + Prune
  await doc.transform(
    dedup(),
    prune(),
    draco({
      method: "edgebreaker",
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
      quantizeColor: 8,
      quantizeGeneric: 12,
    })
  );

  const optimizedBytes = await io.writeBinary(doc);
  return Buffer.from(optimizedBytes);
}

/**
 * Tìm đường dẫn thực thi Blender trên máy
 */
function findBlenderPath(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const candidates = [
    "/opt/homebrew/bin/blender",
    "/usr/local/bin/blender",
    "/Applications/Blender.app/Contents/MacOS/Blender",
  ];
  for (const p of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) return p;
  }
  return null;
}

/**
 * POST /api/tools/optimize-3d
 * Tự động tối ưu hóa đa giác (Decimate), nén Draco và đẩy lên Cloudflare R2
 */
export async function POST(req: NextRequest) {
  const tmpFilesToClean: string[] = [];

  try {
    let slug: string | null = null;
    let sourceUrl: string | null = null;
    let file: File | null = null;
    let targetPolygons = 40000;
    let maxTextureSize = 1024;
    let autoUploadR2 = true;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await req.json();
      slug = json.slug ? String(json.slug).trim().toLowerCase() : null;
      sourceUrl = json.url ? String(json.url).trim() : null;
      targetPolygons = Number(json.targetPolygons || 40000);
      maxTextureSize = Number(json.maxTextureSize || 1024);
      autoUploadR2 = json.autoUploadR2 !== false;
    } else {
      const formData = await req.formData();
      slug = (formData.get("slug") as string | null)?.trim()?.toLowerCase() || null;
      sourceUrl = (formData.get("url") as string | null)?.trim() || null;
      file = formData.get("file") as File | null;
      targetPolygons = Number(formData.get("targetPolygons") || 40000);
      maxTextureSize = Number(formData.get("maxTextureSize") || 1024);
      autoUploadR2 = formData.get("autoUploadR2") !== "false";
    }

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

    let optimizedGlbBuffer: Buffer | null = null;
    let optimizedUsdzBuffer: Buffer | null = null;

    // 3. Ưu tiên chạy gltf-transform + draco + meshoptimizer (Nhanh, nhẹ, đồng nhất)
    try {
      optimizedGlbBuffer = await optimizeGlbWithGltfTransform(inputBuffer, targetPolygons, maxTextureSize);
    } catch (gltfErr) {
      console.warn("Lỗi gltf-transform engine:", gltfErr);
    }

    // 4. Nếu có Blender trên máy và cần xuất USDZ cho Apple Quick Look
    const blenderBin = findBlenderPath();
    if (blenderBin && optimizedGlbBuffer) {
      try {
        const sessionTag = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const tmpDir = os.tmpdir();
        const inputGlbPath = path.join(tmpDir, `pc_in_${sessionTag}.glb`);
        const outputUsdzPath = path.join(tmpDir, `pc_out_${sessionTag}.usdz`);
        const scriptPath = path.join(tmpDir, `pc_script_${sessionTag}.py`);

        tmpFilesToClean.push(inputGlbPath, outputUsdzPath, scriptPath);
        fs.writeFileSync(inputGlbPath, optimizedGlbBuffer);

        const pythonScript = `
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r"${inputGlbPath}")
try:
    bpy.ops.wm.usd_export(filepath=r"${outputUsdzPath}", export_materials=True)
except Exception as e:
    print("USD export error:", e)
`;
        fs.writeFileSync(scriptPath, pythonScript, "utf8");

        await execFileAsync(blenderBin, ["--background", "--python", scriptPath], {
          timeout: 60000,
        });

        if (fs.existsSync(outputUsdzPath)) {
          optimizedUsdzBuffer = fs.readFileSync(outputUsdzPath);
        }
      } catch (blenderErr) {
        console.warn("Không thể xuất USDZ bằng Blender:", blenderErr);
      }
    }

    if (!optimizedGlbBuffer) {
      return NextResponse.json(
        { success: false, message: "Không thể tối ưu hóa tệp 3D này." },
        { status: 500 }
      );
    }

    const afterReport = inspectGlbBuffer(optimizedGlbBuffer);

    let outputGlbUrl = `/models/${effectiveSlug}.glb`;
    let outputUsdzUrl = `/models/usdz/${effectiveSlug}.usdz`;

    // 5. Upload thẳng lên Cloudflare R2 CDN nếu cấu hình
    if (autoUploadR2 && isR2Configured()) {
      const glbFileName = `${effectiveSlug}.glb`;
      const usdzFileName = `${effectiveSlug}.usdz`;

      outputGlbUrl = await uploadToR2(optimizedGlbBuffer, glbFileName, "model/gltf-binary");

      if (optimizedUsdzBuffer) {
        outputUsdzUrl = await uploadToR2(optimizedUsdzBuffer, usdzFileName, "model/vnd.usdz+zip");
      } else {
        outputUsdzUrl = outputGlbUrl.replace(/\.glb$/i, ".usdz");
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

    const savedPolygons = Math.max(0, beforeReport.totalPolygons - afterReport.totalPolygons);
    const reducedPercent = Math.max(
      0,
      Math.round((savedPolygons / (beforeReport.totalPolygons || 1)) * 100)
    );

    return NextResponse.json({
      success: true,
      message: `Đã tối ưu hóa mô hình "${effectiveSlug}" thành công!`,
      slug: effectiveSlug,
      modelUrl: outputGlbUrl,
      iosModelUrl: outputUsdzUrl,
      beforeReport,
      afterReport,
      savedPolygons,
      reducedPercent,
    });
  } catch (err: any) {
    console.error("Lỗi tối ưu 3D:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Lỗi xử lý tối ưu hóa mô hình 3D" },
      { status: 500 }
    );
  } finally {
    for (const p of tmpFilesToClean) {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch {}
    }
  }
}
