import {GameObject} from "../core/GameObject";
import type {Vector2} from "../utils/Vector2";

export const BossType = {
  MOTHERSHIP: "mothership",
  FORTRESS: "fortress",
  SWARM_COMMANDER: "swarmCommander",
} as const;

export type BossType = (typeof BossType)[keyof typeof BossType];

interface BossConfig {
  maxHealth: number;
  speed: number;
  size: number;
  color: string;
  scoreValue: number;
  attackCooldown: number;
}

const BOSS_CONFIGS: Record<BossType, BossConfig> = {
  [BossType.MOTHERSHIP]: {
    maxHealth: 100,
    speed: 80,
    size: 60,
    color: "#ff00ff",
    scoreValue: 5000,
    attackCooldown: 2000,
  },
  [BossType.FORTRESS]: {
    maxHealth: 150,
    speed: 50,
    size: 80,
    color: "#00ffff",
    scoreValue: 7500,
    attackCooldown: 1500,
  },
  [BossType.SWARM_COMMANDER]: {
    maxHealth: 80,
    speed: 120,
    size: 50,
    color: "#ffff00",
    scoreValue: 4000,
    attackCooldown: 3000,
  },
};

export class Boss extends GameObject {
  private bossType: BossType;
  private config: BossConfig;
  private health: number;
  private maxHealth: number;
  private attackTimer: number = 0;
  private moveTimer: number = 0;
  private targetPosition: Vector2;
  private phase: number = 0; // Attack phase

  constructor(position: Vector2, type: BossType) {
    const config = BOSS_CONFIGS[type];
    super(position, config.size);

    this.bossType = type;
    this.config = config;
    this.health = config.maxHealth;
    this.maxHealth = config.maxHealth;
    this.targetPosition = {...position};
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    // Update attack timer
    this.attackTimer += deltaTime;

    // Update move timer for pattern changes
    this.moveTimer += deltaTime;

    // Movement AI based on boss type
    this.updateMovement(deltaTime, canvasWidth, canvasHeight);

    // Update position
    this.position.x += this.velocity.x * (deltaTime / 1000);
    this.position.y += this.velocity.y * (deltaTime / 1000);

    // Keep within bounds
    this.position.x = Math.max(
      this.radius,
      Math.min(canvasWidth - this.radius, this.position.x)
    );
    this.position.y = Math.max(
      this.radius,
      Math.min(canvasHeight - this.radius, this.position.y)
    );

    // Update rotation
    this.rotation += (deltaTime / 1000) * Math.PI * 0.5;
  }

  private updateMovement(
    _deltaTime: number,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const speed = this.config.speed;

    switch (this.bossType) {
      case BossType.MOTHERSHIP:
        // Circular movement pattern
        if (this.moveTimer >= 3000) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 200;
          this.targetPosition = {
            x: canvasWidth / 2 + Math.cos(angle) * radius,
            y: canvasHeight / 2 + Math.sin(angle) * radius,
          };
          this.moveTimer = 0;
        }
        break;

      case BossType.FORTRESS:
        // Slow, methodical movement
        if (this.moveTimer >= 4000) {
          this.targetPosition = {
            x: Math.random() * (canvasWidth - 200) + 100,
            y: Math.random() * (canvasHeight - 200) + 100,
          };
          this.moveTimer = 0;
        }
        break;

      case BossType.SWARM_COMMANDER:
        // Fast, erratic movement
        if (this.moveTimer >= 1500) {
          this.targetPosition = {
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
          };
          this.moveTimer = 0;
        }
        break;
    }

