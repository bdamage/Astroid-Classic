import {GameObject} from "../core/GameObject";
import type {Vector2} from "../utils/Vector2";
import {Vector2Utils} from "../utils/Vector2";

export class Bullet extends GameObject {
  private lifeTime: number = 0;
  private maxLifeTime: number = 2000; // 2 seconds
  private speed: number = 400;
  private isPiercing: boolean = false;
  private damage: number = 1;
  private piercedTargets: Set<any> = new Set(); // Track what we've already hit

  constructor(position: Vector2, direction: number) {
    super(position, 2);
    this.velocity = Vector2Utils.fromAngle(direction, this.speed);
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    // Update lifetime
    this.lifeTime += deltaTime;
    if (this.lifeTime >= this.maxLifeTime) {
      this.destroy();
      return;
    }

    // Update position
    const deltaVelocity = Vector2Utils.multiply(
      this.velocity,
      deltaTime / 1000
    );
    this.position = Vector2Utils.add(this.position, deltaVelocity);

    // Wrap around screen (bullets wrap like everything else)
    this.wrapPosition(canvasWidth, canvasHeight);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();

    if (this.isPiercing) {
      // Draw glowing power bullet
      ctx.fillStyle = "#ff00ff";
      ctx.shadowColor = "#ff00ff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(
        this.position.x,
        this.position.y,
        this.radius * 1.5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Inner core
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(
        this.position.x,
        this.position.y,
        this.radius * 0.7,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else {
      // Normal bullet
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  setPiercing(piercing: boolean): void {
    this.isPiercing = piercing;
    if (piercing) {
      this.radius = 3; // Slightly larger for power bullets
    }
  }

  setDamage(damage: number): void {
    this.damage = damage;
  }

  getDamage(): number {
    return this.damage;
  }

  getIsPiercing(): boolean {
    return this.isPiercing;
  }

  hasHitTarget(target: any): boolean {
    return this.piercedTargets.has(target);
  }

  addHitTarget(target: any): void {
    this.piercedTargets.add(target);
  }

  shouldDestroyOnHit(): boolean {
    return !this.isPiercing;
  }
}
