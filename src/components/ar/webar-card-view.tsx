"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Animal } from "@/types/animal";
import { speakWord, playAnimalSoundEffect } from "@/lib/speech-audio";
import {
  Camera,
  X,
  Volume2,
  Sparkles,
  CheckCircle2,
  Scan,
  RotateCcw,
  Languages,
  Download,
  AlertCircle,
  HelpCircle,
  Play,
  Pin,
  Compass,
  ShoppingBag,
  KeyRound,
  Clock,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";

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
  const companionGroupRef = useRef<any>(null);
  const actionsRef = useRef<{ [name: string]: any }>({});
  const clockRef = useRef<any>(null);

  // Chế độ tương tác ngón tay: "move" (kéo thả di chuyển) hoặc "rotate" (xoay 360)
  const [interactionMode, setInteractionMode] = useState<"move" | "rotate">("move");

  // Vị trí dời tương đối do người dùng kéo thả trên thẻ bài / không gian AR
  const userPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Nhóm điều khiển vị trí, tỉ lệ và xoay 3D
  const pivotGroupRef = useRef<any>(null);
  const maxDimRef = useRef<number>(1.0);
  const userScaleRef = useRef<number>(1.0);
  const userRotYRef = useRef<number>(0);
  const userRotXRef = useRef<number>(0);

  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [tapFeedback, setTapFeedback] = useState<string | null>(null);
  const tapFeedbackTimeoutRef = useRef<any>(null);

  // Đã quét thẻ thành công ít nhất 1 lần (dùng để duy trì vật thể không bao giờ biến mất)
  const hasScannedOnceRef = useRef<boolean>(false);

  // Refs bắt cử chỉ cảm ứng đa điểm (Touch Gestures)
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartTimeRef = useRef<number>(0);
  const lastTouchPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasTouchMovedRef = useRef<boolean>(false);
  const initialPinchDistRef = useRef<number>(0);
  const initialPinchScaleRef = useRef<number>(1.0);

  // Refs bắt cử chỉ chuột máy tính (Desktop Gestures)
  const isMouseDownRef = useRef<boolean>(false);
  const mouseStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseStartTimeRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMouseMovedRef = useRef<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTargetFound, setIsTargetFound] = useState<boolean>(false);
  const [hasScannedOnce, setHasScannedOnce] = useState<boolean>(false);

  const [activeLang, setActiveLang] = useState<"en" | "vi" | "zh" | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);
  const [currentAnimIndex, setCurrentAnimIndex] = useState<number>(0);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Bộ đếm thời gian dùng thử (30s trial)
  const [trialTimeLeft, setTrialTimeLeft] = useState<number>(isTrial ? 30 : 0);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(false);

  // Cập nhật ma trận biến đổi (Scale + Rotation + Position) cho Pivot Group
  const applyTransform = useCallback(() => {
    const pivot = pivotGroupRef.current;
    if (!pivot) return;

    pivot.rotation.y = userRotYRef.current;
    pivot.rotation.x = userRotXRef.current;

    // Chiều rộng thẻ bài là 1.0 -> tỉ lệ chuẩn ~0.48 kích thước thẻ bài
    const baseDim = 0.48;
    const s = (baseDim / (maxDimRef.current || 1)) * userScaleRef.current;
    pivot.scale.set(s, s, s);
    pivot.position.set(userPosRef.current.x, userPosRef.current.y, 0);
  }, []);

  // Nút bấm tăng / giảm tỉ lệ mô hình 3D
  const handleZoom = useCallback((delta: number) => {
    const next = Math.max(0.35, Math.min(2.5, Math.round((userScaleRef.current + delta) * 100) / 100));
    userScaleRef.current = next;
    setZoomPercent(Math.round(next * 100));
    applyTransform();
  }, [applyTransform]);

  // Đặt lại góc nhìn, vị trí và tỉ lệ mô hình về chuẩn 100%
  const handleResetTransform = useCallback(() => {
    userScaleRef.current = 1.0;
    userRotYRef.current = 0;
    userRotXRef.current = 0;
    userPosRef.current = { x: 0, y: 0 };
    setZoomPercent(100);
    applyTransform();
  }, [applyTransform]);

  // Hiệu ứng tương tác: Mô hình nhún nhảy tinh nghịch khi chạm
  const triggerModelReaction = useCallback(() => {
    if (!pivotGroupRef.current) return;
    const pivot = pivotGroupRef.current;
    const baseY = pivot.position.y;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      pivot.position.y = baseY + Math.sin(step * 0.5) * 0.25;
      if (step >= 12) {
        clearInterval(interval);
        pivot.position.y = baseY;
      }
    }, 25);
  }, []);

  // Xử lý chạm tương tác trực tiếp lên con vật
  const triggerTapInteraction = useCallback(() => {
    playAnimalSoundEffect(animal.slug);
    triggerModelReaction();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch {}
    }
    setTapFeedback(`Bé vừa tương tác với ${animal.nameVi}!`);
    if (tapFeedbackTimeoutRef.current) {
      clearTimeout(tapFeedbackTimeoutRef.current);
    }
    tapFeedbackTimeoutRef.current = setTimeout(() => {
      setTapFeedback(null);
    }, 1800);
  }, [animal.slug, animal.nameVi, triggerModelReaction]);

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

  // Countdown timer cho bản dùng thử
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

  // Initialize MindAR and Three.js scene
  useEffect(() => {
    let isCancelled = false;

    async function startAR() {
      try {
        setIsLoading(true);
        setLoadError(null);

        // 1. Nạp bộ thư viện MindAR Three UMD nếu chưa có
        if (!window.MINDAR || !window.MINDAR.IMAGE || !window.MINDAR.IMAGE.MindARThree) {
          await loadScript("/lib/mindar-image-three.prod.js");
        }

        if (isCancelled) return;

        // Gán Three.js toàn cục để tương thích GLTFLoader
        if (!window.THREE && window.MINDAR && window.MINDAR.IMAGE.THREE) {
          window.THREE = window.MINDAR.IMAGE.THREE;
        }

        // 2. Nạp GLTFLoader nếu chưa có
        if (!window.THREE.GLTFLoader) {
          await loadScript("/lib/GLTFLoader.js");
        }

        if (isCancelled || !containerRef.current) return;

        const THREE = window.THREE;
        const { MindARThree } = window.MINDAR!.IMAGE;

        // 3. Khởi tạo MindAR Three instance
        const mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: `/targets/${animal.slug}.mind`,
          maxTrack: 1,
          uiLoading: "no",
          uiScanning: "no",
        });

        mindarRef.current = mindarThree;

        const { renderer, scene, camera } = mindarThree;

        // Thêm ánh sáng môi trường cho mô hình 3D rực rỡ
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
        dirLight.position.set(0, 10, 5);
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xffedd5, 0.8);
        fillLight.position.set(0, -5, 5);
        scene.add(fillLight);

        // A. Anchor bám theo thẻ bài vật lý
        const anchor = mindarThree.addAnchor(0);
        anchorGroupRef.current = anchor.group;

        // Bắt sự kiện nhận diện thẻ bài
        anchor.onTargetFound = () => {
          if (!isCancelled) {
            setIsTargetFound(true);
            setHasScannedOnce(true);
            hasScannedOnceRef.current = true;
            playAnimalSoundEffect(animal.slug);
          }
        };

        anchor.onTargetLost = () => {
          if (!isCancelled) {
            setIsTargetFound(false);
            // KHÔNG ẩn con vật! Vẫn duy trì hiển thị tại tọa độ 3D trong không gian thực
          }
        };

        // 4. Nạp mô hình 3D GLTF/GLB
        const loader = new THREE.GLTFLoader();
        loader.load(
          animal.modelUrl,
          (gltf: any) => {
            if (isCancelled) return;

            const rawModel = gltf.scene;

            // BẢO VỆ MÔ HÌNH: Tuyệt đối giữ nguyên rawModel gốc tại (0,0,0)
            // để bảo toàn cấu trúc SkinnedMesh, tránh kéo giãn/biến dạng vật thể!
            rawModel.position.set(0, 0, 0);
            rawModel.rotation.set(0, 0, 0);
            rawModel.scale.set(1, 1, 1);

            // Tính kích thước bounding box để chuẩn hóa scale
            const bbox = new THREE.Box3().setFromObject(rawModel);
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            maxDimRef.current = maxDim;

            // Tạo Pivot Group làm tâm điều phối
            const pivot = new THREE.Group();
            pivot.add(rawModel);

            // GẮN TRỰC TIẾP VÀO ANCHOR.GROUP:
            // Khi người dùng hướng camera vào thẻ bài, con vật XUẤT HIỆN TỨC THÌ TRÊN THẺ!
            anchor.group.add(pivot);

            const baseDim = 0.48;
            const initialScale = (baseDim / maxDim) * userScaleRef.current;
            pivot.scale.set(initialScale, initialScale, initialScale);
            pivot.position.set(userPosRef.current.x, userPosRef.current.y, 0);
            pivot.rotation.set(0, 0, 0);

            pivotGroupRef.current = pivot;
            modelRef.current = rawModel;

            // Xử lý Animations: CHỈ PHÁT nếu animation khớp với danh sách hợp lệ!
            // TUYỆT ĐỐI KHÔNG auto-play action bị lỗi như ArmatureAction làm biến dạng vật thể!
            if (gltf.animations && gltf.animations.length > 0) {
              const mixer = new THREE.AnimationMixer(rawModel);
              mixerRef.current = mixer;
              actionsRef.current = {};

              gltf.animations.forEach((clip: any) => {
                const action = mixer.clipAction(clip);
                actionsRef.current[clip.name] = action;
              });

              // Chỉ phát nếu tên animation khớp với cấu hình hợp lệ
              const validClipName = animal.animations?.find((animName) =>
                gltf.animations.some((clip: any) => clip.name.toLowerCase() === animName.toLowerCase())
              );
              if (validClipName && actionsRef.current[validClipName]) {
                actionsRef.current[validClipName].play();
              }
            }

            // 5. Khởi động Camera và Video stream tracking
            clockRef.current = new THREE.Clock();

            mindarThree
              .start()
              .then(() => {
                if (isCancelled) return;
                setIsLoading(false);

                // Khởi chạy vòng lặp render
                renderer.setAnimationLoop(() => {
                  if (clockRef.current && mixerRef.current) {
                    const delta = clockRef.current.getDelta();
                    mixerRef.current.update(delta);
                  }

                  // ĐẢM BẢO VẬT THỂ KHÔNG BAO GIỜ BIẾN MẤT:
                  // Khi đã nhận diện thẻ bài ít nhất 1 lần, duy trì anchor.group luôn hiển thị
                  // ngay cả khi người dùng di chuyển camera ra khỏi thẻ bài vào phòng!
                  if (hasScannedOnceRef.current && anchorGroupRef.current) {
                    anchorGroupRef.current.visible = true;
                  }

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
          undefined,
          (err: any) => {
            console.error("[GLTF Loader Error]:", err);
            if (!isCancelled) {
              setLoadError("Không thể tải mô hình 3D con vật. Vui lòng thử lại sau.");
              setIsLoading(false);
            }
          }
        );
      } catch (err: any) {
        console.error("[WebAR Init Error]:", err);
        if (!isCancelled) {
          setLoadError(err.message || "Lỗi khởi tạo AR Engine.");
          setIsLoading(false);
        }
      }
    }

    startAR();

    return () => {
      isCancelled = true;
      if (tapFeedbackTimeoutRef.current) {
        clearTimeout(tapFeedbackTimeoutRef.current);
      }
      if (mindarRef.current) {
        try {
          mindarRef.current.stop();
          if (mindarRef.current.renderer) {
            mindarRef.current.renderer.setAnimationLoop(null);
          }
        } catch (e) {
          console.warn("[MindAR Stop]:", e);
        }
      }
    };
  }, [animal, loadScript]);

  // 1. Cử chỉ chạm đa điểm (Touch Gestures: Di chuyển vị trí, Xoay 360, Thu phóng 2 ngón, Chạm để chơi)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastTouchPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchStartTimeRef.current = Date.now();
      hasTouchMovedRef.current = false;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialPinchScaleRef.current = userScaleRef.current;
      hasTouchMovedRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const dx = clientX - lastTouchPosRef.current.x;
      const dy = clientY - lastTouchPosRef.current.y;
      const totalDist = Math.hypot(
        clientX - touchStartPosRef.current.x,
        clientY - touchStartPosRef.current.y
      );
      if (totalDist > 8) {
        hasTouchMovedRef.current = true;
      }

      if (interactionMode === "move") {
        // VẤN ĐỀ 1: CHẠM VÀO VẬT THỂ ĐỂ DI CHUYỂN VỊ TRÍ
        userPosRef.current.x += dx * 0.003;
        userPosRef.current.y -= dy * 0.003;
        userPosRef.current.x = Math.max(-1.5, Math.min(1.5, userPosRef.current.x));
        userPosRef.current.y = Math.max(-1.5, Math.min(1.5, userPosRef.current.y));
      } else {
        // Xoay 360 độ quanh trục Y
        userRotYRef.current += dx * 0.015;
        userRotXRef.current = Math.max(-0.4, Math.min(0.6, userRotXRef.current + dy * 0.008));
      }

      applyTransform();
      lastTouchPosRef.current = { x: clientX, y: clientY };
    } else if (e.touches.length === 2 && initialPinchDistRef.current > 0) {
      hasTouchMovedRef.current = true;
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / initialPinchDistRef.current;
      const nextScale = Math.max(0.35, Math.min(2.5, Math.round(initialPinchScaleRef.current * factor * 100) / 100));
      userScaleRef.current = nextScale;
      setZoomPercent(Math.round(nextScale * 100));
      applyTransform();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      const elapsed = Date.now() - touchStartTimeRef.current;
      if (!hasTouchMovedRef.current && elapsed < 350) {
        triggerTapInteraction();
      }
      initialPinchDistRef.current = 0;
    } else if (e.touches.length === 1) {
      lastTouchPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialPinchDistRef.current = 0;
    }
  };

  // 2. Cử chỉ chuột dự phòng (Desktop / Chuột máy tính)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownRef.current = true;
    mouseStartPosRef.current = { x: e.clientX, y: e.clientY };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    mouseStartTimeRef.current = Date.now();
    hasMouseMovedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    const totalDist = Math.hypot(
      e.clientX - mouseStartPosRef.current.x,
      e.clientY - mouseStartPosRef.current.y
    );
    if (totalDist > 6) {
      hasMouseMovedRef.current = true;
    }

    if (interactionMode === "move") {
      userPosRef.current.x += dx * 0.003;
      userPosRef.current.y -= dy * 0.003;
      userPosRef.current.x = Math.max(-1.5, Math.min(1.5, userPosRef.current.x));
      userPosRef.current.y = Math.max(-1.5, Math.min(1.5, userPosRef.current.y));
    } else {
      userRotYRef.current += dx * 0.015;
      userRotXRef.current = Math.max(-0.4, Math.min(0.6, userRotXRef.current + dy * 0.008));
    }

    applyTransform();
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    const elapsed = Date.now() - mouseStartTimeRef.current;
    if (!hasMouseMovedRef.current && elapsed < 350) {
      triggerTapInteraction();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    handleZoom(delta);
  };

  // Xử lý phát âm đa ngữ khi chạm vào 3 nút bấm
  const handleSpeak = (lang: "en" | "vi" | "zh") => {
    setActiveLang(lang);
    triggerModelReaction();

    let textToSpeak = animal.nameEn;
    if (lang === "vi") textToSpeak = animal.nameVi;
    if (lang === "zh") textToSpeak = animal.nameZh || animal.nameEn;

    speakWord(textToSpeak, lang, () => {
      setActiveLang(null);
    });
  };

  // Xử lý phát tiếng kêu con vật
  const handleAnimalSound = () => {
    setIsPlayingSound(true);
    triggerModelReaction();
    playAnimalSoundEffect(animal.slug, () => {
      setIsPlayingSound(false);
    });
  };

  // Đổi hoạt ảnh của con vật
  const handleToggleAnimation = () => {
    if (!animal.animations || animal.animations.length <= 1 || !mixerRef.current) return;
    const nextIndex = (currentAnimIndex + 1) % animal.animations.length;
    const currentName = animal.animations[currentAnimIndex];
    const nextName = animal.animations[nextIndex];

    const currentAction = actionsRef.current[currentName];
    const nextAction = actionsRef.current[nextName];

    if (currentAction && nextAction) {
      currentAction.fadeOut(0.3);
      nextAction.reset().fadeIn(0.3).play();
    }
    setCurrentAnimIndex(nextIndex);
  };

  // Chụp ảnh kỷ niệm AR
  const handleCapturePhoto = () => {
    if (!mindarRef.current || !containerRef.current) return;
    try {
      const videoEl = containerRef.current.querySelector("video") as HTMLVideoElement | null;
      const canvasEl = containerRef.current.querySelector("canvas") as HTMLCanvasElement | null;

      if (!videoEl || !canvasEl) return;

      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = videoEl.videoWidth || canvasEl.width;
      captureCanvas.height = videoEl.videoHeight || canvasEl.height;
      const ctx = captureCanvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(videoEl, 0, 0, captureCanvas.width, captureCanvas.height);
      ctx.drawImage(canvasEl, 0, 0, captureCanvas.width, captureCanvas.height);

      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.roundRect(16, captureCanvas.height - 48, 200, 36, 8);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`Poly Cards AR • ${animal.nameEn}`, 28, captureCanvas.height - 25);

      const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.92);
      setCapturedPhotoUrl(dataUrl);
    } catch (err) {
      console.warn("Lỗi khi chụp ảnh AR:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-[100dvh] bg-black select-none overflow-hidden touch-none">
      {/* 1. Camera Viewport: Ép full màn hình 100dvh loại bỏ hoàn toàn khoảng đen */}
      <div
        ref={containerRef}
        id="webar-camera-viewport"
        className="absolute inset-0 w-full h-full overflow-hidden [&>video]:!absolute [&>video]:!inset-0 [&>video]:!w-full [&>video]:!h-full [&>video]:!object-cover [&>canvas]:!absolute [&>canvas]:!inset-0 [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:!object-cover pointer-events-none"
      />

      {/* 2. Lớp bắt cử chỉ cảm ứng tương tác 3D (Vuốt 1 ngón xoay 360°, Chụm 2 ngón thu phóng, Chạm vào để chơi) */}
      <div
        className="absolute inset-0 z-10 touch-none cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* 3. Top Navigation Bar (Nút Đóng, Chế độ Ghim, Đồng hồ dùng thử, Trợ giúp) */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3.5 pt-3.5 pb-2 pointer-events-none">
        {/* Nút thoát AR */}
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-black/60 text-white border border-white/20 backdrop-blur-md active:scale-90 transition-transform shadow-lg"
          title="Đóng Camera AR"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cụm thông tin huy hiệu Poly Cards AR */}
        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 border border-white/25 backdrop-blur-md shadow-lg">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] font-black text-amber-300">
              Poly Cards 3D AR
            </span>
          </div>

          {/* Huy hiệu đếm ngược nếu là bản dùng thử 30s */}
          {isTrial && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/90 text-stone-950 font-black text-[10px] shadow-sm">
              <Clock className="h-3 w-3" />
              <span>Dùng thử: {trialTimeLeft}s</span>
            </div>
          )}
        </div>

        {/* Nút trợ giúp / hướng dẫn */}
        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-black/60 text-white border border-white/20 backdrop-blur-md active:scale-90 transition-transform shadow-lg"
          title="Hướng dẫn sử dụng"
        >
          <HelpCircle className="h-5 w-5 text-amber-300" />
        </button>
      </div>

      {/* 4. Bộ điều khiển chế độ tương tác: Di chuyển vị trí <-> Xoay 360° */}
      <div className="absolute top-15 inset-x-0 z-30 flex flex-col items-center gap-1.5 pointer-events-none px-4">
        <div className="pointer-events-auto flex items-center p-1 rounded-full bg-stone-950/80 border border-white/25 backdrop-blur-md shadow-xl">
          <button
            type="button"
            onClick={() => setInteractionMode("move")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              interactionMode === "move"
                ? "bg-amber-400 text-stone-950 shadow-md font-black"
                : "text-stone-300 hover:text-white"
            }`}
          >
            <Move className="h-3.5 w-3.5" />
            <span>Di chuyển vị trí</span>
          </button>
          <button
            type="button"
            onClick={() => setInteractionMode("rotate")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              interactionMode === "rotate"
                ? "bg-amber-400 text-stone-950 shadow-md font-black"
                : "text-stone-300 hover:text-white"
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Xoay 360°</span>
          </button>
        </div>

        {/* Gợi ý thao tác theo chế độ đang chọn */}
        <div className="flex items-center gap-1.5 rounded-full bg-black/60 border border-white/15 px-3 py-0.5 backdrop-blur-md text-[10.5px] font-medium text-amber-200/90 shadow">
          <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
          <span>
            {interactionMode === "move"
              ? "Chạm kéo 1 ngón di chuyển vị trí • 2 ngón thu phóng"
              : "Vuốt 1 ngón xoay 360° • 2 ngón thu phóng • Chạm để chơi"}
          </span>
        </div>
      </div>

      {/* 5. Toast phản hồi khi bé chạm tương tác vào con vật */}
      {tapFeedback && (
        <div className="absolute top-28 inset-x-0 z-30 flex justify-center pointer-events-none px-4 animate-in fade-in zoom-in duration-150">
          <div className="flex items-center gap-2 rounded-2xl bg-amber-500 text-stone-950 font-black px-4 py-1.5 shadow-xl shadow-amber-500/30 text-xs">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{tapFeedback}</span>
          </div>
        </div>
      )}

      {/* 6. Cụm nút công cụ thu phóng & đặt lại kích thước 3D nổi cạnh phải */}
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-black/65 border border-white/20 backdrop-blur-md shadow-2xl pointer-events-auto">
        <button
          type="button"
          onClick={() => handleZoom(0.15)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all"
          title="Phóng to 3D (+15%)"
          aria-label="Phóng to 3D"
        >
          <ZoomIn className="h-4 w-4 text-amber-300" />
        </button>

        <span className="text-[10px] font-black text-amber-200/90 py-0.5 select-none font-mono tracking-tighter">
          {zoomPercent}%
        </span>

        <button
          type="button"
          onClick={() => handleZoom(-0.15)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all"
          title="Thu nhỏ 3D (-15%)"
          aria-label="Thu nhỏ 3D"
        >
          <ZoomOut className="h-4 w-4 text-amber-300" />
        </button>

        <div className="w-5 h-px bg-white/15 my-0.5" />

        <button
          type="button"
          onClick={handleResetTransform}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all"
          title="Đặt lại kích thước và góc xoay chuẩn"
          aria-label="Đặt lại góc nhìn 3D"
        >
          <RotateCcw className="h-3.5 w-3.5 text-stone-300" />
        </button>
      </div>

      {/* 7. Khung ngắm định vị thẻ bài (Hiện khi chưa nhận diện được thẻ) */}
      {!isLoading && !loadError && !isTargetFound && !hasScannedOnce && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className="relative w-64 h-80 max-w-[70vw] max-h-[45vh] rounded-3xl border-2 border-dashed border-amber-300/80 shadow-[0_0_25px_rgba(251,191,36,0.35)] bg-black/10">
            <div className="absolute -top-1.5 -left-1.5 h-6 w-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
            <div className="absolute -top-1.5 -right-1.5 h-6 w-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
            <div className="absolute -bottom-1.5 -left-1.5 h-6 w-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
            <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />

            <div className="absolute -top-10 inset-x-0 flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-amber-500/95 px-4 py-1.5 text-xs font-black text-stone-950 shadow-xl backdrop-blur-md animate-pulse">
                <Scan className="h-4 w-4 animate-spin" />
                <span>Hướng camera vào ảnh {animal.nameVi}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Loading State Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/85 backdrop-blur-md px-6 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 border-t-amber-400 animate-spin" />
            <Sparkles className="h-7 w-7 text-amber-400 animate-pulse" />
          </div>
          <h3 className="mt-4 text-base font-black text-white">
            Đang Khởi Động AR Poly Cards...
          </h3>
          <p className="mt-1 text-xs text-amber-200/80 max-w-xs leading-relaxed">
            Đang đồng bộ thị giác và kết nối máy ảnh
          </p>
        </div>
      )}

      {/* 5. Error State */}
      {loadError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/90 backdrop-blur-md px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-3">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="text-base font-black text-white">Chưa thể bật Camera AR</h3>
          <p className="mt-1.5 text-xs text-stone-300 max-w-xs leading-relaxed">
            {loadError}
          </p>
          <div className="mt-5 flex flex-col gap-2 w-full max-w-xs">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 text-xs font-black text-stone-950 active:scale-95 transition-transform shadow-lg"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử Lại Lần Nữa</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-xs font-bold text-white border border-white/20 active:scale-95 transition-transform"
            >
              <span>Quay Lại Chế Độ 3D</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Floating Control Island (Trong suốt, không che khuất màn hình camera) */}
      <div className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center px-3.5 pb-5 pt-2 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md rounded-3xl bg-stone-950/70 border border-white/20 p-3 backdrop-blur-md shadow-2xl flex flex-col items-center gap-2.5">
          {/* Hàng 3 Nút Phát Âm Ngôn Ngữ Trọng Tâm (EN / VI / ZH) */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {/* NÚT TIẾNG ANH (EN) */}
            <button
              type="button"
              onClick={() => handleSpeak("en")}
              className={`relative flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl border-2 backdrop-blur-md active:scale-95 transition-all shadow-md ${
                activeLang === "en"
                  ? "bg-amber-500 border-amber-300 text-stone-950 scale-105 shadow-amber-500/40"
                  : "bg-black/50 border-amber-400/40 text-white hover:border-amber-400"
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                <Languages className="h-3 w-3" />
                <span>EN</span>
              </div>
              <span className="text-xs font-black truncate max-w-full">
                {animal.nameEn}
              </span>
              <span className="text-[9px] font-mono text-amber-200/80">
                {animal.ipa}
              </span>
            </button>

            {/* NÚT TIẾNG VIỆT (VI) */}
            <button
              type="button"
              onClick={() => handleSpeak("vi")}
              className={`relative flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl border-2 backdrop-blur-md active:scale-95 transition-all shadow-md ${
                activeLang === "vi"
                  ? "bg-emerald-500 border-emerald-300 text-white scale-105 shadow-emerald-500/40"
                  : "bg-black/50 border-emerald-400/40 text-white hover:border-emerald-400"
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                <Languages className="h-3 w-3" />
                <span>VI</span>
              </div>
              <span className="text-xs font-black truncate max-w-full">
                {animal.nameVi}
              </span>
              <span className="text-[9px] text-emerald-200/80">
                Tiếng Việt
              </span>
            </button>

            {/* NÚT TIẾNG TRUNG (ZH) */}
            <button
              type="button"
              onClick={() => handleSpeak("zh")}
              className={`relative flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl border-2 backdrop-blur-md active:scale-95 transition-all shadow-md ${
                activeLang === "zh"
                  ? "bg-rose-500 border-rose-300 text-white scale-105 shadow-rose-500/40"
                  : "bg-black/50 border-rose-400/40 text-white hover:border-rose-400"
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-300">
                <Languages className="h-3 w-3" />
                <span>ZH</span>
              </div>
              <span className="text-xs font-black truncate max-w-full">
                {animal.nameZh || animal.nameEn}
              </span>
              <span className="text-[9px] font-mono text-rose-200/80">
                {animal.pinyinZh || "zhōngwén"}
              </span>
            </button>
          </div>

          {/* Hàng các nút phụ trợ: Tiếng kêu, Đổi hoạt ảnh, Chụp ảnh */}
          <div className="flex items-center justify-center gap-2 w-full">
            <button
              type="button"
              onClick={handleAnimalSound}
              className={`flex flex-1 min-h-[40px] items-center justify-center gap-1.5 rounded-2xl px-2.5 text-xs font-bold border transition-all active:scale-95 shadow-xs ${
                isPlayingSound
                  ? "bg-amber-400 text-stone-950 border-amber-300"
                  : "bg-stone-900/80 text-amber-300 border-amber-500/30 hover:bg-stone-800"
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Tiếng Kêu</span>
            </button>

            {animal.animations && animal.animations.length > 1 && (
              <button
                type="button"
                onClick={handleToggleAnimation}
                className="flex flex-1 min-h-[40px] items-center justify-center gap-1.5 rounded-2xl bg-stone-900/80 px-2.5 text-xs font-bold text-sky-300 border border-sky-500/30 hover:bg-stone-800 transition-all active:scale-95 shadow-xs"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Động Tác ({currentAnimIndex + 1})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCapturePhoto}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 font-black shadow-lg shadow-amber-500/30 active:scale-90 transition-transform shrink-0"
              title="Chụp ảnh AR"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Modal Hết Giờ Dùng Thử (Trial Expired Paywall) */}
      {isTrialExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full rounded-3xl bg-stone-900 border-2 border-amber-400/80 p-5 shadow-2xl text-center text-white">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mb-3">
              <Sparkles className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-black text-white">
              Hết 30s Trải Nghiệm Thử!
            </h3>
            <p className="mt-2 text-xs text-stone-300 leading-relaxed">
              Bé vừa khám phá xong bạn <strong>{animal.nameVi}</strong> ({animal.nameEn}). Để kích hoạt không giới hạn toàn bộ bộ thẻ bài AR Poly Cards, bạn có thể:
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenOrder) onOpenOrder();
                }}
                className="w-full flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-xs font-black text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform"
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
                className="w-full flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-xs font-bold text-amber-300 border border-amber-400/30 active:scale-95 transition-transform"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Tôi Đã Có Thẻ (Nhập Mã Bản Quyền)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-stone-400 underline pt-1"
              >
                Quay lại trang chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Xem & Tải Ảnh Đã Chụp */}
      {capturedPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative max-w-sm w-full rounded-3xl bg-stone-900 border-2 border-amber-400/60 p-4 shadow-2xl flex flex-col items-center">
            <button
              type="button"
              onClick={() => setCapturedPhotoUrl(null)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-3">
              <Sparkles className="h-4 w-4" />
              <span>Ảnh Chụp AR Poly Cards</span>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden border border-white/20 bg-black aspect-3/4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedPhotoUrl}
                alt={`Ảnh AR ${animal.nameEn}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-3.5 flex items-center gap-2.5 w-full">
              <a
                href={capturedPhotoUrl}
                download={`polycards-${animal.slug}-ar.jpg`}
                className="flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-xs font-black text-white active:scale-95 transition-transform shadow-lg"
              >
                <Download className="h-4 w-4" />
                <span>Tải Ảnh Về Máy</span>
              </a>
              <button
                type="button"
                onClick={() => setCapturedPhotoUrl(null)}
                className="min-h-[44px] px-4 rounded-2xl bg-white/10 text-xs font-bold text-white border border-white/20 active:scale-95 transition-transform"
              >
                Chụp Tiếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal Hướng Dẫn Sử Dụng AR */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-sm w-full rounded-3xl bg-stone-900 border-2 border-amber-300/60 p-5 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-base font-black">Hướng Dẫn Quét AR Thẻ Bài</h3>
            </div>

            <div className="mt-3 space-y-2.5 text-xs leading-relaxed text-stone-300">
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  1
                </span>
                <span>
                  Đặt tấm thẻ bài <strong>{animal.nameVi}</strong> ở nơi đủ sáng. Hướng camera vào hình con vật để kích hoạt.
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  2
                </span>
                <span>
                  <strong>Không cần dí camera liên tục:</strong> Sau khi nhận diện, con vật sẽ tự động <strong>đồng hành trước mắt bé</strong> ngay cả khi thẻ di chuyển!
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  3
                </span>
                <span>
                  <strong>Cử chỉ tương tác sống động:</strong> Dùng <strong>1 ngón tay vuốt</strong> để xoay 360°, <strong>2 ngón chụm/mở</strong> để thu phóng to nhỏ, và <strong>chạm vào màn hình</strong> để nghe tiếng kêu nhún nhảy!
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  4
                </span>
                <span>
                  Chạm vào các nút <strong>EN</strong>, <strong>VI</strong>, <strong>ZH</strong> để luyện phát âm đa ngữ chuẩn quốc tế.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full min-h-[42px] rounded-2xl bg-amber-500 text-xs font-black text-stone-950 active:scale-95 transition-transform"
            >
              Đã Hiểu, Bắt Đầu Chơi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
