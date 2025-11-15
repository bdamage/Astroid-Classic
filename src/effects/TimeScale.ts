/**
 * TimeScale - Manages game time dilation for freeze frame and slow motion effects
 */
export class TimeScale {
  private currentScale: number = 1.0;
  private targetScale: number = 1.0;
  private freezeTimer: number = 0;
  private freezeDuration: number = 0;
  private transitionSpeed: number = 10; // How fast to transition back to normal

  /**
   * Get current time scale multiplier
   */
  getScale(): number {
    return this.currentScale;
  }

  /**
   * Apply time scale to delta time
   */
  applyScale(deltaTime: number): number {
    return deltaTime * this.currentScale;
  }

  /**
   * Update time scale system
   */
  update(deltaTime: number): void {
    if (this.freezeTimer > 0) {
      this.freezeTimer -= deltaTime;

      if (this.freezeTimer <= 0) {
        // Freeze duration ended, transition back to normal
        this.targetScale = 1.0;
        this.freezeTimer = 0;
      }
    }

    // Smoothly transition current scale to target scale
    if (this.currentScale !== this.targetScale) {
      const diff = this.targetScale - this.currentScale;
      const step = this.transitionSpeed * (deltaTime / 1000);

      if (Math.abs(diff) < step) {
        this.currentScale = this.targetScale;
      } else {
        this.currentScale += Math.sign(diff) * step;
      }
    }
  }

  /**
   * Trigger a freeze frame effect (brief pause for impact)
   * @param duration Duration in milliseconds
   * @param scale Time scale during freeze (0 = full stop, 0.1 = very slow)
   */
  freeze(duration: number, scale: number = 0.1): void {
    this.currentScale = scale;
    this.targetScale = scale;
    this.freezeTimer = duration;
    this.freezeDuration = duration;
  }

  /**
   * Set time scale for slow motion effects
   * @param scale Time scale (0.5 = half speed, 2.0 = double speed)
   * @param duration Duration in milliseconds (0 = indefinite)
   */
  setScale(scale: number, duration: number = 0): void {
    this.targetScale = Math.max(0, Math.min(2.0, scale));

    if (duration > 0) {
      this.freezeTimer = duration;
      this.freezeDuration = duration;
    }
  }

  /**
   * Reset time scale to normal immediately
   */
  reset(): void {
    this.currentScale = 1.0;
    this.targetScale = 1.0;
    this.freezeTimer = 0;
    this.freezeDuration = 0;
  }

  /**
   * Check if currently in freeze/slow-mo
   */
  isActive(): boolean {
    return this.currentScale !== 1.0 || this.freezeTimer > 0;
  }

  /**
   * Get freeze progress (0 = just started, 1 = ending)
   */
  getFreezeProgress(): number {
    if (this.freezeDuration === 0) return 1;
    return 1 - this.freezeTimer / this.freezeDuration;
  }
}
