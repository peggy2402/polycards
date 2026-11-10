/**
 * Poly Cards - AR Magnetic Interaction Hook ("TƯƠNG TÁC NAM CHÂM")
 * Điện thoại đóng vai một cực nam châm, mô hình 3D đóng vai cực còn lại.
 * 
 * Các chế độ:
 * - TẮT ("off")
 * - ĐẨY ("repel"): Dương - Dương -> Đẩy lùi mô hình ra xa khi điện thoại lại gần, chặn tại minGap.
 * - HÚT ("attract"): Âm - Dương -> Hút mô hình theo điện thoại, dừng ở stickGap, nhả khi quá releaseDist.
 * 
 * Nguồn dữ liệu không gian:
 * 1. Tracking thẻ AR (MindAR 6DoF): Nghịch đảo matrix của anchorGroup lấy vị trí camera thật.
 * 2. Free Orbit / World-lock: Ước lượng vị trí từ DeviceMotion linear acceleration (leaky + zero-velocity update) + Gyro arc.
 * 3. Fallback chỉ có Gyro: Quét yaw/pitch theo cung hình cầu.
 * 
 * Lưu ý: Các hàm vật lý thuần túy (stepMagnetPhysics) độc lập hoàn toàn với THREE và React,
 * cho phép viết unit test 100% tin cậy.
 */

import { useState, useRef, useCallback, useEffect } from "react";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type MagnetPolarity = "off" | "repel" | "attract";

export interface MagnetConfig {
  k: number;
  epsilon: number;
  influenceRadius: number;
  minGap: number;
  stickGap: number;
  releaseDist: number;
  ks: number;
  zeta: number;
  maxOffset: number;
  maxForce: number;
  brakeDamping: number;
  tiltStrength: number;
  dPole: number;
  accelDeadband: number;
  accelLeakTau: number;
  maxAccelVel: number;
  maxAccelDisp: number;
  zeroVelocityWindow: number;
}

export const MAGNET_CONFIG: MagnetConfig = {
  k: 2.2,                  // Hệ số lực từ
  epsilon: 0.18,           // Epsilon làm mềm tránh chia cho 0
  influenceRadius: 2.4,    // Bán kính vùng tác dụng từ trường (chuẩn hóa theo model)
  minGap: 0.40,            // Khoảng cách tối thiểu ở chế độ ĐẨY (mô hình không xuyên camera)
  stickGap: 0.48,          // Khoảng cách dừng/bám ở chế độ HÚT
  releaseDist: 1.9,        // Khoảng cách nhả ở chế độ HÚT
  ks: 16.0,                // Độ cứng lò xo đàn hồi về gốc (F_home = -ks*p - c*v)
  zeta: 0.82,              // Tỷ số tắt dần lò xo (hơi underdamped cho cảm giác sống động)
  maxOffset: 0.65,         // Giới hạn biên độ lệch tối đa |p|
  maxForce: 22.0,          // Giới hạn độ lớn lực từ tối đa |F|
  brakeDamping: 9.0,       // Lực hãm khi d < stickGap ở chế độ Hút
  tiltStrength: 0.28,      // Độ nghiêng mô hình hướng về/ra xa cực từ (radian)
  dPole: 0.15,             // Khoảng cách cực nam châm trước mặt kính camera (mét)

  // Bộ lọc gia tốc tuyến tính DeviceMotion Linear Acceleration
  accelDeadband: 0.15,     // Ngưỡng lọc nhiễu gia tốc (m/s^2)
  accelLeakTau: 0.6,       // Hằng số thời gian rò rỉ vận tốc/vị trí (giây)
  maxAccelVel: 1.5,        // Giới hạn vận tốc ước lượng (m/s)
  maxAccelDisp: 0.35,      // Giới hạn dịch chuyển ước lượng (m)
  zeroVelocityWindow: 0.18 // Thời gian đứng yên để kích hoạt zero-velocity reset (s)
};

export interface MagnetPhysicsState {
  p: Vec3;
  v: Vec3;
}

export interface MagnetStepResult {
  p: Vec3;
  v: Vec3;
  tilt: Vec3;
  d: number;
  contactStrength: number;
  isContacting: boolean;
  force: Vec3;
}

/**
 * Hàm tích phân vật lý từ tính thuần (Pure Function, không phụ thuộc THREE/DOM)
 */
