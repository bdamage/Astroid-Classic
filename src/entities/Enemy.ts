import {GameObject} from "../core/GameObject";
import type {Vector2} from "../utils/Vector2";
import {Vector2Utils} from "../utils/Vector2";

export const EnemyType = {
  SCOUT: "scout",
  FIGHTER: "fighter",
  BOMBER: "bomber",
} as const;

export type EnemyType = (typeof EnemyType)[keyof typeof EnemyType];

export interface EnemyConfig {
  type: EnemyType;
  health: number;
  speed: number;
  score: number;
  color: string;
  size: number;
  fireRate: number; // milliseconds between shots
  aggressiveness: number; // 0-1, how aggressively they pursue player
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.SCOUT]: {
    type: EnemyType.SCOUT,
    health: 1,
    speed: 120,
    score: 100,
    color: "#ffff00",
    size: 8,
    fireRate: 2000,
    aggressiveness: 0.7,
  },
  [EnemyType.FIGHTER]: {
    type: EnemyType.FIGHTER,
    health: 2,
    speed: 80,
    score: 200,
    color: "#ff6600",
    size: 12,
    fireRate: 1500,
    aggressiveness: 0.8,
  },
  [EnemyType.BOMBER]: {
    type: EnemyType.BOMBER,
    health: 3,
    speed: 50,
    score: 300,
    color: "#ff0000",
    size: 16,
    fireRate: 3000,
    aggressiveness: 0.5,
  },
};

export class Enemy extends GameObject {
  private enemyType: EnemyType;
  private config: EnemyConfig;
  private health: number;
  private lastShotTime: number = 0;
  private target: Vector2 | null = null;
  private wanderAngle: number = 0;
  private wanderTime: number = 0;
  private thrustPhase: number = 0;

  constructor(position: Vector2, type: EnemyType) {
    const config = ENEMY_CONFIGS[type];
    super(position, config.size);

    this.enemyType = type;
    this.config = config;
    this.health = config.health;

    // Random initial rotation
    this.rotation = Math.random() * Math.PI * 2;
    this.velocity = Vector2Utils.fromAngle(this.rotation, config.speed);
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    this.thrustPhase += 3 * (deltaTime / 1000);
    this.wanderTime += deltaTime;

    // Update AI behavior
    this.updateAI(deltaTime);

    // Update position
    const deltaVelocity = Vector2Utils.multiply(
      this.velocity,
      deltaTime / 1000
    );
    this.position = Vector2Utils.add(this.position, deltaVelocity);

    // Wrap around screen
    if (this.position.x < -this.radius)
      this.position.x = canvasWidth + this.radius;
    if (this.position.x > canvasWidth + this.radius)
      this.position.x = -this.radius;
    if (this.position.y < -this.radius)
      this.position.y = canvasHeight + this.radius;
    if (this.position.y > canvasHeight + this.radius)
      this.position.y = -this.radius;
  }

