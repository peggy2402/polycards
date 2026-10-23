"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Animal } from "@/types/animal";
import { getAllAnimals } from "@/lib/animals";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  Volume2,
  ArrowRight,
  Star,
} from "lucide-react";

interface ArInteractiveQuizProps {
  currentAnimal: Animal;
}

export function ArInteractiveQuiz({ currentAnimal }: ArInteractiveQuizProps) {
  const allAnimals = getAllAnimals();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Sinh 3 lựa chọn gồm: con vật hiện tại + 2 con vật khác (Deterministic, không dùng Math.random để tránh lỗi SSR)
  const options = React.useMemo(() => {
    const wrongAnimals = allAnimals.filter((a) => a.id !== currentAnimal.id);
    if (wrongAnimals.length < 2) return [currentAnimal];

    // Tạo seed cố định dựa trên ký tự của con vật hiện tại
    const seed = currentAnimal.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const firstIndex = seed % wrongAnimals.length;
    let secondIndex = (seed + 1) % wrongAnimals.length;
    if (secondIndex === firstIndex) {
      secondIndex = (secondIndex + 1) % wrongAnimals.length;
    }

    const pickedWrong = [wrongAnimals[firstIndex], wrongAnimals[secondIndex]];
    const targetPos = seed % 3; // Vị trí 0, 1 hoặc 2
    const combined = [...pickedWrong];
    combined.splice(targetPos, 0, currentAnimal);
    return combined;
  }, [currentAnimal, allAnimals]);

  const handleSelectOption = (animal: Animal) => {
    setSelectedOptionId(animal.id);
    if (animal.id === currentAnimal.id) {
      setIsCorrect(true);
      setHasCompleted(true);
      try {
        navigator.vibrate?.([60, 40, 60]);
      } catch {}
    } else {
      setIsCorrect(false);
      try {
        navigator.vibrate?.(100);
      } catch {}
    }
  };

  const handleResetQuiz = () => {
    setSelectedOptionId(null);
    setIsCorrect(null);
  };

  return (
    <div className="rounded-3xl border-2 border-emerald-200/90 bg-white/95 p-5 sm:p-6 shadow-xl shadow-emerald-950/5 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Thử Thách Tương Tác: Bé Nhớ Được Gì?
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Mini game củng cố trí nhớ sau khi xem mô hình 3D AR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 border border-amber-300">
          <Star className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
          <span>+10 Điểm Thưởng</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="mt-4 text-center space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
          Câu hỏi tương tác số 1
        </span>
        <h4 className="text-lg sm:text-xl font-black text-slate-900">
          Đâu là bạn <span className="text-emerald-700 underline underline-offset-4">&ldquo;{currentAnimal.nameEn}&rdquo;</span> ({currentAnimal.nameVi})?
        </h4>
        <p className="text-xs text-slate-600">
          Bé hãy nhìn hình hoặc nghe lại phát âm ở trên để chọn thẻ bài đúng nhé!
        </p>
      </div>

      {/* 3 Interactive Cards Options */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isRightAnswer = option.id === currentAnimal.id;

          let cardStyle = "border-2 border-amber-200/80 bg-amber-50/40 hover:bg-amber-100/60 text-slate-800";
          if (isSelected) {
            if (isRightAnswer) {
              cardStyle = "border-2 border-emerald-500 bg-emerald-100 text-emerald-950 shadow-md shadow-emerald-500/20";
            } else {
              cardStyle = "border-2 border-rose-400 bg-rose-50 text-rose-950";
            }
          } else if (hasCompleted && isRightAnswer) {
            cardStyle = "border-2 border-emerald-500 bg-emerald-50 text-emerald-900";
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={hasCompleted}
              onClick={() => handleSelectOption(option)}
              className={`relative flex flex-col items-center justify-between rounded-2xl p-4 transition-all active:scale-95 text-center ${cardStyle}`}
            >
              <div className="relative aspect-square w-24 overflow-hidden rounded-xl bg-white shadow-xs border border-amber-200 mb-2">
                <Image
                  src={option.images[0] || "/images/animals/lion.jpg"}
                  alt={option.nameVi}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <span className="block text-base font-black">{option.nameEn}</span>
                <span className="text-xs font-bold text-slate-600">{option.nameVi}</span>
                <span className="block text-[10px] font-mono text-slate-500">{option.ipa}</span>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  {isRightAnswer ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-500" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {isCorrect === true && (
        <div className="mt-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-center space-y-2 animate-in zoom-in-95 duration-150">
          <div className="inline-flex items-center gap-1.5 text-emerald-800 font-black text-sm">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Chính xác tuyệt đối! Bé thật thông minh!</span>
          </div>
          <p className="text-xs text-emerald-700">
            Bé đã hoàn thành trọn vẹn chu trình học: <strong>Thẻ bài → Quét AR 3D → Nghe chuẩn IPA → Làm chủ từ vựng!</strong>
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/scan"
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <span>Quét Khám Phá Bạn Tiếp Theo</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {isCorrect === false && (
        <div className="mt-5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center space-y-2 animate-in zoom-in-95 duration-150">
          <p className="text-xs font-black text-amber-950">
            Chưa chính xác rồi bé ơi! Hãy bấm nghe lại phát âm ở khung trên và chọn lại nhé!
          </p>
          <button
            type="button"
            onClick={handleResetQuiz}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-amber-400 bg-white px-4 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-100"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
            <span>Thử Chọn Lại</span>
          </button>
        </div>
      )}
    </div>
  );
}
