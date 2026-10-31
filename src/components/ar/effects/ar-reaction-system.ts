/**
 * Poly Cards - AR 3D Reaction & Effects Engine
 * Quản lý tương tác 3D chân thực: Squash & Stretch bảo toàn thể tích, nhảy lò xo parabol,
 * bóng đổ mềm (blob shadow), hạt sao/trái tim bay nổi (sprite particles), và sóng âm lan tỏa.
 */

export interface ReactionState {
  isJumping: boolean;
  jumpTime: number;
  jumpDuration: number;
  jumpHeight: number;
  isSquashing: boolean;
  squashTime: number;
  wobbleAngle: number;
  audioPulseTime: number;
}

export class ArReactionSystem {
  private THREE: any;
  public reactionGroup: any;
  public blobShadowMesh: any;
  public particleGroup: any;
  public rippleGroup: any;

  private particles: Array<{
    sprite: any;
    active: boolean;
    velocity: any;
    lifetime: number;
    maxLifetime: number;
    rotSpeed: number;
    baseScale: number;
  }> = [];

  private ripples: Array<{
    mesh: any;
    active: boolean;
    age: number;
    maxAge: number;
    maxScale: number;
  }> = [];

  private state: ReactionState = {
    isJumping: false,
    jumpTime: 0,
    jumpDuration: 0.55,
    jumpHeight: 0.18,
    isSquashing: false,
    squashTime: 0,
    wobbleAngle: 0,
    audioPulseTime: 0,
  };

  private prevClipName: string | null = null;
  private activeReactionClipAction: any = null;

  constructor(THREE: any, maxModelSpan: number = 1.0) {
    this.THREE = THREE;
    this.reactionGroup = new THREE.Group();
    this.reactionGroup.name = "ArReactionGroup";

    // 1. Tạo bóng đổ mềm dưới chân (Blob Shadow)
    this.initBlobShadow(maxModelSpan);

    // 2. Tạo hệ thống hạt hiệu ứng sao / trái tim (Sprite Particle Pool)
    this.initParticlePool();

    // 3. Tạo hệ thống sóng âm lan tỏa dưới chân (Audio Ripple Rings)
    this.initRippleRings(maxModelSpan);
  }

