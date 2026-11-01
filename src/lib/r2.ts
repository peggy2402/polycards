import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

export function getR2PublicFileUrl(fileName: string): string | null {
  if (!isR2Configured()) return null;
  const baseUrl = R2_PUBLIC_URL!.replace(/\/+$/, "");
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${baseUrl}/${cleanName}`;
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
 * Tạo Presigned URL cho phép trình duyệt tải trực tiếp tệp lên Cloudflare R2
 * Bỏ qua hoàn toàn giới hạn dung lượng 4.5MB của Vercel Serverless Function
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const client = getR2Client();
  if (!client) {
    throw new Error("Cloudflare R2 chưa được cấu hình đầy đủ các biến môi trường.");
  }
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanName,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const baseUrl = R2_PUBLIC_URL!.replace(/\/+$/, "");
  const publicUrl = `${baseUrl}/${cleanName}`;
  return { uploadUrl, publicUrl };
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

export interface R2ObjectItem {
  key: string;
  size: number;
  lastModified?: Date;
  url: string;
}

/**
 * Liệt kê danh sách tất cả các tệp hiện có trong bucket Cloudflare R2
 */
export async function listR2Objects(prefix?: string): Promise<R2ObjectItem[]> {
  const client = getR2Client();
  if (!client) {
    throw new Error("Cloudflare R2 chưa được cấu hình.");
  }

  const items: R2ObjectItem[] = [];
  let continuationToken: string | undefined = undefined;
  const baseUrl = R2_PUBLIC_URL!.replace(/\/+$/, "");

  do {
    const res: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })
    );

    if (res.Contents) {
      for (const obj of res.Contents) {
        if (obj.Key) {
          items.push({
            key: obj.Key,
            size: obj.Size || 0,
            lastModified: obj.LastModified,
            url: `${baseUrl}/${obj.Key}`,
          });
        }
      }
    }

    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  return items;
}


