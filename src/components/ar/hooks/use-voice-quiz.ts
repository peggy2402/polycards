/**
 * Poly Cards - AR Voice Recognition & Quiz Hook
 * Nhận diện giọng nói của bé qua Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Hỗ trợ đa ngữ (EN-US, ZH-CN, VI-VN), so khớp Levenshtein linh hoạt, bảo mật riêng tư trên máy.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  playCheerfulCelebrationSound,
  playGentleEncourageSound,
} from "@/lib/speech-audio";

interface UseVoiceQuizOptions {
  onSuccess?: (transcript: string) => void;
  onIncorrect?: (transcript: string) => void;
  onShowToast?: (msg: string, type: "info" | "warning" | "error" | "success") => void;
}

/**
 * Tính khoảng cách Levenshtein giữa 2 chuỗi
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = [];

  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // xóa
        d[i][j - 1] + 1, // chèn
        d[i - 1][j - 1] + cost // thay thế
      );
    }
  }
  return d[m][n];
}

/**
 * Chuẩn hóa chuỗi văn bản loại bỏ dấu câu và khoảng trắng
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'“”]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Bỏ dấu thanh tiếng Trung pinyin để so khớp dễ dàng
 */
function stripPinyinTones(pinyin: string): string {
  return pinyin
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function useVoiceQuiz({
  onSuccess,
  onIncorrect,
  onShowToast,
}: UseVoiceQuizOptions = {}) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const timeoutTimerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (
      targetWord: { en?: string; vi?: string; zh?: string; pinyin?: string },
      lang: "en" | "vi" | "zh"
    ) => {
      if (typeof window === "undefined") return;
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        if (onShowToast) {
          onShowToast("Trình duyệt chưa hỗ trợ nhận diện giọng nói.", "warning");
        }
        return;
      }

      stopListening();

      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;

        // Cài đặt ngôn ngữ nhận diện theo ngữ cảnh
        if (lang === "en") recognition.lang = "en-US";
        else if (lang === "zh") recognition.lang = "zh-CN";
        else recognition.lang = "vi-VN";

        setIsListening(true);

        // Tự động dừng sau tối đa 6 giây nếu bé không nói
        timeoutTimerRef.current = setTimeout(() => {
          stopListening();
        }, 6000);

        recognition.onresult = (event: any) => {
          stopListening();
          const results = event.results;
          if (!results || results.length === 0) return;

          const alternatives: string[] = [];
          for (let i = 0; i < results[0].length; i++) {
            alternatives.push(normalizeText(results[0][i].transcript));
          }

          const rawTranscript = results[0][0].transcript;

          // Kiểm tra kết quả so khớp
          let isMatch = false;

          if (lang === "en" && targetWord.en) {
            const target = normalizeText(targetWord.en);
            isMatch = alternatives.some((alt) => {
              if (alt === target || alt.includes(target) || target.includes(alt)) return true;
              return levenshteinDistance(alt, target) <= 2;
            });
          } else if (lang === "zh") {
            const targetZh = targetWord.zh ? normalizeText(targetWord.zh) : "";
            const targetPinyin = targetWord.pinyin ? stripPinyinTones(targetWord.pinyin) : "";
            isMatch = alternatives.some((alt) => {
              if (targetZh && (alt === targetZh || alt.includes(targetZh))) return true;
              if (targetPinyin && stripPinyinTones(alt).includes(targetPinyin)) return true;
              return false;
            });
          } else if (lang === "vi" && targetWord.vi) {
            const target = normalizeText(targetWord.vi);
            isMatch = alternatives.some((alt) => {
              if (alt === target || alt.includes(target) || target.includes(alt)) return true;
              return levenshteinDistance(alt, target) <= 2;
            });
          }

          if (isMatch) {
            playCheerfulCelebrationSound();
            if (onSuccess) onSuccess(rawTranscript);
          } else {
            playGentleEncourageSound();
            if (onIncorrect) onIncorrect(rawTranscript);
          }
        };

        recognition.onerror = (e: any) => {
          stopListening();
          if (e.error === "not-allowed") {
            if (onShowToast) {
              onShowToast("Vui lòng cho phép quyền sử dụng micro để luyện nói.", "warning");
            }
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (err) {
        console.warn("[Speech Recognition Start Error]:", err);
        stopListening();
      }
    },
    [onIncorrect, onShowToast, onSuccess, stopListening]
  );

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
  };
}
