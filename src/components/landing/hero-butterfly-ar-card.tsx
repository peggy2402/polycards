"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Sparkles, Wand2, RotateCw } from "lucide-react";
import { HeroQrMatrixSwap } from "./hero-qr-matrix-swap";

// =========================================================================
// 🦋 CẤU HÌNH KÍCH THƯỚC CON BƯỚM 3D (TÙY CHỈNH TẠI ĐÂY)
// - Mặc định: 0.52 (Kích thước nhỏ nhắn, thanh thoát, cân đối hoàn hảo với thẻ bài)
// - Muốn bướm nhỏ hơn: chỉnh 0.42 - 0.48
// - Muốn bướm to hơn: chỉnh 0.60 - 0.70
// =========================================================================
export const BUTTERFLY_SCALE_MULTIPLIER = 0.52;

// Placeholders mờ siêu nhẹ (Base64 WebP) giúp thẻ hiển thị ngay tức thì, chống nhảy layout (Zero CLS)
const BLUR_SAU =
  "data:image/webp;base64,UklGRpwAAABXRUJQVlA4IJAAAADQAwCdASoQABcAPzmEuVOvKKWisAgB4CcJbAC1IUAAgaXqz7/UYIAA3ZAbvaFqauYEGgDWzZtNmPUQPBw0G1pRXHfnrYyazoxRqtfrZYS3u/sMbZAZ1jfwlfwB5jSZDmCYnnAHd0E29IC2EF6IxrYJBM0Pw2oI6bxej/xwH6RkXfH98Z6EW0cTsWKJPKyNeAA=";

const BLUR_TRUOC =
  "data:image/webp;base64,UklGRqAAAABXRUJQVlA4IJQAAADQAwCdASoQABcAPzmGuVOvKSWisAgB4CcJbACsMoAB5hf6fxOzUAAA3ZAbvaFqauMGtzBiAo1dj4XIEXGE4IKgvuqJep7DBkLzckX8POqp1/UoUj2vQBFCSJgPCKye6XRVCiFVn6JS200Vv6swWkvoBo5jcgr9+MIAgR03i9H+wAvW7x/j++WQSCK65GYlm35VfAAA=";

interface HeroButterflyArCardProps {
  cardBeforeSrc?: string; // Ảnh thẻ 2D có hình bướm gốc
  cardAfterSrc?: string; // Ảnh phôi nền sạch không có bướm
  modelUrl?: string; // Mô hình bướm 3D animated GLB
}

