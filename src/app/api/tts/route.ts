import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * GET /api/tts?text=<từ_vựng>&lang=<en|vi|zh>
 * Proxy âm thanh phát âm bản xứ chuẩn ngữ âm (MP3) từ Google Translate TTS hoặc static files.
 * Tương thích 100% với mọi trình duyệt di động (iOS Safari, Android Chrome, macOS, Windows).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text")?.trim() || "";
    let lang = searchParams.get("lang")?.trim().toLowerCase() || "en";

    if (!["en", "vi", "zh"].includes(lang)) {
      lang = "en";
    }

    if (!text) {
      return NextResponse.json(
        { success: false, message: "Thiếu tham số text cần phát âm." },
        { status: 400 }
      );
    }

    // 1. Kiểm tra xem có file tĩnh trong public/audio/{lang}/{slug}.mp3 không
    const cleanSlug = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const possiblePaths = [
      path.join(process.cwd(), "public", "audio", lang, `${cleanSlug}.mp3`),
      path.join(process.cwd(), "public", "audio", `${cleanSlug}.mp3`),
    ];

    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          const fileBuffer = await fs.promises.readFile(p);
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      } catch {}
    }

    // 2. Fetch âm thanh chuẩn bản xứ từ Google Translate TTS (stream MP3)
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      text
    )}&tl=${lang}&client=tw-ob`;

    const res = await fetch(googleTtsUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `Lỗi fetch Google TTS: ${res.status}` },
        { status: res.status }
      );
    }

    const audioArrayBuffer = await res.arrayBuffer();

    return new NextResponse(Buffer.from(audioArrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}
