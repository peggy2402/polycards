import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import animalsData from "../../../../data/animals.json";
import { Animal } from "@/types/animal";
import { readJsonDataSafe, writeJsonDataSafe } from "@/lib/server-storage";

// Helper đọc dữ liệu sản phẩm mới nhất an toàn trên cả Local và Vercel
async function readProductsData(): Promise<Animal[]> {
  const fromProducts = await readJsonDataSafe<Animal[] | null>("products.json", null);
  if (fromProducts && Array.isArray(fromProducts) && fromProducts.length > 0) {
    return fromProducts;
  }
  const fromAnimals = await readJsonDataSafe<Animal[] | null>("animals.json", null);
  if (fromAnimals && Array.isArray(fromAnimals) && fromAnimals.length > 0) {
    return fromAnimals;
  }
  return animalsData as Animal[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q");

    const rawList = await readProductsData();

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
      total: list.length,
      data: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.nameEn || !body.nameVi || !body.category) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin bắt buộc (Tên thẻ, Danh mục)." },
        { status: 400 }
      );
    }

    const currentList = await readProductsData();
    const cleanSlug = (body.slug || body.nameEn).toLowerCase().trim().replace(/\s+/g, "-");

    // Kiểm tra xem thẻ đã tồn tại chưa (theo slug hoặc id)
    const existingIndex = currentList.findIndex(
      (a) => a.slug.toLowerCase() === cleanSlug || (body.id && a.id === body.id)
    );

    // Kiểm tra xem model 3D có tồn tại trên ổ đĩa không
    const modelPathGlb = path.join(process.cwd(), "public", "models", `${cleanSlug}.glb`);
    const modelPathUsdz = path.join(process.cwd(), "public", "models", `${cleanSlug}.usdz`);
    const hasGlb = fsSync.existsSync(modelPathGlb);
    const hasUsdz = fsSync.existsSync(modelPathUsdz);

    const defaultModelGlb = hasGlb ? `/models/${cleanSlug}.glb` : "/models/lion.glb";
    const defaultModelUsdz = hasUsdz ? `/models/${cleanSlug}.usdz` : "/models/lion.usdz";

    // Xử lý ảnh: Nếu là chuỗi Base64 (từ canvas hoặc upload), lưu thành file tĩnh trong public/images/cards
    let finalImageUrl = body.posterUrl || (Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : "");
    if (finalImageUrl && finalImageUrl.startsWith("data:image/")) {
      try {
        const match = finalImageUrl.match(/^data:image\/(\w+);base64,/);
        const ext = match ? (match[1] === "jpeg" ? "jpg" : match[1]) : "jpg";
        const fileName = `${cleanSlug}-card.${ext}`;
        const cardsDir = path.join(process.cwd(), "public", "images", "cards");
        await fs.mkdir(cardsDir, { recursive: true });
        const base64Data = finalImageUrl.replace(/^data:image\/\w+;base64,/, "");
        await fs.writeFile(path.join(cardsDir, fileName), Buffer.from(base64Data, "base64"));
        finalImageUrl = `/images/cards/${fileName}`;
      } catch (imgErr) {
        console.warn("Lỗi lưu file ảnh card ra ổ đĩa, fallback ảnh mẫu:", imgErr);
        finalImageUrl = "/images/cards/jump-template.jpg";
      }
    }

    const defaultImages = finalImageUrl
      ? [finalImageUrl]
      : (existingIndex >= 0 ? currentList[existingIndex].images : ["/images/cards/jump-template.jpg"]);

    // Chuẩn hóa categorySlug và categoryId chính xác theo tên danh mục
    const rawCategory = (body.category || "Động Vật").trim();
    let computedCategorySlug = body.categorySlug;
    if (!computedCategorySlug || computedCategorySlug === cleanSlug) {
      const catLower = rawCategory.toLowerCase();
      if (catLower.includes("hành động") || catLower.includes("hanh-dong")) {
        computedCategorySlug = "hanh-dong";
      } else if (catLower.includes("phương tiện") || catLower.includes("xe cộ") || catLower.includes("phuong-tien")) {
        computedCategorySlug = "phuong-tien";
      } else if (catLower.includes("trái cây") || catLower.includes("hoa quả") || catLower.includes("trai-cay")) {
        computedCategorySlug = "trai-cay";
      } else {
        computedCategorySlug = "dong-vat";
      }
    }
    const computedCategoryId = body.categoryId || `cat-${computedCategorySlug}`;
    const computedPackCode = body.packCode || `POLY30-${computedCategorySlug.replace(/-/g, "").toUpperCase()}`;

    const updatedItem: Animal = {
      id: body.id || (existingIndex >= 0 ? currentList[existingIndex].id : `${cleanSlug}-00${currentList.length + 1}`),
      slug: cleanSlug,
      qrCode: body.qrCode || (existingIndex >= 0 ? currentList[existingIndex].qrCode : `AR-${cleanSlug.toUpperCase()}-00${currentList.length + 1}`),
      nameEn: body.nameEn,
      nameVi: body.nameVi,
      nameZh: body.nameZh || (existingIndex >= 0 ? currentList[existingIndex].nameZh : ""),
      ipa: body.ipa || (existingIndex >= 0 ? currentList[existingIndex].ipa : `/${cleanSlug}/`),
      pinyinZh: body.pinyinZh || (existingIndex >= 0 ? currentList[existingIndex].pinyinZh : ""),
      categoryId: computedCategoryId,
      category: rawCategory,
      categorySlug: computedCategorySlug,
      packCode: computedPackCode,
      badge: body.badge || (existingIndex >= 0 ? currentList[existingIndex].badge : "Mới ra mắt"),
      price: Number(body.price) || (existingIndex >= 0 ? currentList[existingIndex].price : 219000),
      originalPrice: Number(body.originalPrice) || (existingIndex >= 0 ? currentList[existingIndex].originalPrice : 299000),
      description: body.description || (existingIndex >= 0 ? currentList[existingIndex].description : `Thẻ học thông minh AR Poly Cards: ${body.nameVi} (${body.nameEn}).`),
      images: defaultImages,
      posterUrl: finalImageUrl || (existingIndex >= 0 ? currentList[existingIndex].posterUrl : "/images/cards/jump-template.jpg"),
      audioUrl: body.audioUrl || (existingIndex >= 0 ? currentList[existingIndex].audioUrl : `/audio/${cleanSlug}.mp3`),
      audios: existingIndex >= 0 && currentList[existingIndex].audios ? currentList[existingIndex].audios : {
        en: `/audio/en/${cleanSlug}.mp3`,
        vi: `/audio/vi/${cleanSlug}.mp3`,
        zh: `/audio/zh/${cleanSlug}.mp3`,
      },
      modelUrl: body.modelUrl || (existingIndex >= 0 ? currentList[existingIndex].modelUrl : defaultModelGlb),
      iosModelUrl: body.iosModelUrl || (existingIndex >= 0 ? currentList[existingIndex].iosModelUrl : defaultModelUsdz),
      targetUrl: body.targetUrl || (existingIndex >= 0 ? (currentList[existingIndex] as any).targetUrl : undefined),
      animations: existingIndex >= 0 && currentList[existingIndex].animations ? currentList[existingIndex].animations : ["Idle", "Walk"],
      arEnabled: true,
      buyUrl: body.buyUrl || `/order?animal=${cleanSlug}`,
      updatedAt: new Date().toISOString(),
    };


    let newList: Animal[];
    if (existingIndex >= 0) {
      newList = [...currentList];
      newList[existingIndex] = { ...newList[existingIndex], ...updatedItem };
    } else {
      newList = [...currentList, updatedItem];
    }

    // Ghi đồng bộ an toàn (tự động xử lý EROFS trên Vercel Serverless)
    await writeJsonDataSafe("products.json", newList);
    await writeJsonDataSafe("animals.json", newList);

    return NextResponse.json({
      success: true,
      message: `Thẻ "${updatedItem.nameVi} (${updatedItem.nameEn})" đã được lưu thành công vào data/products.json!`,
      data: updatedItem,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idOrSlug = searchParams.get("id") || searchParams.get("slug");

    if (!idOrSlug) {
      return NextResponse.json(
        { success: false, message: "Cần cung cấp id hoặc slug để xóa thẻ bài." },
        { status: 400 }
      );
    }

    const currentList = await readProductsData();
    const clean = idOrSlug.toLowerCase().trim();
    const targetItem = currentList.find(
      (a) => a.id === idOrSlug || a.slug.toLowerCase() === clean
    );

    if (!targetItem) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy thẻ bài để xóa." },
        { status: 404 }
      );
    }

    const filtered = currentList.filter(
      (a) => a.id !== idOrSlug && a.slug.toLowerCase() !== clean
    );

    // Ghi an toàn chống lỗi EROFS trên Vercel Serverless
    await writeJsonDataSafe("products.json", filtered);
    await writeJsonDataSafe("animals.json", filtered);

    return NextResponse.json({
      success: true,
      message: `Đã xóa thẻ bài "${targetItem.nameVi} (${targetItem.nameEn})" thành công khỏi hệ thống!`,
      deletedItem: targetItem,
      remainingCount: filtered.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export { POST as PUT };

