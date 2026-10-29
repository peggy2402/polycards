"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Animal } from "@/types/animal";
import {
  playCardLanguageAudio,
  playAnimalSoundEffect,
} from "@/lib/speech-audio";
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
  ShoppingBag,
  KeyRound,
  Clock,
  ZoomIn,
  ZoomOut,
  Wrench,
  Check,
  Radio,
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
  const actionsRef = useRef<{ [name: string]: any }>({});
  const clockRef = useRef<any>(null);

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

  // Đã quét thẻ thành công ít nhất 1 lần & trạng thái bắt dính thẻ thời gian thực
  const hasScannedOnceRef = useRef<boolean>(false);
  const isTargetFoundRef = useRef<boolean>(false);

  // Loading & Download Progress
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStats, setDownloadStats] = useState<{ loadedMb: string; totalMb: string }>({
    loadedMb: "0",
    totalMb: "0",
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  // Tracking States
  const [isTargetFound, setIsTargetFound] = useState<boolean>(false);
  const [hasScannedOnce, setHasScannedOnce] = useState<boolean>(false);
  const [targetHitCount, setTargetHitCount] = useState<number>(0);
  const [playingClipName, setPlayingClipName] = useState<string | null>(null);
  const [isFreeArMode, setIsFreeArMode] = useState<boolean>(false);
  const [isUsingFallbackModel, setIsUsingFallbackModel] = useState<boolean>(false);

  // Debug HUD State
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const lastFpsTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);

  // Audio / Speech / Photo States
  const [activeLang, setActiveLang] = useState<"en" | "vi" | "zh" | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Phân hệ 2 Luồng Song Ngữ: EN-VI (Anh - Việt) hoặc ZH-VI (Trung - Việt)
  const isEnViEnabled = animal.enableEnVi !== false;
  const isZhViEnabled =
    animal.enableZhVi !== undefined
      ? animal.enableZhVi
      : Boolean(animal.nameZh && animal.nameZh.trim());

  const [urlLockedTrack, setUrlLockedTrack] = useState<"en-vi" | "zh-vi" | null>(null);
  const [languageTrack, setLanguageTrack] = useState<"en-vi" | "zh-vi">(
    !isEnViEnabled && isZhViEnabled ? "zh-vi" : "en-vi"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryLang = params.get("lang");
      if (queryLang === "en-vi" || queryLang === "zh-vi") {
        setUrlLockedTrack(queryLang);
        setLanguageTrack(queryLang);
        return;
      }

      if (isEnViEnabled && !isZhViEnabled) {
        setLanguageTrack("en-vi");
        return;
      }
      if (!isEnViEnabled && isZhViEnabled) {
        setLanguageTrack("zh-vi");
        return;
      }

      const saved = localStorage.getItem("polycards_lang_track");
      if (saved === "zh-vi" || saved === "en-vi") {
        setLanguageTrack(saved);
      }
    }
  }, [isEnViEnabled, isZhViEnabled]);

  const showBothTracksSwitcher =
    !urlLockedTrack && isEnViEnabled && isZhViEnabled;

  // Bộ đếm thời gian dùng thử (3s trial cho khách chưa mua)
  const [trialTimeLeft, setTrialTimeLeft] = useState<number>(isTrial ? 3 : 0);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(false);

  // Refs bắt cử chỉ cảm ứng đa điểm Apple AR (1-finger pan, 2-finger rotate & pinch)
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartTimeRef = useRef<number>(0);
  const lastTouchPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasTouchMovedRef = useRef<boolean>(false);

  const initialTouchDistRef = useRef<number>(0);
  const initialTouchAngleRef = useRef<number>(0);
  const initialUserScaleRef = useRef<number>(1.0);
  const initialUserRotYRef = useRef<number>(0);

  // Refs bắt cử chỉ chuột máy tính (Desktop Gestures)
  const isMouseDownRef = useRef<boolean>(false);
  const mouseButtonRef = useRef<number>(0);
  const mouseStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseStartTimeRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMouseMovedRef = useRef<boolean>(false);

  // Kiểm tra tham số ?debug=1 trên URL khi khởi động
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("debug") === "1" || sp.get("debug") === "true") {
        setIsDebugOpen(true);
      }
    }
  }, []);

  // Cập nhật ma trận biến đổi (Scale + Rotation + Position) cho Pivot Group
  const applyTransform = useCallback(() => {
    const pivot = pivotGroupRef.current;
    if (!pivot) return;

    pivot.rotation.y = userRotYRef.current;
    pivot.rotation.x = userRotXRef.current;

    // Chiều rộng thẻ bài là 1.0 -> tỉ lệ chuẩn ~0.50 kích thước thẻ bài
    const baseDim = 0.5;
    const s = (baseDim / (maxDimRef.current || 1)) * userScaleRef.current;
    pivot.scale.set(s, s, s);
    pivot.position.set(userPosRef.current.x, userPosRef.current.y, 0);
  }, []);

  // Nút bấm tăng / giảm tỉ lệ mô hình 3D
  const handleZoom = useCallback((delta: number) => {
    const next = Math.max(0.35, Math.min(2.8, Math.round((userScaleRef.current + delta) * 100) / 100));
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
      pivot.position.y = baseY + Math.sin(step * 0.5) * 0.22;
      if (step >= 12) {
        clearInterval(interval);
        pivot.position.y = baseY;
      }
    }, 25);
  }, []);

  // Xử lý chạm tương tác trực tiếp lên con vật
  const triggerTapInteraction = useCallback(() => {
    playAnimalSoundEffect(animal.slug, undefined, animal.audioUrl);
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
  }, [animal.slug, animal.audioUrl, animal.nameVi, triggerModelReaction]);

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
        setDownloadProgress(5);
        setLoadError(null);

        // 1. Nạp bộ thư viện MindAR Three UMD nếu chưa có
        if (!window.MINDAR || !window.MINDAR.IMAGE || !window.MINDAR.IMAGE.MindARThree) {
          await loadScript("/lib/mindar-image-three.prod.js");
        }

        if (isCancelled) return;
        setDownloadProgress(15);

        // Gán Three.js toàn cục để tương thích GLTFLoader
        if (!window.THREE) {
          if (window.MINDAR && window.MINDAR.IMAGE && window.MINDAR.IMAGE.THREE) {
            window.THREE = window.MINDAR.IMAGE.THREE;
          } else if ((window as any).THREE) {
            window.THREE = (window as any).THREE;
          }
        }

        // 2. Nạp GLTFLoader nếu chưa có
        if (!(window.THREE && window.THREE.GLTFLoader)) {
          await loadScript("/lib/GLTFLoader.js");
          if (!window.THREE && (window as any).THREE) {
            window.THREE = (window as any).THREE;
          }
        }

        if (isCancelled || !containerRef.current) return;
        setDownloadProgress(25);

        if (!window.THREE) {
          throw new Error("Không thể khởi tạo thư viện Three.js WebAR. Vui lòng tải lại trang.");
        }

        const THREE = window.THREE;
        const { MindARThree } = window.MINDAR!.IMAGE;

        // 3. Xác thực & Chuẩn bị file Target MindAR (.mind) với cơ chế Fallback thông minh
        let resolvedTargetSrc = animal.targetUrl || `/targets/${animal.slug}.mind`;
        let isFallbackTarget = false;

        try {
          const checkRes = await fetch(resolvedTargetSrc, { method: "HEAD" });
          if (!checkRes.ok) {
            console.warn(`[WebAR] Target "${resolvedTargetSrc}" chưa sẵn sàng (HTTP ${checkRes.status}). Kích hoạt Fallback Target & Free AR View.`);
            resolvedTargetSrc = "/targets/lion.mind";
            isFallbackTarget = true;
          }
        } catch {
          resolvedTargetSrc = "/targets/lion.mind";
          isFallbackTarget = true;
        }

        if (isFallbackTarget && !isCancelled) {
          setIsFreeArMode(true);
        }

        // Dọn sạch container trước khi khởi tạo MindAR để tránh chồng lặp canvas/video trên iPhone Safari
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
            // KHÔNG ẩn con vật! Vẫn duy trì hiển thị tại tọa độ 3D trong không gian phòng
          }
        };

        // 4. Nạp mô hình 3D GLTF/GLB với Progress Tracker và Tự động Fallback sang lion.glb
        const loader = new THREE.GLTFLoader();
        const primaryModelUrl = animal.modelUrl || "/models/lion.glb";
        const fallbackModelUrl = "/models/lion.glb";

        const loadModelWithFallback = (urlToLoad: string, isFallbackAttempt: boolean = false) => {
          loader.load(
            urlToLoad,
            (gltf: any) => {
              if (isCancelled) return;
              setDownloadProgress(100);

              const rawModel = gltf.scene;

              // Tính Bounding Box để lấy kích thước và căn tâm (Center)
              const bbox = new THREE.Box3().setFromObject(rawModel);
              const center = bbox.getCenter(new THREE.Vector3());
              const size = bbox.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z) || 1;
              maxDimRef.current = maxDim;

              // CĂN TÂM CHUẨN XÁC: Tạo modelHolder để đưa tâm về (0,0,0)
              // Tuyệt đối giữ nguyên rawModel gốc tại (0,0,0) để bảo toàn SkinnedMesh
              const modelHolder = new THREE.Group();
              modelHolder.position.set(-center.x, -center.y, -center.z);
              modelHolder.add(rawModel);

              // Tạo Pivot Group làm tâm điều phối xoay 360 và di chuyển
              const pivot = new THREE.Group();
              pivot.add(modelHolder);

              // Gắn vào anchor.group
              anchor.group.add(pivot);

              const baseDim = 0.5;
              const initialScale = (baseDim / maxDim) * userScaleRef.current;
              pivot.scale.set(initialScale, initialScale, initialScale);
              pivot.position.set(userPosRef.current.x, userPosRef.current.y, 0);
              pivot.rotation.set(0, 0, 0);

              pivotGroupRef.current = pivot;
              modelRef.current = rawModel;

              // ĐẶC BIỆT: HIỂN THỊ TỨC THÌ (Instant AR)
              // Ngay khi mô hình tải xong, cho hiển thị luôn trước mắt bé
              // Bé không bao giờ phải chịu cảnh màn hình trống trơn đợi tìm thẻ!
              hasScannedOnceRef.current = true;
              setHasScannedOnce(true);
              anchor.group.visible = true;

              // Xử lý Animations: Khôi phục cử động sống động
              if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(rawModel);
                mixerRef.current = mixer;
                actionsRef.current = {};

                gltf.animations.forEach((clip: any) => {
                  actionsRef.current[clip.name] = mixer.clipAction(clip);
                });

                // Đối với cat: Morph action gây vặn vẹo nên không tự động phát
                // Đối với lion và các con vật khác: phát clip khớp hoặc clip đầu tiên
                if (animal.slug !== "cat") {
                  let matchedClip = gltf.animations.find((clip: any) =>
                    animal.animations?.some((a) => a.toLowerCase() === clip.name.toLowerCase())
                  );
                  if (!matchedClip) {
                    matchedClip = gltf.animations[0];
                  }
                  if (matchedClip && actionsRef.current[matchedClip.name]) {
                    actionsRef.current[matchedClip.name].play();
                    setPlayingClipName(matchedClip.name);
                  }
                }
              }

              // 5. Khởi động Camera và Video stream tracking
              clockRef.current = new THREE.Clock();

              mindarThree
                .start()
                .then(() => {
                  if (isCancelled) return;
                  setIsLoading(false);

                  // Vector tạm tái sử dụng trong vòng lặp render để tối ưu 60FPS trên iPhone
                  const fallbackPos = new THREE.Vector3();
                  const fallbackQuat = new THREE.Quaternion();
                  const fallbackScale = new THREE.Vector3();

                  // Khởi chạy vòng lặp render và tính FPS
                  renderer.setAnimationLoop(() => {
                    // Đo FPS
                    frameCountRef.current++;
                    const now = Date.now();
                    if (now - lastFpsTimeRef.current >= 1000) {
                      setFps(frameCountRef.current);
                      frameCountRef.current = 0;
                      lastFpsTimeRef.current = now;
                    }

                    if (clockRef.current && mixerRef.current) {
                      const delta = clockRef.current.getDelta();
                      mixerRef.current.update(delta);
                    }

                    // ĐẢM BẢO MÔ HÌNH 3D HIỂN THỊ TỨC THÌ TRÊN IPHONE & ANDROID:
                    // Trong MindARThree, khi chưa nhận diện được thẻ .mind (isTargetFoundRef = false),
                    // anchor.group.matrix mặc định là ma trận đơn vị ở tọa độ (0,0,0) - nằm phía sau mặt cắt camera.near
                    // khiến mô hình bị cắt khuất hoàn toàn. Ta đặt ma trận fallback ngay chính giữa khung nhìn Camera!
                    if (hasScannedOnceRef.current && anchorGroupRef.current) {
                      anchorGroupRef.current.visible = true;

                      if (!isTargetFoundRef.current) {
                        const camNear = camera.near && camera.near > 0 ? camera.near : 10;
                        const camFar = camera.far && camera.far > camNear ? camera.far : 10000;
                        const dist = Math.min(Math.max(camNear * 6, 1000), camFar * 0.4);
                        const fovDeg = camera.fov && camera.fov > 0 ? camera.fov : 45;
                        const fovRad = (fovDeg * Math.PI) / 180;
                        const visibleHeight = 2 * dist * Math.tan(fovRad / 2);

                        fallbackPos.set(0, -visibleHeight * 0.05, -dist);
                        fallbackQuat.set(0, 0, 0, 1);
                        fallbackScale.set(visibleHeight, visibleHeight, visibleHeight);

                        anchorGroupRef.current.matrix.compose(
                          fallbackPos,
                          fallbackQuat,
                          fallbackScale
                        );
                        anchorGroupRef.current.matrixWorldNeedsUpdate = true;
                      }
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
            (xhr: any) => {
              if (xhr.lengthComputable && xhr.total > 0) {
                const percent = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
                setDownloadProgress(25 + Math.round(percent * 0.7));
                setDownloadStats({
                  loadedMb: (xhr.loaded / (1024 * 1024)).toFixed(1),
                  totalMb: (xhr.total / (1024 * 1024)).toFixed(1),
                });
              }
            },
            (err: any) => {
              console.error(`[GLTF Loader Error] URL: ${urlToLoad}`, err);
              if (!isFallbackAttempt && urlToLoad !== fallbackModelUrl) {
                console.warn(`[GLTF Fallback] Thử nạp mô hình mẫu thay thế: ${fallbackModelUrl}`);
                if (!isCancelled) {
                  setIsUsingFallbackModel(true);
                }
                loadModelWithFallback(fallbackModelUrl, true);
                return;
              }
              if (!isCancelled) {
                setLoadError("Không thể tải mô hình 3D con vật. Vui lòng thử lại sau.");
                setIsLoading(false);
              }
            }
          );
        };

        loadModelWithFallback(primaryModelUrl);
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
          if (mindarRef.current.renderer) {
            mindarRef.current.renderer.setAnimationLoop(null);
          }
          if (mindarRef.current.controller) {
            mindarRef.current.controller.stopProcessVideo();
          }
          if (mindarRef.current.video && mindarRef.current.video.srcObject) {
            mindarRef.current.video.srcObject
              .getTracks()
              .forEach((t: MediaStreamTrack) => t.stop());
            mindarRef.current.video.remove();
          }
        } catch (e) {
          console.warn("[MindAR Stop]:", e);
        }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [animal.slug, animal.modelUrl, animal.targetUrl, loadScript]);

  // CỬ CHỈ CẢM ỨNG ĐA ĐIỂM TỰ NHIÊN CHUẨN APPLE AR (Simultaneous Multi-touch Gestures)
  // - 1 ngón tay kéo: Di chuyển vị trí (Pan)
  // - 2 ngón tay xoay: Xoay 360 độ (Two-finger twist)
  // - 2 ngón tay chụm/mở: Thu phóng to nhỏ (Pinch zoom)
  // - Chạm 1 ngón tay: Tương tác âm thanh & nhún nhảy
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastTouchPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchStartTimeRef.current = Date.now();
      hasTouchMovedRef.current = false;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];

      // Khoảng cách và góc ban đầu giữa 2 ngón tay
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

      initialTouchDistRef.current = dist;
      initialTouchAngleRef.current = angle;
      initialUserScaleRef.current = userScaleRef.current;
      initialUserRotYRef.current = userRotYRef.current;
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

      // 1 ngón tay kéo: Luôn di chuyển vị trí mượt mà
      userPosRef.current.x += dx * 0.003;
      userPosRef.current.y -= dy * 0.003;
      userPosRef.current.x = Math.max(-1.8, Math.min(1.8, userPosRef.current.x));
      userPosRef.current.y = Math.max(-1.8, Math.min(1.8, userPosRef.current.y));

      applyTransform();
      lastTouchPosRef.current = { x: clientX, y: clientY };
    } else if (e.touches.length === 2 && initialTouchDistRef.current > 0) {
      hasTouchMovedRef.current = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];

      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const currentAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

      // 1. Pinch to Zoom
      const factor = currentDist / initialTouchDistRef.current;
      const nextScale = Math.max(0.35, Math.min(2.8, Math.round(initialUserScaleRef.current * factor * 100) / 100));
      userScaleRef.current = nextScale;
      setZoomPercent(Math.round(nextScale * 100));

      // 2. Two-finger Twist to Rotate 360°
      const angleDelta = currentAngle - initialTouchAngleRef.current;
      userRotYRef.current = initialUserRotYRef.current + angleDelta * 1.5;

      applyTransform();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      const elapsed = Date.now() - touchStartTimeRef.current;
      if (!hasTouchMovedRef.current && elapsed < 350) {
        triggerTapInteraction();
      }
      initialTouchDistRef.current = 0;
    } else if (e.touches.length === 1) {
      lastTouchPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialTouchDistRef.current = 0;
    }
  };

  // Cử chỉ chuột dự phòng (Desktop Mouse Controls)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownRef.current = true;
    mouseButtonRef.current = e.button;
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

    if (mouseButtonRef.current === 2 || e.shiftKey) {
      // Chuột phải hoặc Shift: Xoay 360 độ
      userRotYRef.current += dx * 0.015;
      userRotXRef.current = Math.max(-0.4, Math.min(0.6, userRotXRef.current + dy * 0.008));
    } else {
      // Chuột trái: Di chuyển vị trí
      userPosRef.current.x += dx * 0.003;
      userPosRef.current.y -= dy * 0.003;
      userPosRef.current.x = Math.max(-1.8, Math.min(1.8, userPosRef.current.x));
      userPosRef.current.y = Math.max(-1.8, Math.min(1.8, userPosRef.current.y));
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
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    handleZoom(delta);
  };

  // Xử lý phát âm đa ngữ khi chạm vào các nút bấm (Ưu tiên file MP3 tải lên cho ngôn ngữ đó, fallback Web Speech AI)
  const handleSpeak = (lang: "en" | "vi" | "zh") => {
    setActiveLang(lang);
    triggerModelReaction();

    playCardLanguageAudio(animal, lang, () => {
      setActiveLang(null);
    });
  };

  // Xử lý phát tiếng kêu con vật / hành động
  const handleAnimalSound = () => {
    setIsPlayingSound(true);
    triggerModelReaction();
    playAnimalSoundEffect(
      animal.slug,
      () => {
        setIsPlayingSound(false);
      },
      animal.audioUrl
    );
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

      const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.92);
      setCapturedPhotoUrl(dataUrl);
    } catch (e) {
      console.error("[Capture Photo Error]:", e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 w-full h-[100dvh] bg-black select-none overflow-hidden touch-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Camera Viewport: Ép full màn hình 100dvh loại bỏ hoàn toàn khoảng đen */}
      <div
        ref={containerRef}
        id="webar-camera-viewport"
        className="absolute inset-0 w-full h-full overflow-hidden [&>video]:!absolute [&>video]:!inset-0 [&>video]:!w-full [&>video]:!h-full [&>video]:!object-cover [&>canvas]:!absolute [&>canvas]:!inset-0 [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:!object-cover pointer-events-none"
      />

      {/* 2. Lớp bắt cử chỉ cảm ứng tương tác Apple AR (Kéo 1 ngón, Xoay 2 ngón, Thu phóng 2 ngón, Chạm để chơi) */}
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

      {/* 3. Top Navigation Bar (Nút Đóng, Cụm huy hiệu, Nút Debug HUD, Trợ giúp) */}
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

        {/* Cụm nút Debug HUD và Nút Hướng Dẫn */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsDebugOpen((prev) => !prev)}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-md active:scale-90 transition-all shadow-lg ${
              isDebugOpen
                ? "bg-amber-500 border-amber-300 text-stone-950 font-black shadow-amber-500/40"
                : "bg-black/60 text-stone-300 border-white/20 hover:text-white"
            }`}
            title="Bật/Tắt AR Debug HUD"
            aria-label="AR Debug HUD"
          >
            <Wrench className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/60 text-white border border-white/20 backdrop-blur-md active:scale-90 transition-transform shadow-lg"
            title="Hướng dẫn sử dụng"
          >
            <HelpCircle className="h-5 w-5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* 4. Thanh Gợi Ý Cử Chỉ Tự Nhiên Chuẩn Apple AR */}
      <div className="absolute top-15 inset-x-0 z-30 flex flex-col items-center gap-1.5 pointer-events-none px-4">
        <div className="flex items-center gap-2 rounded-full bg-stone-950/75 border border-white/20 px-3.5 py-1 backdrop-blur-md text-[11px] font-medium text-amber-200/95 shadow-xl">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Kéo 1 ngón di chuyển • Xoay 2 ngón 360° • Chụm 2 ngón thu phóng</span>
        </div>
        {isFreeArMode && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/85 border border-emerald-400/40 px-3 py-0.5 backdrop-blur-md text-[10px] font-bold text-emerald-200 shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>Chế Độ AR Tương Tác Trực Tiếp (Không cần thẻ bài vật lý)</span>
          </div>
        )}
      </div>

      {/* 5. AR Diagnostic Debug HUD Modal (Trực quan hóa nhận diện thẻ, FPS, tọa độ) */}
      {isDebugOpen && (
        <div className="absolute top-26 left-3.5 z-35 max-w-xs w-[calc(100vw-28px)] rounded-2xl bg-stone-950/90 border border-amber-400/50 p-3 backdrop-blur-lg shadow-2xl text-white font-mono text-[11px] space-y-2 pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <div className="flex items-center gap-1.5 font-sans font-black text-amber-400">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span>AR Inspector HUD</span>
            </div>
            <span className="text-[10px] text-stone-400 font-sans">FPS: {fps}</span>
          </div>

          <div className="space-y-1 text-stone-300 text-[10px]">
            <div className="flex justify-between items-center">
              <span>Target:</span>
              <span className="font-bold text-amber-300">
                {animal.slug}.mind {isFreeArMode ? "(Fallback Free AR)" : ""}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Mô hình 3D:</span>
              <span className="font-bold text-amber-300">
                {isUsingFallbackModel ? "lion.glb (Mẫu dự phòng)" : "Chính thức"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Trạng thái quét:</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-black font-sans uppercase ${
                  isTargetFound
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {isTargetFound ? "Đã Bắt Dính Thẻ" : "Đang Tìm Thẻ"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Số lần nhận diện:</span>
              <span className="font-bold text-white">{targetHitCount} lần</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Animation:</span>
              <span className="font-bold text-sky-300 truncate max-w-[140px]">
                {playingClipName || (animal.slug === "cat" ? "Static (Protected)" : "Default")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Vị trí (X, Y):</span>
              <span className="text-stone-300">
                {userPosRef.current.x.toFixed(2)}, {userPosRef.current.y.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tỉ lệ (Scale):</span>
              <span className="text-amber-300">{zoomPercent}%</span>
            </div>
          </div>

          <div className="pt-1 flex gap-1.5 border-t border-white/10 font-sans">
            <button
              type="button"
              onClick={() => {
                hasScannedOnceRef.current = true;
                setHasScannedOnce(true);
                if (anchorGroupRef.current) anchorGroupRef.current.visible = true;
              }}
              className="flex-1 py-1 px-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-[10px] font-bold text-white text-center"
            >
              Ép Hiện 3D
            </button>
            <button
              type="button"
              onClick={handleResetTransform}
              className="py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-stone-200"
            >
              Về Tâm
            </button>
            <button
              type="button"
              onClick={triggerTapInteraction}
              className="py-1 px-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-[10px] font-bold text-stone-950"
            >
              Test Kêu
            </button>
          </div>
        </div>
      )}

      {/* 6. Toast phản hồi khi bé chạm tương tác vào con vật */}
      {tapFeedback && (
        <div className="absolute top-24 inset-x-0 z-30 flex justify-center pointer-events-none px-4 animate-in fade-in zoom-in duration-150">
          <div className="flex items-center gap-2 rounded-2xl bg-amber-500 text-stone-950 font-black px-4 py-1.5 shadow-xl shadow-amber-500/30 text-xs">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{tapFeedback}</span>
          </div>
        </div>
      )}

      {/* 7. Cụm nút công cụ thu phóng & đặt lại kích thước 3D nổi cạnh phải */}
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

      {/* 8. Khung ngắm định vị thẻ bài (Chỉ hiện khi chưa từng nhận diện được thẻ) */}
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
                <span>Hướng camera vào thẻ {animal.nameVi}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Loading State Skeleton Với Thanh % Tiến Độ Tải Trực Quan */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/90 backdrop-blur-md px-6 text-center">
          <div className="relative flex h-18 w-18 items-center justify-center mb-2">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
            <Sparkles className="h-8 w-8 text-amber-400 animate-pulse" />
          </div>

          <h3 className="text-base font-black text-white">
            Đang Khởi Động AR Poly Cards...
          </h3>

          <p className="mt-1 text-xs text-amber-200/80 max-w-xs leading-relaxed">
            Đang kết nối camera và nạp mô hình 3D {animal.nameVi}
          </p>

          {/* Progress Bar & Percentage */}
          <div className="mt-5 w-full max-w-xs space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-amber-300">
              <span>Tiến độ tải AR:</span>
              <span className="font-mono">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
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

      {/* 11. Floating Control Island (Trong suốt, chuẩn công thái học) */}
      <div className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center px-3.5 pb-5 pt-2 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md rounded-3xl bg-stone-950/70 border border-white/20 p-3 backdrop-blur-md shadow-2xl flex flex-col items-center gap-2.5">
          {/* Nút Chuyển Đổi Gói Học Song Ngữ Chuyên Biệt (Chỉ hiển thị khi cả 2 chế độ Anh-Việt và Trung-Việt cùng bật) */}
          {showBothTracksSwitcher && (
            <div className="flex items-center p-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setLanguageTrack("en-vi");
                  if (typeof window !== "undefined") {
                    localStorage.setItem("polycards_lang_track", "en-vi");
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  languageTrack === "en-vi"
                    ? "bg-amber-400 text-stone-950 font-black shadow-md"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <Languages className="h-3 w-3" />
                <span>Song Ngữ Anh - Việt</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguageTrack("zh-vi");
                  if (typeof window !== "undefined") {
                    localStorage.setItem("polycards_lang_track", "zh-vi");
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  languageTrack === "zh-vi"
                    ? "bg-rose-500 text-white font-black shadow-md"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <Languages className="h-3 w-3" />
                <span>Song Ngữ Trung - Việt</span>
              </button>
            </div>
          )}

          {/* Hàng 2 Nút Phát Âm To Rõ Công Thái Học Chuẩn Bé Học (EN-VI hoặc ZH-VI) */}
          {languageTrack === "en-vi" ? (
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {/* NÚT TIẾNG ANH (EN) */}
              <button
                type="button"
                onClick={() => handleSpeak("en")}
                className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border-2 backdrop-blur-md active:scale-95 transition-all shadow-md ${
                  activeLang === "en"
                    ? "bg-amber-500 border-amber-300 text-stone-950 scale-105 shadow-amber-500/40"
                    : "bg-black/50 border-amber-400/50 text-white hover:border-amber-400"
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                  <Languages className="h-3.5 w-3.5" />
                  <span>TIẾNG ANH (EN)</span>
                </div>
                <span className="text-sm font-black truncate max-w-full">
                  {animal.nameEn}
                </span>
                <span className="text-[10px] font-mono text-amber-200/90 font-bold">
                  {animal.ipa}
                </span>
              </button>

              {/* NÚT TIẾNG VIỆT (VI) */}
              <button
                type="button"
                onClick={() => handleSpeak("vi")}
                className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border-2 backdrop-blur-md active:scale-95 transition-all shadow-md ${
                  activeLang === "vi"
                    ? "bg-emerald-500 border-emerald-300 text-white scale-105 shadow-emerald-500/40"
                    : "bg-black/50 border-emerald-400/50 text-white hover:border-emerald-400"
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  <Languages className="h-3.5 w-3.5" />
                  <span>TIẾNG VIỆT (VI)</span>
                </div>
                <span className="text-sm font-black truncate max-w-full">
                  {animal.nameVi}
                </span>
                <span className="text-[10px] text-emerald-200/90 font-bold">
                  Tiếng Mẹ Đẻ
                </span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {/* NÚT TIẾNG TRUNG (ZH) */}
              <button
                type="button"
                onClick={() => handleSpeak("zh")}
                className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border-2 backdrop-blur-md active:scale-95 transition-all shadow-md ${
                  activeLang === "zh"
                    ? "bg-rose-500 border-rose-300 text-white scale-105 shadow-rose-500/40"
                    : "bg-black/50 border-rose-400/50 text-white hover:border-rose-400"
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-300">
                  <Languages className="h-3.5 w-3.5" />
                  <span>TIẾNG TRUNG (ZH)</span>
                </div>
                <span className="text-sm font-black truncate max-w-full">
                  {animal.nameZh || animal.nameEn}
                </span>
                <span className="text-[10px] font-mono text-rose-200/90 font-bold">
                  {animal.pinyinZh || "zhōngwén"}
                </span>
              </button>

              {/* NÚT TIẾNG VIỆT (VI) */}
              <button
                type="button"
                onClick={() => handleSpeak("vi")}
                className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border-2 backdrop-blur-md active:scale-95 transition-all shadow-md ${
                  activeLang === "vi"
                    ? "bg-emerald-500 border-emerald-300 text-white scale-105 shadow-emerald-500/40"
                    : "bg-black/50 border-emerald-400/50 text-white hover:border-emerald-400"
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  <Languages className="h-3.5 w-3.5" />
                  <span>TIẾNG VIỆT (VI)</span>
                </div>
                <span className="text-sm font-black truncate max-w-full">
                  {animal.nameVi}
                </span>
                <span className="text-[10px] text-emerald-200/90 font-bold">
                  Tiếng Mẹ Đẻ
                </span>
              </button>
            </div>
          )}

          {/* Hàng Tiếng Kêu & Chụp Ảnh (Loại bỏ nút Động Tác thừa thãi) */}
          <div className="flex items-center justify-between gap-2 w-full">
            <button
              type="button"
              onClick={handleAnimalSound}
              className={`flex flex-1 min-h-[42px] items-center justify-center gap-2 rounded-2xl px-3 text-xs font-bold border transition-all active:scale-95 shadow-md ${
                isPlayingSound
                  ? "bg-amber-400 text-stone-950 border-amber-300"
                  : "bg-stone-900/80 text-amber-300 border-amber-500/30 hover:bg-stone-800"
              }`}
            >
              <Volume2 className="h-4 w-4" />
              <span>Phát Tiếng Kêu {animal.nameVi}</span>
            </button>

            <button
              type="button"
              onClick={handleCapturePhoto}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 font-black shadow-lg shadow-amber-500/30 active:scale-90 transition-transform shrink-0"
              title="Chụp ảnh AR"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 12. Modal Hết Giờ Dùng Thử (Trial Expired Paywall) */}
      {isTrialExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full rounded-3xl bg-stone-900 border-2 border-amber-400/80 p-5 shadow-2xl text-center text-white">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mb-3">
              <Sparkles className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-black text-white">
              Hết 3 Giây Quét Thử Miễn Phí!
            </h3>
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

      {/* 13. Modal Xem & Tải Ảnh Đã Chụp */}
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

      {/* 14. Modal Hướng Dẫn Sử Dụng AR */}
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
                  <strong>Xuất hiện tức thì:</strong> Mô hình 3D sẽ xuất hiện ngay trước mắt bạn. Nếu có thẻ bài <strong>{animal.nameVi}</strong>, hãy hướng camera vào ảnh để con vật tự động bắt dính lên thẻ!
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  2
                </span>
                <span>
                  <strong>Cử chỉ chuẩn Apple AR:</strong> Dùng <strong>1 ngón tay kéo</strong> để di chuyển vị trí, <strong>2 ngón tay xoay</strong> để quay 360 độ, <strong>2 ngón chụm/mở</strong> để phóng to/thu nhỏ!
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-stone-950 text-[10px]">
                  3
                </span>
                <span>
                  <strong>Chạm tương tác sống động:</strong> Chạm trực tiếp vào con vật để nghe tiếng kêu đặc trưng và xem con vật nhún nhảy vui mừng!
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
              Đã Hiểu, Bắt Đầu Khám Phá
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
