import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

/**
 * Đọc an toàn file JSON data:
 * 1. Ưu tiên đọc từ /tmp (nếu có bản cập nhật mới nhất do Serverless ghi)
 * 2. Đọc từ data/ của dự án (môi trường Local / ban đầu)
 * 3. Fallback về fallbackData nếu không đọc được
 */
export async function readJsonDataSafe<T>(fileName: string, fallbackData: T): Promise<T> {
  const tmpPath = path.join("/tmp", fileName);
  const localPath = path.join(process.cwd(), "data", fileName);

  try {
    if (fsSync.existsSync(tmpPath)) {
      const content = await fs.readFile(tmpPath, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.warn(`[Storage Safe] Lỗi đọc /tmp/${fileName}:`, err);
  }

  try {
    if (fsSync.existsSync(localPath)) {
      const content = await fs.readFile(localPath, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.warn(`[Storage Safe] Lỗi đọc data/${fileName}:`, err);
  }

  return fallbackData;
}

/**
 * Ghi an toàn file JSON data trên cả Local và Vercel Serverless:
 * 1. Thử ghi vào thư mục data/ của project (thành công trên Local)
 * 2. Tự động bắt lỗi EROFS (Read-only file system trên Vercel) mà KHÔNG gây sập API (không ném lỗi 500)
 * 3. Ghi một bản vào /tmp/<fileName> để duy trì trạng thái cập nhật trên Serverless
 */
export async function writeJsonDataSafe<T>(fileName: string, data: T): Promise<boolean> {
  const jsonString = JSON.stringify(data, null, 2);
  let writeSuccess = false;

  // 1. Thử ghi vào thư mục dự án (Local Dev)
  try {
    const localPath = path.join(process.cwd(), "data", fileName);
    if (!fsSync.existsSync(path.dirname(localPath))) {
      await fs.mkdir(path.dirname(localPath), { recursive: true });
    }
    await fs.writeFile(localPath, jsonString, "utf-8");
    writeSuccess = true;
  } catch (err: any) {
    if (err.code === "EROFS" || err.message?.includes("read-only")) {
      console.warn(`[Storage Safe] Vercel Serverless Read-Only (${fileName}). Chuyển sang lưu tạm vào /tmp.`);
    } else {
      console.warn(`[Storage Safe] Lỗi ghi local file (${fileName}):`, err.message);
    }
  }

  // 2. Ghi bản sao vào /tmp (Writable trên mọi môi trường Serverless của Vercel / AWS Lambda)
  try {
    const tmpPath = path.join("/tmp", fileName);
    await fs.writeFile(tmpPath, jsonString, "utf-8");
    writeSuccess = true;
  } catch (tmpErr: any) {
    console.warn(`[Storage Safe] Lỗi ghi /tmp/${fileName}:`, tmpErr.message);
  }

  return writeSuccess;
}
