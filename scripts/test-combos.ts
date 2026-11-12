import { evaluateBestCombo, DEFAULT_COMBO_RULES } from "../src/lib/combo-engine";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log("=== BẮT ĐẦU KIỂM THỬ COMBO ENGINE ===");

// 1. Mua 1 bộ: Chưa đủ điều kiện, gợi ý mua thêm 1 bộ để được combo 2 bộ (10%)
{
  const result = evaluateBestCombo(
    [{ packCode: "POLY30-DONGVAT-ENVI", quantity: 1, salePrice: 249000 }],
    DEFAULT_COMBO_RULES
  );
  assert(result.rule === null, "Mua 1 bộ chưa có combo");
  assert(result.discountAmount === 0, "Không có giảm giá combo");
  assert(result.finalPrice === 249000, "Giá cuối 249.000đ");
  assert(result.nextSuggestion !== undefined, "Có gợi ý mua thêm");
  assert(result.nextSuggestion?.neededPacks === 1, "Cần thêm 1 bộ nữa");
  console.log("Gợi ý:", result.nextSuggestion?.message);
}

// 2. Mua 2 bộ: Kích hoạt Combo 2-in-1 (10%)
{
  const result = evaluateBestCombo(
    [
      { packCode: "POLY30-DONGVAT-ENVI", quantity: 1, salePrice: 249000 },
      { packCode: "POLY30-XECO-ENVI", quantity: 1, salePrice: 249000 },
    ],
    DEFAULT_COMBO_RULES
  );
  assert(result.rule?.id === "combo-2-in-1", "Kích hoạt combo-2-in-1");
  assert(result.discountAmount === Math.round(498000 * 0.1), "Giảm 10% của 498k là 49.800đ");
  assert(result.finalPrice === 498000 - 49800, "Giá cuối là 448.200đ");
  assert(result.nextSuggestion?.neededPacks === 2, "Gợi ý mua thêm 2 bộ nữa để được Combo 4-in-1 (33%)");
}

// 3. Mua 4 bộ: Kích hoạt Combo 4-in-1 (33%) tốt hơn combo 2 bộ (10%)
{
  const result = evaluateBestCombo(
    [
      { packCode: "POLY30-DONGVAT-ENVI", quantity: 2, salePrice: 249000 },
      { packCode: "POLY30-XECO-ENVI", quantity: 2, salePrice: 249000 },
    ],
    DEFAULT_COMBO_RULES
  );
  assert(result.rule?.id === "combo-4-in-1", "Kích hoạt combo-4-in-1");
  assert(result.rule?.discountValue === 33, "Mức giảm 33%");
}

// 4. Mua 9 bộ: Kích hoạt Combo Siêu VIP 9-in-1 (34%)
{
  const result = evaluateBestCombo(
    [{ packCode: "POLY30-DONGVAT-ENVI", quantity: 9, salePrice: 249000 }],
    DEFAULT_COMBO_RULES
  );
  assert(result.rule?.id === "combo-9-in-1", "Kích hoạt combo-9-in-1");
  assert(result.nextSuggestion === undefined, "Đã đạt combo cao nhất, không còn gợi ý tiếp");
}

console.log("=== TẤT CẢ TEST COMBO ENGINE PASSED ===");

