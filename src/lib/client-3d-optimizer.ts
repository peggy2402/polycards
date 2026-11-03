// @ts-nocheck
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";

export interface ClientOptimizeResult {
  glbBlob: Blob;
  usdzBlob?: Blob;
  originalSizeMB: number;
  optimizedSizeMB: number;
}

/**
 * Thu nhỏ texture hình ảnh bằng HTML5 Canvas 2D
 */
function downscaleImage(image: HTMLImageElement | ImageBitmap | HTMLCanvasElement, maxDimension: number): HTMLCanvasElement {
  let width = image.width;
  let height = image.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(image as CanvasImageSource, 0, 0, width, height);
  }
  return canvas;
}

/**
 * Tối ưu hóa mô hình 3D trực tiếp trong trình duyệt bằng Three.js Engine
 * (Hoạt động 100% trên Vercel Serverless, không phụ thuộc máy chủ cài Blender)
 */
export async function optimizeGlbInBrowser(
  glbArrayBuffer: ArrayBuffer,
  maxTextureSize: number = 1024,
  onProgress?: (step: string) => void
): Promise<ClientOptimizeResult> {
  const originalSizeMB = Number((glbArrayBuffer.byteLength / 1024 / 1024).toFixed(2));

  if (onProgress) onProgress("Đang nạp mô hình 3D vào Three.js Engine...");

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  // Ưu tiên tải Draco Decoder nội bộ từ /draco/, fallback sang Google gstatic CDN
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  let gltf: any = null;
  try {
    gltf = await new Promise<any>((resolve, reject) => {
      loader.parse(
        glbArrayBuffer,
        "",
        (loadedGltf) => resolve(loadedGltf),
        (err) => reject(new Error(`Lỗi parse GLTF: ${err?.message || err}`))
      );
    });
  } finally {
    try {
      dracoLoader.dispose();
    } catch {}
  }

  if (onProgress) onProgress("Đang phân tích và thu nhỏ độ phân giải Texture (4K -> 1024)...");

  // Duyệt qua toàn bộ mesh và material để resize texture lớn
  const scene = gltf.scene || gltf.scenes[0];
  const processedTextures = new Set<THREE.Texture>();

  scene.traverse((child: any) => {
    if (child.isMesh && child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];

      for (const mat of materials) {
        const textureKeys = [
          "map",
          "normalMap",
          "roughnessMap",
          "metalnessMap",
          "aoMap",
          "emissiveMap",
        ];

        for (const key of textureKeys) {
          const tex = mat[key] as THREE.Texture | undefined;
          if (tex && tex.image && !processedTextures.has(tex)) {
            processedTextures.add(tex);
            const img = tex.image;
            if (img.width > maxTextureSize || img.height > maxTextureSize) {
              const scaledCanvas = downscaleImage(img, maxTextureSize);
              tex.image = scaledCanvas;
              tex.needsUpdate = true;
            }
          }
        }
      }
    }
  });

  if (onProgress) onProgress("Đang xuất tệp GLB tối ưu...");

  // 1. Xuất GLB mới
  const gltfExporter = new GLTFExporter();
  const exportedGlbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    gltfExporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          // Trường hợp trả về JSON
          const str = JSON.stringify(result);
          const buf = new TextEncoder().encode(str).buffer;
          resolve(buf);
        }
      },
      (err) => reject(new Error(`Lỗi xuất GLB: ${err}`)),
      {
        binary: true,
        animations: gltf.animations || [],
        embedImages: true,
      }
    );
  });

  const glbBlob = new Blob([exportedGlbBuffer], { type: "model/gltf-binary" });
  const optimizedSizeMB = Number((glbBlob.size / 1024 / 1024).toFixed(2));

  // Kiểm tra an toàn: Tuyệt đối không cho phép file sau export lớn hơn file gốc (do Three.js GLTFExporter xuất raw uncompressed binary)
  if (glbBlob.size > glbArrayBuffer.byteLength) {
    throw new Error(
      `Cảnh báo an toàn: Mô hình xuất thô bị phình to (${optimizedSizeMB} MB so với gốc ${originalSizeMB} MB). Đã tự động chặn tải lên Cloudflare R2 để tránh làm nặng hệ thống. Hãy sử dụng pipeline nén chuyên sâu Draco + Decimate.`
    );
  }

  // 2. Xuất USDZ cho iPhone
  let usdzBlob: Blob | undefined = undefined;
  try {
    if (onProgress) onProgress("Đang xuất tệp USDZ cho Apple Quick Look...");
    const usdzExporter = new USDZExporter();
    const usdzArray = await usdzExporter.parse(scene);
    usdzBlob = new Blob([usdzArray], { type: "model/vnd.usdz+zip" });
  } catch (usdzErr) {
    console.warn("Không thể xuất USDZ từ trình duyệt:", usdzErr);
  }

  if (onProgress) onProgress("Hoàn tất tối ưu hóa mô hình!");

  return {
    glbBlob,
    usdzBlob,
    originalSizeMB,
    optimizedSizeMB,
  };
}
