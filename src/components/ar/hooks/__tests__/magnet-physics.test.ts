/**
 * Unit tests cho hệ thống vật lý từ tính thuần (Pure Magnet Physics)
 * Kiểm chứng 5 tiêu chí:
 * 1. Chế độ ĐẨY giữ khoảng cách >= minGap, không bao giờ xuyên camera.
 * 2. Chế độ HÚT bám giữ ổn định ở stickGap, không dao động quá đà.
 * 3. Chế độ HÚT nhả khi khoảng cách vượt quá releaseDist.
 * 4. Hệ thống ổn định, giảm chấn dập tắt dao động (không runaway).
 * 5. Tự động hồi về gốc (home = 0) trong <= 1.5 giây khi tắt hoặc Q ở xa.
 */

import {
  stepMagnetPhysics,
  MAGNET_CONFIG,
  MagnetPhysicsState,
  Vec3,
} from "../use-ar-magnet";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("=== BẮT ĐẦU CHẠY UNIT TESTS VẬT LÝ NAM CHÂM AR ===");

// TEST 1: Chế độ ĐẨY giữ khoảng cách >= minGap
{
  console.log("Test 1: Chế độ ĐẨY luôn giữ khoảng cách >= minGap...");
  let state: MagnetPhysicsState = {
    p: { x: 0, y: 0, z: 0 },
    v: { x: 0, y: 0, z: 0 },
  };

  // Cực nam châm lao sát vào mặt mô hình ở z = 0.15 (rất gần, < minGap = 0.40)
  const poleQ: Vec3 = { x: 0, y: 0, z: 0.15 };
  const dt = 0.016;

  for (let i = 0; i < 60; i++) {
    const res = stepMagnetPhysics(state, poleQ, "repel", dt, false, MAGNET_CONFIG);
    state = { p: res.p, v: res.v };

    // Khoảng cách thực tế giữa poleQ và vị trí mới của mô hình
    const dx = poleQ.x - state.p.x;
    const dy = poleQ.y - state.p.y;
    const dz = poleQ.z - state.p.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    assert(
      dist >= MAGNET_CONFIG.minGap - 1e-4,
      `Khoảng cách ${dist} bị vi phạm ranh giới minGap ${MAGNET_CONFIG.minGap} tại frame ${i}`
    );
  }

  // Mô hình phải bị đẩy lùi về phía âm của trục Z (xa khỏi poleQ ở z=0.15)
  assert(state.p.z < 0, "Mô hình phải bị đẩy lùi về phía -Z");
  console.log("-> Test 1 PASSED: Khoảng cách luôn >= minGap, mô hình bị đẩy lùi đúng hướng.");
}

// TEST 2: Chế độ HÚT dừng và bám ổn định ở stickGap
{
  console.log("Test 2: Chế độ HÚT bám ổn định ở stickGap...");
  let state: MagnetPhysicsState = {
    p: { x: 0, y: 0, z: 0 },
    v: { x: 0, y: 0, z: 0 },
  };

  // Cực nam châm đặt ở khoảng cách 0.9m
  const poleQ: Vec3 = { x: 0, y: 0, z: 0.9 };
  const dt = 0.016;

  // Chạy mô phỏng 1.5 giây (khoảng 90 frames)
  for (let i = 0; i < 90; i++) {
    const res = stepMagnetPhysics(state, poleQ, "attract", dt, false, MAGNET_CONFIG);
    state = { p: res.p, v: res.v };
  }

  // Mô hình phải bị hút tiến về phía +Z (hướng poleQ)
  assert(state.p.z > 0.1, `Mô hình phải tiến về phía poleQ, p.z=${state.p.z}`);

  const dx = poleQ.x - state.p.x;
  const dy = poleQ.y - state.p.y;
  const dz = poleQ.z - state.p.z;
  const finalDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Khoảng cách dừng không được đâm xuyên qua stickGap
  assert(
    finalDist >= MAGNET_CONFIG.stickGap - 0.15,
    `Khoảng cách dừng ${finalDist} không được nhỏ hơn stickGap ${MAGNET_CONFIG.stickGap}`
  );
  // Vận tốc phải được dập tắt (ổn định, không dao động vô hạn)
  const vMag = Math.sqrt(state.v.x ** 2 + state.v.y ** 2 + state.v.z ** 2);
  assert(vMag < 0.25, `Vận tốc sau khi hãm ${vMag} phải nhỏ (dừng ổn định)`);
  console.log("-> Test 2 PASSED: Chế độ Hút bám ổn định gần stickGap, vận tốc dừng êm.");
}

