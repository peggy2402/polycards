import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { uploadToR2 } from "../src/lib/r2";

const execFileAsync = promisify(execFile);

async function makeUsdz() {
  const blenderBin = "/Applications/Blender.app/Contents/MacOS/Blender";
  const inputGlb = "/tmp/strawberry-clean.glb";
  const outputUsdz = "/tmp/strawberry.usdz";
  const scriptPath = "/tmp/export_usdz.py";

  const py = `
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r"${inputGlb}")
try:
    bpy.ops.wm.usd_export(filepath=r"${outputUsdz}", export_materials=True)
    print("USDZ export OK!")
except Exception as e:
    print("USDZ export error:", e)
`;
  fs.writeFileSync(scriptPath, py, "utf8");

  await execFileAsync(blenderBin, ["--background", "--python", scriptPath]);

  if (fs.existsSync(outputUsdz)) {
    const buf = fs.readFileSync(outputUsdz);
    console.log(`USDZ size: ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
    const usdzUrl = await uploadToR2(buf, "strawberry.usdz", "model/vnd.usdz+zip");
    console.log(`✅ Upload USDZ R2 thành công: ${usdzUrl}`);
  }
}

makeUsdz().catch(console.error);

