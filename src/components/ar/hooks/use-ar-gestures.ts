/**
 * Poly Cards - AR Gestures Hook (Pointer Events + 60FPS Damped Physics + State Machine)
 * 
 * Hoàn thiện theo toàn bộ tài liệu hướng dẫn:
 * - docs/fix_cu_chi/files/00-README.md
 * - docs/fix_cu_chi/files/02b-gestures-rewrite.md
 * - docs/fix_cu_chi/files/02c-gestures-in-free-modes.md
 * - docs/fix_cu_chi/files/03-orbit-sphere-math.md
 * 
 * Quy tắc kỹ thuật bắt buộc:
 * 1. Máy trạng thái: IDLE | ONE_PENDING | ROTATE | HOLD | TWO | DONE.
 * 2. Tách bạch 2 không gian cử chỉ qua gestureSpaceRef: "tracking" (bám thẻ 6DoF) vs "free" (không bám thẻ / Gyro).
 * 3. Pan 1:1 trong "free" được lưu riêng tại panCamRef / panCamCurrentRef để component cộng vào P_screen (không cộng vào O_local).
 * 4. Xoay trong "free" quy đổi: pivot.quaternion = Qd⁻¹ · Qscreen · Qd (với Qd = anchorQuatRef).
 * 5. Hai ngón chạm nhanh vào vùng trống (<300ms, sync <150ms, dist đổi <10%, delta <12px) = Reset góc nhìn.
 * 6. Khi nhấc 1 ngón trong TWO -> DONE ngay lập tức, ngăn ngón thứ 2 giật xoay đột ngột.
 * 7. Tuyệt đối không new Vector3/Box3/Sphere/Quaternion trong pointermove và updatePhysics.
 * 8. Không setState trong move event.
 */

import { useRef, useCallback, useEffect } from "react";

export const GESTURE = {
  SLOP_PX: 8,
  HOLD_MS: 280,
  TAP_MAX_MS: 300,
  TAP_MAX_MOVE_PX: 12,
  TWO_TAP_MAX_MS: 300,
  TWO_TAP_SYNC_MS: 150,
  TWO_TAP_MAX_DIST_CHANGE: 0.10,
  DOUBLE_TAP_MS: 320,
  DOUBLE_TAP_DIST_PX: 25,
  SCALE_MIN: 0.2,
  SCALE_MAX: 3.0,
  ROT_YAW_PER_PX: 0.009,
  ROT_PITCH_PER_PX: 0.007,
  PITCH_LIMIT_DEG: 80,
} as const;

export type GestureState = "IDLE" | "ONE_PENDING" | "ROTATE" | "HOLD" | "TWO" | "DONE";

