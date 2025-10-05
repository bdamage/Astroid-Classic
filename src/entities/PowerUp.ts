import {GameObject} from "../core/GameObject";
import type {Vector2} from "../utils/Vector2";
import {Vector2Utils} from "../utils/Vector2";

export const PowerUpType = {
  RAPID_FIRE: "rapidFire",
  TRIPLE_SHOT: "tripleShot",
  SPREAD_SHOT: "spreadShot",
  POWER_SHOT: "powerShot",
  SHIELD: "shield",
  HYPERSPACE: "hyperspace",
  SLOW_MOTION: "slowMotion",
  HOMING_MISSILE: "homingMissile",
} as const;

export type PowerUpType = (typeof PowerUpType)[keyof typeof PowerUpType];

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  color: string;
  symbol: string;
  duration: number;
  description: string;
}

export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  [PowerUpType.RAPID_FIRE]: {
    type: PowerUpType.RAPID_FIRE,
    name: "Rapid Fire",
    color: "#ff6600",
    symbol: "R",
    duration: 10000, // 10 seconds
    description: "Increased firing rate",
  },
  [PowerUpType.TRIPLE_SHOT]: {
    type: PowerUpType.TRIPLE_SHOT,
    name: "Triple Shot",
    color: "#00ff00",
    symbol: "3",
    duration: 8000, // 8 seconds
    description: "Fires three bullets at once",
  },
  [PowerUpType.SPREAD_SHOT]: {
    type: PowerUpType.SPREAD_SHOT,
    name: "Spread Shot",
    color: "#0088ff",
    symbol: "S",
    duration: 12000, // 12 seconds
    description: "Fires bullets in a spread pattern",
  },
  [PowerUpType.POWER_SHOT]: {
    type: PowerUpType.POWER_SHOT,
    name: "Power Shot",
    color: "#ff00ff",
    symbol: "P",
    duration: 6000, // 6 seconds
    description: "Bullets pierce through asteroids",
  },
  [PowerUpType.SHIELD]: {
    type: PowerUpType.SHIELD,
    name: "Shield",
    color: "#00ffff",
    symbol: "♦",
    duration: 15000, // 15 seconds
    description: "Protection from asteroid impacts",
  },
  [PowerUpType.HYPERSPACE]: {
    type: PowerUpType.HYPERSPACE,
    name: "Hyperspace",
    color: "#9900ff",
    symbol: "✦",
    duration: 0, // Instant use
    description: "Emergency teleport to random location",
  },
  [PowerUpType.SLOW_MOTION]: {
    type: PowerUpType.SLOW_MOTION,
    name: "Slow Motion",
    color: "#ffff00",
    symbol: "◈",
    duration: 8000, // 8 seconds
    description: "Slows down time for precision",
  },
  [PowerUpType.HOMING_MISSILE]: {
    type: PowerUpType.HOMING_MISSILE,
    name: "Homing Missile",
    color: "#ff9900",
    symbol: "◆",
    duration: 30000, // 30 seconds (3 missiles)
    description: "Launch seeking missiles",
  },
};

export class PowerUp extends GameObject {
  private powerUpType: PowerUpType;
  private config: PowerUpConfig;
  private rotationSpeed: number;
  private floatPhase: number = 0;
  private glowPhase: number = 0;
  private baseY: number;

  constructor(position: Vector2, type: PowerUpType) {
    super(position, 15);
    this.powerUpType = type;
    this.config = POWER_UP_CONFIGS[type];
    this.rotationSpeed = 2; // Rotation speed in radians per second
    this.baseY = position.y;

    // Add some random float to make them more visible
    this.velocity = {
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 20,
    };
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    // Update rotation
    this.rotation += this.rotationSpeed * (deltaTime / 1000);

    // Update floating effect
    this.floatPhase += 2 * (deltaTime / 1000);
    this.position.y = this.baseY + Math.sin(this.floatPhase) * 3;

    // Update glow effect
    this.glowPhase += 4 * (deltaTime / 1000);

    // Slow drift movement
    const deltaVelocity = Vector2Utils.multiply(
      this.velocity,
      deltaTime / 1000
    );
    this.position = Vector2Utils.add(this.position, deltaVelocity);
    this.baseY += deltaVelocity.y;

    // Apply friction
    this.velocity = Vector2Utils.multiply(this.velocity, 0.99);

    // Wrap around screen
    this.wrapPosition(canvasWidth, canvasHeight);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    // Draw glow effect
    const glowIntensity = (Math.sin(this.glowPhase) + 1) * 0.5;
    const glowRadius = this.radius * (1.5 + glowIntensity * 0.5);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    gradient.addColorStop(0, this.config.color + "80"); // Semi-transparent
    gradient.addColorStop(0.7, this.config.color + "40");
    gradient.addColorStop(1, this.config.color + "00"); // Fully transparent

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw main token (hexagon)
    ctx.strokeStyle = this.config.color;
    ctx.fillStyle = this.config.color + "60"; // Semi-transparent fill
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw symbol
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.config.symbol, 0, 0);

    ctx.restore();
  }

  getType(): PowerUpType {
    return this.powerUpType;
  }

  getConfig(): PowerUpConfig {
    return this.config;
  }

  static createRandom(position: Vector2): PowerUp {
    const types = Object.values(PowerUpType);
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new PowerUp(position, randomType);
  }
}
