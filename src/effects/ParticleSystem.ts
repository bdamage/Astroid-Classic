import type {Vector2} from "../utils/Vector2";
import {Vector2Utils} from "../utils/Vector2";

export class Particle {
  public position: Vector2;
  public velocity: Vector2;
  public color: string;
  public life: number;
  public maxLife: number;
  public size: number;
  public active: boolean = true;
  public brightness: number = 1; // For glowing effects
  public fadeMode: "linear" | "exponential" | "flash" = "linear";
  public isTrail: boolean = false; // For trail effects
  public isShockwave: boolean = false; // For expanding shockwave rings
  public rotation: number = 0; // For rotating particles
  public rotationSpeed: number = 0; // Rotation velocity

  constructor(
    position: Vector2,
    velocity: Vector2,
    color: string = "#ffffff",
    life: number = 1000,
    size: number = 2,
    brightness: number = 1,
    fadeMode: "linear" | "exponential" | "flash" = "linear",
    isTrail: boolean = false,
    isShockwave: boolean = false,
    rotationSpeed: number = 0
  ) {
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.brightness = brightness;
    this.fadeMode = fadeMode;
    this.isTrail = isTrail;
    this.isShockwave = isShockwave;
    this.rotationSpeed = rotationSpeed;
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    this.life -= deltaTime;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    // Update rotation
    if (this.rotationSpeed !== 0) {
      this.rotation += this.rotationSpeed * (deltaTime / 1000);
    }

    // Update position
    if (!this.isShockwave) {
      const deltaVelocity = Vector2Utils.multiply(
        this.velocity,
        deltaTime / 1000
      );
      this.position = Vector2Utils.add(this.position, deltaVelocity);

      // Apply friction (less for trails)
      const friction = this.isTrail ? 0.95 : 0.98;
      this.velocity = Vector2Utils.multiply(this.velocity, friction);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    let alpha: number;
    switch (this.fadeMode) {
      case "exponential":
        alpha = Math.pow(this.life / this.maxLife, 2);
        break;
      case "flash":
        const t = this.life / this.maxLife;
        alpha = t < 0.7 ? 1 : (t - 0.7) / 0.3; // Flash bright then fade
        break;
      default:
        alpha = this.life / this.maxLife;
    }

    // Size varies by particle type
    let currentSize: number;
    if (this.isShockwave) {
      // Shockwaves expand over time
      currentSize = this.size * (1 + (1 - this.life / this.maxLife) * 3);
    } else if (this.isTrail) {
      // Trails shrink over time
      currentSize = this.size * alpha;
    } else {
      // Normal particles
      currentSize = this.size * (0.5 + alpha * 0.5);
    }

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    if (this.rotationSpeed !== 0) {
      ctx.rotate(this.rotation);
    }

    // Create glow effect for bright particles
    if (this.brightness > 1 && !this.isShockwave) {
      const glowSize = currentSize * this.brightness;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);

      // Parse color for glow effect
      const color = this.color;
      gradient.addColorStop(
        0,
        color.replace(")", `, ${alpha})`).replace("rgb", "rgba")
      );
      gradient.addColorStop(
        0.5,
        color.replace(")", `, ${alpha * 0.5})`).replace("rgb", "rgba")
      );
      gradient.addColorStop(
        1,
        color.replace(")", ", 0)").replace("rgb", "rgba")
      );

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main particle
    ctx.globalAlpha = alpha;

    if (this.isShockwave) {
      // Render as expanding ring
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, this.size * alpha * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.isTrail) {
      // Render as elongated trail
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, currentSize, currentSize * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal circular particle
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];

  update(deltaTime: number): void {
    this.particles.forEach((particle) => particle.update(deltaTime));
    this.particles = this.particles.filter((particle) => particle.active);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach((particle) => particle.render(ctx));
  }

  // Create enhanced explosion effect
  createExplosion(
    position: Vector2,
    color: string = "#ffffff",
    particleCount: number = 8,
    intensity: "normal" | "bright" | "massive" = "normal"
  ): void {
    let baseSpeed = 50;
    let maxSpeed = 100;
    let baseLife = 500;
    let maxLife = 1000;
    let baseSize = 0.5;
    let maxSize = 1.5;
    let brightness = 0.8;

    // Adjust parameters based on intensity
    switch (intensity) {
      case "bright":
        baseSpeed = 80;
        maxSpeed = 150;
        baseLife = 800;
        maxLife = 1500;
        baseSize = 1;
        maxSize = 2.5;
        brightness = 1.2;
        particleCount = Math.ceil(particleCount * 1.5);
        break;
      case "massive":
        baseSpeed = 120;
        maxSpeed = 200;
        baseLife = 1000;
        maxLife = 2000;
        baseSize = 1.5;
        maxSize = 3.5;
        brightness = 1.5;
        particleCount = particleCount * 2;
        break;
    }

    // Create main explosion particles
    for (let i = 0; i < particleCount; i++) {
      const angle =
        (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = baseSpeed + Math.random() * (maxSpeed - baseSpeed);
      const velocity = Vector2Utils.fromAngle(angle, speed);
      const life = baseLife + Math.random() * (maxLife - baseLife);
      const size = baseSize + Math.random() * (maxSize - baseSize);

      this.particles.push(
        new Particle(
          {x: position.x, y: position.y},
          velocity,
          color,
          life,
          size,
          brightness,
          intensity === "massive" ? "flash" : "exponential"
        )
      );
    }

    // Add bright flash particles for enhanced explosions
    if (intensity !== "normal") {
      for (let i = 0; i < 3; i++) {
        const flashSize = intensity === "massive" ? 4 : 3;
        this.particles.push(
          new Particle(
            {x: position.x, y: position.y},
            {x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20},
            "#dddddd",
            200,
            flashSize,
            1.5,
            "flash"
          )
        );
      }
    }
  }

  // Create thrust particles
  createThrustParticles(position: Vector2, direction: number): void {
    const numParticles = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numParticles; i++) {
      const spread = 0.5; // Spread angle in radians
      const angle = direction + Math.PI + (Math.random() - 0.5) * spread;
      const speed = 50 + Math.random() * 50;
      const velocity = Vector2Utils.fromAngle(angle, speed);
      const life = 200 + Math.random() * 300;
      const size = 1 + Math.random() * 2;

      // Orange/red thrust colors
      const colors = ["#ff6600", "#ff9933", "#ffaa44", "#ff4400"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push(
        new Particle(
          {x: position.x, y: position.y},
          velocity,
          color,
          life,
          size
        )
      );
    }
  }

  // Create debris particles
  createDebris(position: Vector2, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 80;
      const velocity = Vector2Utils.fromAngle(angle, speed);
      const life = 1000 + Math.random() * 2000;
      const size = 1 + Math.random() * 2;

      this.particles.push(
        new Particle(
          {x: position.x, y: position.y},
          velocity,
          "#cccccc",
          life,
          size
        )
      );
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
  }

  // Create power-up collection effect
  createPowerUpEffect(position: Vector2, color: string): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      const velocity = Vector2Utils.fromAngle(angle, speed);

      this.particles.push(
        new Particle(
          {x: position.x, y: position.y},
          velocity,
          color,
          800,
          1 + Math.random(),
          1.2,
          "exponential"
        )
      );
    }

    // Add sparkles
    for (let i = 0; i < 4; i++) {
      this.particles.push(
        new Particle(
          {
            x: position.x + (Math.random() - 0.5) * 30,
            y: position.y + (Math.random() - 0.5) * 30,
          },
          {x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40},
          "#cccccc",
          600,
          0.8,
          1.5,
          "flash"
        )
      );
    }
  }

  // Create shield hit effect
  createShieldHitEffect(position: Vector2): void {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      const velocity = Vector2Utils.fromAngle(angle, speed);

      this.particles.push(
        new Particle(
          {x: position.x, y: position.y},
          velocity,
          "#00ffff",
          400,
          1 + Math.random(),
          1.5,
          "linear"
        )
      );
    }
  }

