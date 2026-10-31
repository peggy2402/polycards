import { NextRequest, NextResponse } from "next/server";

interface TranslateRequestBody {
  text: string;
  sourceLang?: "vi" | "en" | "zh";
}

interface CommonVocabEntry {
  en: string;
  vi: string;
  ipa: string;
  zh: string;
  pinyin: string;
}

// Bộ từ điển song ngữ chuẩn flashcard thông dụng (Zero-latency fallback)
const FLASHCARD_DICTIONARY: Record<string, CommonVocabEntry> = {
  // Hành động (Actions)
  "read": { en: "Read", vi: "Đọc sách", ipa: "/riːd/", zh: "看书", pinyin: "kàn shū" },
  "doc sach": { en: "Read", vi: "Đọc sách", ipa: "/riːd/", zh: "看书", pinyin: "kàn shū" },
  "đọc sách": { en: "Read", vi: "Đọc sách", ipa: "/riːd/", zh: "看书", pinyin: "kàn shū" },
  "run": { en: "Run", vi: "Chạy bộ", ipa: "/rʌn/", zh: "跑步", pinyin: "pǎo bù" },
  "chay bo": { en: "Run", vi: "Chạy bộ", ipa: "/rʌn/", zh: "跑步", pinyin: "pǎo bù" },
  "chạy bộ": { en: "Run", vi: "Chạy bộ", ipa: "/rʌn/", zh: "跑步", pinyin: "pǎo bù" },
  "jump": { en: "Jump", vi: "Nhảy cao", ipa: "/dʒʌmp/", zh: "跳", pinyin: "tiào" },
  "nhay": { en: "Jump", vi: "Nhảy cao", ipa: "/dʒʌmp/", zh: "跳", pinyin: "tiào" },
  "nhảy": { en: "Jump", vi: "Nhảy cao", ipa: "/dʒʌmp/", zh: "跳", pinyin: "tiào" },
  "swim": { en: "Swim", vi: "Bơi lội", ipa: "/swɪm/", zh: "游泳", pinyin: "yóu yǒng" },
  "boi": { en: "Swim", vi: "Bơi lội", ipa: "/swɪm/", zh: "游泳", pinyin: "yóu yǒng" },
  "bơi": { en: "Swim", vi: "Bơi lội", ipa: "/swɪm/", zh: "游泳", pinyin: "yóu yǒng" },
  "sing": { en: "Sing", vi: "Ca hát", ipa: "/sɪŋ/", zh: "唱歌", pinyin: "chàng gē" },
  "hat": { en: "Sing", vi: "Ca hát", ipa: "/sɪŋ/", zh: "唱歌", pinyin: "chàng gē" },
  "hát": { en: "Sing", vi: "Ca hát", ipa: "/sɪŋ/", zh: "唱歌", pinyin: "chàng gē" },
  "dance": { en: "Dance", vi: "Nhảy múa", ipa: "/dæns/", zh: "跳舞", pinyin: "tiào wǔ" },
  "múa": { en: "Dance", vi: "Nhảy múa", ipa: "/dæns/", zh: "跳舞", pinyin: "tiào wǔ" },
  "eat": { en: "Eat", vi: "Ăn uống", ipa: "/iːt/", zh: "吃", pinyin: "chī" },
  "an": { en: "Eat", vi: "Ăn uống", ipa: "/iːt/", zh: "吃", pinyin: "chī" },
  "ăn": { en: "Eat", vi: "Ăn uống", ipa: "/iːt/", zh: "吃", pinyin: "chī" },
  "sleep": { en: "Sleep", vi: "Ngủ", ipa: "/sliːp/", zh: "睡觉", pinyin: "shuì jiào" },
  "ngu": { en: "Sleep", vi: "Ngủ", ipa: "/sliːp/", zh: "睡觉", pinyin: "shuì jiào" },
  "ngủ": { en: "Sleep", vi: "Ngủ", ipa: "/sliːp/", zh: "睡觉", pinyin: "shuì jiào" },

  // Nghề nghiệp (Jobs)
  "teacher": { en: "Teacher", vi: "Giáo viên", ipa: "/ˈtiː.tʃər/", zh: "教师", pinyin: "jiào shī" },
  "giao vien": { en: "Teacher", vi: "Giáo viên", ipa: "/ˈtiː.tʃər/", zh: "教师", pinyin: "jiào shī" },
  "giáo viên": { en: "Teacher", vi: "Giáo viên", ipa: "/ˈtiː.tʃər/", zh: "教师", pinyin: "jiào shī" },
  "doctor": { en: "Doctor", vi: "Bác sĩ", ipa: "/ˈdɒk.tər/", zh: "医生", pinyin: "yī shēng" },
  "bac si": { en: "Doctor", vi: "Bác sĩ", ipa: "/ˈdɒk.tər/", zh: "医生", pinyin: "yī shēng" },
  "bác sĩ": { en: "Doctor", vi: "Bác sĩ", ipa: "/ˈdɒk.tər/", zh: "医生", pinyin: "yī shēng" },
  "police": { en: "Police", vi: "Cảnh sát", ipa: "/pəˈliːs/", zh: "警察", pinyin: "jǐng chá" },
  "canh sat": { en: "Police", vi: "Cảnh sát", ipa: "/pəˈliːs/", zh: "警察", pinyin: "jǐng chá" },
  "cảnh sát": { en: "Police", vi: "Cảnh sát", ipa: "/pəˈliːs/", zh: "警察", pinyin: "jǐng chá" },
  "firefighter": { en: "Firefighter", vi: "Lính cứu hỏa", ipa: "/ˈfaɪəˌfaɪ.tər/", zh: "消防员", pinyin: "xiāo fáng yuán" },
  "cuu hoa": { en: "Firefighter", vi: "Lính cứu hỏa", ipa: "/ˈfaɪəˌfaɪ.tər/", zh: "消防员", pinyin: "xiāo fáng yuán" },
  "cứu hỏa": { en: "Firefighter", vi: "Lính cứu hỏa", ipa: "/ˈfaɪəˌfaɪ.tər/", zh: "消防员", pinyin: "xiāo fáng yuán" },
  "chef": { en: "Chef", vi: "Đầu bếp", ipa: "/ʃef/", zh: "厨师", pinyin: "chú shī" },
  "dau bep": { en: "Chef", vi: "Đầu bếp", ipa: "/ʃef/", zh: "厨师", pinyin: "chú shī" },
  "đầu bếp": { en: "Chef", vi: "Đầu bếp", ipa: "/ʃef/", zh: "厨师", pinyin: "chú shī" },

  // Phương tiện (Vehicles)
  "cable car": { en: "Cable car", vi: "Cáp treo", ipa: "/ˈkeɪ.bəl ˌkɑːr/", zh: "缆车", pinyin: "lǎn chē" },
  "cap treo": { en: "Cable car", vi: "Cáp treo", ipa: "/ˈkeɪ.bəl ˌkɑːr/", zh: "缆车", pinyin: "lǎn chē" },
  "cáp treo": { en: "Cable car", vi: "Cáp treo", ipa: "/ˈkeɪ.bəl ˌkɑːr/", zh: "缆车", pinyin: "lǎn chē" },
  "car": { en: "Car", vi: "Ô tô", ipa: "/kɑːr/", zh: "汽车", pinyin: "qì chē" },
  "o to": { en: "Car", vi: "Ô tô", ipa: "/kɑːr/", zh: "汽车", pinyin: "qì chē" },
  "ô tô": { en: "Car", vi: "Ô tô", ipa: "/kɑːr/", zh: "汽车", pinyin: "qì chē" },
  "airplane": { en: "Airplane", vi: "Máy bay", ipa: "/ˈeə.pleɪn/", zh: "飞机", pinyin: "fēi jī" },
  "may bay": { en: "Airplane", vi: "Máy bay", ipa: "/ˈeə.pleɪn/", zh: "飞机", pinyin: "fēi jī" },
  "máy bay": { en: "Airplane", vi: "Máy bay", ipa: "/ˈeə.pleɪn/", zh: "飞机", pinyin: "fēi jī" },
  "train": { en: "Train", vi: "Tàu hỏa", ipa: "/treɪn/", zh: "火车", pinyin: "huǒ chē" },
  "tau hoa": { en: "Train", vi: "Tàu hỏa", ipa: "/treɪn/", zh: "火车", pinyin: "huǒ chē" },
  "tàu hỏa": { en: "Train", vi: "Tàu hỏa", ipa: "/treɪn/", zh: "火车", pinyin: "huǒ chē" },
  "bicycle": { en: "Bicycle", vi: "Xe đạp", ipa: "/ˈbaɪ.sɪ.kəl/", zh: "自行车", pinyin: "zì xíng chē" },
  "xe dap": { en: "Bicycle", vi: "Xe đạp", ipa: "/ˈbaɪ.sɪ.kəl/", zh: "自行车", pinyin: "zì xíng chē" },
  "xe đạp": { en: "Bicycle", vi: "Xe đạp", ipa: "/ˈbaɪ.sɪ.kəl/", zh: "自行车", pinyin: "zì xíng chē" },

  // Động vật (Animals)
  "lion": { en: "Lion", vi: "Sư tử", ipa: "/ˈlaɪ.ən/", zh: "狮子", pinyin: "shī zi" },
  "su tu": { en: "Lion", vi: "Sư tử", ipa: "/ˈlaɪ.ən/", zh: "狮子", pinyin: "shī zi" },
  "sư tử": { en: "Lion", vi: "Sư tử", ipa: "/ˈlaɪ.ən/", zh: "狮子", pinyin: "shī zi" },
  "cat": { en: "Cat", vi: "Mèo", ipa: "/kæt/", zh: "猫", pinyin: "māo" },
  "meo": { en: "Cat", vi: "Mèo", ipa: "/kæt/", zh: "猫", pinyin: "māo" },
  "mèo": { en: "Cat", vi: "Mèo", ipa: "/kæt/", zh: "猫", pinyin: "māo" },
  "dog": { en: "Dog", vi: "Chó", ipa: "/dɒɡ/", zh: "狗", pinyin: "gǒu" },
  "cho": { en: "Dog", vi: "Chó", ipa: "/dɒɡ/", zh: "狗", pinyin: "gǒu" },
  "chó": { en: "Dog", vi: "Chó", ipa: "/dɒɡ/", zh: "狗", pinyin: "gǒu" },
  "panda": { en: "Panda", vi: "Gấu trúc", ipa: "/ˈpæn.də/", zh: "熊猫", pinyin: "xióng māo" },
  "gau truc": { en: "Panda", vi: "Gấu trúc", ipa: "/ˈpæn.də/", zh: "熊猫", pinyin: "xióng māo" },
  "gấu trúc": { en: "Panda", vi: "Gấu trúc", ipa: "/ˈpæn.də/", zh: "熊猫", pinyin: "xióng māo" },
  "elephant": { en: "Elephant", vi: "Voi", ipa: "/ˈel.ɪ.fənt/", zh: "大象", pinyin: "dà xiàng" },
  "voi": { en: "Elephant", vi: "Voi", ipa: "/ˈel.ɪ.fənt/", zh: "大象", pinyin: "dà xiàng" },
  "deer": { en: "Deer", vi: "Hươu", ipa: "/dɪər/", zh: "鹿", pinyin: "lù" },
  "huou": { en: "Deer", vi: "Hươu", ipa: "/dɪər/", zh: "鹿", pinyin: "lù" },
  "hươu": { en: "Deer", vi: "Hươu", ipa: "/dɪər/", zh: "鹿", pinyin: "lù" },
  "tiger": { en: "Tiger", vi: "Hổ", ipa: "/ˈtaɪ.ɡər/", zh: "老虎", pinyin: "lǎo hǔ" },
  "ho": { en: "Tiger", vi: "Hổ", ipa: "/ˈtaɪ.ɡər/", zh: "老虎", pinyin: "lǎo hǔ" },
  "hổ": { en: "Tiger", vi: "Hổ", ipa: "/ˈtaɪ.ɡər/", zh: "老虎", pinyin: "lǎo hǔ" },
  "cọp": { en: "Tiger", vi: "Hổ", ipa: "/ˈtaɪ.ɡər/", zh: "老虎", pinyin: "lǎo hǔ" },
  "rabbit": { en: "Rabbit", vi: "Thỏ", ipa: "/ˈræb.ɪt/", zh: "兔子", pinyin: "tù zi" },
  "tho": { en: "Rabbit", vi: "Thỏ", ipa: "/ˈræb.ɪt/", zh: "兔子", pinyin: "tù zi" },
  "thỏ": { en: "Rabbit", vi: "Thỏ", ipa: "/ˈræb.ɪt/", zh: "兔子", pinyin: "tù zi" },
  "monkey": { en: "Monkey", vi: "Khỉ", ipa: "/ˈmʌŋ.ki/", zh: "猴子", pinyin: "hóu zi" },
  "khi": { en: "Monkey", vi: "Khỉ", ipa: "/ˈmʌŋ.ki/", zh: "猴子", pinyin: "hóu zi" },
  "khỉ": { en: "Monkey", vi: "Khỉ", ipa: "/ˈmʌŋ.ki/", zh: "猴子", pinyin: "hóu zi" },
  "bird": { en: "Bird", vi: "Chim", ipa: "/bɜːd/", zh: "鸟", pinyin: "niǎo" },
  "chim": { en: "Bird", vi: "Chim", ipa: "/bɜːd/", zh: "鸟", pinyin: "niǎo" },
  "fish": { en: "Fish", vi: "Cá", ipa: "/fɪʃ/", zh: "鱼", pinyin: "yú" },
  "ca": { en: "Fish", vi: "Cá", ipa: "/fɪʃ/", zh: "鱼", pinyin: "yú" },
  "cá": { en: "Fish", vi: "Cá", ipa: "/fɪʃ/", zh: "鱼", pinyin: "yú" },
};

