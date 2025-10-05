import {GameObject} from "../core/GameObject";
import type {Vector2} from "../utils/Vector2";
import {Vector2Utils} from "../utils/Vector2";

export class Spaceship extends GameObject {
  private thrust: number = 0;
  private turnSpeed: number = 0;
  private maxSpeed: number = 300;
  private thrustPower: number = 200;
  private rotationSpeed: number = 3;
  private friction: number = 0.98;
  private invulnerable: boolean = false;
  private invulnerabilityTime: number = 0;
  private maxInvulnerabilityTime: number = 1500; // Reduced to 1.5 seconds

  constructor(position: Vector2) {
    super(position, 8);
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    // Handle invulnerability
    if (this.invulnerable) {
      this.invulnerabilityTime -= deltaTime;
      if (this.invulnerabilityTime <= 0) {
        this.invulnerable = false;
      }
    }

    // Apply rotation
    this.rotation += this.turnSpeed * this.rotationSpeed * (deltaTime / 1000);

    // Apply thrust
    if (this.thrust > 0) {
      const thrustVector = Vector2Utils.fromAngle(
        this.rotation,
        this.thrustPower * (deltaTime / 1000)
      );
      this.velocity = Vector2Utils.add(this.velocity, thrustVector);
    }

    // Apply friction
    this.velocity = Vector2Utils.multiply(this.velocity, this.friction);

    // Limit max speed
    const speed = Vector2Utils.magnitude(this.velocity);
    if (speed > this.maxSpeed) {
      this.velocity = Vector2Utils.multiply(
        Vector2Utils.normalize(this.velocity),
        this.maxSpeed
      );
    }

    // Update position
    const deltaVelocity = Vector2Utils.multiply(
      this.velocity,
      deltaTime / 1000
    );
    this.position = Vector2Utils.add(this.position, deltaVelocity);

    // Wrap around screen
    this.wrapPosition(canvasWidth, canvasHeight);

    // Reset input values
    this.thrust = 0;
    this.turnSpeed = 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    // Make ship blink when invulnerable
    if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
      ctx.restore();
      return;
    }

    // Draw ship body
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.stroke();

    // Draw thrust flame if thrusting
    if (this.thrust > 0) {
      ctx.strokeStyle = "#ff6600";
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-4, 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Input methods
  setThrust(value: number): void {
    this.thrust = Math.max(0, Math.min(1, value));
  }

  setTurnSpeed(value: number): void {
    this.turnSpeed = Math.max(-1, Math.min(1, value));
  }

  // Get the front of the ship for bullet spawning
  getFrontPosition(): Vector2 {
    return Vector2Utils.add(
      this.position,
      Vector2Utils.fromAngle(this.rotation, 12)
    );
  }

  // Reset ship to starting position
  reset(position: Vector2): void {
    this.position = position;
    this.velocity = Vector2Utils.create(0, 0);
    this.rotation = 0;
    this.active = true;
    this.makeInvulnerable();
  }

  // Make ship temporarily invulnerable
  public makeInvulnerable(): void {
    this.invulnerable = true;
    this.invulnerabilityTime = this.maxInvulnerabilityTime;
  }

  // Check if ship can be damaged
  canTakeDamage(): boolean {
    return !this.invulnerable;
  }
}