export function stepMagnetPhysics(
  state: MagnetPhysicsState,
  poleQ: Vec3,
  polarity: MagnetPolarity,
  dtRaw: number,
  isGestureActive: boolean,
  config: MagnetConfig = MAGNET_CONFIG
): MagnetStepResult {
  const dt = Math.max(0.001, Math.min(0.05, dtRaw));

  // Vector từ mô hình (tại vị trí p hiện tại) đến cực nam châm Q của điện thoại
  const dx = poleQ.x - state.p.x;
  const dy = poleQ.y - state.p.y;
  const dz = poleQ.z - state.p.z;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const dirX = d > 1e-6 ? dx / d : 0;
  const dirY = d > 1e-6 ? dy / d : 0;
  const dirZ = d > 1e-6 ? dz / d : -1;

  let fMagX = 0;
  let fMagY = 0;
  let fMagZ = 0;
  let contactStrength = 0;
  let isContacting = false;
  let tiltX = 0;
  let tiltY = 0;
  let tiltZ = 0;

  if (polarity !== "off" && !isGestureActive) {
    if (polarity === "repel") {
      // 1. Chế độ ĐẨY (Dương - Dương)
      if (d < config.influenceRadius) {
        isContacting = true;
        const normalizedSpan = Math.max(0.01, config.influenceRadius - config.minGap);
        contactStrength = Math.max(0, Math.min(1, 1 - (d - config.minGap) / normalizedSpan));

        let fMag = config.k / (d * d + config.epsilon * config.epsilon);
        if (d < config.minGap) {
          // Khi tiến quá gần minGap, lực đẩy bộc phát cực mạnh
          const pen = config.minGap - d;
          fMag += pen * 45.0;
        }
        fMag = Math.min(config.maxForce, fMag);

        // Hướng đẩy: ra xa cực nam châm Q (ngược hướng dir)
        fMagX = -dirX * fMag;
        fMagY = -dirY * fMag;
        fMagZ = -dirZ * fMag;

        // Mô hình nghiêng nhẹ ra xa cực từ
        tiltX = -dirY * contactStrength * config.tiltStrength;
        tiltY = dirX * contactStrength * config.tiltStrength * 0.5;
        tiltZ = dirX * contactStrength * config.tiltStrength;
      }
    } else if (polarity === "attract") {
      // 2. Chế độ HÚT (Âm - Dương)
      if (d > config.releaseDist) {
        // Quá khoảng cách buông -> lực từ nhả hoàn toàn
        isContacting = false;
        contactStrength = 0;
      } else if (d < config.influenceRadius) {
        isContacting = true;
        const normalizedSpan = Math.max(0.01, config.influenceRadius - config.stickGap);
        contactStrength = Math.max(0, Math.min(1, 1 - (d - config.stickGap) / normalizedSpan));

        let fMag = config.k / (d * d + config.epsilon * config.epsilon);
        fMag = Math.min(config.maxForce, fMag);

        // Hướng hút: tiến về phía cực nam châm Q
        fMagX = dirX * fMag;
        fMagY = dirY * fMag;
        fMagZ = dirZ * fMag;

        // Lực hãm khi d < stickGap: hãm phanh để mô hình bám êm không rung lắc
        if (d < config.stickGap) {
          const pen = config.stickGap - d;
          fMagX -= dirX * pen * 35.0;
          fMagY -= dirY * pen * 35.0;
          fMagZ -= dirZ * pen * 35.0;

          fMagX -= state.v.x * config.brakeDamping;
          fMagY -= state.v.y * config.brakeDamping;
          fMagZ -= state.v.z * config.brakeDamping;
        }

        // Mô hình nghiêng nhẹ hướng về phía cực từ
        tiltX = dirY * contactStrength * config.tiltStrength;
        tiltY = -dirX * contactStrength * config.tiltStrength * 0.5;
        tiltZ = -dirX * contactStrength * config.tiltStrength;
      }
    }
  }

  // 3. Lực lò xo đàn hồi về gốc: F_home = -ks*p - c*v
  // c = 2 * zeta * sqrt(ks)
  const cSpring = 2 * config.zeta * Math.sqrt(config.ks);
  const fHomeX = -config.ks * state.p.x - cSpring * state.v.x;
  const fHomeY = -config.ks * state.p.y - cSpring * state.v.y;
  const fHomeZ = -config.ks * state.p.z - cSpring * state.v.z;

  // 4. Tích phân Semi-implicit Euler
  const fTotalX = fMagX + fHomeX;
  const fTotalY = fMagY + fHomeY;
  const fTotalZ = fMagZ + fHomeZ;

  let newVx = state.v.x + fTotalX * dt;
  let newVy = state.v.y + fTotalY * dt;
  let newVz = state.v.z + fTotalZ * dt;

  let newPx = state.p.x + newVx * dt;
  let newPy = state.p.y + newVy * dt;
  let newPz = state.p.z + newVz * dt;

  // Giới hạn biên độ lệch tối đa |p| <= maxOffset
  const pMag = Math.sqrt(newPx * newPx + newPy * newPy + newPz * newPz);
  if (pMag > config.maxOffset) {
    const scale = config.maxOffset / pMag;
    newPx *= scale;
    newPy *= scale;
    newPz *= scale;

    const vDotP = (newVx * newPx + newVy * newPy + newVz * newPz) / (config.maxOffset * config.maxOffset);
    if (vDotP > 0) {
      newVx -= vDotP * newPx;
      newVy -= vDotP * newPy;
      newVz -= vDotP * newPz;
    }
  }

  // Chặn tuyệt đối ranh giới minGap trong chế độ ĐẨY
  if (polarity === "repel") {
    const finalDistX = poleQ.x - newPx;
    const finalDistY = poleQ.y - newPy;
    const finalDistZ = poleQ.z - newPz;
    const finalDist = Math.sqrt(finalDistX * finalDistX + finalDistY * finalDistY + finalDistZ * finalDistZ);

    if (finalDist < config.minGap) {
      const uX = (newPx - poleQ.x) / (finalDist + 1e-6);
      const uY = (newPy - poleQ.y) / (finalDist + 1e-6);
      const uZ = (newPz - poleQ.z) / (finalDist + 1e-6);
      newPx = poleQ.x + uX * config.minGap;
      newPy = poleQ.y + uY * config.minGap;
      newPz = poleQ.z + uZ * config.minGap;
    }
  }

  return {
    p: { x: newPx, y: newPy, z: newPz },
    v: { x: newVx, y: newVy, z: newVz },
    tilt: { x: tiltX, y: tiltY, z: tiltZ },
    d,
    contactStrength,
    isContacting,
    force: { x: fMagX, y: fMagY, z: fMagZ },
  };
}

