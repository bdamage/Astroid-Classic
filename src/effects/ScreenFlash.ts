export class ScreenFlash {
  private flashes: {
    color: string;
    alpha: number;
    duration: number;
    elapsed: number;
  }[] = [];

  flash(color: string, intensity: number = 0.3, duration: number = 200): void {
    this.flashes.push({
      color,
      alpha: intensity,
      duration,
      elapsed: 0,
    });
  }

  update(deltaTime: number): void {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const flash = this.flashes[i];
      flash.elapsed += deltaTime;

      // Fade out
      const progress = flash.elapsed / flash.duration;
      flash.alpha = (1 - progress) * (flash.alpha || 0.3);

      // Remove if finished
      if (flash.elapsed >= flash.duration) {
        this.flashes.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.flashes.length === 0) return;

    ctx.save();

    for (const flash of this.flashes) {
      ctx.fillStyle = `${flash.color}${Math.floor(flash.alpha * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  clear(): void {
    this.flashes = [];
  }
}
