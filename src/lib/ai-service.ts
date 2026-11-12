/**
 * Poly Cards - AI Assistant Service
 * Quản lý hội thoại thông minh, tích hợp Model AI miễn phí (Google Gemini, Groq, OpenAI),
 * tự động nhúng ngữ cảnh dữ liệu sản phẩm thời gian thực và fallback thông minh khi có sự cố.
 */

import { AiChatConfig, AiChatMessage, AiChatResponse } from "@/types/ai";
import { COMBO_PACKS } from "@/data/combos";
import { formatVndCurrency } from "./formatters";
import { dbGetProducts, getMongoDb } from "./mongodb";
import { DEFAULT_AI_CONFIG } from "./ai-defaults";

export { DEFAULT_AI_CONFIG };

const MEMORY_AI_CONFIG_KEY = "polycards_ai_config_cached";
let memoryAiConfig: AiChatConfig | null = null;

/**
 * Lấy cấu hình AI hiện tại từ MongoDB hoặc giá trị mặc định
 */
export async function getAiConfig(): Promise<AiChatConfig> {
  if (memoryAiConfig) return memoryAiConfig;

  try {
    const db = await getMongoDb();
    if (db) {
      const col = db.collection("ai_settings");
      const saved = await col.findOne({ id: "default_ai_config" });
      if (saved) {
        // Tự động gỡ bỏ hoàn toàn trường apiKey trong MongoDB nếu còn tồn dư
        if ("apiKey" in saved || "hasApiKey" in saved) {
          col.updateOne(
            { id: "default_ai_config" },
            { $unset: { apiKey: "", hasApiKey: "" } }
          ).catch(() => {});
        }
        const { _id, apiKey, hasApiKey, ...rest } = saved as any;
        const loaded: AiChatConfig = { ...DEFAULT_AI_CONFIG, ...rest };
        memoryAiConfig = loaded;
        return loaded;
      }
    }
  } catch (err) {
    console.warn("[AI Service] Chưa thể đọc ai_settings từ MongoDB, dùng cấu hình mặc định:", err);
  }

  return DEFAULT_AI_CONFIG;
}

/**
 * Lưu cấu hình AI vào MongoDB (Tuyệt đối không lưu API Key lên Database)
 */