export function useArMagnet() {
  const [polarity, setPolarityState] = useState<MagnetPolarity>("off");
  const polarityRef = useRef<MagnetPolarity>("off");

  // Đồng bộ state và ref
  const setPolarity = useCallback((newPol: MagnetPolarity) => {
    polarityRef.current = newPol;
    setPolarityState(newPol);
  }, []);

  // Trạng thái vật lý
  const physicsStateRef = useRef<MagnetPhysicsState>({
    p: { x: 0, y: 0, z: 0 },
    v: { x: 0, y: 0, z: 0 },
  });

  // Kết quả sau mỗi bước tích phân
  const offsetRef = useRef<Vec3>({ x: 0, y: 0, z: 0 });
  const tiltRef = useRef<Vec3>({ x: 0, y: 0, z: 0 });
  const contactRef = useRef<{ isContacting: boolean; strength: number }>({
    isContacting: false,
    strength: 0,
  });

  // Throttle xúc giác rung khi chạm từ trường
  const lastVibrateTimeRef = useRef<number>(0);
  const wasContactingRef = useRef<boolean>(false);

  // Bộ lọc gia tốc tuyến tính DeviceMotion (loại bỏ trọng lực)
  const accelEstVelRef = useRef<Vec3>({ x: 0, y: 0, z: 0 });
  const accelEstDispRef = useRef<Vec3>({ x: 0, y: 0, z: 0 });
  const lastMotionTimestampRef = useRef<number>(0);
  const stillDurationRef = useRef<number>(0);

  // Telemetry cho Debug HUD (không setState mỗi frame)
  const telemetryRef = useRef({
    pMag: 0,
    dist: 0,
    polarity: "off",
    contact: 0,
    dispX: 0,
    dispY: 0,
    dispZ: 0,
  });

  // Lắng nghe devicemotion
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      if (polarityRef.current === "off") return;

      const acc = e.acceleration;
      if (!acc) return;

      const axRaw = acc.x || 0;
      const ayRaw = acc.y || 0;
      const azRaw = acc.z || 0;

      const now = performance.now();
      const dt = lastMotionTimestampRef.current > 0
        ? Math.min(0.05, Math.max(0.005, (now - lastMotionTimestampRef.current) / 1000))
        : 0.016;
      lastMotionTimestampRef.current = now;

      // 1. Áp dụng Deadband lọc rung lắc vi mô
      const aMag = Math.sqrt(axRaw * axRaw + ayRaw * ayRaw + azRaw * azRaw);
      let ax = 0;
      let ay = 0;
      let az = 0;

      if (aMag > MAGNET_CONFIG.accelDeadband) {
        const factor = (aMag - MAGNET_CONFIG.accelDeadband) / aMag;
        ax = axRaw * factor;
        ay = ayRaw * factor;
        az = azRaw * factor;
        stillDurationRef.current = 0;
      } else {
        stillDurationRef.current += dt;
      }

      // 2. Leaky integration với hằng số thời gian tau = 0.6s
      const isStationary = stillDurationRef.current > MAGNET_CONFIG.zeroVelocityWindow;
      const leakVel = isStationary
        ? Math.exp(-dt / 0.15) // Zero-velocity update: triệt tiêu vận tốc nhanh khi đứng yên
        : Math.exp(-dt / MAGNET_CONFIG.accelLeakTau);
      const leakDisp = isStationary
        ? Math.exp(-dt / 0.25) // Đưa vị trí ước lượng trôi về 0
        : Math.exp(-dt / MAGNET_CONFIG.accelLeakTau);

      const vx = (accelEstVelRef.current.x + ax * dt) * leakVel;
      const vy = (accelEstVelRef.current.y + ay * dt) * leakVel;
      const vz = (accelEstVelRef.current.z + az * dt) * leakVel;

      // Clamp vận tốc tối đa 1.5 m/s
      const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const vClamped = vMag > MAGNET_CONFIG.maxAccelVel
        ? MAGNET_CONFIG.maxAccelVel / vMag
        : 1.0;

      accelEstVelRef.current.x = vx * vClamped;
      accelEstVelRef.current.y = vy * vClamped;
      accelEstVelRef.current.z = vz * vClamped;

      // 3. Tích phân dịch chuyển C
      let cx = (accelEstDispRef.current.x + accelEstVelRef.current.x * dt) * leakDisp;
      let cy = (accelEstDispRef.current.y + accelEstVelRef.current.y * dt) * leakDisp;
      let cz = (accelEstDispRef.current.z + accelEstVelRef.current.z * dt) * leakDisp;

      // Clamp dịch chuyển tối đa +-0.35m
      const cMag = Math.sqrt(cx * cx + cy * cy + cz * cz);
      if (cMag > MAGNET_CONFIG.maxAccelDisp) {
        const cScale = MAGNET_CONFIG.maxAccelDisp / cMag;
        cx *= cScale;
        cy *= cScale;
        cz *= cScale;
      }

      accelEstDispRef.current.x = cx;
      accelEstDispRef.current.y = cy;
      accelEstDispRef.current.z = cz;
    };

    window.addEventListener("devicemotion", handleDeviceMotion, { passive: true });
    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
    };
  }, []);

  /**
   * Cập nhật lực nam châm mỗi frame render (gọi trong renderer.setAnimationLoop)
   * Không cấp phát object trong frame này.
   */
  const updateMagnet = useCallback(
    (dt: number, poleQ: Vec3, isGestureActive: boolean): MagnetStepResult => {
      const pol = polarityRef.current;
      const res = stepMagnetPhysics(
        physicsStateRef.current,
        poleQ,
        pol,
        dt,
        isGestureActive,
        MAGNET_CONFIG
      );

      physicsStateRef.current.p = res.p;
      physicsStateRef.current.v = res.v;

      offsetRef.current = res.p;
      tiltRef.current = res.tilt;
      contactRef.current.isContacting = res.isContacting;
      contactRef.current.strength = res.contactStrength;

      // Xúc giác rung khi bắt đầu tiếp xúc từ trường (Throttled 350ms)
      if (res.isContacting && !wasContactingRef.current) {
        const now = performance.now();
        if (now - lastVibrateTimeRef.current > 350) {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            try {
              navigator.vibrate(15);
            } catch {}
          }
          lastVibrateTimeRef.current = now;
        }
      }
      wasContactingRef.current = res.isContacting;

      // Cập nhật telemetry cho HUD
      const pMag = Math.sqrt(res.p.x * res.p.x + res.p.y * res.p.y + res.p.z * res.p.z);
      telemetryRef.current.pMag = pMag;
      telemetryRef.current.dist = res.d;
      telemetryRef.current.polarity = pol;
      telemetryRef.current.contact = res.contactStrength;
      telemetryRef.current.dispX = accelEstDispRef.current.x;
      telemetryRef.current.dispY = accelEstDispRef.current.y;
      telemetryRef.current.dispZ = accelEstDispRef.current.z;

      return res;
    },
    []
  );

  return {
    polarity,
    setPolarity,
    polarityRef,
    offsetRef,
    tiltRef,
    contactRef,
    accelEstDispRef,
    telemetryRef,
    updateMagnet,
  };
}

