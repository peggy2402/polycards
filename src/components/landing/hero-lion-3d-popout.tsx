"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Sparkles, Eye, Maximize2 } from "lucide-react";

interface HeroLion3DPopoutProps {
  modelUrl?: string;
}

export function HeroLion3DPopout({ modelUrl = "/models/lion.glb" }: HeroLion3DPopoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [stagePhase, setStagePhase] = useState<"emerging" | "greeting" | "returning">("emerging");
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Chỉ chạy trên client browser có hỗ trợ WebGL
    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let lionRoot: THREE.Group | null = null;
    let shadowMesh: THREE.Mesh | null = null;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 500;

    // 1. Khởi tạo Three.js Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 3.2);

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
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn("WebGL not supported or context lost:", e);
      setLoadError(true);
      return;
    }

    // 2. Hệ Thống Ánh Sáng Studio Tự Nhiên
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.4);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa5f3fc, 1.2);
    rimLight.position.set(-2, 2, -1);
    scene.add(rimLight);

    // 3. Bóng Đổ Mềm Dưới Chân (Soft Shadow Blob)
    const shadowGeo = new THREE.PlaneGeometry(1.4, 0.8);
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
      grad.addColorStop(0, "rgba(20, 10, 5, 0.45)");
      grad.addColorStop(0.5, "rgba(20, 10, 5, 0.2)");
      grad.addColorStop(1, "rgba(20, 10, 5, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -0.68, 0);
    scene.add(shadowMesh);

    // 4. Tải Mô Hình 3D (Thử lion.glb, fallback sang polycards.glb)
    const loader = new GLTFLoader();

    const loadModel = (url: string, isFallback = false) => {
      loader.load(
        url,
        (gltf: any) => {
          const model = gltf.scene;
          lionRoot = model;

          // Tính toán bounding box để scale vừa vặn và canh giữa
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.3 / (maxDim || 1);
          model.scale.set(scale, scale, scale);

          // Căn chỉnh tâm chân chạm mặt sàn y = -0.68
          const center = new THREE.Vector3();
          box.getCenter(center);
          model.position.x = -center.x * scale;
          model.position.y = -box.min.y * scale - 0.68;
          model.position.z = -0.6; // Bắt đầu ở sâu trong thẻ bài

          scene.add(model);

          // Animation Mixer nếu tệp GLTF có sẵn chuyển động (Walk/Run/Idle)
          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            const walkClip =
              gltf.animations.find((a: any) =>
                /walk|run|move|step/i.test(a.name)
              ) || gltf.animations[0];
            const action = mixer.clipAction(walkClip);
            action.play();
          }

          setIsLoaded(true);
        },
        undefined,
        (err: any) => {
          if (!isFallback) {
            // Tự động fallback sang polycards.glb đã có sẵn trong project
            loadModel("/models/polycards.glb", true);
          } else {
            console.warn("Could not load 3D model for Hero popout:", err);
            setLoadError(true);
          }
        }
      );
    };

    loadModel(modelUrl);

    // 5. Lắng Nghe Chuột Parallax Tương Tác
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    };

    const handleMouseLeave = () => {
      mousePos.current = { x: 0, y: 0 };
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // 6. Vòng Lặp Render Chu Kỳ: Đi Ra -> Đứng Giao Lưu -> Quay Trở Lại Thẻ Bài
    const clock = new THREE.Clock();
    const cycleDuration = 9.0; // Mỗi chu kỳ 9 giây

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const t = elapsedTime % cycleDuration;

      if (mixer) {
        mixer.update(delta);
      }

      if (lionRoot) {
        // Giai đoạn 1: 0s -> 3.2s: Chú sư tử bước từ trong thẻ (z = -0.6) tiến ra ngoài (z = 0.85)
        if (t < 3.2) {
          const progress = t / 3.2;
          // Hàm easeOutCubic
          const ease = 1 - Math.pow(1 - progress, 3);
          lionRoot.position.z = -0.6 + ease * (0.85 - -0.6);
          // Hướng mặt thẳng ra phía trước
          lionRoot.rotation.y = THREE.MathUtils.lerp(lionRoot.rotation.y, 0, 0.1);
          setStagePhase("emerging");
        }
        // Giai đoạn 2: 3.2s -> 5.8s: Đứng ngoài thẻ bài, tương tác với bé, nhìn theo chuột
        else if (t < 5.8) {
          lionRoot.position.z = 0.85;
          // Nghiêng đầu / thân theo con trỏ chuột
          const targetRotY = mousePos.current.x * 0.45;
          const targetRotX = -mousePos.current.y * 0.2;
          lionRoot.rotation.y = THREE.MathUtils.lerp(lionRoot.rotation.y, targetRotY, 0.08);
          lionRoot.rotation.x = THREE.MathUtils.lerp(lionRoot.rotation.x, targetRotX, 0.08);

          // Nhịp thở nhẹ nhàng nếu không có animation
          if (!mixer) {
            lionRoot.position.y = -0.68 + Math.sin(elapsedTime * 3) * 0.02;
          }
          setStagePhase("greeting");
        }
        // Giai đoạn 3: 5.8s -> 8.5s: Bước lùi / đi dần trở lại vào trong mặt phẳng thẻ (z = 0.85 -> -0.6)
        else if (t < 8.5) {
          const progress = (t - 5.8) / 2.7;
          const ease = progress * progress * (3 - 2 * progress); // smoothstep
          lionRoot.position.z = 0.85 - ease * (0.85 - -0.6);
          // Quay nhẹ người khi đi vào
          lionRoot.rotation.y = THREE.MathUtils.lerp(lionRoot.rotation.y, Math.PI * 0.15, 0.06);
          lionRoot.rotation.x = THREE.MathUtils.lerp(lionRoot.rotation.x, 0, 0.1);
          setStagePhase("returning");
        }
        // Giai đoạn 4: 8.5s -> 9.0s: Nằm trong thẻ bài, chuẩn bị chu kỳ mới
        else {
          lionRoot.position.z = -0.6;
          lionRoot.rotation.y = THREE.MathUtils.lerp(lionRoot.rotation.y, 0, 0.2);
        }

        // Bước đi tự nhiên bằng procedural bobbing nếu model tĩnh không có clip mixer
        if (!mixer && (t < 3.2 || (t >= 5.8 && t < 8.5))) {
          lionRoot.position.y = -0.68 + Math.abs(Math.sin(elapsedTime * 6)) * 0.04;
          lionRoot.rotation.z = Math.sin(elapsedTime * 6) * 0.05;
        }

        // Cập nhật vị trí bóng đổ đồng bộ theo vị trí Z của mô hình
        if (shadowMesh) {
          shadowMesh.position.z = lionRoot.position.z;
          // Khi sư tử bước ra ngoài (z lớn hơn), bóng đổ to hơn và rõ nét hơn
          const shadowScale = THREE.MathUtils.mapLinear(lionRoot.position.z, -0.6, 0.85, 0.7, 1.2);
          shadowMesh.scale.set(shadowScale, shadowScale, 1);
          shadowMat.opacity = THREE.MathUtils.mapLinear(lionRoot.position.z, -0.6, 0.85, 0.2, 0.75);
        }
      }

      // Parallax camera nhẹ nhàng theo chuột
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, mousePos.current.x * 0.3, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.2 + mousePos.current.y * 0.2, 0.05);
      camera.lookAt(0, -0.1, 0.2);

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer?.dispose();
    };
  }, [modelUrl]);

  if (loadError) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute inset-0 z-30 cursor-grab active:cursor-grabbing overflow-visible select-none"
      title="Mô hình 3D tương tác bước ra khỏi thẻ bài (Dành riêng cho Desktop / Macbook)"
    >
      {/* Vòng Portal Ánh Sáng Huyền Ảo Lúc Bước Ra */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 rounded-full border-2 border-amber-300/60 bg-amber-400/10 blur-md transition-opacity duration-700 ${
          stagePhase === "emerging"
            ? "opacity-90 scale-110 animate-pulse"
            : stagePhase === "greeting"
            ? "opacity-30 scale-100"
            : "opacity-60 scale-95"
        }`}
      />

      {/* Huy Hiệu Trạng Thái 3D Pop-Out */}
      <div className="pointer-events-none absolute bottom-3 right-4 z-40">
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-900/85 px-2.5 py-1 text-[10px] font-black text-amber-300 backdrop-blur-md border border-amber-400/40 shadow-md">
          <Sparkles className="h-3 w-3 text-amber-400 animate-spin" style={{ animationDuration: "5s" }} />
          <span>
            {stagePhase === "emerging"
              ? "3D Bước Ra..."
              : stagePhase === "greeting"
              ? "3D Ngoài Không Gian Thẻ"
              : "3D Thu Vào Thẻ..."}
          </span>
        </span>
      </div>
    </div>
  );
}
