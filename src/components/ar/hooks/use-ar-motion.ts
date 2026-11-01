/**
 * Poly Cards - AR Motion Sensor Hook (Orbit Sphere & World Lock 3DoF)
 * Cung cấp quaternion qTarget (hướng xoay của camera trong thế giới so với pose mốc ban đầu).
 * Tối ưu hiệu năng: tái sử dụng Vector/Quaternion/Euler cố định, không cấp phát object trong event listener.
 * Theo yêu cầu Phần A (PROMPT.md):
 * - Không slerp theo event listener để độc lập tần số cảm biến (60Hz vs 120Hz).
 * - Render loop sẽ làm mượt qua qSmooth.slerp(qTarget, 1 - Math.exp(-18 * dt)).
 * - Hỗ trợ đầy đủ quyền truy cập iOS 13+ Safari và bù góc Camera lưng chuẩn Three.js.
 */

import { useState, useRef, useCallback, useEffect } from "react";

interface UseArMotionOptions {
  enabled?: boolean;
}

export function useArMotion({ enabled = false }: UseArMotionOptions = {}) {
  const [isMotionSupported, setIsMotionSupported] = useState<boolean>(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [needsPermissionPrompt, setNeedsPermissionPrompt] = useState<boolean>(false);

  // Quaternion qTarget biểu diễn hướng xoay camera tức thời trong thế giới
  const qTargetRef = useRef<any>(null);
  const initialQuatRef = useRef<any>(null);
  const hasBasePoseRef = useRef<boolean>(false);

  // Đối tượng tái sử dụng tránh cấp phát trong vòng lặp cảm biến (60-120Hz)
  const eulerRef = useRef<any>(null);
  const rawQuatRef = useRef<any>(null);
  const qScreenRef = useRef<any>(null);
  const axisZRef = useRef<any>(null);
  const q1Ref = useRef<any>(null); // Bù góc -90 độ trục X: Camera nhìn ra mặt lưng (chuẩn Three.js DeviceOrientationControls)

  // Góc bù trừ xoay màn hình (orientation angle)
  const screenAngleRef = useRef<number>(0);

  // Lưu góc azimuth và elevation cho Debug HUD (không gây re-render)
  const motionDebugAnglesRef = useRef<{ azimuthDeg: number; elevationDeg: number }>({
    azimuthDeg: 0,
    elevationDeg: 0,
  });

  // Khởi tạo các helper toán học Three.js một lần duy nhất
  const ensureMotionMath = useCallback(() => {
    if (typeof window === "undefined" || !window.THREE) return null;
    const THREE = window.THREE;
    if (!qTargetRef.current) {
      qTargetRef.current = new THREE.Quaternion();
      initialQuatRef.current = new THREE.Quaternion();
      eulerRef.current = new THREE.Euler(0, 0, 0, "YXZ");
      rawQuatRef.current = new THREE.Quaternion();
      qScreenRef.current = new THREE.Quaternion();
      axisZRef.current = new THREE.Vector3(0, 0, 1);
      q1Ref.current = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
    }
    return THREE;
  }, []);

  // Kiểm tra hỗ trợ cảm biến & yêu cầu quyền iOS
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (
      typeof (DeviceOrientationEvent as any) !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      // iOS 13+ Safari cần cử chỉ chạm để cấp quyền
      setIsMotionSupported(true);
      setNeedsPermissionPrompt(true);
    } else if (typeof window.DeviceOrientationEvent !== "undefined") {
      // Android Chrome & trình duyệt khác không cần prompt
      setIsMotionSupported(true);
      setIsPermissionGranted(true);
      setNeedsPermissionPrompt(false);
    }
  }, []);

  // Cập nhật góc xoay màn hình (Screen Orientation)
  useEffect(() => {
    const updateScreenAngle = () => {
      if (typeof window === "undefined") return;
      const angle =
        window.screen?.orientation?.angle !== undefined
          ? window.screen.orientation.angle
          : (window as any).orientation || 0;
      screenAngleRef.current = angle;
    };

    updateScreenAngle();
    window.addEventListener("orientationchange", updateScreenAngle);
    return () => {
      window.removeEventListener("orientationchange", updateScreenAngle);
    };
  }, []);

  /**
   * Xin quyền truy cập cảm biến chuyển động trên iPhone Safari.
   * QUAN TRỌNG: Phải gọi trực tiếp trong onClick handler đồng bộ, không await trước đó.
   */
  const requestMotionPermission = useCallback(async (): Promise<boolean> => {
    if (
      typeof (DeviceOrientationEvent as any) !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === "granted") {
          setIsPermissionGranted(true);
          setNeedsPermissionPrompt(false);
          return true;
        } else {
          setIsPermissionGranted(false);
          return false;
        }
      } catch (err) {
        console.warn("[Motion Sensor Permission]:", err);
        return false;
      }
    }
    return true;
  }, []);

  // Lắng nghe sự kiện deviceorientation khi enabled = true
  useEffect(() => {
    if (!enabled || !isPermissionGranted) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const THREE = ensureMotionMath();
      if (!THREE || !qTargetRef.current) return;

      const alpha = e.alpha ? THREE.MathUtils.degToRad(e.alpha) : 0; // [0, 360]
      const beta = e.beta ? THREE.MathUtils.degToRad(e.beta) : 0;   // [-180, 180]
      const gamma = e.gamma ? THREE.MathUtils.degToRad(e.gamma) : 0; // [-90, 90]
      const orient = THREE.MathUtils.degToRad(screenAngleRef.current || 0);

      // Chuẩn Euler DeviceOrientation: YXZ
      eulerRef.current.set(beta, alpha, -gamma, "YXZ");
      rawQuatRef.current.setFromEuler(eulerRef.current);

      // Bù góc -90° trục X: Camera nhìn ra mặt lưng thiết bị (loại bỏ hoàn toàn Gimbal Lock khi điện thoại dựng đứng)
      if (q1Ref.current) {
        rawQuatRef.current.multiply(q1Ref.current);
      }

      // Bù góc xoay màn hình (Portrait / Landscape)
      qScreenRef.current.setFromAxisAngle(axisZRef.current, -orient);
      rawQuatRef.current.multiply(qScreenRef.current);

      // Thiết lập pose mốc ban đầu (khi bắt đầu hoặc khi resetBasePose)
      if (!hasBasePoseRef.current) {
        initialQuatRef.current.copy(rawQuatRef.current).invert();
        hasBasePoseRef.current = true;
      }

      // qTarget = rawQuat * initialQuat (hướng xoay tương đối so với pose gốc ban đầu)
      qTargetRef.current.copy(rawQuatRef.current).multiply(initialQuatRef.current);

      // Cập nhật thông số góc cho HUD
      eulerRef.current.setFromQuaternion(qTargetRef.current, "YXZ");
      motionDebugAnglesRef.current.azimuthDeg = Math.round(THREE.MathUtils.radToDeg(eulerRef.current.y));
      motionDebugAnglesRef.current.elevationDeg = Math.round(THREE.MathUtils.radToDeg(-eulerRef.current.x));
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [enabled, ensureMotionMath, isPermissionGranted]);

  const resetBasePose = useCallback(() => {
    hasBasePoseRef.current = false;
  }, []);

  return {
    isMotionSupported,
    isPermissionGranted,
    needsPermissionPrompt,
    requestMotionPermission,
    gyroQuatRef: qTargetRef, // qTarget: Quaternion hướng tức thời, render loop sẽ làm mượt
    motionDebugAnglesRef,
    resetBasePose,
  };
}
