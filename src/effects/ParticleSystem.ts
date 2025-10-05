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

  constructor(
    position: Vector2,
    velocity: Vector2,
    color: string = "#ffffff",
    life: number = 1000,
    size: number = 2
  ) {
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
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

    const alpha = this.life / this.maxLife;
    const currentSize = this.size * alpha;

    ctx.save();
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

  // Create explosion effect
  createExplosion(
    position: Vector2,
    color: string = "#ffffff",
    particleCount: number = 8
  ): void {
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      const velocity = Vector2Utils.fromAngle(angle, speed);
      const life = 500 + Math.random() * 1000;
      const size = 1 + Math.random() * 3;

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
}
