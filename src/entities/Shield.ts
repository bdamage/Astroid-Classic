import {GameObject} from "../core/GameObject";

export class Shield extends GameObject {
  private health: number;
  private maxHealth: number;
  private pulsePhase: number = 0;
  private owner: GameObject;

  constructor(owner: GameObject) {
    super(owner.position, owner.radius + 15); // Slightly larger than owner
    this.owner = owner;
    this.health = 3; // Can absorb 3 hits
    this.maxHealth = 3;
  }

  update(deltaTime: number, _canvasWidth: number, _canvasHeight: number): void {
    // Follow the owner
    this.position = {...this.owner.position};

    // Update pulse effect
    this.pulsePhase += 4 * (deltaTime / 1000);
  }

  takeDamage(): boolean {
    this.health--;
    return this.health <= 0; // Return true if shield is destroyed
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Move to shield position
    ctx.translate(this.position.x, this.position.y);

    // Calculate alpha based on health and pulse
    const healthAlpha = this.health / this.maxHealth;
    const pulseAlpha = 0.3 + 0.4 * Math.sin(this.pulsePhase);
    const alpha = healthAlpha * pulseAlpha;

    // Create gradient for shield effect
    const gradient = ctx.createRadialGradient(
      0,
      0,
      this.radius * 0.7,
      0,
      0,
      this.radius
    );
    gradient.addColorStop(0, `rgba(0, 255, 255, ${alpha * 0.3})`);
    gradient.addColorStop(0.8, `rgba(0, 255, 255, ${alpha * 0.8})`);
    gradient.addColorStop(1, `rgba(0, 255, 255, 0)`);

    // Draw shield
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.fillStyle = gradient;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw shield segments to show health
    for (let i = 0; i < this.maxHealth; i++) {
      const angle = (i / this.maxHealth) * Math.PI * 2 - Math.PI / 2;
      const segmentAlpha = i < this.health ? alpha : alpha * 0.2;

      ctx.strokeStyle = `rgba(0, 255, 255, ${segmentAlpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(
        0,
        0,
        this.radius,
        angle,
        angle + ((Math.PI * 2) / this.maxHealth) * 0.8
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }
}
