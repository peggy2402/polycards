import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.trim();
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID?.trim();
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim();
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME?.trim() || "polycards-assets";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_DOMAIN)?.trim();

/**
 * Kiểm tra xem các biến môi trường Cloudflare R2 đã được cấu hình đầy đủ chưa
 */
export function isR2Configured(): boolean {
  return Boolean(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET_NAME &&
    R2_PUBLIC_URL
  );
}

let r2Client: S3Client | null = null;

export function getR2Client(): S3Client | null {
  if (!isR2Configured()) return null;
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2Client;
}

/**
 * Tải trực tiếp dữ liệu nhị phân lên Cloudflare R2
 * @param fileBuffer Nội dung file dạng Buffer hoặc Uint8Array
 * @param fileName Tên file cần lưu (ví dụ: captreo.glb)
 * @param contentType MIME type tương ứng (ví dụ: model/gltf-binary)
 * @returns URL công khai hoàn chỉnh của file trên Cloudflare R2 CDN
 */
export async function uploadToR2(
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  if (!client) {
    throw new Error("Cloudflare R2 chưa được cấu hình đầy đủ các biến môi trường.");
  }

  // Chuẩn hóa tên file: chỉ giữ ký tự chữ, số, gạch dưới, gạch ngang và dấu chấm
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanName,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  const baseUrl = R2_PUBLIC_URL!.replace(/\/+$/, "");
  return `${baseUrl}/${cleanName}`;
}

/**
 * Xóa file khỏi Cloudflare R2
 */
export async function deleteFromR2(fileName: string): Promise<boolean> {
  try {
    const client = getR2Client();
    if (!client) return false;
    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: cleanName,
      })
    );
    return true;
  } catch (err) {
    console.warn("Lỗi khi xóa file khỏi Cloudflare R2:", err);
    return false;
  }
}

