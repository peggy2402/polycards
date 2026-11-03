import { NextRequest, NextResponse } from "next/server";
import { dbGetProductBySlug } from "@/lib/mongodb";
import { getAnimalBySlug } from "@/lib/animals";
import { Animal } from "@/types/animal";

interface ScanCardSummary {
  slug: string;
  nameEn: string;
  nameVi: string;
  posterUrl: string;
}

const SLUG_REGEX = /^[a-z0-9-]{1,64}$/;

/**
 * Chuẩn hóa alias hệ thống: 'butterfly' và 'polycards' là hai tên gọi tương đương của thẻ mẫu
 */
function normalizeSystemSlug(raw: string): string {
  const clean = raw.toLowerCase().trim();
  if (clean === "butterfly" || clean === "polycards") {
    return "polycards";
  }
  return clean;
}

/**
 * Chuyển đổi dữ liệu thẻ thành định dạng công khai rút gọn cho việc quét & kiểm tra
 */
function toPublicCard(item: Animal): ScanCardSummary {
  return {
    slug: item.slug,
    nameEn: item.nameEn,
    nameVi: item.nameVi,
    posterUrl: item.posterUrl || item.images?.[0] || "/images/cards/butterfly-card.png",
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug || !SLUG_REGEX.test(slug.trim().toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Tham số slug không hợp lệ (chỉ chấp nhận a-z, 0-9, dấu gạch nối, tối đa 64 ký tự)" },
        {
          status: 400,
          headers: {
            "Cache-Control": "public, s-maxage=30",
          },
        }
      );
    }

    const cleanSlug = normalizeSystemSlug(slug);

    // 1. Kiểm tra thẻ mẫu đặc biệt / mặc định hệ thống
    if (cleanSlug === "polycards") {
      const systemItem = getAnimalBySlug("polycards");
      if (systemItem) {
        return NextResponse.json(
          {
            success: true,
            data: toPublicCard(systemItem),
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
          }
        );
      }
    }

    // 2. Tra cứu cơ sở dữ liệu MongoDB Atlas
    const dbItem = await dbGetProductBySlug(cleanSlug);
    if (dbItem) {
      return NextResponse.json(
        {
          success: true,
          data: toPublicCard(dbItem),
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    // 3. Fallback bộ thẻ tĩnh
    const fallbackItem = getAnimalBySlug(cleanSlug);
    if (fallbackItem) {
      return NextResponse.json(
        {
          success: true,
          data: toPublicCard(fallbackItem),
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    return NextResponse.json(
      { success: false, error: "Thẻ bài không tồn tại" },
      {
        status: 404,
        headers: {
          "Cache-Control": "public, s-maxage=30",
        },
      }
    );
  } catch (error: any) {
    console.error("API /api/products/[slug] error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi truy vấn thẻ bài" },
      { status: 500 }
    );
  }
}
