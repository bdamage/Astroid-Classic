import type {Vector2} from "../utils/Vector2";

export class ScreenShake {
  private intensity: number = 0;
  private duration: number = 0;
  private maxDuration: number = 0;
  private frequency: number = 30; // Shake frequency in Hz
  private offset: Vector2 = {x: 0, y: 0};

  update(deltaTime: number): void {
    if (this.duration <= 0) {
      this.intensity = 0;
      this.offset = {x: 0, y: 0};
      return;
    }

    this.duration -= deltaTime;

    // Calculate intensity falloff
    const progress = 1 - this.duration / this.maxDuration;
    const currentIntensity = this.intensity * (1 - progress * progress); // Quadratic falloff

    // Generate shake offset
    const time = (this.maxDuration - this.duration) / 1000;
    this.offset = {
      x:
        Math.sin(time * this.frequency * 2 * Math.PI) *
        currentIntensity *
        (Math.random() * 0.5 + 0.5),
      y:
        Math.cos(time * this.frequency * 1.7 * Math.PI) *
        currentIntensity *
        (Math.random() * 0.5 + 0.5),
    };
  }

  shake(intensity: number, duration: number): void {
    // Add to existing shake if already active
    if (this.duration > 0) {
      this.intensity = Math.max(this.intensity, intensity);
      this.duration = Math.max(this.duration, duration);
    } else {
      this.intensity = intensity;
      this.duration = duration;
    }
    this.maxDuration = this.duration;
  }

  getOffset(): Vector2 {
    return this.offset;
  }

  isActive(): boolean {
    return this.duration > 0;
  }

  reset(): void {
    this.intensity = 0;
    this.duration = 0;
    this.maxDuration = 0;
    this.offset = {x: 0, y: 0};
  }
}
