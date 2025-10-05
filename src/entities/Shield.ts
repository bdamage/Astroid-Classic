import {GameObject} from "../core/GameObject";

export class Shield extends GameObject {
  private health: number;
  private maxHealth: number;
  private pulsePhase: number = 0;
  private owner: GameObject;
  private duration: number;
  private timeRemaining: number;

  constructor(owner: GameObject, duration: number = 10000) {
    // 10 seconds default
    super(owner.position, owner.radius + 15); // Slightly larger than owner
    this.owner = owner;
    this.health = 3; // Can absorb 3 hits
    this.maxHealth = 3;
    this.duration = duration;
    this.timeRemaining = duration;
  }

  update(deltaTime: number, _canvasWidth: number, _canvasHeight: number): void {
    // Follow the owner
    this.position = {...this.owner.position};

    // Update timeout
    this.timeRemaining -= deltaTime;
    if (this.timeRemaining <= 0) {
      this.active = false; // Shield expires
    }

    // Update pulse effect (faster as time runs out)
    const urgencyFactor = this.timeRemaining < 3000 ? 2 : 1; // Pulse faster in last 3 seconds
    this.pulsePhase += 4 * urgencyFactor * (deltaTime / 1000);
  }

  takeDamage(): boolean {
    this.health--;
    return this.health <= 0; // Return true if shield is destroyed
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Move to shield position
    ctx.translate(this.position.x, this.position.y);

    // Calculate alpha based on health, time remaining, and pulse
    const healthAlpha = this.health / this.maxHealth;
    const timeAlpha = Math.max(0.3, this.timeRemaining / this.duration);
    const pulseAlpha = 0.3 + 0.4 * Math.sin(this.pulsePhase);
    const alpha = healthAlpha * timeAlpha * pulseAlpha;

    // Color changes as shield weakens
    let r = 0,
      g = 255,
      b = 255; // Default cyan
    if (this.health <= 1) {
      r = 255;
      g = 100;
      b = 0; // Orange when almost depleted
    } else if (this.timeRemaining < 3000) {
      r = 255;
      g = 255;
      b = 0; // Yellow when time is running out
    }

    // Create gradient for shield effect
    const gradient = ctx.createRadialGradient(
      0,
      0,
      this.radius * 0.7,
      0,
      0,
      this.radius
    );
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
    gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    // Draw shield
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${segmentAlpha})`;
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

  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  getDuration(): number {
    return this.duration;
  }

  isExpired(): boolean {
    return this.timeRemaining <= 0 || !this.active;
  }
}
