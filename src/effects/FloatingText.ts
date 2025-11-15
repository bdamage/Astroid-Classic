import type {Vector2} from "../utils/Vector2";
import {Vector2Utils} from "../utils/Vector2";

export class FloatingText {
  public position: Vector2;
  public velocity: Vector2;
  public text: string;
  public color: string;
  public fontSize: number;
  public life: number;
  public maxLife: number;
  public active: boolean = true;
  private initialFontSize: number;
  private scalePhase: number = 0; // For zooming effect
  private type: "normal" | "damage" | "combo" | "critical" = "normal";
  private bouncePhase: number = 0; // For bouncing effect

  constructor(
    position: Vector2,
    text: string,
    color: string = "#ffffff",
    fontSize: number = 24,
    life: number = 2000,
    type: "normal" | "damage" | "combo" | "critical" = "normal"
  ) {
    this.position = {...position};
    
    // Different velocity patterns based on type
    if (type === "damage") {
      this.velocity = { x: (Math.random() - 0.5) * 30, y: -50 - Math.random() * 30 };
    } else if (type === "combo") {
      this.velocity = { x: (Math.random() - 0.5) * 80, y: -60 - Math.random() * 40 };
    } else if (type === "critical") {
      this.velocity = { x: (Math.random() - 0.5) * 100, y: -80 - Math.random() * 50 };
    } else {
      this.velocity = { x: (Math.random() - 0.5) * 50, y: -30 - Math.random() * 20 };
    }
    
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.initialFontSize = fontSize;
    this.life = life;
    this.maxLife = life;
    this.type = type;
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

    // Apply gravity and friction (varies by type)
    const gravity = this.type === "critical" ? 30 : 20;
    const friction = this.type === "damage" ? 0.96 : 0.98;
    this.velocity.y += gravity * (deltaTime / 1000);
    this.velocity = Vector2Utils.multiply(this.velocity, friction);

    // Scale effect - zoom in initially, then fade
    this.scalePhase += deltaTime / 1000;
    const scaleTime = Math.min(this.scalePhase, 0.3);
    const scaleProgress = scaleTime / 0.3;

    if (scaleProgress < 1) {
      // Zoom in effect (more dramatic for critical/combo)
      const maxScale = this.type === "critical" || this.type === "combo" ? 2.5 : 2.0;
      const scale = 0.5 + scaleProgress * maxScale;
      this.fontSize = this.initialFontSize * scale;
    } else {
      // Return to normal size
      this.fontSize = this.initialFontSize;
    }
    
    // Bounce effect for critical hits
    if (this.type === "critical") {
      this.bouncePhase += deltaTime / 100;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const alpha = Math.min(1, this.life / this.maxLife);
    let yOffset = 0;
    
    // Bounce effect for critical hits
    if (this.type === "critical") {
      yOffset = Math.sin(this.bouncePhase) * 5;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Enhanced stroke for critical and combo
    if (this.type === "critical" || this.type === "combo") {
      // Outer glow
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeText(this.text, this.position.x, this.position.y + yOffset);
    } else {
      // Standard stroke
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeText(this.text, this.position.x, this.position.y + yOffset);
    }
    
    ctx.fillText(this.text, this.position.x, this.position.y + yOffset);

    ctx.restore();
  }
}

export class FloatingTextManager {
  private texts: FloatingText[] = [];

  update(deltaTime: number): void {
    this.texts.forEach((text) => text.update(deltaTime));
    this.texts = this.texts.filter((text) => text.active);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.texts.forEach((text) => text.render(ctx));
  }

  addText(
    position: Vector2,
    text: string,
    color?: string,
    fontSize?: number
  ): void {
    this.texts.push(new FloatingText(position, text, color, fontSize));
  }

  addScoreText(position: Vector2, score: number): void {
    const colors = ["#ffff00", "#ff9900", "#ff6600", "#ff0000"];
    const color = colors[Math.min(Math.floor(score / 50), colors.length - 1)];
    this.addText(position, `+${score}`, color, 20);
  }

  addLevelText(position: Vector2, level: number): void {
    this.addText(position, `LEVEL ${level}`, "#00ff00", 36);
  }

  addBonusText(position: Vector2, bonus: number): void {
    this.addText(position, `BONUS +${bonus}`, "#00ffff", 28);
  }

  addPowerUpText(position: Vector2, powerUpName: string): void {
    this.addText(position, powerUpName, "#ffff00", 24);
  }

  addDamageText(position: Vector2, damage: number): void {
    const text = new FloatingText(
      position,
      `-${damage}`,
      "#ff3333",
      18,
      1200,
      "damage"
    );
    this.texts.push(text);
  }

  addComboText(position: Vector2, comboCount: number): void {
    const colors = [
      "#ffff00",  // Yellow for low combos
      "#ff9900",  // Orange
      "#ff00ff",  // Magenta for medium
      "#00ffff",  // Cyan for high
      "#ffffff"   // White for extreme
    ];
    const colorIndex = Math.min(Math.floor(comboCount / 5), colors.length - 1);
    const color = colors[colorIndex];
    
    const text = new FloatingText(
      position,
      `${comboCount}x COMBO!`,
      color,
      28,
      2000,
      "combo"
    );
    this.texts.push(text);
  }

  addCriticalText(position: Vector2, isBoss: boolean = false): void {
    const text = new FloatingText(
      position,
      isBoss ? "BOSS CRIT!" : "CRITICAL!",
      "#ff0000",
      isBoss ? 40 : 32,
      1500,
      "critical"
    );
    this.texts.push(text);
  }

  addMultiplierText(position: Vector2, multiplier: number): void {
    const colors = ["#ffff00", "#ff9900", "#ff00ff", "#00ffff"];
    const colorIndex = Math.min(Math.floor(multiplier / 2), colors.length - 1);
    
    const text = new FloatingText(
      position,
      `x${multiplier}`,
      colors[colorIndex],
      24,
      1800,
      "combo"
    );
    this.texts.push(text);
  }

  clear(): void {
    this.texts = [];
  }

  getTextCount(): number {
    return this.texts.length;
  }
}
