/**
 * Poly Cards - AR Gestures Hook (Pointer Events + 60FPS Damped Physics)
 * 
 * P0 & P1 Implementation:
 * 1. Pointer Events chuẩn (onPointerDown/Move/Up/Cancel, setPointerCapture), touch-action: none.
 * 2. KHÔNG gọi setState và KHÔNG gọi applyTransform trong move event.
 * 3. Nội suy Damping độc lập tốc độ khung hình (Frame-rate independent damping) trong render loop:
 *    current += (target - current) * (1 - Math.exp(-k * dt))
 * 4. 1 ngón vuốt = Xoay 360° có quán tính (Inertia decay).
 * 5. 1 ngón nhấn giữ ≥250ms vào model = Di chuyển (Pan 1:1 qua Raycast Unproject Plane).
 * 6. 2 ngón chụm/mở = Zoom 15% - 300% quanh tâm.
 * 7. Chạm nhanh trúng model = Raycast hit test (+15% bounding margin cho trẻ em).
 * 8. Chạm 2 lần vào vùng trống = Reset góc nhìn mượt mà (ease-out 350ms).
 */

import { useRef, useCallback, useEffect } from "react";

interface UseArGesturesOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pivotGroupRef: React.RefObject<any>;
  maxDimRef: React.RefObject<number>;
  cameraRef: React.RefObject<any>;
  onTapModel: () => void;
  onZoomChange?: (zoomPercent: number) => void;
  onDoubleTapEmpty?: () => void;
}

interface PointerInfo {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  hasMovedFar: boolean;
}

