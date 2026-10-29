import { NextRequest, NextResponse } from "next/server";
import { Binary, GridFSBucket } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

interface UploadTempChunkDoc {
  uploadId: string;
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  data: Binary;
  createdAt: Date;
}

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
 * Stream trực tiếp tệp .glb, .usdz, .mind, .mp3 từ MongoDB Atlas GridFS bằng Web ReadableStream
 * (Không giới hạn 4.5MB nhờ cơ chế HTTP Streaming của Next.js App Router)
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
    const files = await bucket
      .find({ filename: fileName })
      .sort({ uploadDate: -1 })
      .limit(1)
      .toArray();

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

    const downloadStream = bucket.openDownloadStream(fileDoc._id);

    const webStream = new ReadableStream({
      start(controller) {
        downloadStream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        downloadStream.on("end", () => {
          controller.close();
        });
        downloadStream.on("error", (err) => {
          controller.error(err);
        });
      },
      cancel() {
        downloadStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileDoc.length),
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
 * Hỗ trợ Chunked Upload (2MB / mảnh) để vượt giới hạn 4.5MB Payload của Vercel Serverless!
 * Khi nhận đủ các mảnh, tự động ghép vào MongoDB Atlas GridFSBucket("assets").
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("type") as string) || "model";
    const customName = formData.get("name") as string | null;
    const originalFileNameParam = (formData.get("originalFileName") as string) || file?.name || "asset.glb";
    const uploadId = (formData.get("uploadId") as string) || `up-${Date.now()}`;
    const chunkIndex = Number(formData.get("chunkIndex") ?? 0);
    const totalChunks = Number(formData.get("totalChunks") ?? 1);
    const totalSize = Number(formData.get("totalSize") ?? file?.size ?? 0);

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy dữ liệu tệp tải lên." },
        { status: 400 }
      );
    }

    const dotIndex = originalFileNameParam.lastIndexOf(".");
    const ext = dotIndex >= 0 ? originalFileNameParam.slice(dotIndex).toLowerCase() : "";

    let subFolder = "models";
    if (fileType === "target" || ext === ".mind") {
      subFolder = "targets";
    } else if (fileType === "audio" || [".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) {
      subFolder = "audio";
    } else if (fileType === "image" || [".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      subFolder = "images/cards";
    }

    const rawBaseName =
      dotIndex > 0 ? originalFileNameParam.slice(0, dotIndex) : originalFileNameParam;
    const cleanBaseName =
      rawBaseName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_") || "asset";

    let finalFileName = `${cleanBaseName}${ext}`;
    if (customName && customName.trim()) {
      const cleanCustom = customName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-");
      finalFileName = `${cleanCustom}${ext}`;
    }

    const mimeType = getMimeTypeByExt(ext, file.type);
    const chunkBuffer = Buffer.from(await file.arrayBuffer());
    const db = await getMongoDb();

    if (!db) {
      return NextResponse.json({
        success: true,
        storage: "static-fallback",
        message: `Đã nhận tệp "${finalFileName}".`,
        fileName: finalFileName,
        size: totalSize,
        url: `/${subFolder}/${finalFileName}`,
        fileType,
      });
    }

    const bucket = new GridFSBucket(db, { bucketName: "assets" });

    // TRƯỜNG HỢP 1: Tệp nhỏ chỉ có 1 mảnh duy nhất (totalChunks <= 1) -> Ghi thẳng vào GridFS
    if (totalChunks <= 1) {
      const existingFiles = await bucket.find({ filename: finalFileName }).toArray();
      for (const oldFile of existingFiles) {
        await bucket.delete(oldFile._id);
      }

      await new Promise<void>((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(finalFileName, {
          metadata: {
            fileType,
            contentType: mimeType,
            originalName: originalFileNameParam,
            size: chunkBuffer.length,
            updatedAt: new Date().toISOString(),
          },
        });
        uploadStream.on("error", (err) => reject(err));
        uploadStream.on("finish", () => resolve());
        uploadStream.end(chunkBuffer);
      });

      const gridFsUrl = `/api/tools/upload?file=${encodeURIComponent(finalFileName)}`;
      return NextResponse.json({
        success: true,
        completed: true,
        storage: "mongodb-gridfs",
        message: `Đã lưu tệp "${finalFileName}" lên MongoDB Atlas GridFS thành công!`,
        fileName: finalFileName,
        size: chunkBuffer.length,
        url: gridFsUrl,
        fileType,
      });
    }

    // TRƯỜNG HỢP 2: Tệp lớn (>= 2MB, ví dụ 5MB - 50MB) được cắt thành nhiều mảnh 2MB
    const chunksCol = db.collection<UploadTempChunkDoc>("upload_temp_chunks");

    // Đảm bảo compound index để MongoDB sắp xếp theo index, không tốn bộ nhớ in-memory sort limit (32MB)
    await chunksCol.createIndex({ uploadId: 1, chunkIndex: 1 }).catch(() => {});
    await chunksCol.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }).catch(() => {});

    await chunksCol.updateOne(
      { uploadId, chunkIndex },
      {
        $set: {
          uploadId,
          fileName: finalFileName,
          chunkIndex,
          totalChunks,
          data: new Binary(chunkBuffer),
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Nếu chưa phải mảnh cuối cùng -> Trả về trạng thái tiến độ cho Client gửi tiếp mảnh sau
    if (chunkIndex < totalChunks - 1) {
      return NextResponse.json({
        success: true,
        completed: false,
        chunkIndex,
        totalChunks,
        message: `Đã nhận mảnh ${chunkIndex + 1}/${totalChunks}`,
      });
    }

    // Khi đã nhận mảnh cuối cùng -> Ghép trực tiếp từ Cursor vào GridFSBucket (Streaming không tải cả mảng vào RAM)
    const existingFiles = await bucket.find({ filename: finalFileName }).toArray();
    for (const oldFile of existingFiles) {
      await bucket.delete(oldFile._id);
    }

    const cursor = chunksCol.find({ uploadId }).sort({ chunkIndex: 1 });

    await new Promise<void>((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(finalFileName, {
        metadata: {
          fileType,
          contentType: mimeType,
          originalName: originalFileNameParam,
          size: totalSize,
          updatedAt: new Date().toISOString(),
        },
      });

      uploadStream.on("error", (err) => reject(err));
      uploadStream.on("finish", () => resolve());

      (async () => {
        try {
          for await (const c of cursor) {
            const rawBuf = Buffer.from(c.data.buffer);
            uploadStream.write(rawBuf);
          }
          uploadStream.end();
        } catch (streamErr) {
          uploadStream.destroy(streamErr as Error);
          reject(streamErr);
        }
      })();
    });

    // Dọn dẹp các mảnh tạm sau khi đã ghép thành công vào GridFS
    await chunksCol.deleteMany({ uploadId });

    const gridFsUrl = `/api/tools/upload?file=${encodeURIComponent(finalFileName)}`;

    return NextResponse.json({
      success: true,
      completed: true,
      storage: "mongodb-gridfs",
      message: `Đã tải lên và ghép tệp "${finalFileName}" (${(totalSize / (1024 * 1024)).toFixed(1)} MB) vào MongoDB GridFS thành công!`,
      fileName: finalFileName,
      size: totalSize,
      url: gridFsUrl,
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
