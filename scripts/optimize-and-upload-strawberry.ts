import fs from "fs";
import path from "path";
import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { draco, dedup, prune } from "@gltf-transform/functions";
// @ts-ignore
import draco3d from "draco3dgltf";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { uploadToR2, isR2Configured } from "../src/lib/r2";
import { dbUpsertProduct, dbGetProductBySlug } from "../src/lib/mongodb";
import { inspectGlbBuffer } from "../src/lib/gltf-inspector";

async function optimizeAndUploadStrawberry() {
  console.log("=== BẮT ĐẦU TỐI ƯU HÓA MÔ HÌNH 3D STRAWBERRY (DÂU TÂY) ===");

  const inputPath = "/tmp/strawberry-v1.glb";
  if (!fs.existsSync(inputPath)) {
    console.error("Không tìm thấy file nguồn /tmp/strawberry-v1.glb");
    process.exit(1);
  }

  const inputBuffer = fs.readFileSync(inputPath);
  console.log(`Dung lượng file gốc: ${(inputBuffer.length / 1024 / 1024).toFixed(2)} MB`);

  const beforeReport = inspectGlbBuffer(inputBuffer);
  console.log(`Đa giác gốc: ${beforeReport.totalPolygons.toLocaleString()} | Đỉnh gốc: ${beforeReport.totalVertices.toLocaleString()}`);

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

  console.log("Đang nạp mô hình vào gltf-transform Document...");
  const doc = await io.readBinary(new Uint8Array(inputBuffer));

  // 1. Tính toán tỉ lệ giảm đa giác về ~39,000
  const targetTotal = 39000;
  let totalPolys = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      totalPolys += (prim.getIndices()?.getCount() || 0) / 3;
    }
  }

  const ratio = Math.max(0.015, Math.min(1.0, targetTotal / totalPolys));
  console.log(`Tỉ lệ decimate tính toán: ${(ratio * 100).toFixed(2)}% (Mục tiêu ~${targetTotal} polygons)...`);

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

      if (primPolys < 500) continue; // Giữ nguyên chi tiết nhỏ

      const targetCount = Math.floor((indicesArray.length * ratio) / 3) * 3;

      // Ưu tiên simplifySloppy với target_error phù hợp để đạt chuẩn an toàn mobile
      let [dstIndices] = MeshoptSimplifier.simplify(indicesArray, posFloat, 3, targetCount, 0.05);

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

  // 2. Thu nhỏ textures về tối đa 1024x1024 để tiết kiệm RAM điện thoại
  console.log("Đang tối ưu & nén Textures 2048 -> 1024...");
  for (const texture of doc.getRoot().listTextures()) {
    const rawImage = texture.getImage();
    if (!rawImage || rawImage.byteLength === 0) continue;
    try {
      const meta = await sharp(Buffer.from(rawImage)).metadata();
      if (meta.width && meta.height && (meta.width > 1024 || meta.height > 1024)) {
        const resized = await sharp(Buffer.from(rawImage))
          .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        texture.setImage(new Uint8Array(resized));
        texture.setMimeType("image/jpeg");
      }
    } catch (e) {
      console.warn("Bỏ qua texture không nén được:", e);
    }
  }

  // 3. Nén Draco
  console.log("Đang nén Draco compression...");
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

  const outBytes = await io.writeBinary(doc);
  const outBuffer = Buffer.from(outBytes);
  const afterReport = inspectGlbBuffer(outBuffer);

  console.log("\n--- BÁO CÁO SAU TỐI ƯU HÓA ---");
  console.log(`Dung lượng mới: ${(outBuffer.length / 1024 / 1024).toFixed(2)} MB (Trước: ${(inputBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Số đa giác mới: ${afterReport.totalPolygons.toLocaleString()} (Trước: ${beforeReport.totalPolygons.toLocaleString()})`);
  console.log(`Số đỉnh mới: ${afterReport.totalVertices.toLocaleString()} (Trước: ${beforeReport.totalVertices.toLocaleString()})`);
  console.log(`Chuẩn nén Draco: ${afterReport.hasDraco ? "ĐẠT" : "CHƯA"}`);
  console.log(`Đánh giá sức khỏe: ${afterReport.status.toUpperCase()} (${afterReport.score}/100)`);

  const outputPath = "/tmp/strawberry-clean.glb";
  fs.writeFileSync(outputPath, outBuffer);

  // 4. Đẩy lên Cloudflare R2
  console.log("\nĐang tải tệp tối ưu lên Cloudflare R2...");
  const glbUrl = await uploadToR2(outBuffer, "strawberry.glb", "model/gltf-binary");
  console.log(`✅ Upload GLB R2 thành công: ${glbUrl}`);

  // Cập nhật thẻ bài trong MongoDB Atlas
  console.log("Đang đồng bộ thẻ bài Dâu tây (strawberry) vào MongoDB Atlas...");
  const existingProduct = await dbGetProductBySlug("strawberry");

  const productData = {
    id: existingProduct?.id || `card-${Date.now()}`,
    slug: "strawberry",
    nameEn: "Strawberry",
    nameVi: "Dâu tây",
    ipa: "/'strɔː.bər.i/",
    ipaVi: "dâu tây",
    description: "Dâu tây là loại trái cây mọng nước, thơm ngọt giàu vitamin C giúp tăng sức đề kháng cho bé.",
    price: 219000,
    originalPrice: 299000,
    category: "Hoa Quả & Trái Cây",
    categoryId: "cat-hoa-qua",
    categorySlug: "hoa-qua",
    packCode: "POLY30-HOAQUA-ENVI",
    qrCode: "AR-STRAWBERRY-001",
    modelUrl: glbUrl,
    iosModelUrl: glbUrl.replace(/\.glb$/i, ".usdz"),
    posterUrl: "/images/cards/butterfly-card.png",
    images: ["/images/cards/butterfly-card.png"],
    audioUrl: "",
    animations: afterReport.animationClips || ["Animation"],
    arEnabled: true,
    updatedAt: new Date().toISOString(),
  };

  await dbUpsertProduct(productData as any);
  console.log("✅ Đã cập nhật thành công thẻ 'strawberry' vào MongoDB Atlas!");
  console.log("🎉 HOÀN TẤT TOÀN BỘ!");
}

optimizeAndUploadStrawberry().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});

