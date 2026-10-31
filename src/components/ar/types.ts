import { Animal } from "@/types/animal";

export type ArCameraFacingMode = "environment" | "user";

export interface ArGestureState {
  targetPos: { x: number; y: number; z: number };
  currentPos: { x: number; y: number; z: number };
  targetRotY: number;
  currentRotY: number;
  targetRotX: number;
  currentRotX: number;
  targetScale: number;
  currentScale: number;
  isHoldingModel: boolean;
  isPinching: boolean;
  isRotating: boolean;
  zoomPercent: number;
}

export interface ArVoiceQuizResult {
  transcript: string;
  isCorrect: boolean;
  confidence: number;
}