/**
 * Gọi Google Translate GTX API để dịch và lấy Pinyin romanization
 */
async function fetchGoogleTranslate(
  text: string,
  from: string,
  to: string
): Promise<{ translation: string; romanization: string }> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&dt=rm&q=${encodeURIComponent(
      text
    )}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
    });

    if (!res.ok) {
      return { translation: "", romanization: "" };
    }

    const data = await res.json();
    let translation = "";
    let romanization = "";

    if (Array.isArray(data) && Array.isArray(data[0])) {
      for (const item of data[0]) {
        if (Array.isArray(item)) {
          if (typeof item[0] === "string") {
            translation += item[0];
          }
          if (typeof item[2] === "string" && !romanization) {
            romanization = item[2];
          } else if (typeof item[3] === "string" && !romanization) {
            romanization = item[3];
          }
        }
      }
    }

    return { translation: translation.trim(), romanization: romanization.trim() };
  } catch {
    return { translation: "", romanization: "" };
  }
}

/**
 * Tra cứu phiên âm chuẩn IPA từ Free Dictionary API
 */
async function fetchEnglishIpa(word: string): Promise<string> {
  const clean = word.toLowerCase().trim().replace(/[^a-z\s-]/g, "");
  if (!clean) return "";

  // Thử từ đầu tiên nếu là cụm từ (ví dụ: "cable car" -> tìm "cable")
  const primaryWord = clean.split(" ")[0];

  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
      primaryWord
    )}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) return "";

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      if (entry.phonetic) {
        return entry.phonetic.startsWith("/") ? entry.phonetic : `/${entry.phonetic}/`;
      }
      if (Array.isArray(entry.phonetics)) {
        for (const p of entry.phonetics) {
          if (p.text) {
            return p.text.startsWith("/") ? p.text : `/${p.text}/`;
          }
        }
      }
    }
    return "";
  } catch {
    return "";
  }
}

