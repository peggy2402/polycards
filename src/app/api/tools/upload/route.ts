import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("type") as string) || "model"; // "model" | "target" | "audio" | "image"
    let customName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy tệp tải lên." },
        { status: 400 }
      );
    }

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();

    // Xác định thư mục lưu trữ dựa trên fileType hoặc đuôi mở rộng
    let targetDir = "models";
    let subFolder = "models";

    if (fileType === "target" || ext === ".mind") {
      targetDir = "targets";
      subFolder = "targets";
    } else if (fileType === "audio" || [".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) {
      targetDir = "audio";
      subFolder = "audio";
    } else if (fileType === "image" || [".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      targetDir = "images/cards";
      subFolder = "images/cards";
    } else if (fileType === "model" || [".glb", ".gltf", ".usdz"].includes(ext)) {
      targetDir = "models";
      subFolder = "models";
    }

    // Đặt tên tệp lưu trữ sạch sẽ
    let finalFileName = originalName;
    if (customName && customName.trim()) {
      const cleanCustom = customName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
      finalFileName = `${cleanCustom}${ext}`;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadPathDir = path.join(process.cwd(), "public", targetDir);

    if (!fs.existsSync(uploadPathDir)) {
      fs.mkdirSync(uploadPathDir, { recursive: true });
    }

    const fullFilePath = path.join(uploadPathDir, finalFileName);
    fs.writeFileSync(fullFilePath, buffer);

    console.log(
      `[API Upload Success] Type: ${fileType} | File: ${finalFileName} (${(buffer.length / 1024).toFixed(1)} KB) -> ${fullFilePath}`
    );

    const publicUrl = `/${subFolder}/${finalFileName}`;

    return NextResponse.json({
      success: true,
      message: `Tải lên tệp "${finalFileName}" thành công!`,
      fileName: finalFileName,
      size: buffer.length,
      url: publicUrl,
      fileType,
    });
  } catch (error: any) {
    console.error("[API Upload Error]:", error);
    return NextResponse.json(
      { success: false, message: `Lỗi tải tệp: ${error.message}` },
      { status: 500 }
    );
  }
}
