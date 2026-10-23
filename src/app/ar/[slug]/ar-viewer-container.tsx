"use client";

import React, { useState } from "react";
import { Animal } from "@/types/animal";
import { ModelViewerView } from "@/components/ar/model-viewer-view";
import { ArAudioPlayer } from "@/components/ar/ar-audio-player";
import { AnimationControls } from "@/components/ar/animation-controls";
import { ArInteractiveQuiz } from "@/components/ar/ar-interactive-quiz";

interface ArViewerContainerProps {
  animal: Animal;
}

export function ArViewerContainer({ animal }: ArViewerContainerProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<string>(
    animal.animations && animal.animations.length > 0 ? animal.animations[0] : ""
  );

  return (
    <div className="space-y-6">
      {/* 1. 3D Model Viewer with AR launch capabilities (WebXR + Apple Quick Look) */}
      <ModelViewerView
        animal={animal}
        selectedAnimation={selectedAnimation}
      />

      {/* 2. Animation Controls if available */}
      {animal.animations && animal.animations.length > 0 && (
        <AnimationControls
          animations={animal.animations}
          selectedAnimation={selectedAnimation}
          onSelectAnimation={setSelectedAnimation}
        />
      )}

      {/* 3. Multilingual Audio Listen Panel (Tiếng Anh IPA - Tiếng Việt - Tiếng Trung Pinyin) */}
      <ArAudioPlayer animal={animal} />

      {/* 4. Mini Challenge: Tương tác củng cố trí nhớ cho trẻ 3-8 tuổi */}
      <ArInteractiveQuiz currentAnimal={animal} />
    </div>
  );
}
