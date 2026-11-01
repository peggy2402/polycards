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

  // P4.1 Camera Hook (Chuyển đổi Camera Trước / Sau)
  const {
    facingMode,
    setFacingMode,
    hasMultipleCameras,
    startFrontCamera,
    stopFrontStream,
    capturePhoto,
  } = useArCamera({ onShowToast: showToast });

  // P4.2 Motion Gyro Hook (World Lock 3DoF & Orbit-Lite)
  const [isMotionEnabled, setIsMotionEnabled] = useState<boolean>(true);
  const [motionMode, setMotionMode] = useState<"orbit-lite" | "world-lock">("orbit-lite");
  const {
    isMotionSupported,
    isPermissionGranted: isMotionPermissionGranted,
    needsPermissionPrompt: needsMotionPrompt,
    requestMotionPermission,
    gyroQuatRef,
    resetBasePose,
  } = useArMotion({ enabled: isMotionEnabled });

  // REFS CẬP NHẬT MỖI RENDER: Cho phép render loop và handler đọc giá trị mới nhất
  // mà TUYỆT ĐỐI KHÔNG làm re-trigger effect khởi tạo AR (ngăn chặn crash OOM trên iOS)
  const isMotionEnabledRef = useRef(isMotionEnabled);
  isMotionEnabledRef.current = isMotionEnabled;

  const motionModeRef = useRef(motionMode);
  motionModeRef.current = motionMode;

  const isMotionPermissionGrantedRef = useRef(isMotionPermissionGranted);
  isMotionPermissionGrantedRef.current = isMotionPermissionGranted;

  const gyroQuatRefLatest = useRef(gyroQuatRef);
  gyroQuatRefLatest.current = gyroQuatRef;

  const facingModeRef = useRef(facingMode);
  facingModeRef.current = facingMode;

  // Đếm số lần effect startAR chạy để kiểm chứng không bị tải lại (chỉ 1 lần mỗi con vật)
  const startArCallCountRef = useRef(0);

  // Hỗ trợ Apple AR Quick Look (iOS .usdz) & WebXR (Android) cho Bước 4
  const [supportsAppleAr, setSupportsAppleAr] = useState<boolean>(false);
  const [supportsWebXr, setSupportsWebXr] = useState<boolean>(false);

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
  }, []);

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

  // P0 & P1 Gestures Hook (Pointer Events + 60FPS Physics Damping)
  const {
    pointerHandlers,
    resetTransform,
    adjustZoom,
    updatePhysics,
    currentPosRef,
  } = useArGestures({
    containerRef,
    pivotGroupRef,
    maxDimRef,
    cameraRef,
    onTapModel: handleTapModel,
    onZoomChange: setZoomPercent,
    onDoubleTapEmpty: () => {
      showToast("Đã đặt lại vị trí & kích thước ban đầu", "info");
    },
  });

  const updatePhysicsRef = useRef(updatePhysics);
  updatePhysicsRef.current = updatePhysics;

  const stopFrontStreamRef = useRef(stopFrontStream);
  stopFrontStreamRef.current = stopFrontStream;

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

        // 5. Nạp mô hình 3D GLTF với DRACOLoader và fallback polycards.glb
        const loader = new THREE.GLTFLoader();
        if (THREE.DRACOLoader) {
          const dracoLoader = new THREE.DRACOLoader();
          dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
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

        let primaryModelUrl = cleanModelUrl;
        if (
          primaryModelUrl.startsWith("http://") ||
          primaryModelUrl.startsWith("https://")
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
                  setIsActionSelectorOpen(true);
                  resetActionSelectorTimer();
                }

                if (animal.slug !== "cat") {
                  let matchedClip = gltf.animations[0];
                  if (matchedClip && actionsRef.current[matchedClip.name]) {
                    actionsRef.current[matchedClip.name].play();
                    setPlayingClipName(matchedClip.name);
                  }
                }
                mixer.update(0.016);
              }

              rawModel.updateMatrixWorld(true);

              // Tính Bounding Box chuẩn xác từ Three.js (tránh union lệch tâm)
              const bbox = new THREE.Box3().setFromObject(rawModel);
              const center = bbox.getCenter(new THREE.Vector3());
              const size = bbox.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z) || 1.0;
              maxDimRef.current = maxDim;

              // Căn tâm cơ thể về (0,0,0)
              const modelHolder = new THREE.Group();
              modelHolder.position.set(-center.x, -center.y, -center.z);
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

              // Kích thước chuẩn hiển thị to rõ vừa vặn giữa khung nhìn camera
              const baseDim = 0.75;
              const initialScale = baseDim / maxDim;
              pivot.scale.set(initialScale, initialScale, initialScale);
              pivot.position.set(0, 0, 0);

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

              // 6. Khởi động Camera stream
              clockRef.current = new THREE.Clock();

              mindarThree
                .start()
                .then(() => {
                  if (isCancelled) return;
                  setIsLoading(false);

                  // Cập nhật lại camera near sau khi MindAR khởi tạo
                  if (camera) {
                    camera.near = 0.05;
                    camera.far = 10000;
                    camera.updateProjectionMatrix();
                  }

                  // Đối tượng toán học tái sử dụng cho Render Loop (Không cấp phát object trong frame)
                  const worldPointW = new THREE.Vector3();
                  const anchorPosTarget = new THREE.Vector3();
                  const anchorQuatTarget = new THREE.Quaternion();
                  const anchorScaleTarget = new THREE.Vector3();
                  const qCamInv = new THREE.Quaternion();
                  const eulerYaw = new THREE.Euler(0, 0, 0, "YXZ");
                  const orbitQuat = new THREE.Quaternion();
                  const axisY = new THREE.Vector3(0, 1, 0);

                  // Chuyển tiếp mượt giữa Thẻ bài và Fallback / Gyro (300ms easing)
                  const lastTrackingMatrix = new THREE.Matrix4();
                  const savedWorldMatrix = new THREE.Matrix4();
                  const smoothedMatrix = new THREE.Matrix4();
                  const qCamMatrix = new THREE.Matrix4();
                  const qCamInvMatrix = new THREE.Matrix4();
                  let hasSavedWorldPose = false;
                  let trackingEaseTime = 1.0;
                  let wasTargetFoundLastFrame = false;

                  // RENDER LOOP CHUẨN HIỆU NĂNG CAO (Không cấp phát object trong frame)
                  renderer.setAnimationLoop(() => {
                    // Đo FPS
                    frameCountRef.current++;
                    const now = performance.now();
                    if (now - lastFpsTimeRef.current >= 1000) {
                      setFps(frameCountRef.current);
                      frameCountRef.current = 0;
                      lastFpsTimeRef.current = now;
                    }

                    const dt = clockRef.current ? Math.min(0.1, clockRef.current.getDelta()) : 0.016;

                    // Cập nhật AnimationMixer của mô hình
                    if (mixerRef.current) {
                      mixerRef.current.update(dt);
                    }

                    // Cập nhật hệ thống cử chỉ Damping vật lý (đọc qua ref, không re-run effect)
                    if (updatePhysicsRef.current) {
                      updatePhysicsRef.current(dt);
                    }

                    // Cập nhật hệ thống phản ứng 3D lò xo (P2)
                    if (reactionSystemRef.current) {
                      reactionSystemRef.current.update(dt);
                    }

                    // Quản lý trạng thái chuyển tiếp giữa Tracking thẻ bài và Fallback Gyro
                    const isTargetFoundNow = isTargetFoundRef.current;
                    const isMotionActive =
                      isMotionEnabledRef.current &&
                      isMotionPermissionGrantedRef.current &&
                      gyroQuatRefLatest.current?.current;
                    const qCam = isMotionActive ? gyroQuatRefLatest.current.current : null;

                    displayRoot.visible = true;

                    if (isTargetFoundNow) {
                      // 1. Khi đang nhận diện thẻ bài vật lý:
                      lastTrackingMatrix.copy(anchorGroupRef.current.matrix);
                      hasSavedWorldPose = false;

                      // Nối mượt 300ms khi thẻ vừa xuất hiện lại
                      if (!wasTargetFoundLastFrame) {
                        trackingEaseTime = 0.0;
                      }
                      if (trackingEaseTime < 1.0) {
                        trackingEaseTime = Math.min(1.0, trackingEaseTime + dt / 0.3);
                        // Ease-out cubic: 1 - (1 - t)^3
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
                      // 2. Khi chưa quét thẻ hoặc thẻ vừa bị che khuất (Fallback / Free AR):
                      const freeArDist = 2.0;
                      worldPointW.set(0, -0.2, -freeArDist);
                      anchorScaleTarget.set(1.0, 1.0, 1.0);

                      // Khi thẻ vừa mất khỏi tầm nhìn: lưu pose cuối đổi sang không gian thế giới Mw = qCam * Mc
                      if (wasTargetFoundLastFrame && qCam) {
                        qCamMatrix.makeRotationFromQuaternion(qCam);
                        savedWorldMatrix.multiplyMatrices(qCamMatrix, lastTrackingMatrix);
                        hasSavedWorldPose = true;
                      }

                      if (qCam) {
                        qCamInv.copy(qCam).invert();

                        if (motionModeRef.current === "orbit-lite") {
                          // BƯỚC 3 (P2): Chế độ "Đi quanh model" (orbit-lite) - MẶC ĐỊNH
                          anchorPosTarget.copy(worldPointW);
                          eulerYaw.setFromQuaternion(qCam, "YXZ");
                          const yaw = eulerYaw.y;
                          orbitQuat.setFromAxisAngle(axisY, -yaw);
                          anchorQuatTarget.copy(orbitQuat);
                        } else {
                          // BƯỚC 2 (P1): Chế độ "Đứng yên trong phòng" (World-lock 3DoF)
                          if (hasSavedWorldPose) {
                            qCamInvMatrix.makeRotationFromQuaternion(qCamInv);
                            displayRoot.matrix.multiplyMatrices(qCamInvMatrix, savedWorldMatrix);
                            smoothedMatrix.copy(displayRoot.matrix);
                            displayRoot.matrixWorldNeedsUpdate = true;
                            wasTargetFoundLastFrame = isTargetFoundNow;
                            renderer.render(scene, camera);
                            return;
                          } else {
                            anchorPosTarget.copy(worldPointW).applyQuaternion(qCamInv);
                            anchorQuatTarget.copy(qCamInv);
                          }
                        }
                      } else {
                        // Không kích hoạt Gyro: Cố định thẳng trước mặt camera
                        anchorPosTarget.copy(worldPointW);
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

                    wasTargetFoundLastFrame = isTargetFoundNow;
                    renderer.render(scene, camera);
                  });
                })
                .catch((err: any) => {
                  console.error("[MindAR Start Error]:", err);
                  if (!isCancelled) {
                    setLoadError("Không thể truy cập camera. Vui lòng cấp quyền máy ảnh trong trình duyệt.");
                    setIsLoading(false);
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

  // Xử lý chuyển đổi Camera Trước / Sau
  const handleToggleCamera = useCallback(async () => {
    wakeUi();
    const nextMode = facingMode === "environment" ? "user" : "environment";

    if (nextMode === "user") {
      // Chuyển sang Camera Trước (Selfie Mode)
      if (mindarRef.current?.video) {
        const videoEl = containerRef.current?.querySelector("video") as HTMLVideoElement | null;
        if (videoEl) {
          const stream = await startFrontCamera(videoEl);
          if (stream) {
            setFacingMode("user");
            showToast("Đã chuyển sang Camera trước (Selfie Mode)", "info");
          }
        }
      }
    } else {
      // Chuyển về Camera Sau (Marker Mode)
      stopFrontStream();
      if (mindarRef.current?.video) {
        const videoEl = containerRef.current?.querySelector("video") as HTMLVideoElement | null;
        if (videoEl && (mindarRef.current.video as HTMLVideoElement).srcObject) {
          videoEl.srcObject = (mindarRef.current.video as HTMLVideoElement).srcObject;
          await videoEl.play();
        }
      }
      setFacingMode("environment");
      showToast("Đã chuyển về Camera sau", "info");
    }
  }, [facingMode, showToast, startFrontCamera, stopFrontStream, wakeUi]);

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

  // Chuyển đổi clip animation
  const handleSwitchClip = (clipName: string) => {
    wakeUi();
    if (!actionsRef.current || !actionsRef.current[clipName]) return;
    if (playingClipName && actionsRef.current[playingClipName] && playingClipName !== clipName) {
      actionsRef.current[playingClipName].fadeOut(0.25);
    }
    const nextAction = actionsRef.current[clipName];
    nextAction.reset().fadeIn(0.25).play();
    setPlayingClipName(clipName);
  };

  return (
    <div
      className="fixed inset-0 z-50 w-full h-[100dvh] bg-black select-none overflow-hidden touch-none"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={wakeUi}
    >
      {/* 1. Camera Viewport: Ép full màn hình 100dvh, lật gương khi ở Selfie mode */}
      <div
        ref={containerRef}
        id="webar-camera-viewport"
        className={`absolute inset-0 w-full h-full overflow-hidden [&>video]:!absolute [&>video]:!inset-0 [&>video]:!w-full [&>video]:!h-full [&>video]:!object-cover [&>canvas]:!absolute [&>canvas]:!inset-0 [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:!object-cover pointer-events-none transition-transform duration-300 ${
          facingMode === "user" ? "scale-x-[-1]" : ""
        }`}
      />

      {/* 2. Lớp bắt cử chỉ cảm ứng Pointer Events (Xoay 360, Giữ để kéo 1:1, Pinch Zoom, Tap hit test) */}
      <div
        className="absolute inset-0 z-10 touch-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
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
            <div className="absolute right-0 top-12 w-52 rounded-2xl bg-stone-950/95 border border-white/20 p-1.5 backdrop-blur-xl shadow-2xl space-y-1 text-xs text-white z-[60] animate-in fade-in zoom-in-95 duration-150">
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

                {/* Tùy chọn Cảm biến chuyển động Gyroscope (3DoF) */}
                {isMotionSupported && (
                  <div className="pt-1 border-t border-white/10 space-y-1">
                    {/* Nút bật/tắt Gyro */}
                    <button
                      type="button"
                      onClick={async () => {
                        // BẮT BUỘC: requestMotionPermission() trên iOS Safari phải được gọi trực tiếp trong click handler
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
                              ? motionMode === "orbit-lite"
                                ? "Đã bật chế độ 'Đi quanh model'"
                                : "Đã bật chế độ 'Đứng yên trong phòng'"
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

                    {/* Bộ 2 lựa chọn: "Đi quanh model" (Orbit) vs "Đứng yên trong phòng" (World-Lock) */}
                    {isMotionEnabled && (
                      <div className="px-1.5 py-1 rounded-xl bg-white/5 space-y-1">
                        <div className="text-[10px] text-amber-300 font-bold px-1.5">Chế độ hiển thị:</div>
                        <button
                          type="button"
                          onClick={() => {
                            setMotionMode("orbit-lite");
                            resetBasePose();
                            showToast("Chế độ: Đi quanh model (Model xoay theo bước chân)", "info");
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            motionMode === "orbit-lite"
                              ? "bg-amber-400 text-stone-950 shadow-md"
                              : "text-stone-300 hover:bg-white/10"
                          }`}
                        >
                          <span>Đi quanh model</span>
                          {motionMode === "orbit-lite" && <Check className="h-3.5 w-3.5" />}
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
                          <span>Đứng yên trong phòng</span>
                          {motionMode === "world-lock" && <Check className="h-3.5 w-3.5" />}
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

                {/* BƯỚC 4: Apple AR Quick Look (.usdz) trên iPhone / iPad */}
                {supportsAppleAr && (animal.iosModelUrl || animal.modelUrl) && (
                  <div className="pt-1 border-t border-white/10">
                    <a
                      href={animal.iosModelUrl || `/models/${animal.slug}.usdz`}
                      rel="ar"
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-teal-500/20 text-amber-300 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                    >
                      <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Xem AR Apple (3D phòng thật)</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
          /* Giao diện chuẩn khi màn hình dọc (Portrait) */
          <div className="w-full max-w-md pointer-events-auto rounded-3xl bg-stone-950/85 border border-white/20 p-2.5 backdrop-blur-xl shadow-2xl flex flex-col gap-2">
            {/* 1. KHỐI SONG NGỮ (EN/ZH & VI) */}
            <div className="grid grid-cols-2 gap-2">
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

            {/* 2. CHỌN ĐỘNG TÁC 3D (Tự Động Ẩn Sau 4 Giây) */}
            {availableClips.length > 1 && isActionSelectorOpen && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 border-t border-white/10 pt-2 animate-in fade-in duration-200">
                <span className="text-[11px] font-black text-amber-300 shrink-0">Động tác:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
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
                        className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
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
                className={`flex-1 flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border transition-all active:scale-98 cursor-pointer ${
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
                  className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-all active:scale-95 shrink-0 cursor-pointer ${
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

              {/* Nút mở lại động tác nếu đã tự đóng sau 4s */}
              {availableClips.length > 1 && !isActionSelectorOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setIsActionSelectorOpen(true);
                    resetActionSelectorTimer();
                  }}
                  className="flex h-11 px-3 items-center justify-center gap-1 rounded-2xl bg-white/10 text-amber-300 border border-white/15 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold cursor-pointer shrink-0"
                  title="Chọn động tác 3D"
                >
                  <Activity className="h-4 w-4" />
                  <span>Động tác</span>
                </button>
              )}

              {/* Nút LẬT CAMERA MẶT TRƯỚC / SAU (thay thế nút chụp ảnh) */}
              <button
                type="button"
                onClick={handleToggleCamera}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-stone-950 font-black shadow-lg shadow-amber-400/30 active:scale-90 transition-transform shrink-0 cursor-pointer border border-amber-300"
                title={facingMode === "user" ? "Chuyển sang Camera sau" : "Chuyển sang Camera trước (Selfie)"}
              >
                <SwitchCamera className="h-5 w-5" />
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