export async function saveAiConfig(newConfig: Partial<AiChatConfig>): Promise<AiChatConfig> {
  const current = await getAiConfig();
  const { apiKey: _k1, hasApiKey: _h1, ...cleanCurrent } = current as any;
  const { apiKey: _k2, hasApiKey: _h2, ...cleanNew } = newConfig as any;

  const merged: AiChatConfig = {
    ...cleanCurrent,
    ...cleanNew,
    id: "default_ai_config",
    updatedAt: new Date().toISOString(),
  };

  memoryAiConfig = merged;

  try {
    const db = await getMongoDb();
    if (db) {
      const col = db.collection("ai_settings");
      await col.updateOne(
        { id: "default_ai_config" },
        {
          $set: merged,
          $unset: { apiKey: "", hasApiKey: "" },
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error("[AI Service] Lỗi lưu cấu hình AI vào MongoDB:", err);
  }

  return merged;
}

/**
 * Tạo dữ liệu ngữ cảnh thời gian thực về sản phẩm và giá bán PolyCards
 */
export async function buildKnowledgeBaseContext(): Promise<string> {
  const comboSummary = COMBO_PACKS.map(
    (c) => `- ${c.name} (${c.cardsCount} thẻ): Giá ưu đãi ${formatVndCurrency(c.price)} (Giá gốc: ${formatVndCurrency(c.originalPrice)}) - Tiết kiệm: ${c.badge}`
  ).join("\n");

  let cardCount = 270;
  try {
    const products = await dbGetProducts();
    if (products && products.length > 0) {
      cardCount = products.length;
    }
  } catch {}

  return `
--- DỮ LIỆU SẢN PHẨM & BẢNG GIÁ THỜI GIAN THỰC POLYCARDS ---
Tổng số thẻ AR trong hệ thống: ${cardCount} thẻ.
Các gói Combo nổi bật:
${comboSummary}

Các chủ đề thẻ:
1. Động Vật Hoang Dã (Sư tử, voi, hổ, khỉ, gấu trúc...)
2. Phương Tiện Giao Thông (Máy bay, tàu hỏa, ô tô, trực thăng...)
3. Hoa Quả & Trái Cây (Táo, chuối, dưa hấu, dâu tây...)
4. Nghề Nghiệp (Bác sĩ, kỹ sư, ca sĩ, giáo viên, cứu hỏa...)
5. Hành Động & Động Từ (Chạy, nhảy, bơi, đọc sách...)

Ưu điểm công nghệ WebAR:
- Không cần tải App từ App Store hay Google Play.
- Quét mã QR bằng Camera điện thoại, vào link polycards.vn/ar/[tên-thẻ] là xem 3D ngay tức thì.
- Chạm vào con vật: Mô hình nhún nhảy, phát âm thanh kêu thật, đọc từ vựng chuẩn bản xứ Anh - Việt - Trung.
- Có tính năng Quiz đố vui nhận diện và tương tác Nam châm AR (Điện thoại đẩy/hút con vật).
`;
}

/**
 * Phản hồi Fallback thông minh theo từ khóa khi API của Provider bị lỗi hoặc chưa có API Key
 */
export function generateSmartFallbackReply(userMessage: string, contextSummary: string): string {
  const q = userMessage.toLowerCase();

  // 1. Hỏi về giá, mua hàng, combo
  if (q.includes("giá") || q.includes("bao nhiêu") || q.includes("mua") || q.includes("combo") || q.includes("tiền") || q.includes("đặt hàng")) {
    return (
      "Dạ PolyCards hiện đang có các gói ưu đãi hấp dẫn dành cho Ba Mẹ:\n\n" +
      "1. Siêu Combo Trọn Bộ 9-in-1 (270 Thẻ AR): 1.490.000đ (Tiết kiệm 751K, trọn bộ đầy đủ nhất).\n" +
      "2. Combo VIP 4-in-1 (120 Thẻ AR): 799.000đ (Tiết kiệm 397K, tặng hộp quà cao cấp).\n" +
      "3. Bộ Lẻ Theo Chủ Đề (30 Thẻ AR): 249.000đ / bộ (Động vật, Xe cộ, Hoa quả, Nghề nghiệp...).\n\n" +
      "Tất cả các gói Combo đều được Miễn phí giao hàng toàn quốc và bảo hành bản quyền WebAR trọn đời. Ba Mẹ có thể bấm vào nút 'Đặt Hàng Ngay' trên website để nhận quà tặng kèm nhé!"
    );
  }

  // 2. Hỏi về cách quét thẻ, cách sử dụng WebAR
  if (q.includes("quét") || q.includes("dùng") || q.includes("sử dụng") || q.includes("cài app") || q.includes("tải app") || q.includes("camera") || q.includes("3d")) {
    return (
      "Dạ điểm đặc biệt nhất của PolyCards là KHÔNG CẦN CÀI APP Ba Mẹ nhé!\n\n" +
      "Cách sử dụng cực kỳ đơn giản cho bé:\n" +
      "Bước 1: Mở ứng dụng Camera trên iPhone hoặc điện thoại Android.\n" +
      "Bước 2: Hướng camera vào mã QR in trên mặt thẻ bài PolyCards.\n" +
      "Bước 3: Bấm vào đường link hiện lên, mô hình 3D sống động sẽ hiện ngay tức thì giữa không gian thực!\n\n" +
      "Bé có thể dùng tay chạm vào mô hình để nghe tiếng kêu, đổi động tác và nghe giọng phát âm song ngữ Anh - Việt - Trung chuẩn bản xứ ạ."
    );
  }

  // 3. Hỏi về độ tuổi phù hợp
  if (q.includes("tuổi") || q.includes("mấy tuổi") || q.includes("bé") || q.includes("trẻ em") || q.includes("phù hợp")) {
    return (
      "Dạ bộ thẻ PolyCards được thiết kế tối ưu nhất cho các bé từ 3 đến 8 tuổi - giai đoạn vàng phát triển tư duy thị giác, tò mò về thế giới và làm quen ngôn ngữ tự nhiên.\n\n" +
      "- Với bé 3 - 5 tuổi: Bé rất thích thú khi nhìn con vật 3D cử động, phát tiếng kêu thật, giúp kích thích trí não và giảm phụ thuộc vào màn hình tivi/điện thoại thụ động.\n" +
      "- Với bé 5 - 8 tuổi: Thẻ hỗ trợ phiên âm quốc tế IPA (tiếng Anh) và Pinyin (tiếng Trung) cùng các minigame đố vui nhận diện để bé học từ vựng vững vàng."
    );
  }

  // 4. Hỏi về bảo hành, đổi trả, ship
  if (q.includes("bảo hành") || q.includes("đổi trả") || q.includes("ship") || q.includes("vận chuyển") || q.includes("giao hàng")) {
    return (
      "Dạ chính sách bán hàng tại PolyCards cực kỳ an tâm cho Ba Mẹ:\n\n" +
      "- Vận chuyển: Miễn phí giao hàng toàn quốc cho các gói Combo. Giao nhanh 1 - 2 ngày tại Hà Nội, TP.HCM và 2 - 3 ngày tại các tỉnh thành khác.\n" +
      "- Đổi trả: Hỗ trợ 1 đổi 1 trong vòng 7 ngày nếu sản phẩm có bất kỳ lỗi in ấn hay va đập khi vận chuyển.\n" +
      "- Bản quyền: Mã QR kích hoạt WebAR có giá trị sử dụng vĩnh viễn trọn đời, không giới hạn số lần quét."
    );
  }

  // Phản hồi tổng quát
  return (
    "Dạ em là PolyCards AI luôn sẵn sàng hỗ trợ Ba Mẹ! Ba Mẹ có thể hỏi em về:\n" +
    "- Bảng giá và các gói Combo thẻ AR ưu đãi nhất.\n" +
    "- Cách quét thẻ AR 3D bằng điện thoại không cần cài app.\n" +
    "- Chọn chủ đề thẻ phù hợp theo lứa tuổi của bé.\n\n" +
    "Ba Mẹ cần em tư vấn chi tiết về chủ đề nào ạ?"
  );
}

/**
 * TẦNG 1: Google Gemini API (Đọc trực tiếp từ process.env.GEMINI_API_KEY)
 */
async function callGeminiTier(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  fullSystemInstruction: string,
  temperature: number,
  primaryModel?: string
): Promise<{ text: string; modelUsed: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const candidateModels = Array.from(
    new Set(
      [
        primaryModel,
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
      ].filter(Boolean) as string[]
    )
  );

  const formattedContents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const m of messages) {
    const role: "user" | "model" = m.role === "assistant" ? "model" : "user";
    const text = m.content?.trim();
    if (!text) continue;

    const last = formattedContents[formattedContents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n${text}`;
    } else {
      formattedContents.push({ role, parts: [{ text }] });
    }
  }

  if (formattedContents.length === 0) {
    formattedContents.push({ role: "user", parts: [{ text: "Xin chào" }] });
  }

  for (const modelName of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: fullSystemInstruction }] },
          contents: formattedContents,
          generationConfig: {
            temperature: temperature || 0.7,
            maxOutputTokens: 800,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[AI Tier 1 - Gemini] Model ${modelName} returned HTTP ${res.status}:`, errText.slice(0, 120));
        continue;
      }

      const data = await res.json();
      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (aiReply) {
        return { text: aiReply, modelUsed: `gemini (${modelName})` };
      }
    } catch (err: any) {
      console.warn(`[AI Tier 1 - Gemini] Model ${modelName} error (${err?.message || err}), thử model tiếp theo...`);
      continue;
    }
  }
  return null;
}

