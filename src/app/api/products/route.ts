import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import animalsData from "../../../../data/animals.json";
import { Animal } from "@/types/animal";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "animals.json");

// Helper đọc dữ liệu mới nhất từ file animals.json
async function readAnimalsData(): Promise<Animal[]> {
  try {
    if (fsSync.existsSync(DATA_FILE_PATH)) {
      const content = await fs.readFile(DATA_FILE_PATH, "utf8");
      return JSON.parse(content) as Animal[];
    }
  } catch (err) {
    console.warn("Lỗi đọc file data/animals.json, fallback sang JSON import:", err);
  }
  return animalsData as Animal[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q");

    const rawList = await readAnimalsData();

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

    const currentList = await readAnimalsData();
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

    const updatedItem: Animal = {
      id: body.id || (existingIndex >= 0 ? currentList[existingIndex].id : `${cleanSlug}-00${currentList.length + 1}`),
      slug: cleanSlug,
      qrCode: body.qrCode || (existingIndex >= 0 ? currentList[existingIndex].qrCode : `AR-${cleanSlug.toUpperCase()}-00${currentList.length + 1}`),
      nameEn: body.nameEn,
      nameVi: body.nameVi,
      nameZh: body.nameZh || (existingIndex >= 0 ? currentList[existingIndex].nameZh : ""),
      ipa: body.ipa || (existingIndex >= 0 ? currentList[existingIndex].ipa : `/${cleanSlug}/`),
      pinyinZh: body.pinyinZh || (existingIndex >= 0 ? currentList[existingIndex].pinyinZh : ""),
      category: body.category,
      categorySlug: body.categorySlug || cleanSlug,
      badge: body.badge || (existingIndex >= 0 ? currentList[existingIndex].badge : "Mới ra mắt"),
      price: Number(body.price) || (existingIndex >= 0 ? currentList[existingIndex].price : 219000),
      originalPrice: Number(body.originalPrice) || (existingIndex >= 0 ? currentList[existingIndex].originalPrice : 299000),
      description: body.description || (existingIndex >= 0 ? currentList[existingIndex].description : `Thẻ học thông minh AR Poly Cards: ${body.nameVi} (${body.nameEn}).`),
      images: Array.isArray(body.images) && body.images.length > 0
        ? body.images
        : (existingIndex >= 0 ? currentList[existingIndex].images : [body.posterUrl || "/images/animals/lion.jpg"]),
      posterUrl: body.posterUrl || (existingIndex >= 0 ? currentList[existingIndex].posterUrl : "/images/posters/lion-poster.jpg"),
      audioUrl: existingIndex >= 0 ? currentList[existingIndex].audioUrl : `/audio/${cleanSlug}.mp3`,
      audios: existingIndex >= 0 && currentList[existingIndex].audios ? currentList[existingIndex].audios : {
        en: `/audio/en/${cleanSlug}.mp3`,
        vi: `/audio/vi/${cleanSlug}.mp3`,
        zh: `/audio/zh/${cleanSlug}.mp3`,
      },
      modelUrl: body.modelUrl || (existingIndex >= 0 ? currentList[existingIndex].modelUrl : defaultModelGlb),
      iosModelUrl: body.iosModelUrl || (existingIndex >= 0 ? currentList[existingIndex].iosModelUrl : defaultModelUsdz),
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

    // Ghi trực tiếp xuống file data/animals.json
    try {
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(newList, null, 2), "utf8");
    } catch (fsErr) {
      console.warn("Không thể ghi file data/animals.json (có thể trên serverless):", fsErr);
    }

    return NextResponse.json({
      success: true,
      message: `Thẻ "${updatedItem.nameVi} (${updatedItem.nameEn})" đã được lưu thành công vào data/animals.json!`,
      data: updatedItem,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