  // Create hyperspace effect
  createHyperspaceEffect(fromPosition: Vector2, toPosition: Vector2): void {
    // Trail from old position
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const pos = {
        x: fromPosition.x + (toPosition.x - fromPosition.x) * t,
        y: fromPosition.y + (toPosition.y - fromPosition.y) * t,
      };

      this.particles.push(
        new Particle(
          pos,
          {x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100},
          "#9900ff",
          300 + Math.random() * 200,
          1 + Math.random() * 2,
          2,
          "exponential"
        )
      );
    }
  }

  // Create enemy destruction effect
  createEnemyExplosion(position: Vector2, enemyType: string): void {
    let color = "#ff6600";
    let intensity: "normal" | "bright" | "massive" = "normal";

    switch (enemyType) {
      case "scout":
        color = "#ffff00";
        intensity = "normal";
        break;
      case "fighter":
        color = "#ff6600";
        intensity = "bright";
        break;
      case "bomber":
        color = "#ff0000";
        intensity = "massive";
        break;
    }

    this.createExplosion(position, color, 12, intensity);
    this.createShockwave(position, color, 30);
  }

  // Create expanding shockwave ring
  createShockwave(
    position: Vector2,
    color: string = "#ffffff",
    size: number = 20
  ): void {
    this.particles.push(
      new Particle(
        {x: position.x, y: position.y},
        {x: 0, y: 0},
        color,
        400,
        size,
        2,
        "linear",
        false,
        true,
        0
      )
    );
  }

  // Create missile trail effect
  createMissileTrail(
    position: Vector2,
    direction: number,
    color: string = "#ff9900"
  ): void {
    const numTrails = 2;
    for (let i = 0; i < numTrails; i++) {
      const angle = direction + Math.PI + (Math.random() - 0.5) * 0.3;
      const speed = 30 + Math.random() * 20;
      const velocity = Vector2Utils.fromAngle(angle, speed);

      this.particles.push(
        new Particle(
          {x: position.x, y: position.y},
          velocity,
          color,
          300 + Math.random() * 200,
          2 + Math.random(),
          1.5,
          "exponential",
          true,
          false,
          (Math.random() - 0.5) * 5
        )
      );
    }
  }

  // Create combo burst effect
  createComboBurst(position: Vector2, comboCount: number): void {
    const colors = ["#cccc00", "#cc8800", "#cc00cc", "#00cccc"];
    const particleCount = Math.min(15 + comboCount, 35);
    const intensity = Math.min(comboCount / 10, 2);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 100 + Math.random() * 100 * intensity;
      const velocity = Vector2Utils.fromAngle(angle, speed);
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push(
        new Particle(
          {x: position.x, y: position.y},
          velocity,
          color,
          600 + Math.random() * 400,
          1 + Math.random(),
          1 + intensity * 0.5,
          "exponential",
          false,
          false,
          (Math.random() - 0.5) * 10
        )
      );
    }

    // Add shockwave for high combos
    if (comboCount >= 10) {
      this.createShockwave(position, "#cccc00", 30);
    }
  }

  // Create sparks on impact
  createSparks(position: Vector2, direction: number, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const spread = Math.PI / 3;
      const angle = direction + (Math.random() - 0.5) * spread;
      const speed = 80 + Math.random() * 120;
      const velocity = Vector2Utils.fromAngle(angle, speed);
      const colors = ["#cccccc", "#cccc99", "#cc9966"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push(
        new Particle(
          {x: position.x, y: position.y},
          velocity,
          color,
          200 + Math.random() * 300,
          0.8 + Math.random() * 0.4,
          1,
          "linear",
          true,
          false,
          (Math.random() - 0.5) * 15
        )
      );
    }
  }
}
