import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const filename = (formData.get("filename") as string) || "targets.mind";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const targetsDir = path.join(process.cwd(), "public", "targets");

    if (!fs.existsSync(targetsDir)) {
      fs.mkdirSync(targetsDir, { recursive: true });
    }

    const targetPath = path.join(targetsDir, filename);
    fs.writeFileSync(targetPath, buffer);

    console.log(`[API Save Target] Saved ${filename} (${buffer.length} bytes) to ${targetPath}`);

    return NextResponse.json({
      success: true,
      filename,
      size: buffer.length,
      path: `/targets/${filename}`,
    });
  } catch (error) {
    console.error("[API Save Target Error]:", error);
    return NextResponse.json(
      { error: "Failed to save target file" },
      { status: 500 }
    );
  }
}
