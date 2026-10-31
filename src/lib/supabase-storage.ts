const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME?.trim() || "polycards-assets";

/**
 * Kiểm tra cấu hình Supabase Storage
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_PROJECT_URL && SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Lấy URL công khai của file trên Supabase Storage
 */
export function getSupabasePublicUrl(fileName: string): string | null {
  if (!isSupabaseConfigured()) return null;
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const baseUrl = SUPABASE_PROJECT_URL!.replace(/\/+$/, "");
  return `${baseUrl}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/${cleanName}`;
}

/**
 * Tải file lên Supabase Storage qua REST API (không cần cài thêm thư viện)
 * @returns Đường link public hoàn chỉnh của file trên Supabase CDN
 */
export async function uploadToSupabase(
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase Storage chưa được cấu hình.");
  }

  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const baseUrl = SUPABASE_PROJECT_URL!.replace(/\/+$/, "");
  const uploadEndpoint = `${baseUrl}/storage/v1/object/${SUPABASE_BUCKET_NAME}/${cleanName}`;

  const res = await fetch(uploadEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: fileBuffer as unknown as BodyInit,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Supabase upload failed (${res.status}): ${errorText}`);
  }

  return `${baseUrl}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/${cleanName}`;
}
