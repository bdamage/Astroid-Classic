import {GameObject} from "../core/GameObject";
import type {Vector2} from "../utils/Vector2";

export class BossProjectile extends GameObject {
  private speed: number = 200;
  private color: string;
  private lifetime: number = 5000; // 5 seconds max lifetime
  private age: number = 0;

  constructor(position: Vector2, direction: Vector2, color: string = "#ff0000") {
    super(position, 6);
    this.velocity = {
      x: direction.x * this.speed,
      y: direction.y * this.speed,
    };
    this.color = color;
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    this.age += deltaTime;

    // Deactivate after lifetime
    if (this.age >= this.lifetime) {
      this.active = false;
      return;
    }

    // Update position
    this.position.x += this.velocity.x * (deltaTime / 1000);
    this.position.y += this.velocity.y * (deltaTime / 1000);

    // Check bounds - deactivate if out of screen
    if (
      this.position.x < -this.radius ||
      this.position.x > canvasWidth + this.radius ||
      this.position.y < -this.radius ||
      this.position.y > canvasHeight + this.radius
    ) {
      this.active = false;
    }

    this.rotation += (deltaTime / 1000) * Math.PI * 2;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    // Glowing projectile
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, this.color + "aa");
    gradient.addColorStop(1, this.color + "00");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
