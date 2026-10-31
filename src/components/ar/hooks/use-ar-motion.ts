/**
 * Poly Cards - AR Motion Sensor Hook (3DoF Gyroscope World-Lock & Orbit-Lite)
 * Cung cấp quaternion qCam (hướng xoay của camera trong thế giới so với pose mốc ban đầu).
 * Tối ưu hiệu năng: tái sử dụng Vector/Quaternion/Euler cố định, không cấp phát object trong event listener.
 * Tích hợp bộ lọc slerp low-pass chống rung tay và hỗ trợ đầy đủ quyền truy cập iOS 13+ Safari.
 */

import { useState, useRef, useCallback, useEffect } from "react";

interface UseArMotionOptions {
  enabled?: boolean;
}

export function useArMotion({ enabled = false }: UseArMotionOptions = {}) {
  const [isMotionSupported, setIsMotionSupported] = useState<boolean>(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [needsPermissionPrompt, setNeedsPermissionPrompt] = useState<boolean>(false);

  // Quaternion qCam ổn định biểu diễn hướng xoay camera trong thế giới
  const qCamRef = useRef<any>(null);
  const initialQuatRef = useRef<any>(null);
  const hasBasePoseRef = useRef<boolean>(false);

  // Đối tượng tái sử dụng tránh cấp phát trong vòng lặp cảm biến (60-120Hz)
  const eulerRef = useRef<any>(null);
  const rawQuatRef = useRef<any>(null);
  const qScreenRef = useRef<any>(null);
  const targetQuatRef = useRef<any>(null);
  const axisZRef = useRef<any>(null);

  // Góc bù trừ xoay màn hình (orientation angle)
  const screenAngleRef = useRef<number>(0);

  // Khởi tạo các helper toán học Three.js một lần duy nhất
  const ensureMotionMath = useCallback(() => {
    if (typeof window === "undefined" || !window.THREE) return null;
    const THREE = window.THREE;
    if (!qCamRef.current) {
      qCamRef.current = new THREE.Quaternion();
      initialQuatRef.current = new THREE.Quaternion();
      eulerRef.current = new THREE.Euler();
      rawQuatRef.current = new THREE.Quaternion();
      qScreenRef.current = new THREE.Quaternion();
      targetQuatRef.current = new THREE.Quaternion();
      axisZRef.current = new THREE.Vector3(0, 0, 1);
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
      if (!THREE || !qCamRef.current) return;

      const alpha = e.alpha ? THREE.MathUtils.degToRad(e.alpha) : 0; // [0, 360]
      const beta = e.beta ? THREE.MathUtils.degToRad(e.beta) : 0;   // [-180, 180]
      const gamma = e.gamma ? THREE.MathUtils.degToRad(e.gamma) : 0; // [-90, 90]
      const orient = THREE.MathUtils.degToRad(screenAngleRef.current || 0);

      // Chuẩn Euler DeviceOrientation: YXZ
      eulerRef.current.set(beta, alpha, -gamma, "YXZ");
      rawQuatRef.current.setFromEuler(eulerRef.current);

      // Bù góc xoay màn hình (Portrait / Landscape)
      qScreenRef.current.setFromAxisAngle(axisZRef.current, -orient);
      rawQuatRef.current.multiply(qScreenRef.current);

      // Thiết lập pose mốc ban đầu (khi bắt đầu hoặc khi resetBasePose)
      if (!hasBasePoseRef.current) {
        initialQuatRef.current.copy(rawQuatRef.current).invert();
        hasBasePoseRef.current = true;
      }

      // targetQuat = rawQuat * initialQuat (hướng xoay tương đối so với pose gốc)
      targetQuatRef.current.copy(rawQuatRef.current).multiply(initialQuatRef.current);

      // Lọc nhiễu slerp chống rung tay (low-pass filter)
      qCamRef.current.slerp(targetQuatRef.current, 0.25);
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
    gyroQuatRef: qCamRef, // qCam: Quaternion hướng camera trong thế giới
    resetBasePose,
  };
}
