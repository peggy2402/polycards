import { NextRequest, NextResponse } from "next/server";
import { Animal } from "@/types/animal";
import {
  dbGetProducts,
  dbUpsertProduct,
  dbDeleteProduct,
  dbDeleteProducts,
  isMongoConfigured,
} from "@/lib/mongodb";

const KNOWN_GLB_SLUGS = new Set(["cat", "deer", "dog", "elephant", "lion", "panda"]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q");

    const rawList = await dbGetProducts();

    let list = rawList.map((a) => ({
      ...a,
      category: a.category || "Động Vật",
      categorySlug: a.categorySlug || "dong-vat",
    }));

    if (category && category !== "all") {
      list = list.filter(
        (item) => item.categorySlug === category || item.category === category
      );
    }

    if (query) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.nameEn.toLowerCase().includes(q) ||
          item.nameVi.toLowerCase().includes(q) ||
          (item.nameZh && item.nameZh.includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
      total: list.length,
      data: list,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi đọc danh sách sản phẩm";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Hỗ trợ cập nhật hàng loạt (Batch update, ví dụ: gán mã bộ cho nhiều thẻ cùng lúc)
    if (Array.isArray(body) || (body && Array.isArray(body.batch))) {
      const itemsToUpdate: Partial<Animal>[] = Array.isArray(body) ? body : body.batch;
      const currentList = await dbGetProducts();
      const updatedList: Animal[] = [];

      for (const item of itemsToUpdate) {
        if (!item.slug && !item.id) continue;
        const cleanSlug = String(item.slug || "").toLowerCase().trim();
        const existing = currentList.find(
          (a) => (cleanSlug && a.slug.toLowerCase() === cleanSlug) || (item.id && a.id === item.id)
        );
        if (!existing) continue;

        const merged: Animal = {
          ...existing,
          ...item,
          packCode:
            item.packCode !== undefined
              ? String(item.packCode).trim()
              : existing.packCode || "",
          rawImageUrl:
            item.rawImageUrl !== undefined
              ? String(item.rawImageUrl).trim()
              : existing.rawImageUrl,
          qrPosition: item.qrPosition || existing.qrPosition,
          updatedAt: new Date().toISOString(),
        };

        await dbUpsertProduct(merged);
        updatedList.push(merged);
      }

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật thành công ${updatedList.length} thẻ bài.`,
        data: updatedList,
      });
    }

    if (!body.nameEn || !body.nameVi || !body.category) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin bắt buộc (Tên thẻ, Danh mục)." },
        { status: 400 }
      );
    }

    const currentList = await dbGetProducts();
    const cleanSlug = String(body.slug || body.nameEn)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    const existingItem = currentList.find(
      (a) => a.slug.toLowerCase() === cleanSlug || (body.id && a.id === body.id)
    );

    const hasStaticModel = KNOWN_GLB_SLUGS.has(cleanSlug);
    const defaultModelGlb = hasStaticModel ? `/models/${cleanSlug}.glb` : "/models/lion.glb";
    const defaultModelUsdz = hasStaticModel ? `/models/${cleanSlug}.usdz` : "/models/lion.usdz";

    const finalImageUrl =
      body.posterUrl ||
      (Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : "") ||
      existingItem?.posterUrl ||
      "/images/cards/jump-template.jpg";

    const defaultImages = finalImageUrl
      ? [finalImageUrl]
      : existingItem?.images || ["/images/cards/jump-template.jpg"];

    const rawCategory = String(body.category || "Động Vật").trim();
    let computedCategorySlug = body.categorySlug;
    if (!computedCategorySlug || computedCategorySlug === cleanSlug) {
      const catLower = rawCategory.toLowerCase();
      if (catLower.includes("hành động") || catLower.includes("hanh-dong")) {
        computedCategorySlug = "hanh-dong";
      } else if (
        catLower.includes("phương tiện") ||
        catLower.includes("xe cộ") ||
        catLower.includes("phuong-tien") ||
        catLower.includes("xe-co")
      ) {
        computedCategorySlug = "xe-co";
      } else if (
        catLower.includes("trái cây") ||
        catLower.includes("hoa quả") ||
        catLower.includes("trai-cay") ||
        catLower.includes("hoa-qua")
      ) {
        computedCategorySlug = "hoa-qua";
      } else {
        computedCategorySlug = "dong-vat";
      }
    }

    const computedCategoryId = body.categoryId || `cat-${computedCategorySlug}`;
    const computedPackCode =
      body.packCode !== undefined
        ? String(body.packCode).trim()
        : existingItem?.packCode !== undefined
          ? existingItem.packCode
          : `POLY30-${computedCategorySlug.replace(/-/g, "").toUpperCase()}`;

    const updatedItem: Animal = {
      id: body.id || existingItem?.id || `${cleanSlug}-00${currentList.length + 1}`,
      slug: cleanSlug,
      qrCode:
        body.qrCode ||
        existingItem?.qrCode ||
        `AR-${cleanSlug.toUpperCase()}-00${currentList.length + 1}`,
      nameEn: String(body.nameEn).trim(),
      nameVi: String(body.nameVi).trim(),
      nameZh: body.nameZh !== undefined ? String(body.nameZh).trim() : existingItem?.nameZh || "",
      ipa: body.ipa ? String(body.ipa).trim() : existingItem?.ipa || `/${cleanSlug}/`,
      pinyinZh:
        body.pinyinZh !== undefined ? String(body.pinyinZh).trim() : existingItem?.pinyinZh || "",
      enableEnVi:
        typeof body.enableEnVi === "boolean"
          ? body.enableEnVi
          : existingItem?.enableEnVi !== undefined
            ? existingItem.enableEnVi
            : true,
      enableZhVi:
        typeof body.enableZhVi === "boolean"
          ? body.enableZhVi
          : existingItem?.enableZhVi !== undefined
            ? existingItem.enableZhVi
            : false,
      categoryId: computedCategoryId,
      category: rawCategory,
      categorySlug: computedCategorySlug,
      packCode: computedPackCode,
      badge:
        body.badge !== undefined
          ? String(body.badge).trim()
          : existingItem?.badge || "Mới ra mắt",
      showOnHome:
        typeof body.showOnHome === "boolean"
          ? body.showOnHome
          : existingItem?.showOnHome ?? false,
      price: Number(body.price) || existingItem?.price || 219000,
      originalPrice: Number(body.originalPrice) || existingItem?.originalPrice || 299000,
      description:
        body.description ||
        existingItem?.description ||
        `Thẻ học thông minh AR Poly Cards: ${body.nameVi} (${body.nameEn}).`,
      images: defaultImages,
      posterUrl: finalImageUrl,
      rawImageUrl:
        body.rawImageUrl !== undefined
          ? String(body.rawImageUrl).trim()
          : existingItem?.rawImageUrl || "",
      qrPosition:
        body.qrPosition && typeof body.qrPosition.x === "number"
          ? {
              x: Number(body.qrPosition.x),
              y: Number(body.qrPosition.y),
              size: Number(body.qrPosition.size),
            }
          : existingItem?.qrPosition,
      audioUrl: body.audioUrl || existingItem?.audioUrl || `/audio/${cleanSlug}.mp3`,
      audios: {
        en:
          body.audios?.en !== undefined && String(body.audios.en).trim() !== ""
            ? String(body.audios.en).trim()
            : existingItem?.audios?.en || "",
        vi:
          body.audios?.vi !== undefined && String(body.audios.vi).trim() !== ""
            ? String(body.audios.vi).trim()
            : existingItem?.audios?.vi || "",
        zh:
          body.audios?.zh !== undefined && String(body.audios.zh).trim() !== ""
            ? String(body.audios.zh).trim()
            : existingItem?.audios?.zh || "",
      },
      modelUrl: body.modelUrl || existingItem?.modelUrl || defaultModelGlb,
      iosModelUrl: body.iosModelUrl || existingItem?.iosModelUrl || defaultModelUsdz,
      targetUrl: body.targetUrl || existingItem?.targetUrl || `/targets/${cleanSlug}.mind`,
      animations: existingItem?.animations || ["Idle", "Walk"],
      arEnabled: true,
      buyUrl: body.buyUrl || `/order?animal=${cleanSlug}`,
      updatedAt: new Date().toISOString(),
    };

    const saved = await dbUpsertProduct(updatedItem);

    return NextResponse.json({
      success: true,
      storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
      message: `Thẻ "${saved.nameVi} (${saved.nameEn})" đã được lưu thành công vào MongoDB!`,
      data: saved,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi lưu sản phẩm";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Kiểm tra nếu có body JSON yêu cầu xóa hàng loạt
    let body: any = null;
    try {
      body = await request.json();
    } catch {}

    if (body) {
      const slugsToDelete: string[] = Array.isArray(body)
        ? body
        : Array.isArray(body.slugs)
        ? body.slugs
        : Array.isArray(body.ids)
        ? body.ids
        : [];

      if (slugsToDelete.length > 0) {
        const deletedCount = await dbDeleteProducts(slugsToDelete);
        const remaining = await dbGetProducts();

        return NextResponse.json({
          success: true,
          message: `Đã xóa thành công ${deletedCount} thẻ bài khỏi MongoDB!`,
          deletedCount,
          remainingCount: remaining.length,
        });
      }
    }

    // 2. Xóa đơn lẻ qua query parameters (?id=... hoặc ?slug=...)
    const { searchParams } = new URL(request.url);
    const idOrSlug = searchParams.get("id") || searchParams.get("slug");

    if (!idOrSlug) {
      return NextResponse.json(
        { success: false, message: "Cần cung cấp id hoặc slug để xóa thẻ bài." },
        { status: 400 }
      );
    }

    const deletedItem = await dbDeleteProduct(idOrSlug);
    if (!deletedItem) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy thẻ bài để xóa." },
        { status: 404 }
      );
    }

    const remaining = await dbGetProducts();

    return NextResponse.json({
      success: true,
      message: `Đã xóa thẻ bài "${deletedItem.nameVi} (${deletedItem.nameEn})" khỏi MongoDB!`,
      deletedItem,
      remainingCount: remaining.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi xóa sản phẩm";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export { POST as PUT };
