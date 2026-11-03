import { NextRequest, NextResponse } from "next/server";
import { dbGetProductBySlug } from "@/lib/mongodb";
import { getAnimalBySlug } from "@/lib/animals";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Missing slug parameter" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim();

    // 1. Kiểm tra thẻ mẫu đặc biệt / mặc định hệ thống
    if (cleanSlug === "polycards" || cleanSlug === "butterfly") {
      const systemItem = getAnimalBySlug("polycards");
      if (systemItem) {
        return NextResponse.json({
          success: true,
          data: {
            slug: systemItem.slug,
            nameEn: systemItem.nameEn,
            nameVi: systemItem.nameVi,
            qrCode: systemItem.qrCode,
            posterUrl: systemItem.posterUrl || "/images/cards/butterfly-card.png",
            images: systemItem.images || ["/images/cards/butterfly-card.png"],
            modelUrl: systemItem.modelUrl,
            iosModelUrl: systemItem.iosModelUrl,
            audioUrl: systemItem.audioUrl,
            audios: systemItem.audios,
            category: systemItem.category,
            categorySlug: systemItem.categorySlug,
          },
        });
      }
    }

    // 2. Tra cứu cơ sở dữ liệu MongoDB Atlas
    const dbItem = await dbGetProductBySlug(cleanSlug);
    if (dbItem) {
      return NextResponse.json({
        success: true,
        data: {
          slug: dbItem.slug,
          nameEn: dbItem.nameEn,
          nameVi: dbItem.nameVi,
          qrCode: dbItem.qrCode,
          posterUrl: dbItem.posterUrl || "/images/cards/butterfly-card.png",
          images: dbItem.images || ["/images/cards/butterfly-card.png"],
          modelUrl: dbItem.modelUrl,
          iosModelUrl: dbItem.iosModelUrl,
          audioUrl: dbItem.audioUrl,
          audios: dbItem.audios,
          category: dbItem.category,
          categorySlug: dbItem.categorySlug,
        },
      });
    }

    // 3. Fallback bộ thẻ tĩnh nếu MongoDB chưa có
    const fallbackItem = getAnimalBySlug(cleanSlug);
    if (fallbackItem) {
      return NextResponse.json({
        success: true,
        data: {
          slug: fallbackItem.slug,
          nameEn: fallbackItem.nameEn,
          nameVi: fallbackItem.nameVi,
          qrCode: fallbackItem.qrCode,
          posterUrl: fallbackItem.posterUrl || "/images/cards/butterfly-card.png",
          images: fallbackItem.images || ["/images/cards/butterfly-card.png"],
          modelUrl: fallbackItem.modelUrl,
          iosModelUrl: fallbackItem.iosModelUrl,
          audioUrl: fallbackItem.audioUrl,
          audios: fallbackItem.audios,
          category: fallbackItem.category,
          categorySlug: fallbackItem.categorySlug,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Thẻ bài không tồn tại" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("API /api/products/[slug] error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi truy vấn thẻ bài" },
      { status: 500 }
    );
  }
}