function detectLanguage(text: string): "vi" | "en" | "zh" {
  // Ký tự chữ Hán
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return "zh";
  }
  // Ký tự tiếng Việt có dấu
  if (
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(
      text
    )
  ) {
    return "vi";
  }
  return "en";
}

export async function POST(req: NextRequest) {
  try {
    const body: TranslateRequestBody = await req.json();
    const rawText = body.text ? body.text.trim() : "";

    if (!rawText) {
      return NextResponse.json(
        { success: false, message: "Văn bản không được để trống" },
        { status: 400 }
      );
    }

    const detectedLang = body.sourceLang || detectLanguage(rawText);
    const lookupKey = rawText.toLowerCase();

    // 1. Kiểm tra từ điển có sẵn (Flashcard dictionary)
    if (FLASHCARD_DICTIONARY[lookupKey]) {
      const match = FLASHCARD_DICTIONARY[lookupKey];
      return NextResponse.json({
        success: true,
        source: detectedLang,
        nameVi: match.vi,
        nameEn: match.en,
        ipa: match.ipa,
        nameZh: match.zh,
        pinyinZh: match.pinyin,
        suggestedSlug: match.en.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      });
    }

    let finalVi = "";
    let finalEn = "";
    let finalIpa = "";
    let finalZh = "";
    let finalPinyin = "";

    if (detectedLang === "vi") {
      finalVi = rawText;

      // Dịch sang Tiếng Anh
      const enRes = await fetchGoogleTranslate(rawText, "vi", "en");
      finalEn = enRes.translation || rawText;

      // Tra cứu IPA
      finalIpa = await fetchEnglishIpa(finalEn);
      if (!finalIpa) {
        finalIpa = `/${finalEn.toLowerCase()}/`;
      }

      // Dịch sang Tiếng Trung + lấy Pinyin
      const zhRes = await fetchGoogleTranslate(rawText, "vi", "zh-CN");
      finalZh = zhRes.translation;
      finalPinyin = zhRes.romanization.toLowerCase();
    } else if (detectedLang === "en") {
      finalEn = rawText.charAt(0).toUpperCase() + rawText.slice(1);

      // Tra cứu IPA
      finalIpa = await fetchEnglishIpa(finalEn);
      if (!finalIpa) {
        finalIpa = `/${finalEn.toLowerCase()}/`;
      }

      // Dịch sang Tiếng Việt
      const viRes = await fetchGoogleTranslate(rawText, "en", "vi");
      finalVi = viRes.translation;

      // Dịch sang Tiếng Trung + lấy Pinyin
      const zhRes = await fetchGoogleTranslate(rawText, "en", "zh-CN");
      finalZh = zhRes.translation;
      finalPinyin = zhRes.romanization.toLowerCase();
    } else if (detectedLang === "zh") {
      finalZh = rawText;

      // Dịch sang Tiếng Việt
      const viRes = await fetchGoogleTranslate(rawText, "zh-CN", "vi");
      finalVi = viRes.translation;

      // Dịch sang Tiếng Anh
      const enRes = await fetchGoogleTranslate(rawText, "zh-CN", "en");
      finalEn = enRes.translation ? enRes.translation.charAt(0).toUpperCase() + enRes.translation.slice(1) : "";

      // Tra cứu IPA
      finalIpa = await fetchEnglishIpa(finalEn);
      if (!finalIpa && finalEn) {
        finalIpa = `/${finalEn.toLowerCase()}/`;
      }

      // Lấy Pinyin
      const zhRes = await fetchGoogleTranslate(rawText, "zh-CN", "en");
      finalPinyin = zhRes.romanization ? zhRes.romanization.toLowerCase() : "";
      if (!finalPinyin) {
        const selfZh = await fetchGoogleTranslate(rawText, "zh-CN", "zh-CN");
        finalPinyin = selfZh.romanization ? selfZh.romanization.toLowerCase() : "";
      }
    }

    const suggestedSlug = (finalEn || finalVi || "polycards")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return NextResponse.json({
      success: true,
      source: detectedLang,
      nameVi: finalVi || rawText,
      nameEn: finalEn || rawText,
      ipa: finalIpa,
      nameZh: finalZh,
      pinyinZh: finalPinyin,
      suggestedSlug: suggestedSlug || "polycards",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi trong quá trình xử lý dịch và sinh phiên âm",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

