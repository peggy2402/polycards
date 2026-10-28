import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

interface UploadedAssetDoc {
  fileName: string;
  fileType: string;
  mimeType: string;
  size: number;
  base64Data?: string;
  publicUrl: string;
  updatedAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("type") as string) || "model";
    const customName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy tệp tải lên." },
        { status: 400 }
      );
    }

    const originalName = file.name;
    const dotIndex = originalName.lastIndexOf(".");
    const ext = dotIndex >= 0 ? originalName.slice(dotIndex).toLowerCase() : "";

    let subFolder = "models";
    if (fileType === "target" || ext === ".mind") {
      subFolder = "targets";
    } else if (fileType === "audio" || [".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) {
      subFolder = "audio";
    } else if (fileType === "image" || [".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      subFolder = "images/cards";
    }

    let finalFileName = originalName;
    if (customName && customName.trim()) {
      const cleanCustom = customName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-");
      finalFileName = `${cleanCustom}${ext}`;
    }

    const publicUrl = `/${subFolder}/${finalFileName}`;

    // Lưu metadata (và nội dung nếu file nhỏ <= 10MB) lên MongoDB Atlas thay vì ghi vào ổ đĩa Serverless
    const db = await getMongoDb();
    if (db) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const doc: UploadedAssetDoc = {
        fileName: finalFileName,
        fileType,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        publicUrl,
        updatedAt: new Date().toISOString(),
      };
      if (buffer.length <= 10 * 1024 * 1024) {
        doc.base64Data = buffer.toString("base64");
      }
      await db
        .collection<UploadedAssetDoc>("assets")
        .updateOne({ fileName: finalFileName }, { $set: doc }, { upsert: true });
    }

    return NextResponse.json({
      success: true,
      message: `Tải lên tệp "${finalFileName}" thành công!`,
      fileName: finalFileName,
      size: file.size,
      url: publicUrl,
      fileType,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi tải tệp";
    return NextResponse.json(
      { success: false, message: `Lỗi tải tệp: ${msg}` },
      { status: 500 }
    );
  }
}