export function HeroButterflyArCard({
  cardBeforeSrc = "/images/cards/butterfly-card-truoc.webp",
  cardAfterSrc = "/images/cards/butterfly-card-sau.webp",
  modelUrl = "/models/buom-animated.glb",
}: HeroButterflyArCardProps) {
  // Trạng thái AR 3D: ban đầu bắt đầu ở chế độ Thẻ 2D chuẩn, sau đó tự động hóa thân mượt mà sang 3D
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const [flightPhaseText, setFlightPhaseText] = useState<string>("Bướm 3D vỗ cánh Flutter...");
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDraggingState, setIsDraggingState] = useState<boolean>(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // References cho Three.js
  const butterflyGroupRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const flutterActionRef = useRef<THREE.AnimationAction | null>(null);
  const butterflyMaterialsRef = useRef<any[]>([]);
  const currentOpacityRef = useRef<number>(1.0);
  const is3DModeRef = useRef<boolean>(true);

  // References tương tác Cầm Nắm & Tự Động Quay Về Hoa
  const isDraggingRef = useRef<boolean>(false);
  const isReturningRef = useRef<boolean>(false);
  const returnStartTimeRef = useRef<number>(0);
  const dragStartFromPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-0.20, 0.14, 0.15));
  const dragTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-0.20, 0.14, 0.45));
  const dragVelocityRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const lastClientPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragAutoReturnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerTransitionRef = useRef<() => void>(() => {});

  // References cho các khớp xương cánh để khuếch đại biên độ vỗ cánh cực mạnh
  const leftWing1Ref = useRef<any>(null);
  const leftWing2Ref = useRef<any>(null);
  const rightWing1Ref = useRef<any>(null);
  const rightWing2Ref = useRef<any>(null);

  // Đồng bộ ref với state
  useEffect(() => {
    is3DModeRef.current = is3DMode;
  }, [is3DMode]);

  // Khởi tạo Three.js Scene với Canvas nổi lên trên tất cả (z-index cực đại, không che khuất)
  useEffect(() => {
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    // Kích thước canvas mở rộng rộng rãi để bướm bay lượn thoải mái không bị cắt xén (Zero Clipping)
    const width = canvasContainer.clientWidth || 720;
    const height = canvasContainer.clientHeight || 850;

    // 1. Scene & Camera với góc nhìn Perspective tự nhiên, bao trọn không gian bay lượn
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 50);
    camera.position.set(0, 0.05, 3.6);

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      canvasContainer.appendChild(renderer.domElement);
    } catch (e) {
      console.warn("[Three.js] Không thể khởi tạo WebGL renderer:", e);
      return;
    }

    // 2. Hệ thống ánh sáng Studio ấm áp, rực rỡ, tôn vinh màu sắc đôi cánh
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 2.0);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffedd5, 2.4);
    mainLight.position.set(1.5, 3.5, 3);
    scene.add(mainLight);

    const softFillLight = new THREE.DirectionalLight(0xa5f3fc, 1.2);
    softFillLight.position.set(-2, 1.5, 1.5);
    scene.add(softFillLight);

    const goldenGlowLight = new THREE.DirectionalLight(0xfef08a, 1.6);
    goldenGlowLight.position.set(-0.2, 0.5, 2);
    scene.add(goldenGlowLight);

    // 3. Tải mô hình bướm buom-animated.glb
    const loader = new GLTFLoader();
    const group = new THREE.Group();
    butterflyGroupRef.current = group;
    scene.add(group);

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Bắt các khớp xương cánh để khuếch đại biên độ vỗ cánh cực đại
        model.traverse((child: any) => {
          if (child.name === "WL1") leftWing1Ref.current = child;
          if (child.name === "WL2") leftWing2Ref.current = child;
          if (child.name === "WR1") rightWing1Ref.current = child;
          if (child.name === "WR2") rightWing2Ref.current = child;
        });

        // Tính toán kích thước bướm nhỏ gọn, thanh tú theo BUTTERFLY_SCALE_MULTIPLIER
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);

        const baseScale = (BUTTERFLY_SCALE_MULTIPLIER * 1.0) / (maxDim || 1);

        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.set(-center.x * baseScale, -center.y * baseScale, -center.z * baseScale);
        model.scale.set(baseScale, baseScale, baseScale);

        // Bật transparency trực tiếp trên material gốc để không làm hỏng skinning shaders
        const originalMaterials: any[] = [];
        model.traverse((child: any) => {
          if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
              for (const m of child.material) {
                m.transparent = true;
                originalMaterials.push(m);
              }
            } else {
              child.material.transparent = true;
              originalMaterials.push(child.material);
            }
          }
        });
        butterflyMaterialsRef.current = originalMaterials;

        // Đặt vị trí xuất phát: Đúng ngay vị trí con bướm trên bông hoa trong tranh vẽ
        group.position.set(-0.20, 0.14, 0.15);

        // GÓC XOAY 3D ISOMETRIC CHUẨN (Nghiêng 3/4 Perspective như Don McCurdy viewer)
        group.rotation.set(0.28, 0.55, -0.06);
        group.add(model);

        // 4. KÍCH HOẠT CHÍNH XÁC DUY NHẤT ANIMATION "Flutter"
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;

          // Tìm chính xác animation clip "Flutter"
          const flutterClip =
            gltf.animations.find(
              (a: { name: string }) => a.name.toLowerCase() === "flutter"
            ) || gltf.animations[0];

          const action = mixer.clipAction(flutterClip);
          flutterActionRef.current = action;
          action.reset();
          action.timeScale = 2.4;
          action.play();
        }
      },
      undefined,
      (err) => {
        console.warn("[Three.js] Lỗi khi nạp mô hình buom-animated.glb:", err);
      }
    );

    // 5. Hệ thống Tương tác Cầm Nắm & Kéo Thả (Pointer Drag & Drop)
    const domElement = renderer.domElement;
    domElement.style.touchAction = "none";
    domElement.style.userSelect = "none";

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.40); // Mặt phẳng bướm bay z = 0.40

    const updatePointerNDC = (e: PointerEvent) => {
      const rect = domElement.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    const stopDraggingAndReturn = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDraggingState(false);
      if (dragAutoReturnTimerRef.current) {
        clearTimeout(dragAutoReturnTimerRef.current);
        dragAutoReturnTimerRef.current = null;
      }
      const b = butterflyGroupRef.current;
      if (b) {
        dragStartFromPosRef.current.copy(b.position);
      }
      isReturningRef.current = true;
      returnStartTimeRef.current = performance.now();
      setFlightPhaseText("Bướm 3D đang lượn cánh quay về bông hoa 🌸");
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!is3DModeRef.current) return;
      const b = butterflyGroupRef.current;
      if (!b) return;

      updatePointerNDC(e);
      raycaster.setFromCamera(pointerNDC, camera);

      // Bắt trúng con bướm trong bán kính tương tác
      const dist = raycaster.ray.distanceToPoint(b.position);
      if (dist < 0.65) {
        e.preventDefault();
        try {
          domElement.setPointerCapture(e.pointerId);
        } catch {}
        isDraggingRef.current = true;
        isReturningRef.current = false;
        setIsDraggingState(true);
        lastClientPosRef.current = { x: e.clientX, y: e.clientY };

        const intersect = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersect);
        if (intersect) {
          dragTargetPosRef.current.copy(intersect);
        }

        domElement.style.cursor = "grabbing";
        setFlightPhaseText("Bé đang cầm bướm 3D bay khắp nơi ✨");

        // Giới hạn thời gian cầm nắm tối đa 8.5s: tự động bay về hoa và chuyển về ảnh gốc
        if (dragAutoReturnTimerRef.current) clearTimeout(dragAutoReturnTimerRef.current);
        dragAutoReturnTimerRef.current = setTimeout(() => {
          stopDraggingAndReturn();
        }, 8500);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current = {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      };

      if (!is3DModeRef.current) return;
      const b = butterflyGroupRef.current;
      if (!b) return;

      updatePointerNDC(e);
      raycaster.setFromCamera(pointerNDC, camera);

      if (isDraggingRef.current) {
        const dx = e.clientX - lastClientPosRef.current.x;
        const dy = e.clientY - lastClientPosRef.current.y;
        lastClientPosRef.current = { x: e.clientX, y: e.clientY };

        dragVelocityRef.current.x = THREE.MathUtils.lerp(dragVelocityRef.current.x, dx * 0.008, 0.35);
        dragVelocityRef.current.y = THREE.MathUtils.lerp(dragVelocityRef.current.y, -dy * 0.008, 0.35);

        const intersect = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersect);
        if (intersect) {
          dragTargetPosRef.current.x = Math.max(-1.75, Math.min(1.75, intersect.x));
          dragTargetPosRef.current.y = Math.max(-1.15, Math.min(1.45, intersect.y));
          dragTargetPosRef.current.z = 0.45;
        }
      } else {
        const dist = raycaster.ray.distanceToPoint(b.position);
        domElement.style.cursor = dist < 0.65 ? "grab" : "default";
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        try {
          domElement.releasePointerCapture(e.pointerId);
        } catch {}
        domElement.style.cursor = "grab";
        stopDraggingAndReturn();
      }
    };

    domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // 6. Vòng lặp Render: Chạy animation "Flutter" + Quỹ đạo bay (Trái -> Phải -> Về hoa)
    let lastTime = performance.now();
    const startTime = lastTime;
    const flightCycle = 13.0; // Chu kỳ bay trọn vẹn 13 giây
    const yAxis = new THREE.Vector3(0, 1, 0);

    // Hàm nội suy mịn Hermite Smoothstep
    const smoothstep = (min: number, max: number, value: number) => {
      const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
      return x * x * (3 - 2 * x);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      // CẬP NHẬT ANIMATION "Flutter" TỪ TỆP GLB
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // =========================================================================
      // 🦋 KHUẾCH ĐẠI BIÊN ĐỘ VỖ CÁNH CỰC ĐẠI (LAYERED QUATERNION FLAPPING)
      // Nhân thêm góc xoay dao động 45 độ quanh trục Y trực tiếp lên các khớp xương
      // Đảm bảo đôi cánh đập phập phồng, mở rộng hết cỡ và khép lại cực kỳ mãnh liệt!
      // =========================================================================
      const flapFrequency = 16.0; // ~2.5 nhịp đập mỗi giây
      const flapAmplitude = 0.58; // Biên độ ~33 độ mỗi cánh (tổng góc quét ~66 độ)
      const flapCycle = Math.sin(elapsed * flapFrequency);

      const qFlapLeft = new (THREE as any).Quaternion().setFromAxisAngle(yAxis, flapCycle * flapAmplitude);
      const qFlapRight = new (THREE as any).Quaternion().setFromAxisAngle(yAxis, -flapCycle * flapAmplitude);
      const qTipLeft = new (THREE as any).Quaternion().setFromAxisAngle(yAxis, flapCycle * flapAmplitude * 0.4);
      const qTipRight = new (THREE as any).Quaternion().setFromAxisAngle(yAxis, -flapCycle * flapAmplitude * 0.4);

      if (leftWing1Ref.current) leftWing1Ref.current.quaternion.multiply(qFlapLeft);
      if (rightWing1Ref.current) rightWing1Ref.current.quaternion.multiply(qFlapRight);
      if (leftWing2Ref.current) leftWing2Ref.current.quaternion.multiply(qTipLeft);
      if (rightWing2Ref.current) rightWing2Ref.current.quaternion.multiply(qTipRight);

      const butterfly = butterflyGroupRef.current;
      if (butterfly) {
        const active = is3DModeRef.current;

        // HIỆU ỨNG BIẾN HÌNH MỜ MỊN (SMOOTH FADE-IN / FADE-OUT CROSS-DISSOLVE)
        const targetOpacity = active ? 1.0 : 0.0;
        currentOpacityRef.current = THREE.MathUtils.lerp(
          currentOpacityRef.current,
          targetOpacity,
          active ? 0.05 : 0.08
        );

        // Áp dụng opacity vào từng material của bướm
        if (butterflyMaterialsRef.current.length > 0) {
          for (const mat of butterflyMaterialsRef.current) {
            mat.opacity = currentOpacityRef.current;
            mat.visible = currentOpacityRef.current > 0.01;
          }
        }

        if (active && currentOpacityRef.current > 0.05) {
          if (isDraggingRef.current) {
            // =========================================================================
            // 1. TRẠNG THÁI ĐANG ĐƯỢC BÉ CẦM NẮM DI CHUYỂN KHẮP NƠI
            // =========================================================================
            butterfly.position.lerp(dragTargetPosRef.current, 0.22);

            const tiltRoll = THREE.MathUtils.clamp(-dragVelocityRef.current.x * 4.0, -0.7, 0.7);
            const tiltPitch = THREE.MathUtils.clamp(dragVelocityRef.current.y * 3.0, -0.5, 0.5);
            const targetRotY =
              dragVelocityRef.current.x > 0.003
                ? 0.75
                : dragVelocityRef.current.x < -0.003
                ? -0.65
                : 0.50;

            butterfly.rotation.x = THREE.MathUtils.lerp(butterfly.rotation.x, 0.28 + tiltPitch, 0.15);
            butterfly.rotation.y = THREE.MathUtils.lerp(butterfly.rotation.y, targetRotY, 0.15);
            butterfly.rotation.z = THREE.MathUtils.lerp(butterfly.rotation.z, tiltRoll, 0.15);

            if (flutterActionRef.current) {
              flutterActionRef.current.timeScale = 3.6; // Đập cánh phấn khích khi được cầm nắm
            }
          } else if (isReturningRef.current) {
            // =========================================================================
            // 2. TRẠNG THÁI LƯỢN CÁNH BAY VỀ LẠI CHỖ CŨ (BÔNG HOA) VÀ HÓA THÂN VỀ ẢNH GỐC
            // =========================================================================
            const timeSince = (now - returnStartTimeRef.current) / 1000;
            const returnDuration = 2.0; // Bay về êm ái trong 2 giây
            const progress = Math.min(timeSince / returnDuration, 1.0);
            const p = smoothstep(0, 1, progress);

            const start = dragStartFromPosRef.current;
            const targetX = THREE.MathUtils.lerp(start.x, -0.20, p);
            const targetY = THREE.MathUtils.lerp(start.y, 0.14, p) + Math.sin(p * Math.PI) * 0.18;
            const targetZ = THREE.MathUtils.lerp(start.z, 0.15, p);

            butterfly.position.set(targetX, targetY, targetZ);

            butterfly.rotation.x = THREE.MathUtils.lerp(butterfly.rotation.x, 0.28, 0.08);
            butterfly.rotation.y = THREE.MathUtils.lerp(butterfly.rotation.y, 0.55, 0.08);
            butterfly.rotation.z = THREE.MathUtils.lerp(butterfly.rotation.z, -0.06, 0.08);

            if (flutterActionRef.current) {
              flutterActionRef.current.timeScale = THREE.MathUtils.lerp(3.6, 2.4, p);
            }

            if (progress >= 1.0) {
              isReturningRef.current = false;
              setFlightPhaseText("Đậu lại trên hoa • Trở về thẻ 2D ban đầu");
              // Hết thời gian bay về -> Đậu lại trên hoa rồi chuyển về ảnh gốc ban đầu!
              setTimeout(() => {
                triggerTransitionRef.current();
              }, 400);
            }
          } else {
            // =========================================================================
            // 3. QUỸ ĐẠO TỰ NHIÊN (CHU KỲ 13 GIÂY)
            // =========================================================================
            if (flutterActionRef.current) {
              flutterActionRef.current.timeScale = 2.4;
            }

            // Chu kỳ bay lượn (từ 0s đến 13s)
            const t = elapsed % flightCycle;

            let targetX = -0.20;
            let targetY = 0.14;
            let targetZ = 0.15;
            // Góc nghiêng 3D Perspective để luôn nhìn thấy đôi cánh vỗ trục Y
            let targetRotX = 0.28;
            let targetRotY = 0.55;
            let targetRotZ = -0.06;

            // GIAI ĐOẠN 1: 0s -> 2.2s: Đậu tại hoa trên thẻ, vỗ cánh Flutter dập dờn và cất cánh
            if (t < 2.2) {
              const p = smoothstep(0, 2.2, t);
              targetX = -0.20 + Math.sin(t * 3) * 0.02;
              targetY = 0.14 + p * 0.16; // Bay nhấc lên khỏi mặt phẳng thẻ
              targetZ = 0.15 + p * 0.35; // Nổi ra ngoài không gian thực
              targetRotX = 0.28;
              targetRotY = 0.55;
              targetRotZ = -0.06;
            }
            // GIAI ĐOẠN 2: 2.2s -> 5.8s: BAY RA NGOÀI KHUNG THẺ BÊN TRÁI (Biên độ vừa vặn, ZERO CLIPPING)
            else if (t < 5.8) {
              const p = smoothstep(2.2, 5.8, t);
              // Bay từ -0.20 sang -0.48 (vượt ra ngoài mép viền bên trái thẻ bài ~60px, an toàn trong canvas)
              targetX = -0.20 - p * 0.28;
              targetY = 0.30 + Math.sin(p * Math.PI) * 0.12 + Math.sin(elapsed * 3.5) * 0.025;
              targetZ = 0.50 + Math.sin(elapsed * 2.0) * 0.04;

              // Nghiêng thân bướm hướng sang trái 35 độ (Yaw & Roll)
              targetRotY = -0.55; // Hướng sang trái
              targetRotZ = 0.20;  // Nghiêng cánh lượn
              targetRotX = 0.24;
            }
            // GIAI ĐOẠN 3: 5.8s -> 9.6s: LƯỢN VÒNG CUNG QUA ĐỈNH THẺ SANG BÊN PHẢI (ZERO CLIPPING)
            else if (t < 9.6) {
              const p = smoothstep(5.8, 9.6, t);
              // Bay từ -0.48 qua đỉnh thẻ sang +0.48 (vượt ra ngoài mép viền bên phải thẻ bài)
              targetX = -0.48 + p * 0.96;
              targetY = 0.30 + Math.sin(p * Math.PI) * 0.20 + Math.sin(elapsed * 3.5) * 0.025;
              targetZ = 0.50 - p * 0.08;

              // Nghiêng thân bướm hướng sang phải 35 độ
              targetRotY = 0.60;  // Hướng sang phải
              targetRotZ = -0.20; // Nghiêng cánh lượn
              targetRotX = 0.24;
            }
            // GIAI ĐOẠN 4: 9.6s -> 12.0s: LƯỢN CÁNH BAY TRỞ VỀ LẠI CHỖ CŨ TRÊN HOA
            else if (t < 12.0) {
              const p = smoothstep(9.6, 12.0, t);
              // Bay từ +0.48 trở về lại đúng vị trí -0.20 trên bông hoa
              targetX = 0.48 - p * 0.68;
              targetY = 0.26 - p * 0.12;
              targetZ = 0.42 - p * 0.27; // Hạ dần xuống mặt bông hoa

              // Chuyển dần về góc nghiêng 3D ban đầu
              targetRotY = THREE.MathUtils.lerp(0.60, 0.55, p);
              targetRotZ = THREE.MathUtils.lerp(-0.20, -0.06, p);
              targetRotX = 0.28;
            }
            // GIAI ĐOẠN 5: 12.0s -> 13.0s: ĐẬU ÊM ÁI TRÊN BÔNG HOA, VỖ CÁNH NHẸ NHÀNG
            else {
              targetX = -0.20;
              targetY = 0.14 + Math.sin(elapsed * 2.5) * 0.008;
              targetZ = 0.15;
              targetRotY = 0.55;
              targetRotZ = -0.06;
              targetRotX = 0.28;
            }

            // Cập nhật vị trí mượt mà không rung giật
            butterfly.position.x = THREE.MathUtils.lerp(butterfly.position.x, targetX, 0.08);
            butterfly.position.y = THREE.MathUtils.lerp(butterfly.position.y, targetY, 0.08);
            butterfly.position.z = THREE.MathUtils.lerp(butterfly.position.z, targetZ, 0.08);

            // Tương tác chuột Parallax tăng chiều sâu không gian
            const mouseTiltY = mousePos.current.x * 0.15;
            const mouseTiltX = -mousePos.current.y * 0.10;

            butterfly.rotation.x = THREE.MathUtils.lerp(butterfly.rotation.x, targetRotX + mouseTiltX, 0.06);
            butterfly.rotation.y = THREE.MathUtils.lerp(butterfly.rotation.y, targetRotY + mouseTiltY, 0.06);
            butterfly.rotation.z = THREE.MathUtils.lerp(butterfly.rotation.z, targetRotZ, 0.06);
          }
        }
      }

      // Parallax camera nhẹ nhàng
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, mousePos.current.x * 0.15, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.05 + mousePos.current.y * 0.10, 0.04);
      camera.lookAt(0, 0.12, 0.1);

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 7. Dọn dẹp tài nguyên khi unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      if (dragAutoReturnTimerRef.current) {
        clearTimeout(dragAutoReturnTimerRef.current);
      }
      if (renderer && renderer.domElement && canvasContainer.contains(renderer.domElement)) {
        canvasContainer.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer?.dispose();
    };
  }, [modelUrl]);

  // Kích hoạt hiệu ứng chuyển cảnh mượt mà
  const triggerTransition = useCallback(() => {
    setIsTransforming(true);
    setIs3DMode((prev) => !prev);
    setTimeout(() => {
      setIsTransforming(false);
    }, 1500);
  }, []);

  // Đồng bộ triggerTransition vào ref để Three.js có thể kích hoạt khi bướm bay về đích
  useEffect(() => {
    triggerTransitionRef.current = triggerTransition;
  }, [triggerTransition]);

  // Cập nhật text trạng thái theo chu kỳ
  useEffect(() => {
    if (!is3DMode) {
      setFlightPhaseText("Thẻ 2D nguyên bản • Sắp cất cánh");
      return;
    }
    if (isDraggingState) {
      return;
    }
    const interval = setInterval(() => {
      if (isDraggingRef.current || isReturningRef.current) return;
      const sec = (Date.now() / 1000) % 13.0;
      if (sec < 2.2) setFlightPhaseText("Bướm 3D vỗ cánh • Chạm giữ để kéo khắp nơi ✨");
      else if (sec < 5.8) setFlightPhaseText("Bướm 3D bay lượn ra ngoài bên trái 🦋");
      else if (sec < 9.6) setFlightPhaseText("Bướm 3D bay vắt ngang sang bên phải ✨");
      else if (sec < 12.0) setFlightPhaseText("Bướm 3D lượn cánh quay về chỗ cũ 🌸");
      else setFlightPhaseText("Bướm 3D đậu êm ái trên bông hoa");
    }, 800);
    return () => clearInterval(interval);
  }, [is3DMode, isDraggingState]);

  // Tự động chuyển đổi chu kỳ ma thuật: Thẻ 2D (5.5s) -> Bướm 3D bay lượn (16s) -> Lặp lại
  useEffect(() => {
    if (isHovered || isDraggingState) return; // Dừng auto-loop nếu người dùng đang di chuột hoặc đang cầm nắm bướm

    const intervalTime = is3DMode ? 16000 : 5500;
    const timer = setTimeout(() => {
      triggerTransition();
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [is3DMode, isHovered, isDraggingState, triggerTransition]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full max-w-[420px] select-none"
    >
      {/* KHUNG THẺ VẬT LÝ BO GÓC CAO CẤP (Chứa 2 lớp ảnh thẻ 1063x1535 và mã QR, bo góc và đổ bóng) */}
      <div className="relative aspect-[1063/1535] w-full overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-amber-100 to-amber-50 shadow-2xl shadow-amber-950/20 ring-4 ring-white/90 transition-transform duration-300 hover:scale-[1.015]">
        {/* 1. LỚP ẢNH DƯỚI: butterfly-card-sau.webp (Phôi nền sạch KHÔNG CÓ BƯỚM - Tối ưu 188KB) */}
        <div className="absolute inset-0 z-0">
          <Image
            src={cardAfterSrc}
            alt="Phôi sạch thẻ bài học tiếng Anh Butterfly Poly Cards"
            fill
            priority
            placeholder="blur"
            blurDataURL={BLUR_SAU}
            sizes="(max-width: 640px) 100vw, 420px"
            className="object-cover"
          />
        </div>

        {/* 2. LỚP ẢNH TRÊN: butterfly-card-truoc.webp (Thẻ 2D CÓ CON BƯỚM TRONG TRANH - Tối ưu 206KB) */}
        {/* Hiệu ứng chuyển cảnh mờ dần cực kỳ êm dịu (duration-1500 ease-in-out) */}
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-1500 ease-in-out ${
            is3DMode ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <Image
            src={cardBeforeSrc}
            alt="Thẻ bài học tiếng Anh Butterfly Poly Cards 2D gốc"
            fill
            priority
            placeholder="blur"
            blurDataURL={BLUR_TRUOC}
            sizes="(max-width: 640px) 100vw, 420px"
            className="object-cover"
          />
        </div>

        {/* 3. HIỆU ỨNG ÁNH SÁNG PHÉP THUẬT LÚC BIẾN HÌNH (Magical Transformation Glow & Sparkles) */}
        <div
          className={`pointer-events-none absolute inset-0 z-15 flex items-center justify-center transition-opacity duration-1000 ${
            isTransforming ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="h-64 w-64 rounded-full bg-gradient-to-r from-amber-300/50 via-yellow-200/40 to-emerald-300/40 blur-3xl animate-pulse" />
          <div className="absolute top-[38%] left-[36%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <Sparkles className="h-14 w-14 text-amber-300 animate-spin" style={{ animationDuration: "4s" }} />
          </div>
        </div>

        {/* 4. MÃ QR MATRIX SWAP GÓC DƯỚI BÊN TRÁI (Chuẩn kích thước ô vuông in thẻ) */}
        <div className="relative z-60 pointer-events-auto">
          <HeroQrMatrixSwap
            left="6.4%"
            bottom="12.5%"
            width="24%"
            height="15%"
            href="/ar/butterfly"
          />
        </div>

        {/* 5. NÚT HUY HIỆU TƯƠNG TÁC CHUYỂN ĐỔI CHẾ ĐỘ Ở GÓC TRÊN CÙNG BÊN PHẢI */}
        <div className="absolute top-3.5 right-3.5 z-60 pointer-events-auto">
          <button
            type="button"
            onClick={triggerTransition}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black shadow-lg backdrop-blur-md ring-2 ring-white/90 transition-all active:scale-95 cursor-pointer ${
              is3DMode
                ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-emerald-600/30 hover:brightness-110"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-600/30 hover:brightness-110 animate-bounce"
            }`}
            title="Bấm để chuyển đổi giữa Thẻ 2D và Mô hình AR 3D bay ra"
          >
            {is3DMode ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin text-amber-200" style={{ animationDuration: "5s" }} />
                <span>3D AR Đang Vỗ Cánh</span>
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5 text-amber-200 animate-pulse" />
                <span>Chạm Hóa Thân 3D AR</span>
              </>
            )}
          </button>
        </div>

        {/* 6. BADGE CHỈ DẪN TRẢI NGHIỆM Ở ĐÁY THẺ */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/85 px-3 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md border border-amber-400/30 shadow-md whitespace-nowrap">
            <Sparkles className="h-3 w-3 text-amber-300 shrink-0" />
            <span>{flightPhaseText}</span>
          </span>
        </div>
      </div>

      {/* 7. LỚP CANVAS THREE.JS 3D NỔI LÊN TRÊN TẤT CẢ (Z-INDEX CỰC ĐẠI z-50 / OVERFLOW VISIBLE) */}
      {/* Mở rộng biên độ sang hai bên 192px (-left-48 -right-48) để không bao giờ bị cắt xén cánh (ZERO CLIPPING) */}
      <div
        ref={canvasContainerRef}
        className={`absolute -left-48 -right-48 -top-28 -bottom-24 z-50 overflow-visible transition-opacity duration-1000 ${
          is3DMode ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
    </div>
  );
}
