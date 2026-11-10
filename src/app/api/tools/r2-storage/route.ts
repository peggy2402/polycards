import { NextRequest, NextResponse } from "next/server";
import { isR2Configured, listR2Objects, deleteFromR2 } from "@/lib/r2";
import { dbGetProducts } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const QUOTA_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB miễn phí Cloudflare R2

function extractFileNameFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const clean = url.split("?")[0].split("#")[0];
    const parts = clean.split("/");
    const last = parts[parts.length - 1];
    return last ? decodeURIComponent(last) : null;
  } catch {
    return null;
  }
}

export interface R2UsedByProduct {
  slug: string;
  name: string;
  category?: string;
  categorySlug?: string;
  packCode?: string;
  enableEnVi?: boolean;
  enableZhVi?: boolean;
  modelName?: string;
  modelUrl?: string;
  role: string;
}

/**
 * GET /api/tools/r2-storage
 * Đo lường dung lượng đã dùng trên Cloudflare R2 bucket và phát hiện tệp mồ côi (Orphaned Assets)
 */
export async function GET() {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, message: "Cloudflare R2 chưa được cấu hình các biến môi trường." },
        { status: 500 }
      );
    }

    // 1. Lấy danh sách toàn bộ đối tượng trên R2
    const r2Items = await listR2Objects();

    // 2. Lấy danh sách sản phẩm từ MongoDB Atlas để so chiếu
    const products = await dbGetProducts();
    const usedKeysSet = new Set<string>();

    const keyToProductsMap = new Map<string, R2UsedByProduct[]>();

    const registerKeyUsage = (
      url: string | undefined,
      product: {
        slug: string;
        name?: string;
        nameVi?: string;
        category?: string;
        categorySlug?: string;
        packCode?: string;
        enableEnVi?: boolean;
        enableZhVi?: boolean;
        modelUrl?: string;
      },
      role: string
    ) => {
      const fn = extractFileNameFromUrl(url);
      if (!fn) return;

      usedKeysSet.add(fn.toLowerCase());
      usedKeysSet.add(fn);

      const modelFn = extractFileNameFromUrl(product.modelUrl);

      const info: R2UsedByProduct = {
        slug: product.slug,
        name: product.nameVi || product.name || product.slug,
        category: product.category,
        categorySlug: product.categorySlug,
        packCode: product.packCode,
        enableEnVi: product.enableEnVi,
        enableZhVi: product.enableZhVi,
        modelName: modelFn || undefined,
        modelUrl: product.modelUrl,
        role,
      };

      const keysToRegister = [fn, fn.toLowerCase()];
      for (const k of keysToRegister) {
        const existing = keyToProductsMap.get(k) || [];
        if (!existing.some((x) => x.slug === info.slug && x.role === info.role)) {
          existing.push(info);
        }
        keyToProductsMap.set(k, existing);
      }
    };

    for (const p of products) {
      registerKeyUsage(p.rawImageUrl, p, "Ảnh phôi thô (Raw)");
      if (Array.isArray(p.images)) {
        p.images.forEach((imgUrl, idx) => {
          registerKeyUsage(imgUrl, p, idx === 0 ? "Ảnh thẻ (Card)" : `Ảnh phụ #${idx + 1}`);
        });
      }
      registerKeyUsage(p.modelUrl, p, "Mô hình 3D (.glb)");
      registerKeyUsage(p.iosModelUrl, p, "Mô hình iOS (.usdz)");
      registerKeyUsage(p.targetUrl, p, "Target AR (.mind)");
      registerKeyUsage(p.audioUrl, p, "Âm thanh");
      registerKeyUsage(p.audioUrlEn, p, "Tiếng kêu (EN)");
      registerKeyUsage(p.audioUrlZh, p, "Tiếng kêu (ZH)");
      registerKeyUsage(p.audios?.en, p, "Âm thanh (EN)");
      registerKeyUsage(p.audios?.vi, p, "Âm thanh (VI)");
      registerKeyUsage(p.audios?.zh, p, "Âm thanh (ZH)");
    }

    // Luôn giữ các tệp hệ thống mặc định cốt lõi
    const systemProtectedKeys = new Set([
      "polycards.glb",
      "polycards.usdz",
      "polycards.mind",
      "lion.mind",
    ]);

    let totalSizeBytes = 0;
    const categoryStats = {
      glb: { count: 0, sizeBytes: 0 },
      usdz: { count: 0, sizeBytes: 0 },
      mind: { count: 0, sizeBytes: 0 },
      images: { count: 0, sizeBytes: 0 },
      audio: { count: 0, sizeBytes: 0 },
      other: { count: 0, sizeBytes: 0 },
    };

    const classifiedItems = r2Items.map((item) => {
      totalSizeBytes += item.size;
      const lowerKey = item.key.toLowerCase();
      const ext = lowerKey.split(".").pop() || "";

      // Thống kê phân loại
      if (ext === "glb") {
        categoryStats.glb.count++;
        categoryStats.glb.sizeBytes += item.size;
      } else if (ext === "usdz") {
        categoryStats.usdz.count++;
        categoryStats.usdz.sizeBytes += item.size;
      } else if (ext === "mind") {
        categoryStats.mind.count++;
        categoryStats.mind.sizeBytes += item.size;
      } else if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
        categoryStats.images.count++;
        categoryStats.images.sizeBytes += item.size;
      } else if (["mp3", "wav", "m4a", "ogg"].includes(ext)) {
        categoryStats.audio.count++;
        categoryStats.audio.sizeBytes += item.size;
      } else {
        categoryStats.other.count++;
        categoryStats.other.sizeBytes += item.size;
      }

      const isProtected = systemProtectedKeys.has(lowerKey);
      const isUsedInDb = usedKeysSet.has(lowerKey) || usedKeysSet.has(item.key);
      const isOrphan = !isProtected && !isUsedInDb;
      const usedBy = keyToProductsMap.get(item.key) || keyToProductsMap.get(lowerKey) || [];

      return {
        ...item,
        extension: ext,
        isOrphan,
        isProtected,
        usedBy,
      };
    });

    const orphanItems = classifiedItems.filter((i) => i.isOrphan);
    const orphanSizeBytes = orphanItems.reduce((acc, i) => acc + i.size, 0);

    const totalSizeMB = Number((totalSizeBytes / 1024 / 1024).toFixed(2));
    const usedPercent = Number(((totalSizeBytes / QUOTA_LIMIT_BYTES) * 100).toFixed(2));

    return NextResponse.json({
      success: true,
      stats: {
        totalObjects: r2Items.length,
        totalSizeBytes,
        totalSizeMB,
        quotaLimitMB: 10240, // 10 GB
        usedPercent,
        categoryStats,
        orphanCount: orphanItems.length,
        orphanSizeBytes,
        orphanSizeMB: Number((orphanSizeBytes / 1024 / 1024).toFixed(2)),
      },
      items: classifiedItems,
      orphans: orphanItems,
    });
  } catch (err: unknown) {
    console.error("Lỗi khi kiểm tra dung lượng R2:", err);
    const msg = err instanceof Error ? err.message : "Lỗi đọc dung lượng Cloudflare R2";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

/**
 * POST /api/tools/r2-storage
 * Dọn dẹp tệp mồ côi hoặc xóa tệp chỉ định trên Cloudflare R2 CDN
 */
export async function POST(req: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, message: "Cloudflare R2 chưa được cấu hình." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "clean-orphans";
    const targetKeys: string[] = body.keys || [];

    if (action === "clean-orphans" || (action === "delete" && targetKeys.length > 0)) {
      let keysToDelete: string[] = targetKeys;

      // Nếu là dọn dẹp toàn bộ tệp mồ côi, ta quét lại danh sách mồ côi
      if (action === "clean-orphans") {
        const r2Items = await listR2Objects();
        const products = await dbGetProducts();
        const usedKeysSet = new Set<string>();

        for (const p of products) {
          const urls = [
            p.modelUrl,
            p.iosModelUrl,
            p.targetUrl,
            ...(p.images || []),
            p.rawImageUrl,
            p.audioUrl,
            p.audioUrlEn,
            p.audioUrlZh,
            p.audios?.en,
            p.audios?.vi,
            p.audios?.zh,
          ];
          for (const u of urls) {
            const fn = extractFileNameFromUrl(u);
            if (fn) {
              usedKeysSet.add(fn.toLowerCase());
              usedKeysSet.add(fn);
            }
          }
        }

        const systemProtected = new Set([
          "polycards.glb",
          "polycards.usdz",
          "polycards.mind",
          "lion.mind",
        ]);

        keysToDelete = r2Items
          .filter((i) => !systemProtected.has(i.key.toLowerCase()) && !usedKeysSet.has(i.key.toLowerCase()))
          .map((i) => i.key);
      }

      let deletedCount = 0;
      for (const k of keysToDelete) {
        const ok = await deleteFromR2(k);
        if (ok) deletedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Đã dọn dẹp thành công ${deletedCount}/${keysToDelete.length} tệp trên Cloudflare R2!`,
        deletedCount,
      });
    }

    return NextResponse.json({ success: false, message: "Thao tác không hợp lệ" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Lỗi khi dọn dẹp Cloudflare R2:", err);
    const msg = err instanceof Error ? err.message : "Lỗi hệ thống khi dọn dẹp Cloudflare R2";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
