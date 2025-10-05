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

  constructor(
    position: Vector2,
    text: string,
    color: string = "#ffffff",
    fontSize: number = 24,
    life: number = 2000
  ) {
    this.position = {...position};
    this.velocity = {
      x: (Math.random() - 0.5) * 50,
      y: -30 - Math.random() * 20, // Float upward
    };
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.initialFontSize = fontSize;
    this.life = life;
    this.maxLife = life;
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

    // Apply gravity and friction
    this.velocity.y += 20 * (deltaTime / 1000); // Slight gravity
    this.velocity = Vector2Utils.multiply(this.velocity, 0.98); // Friction

    // Scale effect - zoom in initially, then fade
    this.scalePhase += deltaTime / 1000;
    const scaleTime = Math.min(this.scalePhase, 0.3);
    const scaleProgress = scaleTime / 0.3;

    if (scaleProgress < 1) {
      // Zoom in effect
      const scale = 0.5 + scaleProgress * 1.5; // Scale from 0.5x to 2x
      this.fontSize = this.initialFontSize * scale;
    } else {
      // Return to normal size
      this.fontSize = this.initialFontSize;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const alpha = Math.min(1, this.life / this.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Add text stroke for better visibility
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeText(this.text, this.position.x, this.position.y);
    ctx.fillText(this.text, this.position.x, this.position.y);

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

  clear(): void {
    this.texts = [];
  }

  getTextCount(): number {
    return this.texts.length;
  }
}