    // Move towards target
    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10) {
      this.velocity.x = (dx / distance) * speed;
      this.velocity.y = (dy / distance) * speed;
    } else {
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
  }

  takeDamage(amount: number = 1): boolean {
    this.health -= amount;

    // Phase transitions
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent < 0.5 && this.phase === 0) {
      this.phase = 1; // Enter phase 2
      this.config.attackCooldown *= 0.8; // Attack faster
    }
    if (healthPercent < 0.25 && this.phase === 1) {
      this.phase = 2; // Enter phase 3
      this.config.attackCooldown *= 0.7; // Attack even faster
    }

    return this.health <= 0;
  }

  canAttack(): boolean {
    return this.attackTimer >= this.config.attackCooldown;
  }

  resetAttackTimer(): void {
    this.attackTimer = 0;
  }

  getAttackPattern(): Vector2[] {
    // Return positions/directions for projectile spawns based on boss type and phase
    const patterns: Vector2[] = [];

    switch (this.bossType) {
      case BossType.MOTHERSHIP:
        // Circular pattern
        const numProjectiles = 8 + this.phase * 4;
        for (let i = 0; i < numProjectiles; i++) {
          const angle = ((Math.PI * 2) / numProjectiles) * i + this.rotation;
          patterns.push({
            x: Math.cos(angle),
            y: Math.sin(angle),
          });
        }
        break;

      case BossType.FORTRESS:
        // Straight lines in cardinal directions
        patterns.push({x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1});
        if (this.phase >= 1) {
          // Add diagonals
          patterns.push(
            {x: 0.707, y: 0.707},
            {x: -0.707, y: 0.707},
            {x: 0.707, y: -0.707},
            {x: -0.707, y: -0.707}
          );
        }
        break;

      case BossType.SWARM_COMMANDER:
        // Random spread
        for (let i = 0; i < 3 + this.phase * 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          patterns.push({
            x: Math.cos(angle),
            y: Math.sin(angle),
          });
        }
        break;
    }

    return patterns;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    // Boss body based on type
    switch (this.bossType) {
      case BossType.MOTHERSHIP:
        this.renderMothership(ctx);
        break;
      case BossType.FORTRESS:
        this.renderFortress(ctx);
        break;
      case BossType.SWARM_COMMANDER:
        this.renderSwarmCommander(ctx);
        break;
    }

    ctx.restore();

    // Health bar
    this.renderHealthBar(ctx);
  }

  private renderMothership(ctx: CanvasRenderingContext2D): void {
    // Main body - large circle
    ctx.strokeStyle = this.config.color;
    ctx.fillStyle = `${this.config.color}33`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    // Spikes
    for (let i = 0; i < 8; i++) {
      const angle = ((Math.PI * 2) / 8) * i;
      const x1 = Math.cos(angle) * this.radius * 0.8;
      const y1 = Math.sin(angle) * this.radius * 0.8;
      const x2 = Math.cos(angle) * this.radius * 1.2;
      const y2 = Math.sin(angle) * this.radius * 1.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  private renderFortress(ctx: CanvasRenderingContext2D): void {
    // Square fortress
    ctx.strokeStyle = this.config.color;
    ctx.fillStyle = `${this.config.color}33`;
    ctx.lineWidth = 4;

    const size = this.radius * 1.4;
    ctx.strokeRect(-size / 2, -size / 2, size, size);
    ctx.fillRect(-size / 2, -size / 2, size, size);

    // Turrets at corners
    const turretSize = this.radius * 0.3;
    [-1, 1].forEach((xDir) => {
      [-1, 1].forEach((yDir) => {
        ctx.beginPath();
        ctx.arc(
          (xDir * size) / 2,
          (yDir * size) / 2,
          turretSize,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
      });
    });

    // Center core
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private renderSwarmCommander(ctx: CanvasRenderingContext2D): void {
    // Diamond shape
    ctx.strokeStyle = this.config.color;
    ctx.fillStyle = `${this.config.color}33`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius * 0.7, 0);
    ctx.lineTo(0, this.radius);
    ctx.lineTo(-this.radius * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wings
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      const wingLength = this.radius * 0.5;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -this.radius * 0.5);
      ctx.lineTo(wingLength, -this.radius * 0.8);
      ctx.lineTo(0, -this.radius);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.radius * 2.5;
    const barHeight = 6;
    const x = this.position.x - barWidth / 2;
    const y = this.position.y - this.radius - 20;

    // Background
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthColor =
      healthPercent > 0.5
        ? "#00ff00"
        : healthPercent > 0.25
        ? "#ffff00"
        : "#ff0000";
    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Boss name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(this.getBossName(), this.position.x, y - 8);
  }

  private getBossName(): string {
    switch (this.bossType) {
      case BossType.MOTHERSHIP:
        return "MOTHERSHIP";
      case BossType.FORTRESS:
        return "FORTRESS";
      case BossType.SWARM_COMMANDER:
        return "SWARM COMMANDER";
    }
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getType(): BossType {
    return this.bossType;
  }

  getScore(): number {
    return this.config.scoreValue;
  }

  getPhase(): number {
    return this.phase;
  }
}
