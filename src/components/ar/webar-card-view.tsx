"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Animal } from "@/types/animal";
import {
  playCardLanguageAudio,
  playAnimalSoundEffect,
  playCheerfulCelebrationSound,
} from "@/lib/speech-audio";
import {
  Camera,
  X,
  Volume2,
  Sparkles,
  Scan,
  RotateCcw,
  Languages,
  Download,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
  KeyRound,
  Clock,
  Wrench,
  MoreVertical,
  Mic,
  MicOff,
  SwitchCamera,
  Compass,
  Activity,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { ArReactionSystem } from "./effects/ar-reaction-system";
import { useArGestures } from "./hooks/use-ar-gestures";
import { useArCamera } from "./hooks/use-ar-camera";
import { useArMotion } from "./hooks/use-ar-motion";
import { useVoiceQuiz } from "./hooks/use-voice-quiz";
import { ArHud } from "./components/ar-hud";
import { ArGestureHint } from "./components/ar-gesture-hint";
import { ArActionSheet, getClipFriendlyLabel } from "./components/ar-action-sheet";

declare global {
  interface Window {
    THREE?: any;
    MINDAR?: {
      IMAGE: {
        MindARThree: any;
        THREE: any;
      };
    };
  }
}

interface WebArCardViewProps {
  animal: Animal;
  onClose: () => void;
  isTrial?: boolean;
  onOpenOrder?: () => void;
  onOpenActivate?: () => void;
}

/**
 * Helper giải phóng triệt để Texture và Material của Three.js tránh memory leak WebGL
 */
function disposeMaterial(mat: any) {
  if (!mat) return;
  try {
    mat.dispose?.();
    for (const key of Object.keys(mat)) {
      const val = mat[key];
      if (val && typeof val.dispose === "function") {
        val.dispose();
      }
    }
  } catch {}
}

/**
 * Triệt tiêu hoàn toàn nút native play/pause overlay và media controls của WebKit trên iOS Safari
 */
function sanitizeVideoElement(video: HTMLVideoElement) {
  try {
    video.controls = false;
    video.removeAttribute("controls");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("x5-playsinline", "true");
    video.setAttribute("x5-video-player-type", "h5-page");
    video.setAttribute("x5-video-player-fullscreen", "false");
    video.setAttribute("disablePictureInPicture", "true");
    video.setAttribute("disableRemotePlayback", "true");
    video.setAttribute("controlslist", "nodownload nofullscreen noremoteplayback");
    video.setAttribute("x-webkit-airplay", "deny");
    video.style.setProperty("pointer-events", "none", "important");
    video.style.setProperty("user-select", "none", "important");
    video.style.setProperty("-webkit-user-select", "none", "important");
    video.style.setProperty("-webkit-touch-callout", "none", "important");

    const blockTouch = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    video.addEventListener("touchstart", blockTouch, { passive: false });
    video.addEventListener("touchend", blockTouch, { passive: false });
    video.addEventListener("touchmove", blockTouch, { passive: false });
    video.addEventListener("pointerdown", blockTouch, { passive: false });
    video.addEventListener("click", blockTouch, { passive: false });

    // Ngăn chặn Safari tạm dừng camera làm xuất hiện nút pause (đặc biệt khi Low Power Mode bật)
    const keepPlaying = () => {
      video.controls = false;
      video.removeAttribute("controls");
      if (video.paused && video.srcObject) {
        video.play().catch(() => {});
      }
    };

    ["pause", "suspend", "loadedmetadata", "canplay", "playing", "emptied"].forEach((ev) => {
      video.addEventListener(ev, keepPlaying);
    });

    if (video.srcObject && video.paused) {
      video.play().catch(() => {});
    }
  } catch {}
}

export function WebArCardView({
  animal,
  onClose,
  isTrial = false,
  onOpenOrder,
  onOpenActivate,
}: WebArCardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindarRef = useRef<any>(null);
  const mixerRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const anchorGroupRef = useRef<any>(null);
  const actionsRef = useRef<{ [name: string]: any }>({});
  const clockRef = useRef<any>(null);

  // Group điều phối chính (Pivot Group chứa Reaction Group)
  const pivotGroupRef = useRef<any>(null);
  const reactionSystemRef = useRef<ArReactionSystem | null>(null);
  const maxDimRef = useRef<number>(1.0);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);

  // Trạng thái theo dõi thẻ (Tracking States)
  const hasScannedOnceRef = useRef<boolean>(false);
  const isTargetFoundRef = useRef<boolean>(false);
  const [isTargetFound, setIsTargetFound] = useState<boolean>(false);
  const [hasScannedOnce, setHasScannedOnce] = useState<boolean>(false);
  const [targetHitCount, setTargetHitCount] = useState<number>(0);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStats, setDownloadStats] = useState<{ loadedMb: string; totalMb: string }>({
    loadedMb: "0",
    totalMb: "0",
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  // Debug HUD & UI States
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Menu More "⋯" & Bottom Action Sheet
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState<boolean>(false);
  const [isActionSelectorOpen, setIsActionSelectorOpen] = useState<boolean>(true);
  const actionSelectorTimerRef = useRef<any>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Auto-hide UI (sau 4s không chạm thì mờ dần để xem toàn cảnh)
  const [isUiFaded, setIsUiFaded] = useState<boolean>(false);
  const [isVocabCollapsed, setIsVocabCollapsed] = useState<boolean>(false);
  const uiActivityTimerRef = useRef<any>(null);

  // Phát hiện chế độ xoay ngang (Landscape Mode)
  const [isLandscape, setIsLandscape] = useState<boolean>(false);

  // Animation Clips & Models
  const [playingClipName, setPlayingClipName] = useState<string | null>(null);
  const [availableClips, setAvailableClips] = useState<string[]>([]);
  const [isFreeArMode, setIsFreeArMode] = useState<boolean>(false);
  const [isUsingFallbackModel, setIsUsingFallbackModel] = useState<boolean>(false);

  // Quản lý timer tự động đóng bảng chọn động tác 3D sau 4 giây
  const resetActionSelectorTimer = useCallback(() => {
    if (actionSelectorTimerRef.current) {
      clearTimeout(actionSelectorTimerRef.current);
    }
    actionSelectorTimerRef.current = setTimeout(() => {
      setIsActionSelectorOpen(false);
    }, 4000);
  }, []);

  // Song Ngữ EN-VI hoặc ZH-VI
  const isEnViEnabled = animal.enableEnVi !== false;
  const isZhViEnabled =
    animal.enableZhVi !== undefined
      ? animal.enableZhVi
      : Boolean(animal.nameZh && animal.nameZh.trim());

  const [urlLockedTrack, setUrlLockedTrack] = useState<"en-vi" | "zh-vi" | null>(null);
  const [languageTrack, setLanguageTrack] = useState<"en-vi" | "zh-vi">(
    !isEnViEnabled && isZhViEnabled ? "zh-vi" : "en-vi"
  );
  const [activeLang, setActiveLang] = useState<"en" | "vi" | "zh" | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);

  // Toast nhẹ thông báo
  const [toastMsg, setToastMsg] = useState<{ text: string; type: string } | null>(null);
  const toastTimerRef = useRef<any>(null);
  const showToast = useCallback((text: string, type: "info" | "warning" | "error" | "success" = "info") => {
    setToastMsg({ text, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // 3s Trial Timer
  const [trialTimeLeft, setTrialTimeLeft] = useState<number>(isTrial ? 3 : 0);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(false);

  // Chiều cao nửa thân (half height) của mô hình để làm tâm xoay Quả cầu quỹ đạo (A0 & A1)
  const halfHRef = useRef<number>(0.36);

  // P4.1 Camera Hook (Chuyển đổi Camera Trước / Sau không bị màn hình đen)
  const {
    facingMode,
    setFacingMode,
    hasMultipleCameras,
    switchCamera,
    capturePhoto,
    isSwitching: isCameraSwitching,
  } = useArCamera({ onShowToast: showToast });

  // P4.2 Motion Gyro Hook (Orbit Sphere & World Lock 3DoF)
  const [isMotionEnabled, setIsMotionEnabled] = useState<boolean>(true);
  const [motionMode, setMotionMode] = useState<"orbit-sphere" | "world-lock" | "off">("orbit-sphere");
  const [lockRoll, setLockRoll] = useState<boolean>(false);
  const [isManual360Active, setIsManual360Active] = useState<boolean>(false);

  const {
    isMotionSupported,
    isPermissionGranted: isMotionPermissionGranted,
    needsPermissionPrompt: needsMotionPrompt,
    requestMotionPermission,
    gyroQuatRef,
    motionDebugAnglesRef,
    resetBasePose,
  } = useArMotion({ enabled: isMotionEnabled });

  // REFS CẬP NHẬT MỖI RENDER: Cho phép render loop và handler đọc giá trị mới nhất
  // mà TUYỆT ĐỐI KHÔNG làm re-trigger effect khởi tạo AR (ngăn chặn crash OOM trên iOS)
  const isMotionEnabledRef = useRef(isMotionEnabled);
  isMotionEnabledRef.current = isMotionEnabled;

  const motionModeRef = useRef(motionMode);
  motionModeRef.current = motionMode;

  const lockRollRef = useRef(lockRoll);
  lockRollRef.current = lockRoll;

  // Giám sát DOM và triệt tiêu ngay lập tức Controls / Pause Overlay của iOS Safari WebKit trên camera video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Quét ngay các video hiện có
    container.querySelectorAll("video").forEach((v) => sanitizeVideoElement(v as HTMLVideoElement));

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLVideoElement) {
            sanitizeVideoElement(node);
          } else if (node instanceof HTMLElement) {
            node.querySelectorAll("video").forEach((v) => sanitizeVideoElement(v as HTMLVideoElement));
          }
        });
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    // Heartbeat: Định kỳ kiểm tra bảo đảm video luôn ở trạng thái playing và controls = false
    const heartbeatTimer = setInterval(() => {
      const v = (mindarRef.current?.video || container.querySelector("video") || document.querySelector("#webar-camera-viewport video")) as HTMLVideoElement | null;
      if (v) {
        if (v.controls) {
          v.controls = false;
          v.removeAttribute("controls");
        }
        if (v.paused && v.srcObject) {
          v.play().catch(() => {});
        }
      }
    }, 1000);

    return () => {
      observer.disconnect();
      clearInterval(heartbeatTimer);
    };
  }, []);

  const isManual360ActiveRef = useRef(isManual360Active);
  isManual360ActiveRef.current = isManual360Active;

  const isMotionPermissionGrantedRef = useRef(isMotionPermissionGranted);
  isMotionPermissionGrantedRef.current = isMotionPermissionGranted;

  const gyroQuatRefLatest = useRef(gyroQuatRef);
  gyroQuatRefLatest.current = gyroQuatRef;

  const facingModeRef = useRef(facingMode);
  facingModeRef.current = facingMode;

  // Đếm số lần effect startAR chạy để kiểm chứng không bị tải lại (chỉ 1 lần mỗi con vật)
  const startArCallCountRef = useRef(0);

  // Hỗ trợ Apple AR Quick Look (iOS .usdz) & WebXR (Android) cho Bước 4 & Prompt 5
  const [supportsAppleAr, setSupportsAppleAr] = useState<boolean>(false);
  const [supportsWebXr, setSupportsWebXr] = useState<boolean>(false);
  const nativeModelViewerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const a = document.createElement("a");
      setSupportsAppleAr(Boolean(a.relList && a.relList.supports && a.relList.supports("ar")));
    }
    if (typeof navigator !== "undefined" && (navigator as any).xr?.isSessionSupported) {
      (navigator as any).xr.isSessionSupported("immersive-ar").then((sup: boolean) => {
        setSupportsWebXr(sup);
      }).catch(() => {});
    }
    // Nạp @google/model-viewer cho WebXR Android (KHÔNG nạp trên iOS để tránh tạo thêm WebGL context gây sập RAM Safari)
    if (
      typeof window !== "undefined" &&
      !supportsAppleAr &&
      !customElements.get("model-viewer")
    ) {
      import("@google/model-viewer").catch(() => {});
    }
  }, [supportsAppleAr]);

  // Kích hoạt AR native (Quick Look iOS / WebXR Android) ngay trong user click handler
  const handleLaunchNativeAr = useCallback(() => {
    // 1. Ưu tiên Apple AR Quick Look trên iOS (Native qua thẻ <a> rel="ar", không tốn WebGL context)
    if (supportsAppleAr) {
      const quickLookAnchor = document.getElementById("native-ar-quick-look-anchor") as HTMLAnchorElement | null;
      if (quickLookAnchor) {
        quickLookAnchor.click();
        return;
      }
    }

    // 2. Kích hoạt WebXR trên Android
    if (nativeModelViewerRef.current && typeof nativeModelViewerRef.current.activateAR === "function") {
      try {
        nativeModelViewerRef.current.activateAR();
        return;
      } catch {}
    }
    const quickLookAnchor = document.getElementById("native-ar-quick-look-anchor") as HTMLAnchorElement | null;
    quickLookAnchor?.click();
  }, [supportsAppleAr]);

  // Phản ứng khi chạm vào con vật (P2: Squash & stretch, parabolic jump, floating stars, audio)
  const handleTapModel = useCallback(() => {
    playAnimalSoundEffect(animal.slug, undefined, animal.audioUrl);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([25, 30, 25]);
      } catch {}
    }
    if (reactionSystemRef.current) {
      reactionSystemRef.current.triggerTapReaction(
        animal.animations,
        actionsRef.current,
        playingClipName
      );
    }
  }, [animal.slug, animal.audioUrl, animal.animations, playingClipName]);

  const gestureSpaceRef = useRef<"tracking" | "free">("free");
  const anchorQuatRef = useRef<any>(null);

  // P0 & P1 Gestures Hook (Pointer Events + 60FPS Physics Damping)
  const {
    pointerHandlers,
    resetTransform,
    adjustZoom,
    updatePhysics,
    currentPosRef,
    panCamCurrentRef,
    targetScaleRef,
    isHoldingModelRef,
    gestureStateRef,
  } = useArGestures({
    containerRef,
    pivotGroupRef,
    maxDimRef,
    halfHRef,
    cameraRef,
    gestureSpaceRef,
    anchorQuatRef,
    onTapModel: handleTapModel,
    onZoomChange: setZoomPercent,
    onResetGesture: () => {
      resetBasePose();
      showToast("Đã đặt lại góc nhìn & vị trí 100%", "info");
    },
    onDoubleTapEmpty: () => {
      resetBasePose();
      showToast("Đã đặt lại góc nhìn & vị trí 100%", "info");
    },
  });

  const updatePhysicsRef = useRef(updatePhysics);
  updatePhysicsRef.current = updatePhysics;

  const resetBasePoseRef = useRef(resetBasePose);
  resetBasePoseRef.current = resetBasePose;

  const currentPosRefLatest = useRef(currentPosRef);
  currentPosRefLatest.current = currentPosRef;

  const panCamCurrentRefLatest = useRef(panCamCurrentRef);
  panCamCurrentRefLatest.current = panCamCurrentRef;

  const gestureStateRefLatest = useRef(gestureStateRef);
  gestureStateRefLatest.current = gestureStateRef;

  const stopFrontStreamRef = useRef(() => {});

  // P4.3 Voice Recognition Quiz Hook
  const { isSupported: isVoiceSupported, isListening, startListening } = useVoiceQuiz({
    onSuccess: (transcript) => {
      showToast(`Chính xác: "${transcript}"! Bé giỏi quá!`, "success");
      handleTapModel();
    },
    onIncorrect: (transcript) => {
      showToast(`Bé vừa nói: "${transcript}". Bé hãy thử lại nhé!`, "info");
      if (reactionSystemRef.current) {
        reactionSystemRef.current.triggerAudioRipple();
      }
      playCardLanguageAudio(animal, languageTrack === "zh-vi" ? "zh" : "en");
    },
    onShowToast: showToast,
  });

  // Reset timer auto-hide UI mỗi khi người dùng tương tác
  const wakeUi = useCallback(() => {
    setIsUiFaded(false);
    if (uiActivityTimerRef.current) clearTimeout(uiActivityTimerRef.current);
    uiActivityTimerRef.current = setTimeout(() => {
      setIsUiFaded(true);
      setIsMenuOpen(false);
    }, 4000);
  }, []);

  // Lắng nghe kích thước và hướng xoay màn hình (Portrait vs Landscape)
  useEffect(() => {
    const handleResize = () => {
      const isLand = window.innerWidth > window.innerHeight;
      setIsLandscape(isLand);

      if (cameraRef.current && rendererRef.current) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // Kiểm tra tham số ?debug=1 trên URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("debug") === "1" || sp.get("debug") === "true") {
        setIsDebugOpen(true);
      }
      const queryLang = sp.get("lang");
      if (queryLang === "en-vi" || queryLang === "zh-vi") {
        setUrlLockedTrack(queryLang);
        setLanguageTrack(queryLang);
      }
    }
  }, []);

  // Countdown timer dùng thử 3s
  useEffect(() => {
    if (!isTrial || isLoading || isTrialExpired) return;
    const timer = setInterval(() => {
      setTrialTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTrialExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTrial, isLoading, isTrialExpired]);

  // Dynamic script loader utility
  const loadScript = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = (e) => reject(new Error(`Failed to load script ${src}: ${e}`));
      document.body.appendChild(s);
    });
  }, []);

  // KHỞI ĐỘNG AR ENGINE (MindAR Three.js + Instant 3D View + P2 Lighting)
  useEffect(() => {
    let isCancelled = false;

    async function startAR() {
      try {
        startArCallCountRef.current++;
        console.warn(
          `[PolyCards WebAR Engine] startAR() khởi chạy lần ${startArCallCountRef.current} cho thẻ "${animal.slug}". (Yêu cầu kiểm chứng: chỉ chạy đúng 1 lần khi mở thẻ, không reload khi đổi Gyro/Camera/Ngôn ngữ)`
        );

        setIsLoading(true);
        setDownloadProgress(8);
        setLoadError(null);

        // 1. Nạp MindAR Three UMD
        if (!window.MINDAR || !window.MINDAR.IMAGE || !window.MINDAR.IMAGE.MindARThree) {
          await loadScript("/lib/mindar-image-three.prod.js");
        }

        if (isCancelled) return;
        setDownloadProgress(20);

        // Gán Three.js
        if (!window.THREE) {
          if (window.MINDAR && window.MINDAR.IMAGE && window.MINDAR.IMAGE.THREE) {
            window.THREE = window.MINDAR.IMAGE.THREE;
          } else if ((window as any).THREE) {
            window.THREE = (window as any).THREE;
          }
        }

        // 2. Nạp GLTFLoader và DRACOLoader
        if (!(window.THREE && window.THREE.GLTFLoader)) {
          await loadScript("/lib/GLTFLoader.js");
        }
        if (!(window.THREE && window.THREE.DRACOLoader)) {
          try {
            await loadScript("/lib/DRACOLoader.js");
          } catch {}
        }

        if (isCancelled || !containerRef.current) return;
        setDownloadProgress(35);

        const THREE = window.THREE;
        const { MindARThree } = window.MINDAR!.IMAGE;

        // 3. Chuẩn bị Target MindAR với fallback thông minh
        let resolvedTargetSrc = animal.targetUrl || `/targets/${animal.slug}.mind`;
        let isFallbackTarget = false;

        // Nếu targetUrl là link R2 chưa có hoặc file không tồn tại, kiểm tra an toàn
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const checkRes = await fetch(resolvedTargetSrc, {
            method: "GET",
            headers: { Range: "bytes=0-10" },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!checkRes.ok && checkRes.status !== 206) {
            resolvedTargetSrc = "/targets/polycards.mind";
            isFallbackTarget = true;
          }
        } catch {
          resolvedTargetSrc = "/targets/polycards.mind";
          isFallbackTarget = true;
        }

        if (isFallbackTarget && !isCancelled) {
          setIsFreeArMode(true);
        }

        // Dọn container
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        // Khởi tạo MindAR Three instance
        const mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: resolvedTargetSrc,
          maxTrack: 1,
          uiLoading: "no",
          uiScanning: "no",
        });

        mindarRef.current = mindarThree;

        const { renderer, scene, camera } = mindarThree;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        sceneRef.current = scene;

        // Giới hạn PixelRatio tối đa 2 để tối ưu FPS và nhiệt độ máy
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        if (renderer.outputColorSpace !== undefined) {
          renderer.outputColorSpace = THREE.SRGBColorSpace;
        }

        // 4. Cải thiện Ánh Sáng P2 (Khối chân thực, rực rỡ, tránh tối vật liệu PBR)
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 1.2);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
        dirLight.position.set(0, 10, 8);
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xfef3c7, 0.8);
        fillLight.position.set(-5, -3, 5);
        scene.add(fillLight);

        // A. Anchor bám theo thẻ bài
        const anchor = mindarThree.addAnchor(0);
        anchorGroupRef.current = anchor.group;

        anchor.onTargetFound = () => {
          if (!isCancelled) {
            isTargetFoundRef.current = true;
            setIsTargetFound(true);
            setHasScannedOnce(true);
            hasScannedOnceRef.current = true;
            setTargetHitCount((prev) => prev + 1);
            playAnimalSoundEffect(animal.slug);
          }
        };

        anchor.onTargetLost = () => {
          if (!isCancelled) {
            isTargetFoundRef.current = false;
            setIsTargetFound(false);
          }
        };

        // 5. Nạp mô hình 3D GLTF với DRACOLoader (Ưu tiên bộ giải mã nội bộ /draco/ và giới hạn 1 worker chống sập RAM iPhone)
        const loader = new THREE.GLTFLoader();
        if (THREE.DRACOLoader) {
          const dracoLoader = new THREE.DRACOLoader();
          dracoLoader.setDecoderPath("/draco/");
          try {
            dracoLoader.setWorkerLimit(1);
          } catch {}
          loader.setDRACOLoader(dracoLoader);
        }

        const fallbackModelUrl = "/models/polycards.glb";
        let cleanModelUrl = animal.modelUrl || fallbackModelUrl;

        // Bóc tách URL gốc nếu đã bị bọc proxy trước đó để chống double encoding
        if (cleanModelUrl.includes("/api/proxy/model?url=")) {
          const parts = cleanModelUrl.split("/api/proxy/model?url=");
          try {
            cleanModelUrl = decodeURIComponent(parts[1] || "");
          } catch {}
        }

        // Ưu tiên tải trực tiếp từ R2 Edge CDN nếu là URL R2 (vì R2 đã cấu hình CORS * và không bị giới hạn 4.5MB Vercel)
        let primaryModelUrl = cleanModelUrl;
        const isR2Url =
          primaryModelUrl.includes(".r2.dev") ||
          primaryModelUrl.includes(".r2.cloudflarestorage.com");

        if (
          !isR2Url &&
          (primaryModelUrl.startsWith("http://") || primaryModelUrl.startsWith("https://"))
        ) {
          primaryModelUrl = `/api/proxy/model?url=${encodeURIComponent(primaryModelUrl)}`;
        }

        const loadModelWithFallback = (urlToLoad: string, isFallbackAttempt: boolean = false) => {
          loader.load(
            urlToLoad,
            (gltf: any) => {
              if (isCancelled) return;
              setDownloadProgress(100);

              const rawModel = gltf.scene;

              // Khởi tạo Animations
              if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(rawModel);
                mixerRef.current = mixer;
                actionsRef.current = {};

                const clipNames: string[] = [];
                gltf.animations.forEach((clip: any) => {
                  actionsRef.current[clip.name] = mixer.clipAction(clip);
                  clipNames.push(clip.name);
                });
                setAvailableClips(clipNames);
                if (clipNames.length > 1) {
                  // Mặc định tự động kích hoạt TẤT CẢ các animation đồng thời (Play All)
                  // Tương thích chuẩn glTF Viewer (Don McCurdy) giúp các model phức tạp (Thuyền buồm, xe cộ, nhân vật) chuyển động đầy đủ 100%
                  Object.values(actionsRef.current).forEach((action: any) => {
                    action.reset().play();
                  });
                  setPlayingClipName("__PLAY_ALL__");
                  setIsActionSelectorOpen(true);
                  resetActionSelectorTimer();
                } else if (clipNames.length === 1 && animal.slug !== "cat") {
                  let matchedClip = gltf.animations[0];
                  if (matchedClip && actionsRef.current[matchedClip.name]) {
                    actionsRef.current[matchedClip.name].play();
                    setPlayingClipName(matchedClip.name);
                  }
                }
                mixer.update(0.016);
              }

              rawModel.updateMatrixWorld(true);

              // 1. Quét tìm tất cả Mesh và SkinnedMesh để lấy bounding box hình học gốc
              let geomMin = new THREE.Vector3(Infinity, Infinity, Infinity);
              let geomMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
              let hasSkinnedMesh = false;

              rawModel.traverse((child: any) => {
                if (child.isMesh && child.geometry) {
                  if (child.isSkinnedMesh) hasSkinnedMesh = true;
                  child.geometry.computeBoundingBox();
                  if (child.geometry.boundingBox) {
                    geomMin.min(child.geometry.boundingBox.min);
                    geomMax.max(child.geometry.boundingBox.max);
                  }
                }
              });

              // 2. Bounding Box chuẩn từ Three.js scene graph
              const bbox = new THREE.Box3().setFromObject(rawModel);
              let size = bbox.getSize(new THREE.Vector3());
              let center = bbox.getCenter(new THREE.Vector3());
              let maxDim = Math.max(size.x, size.y, size.z);

              // 3. Khắc phục lỗi Mixamo / Blender 0.01 Armature scale:
              // SkinnedMesh trong Blender thường bị root scale 0.01 khiến Box3.setFromObject trả về ~0.015m,
              // nhưng vertex shader render 1.5m thật. Ta dùng geometry bounds để lấy kích thước thật của nhân vật.
              if (geomMin.x !== Infinity) {
                const geomSize = new THREE.Vector3().subVectors(geomMax, geomMin);
                const geomMaxDim = Math.max(geomSize.x, geomSize.y, geomSize.z);

                if (hasSkinnedMesh && (maxDim < 0.25 || maxDim / geomMaxDim < 0.1)) {
                  size = geomSize;
                  center = new THREE.Vector3().addVectors(geomMin, geomMax).multiplyScalar(0.5);
                  maxDim = geomMaxDim;
                  console.warn(
                    `[PolyCards WebAR Engine] Đã sửa lỗi Mixamo scale artifact. maxDim chuẩn hóa: ${maxDim.toFixed(2)}m`
                  );
                }
              }

              if (!maxDim || maxDim <= 0.001 || !isFinite(maxDim)) {
                maxDim = 1.0;
              }
              maxDimRef.current = maxDim;

              // Căn đáy nhân vật/mô hình về y = 0 để đứng thẳng trên mặt sàn (ngay trên bóng đổ blob shadow)
              const floorY =
                isFinite(geomMin.y) && geomMin.y !== Infinity
                  ? geomMin.y
                  : center.y - size.y / 2;
              const modelHolder = new THREE.Group();
              modelHolder.position.set(-center.x, -floorY, -center.z);
              modelHolder.add(rawModel);

              // Tích hợp P2 Reaction System (Squash/stretch, blob shadow, particles, ripples)
              const reactionSystem = new ArReactionSystem(THREE, maxDim);
              reactionSystemRef.current = reactionSystem;
              reactionSystem.reactionGroup.add(modelHolder);

              // Pivot Group điều phối transform từ ngón tay người dùng
              const pivot = new THREE.Group();
              pivot.name = "ArPivotGroup";
              pivot.add(reactionSystem.reactionGroup);

              // Root Group hiển thị độc lập nằm trực tiếp trong Scene:
              // Giúp mô hình 100% LUÔN HIỂN THỊ, không bị MindAR ẩn đi khi chưa nhận diện được thẻ
              const displayRoot = new THREE.Group();
              displayRoot.name = "ArDisplayRoot";
              displayRoot.matrixAutoUpdate = false;
              displayRoot.add(pivot);
              scene.add(displayRoot);

              // Kích thước chuẩn hiển thị vừa vặn, thanh thoát giữa khung nhìn camera
              const baseDim = 0.72;
              const initialScale = baseDim / maxDim;
              pivot.scale.set(initialScale, initialScale, initialScale);
              pivot.position.set(0, 0, 0);

              // Lưu half height để làm tâm xoay Quả cầu quỹ đạo quanh tâm model O (A0 & A1)
              const halfH = (size.y / maxDim) * baseDim * 0.5;
              halfHRef.current = halfH;

              pivotGroupRef.current = pivot;
              modelRef.current = rawModel;

              hasScannedOnceRef.current = true;
              setHasScannedOnce(true);
              displayRoot.visible = true;

              // Đảm bảo camera near clipping plane đủ nhỏ để hiển thị vật thể ở khoảng cách 1.5 - 2.5m
              if (camera) {
                camera.near = 0.05;
                camera.far = 10000;
                camera.updateProjectionMatrix();
              }

              // 6. Khởi động Render Loop & Hiển thị 3D Ngay Tức Thì (Zero-Latency Instant 3D)
              clockRef.current = new THREE.Clock();

              // Đối tượng toán học tái sử dụng cho Render Loop (Không cấp phát object trong frame)
              const anchorPosTarget = new THREE.Vector3();
              const anchorQuatTarget = new THREE.Quaternion();
              const anchorScaleTarget = new THREE.Vector3(1, 1, 1);
              const qCamInv = new THREE.Quaternion();

              // Quả cầu quỹ đạo (Orbit Sphere) A0, A1, A2, A3
              const qSmooth = new THREE.Quaternion();
              const eulerYXZ = new THREE.Euler(0, 0, 0, "YXZ");
              const eulerClamped = new THREE.Euler(0, 0, 0, "YXZ");
              const qView = new THREE.Quaternion();
              const oLocalVec = new THREE.Vector3();
              const pScreenVec = new THREE.Vector3();
              const quatOLocal = new THREE.Vector3();

              // Chuyển tiếp mượt giữa Thẻ bài và Fallback / Gyro (300ms easing)
              const lastTrackingMatrix = new THREE.Matrix4();
              const savedWorldMatrix = new THREE.Matrix4();
              const smoothedMatrix = new THREE.Matrix4();
              const qCamMatrix = new THREE.Matrix4();
              const qCamInvMatrix = new THREE.Matrix4();
              let hasSavedWorldPose = false;
              let trackingEaseTime = 1.0;
              let wasTargetFoundLastFrame = false;

              // RENDER LOOP CHUẨN HIỆU NĂNG CAO (Chạy ngay không đợi Camera)
              renderer.setAnimationLoop(() => {
                // Đo FPS
                frameCountRef.current++;
                const now = performance.now();
                if (now - lastFpsTimeRef.current >= 1000) {
                  setFps(frameCountRef.current);
                  frameCountRef.current = 0;
                  lastFpsTimeRef.current = now;
                }

                // Bảo đảm camera near clipping plane luôn là 0.05
                if (camera && camera.near !== 0.05) {
                  camera.near = 0.05;
                  camera.far = 10000;
                  camera.updateProjectionMatrix();
                }

                const dt = clockRef.current ? Math.min(0.1, clockRef.current.getDelta()) : 0.016;

                // Cập nhật AnimationMixer của mô hình
                if (mixerRef.current) {
                  mixerRef.current.update(dt);
                }

                // Quản lý trạng thái chuyển tiếp giữa Tracking thẻ bài và Quả cầu quỹ đạo (Orbit Sphere)
                const isTargetFoundNow = isTargetFoundRef.current;
                const isManual360 = isManual360ActiveRef.current;
                const isTrackingCard = isTargetFoundNow && !isManual360;

                // Gán gesture space và anchor quaternion trước khi cập nhật vật lý cử chỉ
                gestureSpaceRef.current = isTrackingCard ? "tracking" : "free";
                anchorQuatRef.current = anchorQuatTarget;

                // Cập nhật hệ thống cử chỉ Damping vật lý (đọc qua ref, không re-run effect)
                if (updatePhysicsRef.current) {
                  updatePhysicsRef.current(dt);
                }

                // Cập nhật hệ thống phản ứng 3D lò xo (P2)
                if (reactionSystemRef.current) {
                  reactionSystemRef.current.update(dt);
                }

                const isMotionActive =
                  isMotionEnabledRef.current &&
                  isMotionPermissionGrantedRef.current &&
                  gyroQuatRefLatest.current?.current &&
                  facingModeRef.current !== "user";

                const qCamTarget = isMotionActive ? gyroQuatRefLatest.current.current : null;

                displayRoot.visible = true;

                if (isTrackingCard) {
                  // 1. Khi đang nhận diện thẻ bài vật lý (MindAR 6DoF):
                  lastTrackingMatrix.copy(anchorGroupRef.current.matrix);
                  hasSavedWorldPose = false;

                  // Nối mượt 300ms khi thẻ vừa xuất hiện lại
                  if (!wasTargetFoundLastFrame) {
                    trackingEaseTime = 0.0;
                  }
                  if (trackingEaseTime < 1.0) {
                    trackingEaseTime = Math.min(1.0, trackingEaseTime + dt / 0.3);
                    const tEase = 1 - Math.pow(1 - trackingEaseTime, 3);
                    displayRoot.matrix.lerpMatrices(
                      smoothedMatrix,
                      anchorGroupRef.current.matrix,
                      tEase
                    );
                    displayRoot.matrixWorldNeedsUpdate = true;
                  } else {
                    displayRoot.matrix.copy(anchorGroupRef.current.matrix);
                    displayRoot.matrixWorldNeedsUpdate = true;
                  }
                } else {
                  // 2. Chế độ "Quả cầu quỹ đạo" (Orbit Sphere) khi chưa/mất thẻ hoặc chủ động xem 360°:
                  const isLandNow = typeof window !== "undefined" && window.innerWidth > window.innerHeight;
                  const freeArDist = isLandNow ? 2.4 : 1.9;
                  const yPos = isLandNow ? -0.28 : -0.36;

                  const panCam = panCamCurrentRefLatest.current?.current || { x: 0, y: 0 };
                  pScreenVec.set(panCam.x, yPos + panCam.y, -freeArDist);
                  anchorScaleTarget.set(1.0, 1.0, 1.0);

                  if (wasTargetFoundLastFrame && qCamTarget) {
                    if (motionModeRef.current === "orbit-sphere") {
                      resetBasePoseRef.current?.();
                    }
                    qCamMatrix.makeRotationFromQuaternion(qCamTarget);
                    savedWorldMatrix.multiplyMatrices(qCamMatrix, lastTrackingMatrix);
                    hasSavedWorldPose = true;
                  }

                  if (qCamTarget) {
                    qSmooth.slerp(qCamTarget, 1 - Math.exp(-18 * dt));

                    if (motionModeRef.current === "orbit-sphere") {
                      eulerYXZ.setFromQuaternion(qSmooth, "YXZ");
                      const yaw = eulerYXZ.y;
                      const pitch = eulerYXZ.x;
                      const roll = lockRollRef.current ? 0 : eulerYXZ.z;

                      const minPitch = -85 * (Math.PI / 180);
                      const maxPitch = 20 * (Math.PI / 180);
                      const pitchClamped = Math.max(minPitch, Math.min(maxPitch, pitch));

                      eulerClamped.set(pitchClamped, yaw, roll, "YXZ");
                      qView.setFromEuler(eulerClamped);
                      anchorQuatTarget.copy(qView).invert();

                      const curScale = pivotGroupRef.current
                        ? pivotGroupRef.current.scale.x / (baseDim / (maxDimRef.current || 1))
                        : 1.0;
                      const hH = halfHRef.current || 0.36;
                      oLocalVec.set(0, hH * curScale, 0);

                      quatOLocal.copy(oLocalVec).applyQuaternion(anchorQuatTarget);
                      anchorPosTarget.subVectors(pScreenVec, quatOLocal);
                    } else if (motionModeRef.current === "world-lock") {
                      qCamInv.copy(qSmooth).invert();
                      if (hasSavedWorldPose) {
                        qCamInvMatrix.makeRotationFromQuaternion(qCamInv);
                        displayRoot.matrix.multiplyMatrices(qCamInvMatrix, savedWorldMatrix);
                        displayRoot.matrix.elements[12] += panCam.x;
                        displayRoot.matrix.elements[13] += panCam.y;
                        smoothedMatrix.copy(displayRoot.matrix);
                        displayRoot.matrixWorldNeedsUpdate = true;
                        wasTargetFoundLastFrame = isTrackingCard;
                        renderer.render(scene, camera);
                        return;
                      } else {
                        anchorPosTarget.copy(pScreenVec).applyQuaternion(qCamInv);
                        anchorQuatTarget.copy(qCamInv);
                      }
                    } else {
                      anchorPosTarget.copy(pScreenVec);
                      anchorQuatTarget.set(0, 0, 0, 1);
                    }
                  } else {
                    anchorPosTarget.copy(pScreenVec);
                    anchorQuatTarget.set(0, 0, 0, 1);
                  }

                  displayRoot.matrix.compose(
                    anchorPosTarget,
                    anchorQuatTarget,
                    anchorScaleTarget
                  );
                  smoothedMatrix.copy(displayRoot.matrix);
                  displayRoot.matrixWorldNeedsUpdate = true;
                }

                wasTargetFoundLastFrame = isTrackingCard;
                renderer.render(scene, camera);
              });

              // HIỂN THỊ MODEL 3D NGAY LẬP TỨC (Không để màn hình xoay 100% che mất)
              if (!isCancelled) {
                setIsLoading(false);
              }

              // 7. Khởi động Camera stream & Target Tracking trong background (Không chặn luồng xem 3D)
              mindarThree
                .start()
                .then(() => {
                  if (isCancelled) return;

                  // Triệt tiêu controls và native play/pause icon của iOS Safari trên video camera
                  const videoEl = (mindarThree.video || containerRef.current?.querySelector("video")) as HTMLVideoElement | null;
                  if (videoEl) {
                    sanitizeVideoElement(videoEl);
                  }

                  if (camera) {
                    camera.near = 0.05;
                    camera.far = 10000;
                    camera.updateProjectionMatrix();
                  }
                })
                .catch((err: any) => {
                  console.warn("[MindAR Start Warning]:", err);
                  // Không báo lỗi gián đoạn nếu camera bị từ chối hoặc đang trong in-app browser, tự động chuyển Free 3D Mode
                  if (!isCancelled) {
                    setIsFreeArMode(true);
                  }
                });
            },
            (xhr: any) => {
              const loadedMb = (xhr.loaded / (1024 * 1024)).toFixed(1);
              if (xhr.lengthComputable && xhr.total > 0) {
                const totalMb = (xhr.total / (1024 * 1024)).toFixed(1);
                const percent = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
                setDownloadProgress(35 + Math.round(percent * 0.6));
                setDownloadStats({ loadedMb, totalMb });
              } else if (xhr.loaded > 0) {
                // Hỗ trợ chunked streaming khi chưa có Content-Length
                const estimatedTotal = 28 * 1024 * 1024;
                const percent = Math.min(96, Math.round((xhr.loaded / estimatedTotal) * 100));
                setDownloadProgress(35 + Math.round(percent * 0.6));
                setDownloadStats({
                  loadedMb,
                  totalMb: "30.0",
                });
              }
            },
            (err: any) => {
              if (!isFallbackAttempt && urlToLoad !== fallbackModelUrl) {
                if (!isCancelled) setIsUsingFallbackModel(true);
                loadModelWithFallback(fallbackModelUrl, true);
                return;
              }
              if (!isCancelled) {
                setLoadError("Không thể tải mô hình 3D. Vui lòng thử lại sau.");
                setIsLoading(false);
              }
            }
          );
        };

        loadModelWithFallback(primaryModelUrl);
      } catch (err: any) {
        if (!isCancelled) {
          setLoadError(err.message || "Lỗi khởi tạo AR Engine.");
          setIsLoading(false);
        }
      }
    }

    startAR();

    return () => {
      isCancelled = true;
      if (uiActivityTimerRef.current) clearTimeout(uiActivityTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (actionSelectorTimerRef.current) clearTimeout(actionSelectorTimerRef.current);
      if (reactionSystemRef.current) {
        reactionSystemRef.current.dispose();
      }

      // Giải phóng triệt để Three.js Scene, Materials, Textures, Geometries
      if (sceneRef.current) {
        sceneRef.current.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose?.();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m: any) => disposeMaterial(m));
            } else {
              disposeMaterial(child.material);
            }
          }
        });
      }

      if (stopFrontStreamRef.current) {
        stopFrontStreamRef.current();
      }

      if (mindarRef.current) {
        try {
          if (mindarRef.current.renderer) {
            mindarRef.current.renderer.setAnimationLoop(null);
            mindarRef.current.renderer.dispose?.();
            mindarRef.current.renderer.forceContextLoss?.();
          }
          if (mindarRef.current.controller) {
            mindarRef.current.controller.stopProcessVideo();
          }
          if (mindarRef.current.video && mindarRef.current.video.srcObject) {
            mindarRef.current.video.srcObject.getTracks().forEach((t: MediaStreamTrack) => t.stop());
            mindarRef.current.video.remove();
          }
        } catch {}
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [animal.slug, animal.modelUrl, animal.targetUrl, loadScript]);

  // Xử lý chuyển đổi Camera Trước / Sau chuẩn xác (Phần B: chống đen hình và race condition)
  const handleToggleCamera = useCallback(async () => {
    wakeUi();
    if (isCameraSwitching) return;
    const nextMode = facingModeRef.current === "environment" ? "user" : "environment";
    const videoEl = (mindarRef.current?.video || containerRef.current?.querySelector("video")) as HTMLVideoElement | null;
    if (!videoEl) {
      showToast("Không tìm thấy phần tử video camera", "warning");
      return;
    }
    await switchCamera(nextMode, videoEl, mindarRef.current);
  }, [isCameraSwitching, switchCamera, wakeUi, showToast]);

  // Xử lý phát âm đa ngữ
  const handleSpeak = (lang: "en" | "vi" | "zh") => {
    wakeUi();
    setActiveLang(lang);
    if (reactionSystemRef.current) {
      reactionSystemRef.current.triggerAudioRipple();
    }
    playCardLanguageAudio(animal, lang, () => {
      setActiveLang(null);
    });
  };

  // Xử lý phát tiếng kêu con vật
  const handleAnimalSound = () => {
    wakeUi();
    setIsPlayingSound(true);
    if (reactionSystemRef.current) {
      reactionSystemRef.current.triggerAudioRipple();
    }
    playAnimalSoundEffect(
      animal.slug,
      () => setIsPlayingSound(false),
      animal.audioUrl
    );
  };

  // Chuyển đổi clip animation (Hỗ trợ phát riêng lẻ hoặc "Play All" tất cả animations đồng thời)
  const handleSwitchClip = (clipName: string) => {
    wakeUi();
    if (!actionsRef.current) return;

    if (clipName === "__PLAY_ALL__") {
      Object.values(actionsRef.current).forEach((action: any) => {
        action.reset().fadeIn(0.25).play();
      });
      setPlayingClipName("__PLAY_ALL__");
      return;
    }

    if (!actionsRef.current[clipName]) return;

    // Dừng tất cả các clip khác và chỉ phát clip được chọn
    Object.entries(actionsRef.current).forEach(([name, action]: [string, any]) => {
      if (name === clipName) {
        action.reset().fadeIn(0.25).play();
      } else {
        action.fadeOut(0.25);
      }
    });
    setPlayingClipName(clipName);
  };

  return (
    <div
      className="fixed inset-0 z-50 w-full h-[100dvh] bg-black select-none overflow-hidden touch-none"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={wakeUi}
    >
      {/* 1. Camera Viewport: Ép full màn hình 100dvh, lật gương CHỈ video khi ở Selfie mode (không lật canvas để cử chỉ và tia raycast đúng hướng) */}
      <div
        ref={containerRef}
        id="webar-camera-viewport"
        className={`absolute inset-0 w-full h-full overflow-hidden [&>video]:!absolute [&>video]:!inset-0 [&>video]:!w-full [&>video]:!h-full [&>video]:!object-cover [&>video]:!pointer-events-none [&>video]:select-none [&>canvas]:!absolute [&>canvas]:!inset-0 [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:!object-cover pointer-events-none ${
          facingMode === "user" ? "[&>video]:scale-x-[-1]" : ""
        }`}
      />

      {/* 2. Lớp bắt cử chỉ cảm ứng Pointer Events (Xoay 360, Giữ để kéo 1:1, Pinch Zoom, Tap hit test) */}
      <div
        className="absolute inset-0 z-10 touch-none cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: "none" }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        {...pointerHandlers}
      />

      {/* 3. Thanh Gợi Ý Cử Chỉ Tự Động Ẩn Sau 4.5 Giây */}
      <ArGestureHint
        isFreeArMode={isFreeArMode}
        isUsingFallbackModel={isUsingFallbackModel}
      />

      {/* 4. Top Bar Mảnh & Thanh Thoát (Tự ẩn sau 4s không chạm) */}
      <div
        className={`absolute top-0 inset-x-0 z-40 flex items-center justify-between px-3.5 pt-3.5 pb-2 pointer-events-none transition-opacity duration-500 ${
          isUiFaded ? "opacity-15 hover:opacity-100" : "opacity-100"
        }`}
        style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))" }}
      >
        {/* Nút đóng AR (luôn hiển thị rõ ràng) */}
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-black/60 text-white border border-white/20 backdrop-blur-md active:scale-90 transition-transform shadow-lg cursor-pointer"
          title="Đóng Camera AR"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Nút kích hoạt xoay 360° quanh vật thể (Gyro) / Badge trạng thái & Nút Tách thẻ 360° */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Nút tách khỏi thẻ để xem 360° Quả cầu quỹ đạo ngay cả khi thẻ còn trong khung */}
          {isTargetFound && (
            <button
              type="button"
              onClick={() => {
                setIsManual360Active((prev) => {
                  const next = !prev;
                  if (next) resetBasePose();
                  showToast(
                    next
                      ? "Đã chuyển sang chế độ Quả cầu quỹ đạo 360°"
                      : "Đã gắn lại vào thẻ bài vật lý",
                    "info"
                  );
                  return next;
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md active:scale-95 transition-all border cursor-pointer ${
                isManual360Active
                  ? "bg-amber-400 text-stone-950 border-amber-300"
                  : "bg-black/60 text-amber-300 border-amber-400/40"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>{isManual360Active ? "Gắn lại thẻ" : "Xem 360°"}</span>
            </button>
          )}

          {isMotionSupported && needsMotionPrompt && !isMotionPermissionGranted && (
            <button
              type="button"
              onClick={async () => {
                const granted = await requestMotionPermission();
                if (granted) {
                  showToast("Đã kích hoạt xoay 360° quanh con vật (Gyro)", "success");
                  setIsMotionEnabled(true);
                  resetBasePose();
                } else {
                  showToast("Quyền cảm biến chuyển động bị từ chối", "warning");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/80 text-emerald-300 font-bold text-xs backdrop-blur-md active:scale-95 transition-all border border-emerald-400/30 cursor-pointer shadow-md"
            >
              <Compass className="h-3.5 w-3.5 text-emerald-400" />
              <span>360° Gyro</span>
            </button>
          )}

          {isMotionSupported && isMotionPermissionGranted && (
            <button
              type="button"
              onClick={() => {
                setIsMotionEnabled((prev) => {
                  const next = !prev;
                  showToast(
                    next ? "Đã bật xoay 360° quanh con vật" : "Đã tắt cảm biến xoay",
                    "info"
                  );
                  return next;
                });
                resetBasePose();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border transition-all cursor-pointer ${
                isMotionEnabled
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-sm"
                  : "bg-stone-900/60 text-stone-400 border-white/10"
              }`}
            >
              <Compass className={`h-3.5 w-3.5 ${isMotionEnabled ? "text-emerald-400" : "text-stone-400"}`} />
              <span>{isMotionEnabled ? "360° Bật" : "360° Tắt"}</span>
            </button>
          )}
        </div>

        {/* Menu More "⋯" (Chứa Reset, Debug HUD, Hướng Dẫn, Cảm Biến) - Đảm bảo z-index cao không bị đè */}
        <div className="pointer-events-auto relative z-50">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/60 text-white border border-white/20 backdrop-blur-md active:scale-90 transition-transform shadow-lg cursor-pointer"
            title="Tùy chọn khác"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-2xl bg-stone-950/95 border border-white/20 p-1.5 backdrop-blur-xl shadow-2xl space-y-1 text-xs text-white z-[60] animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    resetTransform();
                    setIsMenuOpen(false);
                    showToast("Đã đặt lại góc nhìn & vị trí 100%", "info");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4 text-amber-400" />
                  <span>Đặt lại góc nhìn</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowGuideModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-white transition-colors cursor-pointer"
                >
                  <HelpCircle className="h-4 w-4 text-sky-400" />
                  <span>Hướng dẫn cử chỉ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDebugOpen((prev) => !prev);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-white transition-colors cursor-pointer"
                >
                  <Wrench className="h-4 w-4 text-amber-400" />
                  <span>{isDebugOpen ? "Tắt Debug HUD" : "Bật Debug HUD"}</span>
                </button>

                {/* Tùy chọn Cảm biến chuyển động Gyroscope (Quả cầu quỹ đạo / World-Lock) */}
                {isMotionSupported && (
                  <div className="pt-1 border-t border-white/10 space-y-1">
                    {/* Nút bật/tắt Gyro */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (needsMotionPrompt && !isMotionPermissionGranted) {
                          const granted = await requestMotionPermission();
                          if (!granted) {
                            showToast("Quyền cảm biến chuyển động đã bị từ chối", "warning");
                            return;
                          }
                        }
                        setIsMotionEnabled((prev) => {
                          const next = !prev;
                          showToast(
                            next
                              ? motionMode === "orbit-sphere"
                                ? "Đã bật chế độ Quả cầu quỹ đạo 360°"
                                : "Đã bật chế độ Đứng yên trong phòng"
                              : "Đã tắt cảm biến xoay",
                            "info"
                          );
                          return next;
                        });
                        resetBasePose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Compass className={`h-4 w-4 ${isMotionEnabled ? "text-emerald-400" : "text-stone-400"}`} />
                        <span>Cảm biến xoay (Gyro)</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isMotionEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-stone-400"}`}>
                        {isMotionEnabled ? "BẬT" : "TẮT"}
                      </span>
                    </button>

                    {/* Bộ 2 lựa chọn: "Quả cầu quỹ đạo" (Orbit Sphere - MẶC ĐỊNH) vs "Đứng yên trong phòng" (World-Lock) */}
                    {isMotionEnabled && (
                      <div className="px-1.5 py-1 rounded-xl bg-white/5 space-y-1">
                        <div className="text-[10px] text-amber-300 font-bold px-1.5">Chế độ hiển thị:</div>
                        <button
                          type="button"
                          onClick={() => {
                            setMotionMode("orbit-sphere");
                            resetBasePose();
                            showToast("Chế độ: Quả cầu quỹ đạo (Xoay 360° quanh tâm model)", "info");
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            motionMode === "orbit-sphere"
                              ? "bg-amber-400 text-stone-950 shadow-md"
                              : "text-stone-300 hover:bg-white/10"
                          }`}
                        >
                          <span>Quả cầu quỹ đạo</span>
                          {motionMode === "orbit-sphere" && <Check className="h-3.5 w-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMotionMode("world-lock");
                            resetBasePose();
                            showToast("Chế độ: Đứng yên trong phòng (World-Lock 3DoF)", "info");
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            motionMode === "world-lock"
                              ? "bg-amber-400 text-stone-950 shadow-md"
                              : "text-stone-300 hover:bg-white/10"
                          }`}
                        >
                          <span>Đứng yên phòng</span>
                          {motionMode === "world-lock" && <Check className="h-3.5 w-3.5" />}
                        </button>

                        {/* Tùy chọn khóa trục nghiêng roll */}
                        <button
                          type="button"
                          onClick={() => {
                            setLockRoll((prev) => {
                              const next = !prev;
                              showToast(next ? "Đã khóa trục nghiêng Roll" : "Đã mở trục nghiêng Roll", "info");
                              return next;
                            });
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-[10px] text-stone-300 hover:bg-white/10 cursor-pointer"
                        >
                          <span>Khóa trục nghiêng (Roll)</span>
                          <span className={`px-1 rounded text-[9px] font-bold ${lockRoll ? "bg-amber-400 text-stone-950" : "bg-white/10 text-stone-400"}`}>
                            {lockRoll ? "BẬT" : "TẮT"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            resetBasePose();
                            showToast("Đã đặt lại hướng nhìn mốc ban đầu", "info");
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1 rounded-lg text-[10px] text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Đặt lại hướng nhìn</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* PHẦN C & PROMPT 5: Nút Xem AR Thật (Apple AR Quick Look / WebXR trên Android) */}
                {(supportsAppleAr || supportsWebXr) &&
                  Boolean(
                    (animal.iosModelUrl && animal.iosModelUrl.endsWith(".usdz")) ||
                    supportsWebXr
                  ) && (
                    <div className="pt-1 border-t border-white/10 space-y-1">
                      <button
                        type="button"
                        onClick={handleLaunchNativeAr}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-teal-500/20 text-amber-300 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>Xem AR phòng thật</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                          {supportsAppleAr ? "Apple Quick Look" : "WebXR"}
                        </span>
                      </button>
                      <a
                        id="native-ar-quick-look-anchor"
                        href={animal.iosModelUrl || "/models/polycards.usdz"}
                        rel="ar"
                        className="hidden"
                      >
                        Apple Quick Look
                      </a>
                      <p className="px-2 text-[9px] text-stone-400 leading-tight">
                        *Chế độ chạy ngoài trang, không có từ vựng song ngữ & mic.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

      {/* Hidden model-viewer CHỈ dành cho WebXR trên Android (Trên iOS dùng native anchor rel="ar" để ngăn tạo thêm WebGL context gây sập RAM Safari) */}
      {!supportsAppleAr && supportsWebXr && (
        <model-viewer
          ref={nativeModelViewerRef as any}
          src={animal.modelUrl || "/models/polycards.glb"}
          ar
          ar-modes="webxr scene-viewer"
          className="hidden"
          style={{ display: "none" }}
        />
      )}

      {/* 5. AR Debug HUD */}
      <ArHud
        isOpen={isDebugOpen}
        fps={fps}
        slug={animal.slug}
        isFreeArMode={isFreeArMode}
        isUsingFallbackModel={isUsingFallbackModel}
        isTargetFound={isTargetFound}
        targetHitCount={targetHitCount}
        playingClipName={playingClipName}
        animalSlug={animal.slug}
        posX={currentPosRef.current.x}
        posY={currentPosRef.current.y}
        zoomPercent={zoomPercent}
        facingMode={facingMode}
        azimuthDeg={motionDebugAnglesRef.current.azimuthDeg}
        elevationDeg={motionDebugAnglesRef.current.elevationDeg}
        distanceR={isLandscape ? 2.4 : 1.9}
        motionMode={motionMode}
        gestureState={gestureStateRefLatest.current?.current || "IDLE"}
        onClose={() => setIsDebugOpen(false)}
        onForceShow={() => {
          hasScannedOnceRef.current = true;
          setHasScannedOnce(true);
          if (anchorGroupRef.current) anchorGroupRef.current.visible = true;
        }}
        onResetTransform={resetTransform}
        onTestSound={handleAnimalSound}
      />

      {/* 6. Toast thông báo nhẹ nhàng */}
      {toastMsg && (
        <div className="absolute top-20 inset-x-0 z-35 flex justify-center pointer-events-none px-4 animate-in fade-in zoom-in duration-150">
          <div
            className={`flex items-center gap-2 rounded-2xl font-black px-4 py-1.5 shadow-xl text-xs backdrop-blur-md ${
              toastMsg.type === "success"
                ? "bg-emerald-500 text-stone-950 shadow-emerald-500/30"
                : toastMsg.type === "warning"
                ? "bg-rose-500 text-white shadow-rose-500/30"
                : "bg-amber-400 text-stone-950 shadow-amber-400/30"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* 7. Action Sheet (Bottom Sheet cho Động Tác 3D) */}
      <ArActionSheet
        isOpen={isActionSheetOpen}
        isLandscape={isLandscape}
        clips={availableClips}
        activeClip={playingClipName}
        onSelectClip={(clip) => {
          handleSwitchClip(clip);
          setIsActionSheetOpen(false);
        }}
        onToggle={() => setIsActionSheetOpen((prev) => !prev)}
      />

      {/* 8. KHUNG ĐIỀU KHIỂN CHÍNH (Song Ngữ EN-VI + Chọn Động Tác Tự Ẩn 4s + Lật Camera Trước/Sau) */}
      <div
        className={`absolute z-30 pointer-events-none transition-all duration-500 ${
          isLandscape
            ? "right-3.5 top-16 bottom-4 flex flex-col items-center justify-center py-2"
            : "bottom-0 inset-x-0 flex flex-col items-center px-3.5 pb-4 pt-1"
        } ${isUiFaded ? "opacity-15 hover:opacity-100" : "opacity-100"}`}
        style={
          isLandscape
            ? { paddingRight: "max(0.875rem, env(safe-area-inset-right))" }
            : { paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }
        }
      >
        {isLandscape ? (
          /* Giao diện khi xoay ngang: Cột điều khiển dọc né vùng Top Bar */
          <div className="pointer-events-auto rounded-3xl bg-stone-950/80 border border-white/20 p-2 backdrop-blur-xl shadow-2xl flex flex-col gap-2.5 items-center w-16">
            {/* Nút phát âm EN/ZH */}
            <button
              type="button"
              onClick={() => handleSpeak(languageTrack === "zh-vi" ? "zh" : "en")}
              className={`flex flex-col items-center justify-center h-11 w-11 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                activeLang === (languageTrack === "zh-vi" ? "zh" : "en")
                  ? "bg-amber-400 text-stone-950 border-amber-300 font-black shadow-md"
                  : "bg-white/10 text-amber-300 border-white/15 hover:bg-white/20"
              }`}
              title={`Nghe ${languageTrack === "zh-vi" ? "Tiếng Trung" : "Tiếng Anh"}`}
            >
              <Languages className="h-4 w-4" />
              <span className="text-[9px] font-black">{languageTrack === "zh-vi" ? "ZH" : "EN"}</span>
            </button>

            {/* Nút phát âm Tiếng Việt */}
            <button
              type="button"
              onClick={() => handleSpeak("vi")}
              className={`flex flex-col items-center justify-center h-11 w-11 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                activeLang === "vi"
                  ? "bg-emerald-400 text-stone-950 border-emerald-300 font-black shadow-md"
                  : "bg-white/10 text-emerald-300 border-white/15 hover:bg-white/20"
              }`}
              title="Nghe Tiếng Việt"
            >
              <Languages className="h-4 w-4" />
              <span className="text-[9px] font-black">VI</span>
            </button>

            {/* Nút phát tiếng kêu */}
            <button
              type="button"
              onClick={handleAnimalSound}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                isPlayingSound
                  ? "bg-amber-400 text-stone-950 border-amber-300 font-black shadow-md"
                  : "bg-white/10 text-amber-300 border-white/15 hover:bg-white/20"
              }`}
              title={`Phát tiếng kêu ${animal.nameVi}`}
            >
              <Volume2 className="h-5 w-5" />
            </button>

            {/* Nút mở chọn động tác */}
            {availableClips.length > 1 && (
              <button
                type="button"
                onClick={() => setIsActionSheetOpen((prev) => !prev)}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                  isActionSheetOpen
                    ? "bg-amber-400 text-stone-950 border-amber-300 font-black"
                    : "bg-white/10 text-white border-white/15 hover:bg-white/20"
                }`}
                title="Chọn động tác nhân vật"
              >
                <Activity className="h-5 w-5" />
              </button>
            )}

            {/* Nút lật camera trước/sau */}
            <button
              type="button"
              onClick={handleToggleCamera}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-stone-950 font-black shadow-lg shadow-amber-400/30 active:scale-90 transition-transform cursor-pointer border border-amber-300"
              title="Đổi camera trước / sau"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          </div>
        ) : (
          /* Giao diện chuẩn khi màn hình dọc (Portrait) - Hỗ trợ Clean View Thu Gọn */
          <div className="w-full max-w-md pointer-events-auto rounded-3xl bg-stone-950/75 border border-white/15 p-2 backdrop-blur-xl shadow-2xl flex flex-col gap-1.5 transition-all duration-300">
            {/* Thanh Mini Header: Tên sản phẩm & Nút chuyển đổi Clean View */}
            <div className="flex items-center justify-between px-2 pt-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                <span className="truncate max-w-[180px]">{animal.nameVi}</span>
                <span className="text-[10px] text-stone-400 font-normal">({animal.nameEn})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsVocabCollapsed((prev) => !prev)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 text-[10px] font-bold cursor-pointer transition-colors"
                title={isVocabCollapsed ? "Mở rộng thẻ từ vựng" : "Thu gọn để xem toàn cảnh Clean View"}
              >
                <span>{isVocabCollapsed ? "Mở rộng" : "Thu gọn"}</span>
                {isVocabCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* 1. KHỐI SONG NGỮ (EN/ZH & VI) - Ẩn khi ở chế độ Clean View để màn hình thoáng đãng */}
            {!isVocabCollapsed && (
              <div className="grid grid-cols-2 gap-1.5 animate-in fade-in duration-200">
                {/* Thẻ Tiếng Anh (hoặc Tiếng Trung) */}
                <button
                  type="button"
                  onClick={() => handleSpeak(languageTrack === "zh-vi" ? "zh" : "en")}
                  className={`flex flex-col items-start p-2 rounded-2xl border transition-all text-left cursor-pointer active:scale-98 ${
                    activeLang === (languageTrack === "zh-vi" ? "zh" : "en")
                      ? "bg-amber-400/25 border-amber-400 shadow-md shadow-amber-400/25 scale-[1.02]"
                      : "bg-white/10 border-white/15 hover:bg-white/15"
                  }`}
                  title={`Nhấn để nghe phát âm ${languageTrack === "zh-vi" ? "Tiếng Trung" : "Tiếng Anh"}`}
                >
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="text-[10px] font-bold text-amber-300 tracking-wider flex items-center gap-1">
                      <Languages className="h-3 w-3" />
                      {languageTrack === "zh-vi" ? "TIẾNG TRUNG (ZH)" : "TIẾNG ANH (EN)"}
                    </span>
                    <Volume2
                      className={`h-3.5 w-3.5 ${
                        activeLang === (languageTrack === "zh-vi" ? "zh" : "en")
                          ? "text-amber-300 animate-pulse"
                          : "text-stone-400"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-black text-white truncate max-w-full">
                    {languageTrack === "zh-vi" ? animal.nameZh || animal.nameEn : animal.nameEn}
                  </span>
                  <span className="text-[10px] text-amber-200/90 font-mono truncate max-w-full">
                    {languageTrack === "zh-vi" ? animal.pinyinZh || "pīnyīn" : animal.ipa || "/ipa/"}
                  </span>
                </button>

                {/* Thẻ Tiếng Việt */}
                <button
                  type="button"
                  onClick={() => handleSpeak("vi")}
                  className={`flex flex-col items-start p-2 rounded-2xl border transition-all text-left cursor-pointer active:scale-98 ${
                    activeLang === "vi"
                      ? "bg-emerald-500/25 border-emerald-400 shadow-md shadow-emerald-400/25 scale-[1.02]"
                      : "bg-white/10 border-white/15 hover:bg-white/15"
                  }`}
                  title="Nhấn để nghe phát âm Tiếng Việt"
                >
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="text-[10px] font-bold text-emerald-300 tracking-wider flex items-center gap-1">
                      <Languages className="h-3 w-3" />
                      TIẾNG VIỆT (VI)
                    </span>
                    <Volume2
                      className={`h-3.5 w-3.5 ${
                        activeLang === "vi" ? "text-emerald-300 animate-pulse" : "text-stone-400"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-black text-white truncate max-w-full">
                    {animal.nameVi}
                  </span>
                  <span className="text-[10px] text-emerald-200/80 truncate max-w-full">
                    Tiếng Mẹ Đẻ
                  </span>
                </button>
              </div>
            )}

            {/* 2. CHỌN ĐỘNG TÁC 3D (Hỗ Trợ Play All Tất Cả & Từng Động Tác) */}
            {availableClips.length > 1 && isActionSelectorOpen && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 border-t border-white/10 pt-1.5 animate-in fade-in duration-200">
                <span className="text-[10px] font-bold text-amber-300 shrink-0 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Động tác:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {/* Nút Play All - Phát tất cả animations */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSwitchClip("__PLAY_ALL__");
                      resetActionSelectorTimer();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      playingClipName === "__PLAY_ALL__"
                        ? "bg-gradient-to-r from-amber-400 to-orange-400 text-stone-950 shadow-md shadow-amber-400/30 scale-102"
                        : "bg-white/10 text-amber-200 hover:bg-white/20"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Tất cả (Play All)</span>
                  </button>

                  {/* Từng clip riêng lẻ */}
                  {availableClips.map((clip) => {
                    const isSelected = playingClipName === clip;
                    return (
                      <button
                        key={clip}
                        type="button"
                        onClick={() => {
                          handleSwitchClip(clip);
                          resetActionSelectorTimer();
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/30 scale-102"
                            : "bg-white/10 text-stone-200 hover:bg-white/20"
                        }`}
                      >
                        {getClipFriendlyLabel(clip)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. HÀNG ĐIỀU KHIỂN DƯỚI CÙNG: Phát Tiếng Kêu + Mở Lại Động Tác + Lật Camera */}
            <div className="flex items-center gap-2 pt-0.5">
              {/* Nút phát tiếng kêu */}
              <button
                type="button"
                onClick={handleAnimalSound}
                className={`flex-1 flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border transition-all active:scale-98 cursor-pointer ${
                  isPlayingSound
                    ? "bg-amber-400 text-stone-950 border-amber-300 font-black shadow-lg shadow-amber-400/30"
                    : "bg-white/10 text-amber-300 border-white/15 hover:bg-white/20 font-bold"
                }`}
              >
                <Volume2 className="h-4 w-4" />
                <span className="text-xs">Phát Tiếng Kêu {animal.nameVi}</span>
              </button>

              {/* Nút Mic Voice Quiz (nếu có hỗ trợ) */}
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) return;
                    startListening(
                      {
                        en: animal.nameEn,
                        vi: animal.nameVi,
                        zh: animal.nameZh,
                        pinyin: animal.pinyinZh,
                      },
                      languageTrack === "zh-vi" ? "zh" : "en"
                    );
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border transition-all active:scale-95 shrink-0 cursor-pointer ${
                    isListening
                      ? "bg-rose-500 text-white border-rose-300 shadow-rose-500/50 animate-pulse scale-105"
                      : "bg-white/10 text-emerald-300 border-white/15 hover:bg-white/20"
                  }`}
                  title="Luyện nói cùng bé (Nhận diện giọng nói)"
                >
                  <Mic className="h-4 w-4" />
                  {isListening && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-400 animate-ping" />
                  )}
                </button>
              )}

              {/* Nút bật/tắt thanh động tác */}
              {availableClips.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsActionSelectorOpen((prev) => !prev);
                    resetActionSelectorTimer();
                  }}
                  className={`flex h-10 px-2.5 items-center justify-center gap-1 rounded-2xl border transition-all text-xs font-bold cursor-pointer shrink-0 ${
                    isActionSelectorOpen
                      ? "bg-amber-400 text-stone-950 border-amber-300 shadow-md"
                      : "bg-white/10 text-amber-300 border-white/15 hover:bg-white/20"
                  }`}
                  title="Chọn động tác 3D / Phát tất cả (Play All)"
                >
                  <Activity className="h-4 w-4" />
                  <span>Động tác</span>
                  {playingClipName === "__PLAY_ALL__" && (
                    <span className="text-[9px] px-1 rounded bg-stone-950/40 text-amber-950 font-black">All</span>
                  )}
                </button>
              )}

              {/* Nút LẬT CAMERA MẶT TRƯỚC / SAU */}
              <button
                type="button"
                onClick={handleToggleCamera}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-stone-950 font-black shadow-lg shadow-amber-400/30 active:scale-90 transition-transform shrink-0 cursor-pointer border border-amber-300"
                title={facingMode === "user" ? "Chuyển sang Camera sau" : "Chuyển sang Camera trước (Selfie)"}
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 9. Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/90 backdrop-blur-md px-6 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center mb-2">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
            <Sparkles className="h-8 w-8 text-amber-400 animate-pulse" />
          </div>
          <h3 className="text-base font-black text-white">Khởi Động AR Poly Cards...</h3>
          <p className="mt-1 text-xs text-amber-200/80 max-w-xs leading-relaxed">
            Đang nạp mô hình 3D {animal.nameVi}
          </p>
          <div className="mt-5 w-full max-w-xs space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-amber-300">
              <span>Tiến độ tải:</span>
              <span className="font-mono">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200"
                style={{ width: `${Math.max(5, downloadProgress)}%` }}
              />
            </div>
            {downloadStats.totalMb !== "0" && (
              <div className="text-[10px] text-stone-400 font-mono">
                {downloadStats.loadedMb} MB / {downloadStats.totalMb} MB
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. Error State */}
      {loadError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/90 backdrop-blur-md px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-3">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="text-base font-black text-white">Chưa thể bật Camera AR</h3>
          <p className="mt-1.5 text-xs text-stone-300 max-w-xs leading-relaxed">{loadError}</p>
          <div className="mt-5 flex flex-col gap-2 w-full max-w-xs">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 text-xs font-black text-stone-950 active:scale-95 transition-transform shadow-lg cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử Lại</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-xs font-bold text-white border border-white/20 active:scale-95 transition-transform cursor-pointer"
            >
              <span>Quay Lại</span>
            </button>
          </div>
        </div>
      )}

      {/* 11. Modal Hết Giờ Dùng Thử (3s Trial Paywall) */}
      {isTrialExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full rounded-3xl bg-stone-900 border-2 border-amber-400/80 p-5 shadow-2xl text-center text-white">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mb-3">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-black text-white">Hết 3 Giây Quét Thử Miễn Phí!</h3>
            <p className="mt-2 text-xs text-stone-300 leading-relaxed">
              Khách chưa mua thẻ chỉ được quét thử <strong>3 giây</strong>. Để mở khóa không giới hạn trọn bộ 30 thẻ thuộc thể loại này, bạn vui lòng:
            </p>
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenOrder) onOpenOrder();
                }}
                className="w-full flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-xs font-black text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Đặt Mua Trọn Bộ Thẻ Bài AR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenActivate) onOpenActivate();
                }}
                className="w-full flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-xs font-bold text-amber-300 border border-amber-400/30 active:scale-95 transition-transform cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Tôi Đã Có Thẻ (Nhập Mã Bản Quyền)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-stone-400 underline pt-1 cursor-pointer"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. Modal Hướng Dẫn Cử Chỉ Mới Chuẩn Trẻ Em & Phụ Huynh */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-sm w-full rounded-3xl bg-stone-900 border-2 border-amber-300/60 p-5 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white active:scale-90 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-base font-black">Hướng Dẫn Tương Tác AR</h3>
            </div>
            <div className="mt-3 space-y-2.5 text-xs leading-relaxed text-stone-300">
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  1
                </span>
                <span>
                  <strong>1 ngón vuốt:</strong> Xoay 360 độ quanh trục để ngắm mọi góc cạnh con vật với quán tính mượt mà.
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  2
                </span>
                <span>
                  <strong>Nhấn giữ vào con vật:</strong> Rung nhẹ nhấc con vật lên và kéo di chuyển bất kỳ đâu trên sàn nhà!
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  3
                </span>
                <span>
                  <strong>2 ngón chụm/mở:</strong> Thu phóng to nhỏ từ 15% đến 300%. Chạm đúp vào vùng trống để reset về chuẩn.
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  4
                </span>
                <span>
                  <strong>Chạm trực tiếp vào con vật:</strong> Xem con vật nhún nhảy tinh nghịch và bắn chùm sao rực rỡ!
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full min-h-[42px] rounded-2xl bg-amber-500 text-xs font-black text-stone-950 active:scale-95 transition-transform cursor-pointer"
            >
              Đã Hiểu, Bắt Đầu Khám Phá
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
