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

  constructor(
    position: Vector2,
    velocity: Vector2,
    color: string = "#ffffff",
    life: number = 1000,
    size: number = 2,
    brightness: number = 1,
    fadeMode: "linear" | "exponential" | "flash" = "linear"
  ) {
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.brightness = brightness;
    this.fadeMode = fadeMode;
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    this.life -= deltaTime;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    // Update position
    const deltaVelocity = Vector2Utils.multiply(
      this.velocity,
      deltaTime / 1000
    );
    this.position = Vector2Utils.add(this.position, deltaVelocity);

    // Apply some friction
    this.velocity = Vector2Utils.multiply(this.velocity, 0.98);
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

    const currentSize = this.size * (0.5 + alpha * 0.5); // Size based on life

    ctx.save();

    // Create glow effect for bright particles
    if (this.brightness > 1) {
      const glowSize = currentSize * this.brightness;
      const gradient = ctx.createRadialGradient(
        this.position.x,
        this.position.y,
        0,
        this.position.x,
        this.position.y,
        glowSize
      );

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
      ctx.arc(this.position.x, this.position.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main particle
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, currentSize, 0, Math.PI * 2);
    ctx.fill();

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
    let baseSize = 1;
    let maxSize = 3;
    let brightness = 1;

    // Adjust parameters based on intensity
    switch (intensity) {
      case "bright":
        baseSpeed = 80;
        maxSpeed = 150;
        baseLife = 800;
        maxLife = 1500;
        baseSize = 2;
        maxSize = 5;
        brightness = 2;
        particleCount = Math.ceil(particleCount * 1.5);
        break;
      case "massive":
        baseSpeed = 120;
        maxSpeed = 200;
        baseLife = 1000;
        maxLife = 2000;
        baseSize = 3;
        maxSize = 7;
        brightness = 3;
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
      for (let i = 0; i < 4; i++) {
        const flashSize = intensity === "massive" ? 12 : 8;
        this.particles.push(
          new Particle(
            {x: position.x, y: position.y},
            {x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20},
            "#ffffff",
            200,
            flashSize,
            4,
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
          2 + Math.random() * 2,
          2,
          "exponential"
        )
      );
    }

    // Add sparkles
    for (let i = 0; i < 6; i++) {
      this.particles.push(
        new Particle(
          {
            x: position.x + (Math.random() - 0.5) * 30,
            y: position.y + (Math.random() - 0.5) * 30,
          },
          {x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40},
          "#ffffff",
          600,
          1,
          3,
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
  }
}