export function useArGestures({
  containerRef,
  pivotGroupRef,
  maxDimRef,
  cameraRef,
  onTapModel,
  onZoomChange,
  onDoubleTapEmpty,
}: UseArGesturesOptions) {
  // Trạng thái mục tiêu (Targets) và trạng thái hiện tại (Currents)
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const targetRotYRef = useRef<number>(0);
  const currentRotYRef = useRef<number>(0);

  const targetRotXRef = useRef<number>(0);
  const currentRotXRef = useRef<number>(0);

  const targetScaleRef = useRef<number>(1.0);
  const currentScaleRef = useRef<number>(1.0);

  // Quán tính xoay (Inertia)
  const rotVelocityYRef = useRef<number>(0);
  const lastMoveTimeRef = useRef<number>(0);
  const lastMoveDeltaXRef = useRef<number>(0);

  // Chế độ nhấn giữ để di chuyển (Long press drag)
  const isHoldingModelRef = useRef<boolean>(false);
  const holdLiftYRef = useRef<number>(0);
  const targetHoldLiftYRef = useRef<number>(0);
  const longPressTimerRef = useRef<any>(null);

  // Bộ quản lý đa điểm Pointer Map
  const pointersMapRef = useRef<Map<number, PointerInfo>>(new Map());

  // Khoảng cách và góc ban đầu của cử chỉ 2 ngón
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartScaleRef = useRef<number>(1.0);

  // Double tap detection
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Throttle cập nhật React state zoomPercent (<= 10 lần/giây và thay đổi >= 1%)
  const lastZoomPercentRef = useRef<number>(100);
  const lastZoomStateTimeRef = useRef<number>(0);

  // Pre-allocated Three.js objects tái sử dụng tuyệt đối trong render loop
  const threeRaycasterRef = useRef<any>(null);
  const threePlaneRef = useRef<any>(null);
  const threePlaneNormalRef = useRef<any>(null);
  const threeIntersectPointRef = useRef<any>(null);
  const threeRayOriginRef = useRef<any>(null);
  const threeModelWorldPosRef = useRef<any>(null);

  /**
   * Khởi tạo các helper toán học Three.js khi thư viện đã nạp
   */
  const ensureThreeHelpers = useCallback(() => {
    if (typeof window === "undefined" || !window.THREE) return null;
    const THREE = window.THREE;
    if (!threeRaycasterRef.current) {
      threeRaycasterRef.current = new THREE.Raycaster();
      threePlaneRef.current = new THREE.Plane();
      threePlaneNormalRef.current = new THREE.Vector3();
      threeIntersectPointRef.current = new THREE.Vector3();
      threeRayOriginRef.current = new THREE.Vector2();
      threeModelWorldPosRef.current = new THREE.Vector3();
    }
    return THREE;
  }, []);

  /**
   * Raycast Hit Test kiểm tra chạm trúng con vật (với margin nới rộng 15% cho trẻ em)
   */
  const hitTestModel = useCallback(
    (clientX: number, clientY: number): boolean => {
      const THREE = ensureThreeHelpers();
      const pivot = pivotGroupRef.current;
      const camera = cameraRef.current;
      if (!THREE || !pivot || !camera) return false;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return false;

      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

      threeRayOriginRef.current.set(ndcX, ndcY);
      threeRaycasterRef.current.setFromCamera(threeRayOriginRef.current, camera);

      // 1. Kiểm tra va chạm trực tiếp với các Mesh của model
      const intersects = threeRaycasterRef.current.intersectObject(pivot, true);
      if (intersects && intersects.length > 0) {
        return true;
      }

      // 2. Vùng đệm nới rộng 15% (Bounding Sphere) giúp trẻ nhỏ chạm dễ trúng
      const bbox = new THREE.Box3().setFromObject(pivot);
      if (!bbox.isEmpty()) {
        const sphere = new THREE.Sphere();
        bbox.getBoundingSphere(sphere);
        sphere.radius *= 1.2; // Nới rộng thêm 20%
        if (threeRaycasterRef.current.ray.intersectsSphere(sphere)) {
          return true;
        }
      }

      return false;
    },
    [cameraRef, containerRef, ensureThreeHelpers, pivotGroupRef]
  );

  /**
   * Tính toán dịch chuyển không gian 3D 1:1 qua Raycast Unproject Plane
   */
  const projectScreenDeltaTo3D = useCallback(
    (dxScreen: number, dyScreen: number): { dx: number; dy: number } => {
      const THREE = ensureThreeHelpers();
      const camera = cameraRef.current;
      const pivot = pivotGroupRef.current;
      if (!THREE || !camera || !pivot) {
        return { dx: dxScreen * 0.003, dy: -dyScreen * 0.003 };
      }

      // Lấy khoảng cách từ camera đến mô hình
      pivot.getWorldPosition(threeModelWorldPosRef.current);
      const dist = camera.position.distanceTo(threeModelWorldPosRef.current) || 1000;
      const vFOV = (camera.fov * Math.PI) / 180;
      const viewportHeight = 2 * Math.tan(vFOV / 2) * dist;
      const rect = containerRef.current?.getBoundingClientRect();
      const screenH = rect ? rect.height : window.innerHeight;

      const worldUnitsPerPixel = viewportHeight / screenH;
      return {
        dx: dxScreen * worldUnitsPerPixel,
        dy: -dyScreen * worldUnitsPerPixel,
      };
    },
    [cameraRef, containerRef, ensureThreeHelpers, pivotGroupRef]
  );

  /**
   * Pointer Down: Nhận diện điểm chạm, chuẩn bị Long-press và hit test
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Bắt pointer capture để không bị mất sự kiện khi ngón tay vượt ra ngoài mép
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}

      const now = performance.now();
      const pointer: PointerInfo = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        startTime: now,
        hasMovedFar: false,
      };

      pointersMapRef.current.set(e.pointerId, pointer);

      // Dừng quán tính xoay khi người dùng chạm tay vào màn hình
      rotVelocityYRef.current = 0;

      const activePointers = Array.from(pointersMapRef.current.values());

      if (activePointers.length === 1) {
        // Kiểm tra xem vị trí chạm có trúng mô hình 3D không
        const isHit = hitTestModel(e.clientX, e.clientY);

        // Hủy timer cũ nếu có
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        if (isHit) {
          // Bắt đầu đếm thời gian nhấn giữ 250ms để kích hoạt chế độ di chuyển (Pan)
          longPressTimerRef.current = setTimeout(() => {
            const currentP = pointersMapRef.current.get(e.pointerId);
            if (currentP && !currentP.hasMovedFar) {
              isHoldingModelRef.current = true;
              targetHoldLiftYRef.current = 0.04; // Nhấc mô hình lên nhẹ
              // Phản hồi rung haptic
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                try {
                  navigator.vibrate(10);
                } catch {}
              }
            }
          }, 250);
        }
      } else if (activePointers.length === 2) {
        // Hủy chế độ giữ nếu có thêm ngón tay thứ 2
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        isHoldingModelRef.current = false;
        targetHoldLiftYRef.current = 0;

        // Chuẩn bị cho Pinch Zoom
        const p1 = activePointers[0];
        const p2 = activePointers[1];
        pinchStartDistRef.current = Math.hypot(p1.currentX - p2.currentX, p1.currentY - p2.currentY);
        pinchStartScaleRef.current = targetScaleRef.current;
      }
    },
    [hitTestModel]
  );

  /**
   * Pointer Move: KHÔNG setState và KHÔNG applyTransform, chỉ cập nhật target refs
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointer = pointersMapRef.current.get(e.pointerId);
      if (!pointer) return;

      const prevX = pointer.currentX;
      const prevY = pointer.currentY;
      pointer.currentX = e.clientX;
      pointer.currentY = e.clientY;

      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;

      const totalDist = Math.hypot(e.clientX - pointer.startX, e.clientY - pointer.startY);
      if (totalDist > 8) {
        pointer.hasMovedFar = true;
        // Nếu người dùng vuốt nhanh trước 250ms, hủy chế độ nhấn giữ và chuyển sang xoay 360
        if (!isHoldingModelRef.current && longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }

      const activePointers = Array.from(pointersMapRef.current.values());

      if (activePointers.length === 1) {
        if (isHoldingModelRef.current || e.shiftKey || e.buttons === 2) {
          // 1 ngón đang nhấn giữ vào con vật (hoặc desktop Shift/chuột phải): Di chuyển 1:1 trong không gian
          const { dx: worldDx, dy: worldDy } = projectScreenDeltaTo3D(dx, dy);
          targetPosRef.current.x = Math.max(-1.8, Math.min(1.8, targetPosRef.current.x + worldDx));
          targetPosRef.current.y = Math.max(-1.8, Math.min(1.8, targetPosRef.current.y + worldDy));
        } else {
          // 1 ngón vuốt tự do: Xoay 360 quanh trục Y và nghiêng trục X (±35°)
          const rotSpeed = 0.009;
          targetRotYRef.current += dx * rotSpeed;

          // Giới hạn góc nghiêng dọc X trong khoảng ±35° (~±0.61 rad)
          const tiltLimit = 35 * (Math.PI / 180);
          targetRotXRef.current = Math.max(
            -tiltLimit,
            Math.min(tiltLimit, targetRotXRef.current + dy * (rotSpeed * 0.7))
          );

          // Đo tốc độ vuốt để tính quán tính xoay (Inertia)
          const now = performance.now();
          const dtMove = Math.max(1, now - lastMoveTimeRef.current);
          rotVelocityYRef.current = (dx * rotSpeed) / (dtMove / 1000); // rad / sec
          lastMoveTimeRef.current = now;
          lastMoveDeltaXRef.current = dx;
        }
      } else if (activePointers.length === 2) {
        // Cử chỉ 2 ngón tay:
        // A. Pinch to Zoom mượt mà từ 15% đến 300%
        const p1 = activePointers[0];
        const p2 = activePointers[1];
        const currentDist = Math.hypot(p1.currentX - p2.currentX, p1.currentY - p2.currentY);

        if (pinchStartDistRef.current > 0) {
          const factor = currentDist / pinchStartDistRef.current;
          const newScale = Math.max(0.15, Math.min(3.0, pinchStartScaleRef.current * factor));
          targetScaleRef.current = newScale;
        }

        // B. 2 ngón kéo cùng chiều: Di chuyển mô hình
        const avgDx = (dx + (p1.id === e.pointerId ? 0 : p2.currentX - prevX)) / 2;
        const avgDy = (dy + (p1.id === e.pointerId ? 0 : p2.currentY - prevY)) / 2;
        const { dx: worldDx, dy: worldDy } = projectScreenDeltaTo3D(avgDx, avgDy);
        targetPosRef.current.x = Math.max(-1.8, Math.min(1.8, targetPosRef.current.x + worldDx * 0.5));
        targetPosRef.current.y = Math.max(-1.8, Math.min(1.8, targetPosRef.current.y + worldDy * 0.5));
      }
    },
    [projectScreenDeltaTo3D]
  );

  /**
   * Pointer Up / Cancel: Kết thúc chạm, xử lý Tap, Double-Tap và thả tay
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointer = pointersMapRef.current.get(e.pointerId);
      const now = performance.now();

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (pointer) {
        const elapsed = now - pointer.startTime;
        const totalDist = Math.hypot(pointer.currentX - pointer.startX, pointer.currentY - pointer.startY);

        // Chạm nhanh (<250ms, di chuyển <8px)
        if (!pointer.hasMovedFar && totalDist < 8 && elapsed < 250) {
          const hit = hitTestModel(pointer.currentX, pointer.currentY);
          if (hit) {
            // Chạm trúng mô hình: Kích hoạt tương tác
            onTapModel();
          } else {
            // Chạm ra vùng trống: Kiểm tra Double-Tap để Reset góc nhìn
            const timeSinceLastTap = now - lastTapTimeRef.current;
            const distFromLastTap = Math.hypot(
              pointer.currentX - lastTapPosRef.current.x,
              pointer.currentY - lastTapPosRef.current.y
            );

            if (timeSinceLastTap < 320 && distFromLastTap < 25) {
              // Kích hoạt Reset mượt mà (350ms ease-out)
              targetPosRef.current = { x: 0, y: 0 };
              targetRotYRef.current = 0;
              targetRotXRef.current = 0;
              targetScaleRef.current = 1.0;
              rotVelocityYRef.current = 0;
              if (onDoubleTapEmpty) onDoubleTapEmpty();
            }

            lastTapTimeRef.current = now;
            lastTapPosRef.current = { x: pointer.currentX, y: pointer.currentY };
          }
        }
      }

      // Thả tay: Mô hình hạ xuống bình thường
      isHoldingModelRef.current = false;
      targetHoldLiftYRef.current = 0;

      pointersMapRef.current.delete(e.pointerId);

      if (pointersMapRef.current.size === 0) {
        pinchStartDistRef.current = 0;
      }
    },
    [hitTestModel, onDoubleTapEmpty, onTapModel]
  );

  /**
   * Wheel Zoom Native (với { passive: false })
   */
  const handleNativeWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    targetScaleRef.current = Math.max(0.15, Math.min(3.0, targetScaleRef.current + delta));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleNativeWheel);
    };
  }, [containerRef, handleNativeWheel]);

  /**
   * Reset tức thì toàn bộ góc nhìn và vị trí về 100%
   */
  const resetTransform = useCallback(() => {
    targetPosRef.current = { x: 0, y: 0 };
    targetRotYRef.current = 0;
    targetRotXRef.current = 0;
    targetScaleRef.current = 1.0;
    rotVelocityYRef.current = 0;
  }, []);

  /**
   * Đặt zoom tùy biến từ UI (+15% hoặc -15%)
   */
  const adjustZoom = useCallback((delta: number) => {
    targetScaleRef.current = Math.max(0.15, Math.min(3.0, targetScaleRef.current + delta));
  }, []);

  /**
   * VÒNG LẶP DAMPING VẬT LÝ ĐỘC LẬP TỐC ĐỘ KHUNG HÌNH (Frame-rate independent damping)
   * Được gọi mỗi frame trong renderer.setAnimationLoop
   */
  const updatePhysics = useCallback(
    (dt: number) => {
      const pivot = pivotGroupRef.current;
      if (!pivot) return;

      // 1. Quán tính xoay Y khi đã thả tay
      if (pointersMapRef.current.size === 0 && Math.abs(rotVelocityYRef.current) > 0.001) {
        targetRotYRef.current += rotVelocityYRef.current * dt;
        // Giảm dần quán tính: decay ~0.92 mỗi frame ở 60fps
        const decayFactor = Math.exp(-4.5 * dt);
        rotVelocityYRef.current *= decayFactor;
      }

      // Hệ số lò xo giảm chấn k
      const k = 14; // Damping responsiveness
      const alpha = 1 - Math.exp(-k * dt);

      // 2. Nội suy vị trí X, Y
      currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * alpha;
      currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * alpha;

      // 3. Nội suy góc xoay RotY, RotX
      currentRotYRef.current += (targetRotYRef.current - currentRotYRef.current) * alpha;
      currentRotXRef.current += (targetRotXRef.current - currentRotXRef.current) * alpha;

      // 4. Nội suy độ nhấc khi giữ (Hold lift)
      holdLiftYRef.current += (targetHoldLiftYRef.current - holdLiftYRef.current) * alpha;

      // 5. Nội suy tỉ lệ Scale
      currentScaleRef.current += (targetScaleRef.current - currentScaleRef.current) * alpha;

      // 6. Áp ma trận vào Pivot Group
      pivot.rotation.y = currentRotYRef.current;
      pivot.rotation.x = currentRotXRef.current;

      const baseDim = 0.34;
      const s = (baseDim / (maxDimRef.current || 1)) * currentScaleRef.current;
      pivot.scale.set(s, s, s);

      pivot.position.set(
        currentPosRef.current.x,
        currentPosRef.current.y + holdLiftYRef.current,
        0
      );

      // 7. Throttled update cho React state zoomPercent (<= 10 lần/s và đổi >= 1%)
      const now = performance.now();
      if (now - lastZoomStateTimeRef.current >= 100) {
        const roundedZoom = Math.round(currentScaleRef.current * 100);
        if (Math.abs(roundedZoom - lastZoomPercentRef.current) >= 1) {
          lastZoomPercentRef.current = roundedZoom;
          lastZoomStateTimeRef.current = now;
          if (onZoomChange) onZoomChange(roundedZoom);
        }
      }
    },
    [maxDimRef, onZoomChange, pivotGroupRef]
  );

  return {
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
    resetTransform,
    adjustZoom,
    updatePhysics,
    currentPosRef,
    targetScaleRef,
    isHoldingModelRef,
  };
}
