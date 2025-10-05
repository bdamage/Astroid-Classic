import type {Vector2} from "../utils/Vector2";

export abstract class GameObject {
  public position: Vector2;
  public velocity: Vector2;
  public rotation: number;
  public radius: number;
  public active: boolean;

  constructor(position: Vector2, radius: number = 10) {
    this.position = position;
    this.velocity = {x: 0, y: 0};
    this.rotation = 0;
    this.radius = radius;
    this.active = true;
  }

  abstract update(
    deltaTime: number,
    canvasWidth: number,
    canvasHeight: number
  ): void;
  abstract render(ctx: CanvasRenderingContext2D): void;

  // Wrap around screen edges
  protected wrapPosition(canvasWidth: number, canvasHeight: number): void {
    if (this.position.x < -this.radius) {
      this.position.x = canvasWidth + this.radius;
    } else if (this.position.x > canvasWidth + this.radius) {
      this.position.x = -this.radius;
    }

    if (this.position.y < -this.radius) {
      this.position.y = canvasHeight + this.radius;
    } else if (this.position.y > canvasHeight + this.radius) {
      this.position.y = -this.radius;
    }
  }

  // Simple circular collision detection
  checkCollision(other: GameObject): boolean {
    if (!this.active || !other.active) return false;

    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.radius + other.radius;
  }

  destroy(): void {
    this.active = false;
  }
}
