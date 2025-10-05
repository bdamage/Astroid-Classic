import {GameObject} from "../core/GameObject";
import type {Vector2} from "../utils/Vector2";
import {Vector2Utils} from "../utils/Vector2";

export class HomingMissile extends GameObject {
  private target: GameObject | null = null;
  private speed: number = 150;
  private turnSpeed: number = 3; // Radians per second
  private lifeTime: number = 8000; // 8 seconds max
  private age: number = 0;
  private trailParticles: Vector2[] = [];
  private glowPhase: number = 0;

  constructor(position: Vector2, rotation: number) {
    super(position, 3);
    this.rotation = rotation;
    this.velocity = Vector2Utils.fromAngle(rotation, this.speed);
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    this.age += deltaTime;
    this.glowPhase += 8 * (deltaTime / 1000);

    // Remove if too old
    if (this.age > this.lifeTime) {
      this.active = false;
      return;
    }

    // Find target if we don't have one
    if (!this.target || !this.target.active) {
      this.target = this.findNearestTarget();
    }

    // Home in on target
    if (this.target) {
      const targetDirection = Vector2Utils.subtract(
        this.target.position,
        this.position
      );
      const targetAngle = Math.atan2(targetDirection.y, targetDirection.x);

      // Calculate angle difference
      let angleDiff = targetAngle - this.rotation;

      // Normalize angle difference
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Turn towards target
      const maxTurn = this.turnSpeed * (deltaTime / 1000);
      if (Math.abs(angleDiff) < maxTurn) {
        this.rotation = targetAngle;
      } else {
        this.rotation += Math.sign(angleDiff) * maxTurn;
      }

      // Update velocity based on new rotation
      this.velocity = Vector2Utils.fromAngle(this.rotation, this.speed);
    }

    // Add trail particle
    this.trailParticles.push({...this.position});
    if (this.trailParticles.length > 8) {
      this.trailParticles.shift();
    }

    // Update position
    const deltaVelocity = Vector2Utils.multiply(
      this.velocity,
      deltaTime / 1000
    );
    this.position = Vector2Utils.add(this.position, deltaVelocity);

    // Wrap around screen
    if (this.position.x < 0) this.position.x = canvasWidth;
    if (this.position.x > canvasWidth) this.position.x = 0;
    if (this.position.y < 0) this.position.y = canvasHeight;
    if (this.position.y > canvasHeight) this.position.y = 0;
  }

  private findNearestTarget(): GameObject | null {
    // This will be set by the game manager when updating
    return null;
  }

  setTargets(targets: GameObject[]): void {
    if (!this.target || !this.target.active) {
      let nearest: GameObject | null = null;
      let nearestDistance = Infinity;

      for (const target of targets) {
        if (!target.active) continue;

        const distance = Vector2Utils.distance(this.position, target.position);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = target;
        }
      }

      this.target = nearest;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Draw trail
    for (let i = 0; i < this.trailParticles.length; i++) {
      const particle = this.trailParticles[i];
      const alpha = ((i + 1) / this.trailParticles.length) * 0.6;

      ctx.fillStyle = `rgba(255, 153, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Move to missile position
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    // Draw missile body
    const glowIntensity = 0.5 + 0.5 * Math.sin(this.glowPhase);
    ctx.fillStyle = `rgba(255, 153, 0, ${glowIntensity})`;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, -2);
    ctx.lineTo(-4, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw fins
    ctx.strokeStyle = "#ff9900";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.lineTo(-6, -4);
    ctx.moveTo(-4, 2);
    ctx.lineTo(-6, 4);
    ctx.stroke();

    // Draw exhaust
    ctx.fillStyle = `rgba(255, 100, 0, ${glowIntensity * 0.8})`;
    ctx.beginPath();
    ctx.moveTo(-4, -1);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-4, 1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  getTarget(): GameObject | null {
    return this.target;
  }
}