/**
 * TẦNG 2: OpenRouter API (Đọc trực tiếp từ process.env.OPEN_ROUTER_API_KEY)
 */
async function callOpenRouterTier(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  fullSystemInstruction: string,
  temperature: number,
  primaryModel?: string
): Promise<{ text: string; modelUsed: string } | null> {
  const apiKey =
    process.env.OPEN_ROUTER_API_KEY?.trim() ||
    process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) return null;

  const candidateModels = Array.from(
    new Set([primaryModel, "openrouter/free", "liquid/lfm-2.5-2.6b:free", "google/gemini-2.0-flash-exp:free"].filter(Boolean) as string[])
  );

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://polycards.vn",
          "X-Title": "PolyCards WebAR",
          "User-Agent": "PolyCards-AI/1.0",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: fullSystemInstruction },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: temperature || 0.7,
          max_tokens: 800,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[AI Tier 2 - OpenRouter] Model ${model} returned HTTP ${res.status}:`, errText.slice(0, 120));
        continue;
      }

      const data = await res.json();
      const aiReply = data?.choices?.[0]?.message?.content?.trim();
      if (aiReply) {
        return { text: aiReply, modelUsed: `openrouter (${model})` };
      }
    } catch (err: any) {
      console.warn(`[AI Tier 2 - OpenRouter] Model ${model} error (${err?.message || err}), thử model tiếp theo...`);
      continue;
    }
  }
  return null;
}

/**
 * TẦNG 3: Groq Cloud API (Đọc trực tiếp từ process.env.GROQ_API_KEY)
 */
async function callGroqTier(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  fullSystemInstruction: string,
  temperature: number,
  primaryModel?: string
): Promise<{ text: string; modelUsed: string } | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  const candidateModels = Array.from(
    new Set([primaryModel, "openai/gpt-oss-20b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"].filter(Boolean) as string[])
  );

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500);

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "User-Agent": "PolyCards-AI/1.0 (https://polycards.vn)",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: fullSystemInstruction },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: temperature || 0.7,
          max_tokens: 800,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[AI Tier 3 - Groq] Model ${model} returned HTTP ${res.status}:`, errText.slice(0, 120));
        continue;
      }

      const data = await res.json();
      const aiReply = data?.choices?.[0]?.message?.content?.trim();
      if (aiReply) {
        return { text: aiReply, modelUsed: `groq (${model})` };
      }
    } catch (err: any) {
      console.warn(`[AI Tier 3 - Groq] Model ${model} error (${err?.message || err}), thử model tiếp theo...`);
      continue;
    }
  }
  return null;
}

