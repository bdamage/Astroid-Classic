import {GameObject} from "../core/GameObject";
import type {Vector2} from "../utils/Vector2";
import {Vector2Utils} from "../utils/Vector2";

export const AsteroidSize = {
  LARGE: "large",
  MEDIUM: "medium",
  SMALL: "small",
} as const;

export type AsteroidSize = (typeof AsteroidSize)[keyof typeof AsteroidSize];

export class Asteroid extends GameObject {
  private rotationSpeed: number;
  private size: AsteroidSize;
  private vertices: Vector2[];

  constructor(position: Vector2, velocity: Vector2, size: AsteroidSize) {
    const radius = Asteroid.getRadiusForSize(size);
    super(position, radius);

    this.velocity = velocity;
    this.size = size;
    this.rotationSpeed = (Math.random() - 0.5) * 2; // Random rotation speed
    this.vertices = this.generateVertices();
  }

  static getRadiusForSize(size: AsteroidSize): number {
    switch (size) {
      case AsteroidSize.LARGE:
        return 40;
      case AsteroidSize.MEDIUM:
        return 25;
      case AsteroidSize.SMALL:
        return 15;
    }
  }

  static getScoreForSize(size: AsteroidSize): number {
    switch (size) {
      case AsteroidSize.LARGE:
        return 20;
      case AsteroidSize.MEDIUM:
        return 50;
      case AsteroidSize.SMALL:
        return 100;
    }
  }

  private generateVertices(): Vector2[] {
    const vertices: Vector2[] = [];
    const numVertices = 8 + Math.floor(Math.random() * 4); // 8-11 vertices

    for (let i = 0; i < numVertices; i++) {
      const angle = (i / numVertices) * Math.PI * 2;
      const radiusVariation = this.radius * (0.7 + Math.random() * 0.3); // Vary radius for irregular shape
      vertices.push(Vector2Utils.fromAngle(angle, radiusVariation));
    }

    return vertices;
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    // Update rotation
    this.rotation += this.rotationSpeed * (deltaTime / 1000);

    // Update position
    const deltaVelocity = Vector2Utils.multiply(
      this.velocity,
      deltaTime / 1000
    );
    this.position = Vector2Utils.add(this.position, deltaVelocity);

    // Wrap around screen
    this.wrapPosition(canvasWidth, canvasHeight);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.vertices.length === 0) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const firstVertex = this.vertices[0];
    ctx.moveTo(firstVertex.x, firstVertex.y);

    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }

    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  // Split asteroid into smaller pieces
  split(): Asteroid[] {
    if (this.size === AsteroidSize.SMALL) {
      return []; // Small asteroids don't split
    }

    const newSize =
      this.size === AsteroidSize.LARGE
        ? AsteroidSize.MEDIUM
        : AsteroidSize.SMALL;
    const fragments: Asteroid[] = [];
    const numFragments = 2;

    for (let i = 0; i < numFragments; i++) {
      // Create random velocity for fragment
      const speed = 50 + Math.random() * 100;
      const angle = Math.random() * Math.PI * 2;
      const fragmentVelocity = Vector2Utils.fromAngle(angle, speed);

      // Slightly offset position to prevent overlap
      const offsetDistance = this.radius * 0.5;
      const offsetAngle = (i / numFragments) * Math.PI * 2;
      const fragmentPosition = Vector2Utils.add(
        this.position,
        Vector2Utils.fromAngle(offsetAngle, offsetDistance)
      );

      fragments.push(new Asteroid(fragmentPosition, fragmentVelocity, newSize));
    }

    return fragments;
  }

  getSize(): AsteroidSize {
    return this.size;
  }

  getScore(): number {
    return Asteroid.getScoreForSize(this.size);
  }

  // Static method to create random asteroid
  static createRandom(
    canvasWidth: number,
    canvasHeight: number,
    safeZone?: Vector2
  ): Asteroid {
    let position: Vector2;

    // Keep trying until we find a position outside the safe zone
    do {
      position = {
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
      };
    } while (safeZone && Vector2Utils.distance(position, safeZone) < 100);

    const speed = 30 + Math.random() * 70;
    const angle = Math.random() * Math.PI * 2;
    const velocity = Vector2Utils.fromAngle(angle, speed);

    return new Asteroid(position, velocity, AsteroidSize.LARGE);
  }
}
