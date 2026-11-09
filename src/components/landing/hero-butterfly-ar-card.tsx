"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Sparkles, Wand2, RotateCw, Eye } from "lucide-react";
import { HeroQrMatrixSwap } from "./hero-qr-matrix-swap";

interface HeroButterflyArCardProps {
  cardBeforeSrc?: string; // Ảnh thẻ 2D có hình bướm gốc
  cardAfterSrc?: string; // Ảnh phôi nền sạch không có bướm
  modelUrl?: string; // Mô hình bướm 3D animated GLB
}

export function HeroButterflyArCard({
  cardBeforeSrc = "/images/cards/butterfly-card-truoc.png",
  cardAfterSrc = "/images/cards/butterfly-card-sau.png",
  modelUrl = "/models/buom-animated.glb",
}: HeroButterflyArCardProps) {
  // Trạng thái: false = Thẻ 2D gốc, true = Đã biến hình AR 3D bướm vỗ cánh bay ra
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // References cho Three.js animation
  const butterflyGroupRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentScaleRef = useRef<number>(0);
  const targetScaleRef = useRef<number>(1);
  const is3DModeRef = useRef<boolean>(true);

  // Đồng bộ ref với state
  useEffect(() => {
    is3DModeRef.current = is3DMode;
  }, [is3DMode]);

  // Khởi tạo Three.js Scene cho mô hình bướm 3D vỗ cánh
  useEffect(() => {
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    const width = canvasContainer.clientWidth || 400;
    const height = canvasContainer.clientHeight || 570;

    // 1. Tạo Three.js Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 0, 3.2);

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
      renderer.toneMappingExposure = 1.1;
      canvasContainer.appendChild(renderer.domElement);
    } catch (e) {
      console.warn("[Three.js] Không thể khởi tạo WebGL renderer:", e);
      return;
    }

    // 2. Hệ thống ánh sáng ấm áp, rực rỡ tôn vinh màu sắc cánh bướm
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    mainLight.position.set(1.5, 3, 2.5);
    scene.add(mainLight);

    const softFillLight = new THREE.DirectionalLight(0xa5f3fc, 1.1);
    softFillLight.position.set(-2, 1.5, 1);
    scene.add(softFillLight);

    const goldenGlowLight = new THREE.DirectionalLight(0xfef08a, 1.4);
    goldenGlowLight.position.set(-0.2, 0.3, 1.2);
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

        // Tính toán kích thước để căn chỉnh vừa vặn với ô hoa trên thẻ
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const baseScale = 1.35 / (maxDim || 1);
        targetScaleRef.current = baseScale;

        // Bắt đầu từ tâm của con bướm 2D trong thẻ
        // (Vị trí con bướm trên thẻ nằm ở khoảng X: -0.25, Y: 0.18 trong không gian camera 3D)
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.set(-center.x * baseScale, -center.y * baseScale, -center.z * baseScale);
        model.scale.set(baseScale, baseScale, baseScale);

        group.position.set(-0.22, 0.16, 0.35); // Nổi lên trước mặt thẻ
        group.rotation.set(0.1, 0.15, -0.05); // Góc nghiêng tự nhiên
        group.add(model);

        // Kích hoạt animation Flutter (Vỗ cánh) sống động
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;

          // Ưu tiên clip Flutter, fallback clip đầu tiên
          const flutterClip =
            gltf.animations.find((a: { name: string }) =>
              /flutter|fly|wing|idle/i.test(a.name)
            ) || gltf.animations[0];
          const action = mixer.clipAction(flutterClip);
          action.play();
        }

        setIsModelLoaded(true);
      },
      undefined,
      (err) => {
        console.warn("[Three.js] Lỗi khi nạp mô hình buom-animated.glb:", err);
      }
    );

    // 4. Lắng nghe chuyển động chuột Parallax
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current = {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      };
    };

    const handleMouseLeave = () => {
      mousePos.current = { x: 0, y: 0 };
    };

    window.addEventListener("mousemove", handleMouseMove);
    canvasContainer.addEventListener("mouseleave", handleMouseLeave);

    // 5. Vòng lặp Render (Bay lượn hình sin + Chuyển đổi mượt Scale/Z)
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      const butterfly = butterflyGroupRef.current;
      if (butterfly) {
        const active = is3DModeRef.current;

        // Nội suy Scale mượt mà khi bật / tắt chế độ 3D
        const destScale = active ? 1 : 0.001;
        currentScaleRef.current = THREE.MathUtils.lerp(
          currentScaleRef.current,
          destScale,
          active ? 0.08 : 0.12
        );
        butterfly.scale.setScalar(currentScaleRef.current);

        // Bướm nhấp nhô bay lượn tự nhiên theo hàm sóng sin
        if (active && currentScaleRef.current > 0.05) {
          const hoverOffset = Math.sin(elapsed * 2.8) * 0.045;
          const swayOffset = Math.cos(elapsed * 1.6) * 0.035;

          butterfly.position.y = 0.16 + hoverOffset;
          butterfly.position.x = -0.22 + swayOffset;

          // Bay nổi hẳn ra khỏi mặt phẳng thẻ bài (Z-axis float)
          const targetZ = 0.38 + Math.sin(elapsed * 2.0) * 0.06;
          butterfly.position.z = THREE.MathUtils.lerp(butterfly.position.z, targetZ, 0.05);

          // Cánh bướm nghiêng góc mềm mại khi bay và liếc nhẹ theo chuột
          const targetRotX = 0.1 + Math.sin(elapsed * 2.8) * 0.08 - mousePos.current.y * 0.18;
          const targetRotY = 0.15 + Math.cos(elapsed * 1.6) * 0.12 + mousePos.current.x * 0.28;
          const targetRotZ = -0.05 + Math.sin(elapsed * 1.4) * 0.06;

          butterfly.rotation.x = THREE.MathUtils.lerp(butterfly.rotation.x, targetRotX, 0.06);
          butterfly.rotation.y = THREE.MathUtils.lerp(butterfly.rotation.y, targetRotY, 0.06);
          butterfly.rotation.z = THREE.MathUtils.lerp(butterfly.rotation.z, targetRotZ, 0.06);
        } else {
          butterfly.position.z = THREE.MathUtils.lerp(butterfly.position.z, -0.1, 0.1);
        }
      }

      // Parallax camera nhẹ nhàng
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, mousePos.current.x * 0.2, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, mousePos.current.y * 0.15, 0.05);
      camera.lookAt(0, 0.08, 0.1);

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 6. Dọn dẹp tài nguyên khi unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      canvasContainer.removeEventListener("mouseleave", handleMouseLeave);
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
    }, 1200);
  }, []);

  // Tự động chuyển đổi chu kỳ ma thuật: Thẻ 2D (5s) -> Bướm 3D vỗ cánh (7s) -> Lặp lại
  useEffect(() => {
    if (isHovered) return; // Dừng auto-loop nếu người dùng đang di chuột ngắm bướm

    const intervalTime = is3DMode ? 7500 : 5000;
    const timer = setTimeout(() => {
      triggerTransition();
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [is3DMode, isHovered, triggerTransition]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative aspect-[1063/1535] w-full max-w-[420px] overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-amber-100 to-amber-50 shadow-2xl shadow-amber-950/20 ring-4 ring-white/90 select-none transition-transform duration-300 hover:scale-[1.015]"
    >
      {/* 1. LỚP ẢNH DƯỚI: butterfly-card-sau.png (Phôi nền sạch KHÔNG CÓ BƯỚM) */}
      <div className="absolute inset-0 z-0">
        <Image
          src={cardAfterSrc}
          alt="Phôi sạch thẻ bài học tiếng Anh Butterfly Poly Cards"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 420px"
          className="object-cover"
        />
      </div>

      {/* 2. LỚP ẢNH TRÊN: butterfly-card-truoc.png (Thẻ 2D CÓ CON BƯỚM TRONG TRANH) */}
      <div
        className={`absolute inset-0 z-10 transition-opacity duration-1000 ease-in-out ${
          is3DMode ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <Image
          src={cardBeforeSrc}
          alt="Thẻ bài học tiếng Anh Butterfly Poly Cards 2D gốc"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 420px"
          className="object-cover"
        />
      </div>

      {/* 3. LỚP CANVASS THREE.JS 3D: Con bướm models/buom-animated.glb vỗ cánh bay ra */}
      <div
        ref={canvasContainerRef}
        className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-700 ${
          is3DMode ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 4. HIỆU ỨNG ÁNH SÁNG PHÉP THUẬT LÚC BIẾN HÌNH (Magical Transformation Glow & Sparkles) */}
      <div
        className={`pointer-events-none absolute inset-0 z-25 flex items-center justify-center transition-opacity duration-700 ${
          isTransforming ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Vòng hào quang bừng nở */}
        <div className="h-64 w-64 rounded-full bg-gradient-to-r from-amber-300/60 via-yellow-200/50 to-emerald-300/50 blur-2xl animate-ping" />
        <div className="absolute top-[40%] left-[38%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <Sparkles className="h-14 w-14 text-amber-300 animate-spin" style={{ animationDuration: "3s" }} />
        </div>
      </div>

      {/* 5. MÃ QR MATRIX SWAP GÓC DƯỚI BÊN TRÁI (Chuẩn kích thước ô vuông in thẻ) */}
      <HeroQrMatrixSwap
        left="6%"
        bottom="9.01%"
        width="24.8%"
        height="17.2%"
        href="/ar/butterfly"
      />

      {/* 6. NÚT HUY HIỆU TƯƠNG TÁC CHUYỂN ĐỔI CHẾ ĐỘ Ở GÓC TRÊN CÙNG BÊN PHẢI */}
      <div className="absolute top-3.5 right-3.5 z-30">
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

      {/* 7. BADGE CHỈ DẪN TRẢI NGHIỆM Ở ĐÁY THẺ */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-auto">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md border border-amber-400/30 shadow-md">
          <Sparkles className="h-3 w-3 text-amber-300" />
          <span>
            {is3DMode
              ? "Bướm 3D vỗ cánh bước ra từ thẻ bài"
              : "Thẻ vật lý 2D • Sắp biến hình AR"}
          </span>
        </span>
      </div>
    </div>
  );
}
