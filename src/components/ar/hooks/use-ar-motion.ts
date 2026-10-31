/**
 * Poly Cards - AR Motion Sensor Hook (3DoF Gyroscope World-Lock)
 * Bù trừ chuyển động xoay của điện thoại để mô hình 3D đứng cố định trong phòng (Free AR Mode).
 * Hỗ trợ DeviceOrientation API, lọc nhiễu low-pass/slerp, bù góc xoay màn hình, và cấp quyền trên iOS Safari.
 */

import { useState, useRef, useCallback, useEffect } from "react";

interface UseArMotionOptions {
  enabled?: boolean;
}

export function useArMotion({ enabled = false }: UseArMotionOptions = {}) {
  const [isMotionSupported, setIsMotionSupported] = useState<boolean>(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [needsPermissionPrompt, setNeedsPermissionPrompt] = useState<boolean>(false);

  // Quaternion góc quay hiện tại của con quay hồi chuyển
  const gyroQuatRef = useRef<any>(null);
  const initialQuatRef = useRef<any>(null);
  const hasBasePoseRef = useRef<boolean>(false);

  // Góc bù trừ khi xoay ngang / dọc điện thoại
  const screenAngleRef = useRef<number>(0);

  // Khởi tạo Three.js objects
  const ensureThreeMotionHelpers = useCallback(() => {
    if (typeof window === "undefined" || !window.THREE) return null;
    const THREE = window.THREE;
    if (!gyroQuatRef.current) {
      gyroQuatRef.current = new THREE.Quaternion();
      initialQuatRef.current = new THREE.Quaternion();
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
   * Xin quyền truy cập cảm biến chuyển động trên iPhone Safari
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
        }
      } catch (err) {
        console.warn("[Motion Sensor Permission]:", err);
      }
      return false;
    }
    return true;
  }, []);

  // Lắng nghe sự kiện deviceorientation
  useEffect(() => {
    if (!enabled || !isPermissionGranted) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const THREE = ensureThreeMotionHelpers();
      if (!THREE) return;

      const alpha = e.alpha ? THREE.MathUtils.degToRad(e.alpha) : 0; // [0, 360]
      const beta = e.beta ? THREE.MathUtils.degToRad(e.beta) : 0;   // [-180, 180]
      const gamma = e.gamma ? THREE.MathUtils.degToRad(e.gamma) : 0; // [-90, 90]

      const orient = THREE.MathUtils.degToRad(screenAngleRef.current || 0);

      const euler = new THREE.Euler();
      euler.set(beta, alpha, -gamma, "YXZ");

      const rawQuat = new THREE.Quaternion();
      rawQuat.setFromEuler(euler);

      // Bù trừ góc xoay màn hình
      const qScreen = new THREE.Quaternion();
      qScreen.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orient);
      rawQuat.multiply(qScreen);

      // Lấy pose mốc ban đầu (Reset pose)
      if (!hasBasePoseRef.current) {
        initialQuatRef.current.copy(rawQuat).invert();
        hasBasePoseRef.current = true;
      }

      // Lọc nhiễu chuyển động slerp mượt mà (low-pass filter)
      const targetQuat = rawQuat.clone().multiply(initialQuatRef.current);
      gyroQuatRef.current.slerp(targetQuat, 0.2);
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [enabled, ensureThreeMotionHelpers, isPermissionGranted]);

  const resetBasePose = useCallback(() => {
    hasBasePoseRef.current = false;
  }, []);

  return {
    isMotionSupported,
    isPermissionGranted,
    needsPermissionPrompt,
    requestMotionPermission,
    gyroQuatRef,
    resetBasePose,
  };
}
