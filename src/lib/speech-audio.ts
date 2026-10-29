/**
 * Poly Cards Audio & Speech Synthesis Engine
 * Tương tác phát âm đa ngữ (EN, VI, ZH) và hiệu ứng âm thanh con vật cho trẻ em.
 * Ưu tiên phát file âm thanh riêng (.mp3 / .wav) do tác giả tải lên, tự động fallback sang Web Speech API.
 */

import { Animal } from "@/types/animal";

// Đảm bảo không lỗi trên SSR (Server-Side Rendering)
const isBrowser = typeof window !== "undefined";

let activeAudioElement: HTMLAudioElement | null = null;

/**
 * Dừng mọi luồng âm thanh hoặc giọng đọc đang phát
 */
export function stopAllCardAudio(): void {
  if (!isBrowser) return;
  try {
    if (activeAudioElement) {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  } catch {}
}

/**
 * Kiểm tra đường dẫn âm thanh có phải là tệp tùy chỉnh đã tải lên hay không
 */
export function isCustomUploadedAudioUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  if (!clean) return false;
  // Các đường dẫn mặc định dạng /audio/en/lion.mp3 hoặc /audio/lion.mp3 chưa có file vật lý sẽ ưu tiên Web Speech AI hoặc Web Audio Synth
  if (/^\/audio\/(en\/|vi\/|zh\/)?[a-z0-9-_]+\.mp3$/i.test(clean)) {
    return false;
  }
  return true;
}

/**
 * Phát âm từ vựng theo ngôn ngữ (EN / VI / ZH):
 * 1. Nếu thẻ có tải lên tệp âm thanh riêng cho ngôn ngữ đó (animal.audios[lang]), phát file MP3/WAV đó trước.
 * 2. Nếu chưa tải file riêng (hoặc file lỗi), tự động phát âm chuẩn bản xứ bằng Web Speech AI.
 */
export function playCardLanguageAudio(
  animal: Pick<Animal, "nameEn" | "nameVi" | "nameZh" | "audios" | "audioUrl">,
  lang: "en" | "vi" | "zh",
  onEnd?: () => void
): void {
  if (!isBrowser) {
    if (onEnd) onEnd();
    return;
  }

  stopAllCardAudio();

  let textToSpeak = animal.nameEn || animal.nameVi;
  if (lang === "vi") textToSpeak = animal.nameVi || animal.nameEn;
  if (lang === "zh") textToSpeak = animal.nameZh || animal.nameVi || animal.nameEn;

  const customLangUrl = animal.audios?.[lang]?.trim();

  if (customLangUrl && isCustomUploadedAudioUrl(customLangUrl)) {
    try {
      const audio = new Audio(customLangUrl);
      activeAudioElement = audio;

      let fallbackTriggered = false;
      const triggerFallback = () => {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        activeAudioElement = null;
        speakWord(textToSpeak, lang, onEnd);
      };

      audio.onended = () => {
        activeAudioElement = null;
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        triggerFallback();
      };

      audio.play().catch(() => {
        triggerFallback();
      });
      return;
    } catch {
      // Fallback sang Web Speech API bên dưới
    }
  }

  speakWord(textToSpeak, lang, onEnd);
}

/**
 * Phát âm từ vựng chuẩn ngữ âm thông qua Web Speech API
 */
export function speakWord(text: string, lang: "en" | "vi" | "zh", onEnd?: () => void): boolean {
  if (!isBrowser || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    // Dừng câu nói trước đó nếu đang phát dở
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Cấu hình mã ngôn ngữ chuẩn quốc tế BCP 47
    if (lang === "en") {
      utterance.lang = "en-US";
      utterance.rate = 0.88; // Tốc độ vừa phải cho bé dễ nghe theo chuẩn bản xứ
      utterance.pitch = 1.05;
    } else if (lang === "vi") {
      utterance.lang = "vi-VN";
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
    } else if (lang === "zh") {
      utterance.lang = "zh-CN";
      utterance.rate = 0.88;
      utterance.pitch = 1.0;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn("[Speech Engine] Lỗi khi phát âm:", err);
    if (onEnd) onEnd();
    return false;
  }
}

/**
 * Tạo âm thanh mô phỏng tiếng kêu con vật / hành động sống động:
 * Ưu tiên phát file hiệu ứng customAudioUrl nếu đã tải lên, nếu không dùng Web Audio API Synth.
 */
export function playAnimalSoundEffect(
  slug: string,
  onEnd?: () => void,
  customAudioUrl?: string
): void {
  if (!isBrowser) return;

  if (customAudioUrl && isCustomUploadedAudioUrl(customAudioUrl)) {
    try {
      stopAllCardAudio();
      const audio = new Audio(customAudioUrl.trim());
      activeAudioElement = audio;
      audio.onended = () => {
        activeAudioElement = null;
        if (onEnd) onEnd();
      };
      audio.onerror = () => {
        activeAudioElement = null;
        playSynthSoundEffect(slug, onEnd);
      };
      audio.play().catch(() => {
        activeAudioElement = null;
        playSynthSoundEffect(slug, onEnd);
      });
      return;
    } catch {}
  }

  playSynthSoundEffect(slug, onEnd);
}

function playSynthSoundEffect(slug: string, onEnd?: () => void): void {
  if (!isBrowser) return;

  // Nếu trình duyệt hỗ trợ AudioContext
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    if (onEnd) onEnd();
    return;
  }

  try {
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (slug === "dog") {
      // Tiếng sủa "Gâu gâu" nhịp nhàng của chú chó
      const playBark = (startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, startTime);
        osc.frequency.exponentialRampToValueAtTime(140, startTime + 0.15);

        gain.gain.setValueAtTime(0.01, startTime);
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.18);
      };
      playBark(now);
      playBark(now + 0.22);
      setTimeout(() => { if (onEnd) onEnd(); }, 500);

    } else if (slug === "cat") {
      // Tiếng mèo kêu "Meo meo" ngọt ngào
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(750, now + 0.25);
      osc.frequency.linearRampToValueAtTime(400, now + 0.65);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
      setTimeout(() => { if (onEnd) onEnd(); }, 800);

    } else if (slug === "lion") {
      // Tiếng gầm uy lực của sư tử
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.4);
      osc.frequency.linearRampToValueAtTime(50, now + 0.9);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
      setTimeout(() => { if (onEnd) onEnd(); }, 1250);

    } else if (slug === "elephant") {
      // Tiếng voi rống vang dội
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.35);
      osc.frequency.linearRampToValueAtTime(250, now + 0.8);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.95);
      setTimeout(() => { if (onEnd) onEnd(); }, 1000);

    } else {
      // Deer hoặc Panda: Âm thanh trong trẻo đáng yêu
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.45);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
      setTimeout(() => { if (onEnd) onEnd(); }, 600);
    }
  } catch (err) {
    console.warn("[Animal Sound] Không thể phát âm thanh:", err);
    if (onEnd) onEnd();
  }
}
