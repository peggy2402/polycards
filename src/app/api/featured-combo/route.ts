import { NextRequest, NextResponse } from "next/server";
import { CardComboPack, DEFAULT_FEATURED_COMBO } from "@/data/combos";
import { dbGetFeaturedCombo, dbSaveFeaturedCombo, isMongoConfigured } from "@/lib/mongodb";

export async function GET() {
  try {
    const data = await dbGetFeaturedCombo();
    return NextResponse.json({
      success: true,
      storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
      data,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi đọc cấu hình Combo";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const price = Number(body.price) || DEFAULT_FEATURED_COMBO.price;
    const originalPrice =
      Number(body.originalPrice) || DEFAULT_FEATURED_COMBO.originalPrice;
    const discountPercent =
      originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    const updated: CardComboPack = {
      id: body.id || DEFAULT_FEATURED_COMBO.id,
      name: String(body.name || DEFAULT_FEATURED_COMBO.name).trim(),
      packCode: String(body.packCode || DEFAULT_FEATURED_COMBO.packCode)
        .trim()
        .toUpperCase(),
      categoryName: String(
        body.categoryName || DEFAULT_FEATURED_COMBO.categoryName
      ).trim(),
      categorySlug: String(
        body.categorySlug || DEFAULT_FEATURED_COMBO.categorySlug
      ).trim(),
      cardsCount: Number(body.cardsCount) || 120,
      price,
      originalPrice,
      discountPercent,
      badge: body.badge !== undefined ? String(body.badge).trim() : DEFAULT_FEATURED_COMBO.badge,
      subBadge:
        body.subBadge !== undefined
          ? String(body.subBadge).trim()
          : DEFAULT_FEATURED_COMBO.subBadge,
      imageSrc:
        String(body.imageSrc || "").trim() || DEFAULT_FEATURED_COMBO.imageSrc,
      sampleSlug:
        String(body.sampleSlug || "").trim() || DEFAULT_FEATURED_COMBO.sampleSlug,
      targetUrl:
        String(body.targetUrl || "").trim() || "/products",
      description:
        String(body.description || "").trim() ||
        DEFAULT_FEATURED_COMBO.description,
      highlights: Array.isArray(body.highlights)
        ? body.highlights.map((h: string) => String(h).trim()).filter(Boolean)
        : DEFAULT_FEATURED_COMBO.highlights,
      isFeatured: true,
    };

    const saved = await dbSaveFeaturedCombo(updated);

    return NextResponse.json({
      success: true,
      storage: isMongoConfigured() ? "mongodb-atlas" : "in-memory-fallback",
      message: "Đã cập nhật Khối Combo Trang Chủ (#products) thành công!",
      data: saved,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi lưu cấu hình Combo";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