/**
 * Xử lý gửi tin nhắn tới AI với Chuỗi 4 Tầng Fallback Tự Động:
 * GEMINI -> OPEN ROUTER -> GROQ -> MOCK DATA CÓ SẴN
 */
export async function callAiModel(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  config?: AiChatConfig
): Promise<AiChatResponse> {
  const activeConfig = config || (await getAiConfig());
  const knowledgeContext = await buildKnowledgeBaseContext();
  const userLastMessage = messages[messages.length - 1]?.content || "";

  // Nếu tắt tính năng bot hoặc chọn trực tiếp chế độ fallback
  if (!activeConfig.enabled || activeConfig.provider === "fallback") {
    return {
      success: true,
      message: generateSmartFallbackReply(userLastMessage, knowledgeContext),
      providerUsed: "mock-data-engine",
      isFallback: true,
    };
  }

  // Chuẩn bị toàn bộ System Prompt + Ngữ cảnh sản phẩm thời gian thực
  const fullSystemInstruction = `${activeConfig.systemPrompt}\n\n${knowledgeContext}`;

  // =========================================================================
  // BỘ ĐIỀU PHỐI 4 TẦNG (4-TIER FALLBACK ENGINE)
  // TẦNG 1: GEMINI -> TẦNG 2: OPEN ROUTER -> TẦNG 3: GROQ -> TẦNG 4: MOCK DATA
  // =========================================================================

  // Xác định thứ tự gọi dựa trên cấu hình người dùng (mặc định hoặc khi chọn Gemini)
  type TierRunner = () => Promise<{ text: string; modelUsed: string } | null>;

  const runGemini: TierRunner = () =>
    callGeminiTier(
      messages,
      fullSystemInstruction,
      activeConfig.temperature,
      activeConfig.provider === "gemini" ? activeConfig.model : undefined
    );

  const runOpenRouter: TierRunner = () =>
    callOpenRouterTier(
      messages,
      fullSystemInstruction,
      activeConfig.temperature,
      activeConfig.provider === "openrouter" ? activeConfig.model : undefined
    );

  const runGroq: TierRunner = () =>
    callGroqTier(
      messages,
      fullSystemInstruction,
      activeConfig.temperature,
      activeConfig.provider === "groq" ? activeConfig.model : undefined
    );

  // Thứ tự ưu tiên mặc định: GEMINI -> OPEN ROUTER -> GROQ
  let tiers: Array<{ name: string; runner: TierRunner }> = [
    { name: "Tầng 1: Google Gemini", runner: runGemini },
    { name: "Tầng 2: OpenRouter", runner: runOpenRouter },
    { name: "Tầng 3: Groq Cloud", runner: runGroq },
  ];

  // Nếu người dùng chọn trực tiếp OpenRouter làm ưu tiên số 1 trong cài đặt
  if (activeConfig.provider === "openrouter") {
    tiers = [
      { name: "Tầng 1: OpenRouter (Ưu tiên theo cấu hình)", runner: runOpenRouter },
      { name: "Tầng 2: Google Gemini", runner: runGemini },
      { name: "Tầng 3: Groq Cloud", runner: runGroq },
    ];
  } else if (activeConfig.provider === "groq") {
    tiers = [
      { name: "Tầng 1: Groq Cloud (Ưu tiên theo cấu hình)", runner: runGroq },
      { name: "Tầng 2: Google Gemini", runner: runGemini },
      { name: "Tầng 3: OpenRouter", runner: runOpenRouter },
    ];
  }

  // Chạy lần lượt qua các tầng AI
  for (const tier of tiers) {
    try {
      const result = await tier.runner();
      if (result && result.text) {
        return {
          success: true,
          message: result.text,
          providerUsed: result.modelUsed,
          isFallback: false,
        };
      }
    } catch (err) {
      console.warn(`[AI Engine] ${tier.name} gặp lỗi không thể xử lý:`, err);
    }
  }

  // TẦNG 4: MOCK DATA CÓ SẴN (Smart Keyword Engine)
  console.warn("[AI Engine] Cả 3 tầng AI (Gemini, OpenRouter, Groq) đều không phản hồi. Tự động chuyển sang Tầng 4: Mock Data có sẵn.");
  return {
    success: true,
    message: generateSmartFallbackReply(userLastMessage, knowledgeContext),
    providerUsed: "mock-data-engine",
    isFallback: true,
  };
}
