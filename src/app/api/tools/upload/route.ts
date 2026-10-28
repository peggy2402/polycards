import { NextRequest, NextResponse } from "next/server";
import { GridFSBucket } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

const STATIC_MODELS = new Set([
  "cat.glb",
  "cat.usdz",
  "deer.glb",
  "deer.usdz",
  "dog.glb",
  "dog.usdz",
  "elephant.glb",
  "elephant.usdz",
  "lion.glb",
  "lion.usdz",
  "panda.glb",
  "panda.usdz",
]);

const STATIC_TARGETS = new Set([
  "cat.mind",
  "deer.mind",
  "dog.mind",
  "elephant.mind",
  "lion.mind",
  "panda.mind",
]);

function getMimeTypeByExt(ext: string, fallback: string): string {
  switch (ext) {
    case ".glb":
      return "model/gltf-binary";
    case ".gltf":
      return "model/gltf+json";
    case ".usdz":
      return "model/vnd.usdz+zip";
    case ".mind":
      return "application/octet-stream";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return fallback || "application/octet-stream";
  }
}

/**
 * GET /api/tools/upload?file=<fileName>
 * Stream trực tiếp tệp .glb, .usdz, .mind, .mp3, ảnh từ MongoDB Atlas GridFS
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");

    if (!fileName) {
      return NextResponse.json(
        { success: false, message: "Thiếu tham số tên tệp (?file=...)." },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json(
        { success: false, message: "Chưa kết nối MongoDB Atlas." },
        { status: 503 }
      );
    }

    const bucket = new GridFSBucket(db, { bucketName: "assets" });
    const files = await bucket.find({ filename: fileName }).sort({ uploadDate: -1 }).limit(1).toArray();

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: `Không tìm thấy tệp "${fileName}" trên MongoDB GridFS.` },
        { status: 404 }
      );
    }

    const fileDoc = files[0];
    const dotIndex = fileName.lastIndexOf(".");
    const ext = dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
    const contentType =
      (fileDoc.metadata?.contentType as string) ||
      getMimeTypeByExt(ext, "application/octet-stream");

    const downloadStream = bucket.openDownloadStreamByName(fileName);
    const chunks: Buffer[] = [];

    for await (const chunk of downloadStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const fileBuffer = Buffer.concat(chunks);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.length),
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi đọc tệp từ GridFS";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

/**
 * POST /api/tools/upload
 * Lưu trữ tệp 3D (.glb, .usdz), Target (.mind), Audio (.mp3) lên MongoDB Atlas GridFS
 * (Không giới hạn 16MB nhờ cơ chế chia chunk tự động của GridFS)
 */
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

    const mimeType = getMimeTypeByExt(ext, file.type);
    const db = await getMongoDb();

    if (db) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const bucket = new GridFSBucket(db, { bucketName: "assets" });

      // Xóa các bản ghi GridFS cũ trùng tên để tránh rác dung lượng
      const existingFiles = await bucket.find({ filename: finalFileName }).toArray();
      for (const oldFile of existingFiles) {
        await bucket.delete(oldFile._id);
      }

      // Ghi luồng dữ liệu mới vào GridFSBucket (tự động chia thành các chunk 255KB)
      await new Promise<void>((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(finalFileName, {
          metadata: {
            fileType,
            contentType: mimeType,
            originalName,
            size: buffer.length,
            updatedAt: new Date().toISOString(),
          },
        });

        uploadStream.on("error", (err) => reject(err));
        uploadStream.on("finish", () => resolve());
        uploadStream.end(buffer);
      });

      const gridFsUrl = `/api/tools/upload?file=${encodeURIComponent(finalFileName)}`;

      return NextResponse.json({
        success: true,
        storage: "mongodb-gridfs",
        message: `Đã lưu tệp "${finalFileName}" lên MongoDB Atlas GridFS thành công!`,
        fileName: finalFileName,
        size: file.size,
        url: gridFsUrl,
        fileType,
      });
    }

    // Fallback nếu chưa cấu hình MongoDB: Trả về đường dẫn tĩnh nếu trùng với 6 mẫu có sẵn
    const fallbackUrl =
      STATIC_MODELS.has(finalFileName) || STATIC_TARGETS.has(finalFileName)
        ? `/${subFolder}/${finalFileName}`
        : `/${subFolder}/${finalFileName}`;

    return NextResponse.json({
      success: true,
      storage: "static-fallback",
      message: `Đã nhận tệp "${finalFileName}".`,
      fileName: finalFileName,
      size: file.size,
      url: fallbackUrl,
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