interface UseArGesturesOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pivotGroupRef: React.RefObject<any>;
  maxDimRef: React.RefObject<number>;
  halfHRef?: React.RefObject<number>;
  cameraRef: React.RefObject<any>;
  gestureSpaceRef?: React.RefObject<"tracking" | "free">;
  anchorQuatRef?: React.RefObject<any>;
  onTapModel: () => void;
  onZoomChange?: (zoomPercent: number) => void;
  onDoubleTapEmpty?: () => void;
  onResetGesture?: () => void;
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
  halfHRef,
  cameraRef,
  gestureSpaceRef,
  anchorQuatRef,
  onTapModel,
  onZoomChange,
  onDoubleTapEmpty,
  onResetGesture,
}: UseArGesturesOptions) {
  // Máy trạng thái (State Machine)
  const stateRef = useRef<GestureState>("IDLE");
  const holdTimerRef = useRef<any>(null);

  // Bộ quản lý đa điểm Pointer Map
  const pointersMapRef = useRef<Map<number, PointerInfo>>(new Map());

  // 1. Dịch chuyển trong không gian "tracking" (mặt phẳng thẻ bài)
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 2. Dịch chuyển trong không gian "free" (mặt phẳng camera screen)
  const targetPanCamRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPanCamRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3. Góc xoay của người dùng (tính chung bằng rad)
  const targetRotYRef = useRef<number>(0);
  const currentRotYRef = useRef<number>(0);

  const targetRotXRef = useRef<number>(0);
  const currentRotXRef = useRef<number>(0);

  // 4. Kích thước (Scale)
  const targetScaleRef = useRef<number>(1.0);
  const currentScaleRef = useRef<number>(1.0);

  // 5. Độ nhấc khi nhấn giữ mô hình (Hold lift)
  const holdLiftYRef = useRef<number>(0);
  const targetHoldLiftYRef = useRef<number>(0);
  const isHoldingModelRef = useRef<boolean>(false);
  const touchStartedOnModelRef = useRef<boolean>(false);

  // 6. Quán tính xoay Y (EMA ~80ms)
  const rotVelocityYRef = useRef<number>(0);
  const emaVelocityYRef = useRef<number>(0);
  const lastMoveTimeRef = useRef<number>(0);

  // 7. Cử chỉ 2 ngón tay
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartScaleRef = useRef<number>(1.0);
  const twoFingersStartCentroidRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const twoFingersLastCentroidRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const twoFingersDownTimeRef = useRef<number>(0);
  const pointer1DownTimeRef = useRef<number>(0);
  const pointer2DownTimeRef = useRef<number>(0);

  // 8. Double tap 1 ngón vùng trống
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 9. Throttle cập nhật React state zoomPercent (<= 10 lần/s và thay đổi >= 1%)
  const lastZoomPercentRef = useRef<number>(100);
  const lastZoomStateTimeRef = useRef<number>(0);

  // Pre-allocated Three.js objects cố định (không cấp phát trong event/render loop)
  const threeRaycasterRef = useRef<any>(null);
  const threeRayOriginRef = useRef<any>(null);
  const threeBox3Ref = useRef<any>(null);
  const threeSphereRef = useRef<any>(null);
  const threeVecCRef = useRef<any>(null);
  const threeVecRcRef = useRef<any>(null);
  const threeEulerRef = useRef<any>(null);
  const threeQuatRef = useRef<any>(null);
  const threeQuatQdInvRef = useRef<any>(null);
  const threeQuatQScreenRef = useRef<any>(null);
  const threeDeltaWorldVecRef = useRef<any>(null);
  const threeDisplayRootRotInvRef = useRef<any>(null);

  /**
   * Khởi tạo các helper toán học Three.js một lần duy nhất
   */
  const ensureThreeHelpers = useCallback(() => {
    if (typeof window === "undefined" || !window.THREE) return null;
    const THREE = window.THREE;
    if (!threeRaycasterRef.current) {
      threeRaycasterRef.current = new THREE.Raycaster();
      threeRayOriginRef.current = new THREE.Vector2();
      threeBox3Ref.current = new THREE.Box3();
      threeSphereRef.current = new THREE.Sphere();
      threeVecCRef.current = new THREE.Vector3();
      threeVecRcRef.current = new THREE.Vector3();
      threeEulerRef.current = new THREE.Euler(0, 0, 0, "YXZ");
      threeQuatRef.current = new THREE.Quaternion();
      threeQuatQdInvRef.current = new THREE.Quaternion();
      threeQuatQScreenRef.current = new THREE.Quaternion();
      threeDeltaWorldVecRef.current = new THREE.Vector3();
      threeDisplayRootRotInvRef.current = new THREE.Quaternion();
    }
    return THREE;
  }, []);

  /**
   * Hit Test kiểm tra chạm trúng mô hình 3D (Mesh thực tế + vùng đệm 10% bounding sphere cho trẻ nhỏ)
   */
  const hitTestModel = useCallback(
    (clientX: number, clientY: number): boolean => {
      const THREE = ensureThreeHelpers();
      const pivot = pivotGroupRef.current;
      const camera = cameraRef.current;
      if (!THREE || !pivot || !camera) return false;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return false;

      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

      threeRayOriginRef.current.set(ndcX, ndcY);
      threeRaycasterRef.current.setFromCamera(threeRayOriginRef.current, camera);

      // Cập nhật ma trận thế giới của model để hit-test chuẩn xác theo pose mới nhất
      pivot.updateMatrixWorld(true);

      // 1. Kiểm tra va chạm trực tiếp với các Mesh của model
      const intersects = threeRaycasterRef.current.intersectObject(pivot, true);
      if (intersects && intersects.length > 0) {
        return true;
      }

      // 2. Vùng đệm 10% Bounding Sphere quanh mô hình (hỗ trợ trẻ nhỏ bấm dễ trúng)
      if (threeBox3Ref.current && threeSphereRef.current) {
        threeBox3Ref.current.setFromObject(pivot);
        if (!threeBox3Ref.current.isEmpty()) {
          threeBox3Ref.current.getBoundingSphere(threeSphereRef.current);
          threeSphereRef.current.radius *= 1.1; // Nới rộng đúng 10% theo prompt 2b
          if (threeRaycasterRef.current.ray.intersectsSphere(threeSphereRef.current)) {
            return true;
          }
        }
      }

      return false;
    },
    [cameraRef, containerRef, ensureThreeHelpers, pivotGroupRef]
  );

  /**
   * Tính toán độ dịch chuyển 1:1 trong không gian Camera Screen Plane
   * depth = khoảng cách từ camera đến tâm model (mặc định ~2.0 hoặc freeArDist)
   */
  const computeCameraScreenDelta = useCallback(
    (dxPx: number, dyPx: number): { dxCam: number; dyCam: number; halfW: number; halfH: number } => {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || window.innerWidth || 800;
      const h = rect?.height || window.innerHeight || 600;

      const camera = cameraRef.current;
      const fovDeg = camera?.fov || 50;
      const fovRad = (fovDeg * Math.PI) / 180;
      const aspect = w / h;

      // Khoảng cách xấp xỉ từ camera tới tâm model
      const depth = 2.0;
      const halfH = depth * Math.tan(fovRad / 2);
      const halfW = halfH * aspect;

      const dxCam = (dxPx / w) * 2 * halfW;
      const dyCam = (-dyPx / h) * 2 * halfH;

      return { dxCam, dyCam, halfW, halfH };
    },
    [cameraRef, containerRef]
  );

  /**
   * Kích hoạt Reset toàn diện
   */
  const triggerResetAll = useCallback(() => {
    targetPosRef.current = { x: 0, y: 0 };
    targetPanCamRef.current = { x: 0, y: 0 };
    targetRotYRef.current = 0;
    targetRotXRef.current = 0;
    targetScaleRef.current = 1.0;
    rotVelocityYRef.current = 0;
    emaVelocityYRef.current = 0;
    targetHoldLiftYRef.current = 0;
    isHoldingModelRef.current = false;
    touchStartedOnModelRef.current = false;

    if (onResetGesture) {
      onResetGesture();
    } else if (onDoubleTapEmpty) {
      onDoubleTapEmpty();
    }
  }, [onDoubleTapEmpty, onResetGesture]);

  /**
   * Pointer Down: Khởi tạo cử chỉ theo State Machine
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Triệt tiêu tap-to-pause HUD của iOS Safari WebKit trên phần tử video camera
      if (e.cancelable) {
        e.preventDefault();
      }
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
      const pointerCount = pointersMapRef.current.size;

      // Dừng quán tính xoay khi có ngón tay chạm màn hình
      rotVelocityYRef.current = 0;
      emaVelocityYRef.current = 0;
      lastMoveTimeRef.current = now;

      if (pointerCount === 1) {
        // Ngón đầu tiên: Vào trạng thái ONE_PENDING
        stateRef.current = "ONE_PENDING";
        pointer1DownTimeRef.current = now;

        const isHit = hitTestModel(e.clientX, e.clientY);
        touchStartedOnModelRef.current = isHit;

        // Xóa timer nhấn giữ cũ nếu có
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }

        if (isHit) {
          // Nhấn vào model: Bắt đầu đếm giờ 280ms để xác định HOLD hay ROTATE
          holdTimerRef.current = setTimeout(() => {
            if (stateRef.current === "ONE_PENDING") {
              stateRef.current = "HOLD";
              isHoldingModelRef.current = true;
              targetHoldLiftYRef.current = 0.035; // Nhấc mô hình lên báo hiệu đang giữ
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                try {
                  navigator.vibrate(10);
                } catch {}
              }
            }
          }, GESTURE.HOLD_MS);
        } else {
          isHoldingModelRef.current = false;
          targetHoldLiftYRef.current = 0;
        }
      } else if (pointerCount >= 2) {
        // Ngón thứ 2 chạm xuống ở BẤT KỲ trạng thái nào: Chuyển ngay sang TWO
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }

        isHoldingModelRef.current = false;
        targetHoldLiftYRef.current = 0;
        stateRef.current = "TWO";

        const pointers = Array.from(pointersMapRef.current.values());
        const p1 = pointers[0];
        const p2 = pointers[1];

        pointer2DownTimeRef.current = now;
        twoFingersDownTimeRef.current = now;

        pinchStartDistRef.current = Math.hypot(p1.currentX - p2.currentX, p1.currentY - p2.currentY);
        pinchStartScaleRef.current = targetScaleRef.current;

        const cx = (p1.currentX + p2.currentX) / 2;
        const cy = (p1.currentY + p2.currentY) / 2;
        twoFingersStartCentroidRef.current = { x: cx, y: cy };
        twoFingersLastCentroidRef.current = { x: cx, y: cy };
      }
    },
    [hitTestModel]
  );

  /**
   * Pointer Move: KHÔNG setState và KHÔNG applyTransform, tính toán mượt mà theo State Machine
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
      const totalMoved = Math.hypot(e.clientX - pointer.startX, e.clientY - pointer.startY);

      if (totalMoved > GESTURE.SLOP_PX) {
        pointer.hasMovedFar = true;
      }

      const now = performance.now();
      const pointerCount = pointersMapRef.current.size;

      // 1. Xử lý trạng thái ONE_PENDING: Nếu di chuyển vượt quá ngưỡng trượt SLOP_PX -> Chuyển thành ROTATE
      if (stateRef.current === "ONE_PENDING" && pointerCount === 1) {
        if (totalMoved > GESTURE.SLOP_PX) {
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
          }
          stateRef.current = "ROTATE";
        }
      }

      // 2. Trạng thái ROTATE: 1 ngón vuốt xoay mô hình (bắt đầu trên model hay vùng trống đều xoay mượt)
      if (stateRef.current === "ROTATE" && pointerCount === 1) {
        targetRotYRef.current += dx * GESTURE.ROT_YAW_PER_PX;

        const pitchLimitRad = (GESTURE.PITCH_LIMIT_DEG * Math.PI) / 180;
        targetRotXRef.current = Math.max(
          -pitchLimitRad,
          Math.min(pitchLimitRad, targetRotXRef.current + dy * GESTURE.ROT_PITCH_PER_PX)
        );

        // Đo vận tốc tức thời và lọc trung bình trượt EMA (~80ms)
        const dtMove = Math.max(0.001, (now - lastMoveTimeRef.current) / 1000);
        const instVelY = (dx * GESTURE.ROT_YAW_PER_PX) / dtMove;
        const emaAlpha = Math.min(1.0, dtMove / 0.08);
        emaVelocityYRef.current += emaAlpha * (instVelY - emaVelocityYRef.current);
        lastMoveTimeRef.current = now;
      }

      // 3. Trạng thái HOLD: Nhấn giữ ≥280ms và kéo để di chuyển 1:1
      if (stateRef.current === "HOLD" && pointerCount === 1) {
        const { dxCam, dyCam, halfW, halfH } = computeCameraScreenDelta(dx, dy);

        if (gestureSpaceRef?.current === "free") {
          // Không gian "free": Tích lũy vào panCamRef (mặt phẳng camera)
          targetPanCamRef.current.x = Math.max(-0.9 * halfW, Math.min(0.9 * halfW, targetPanCamRef.current.x + dxCam));
          targetPanCamRef.current.y = Math.max(-0.9 * halfH, Math.min(0.9 * halfH, targetPanCamRef.current.y + dyCam));
        } else {
          // Không gian "tracking": Tích lũy vào targetPosRef (mặt phẳng thẻ bài)
          const THREE = ensureThreeHelpers();
          const camera = cameraRef.current;
          const pivot = pivotGroupRef.current;
          if (THREE && camera && pivot?.parent) {
            threeDeltaWorldVecRef.current.set(dxCam, dyCam, 0).applyQuaternion(camera.quaternion);
            pivot.parent.getWorldQuaternion(threeDisplayRootRotInvRef.current).invert();
            threeDeltaWorldVecRef.current.applyQuaternion(threeDisplayRootRotInvRef.current);
            targetPosRef.current.x = Math.max(-0.8, Math.min(0.8, targetPosRef.current.x + threeDeltaWorldVecRef.current.x));
            targetPosRef.current.y = Math.max(-0.8, Math.min(0.8, targetPosRef.current.y + threeDeltaWorldVecRef.current.y));
          } else {
            targetPosRef.current.x = Math.max(-0.8, Math.min(0.8, targetPosRef.current.x + dxCam));
            targetPosRef.current.y = Math.max(-0.8, Math.min(0.8, targetPosRef.current.y + dyCam));
          }
        }
      }

      // 4. Trạng thái TWO: Hai ngón vừa Pan theo trọng tâm (centroid), vừa Pinch Zoom
      if (stateRef.current === "TWO" && pointerCount >= 2) {
        const pointers = Array.from(pointersMapRef.current.values());
        const p1 = pointers[0];
        const p2 = pointers[1];

        // 4.1. Pan theo trọng tâm
        const currentCentroidX = (p1.currentX + p2.currentX) / 2;
        const currentCentroidY = (p1.currentY + p2.currentY) / 2;
        const dCentroidX = currentCentroidX - twoFingersLastCentroidRef.current.x;
        const dCentroidY = currentCentroidY - twoFingersLastCentroidRef.current.y;
        twoFingersLastCentroidRef.current = { x: currentCentroidX, y: currentCentroidY };

        const { dxCam, dyCam, halfW, halfH } = computeCameraScreenDelta(dCentroidX, dCentroidY);

        if (gestureSpaceRef?.current === "free") {
          targetPanCamRef.current.x = Math.max(-0.9 * halfW, Math.min(0.9 * halfW, targetPanCamRef.current.x + dxCam));
          targetPanCamRef.current.y = Math.max(-0.9 * halfH, Math.min(0.9 * halfH, targetPanCamRef.current.y + dyCam));
        } else {
          const THREE = ensureThreeHelpers();
          const camera = cameraRef.current;
          const pivot = pivotGroupRef.current;
          if (THREE && camera && pivot?.parent) {
            threeDeltaWorldVecRef.current.set(dxCam, dyCam, 0).applyQuaternion(camera.quaternion);
            pivot.parent.getWorldQuaternion(threeDisplayRootRotInvRef.current).invert();
            threeDeltaWorldVecRef.current.applyQuaternion(threeDisplayRootRotInvRef.current);
            targetPosRef.current.x = Math.max(-0.8, Math.min(0.8, targetPosRef.current.x + threeDeltaWorldVecRef.current.x));
            targetPosRef.current.y = Math.max(-0.8, Math.min(0.8, targetPosRef.current.y + threeDeltaWorldVecRef.current.y));
          } else {
            targetPosRef.current.x = Math.max(-0.8, Math.min(0.8, targetPosRef.current.x + dxCam));
            targetPosRef.current.y = Math.max(-0.8, Math.min(0.8, targetPosRef.current.y + dyCam));
          }
        }

        // 4.2. Pinch Zoom
        const currentDist = Math.hypot(p1.currentX - p2.currentX, p1.currentY - p2.currentY);
        if (pinchStartDistRef.current > 10 && currentDist > 10) {
          const factor = currentDist / pinchStartDistRef.current;
          const newScale = Math.max(GESTURE.SCALE_MIN, Math.min(GESTURE.SCALE_MAX, pinchStartScaleRef.current * factor));
          targetScaleRef.current = newScale;
        }
      }

      // 5. Desktop Fallback: Chuột phải hoặc giữ Shift để Pan di chuyển
      if (pointerCount === 1 && (e.shiftKey || e.buttons === 2)) {
        const { dxCam, dyCam, halfW, halfH } = computeCameraScreenDelta(dx, dy);
        if (gestureSpaceRef?.current === "free") {
          targetPanCamRef.current.x = Math.max(-0.9 * halfW, Math.min(0.9 * halfW, targetPanCamRef.current.x + dxCam));
          targetPanCamRef.current.y = Math.max(-0.9 * halfH, Math.min(0.9 * halfH, targetPanCamRef.current.y + dyCam));
        } else {
          targetPosRef.current.x = Math.max(-0.8, Math.min(0.8, targetPosRef.current.x + dxCam));
          targetPosRef.current.y = Math.max(-0.8, Math.min(0.8, targetPosRef.current.y + dyCam));
        }
      }
    },
    [computeCameraScreenDelta, ensureThreeHelpers, gestureSpaceRef]
  );

  /**
   * Pointer Up: Xử lý nhấc ngón tay, Tap Model, Reset 2 ngón, Quán tính và bảo vệ State Machine
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointer = pointersMapRef.current.get(e.pointerId);
      const now = performance.now();

      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      // XỬ LÝ THEO TRẠNG THÁI HIỆN TẠI:
      if (stateRef.current === "TWO") {
        // Kiểm tra điều kiện "2 ngón chạm nhanh để Reset góc nhìn"
        const pointers = Array.from(pointersMapRef.current.values());
        if (pointers.length >= 2) {
          const p1 = pointers[0];
          const p2 = pointers[1];

          const durationTwo = now - twoFingersDownTimeRef.current;
          const syncDiff = Math.abs(pointer1DownTimeRef.current - pointer2DownTimeRef.current);
          const p1Move = Math.hypot(p1.currentX - p1.startX, p1.currentY - p1.startY);
          const p2Move = Math.hypot(p2.currentX - p2.startX, p2.currentY - p2.startY);
          const curDist = Math.hypot(p1.currentX - p2.currentX, p1.currentY - p2.currentY);
          const distChange = Math.abs(curDist - pinchStartDistRef.current) / Math.max(1, pinchStartDistRef.current);

          const midX = (p1.currentX + p2.currentX) / 2;
          const midY = (p1.currentY + p2.currentY) / 2;
          const hitMid = hitTestModel(midX, midY);

          if (
            durationTwo <= GESTURE.TWO_TAP_MAX_MS &&
            syncDiff <= GESTURE.TWO_TAP_SYNC_MS &&
            p1Move <= GESTURE.TAP_MAX_MOVE_PX &&
            p2Move <= GESTURE.TAP_MAX_MOVE_PX &&
            distChange <= GESTURE.TWO_TAP_MAX_DIST_CHANGE &&
            !hitMid
          ) {
            triggerResetAll();
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              try {
                navigator.vibrate([15, 20, 15]);
              } catch {}
            }
          }
        }

        // QUAN TRỌNG (Prompt 2b): Chuyển ngay sang DONE khi ngón đầu tiên nhấc lên!
        // Ngăn ngón thứ 2 còn lại tự ý biến thành vuốt xoay giật cục.
        stateRef.current = "DONE";
      } else if (stateRef.current === "ONE_PENDING") {
        if (pointer) {
          const elapsed = now - pointer.startTime;
          const totalMoved = Math.hypot(pointer.currentX - pointer.startX, pointer.currentY - pointer.startY);

          if (elapsed < GESTURE.TAP_MAX_MS && totalMoved < GESTURE.TAP_MAX_MOVE_PX) {
            const hit = touchStartedOnModelRef.current || hitTestModel(pointer.currentX, pointer.currentY);
            if (hit) {
              // 1 ngón chạm nhanh trúng mô hình: Âm thanh + Phản ứng nhảy
              onTapModel();
            } else {
              // Chạm vùng trống: Kiểm tra Double-Tap để reset
              const timeSinceLastTap = now - lastTapTimeRef.current;
              const distFromLastTap = Math.hypot(
                pointer.currentX - lastTapPosRef.current.x,
                pointer.currentY - lastTapPosRef.current.y
              );

              if (timeSinceLastTap < GESTURE.DOUBLE_TAP_MS && distFromLastTap < GESTURE.DOUBLE_TAP_DIST_PX) {
                triggerResetAll();
                lastTapTimeRef.current = 0;
              } else {
                lastTapTimeRef.current = now;
                lastTapPosRef.current = { x: pointer.currentX, y: pointer.currentY };
              }
            }
          }
        }
        stateRef.current = "IDLE";
      } else if (stateRef.current === "ROTATE") {
        // Kết thúc vuốt xoay: Kiểm tra nếu ngón tay không dừng > 80ms thì kích hoạt quán tính
        if (now - lastMoveTimeRef.current < 80) {
          rotVelocityYRef.current = emaVelocityYRef.current;
        } else {
          rotVelocityYRef.current = 0;
        }
        stateRef.current = "IDLE";
      } else if (stateRef.current === "HOLD") {
        targetHoldLiftYRef.current = 0;
        isHoldingModelRef.current = false;
        stateRef.current = "IDLE";
      }

      // Xóa pointer đã nhấc
      pointersMapRef.current.delete(e.pointerId);

      // Nếu tất cả các ngón đã nhấc khỏi màn hình -> Quay về IDLE
      if (pointersMapRef.current.size === 0) {
        stateRef.current = "IDLE";
        isHoldingModelRef.current = false;
        targetHoldLiftYRef.current = 0;
        touchStartedOnModelRef.current = false;
        pinchStartDistRef.current = 0;
      }
    },
    [hitTestModel, onTapModel, triggerResetAll]
  );

  /**
   * Pointer Cancel: Khi hệ thống hủy cử chỉ (gọi điện thoại, vuốt ra khỏi webview)
   * Về ngay IDLE/DONE mà KHÔNG kích hoạt Tap hay Reset
   */
  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    pointersMapRef.current.delete(e.pointerId);
    if (pointersMapRef.current.size === 0) {
      stateRef.current = "IDLE";
      isHoldingModelRef.current = false;
      targetHoldLiftYRef.current = 0;
      touchStartedOnModelRef.current = false;
      pinchStartDistRef.current = 0;
    } else {
      stateRef.current = "DONE";
    }
  }, []);

  /**
   * Wheel Zoom Native (Desktop mouse wheel)
   */
  const handleNativeWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    targetScaleRef.current = Math.max(GESTURE.SCALE_MIN, Math.min(GESTURE.SCALE_MAX, targetScaleRef.current + delta));
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
   * Nút zoom trên UI (+15% hoặc -15%)
   */
  const adjustZoom = useCallback((delta: number) => {
    targetScaleRef.current = Math.max(GESTURE.SCALE_MIN, Math.min(GESTURE.SCALE_MAX, targetScaleRef.current + delta));
  }, []);

  /**
   * VÒNG LẶP NỘI SUY VẬT LÝ ĐỘC LẬP TỐC ĐỘ KHUNG HÌNH (Frame-rate independent damping)
   * Được gọi mỗi frame trong render loop: current += (target - current) * (1 - exp(-k * dt))
   */
  const updatePhysics = useCallback(
    (dt: number) => {
      const pivot = pivotGroupRef.current;
      if (!pivot) return;

      const THREE = ensureThreeHelpers();

      // 1. Quán tính xoay Y khi đã thả tay
      if (pointersMapRef.current.size === 0 && Math.abs(rotVelocityYRef.current) > 0.02) {
        targetRotYRef.current += rotVelocityYRef.current * dt;
        // Phân rã theo hàm mũ: decay exp(-4.5 * dt)
        rotVelocityYRef.current *= Math.exp(-4.5 * dt);
      } else if (pointersMapRef.current.size === 0) {
        rotVelocityYRef.current = 0;
      }

      // Hệ số lò xo giảm chấn k = 18 (Tăng độ nhạy bám sát ngón tay tức thời khi vuốt xoay 360, loại bỏ hiện tượng khựng/trễ chuyển động)
      const k = 18;
      const alpha = 1 - Math.exp(-k * dt);

      // 2. Nội suy vị trí Pan trong mặt phẳng thẻ ("tracking")
      currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * alpha;
      currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * alpha;

      // 3. Nội suy vị trí Pan trong mặt phẳng camera screen ("free")
      currentPanCamRef.current.x += (targetPanCamRef.current.x - currentPanCamRef.current.x) * alpha;
      currentPanCamRef.current.y += (targetPanCamRef.current.y - currentPanCamRef.current.y) * alpha;

      // 4. Nội suy góc xoay RotY, RotX
      currentRotYRef.current += (targetRotYRef.current - currentRotYRef.current) * alpha;
      currentRotXRef.current += (targetRotXRef.current - currentRotXRef.current) * alpha;

      // 5. Nội suy độ nhấc khi giữ (Hold lift)
      holdLiftYRef.current += (targetHoldLiftYRef.current - holdLiftYRef.current) * alpha;

      // 6. Nội suy tỉ lệ Scale
      currentScaleRef.current += (targetScaleRef.current - currentScaleRef.current) * alpha;

      // 7. ÁP DỤNG BIẾN ĐỔI VÀO PIVOT GROUP
      const baseDim = 0.72;
      const s = (baseDim / (maxDimRef.current || 1)) * currentScaleRef.current;
      pivot.scale.set(s, s, s);

      const hH = halfHRef?.current ?? 0.36;
      const cy = hH * currentScaleRef.current;

      const isFreeMode = gestureSpaceRef?.current === "free";

      if (THREE && threeVecCRef.current && threeQuatRef.current && threeEulerRef.current) {
        threeVecCRef.current.set(0, cy, 0);

        if (isFreeMode) {
          // KHÔNG GIAN "FREE":
          // Xoay màn hình: Qscreen = Euler(pitch, yaw, 0, 'YXZ')
          threeEulerRef.current.set(currentRotXRef.current, currentRotYRef.current, 0, "YXZ");
          threeQuatQScreenRef.current.setFromEuler(threeEulerRef.current);

          // Qd = anchorQuatRef.current
          const Qd = anchorQuatRef?.current;
          if (Qd && Qd.isQuaternion) {
            // pivot.quaternion = Qd⁻¹ · Qscreen · Qd
            threeQuatQdInvRef.current.copy(Qd).invert();
            threeQuatRef.current
              .copy(threeQuatQdInvRef.current)
              .multiply(threeQuatQScreenRef.current)
              .multiply(Qd);
            pivot.quaternion.copy(threeQuatRef.current);
          } else {
            pivot.quaternion.copy(threeQuatQScreenRef.current);
          }

          // Bù tâm model: pivot.position = c - pivot.quaternion · c
          threeVecRcRef.current.copy(threeVecCRef.current).applyQuaternion(pivot.quaternion);
          const offsetX = threeVecCRef.current.x - threeVecRcRef.current.x;
          const offsetY = threeVecCRef.current.y - threeVecRcRef.current.y;
          const offsetZ = threeVecCRef.current.z - threeVecRcRef.current.z;

          // LƯU Ý QUAN TRỌNG (Prompt 2c & 3): Trong "free" mode, KHÔNG cộng pan vào pivot.position!
          // Pan được lưu tại currentPanCamRef và component sẽ cộng trực tiếp vào P_screen / anchorPosTarget.
          pivot.position.set(
            offsetX,
            holdLiftYRef.current + offsetY,
            offsetZ
          );
        } else {
          // KHÔNG GIAN "TRACKING" (Bám thẻ bài):
          // pivot.rotation theo hệ cục bộ của thẻ
          pivot.rotation.y = currentRotYRef.current;
          pivot.rotation.x = currentRotXRef.current;

          threeEulerRef.current.set(currentRotXRef.current, currentRotYRef.current, 0, "YXZ");
          threeQuatRef.current.setFromEuler(threeEulerRef.current);
          threeVecRcRef.current.copy(threeVecCRef.current).applyQuaternion(threeQuatRef.current);

          const offsetX = threeVecCRef.current.x - threeVecRcRef.current.x;
          const offsetY = threeVecCRef.current.y - threeVecRcRef.current.y;
          const offsetZ = threeVecCRef.current.z - threeVecRcRef.current.z;

          pivot.position.set(
            currentPosRef.current.x + offsetX,
            currentPosRef.current.y + holdLiftYRef.current + offsetY,
            offsetZ
          );
        }
      } else {
        pivot.rotation.y = currentRotYRef.current;
        pivot.rotation.x = currentRotXRef.current;
        pivot.position.set(
          isFreeMode ? 0 : currentPosRef.current.x,
          (isFreeMode ? 0 : currentPosRef.current.y) + holdLiftYRef.current,
          0
        );
      }

      // 8. Throttle cập nhật React state zoomPercent (<= 10 lần/s và đổi >= 1%)
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
    [anchorQuatRef, ensureThreeHelpers, gestureSpaceRef, halfHRef, maxDimRef, onZoomChange, pivotGroupRef]
  );

  return {
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
    resetTransform: triggerResetAll,
    adjustZoom,
    updatePhysics,
    currentPosRef,
    panCamCurrentRef: currentPanCamRef,
    targetScaleRef,
    isHoldingModelRef,
    gestureStateRef: stateRef,
  };
}
