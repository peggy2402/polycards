/**
 * Poly Cards Audio & Speech Synthesis Engine
 * Tương tác phát âm đa ngữ (EN, VI, ZH) và hiệu ứng âm thanh con vật cho trẻ em.
 * Ưu tiên phát file âm thanh riêng (.mp3 / .wav) do tác giả tải lên, tự động fallback sang Web Speech API.
 */

import { Animal } from "@/types/animal";

// Đảm bảo không lỗi trên SSR (Server-Side Rendering)
const isBrowser = typeof window !== "undefined";

let activeAudioElement: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeAudioContext: AudioContext | null = null;

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
    activeUtterance = null;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (activeAudioContext) {
      try {
        activeAudioContext.close().catch(() => {});
      } catch {}
      activeAudioContext = null;
    }
  } catch {}
}

/**
 * Kiểm tra đường dẫn âm thanh có phải là tệp hợp lệ hay không
 */
export function isCustomUploadedAudioUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  if (!clean) return false;
  return (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("/audio/") ||
    clean.startsWith("blob:") ||
    clean.startsWith("data:")
  );
}

/**
 * Phát âm qua Streaming TTS API (/api/tts?text=...&lang=...) bằng thẻ HTML5 Audio native
 * Hoạt động 100% trên iOS Safari, Android Chrome, MacOS, Windows, iPad, không phụ thuộc vào TTS cài trên máy.
 */
export function playTtsAudioStream(
  text: string,
  lang: "en" | "vi" | "zh",
  onEnd?: () => void,
  onFallback?: () => void
): boolean {
  if (!isBrowser) {
    if (onEnd) onEnd();
    return false;
  }

  try {
    const ttsUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
    const audio = new Audio(ttsUrl);
    activeAudioElement = audio;

    let finished = false;
    const handleFinish = () => {
      if (finished) return;
      finished = true;
      if (activeAudioElement === audio) activeAudioElement = null;
      if (onEnd) onEnd();
    };

    audio.onended = handleFinish;

    const triggerFallback = () => {
      if (finished) return;
      finished = true;
      if (activeAudioElement === audio) activeAudioElement = null;
      if (onFallback) {
        onFallback();
      } else {
        speakWithWebSpeechSynthesis(text, lang, onEnd);
      }
    };

    audio.onerror = triggerFallback;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        triggerFallback();
      });
    }
    return true;
  } catch {
    if (onFallback) {
      onFallback();
    } else {
      speakWithWebSpeechSynthesis(text, lang, onEnd);
    }
    return false;
  }
}

/**
 * Phát âm từ vựng theo ngôn ngữ (EN / VI / ZH):
 * 1. Nếu thẻ có tải lên tệp âm thanh riêng cho ngôn ngữ đó (animal.audios[lang]), phát file MP3/WAV đó trước.
 * 2. Nếu chưa tải file riêng (hoặc file lỗi), tự động phát âm chuẩn bản xứ bằng Streaming TTS API (/api/tts).
 * 3. Nếu mạng lỗi, fallback tự động sang Web Speech API của trình duyệt.
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

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          triggerFallback();
        });
      }
      return;
    } catch {
      // Fallback sang speakWord bên dưới
    }
  }

  speakWord(textToSpeak, lang, onEnd);
}

/**
 * Phát âm từ vựng chuẩn ngữ âm:
 * 1. Ưu tiên tệp âm thanh trực tiếp nếu có (preferredAudioUrl)
 * 2. Phát giọng đọc chuẩn bản xứ qua TTS Streaming API (/api/tts)
 * 3. Tự động fallback sang Web Speech API nếu offline
 */
export function speakWord(
  text: string,
  lang: "en" | "vi" | "zh",
  onEnd?: () => void,
  preferredAudioUrl?: string
): boolean {
  if (!isBrowser) {
    if (onEnd) onEnd();
    return false;
  }

  stopAllCardAudio();

  // 1. Nếu có URL âm thanh ưu tiên (ví dụ file mp3 tĩnh /audio/en/butterfly.mp3)
  if (preferredAudioUrl && isCustomUploadedAudioUrl(preferredAudioUrl)) {
    try {
      const audio = new Audio(preferredAudioUrl);
      activeAudioElement = audio;

      let fallbackTriggered = false;
      const triggerFallback = () => {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        activeAudioElement = null;
        playTtsAudioStream(text, lang, onEnd);
      };

      audio.onended = () => {
        activeAudioElement = null;
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        triggerFallback();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          triggerFallback();
        });
      }
      return true;
    } catch {
      // Tiếp tục fallback bên dưới
    }
  }

  // 2. Phát âm chuẩn bản xứ qua Streaming TTS API
  return playTtsAudioStream(text, lang, onEnd, () => {
    speakWithWebSpeechSynthesis(text, lang, onEnd);
  });
}

/**
 * Phát âm qua Web Speech API (Fallback offline nội bộ của trình duyệt)
 */
export function speakWithWebSpeechSynthesis(
  text: string,
  lang: "en" | "vi" | "zh",
  onEnd?: () => void
): boolean {
  if (!isBrowser) {
    if (onEnd) onEnd();
    return false;
  }

  if (!("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    // Cấu hình mã ngôn ngữ chuẩn quốc tế BCP 47
    if (lang === "en") {
      utterance.lang = "en-US";
      utterance.rate = 0.88;
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

    // Ưu tiên chọn voice phù hợp với ngôn ngữ nếu trình duyệt đã load voices
    const applyVoice = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const prefix = lang === "en" ? "en" : lang === "vi" ? "vi" : "zh";
          const matched = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
          if (matched) {
            utterance.voice = matched;
          }
        }
      } catch {}
    };
    applyVoice();

    let isDone = false;
    const finish = () => {
      if (isDone) return;
      isDone = true;
      activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    // Timeout an toàn 4s phòng khi browser không kích hoạt onend
    setTimeout(finish, 4000);

    // Kích hoạt speak ngay trong User Gesture Context
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch {
      finish();
    }

    return true;
  } catch (err) {
    console.warn("[Speech Engine] Lỗi khi phát âm SpeechSynthesis:", err);
    activeUtterance = null;
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
    if (activeAudioContext) {
      try {
        activeAudioContext.close().catch(() => {});
      } catch {}
      activeAudioContext = null;
    }
    const ctx = new AudioContextClass();
    activeAudioContext = ctx;
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

/**
 * Âm thanh chúc mừng trong trẻo khi bé trả lời đúng hoặc chạm trúng con vật (Web Audio Synth)
 */
export function playCheerfulCelebrationSound(onEnd?: () => void): void {
  if (!isBrowser) {
    if (onEnd) onEnd();
    return;
  }
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      if (onEnd) onEnd();
      return;
    }
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Rạng rỡ)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.08;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });

    setTimeout(() => {
      if (onEnd) onEnd();
    }, 600);
  } catch {
    if (onEnd) onEnd();
  }
}

/**
 * Âm thanh động viên nhẹ nhàng khi bé phát âm chưa khớp
 */
export function playGentleEncourageSound(onEnd?: () => void): void {
  if (!isBrowser) {
    if (onEnd) onEnd();
    return;
  }
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      if (onEnd) onEnd();
      return;
    }
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = [440, 554.37]; // A4, C#5

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.12;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });

    setTimeout(() => {
      if (onEnd) onEnd();
    }, 550);
  } catch {
    if (onEnd) onEnd();
  }
}