  /**
   * Tạo Texture bóng đổ tròn mềm bằng Canvas tĩnh, không cần tệp ngoài
   */
  private createBlobShadowTexture(): any {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.65)");
      gradient.addColorStop(0.35, "rgba(0, 0, 0, 0.4)");
      gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.12)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    const texture = new this.THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Khởi tạo mặt phẳng bóng đổ dưới chân
   */
  private initBlobShadow(maxModelSpan: number): void {
    const shadowGeo = new this.THREE.PlaneGeometry(1, 1);
    const shadowMat = new this.THREE.MeshBasicMaterial({
      map: this.createBlobShadowTexture(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.blobShadowMesh = new this.THREE.Mesh(shadowGeo, shadowMat);
    this.blobShadowMesh.rotation.x = -Math.PI / 2;
    this.blobShadowMesh.position.y = -0.01;

    const baseShadowSize = Math.max(0.4, maxModelSpan * 0.45);
    this.blobShadowMesh.scale.set(baseShadowSize, baseShadowSize * 0.85, 1);
    this.reactionGroup.add(this.blobShadowMesh);
  }

  /**
   * Tạo Canvas Texture cho Sprite Hạt Sao Vàng
   */
  private createStarTexture(): any {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = "#fbbf24"; // Amber 400
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 8;

      // Vẽ hình ngôi sao 5 cánh
      ctx.beginPath();
      const cx = 32;
      const cy = 32;
      const spikes = 5;
      const outerRadius = 24;
      const innerRadius = 11;
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    }
    return new this.THREE.CanvasTexture(canvas);
  }

  /**
   * Tạo Canvas Texture cho Sprite Trái Tim Đỏ Hồng
   */
  private createHeartTexture(): any {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = "#f43f5e"; // Rose 500
      ctx.shadowColor = "#fb7185";
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.moveTo(32, 20);
      ctx.bezierCurveTo(32, 16, 26, 10, 18, 10);
      ctx.bezierCurveTo(8, 10, 8, 22.5, 8, 22.5);
      ctx.bezierCurveTo(8, 34, 18, 44, 32, 54);
      ctx.bezierCurveTo(46, 44, 56, 34, 56, 22.5);
      ctx.bezierCurveTo(56, 22.5, 56, 10, 46, 10);
      ctx.bezierCurveTo(38, 10, 32, 16, 32, 20);
      ctx.closePath();
      ctx.fill();
    }
    return new this.THREE.CanvasTexture(canvas);
  }

  /**
   * Khởi tạo Pool 12 Sprite hạt hiệu ứng tái sử dụng
   */
  private initParticlePool(): void {
    this.particleGroup = new this.THREE.Group();
    this.particleGroup.name = "ArParticles";

    const starTex = this.createStarTexture();
    const heartTex = this.createHeartTexture();

    for (let i = 0; i < 12; i++) {
      const isHeart = i % 3 === 0;
      const mat = new this.THREE.SpriteMaterial({
        map: isHeart ? heartTex : starTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new this.THREE.Sprite(mat);
      sprite.visible = false;
      this.particleGroup.add(sprite);

      this.particles.push({
        sprite,
        active: false,
        velocity: new this.THREE.Vector3(),
        lifetime: 0,
        maxLifetime: 1.0,
        rotSpeed: (Math.random() - 0.5) * 3,
        baseScale: isHeart ? 0.08 : 0.09,
      });
    }

    this.reactionGroup.add(this.particleGroup);
  }

  /**
   * Khởi tạo vòng sóng âm lan tỏa
   */
  private initRippleRings(maxModelSpan: number): void {
    this.rippleGroup = new this.THREE.Group();
    this.rippleGroup.name = "ArAudioRipples";

    const ringGeo = new this.THREE.RingGeometry(0.35, 0.42, 32);
    for (let i = 0; i < 3; i++) {
      const ringMat = new this.THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0,
        side: this.THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new this.THREE.Mesh(ringGeo, ringMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -0.008;
      mesh.visible = false;
      this.rippleGroup.add(mesh);

      this.ripples.push({
        mesh,
        active: false,
        age: 0,
        maxAge: 0.9,
        maxScale: Math.max(1.5, maxModelSpan * 1.8),
      });
    }

    this.reactionGroup.add(this.rippleGroup);
  }

  /**
   * Bắn chùm hạt sao & trái tim bay lên từ đỉnh con vật
   */
  public spawnReactionParticles(originY: number = 0.25): void {
    let spawned = 0;
    for (const p of this.particles) {
      if (!p.active && spawned < 8) {
        p.active = true;
        p.lifetime = 0;
        p.maxLifetime = 0.75 + Math.random() * 0.45;
        p.sprite.visible = true;
        p.sprite.material.opacity = 1.0;

        // Vị trí xuất phát ngẫu nhiên quanh phần trên của con vật
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.08;
        p.sprite.position.set(
          Math.cos(angle) * radius,
          originY + (Math.random() - 0.5) * 0.05,
          Math.sin(angle) * radius
        );

        // Vận tốc bay lên và tản ra ngoài hình nón
        const speed = 0.25 + Math.random() * 0.35;
        p.velocity.set(
          Math.cos(angle) * (0.08 + Math.random() * 0.12),
          speed,
          Math.sin(angle) * (0.08 + Math.random() * 0.12)
        );

        const s = p.baseScale * (0.8 + Math.random() * 0.4);
        p.sprite.scale.set(s, s, 1);
        spawned++;
      }
    }
  }

  /**
   * Kích hoạt sóng âm thanh lan tỏa quanh chân con vật
   */
  public triggerAudioRipple(): void {
    this.state.audioPulseTime = 1.0;

    this.ripples.forEach((r, idx) => {
      setTimeout(() => {
        r.active = true;
        r.age = 0;
        r.mesh.visible = true;
        r.mesh.scale.set(0.1, 0.1, 1);
      }, idx * 180);
    });
  }

  /**
   * Kích hoạt toàn diện hiệu ứng tương tác khi chạm vào con vật:
   * 1. Squash & Stretch bảo toàn thể tích
   * 2. Nhảy parabol giảm chấn
   * 3. Xoay lắc nhẹ ±12°
   * 4. Bắn sao nổi
   * 5. Crossfade sang animation clip nếu có
   */
  public triggerTapReaction(
    animations?: any[],
    actions?: Record<string, any>,
    currentPlayingClip?: string | null
  ): void {
    this.state.isJumping = true;
    this.state.jumpTime = 0;
    this.state.isSquashing = true;
    this.state.squashTime = 0;

    // Bắn hạt sao bay
    this.spawnReactionParticles(0.2);

    // Xử lý Crossfade Animation Clip phù hợp nếu model có animation
    if (animations && actions && animations.length > 0) {
      const candidates = ["jump", "nhay", "happy", "roar", "gam", "spin", "dance", "run"];
      let matchedClip = animations.find((clip: any) => {
        const name = (clip.name || "").toLowerCase();
        return candidates.some((c) => name.includes(c));
      });

      if (!matchedClip && animations.length > 1) {
        matchedClip = animations[1];
      }

      if (matchedClip && actions[matchedClip.name]) {
        const nextAction = actions[matchedClip.name];
        if (currentPlayingClip && actions[currentPlayingClip] && currentPlayingClip !== matchedClip.name) {
          this.prevClipName = currentPlayingClip;
          actions[currentPlayingClip].fadeOut(0.2);
        }

        nextAction.reset();
        nextAction.setLoop(this.THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = false;
        nextAction.fadeIn(0.18).play();
        this.activeReactionClipAction = nextAction;
      }
    }
  }

  /**
   * Cập nhật frame vật lý lò xo & hiệu ứng trong render loop
   */
  public update(dt: number): void {
    const s = this.state;

    // 1. Squash & Stretch + Nhảy Parabol
    if (s.isJumping) {
      s.jumpTime += dt;
      const t = s.jumpTime / s.jumpDuration;

      if (t <= 1.0) {
        // Quỹ đạo nhảy parabol với gia tốc trọng trường mượt mà
        const height = Math.sin(t * Math.PI) * s.jumpHeight;
        this.reactionGroup.position.y = height;

        // Xoay lắc nhẹ trục Y (±12°)
        s.wobbleAngle = Math.sin(t * Math.PI * 2) * (12 * (Math.PI / 180));
        this.reactionGroup.rotation.y = s.wobbleAngle;

        // Squash & Stretch bảo toàn thể tích:
        // Ban đầu nén nhẹ lấy đà (t < 0.15) -> Giãn theo Y khi bay lên (0.15 - 0.7) -> Tiếp đất nén nhẹ rồi về 1.0
        let scaleY = 1.0;
        if (t < 0.12) {
          scaleY = 1.0 - (t / 0.12) * 0.14; // Nén xuống 0.86
        } else if (t < 0.5) {
          const ratio = (t - 0.12) / 0.38;
          scaleY = 0.86 + ratio * 0.28; // Kéo giãn lên 1.14
        } else if (t < 0.85) {
          const ratio = (t - 0.5) / 0.35;
          scaleY = 1.14 - ratio * 0.22; // Rơi xuống 0.92
        } else {
          const ratio = (t - 0.85) / 0.15;
          scaleY = 0.92 + ratio * 0.08; // Phục hồi 1.0
        }

        // Bảo toàn thể tích (Volume Conservation): scaleX = scaleZ = 1 / sqrt(scaleY)
        const scaleXZ = 1 / Math.sqrt(Math.max(0.6, scaleY));
        this.reactionGroup.scale.set(scaleXZ, scaleY, scaleXZ);

        // Blob shadow co giãn và mờ dần theo độ cao
        if (this.blobShadowMesh) {
          const shadowFactor = 1.0 + height * 1.5;
          this.blobShadowMesh.scale.x = shadowFactor * 0.45;
          this.blobShadowMesh.scale.y = shadowFactor * 0.38;
          this.blobShadowMesh.material.opacity = Math.max(0.18, 0.55 - height * 1.8);
        }
      } else {
        // Kết thúc nhảy: Trả về trạng thái nguyên bản
        s.isJumping = false;
        this.reactionGroup.position.y = 0;
        this.reactionGroup.rotation.y = 0;
        this.reactionGroup.scale.set(1, 1, 1);
        if (this.blobShadowMesh) {
          this.blobShadowMesh.material.opacity = 0.55;
          this.blobShadowMesh.scale.set(0.45, 0.38, 1);
        }
      }
    }

    // 2. Hiệu ứng nhún nhẹ khi phát âm tiếng
    if (s.audioPulseTime > 0) {
      s.audioPulseTime -= dt * 1.8;
      const bob = Math.sin((1 - s.audioPulseTime) * Math.PI * 4) * 0.025;
      if (!s.isJumping) {
        this.reactionGroup.position.y = Math.max(0, bob);
        this.reactionGroup.rotation.z = Math.sin((1 - s.audioPulseTime) * Math.PI * 2) * 0.04;
      }
    }

    // 3. Cập nhật các hạt sao / trái tim bay lên
    for (const p of this.particles) {
      if (p.active) {
        p.lifetime += dt;
        if (p.lifetime >= p.maxLifetime) {
          p.active = false;
          p.sprite.visible = false;
        } else {
          // Bay lên chậm dần theo trọng lực nhẹ
          p.sprite.position.x += p.velocity.x * dt;
          p.sprite.position.y += p.velocity.y * dt;
          p.sprite.position.z += p.velocity.z * dt;
          p.velocity.y -= dt * 0.15; // Trọng lực nhẹ

          // Xoay nhẹ góc
          p.sprite.material.rotation += p.rotSpeed * dt;

          // Mờ dần về cuối vòng đời
          const progress = p.lifetime / p.maxLifetime;
          p.sprite.material.opacity = Math.max(0, 1.0 - Math.pow(progress, 1.5));
        }
      }
    }

    // 4. Cập nhật các vòng sóng âm lan tỏa
    for (const r of this.ripples) {
      if (r.active) {
        r.age += dt;
        if (r.age >= r.maxAge) {
          r.active = false;
          r.mesh.visible = false;
        } else {
          const prog = r.age / r.maxAge;
          const currentScale = 0.2 + prog * r.maxScale;
          r.mesh.scale.set(currentScale, currentScale, 1);
          r.mesh.material.opacity = (1 - prog) * 0.7;
        }
      }
    }
  }

  /**
   * Dọn dẹp GPU resources khi unmount
   */
  public dispose(): void {
    this.particles.forEach((p) => {
      if (p.sprite.material.map) p.sprite.material.map.dispose();
      p.sprite.material.dispose();
    });
    this.ripples.forEach((r) => {
      r.mesh.geometry.dispose();
      r.mesh.material.dispose();
    });
    if (this.blobShadowMesh) {
      this.blobShadowMesh.geometry.dispose();
      if (this.blobShadowMesh.material.map) this.blobShadowMesh.material.map.dispose();
      this.blobShadowMesh.material.dispose();
    }
  }
}