  private updateAI(deltaTime: number): void {
    if (!this.target) {
      // Wander behavior when no target
      if (this.wanderTime > 1000) {
        // Change direction every second
        this.wanderAngle += (Math.random() - 0.5) * Math.PI;
        this.wanderTime = 0;
      }

      this.rotation = this.wanderAngle;
      this.velocity = Vector2Utils.fromAngle(
        this.rotation,
        this.config.speed * 0.5
      );
      return;
    }

    // Pursue target with some randomness
    const targetDirection = Vector2Utils.subtract(this.target, this.position);
    const targetAngle = Math.atan2(targetDirection.y, targetDirection.x);

    // Add some wandering to make movement less predictable
    const wanderInfluence = Math.sin(this.wanderTime * 0.003) * 0.5;
    const finalAngle = targetAngle + wanderInfluence;

    // Smoothly turn towards target
    let angleDiff = finalAngle - this.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const turnSpeed = 2 * (deltaTime / 1000);
    if (Math.abs(angleDiff) < turnSpeed) {
      this.rotation = finalAngle;
    } else {
      this.rotation += Math.sign(angleDiff) * turnSpeed;
    }

    // Move forward with aggressiveness factor
    const speed = this.config.speed * this.config.aggressiveness;
    this.velocity = Vector2Utils.fromAngle(this.rotation, speed);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Move to enemy position
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    // Draw engine glow
    if (this.target) {
      const glowIntensity = 0.3 + 0.3 * Math.sin(this.thrustPhase);
      ctx.fillStyle = `rgba(255, 100, 0, ${glowIntensity})`;
      ctx.beginPath();
      ctx.arc(-this.radius * 0.8, 0, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw enemy ship based on type
    ctx.strokeStyle = this.config.color;
    ctx.fillStyle = this.config.color + "40"; // Semi-transparent fill
    ctx.lineWidth = 2;

    if (this.enemyType === EnemyType.SCOUT) {
      this.drawScout(ctx);
    } else if (this.enemyType === EnemyType.FIGHTER) {
      this.drawFighter(ctx);
    } else {
      this.drawBomber(ctx);
    }

    // Draw health indicator
    this.drawHealthBar(ctx);

    ctx.restore();
  }

  private drawScout(ctx: CanvasRenderingContext2D): void {
    // Simple triangle for scout
    ctx.beginPath();
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(-this.radius * 0.5, -this.radius * 0.5);
    ctx.lineTo(-this.radius * 0.5, this.radius * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawFighter(ctx: CanvasRenderingContext2D): void {
    // More angular fighter design
    ctx.beginPath();
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(-this.radius * 0.3, -this.radius * 0.7);
    ctx.lineTo(-this.radius * 0.6, -this.radius * 0.3);
    ctx.lineTo(-this.radius * 0.6, this.radius * 0.3);
    ctx.lineTo(-this.radius * 0.3, this.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawBomber(ctx: CanvasRenderingContext2D): void {
    // Larger, more rectangular bomber
    ctx.beginPath();
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(-this.radius * 0.2, -this.radius * 0.8);
    ctx.lineTo(-this.radius * 0.8, -this.radius * 0.5);
    ctx.lineTo(-this.radius * 0.8, this.radius * 0.5);
    ctx.lineTo(-this.radius * 0.2, this.radius * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D): void {
    if (this.health >= this.config.health) return; // Don't show full health

    const barWidth = this.radius * 1.5;
    const barHeight = 3;
    const y = -this.radius - 8;

    // Background
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fillRect(-barWidth / 2, y, barWidth, barHeight);

    // Health
    const healthPercentage = this.health / this.config.health;
    ctx.fillStyle = healthPercentage > 0.5 ? "#00ff00" : "#ffff00";
    if (healthPercentage <= 0.25) ctx.fillStyle = "#ff0000";

    ctx.fillRect(-barWidth / 2, y, barWidth * healthPercentage, barHeight);
  }

  setTarget(target: Vector2): void {
    this.target = target;
  }

  clearTarget(): void {
    this.target = null;
  }

  canShoot(): boolean {
    const currentTime = Date.now();
    return currentTime - this.lastShotTime >= this.config.fireRate;
  }

  shoot(): Vector2 | null {
    if (!this.canShoot() || !this.target) return null;

    this.lastShotTime = Date.now();

    // Return bullet spawn position (front of enemy)
    return Vector2Utils.add(
      this.position,
      Vector2Utils.fromAngle(this.rotation, this.radius)
    );
  }

  takeDamage(damage: number = 1): boolean {
    this.health -= damage;
    return this.health <= 0;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.config.health;
  }

  getType(): EnemyType {
    return this.enemyType;
  }

  getScore(): number {
    return this.config.score;
  }

  getFrontPosition(): Vector2 {
    return Vector2Utils.add(
      this.position,
      Vector2Utils.fromAngle(this.rotation, this.radius)
    );
  }
}