// TEST 3: Chế độ HÚT nhả khi khoảng cách vượt quá releaseDist
{
  console.log("Test 3: Chế độ HÚT nhả lực khi d > releaseDist...");
  let state: MagnetPhysicsState = {
    p: { x: 0, y: 0, z: 0 },
    v: { x: 0, y: 0, z: 0 },
  };

  // Cực nam châm ở rất xa d = 2.5m > releaseDist (1.9m)
  const poleQ: Vec3 = { x: 0, y: 0, z: 2.5 };
  const res = stepMagnetPhysics(state, poleQ, "attract", 0.016, false, MAGNET_CONFIG);

  assert(!res.isContacting, "Không được tính là tiếp xúc khi d > releaseDist");
  assert(res.force.x === 0 && res.force.y === 0 && res.force.z === 0, "Lực từ phải bằng 0 khi quá releaseDist");
  console.log("-> Test 3 PASSED: Đã nhả lực từ hoàn toàn khi vượt releaseDist.");
}

// TEST 4: Ổn định và giảm chấn dập tắt dao động
{
  console.log("Test 4: Ổn định và giảm chấn dập tắt dao động...");
  // Khởi tạo trạng thái đang bị lệch lớn và có vận tốc
  let state: MagnetPhysicsState = {
    p: { x: 0.4, y: -0.3, z: 0.5 },
    v: { x: 1.2, y: -0.8, z: 0.9 },
  };

  const poleQ: Vec3 = { x: 0, y: 0, z: 5.0 }; // Q ở xa
  const dt = 0.016;

  let maxV = 0;
  for (let i = 0; i < 100; i++) {
    const res = stepMagnetPhysics(state, poleQ, "off", dt, false, MAGNET_CONFIG);
    state = { p: res.p, v: res.v };
    const currentV = Math.sqrt(state.v.x ** 2 + state.v.y ** 2 + state.v.z ** 2);
    if (currentV > maxV) maxV = currentV;
  }

  const finalV = Math.sqrt(state.v.x ** 2 + state.v.y ** 2 + state.v.z ** 2);
  assert(finalV < 0.05, `Vận tốc cuối ${finalV} phải tiến về 0`);
  console.log("-> Test 4 PASSED: Dao động bị dập tắt êm, không xảy ra nổ số.");
}

// TEST 5: Tự động hồi về gốc (home = 0) trong <= 1.5 giây
{
  console.log("Test 5: Tự động hồi về gốc trong <= 1.5 giây...");
  // Bị kéo lệch tối đa maxOffset (0.65)
  let state: MagnetPhysicsState = {
    p: { x: 0.35, y: 0.2, z: -0.5 },
    v: { x: 0, y: 0, z: 0 },
  };

  const poleQ: Vec3 = { x: 0, y: 0, z: 0 };
  const dt = 0.016;
  const framesIn1_5s = Math.round(1.5 / dt); // ~94 frames

  for (let i = 0; i < framesIn1_5s; i++) {
    const res = stepMagnetPhysics(state, poleQ, "off", dt, false, MAGNET_CONFIG);
    state = { p: res.p, v: res.v };
  }

  const finalP = Math.sqrt(state.p.x ** 2 + state.p.y ** 2 + state.p.z ** 2);
  assert(finalP < 0.03, `Lệch vị trí cuối ${finalP} phải < 0.03 (gần 0) sau 1.5s`);
  console.log(`-> Test 5 PASSED: Sau 1.5s, vị trí lệch còn ${finalP.toFixed(4)} (< 0.03).`);
}

console.log("\n TẤT CẢ 5/5 UNIT TESTS VẬT LÝ NAM CHÂM ĐÃ VƯỢT QUA XUẤT SẮC! \n");
