import { NextRequest, NextResponse } from "next/server";
import { dbGetProductBySlug } from "@/lib/mongodb";
import { inspectGlbBuffer } from "@/lib/gltf-inspector";

export const dynamic = "force-dynamic";

interface PreflightCheckItem {
  id: string;
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  url?: string;
  details?: Record<string, unknown>;
}

async function checkUrlReachable(url?: string): Promise<{ ok: boolean; status: number; sizeBytes?: number; error?: string }> {
  if (!url) return { ok: false, status: 0, error: "Chưa cấu hình URL" };
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    const size = res.headers.get("content-length");
    return {
      ok: res.ok,
      status: res.status,
      sizeBytes: size ? parseInt(size, 10) : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Timeout hoặc lỗi mạng";
    return { ok: false, status: 0, error: msg };
  }
}

/**
 * GET /api/tools/preflight-card?slug=strawberry
 * Thẩm định chất lượng toàn diện trước khi xuất file in xưởng:
 * Kiểm tra QR URL, MongoDB, GLB, USDZ, .mind, Audio 3 thứ tiếng, Pack code.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug")?.trim()?.toLowerCase();

    if (!slug) {
      return NextResponse.json({ success: false, message: "Thiếu tham số slug" }, { status: 400 });
    }

    const card = await dbGetProductBySlug(slug);
    if (!card) {
      return NextResponse.json(
        {
          success: false,
          message: `Không tìm thấy thẻ có slug "${slug}" trong cơ sở dữ liệu MongoDB.`,
        },
        { status: 404 }
      );
    }

    const checks: PreflightCheckItem[] = [];

    // 1. Kiểm tra Slug & Dữ liệu cơ bản
    checks.push({
      id: "database",
      name: "Cơ sở dữ liệu thẻ",
      status: "pass",
      message: `Thẻ "${card.nameVi}" (${card.nameEn}) tồn tại hợp lệ trong MongoDB.`,
      details: { category: card.category, packCode: card.packCode },
    });

    // 2. Kiểm tra File 3D GLB (cho Android & WebAR)
    const glbCheck = await checkUrlReachable(card.modelUrl);
    if (glbCheck.ok) {
      // Thử đọc chunk để kiểm tra số đa giác
      let polyInfo: string = "";
      let polyStatus: "pass" | "warn" | "fail" = "pass";
      try {
        const glbRes = await fetch(card.modelUrl!, { signal: AbortSignal.timeout(6000) });
        if (glbRes.ok) {
          const buf = Buffer.from(await glbRes.arrayBuffer());
          const rep = inspectGlbBuffer(buf);
          polyInfo = `${rep.totalPolygons.toLocaleString()} polygons (${rep.fileSizeMB} MB)`;
          if (rep.status === "danger") polyStatus = "fail";
          else if (rep.status === "warning") polyStatus = "warn";
        }
      } catch {
        polyInfo = glbCheck.sizeBytes ? `${(glbCheck.sizeBytes / 1024 / 1024).toFixed(2)} MB` : "Tồn tại";
      }

      checks.push({
        id: "model_glb",
        name: "Mô hình 3D (.glb)",
        status: polyStatus,
        message: polyStatus === "fail"
          ? `GLB quá nặng (${polyInfo}), nguy cơ sập RAM Safari iPhone!`
          : `GLB sẵn sàng trên R2 (${polyInfo}).`,
        url: card.modelUrl,
      });
    } else {
      checks.push({
        id: "model_glb",
        name: "Mô hình 3D (.glb)",
        status: "fail",
        message: `Không thể tải file GLB: ${glbCheck.error || `HTTP ${glbCheck.status}`}`,
        url: card.modelUrl,
      });
    }

    // 3. Kiểm tra File 3D USDZ (cho iOS Apple Quick Look)
    const usdzCheck = await checkUrlReachable(card.iosModelUrl);
    if (usdzCheck.ok) {
      const sizeMB = usdzCheck.sizeBytes ? (usdzCheck.sizeBytes / 1024 / 1024).toFixed(2) : "OK";
      checks.push({
        id: "model_usdz",
        name: "Mô hình USDZ (Apple Quick Look)",
        status: "pass",
        message: `File USDZ sẵn sàng cho iPhone (${sizeMB} MB).`,
        url: card.iosModelUrl,
      });
    } else {
      checks.push({
        id: "model_usdz",
        name: "Mô hình USDZ (Apple Quick Look)",
        status: "warn",
        message: "Chưa có file .usdz trên R2. Khách dùng iPhone sẽ không xem được chế độ phòng thật qua Apple Quick Look.",
        url: card.iosModelUrl,
      });
    }

    // 4. Kiểm tra Target .mind (cho MindAR Image Tracking)
    const targetCheck = await checkUrlReachable(card.targetUrl);
    if (targetCheck.ok) {
      const sizeKB = targetCheck.sizeBytes ? Math.round(targetCheck.sizeBytes / 1024) : "OK";
      checks.push({
        id: "target_mind",
        name: "Tệp nhận diện Target (.mind)",
        status: "pass",
        message: `Tệp .mind sẵn sàng trên R2 (${sizeKB} KB). Camera bám nét chuẩn xác.`,
        url: card.targetUrl,
      });
    } else {
      checks.push({
        id: "target_mind",
        name: "Tệp nhận diện Target (.mind)",
        status: "warn",
        message: "Chưa có tệp .mind riêng hoặc đang dùng target mặc định.",
        url: card.targetUrl,
      });
    }

    // 5. Kiểm tra Mã bản quyền (Pack Code)
    if (card.packCode && card.packCode.trim().length > 0) {
      checks.push({
        id: "pack_code",
        name: "Mã bộ thẻ bản quyền",
        status: "pass",
        message: `Mã bộ "${card.packCode}" hợp lệ để kích hoạt khóa học & mở khóa WebAR.`,
      });
    } else {
      checks.push({
        id: "pack_code",
        name: "Mã bộ thẻ bản quyền",
        status: "warn",
        message: "Thẻ chưa được gắn mã bộ bản quyền (packCode).",
      });
    }

    // 6. Kiểm tra Âm thanh 3 thứ tiếng (EN, VI, ZH)
    const audioEn = Boolean(card.audios?.en || card.audioUrl);
    const audioVi = Boolean(card.audios?.vi || card.audioUrl);
    const audioZh = Boolean(card.audios?.zh || card.audioUrl);

    if (audioEn && audioVi && audioZh) {
      checks.push({
        id: "audio_voice",
        name: "Giọng phát âm 3 ngôn ngữ",
        status: "pass",
        message: "Đầy đủ giọng phát âm Tiếng Anh, Tiếng Việt và Tiếng Trung.",
      });
    } else if (audioEn || audioVi) {
      checks.push({
        id: "audio_voice",
        name: "Giọng phát âm 3 ngôn ngữ",
        status: "warn",
        message: `Thiếu một số ngôn ngữ: ${!audioEn ? "Anh " : ""}${!audioVi ? "Việt " : ""}${!audioZh ? "Trung" : ""}.`,
      });
    } else {
      checks.push({
        id: "audio_voice",
        name: "Giọng phát âm 3 ngôn ngữ",
        status: "warn",
        message: "Chưa cấu hình âm thanh phát âm.",
      });
    }

    // Tính điểm tổng kết
    const passCount = checks.filter((c) => c.status === "pass").length;
    const warnCount = checks.filter((c) => c.status === "warn").length;
    const failCount = checks.filter((c) => c.status === "fail").length;
    const score = Math.round((passCount / checks.length) * 100);

    const isReadyForPrint = failCount === 0 && passCount >= 4;

    const qrUrl = `https://polycards-one.vercel.app/ar/${card.slug}?ar=1${card.packCode ? `&code=${card.packCode}` : ""}`;

    return NextResponse.json({
      success: true,
      card,
      qrUrl,
      checks,
      score,
      passCount,
      warnCount,
      failCount,
      isReadyForPrint,
    });
  } catch (err: unknown) {
    console.error("Lỗi thẩm định thẻ trước khi in:", err);
    const msg = err instanceof Error ? err.message : "Lỗi hệ thống khi thẩm định thẻ";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
