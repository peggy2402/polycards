"use client";

import React, { useState } from "react";
import { Animal } from "@/types/animal";
import { ModelViewerView } from "@/components/ar/model-viewer-view";
import { ArAudioPlayer } from "@/components/ar/ar-audio-player";
import { AnimationControls } from "@/components/ar/animation-controls";

interface ArViewerContainerProps {
  animal: Animal;
}

export function ArViewerContainer({ animal }: ArViewerContainerProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<string>(
    animal.animations && animal.animations.length > 0 ? animal.animations[0] : ""
  );

  return (
    <div className="space-y-5">
      {/* 3D Model Viewer with AR launch capabilities */}
      <ModelViewerView
        animal={animal}
        selectedAnimation={selectedAnimation}
      />

      {/* Animation Controls if available */}
      {animal.animations && animal.animations.length > 0 && (
        <AnimationControls
          animations={animal.animations}
          selectedAnimation={selectedAnimation}
          onSelectAnimation={setSelectedAnimation}
        />
      )}

      {/* Multilingual Audio Listen Panel */}
      <ArAudioPlayer animal={animal} />
    </div>
  );
}
