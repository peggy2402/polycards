import { getAllAnimals, getAnimalBySlug, getAnimalByQrCode } from "../src/lib/animals";
import { parseAndValidateQr } from "../src/lib/qr-parser";

console.log("=== TEST ANIMALS HELPER ===");
const all = getAllAnimals();
console.log(`Loaded ${all.length} animals.`);
if (all.length !== 6) throw new Error("Expected 6 animals");

const deer = getAnimalBySlug("deer");
if (!deer || deer.nameEn !== "Deer") throw new Error("Deer not found by slug");
console.log(`[PASS] getAnimalBySlug('deer') -> ${deer.nameEn} (${deer.nameVi})`);

const byQr = getAnimalByQrCode("AR-DEER-001");
if (!byQr || byQr.slug !== "deer") throw new Error("Deer not found by QR code");
console.log(`[PASS] getAnimalByQrCode('AR-DEER-001') -> ${byQr.slug}`);

console.log("=== TEST QR PARSER ===");
// Case 1: valid QR ID
const res1 = parseAndValidateQr("AR-DEER-001");
if (!res1.valid || res1.slug !== "deer") throw new Error("Case 1 failed");
console.log("[PASS] Case 1 (AR ID): OK");

// Case 2: valid internal URL
const res2 = parseAndValidateQr("https://polycards.vn/ar/cat");
if (!res2.valid || res2.slug !== "cat") throw new Error("Case 2 failed");
console.log("[PASS] Case 2 (Full URL): OK");

// Case 3: foreign URL (must reject)
const res3 = parseAndValidateQr("https://malicious-site.com/ar/deer");
if (res3.valid) throw new Error("Case 3 failed: Foreign URL was not rejected!");
console.log("[PASS] Case 3 (Foreign URL rejection): OK -> " + res3.errorMessage);

// Case 4: Mismatch product in targeted scan mode
const res4 = parseAndValidateQr("AR-CAT-002", "deer");
if (res4.valid || !res4.isMismatched) throw new Error("Case 4 failed: Mismatch not detected");
console.log("[PASS] Case 4 (Product mismatch detection): OK -> " + res4.errorMessage);

// Case 5: Matching product in targeted scan mode
const res5 = parseAndValidateQr("AR-DEER-001", "deer");
if (!res5.valid) throw new Error("Case 5 failed");
console.log("[PASS] Case 5 (Product match in targeted mode): OK");

console.log("\nALL STEP 1 TESTS PASSED SUCCESSFULLY! (Zero Emojis)");
