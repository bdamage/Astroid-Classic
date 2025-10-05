import type {Vector2} from "../utils/Vector2";

export interface Star {
  position: Vector2;
  brightness: number;
  size: number;
  twinkleSpeed: number;
  twinklePhase: number;
  isSparkle: boolean;
  sparklePhase: number;
  color: string;
}

export class Starfield {
  private stars: Star[] = [];
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private time: number = 0;

  constructor(starCount: number = 200) {
    this.generateStars(starCount);
  }

  private generateStars(count: number): void {
    this.stars = [];

    for (let i = 0; i < count; i++) {
      const isSparkle = Math.random() < 0.05; // 5% chance for sparkle stars
      const star: Star = {
        position: {
          x: Math.random() * this.canvasWidth,
          y: Math.random() * this.canvasHeight,
        },
        brightness: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
        size: isSparkle ? Math.random() * 2 + 1 : Math.random() * 1.5 + 0.5,
        twinkleSpeed: Math.random() * 2 + 0.5, // 0.5 to 2.5
        twinklePhase: Math.random() * Math.PI * 2,
        isSparkle,
        sparklePhase: Math.random() * Math.PI * 2,
        color: this.getStarColor(),
      };
      this.stars.push(star);
    }
  }

  private getStarColor(): string {
    const colors = [
      "#ffffff", // White (most common)
      "#ffffff", // White
      "#ffffff", // White
      "#ffffcc", // Warm white
      "#ccddff", // Blue-white
      "#ffcccc", // Red-white
      "#ccffcc", // Green-white (rare)
      "#ffddaa", // Yellow-white
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updateCanvasSize(width: number, height: number): void {
    if (this.canvasWidth !== width || this.canvasHeight !== height) {
      this.canvasWidth = width;
      this.canvasHeight = height;

      // Reposition existing stars to fit new canvas
      this.stars.forEach((star) => {
        star.position.x = Math.random() * width;
        star.position.y = Math.random() * height;
      });
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime / 1000;

    this.stars.forEach((star) => {
      // Update twinkle phase
      star.twinklePhase += star.twinkleSpeed * (deltaTime / 1000);

      // Update sparkle phase for special stars
      if (star.isSparkle) {
        star.sparklePhase += 3 * (deltaTime / 1000);
      }
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    this.stars.forEach((star) => {
      // Calculate current brightness with twinkling
      const twinkle = (Math.sin(star.twinklePhase) + 1) * 0.5; // 0 to 1
      const currentBrightness = star.brightness * (0.3 + twinkle * 0.7);

      ctx.globalAlpha = currentBrightness;
      ctx.fillStyle = star.color;

      if (star.isSparkle) {
        // Draw sparkle effect
        this.drawSparkle(ctx, star);
      } else {
        // Draw regular star
        ctx.beginPath();
        ctx.arc(star.position.x, star.position.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  private drawSparkle(ctx: CanvasRenderingContext2D, star: Star): void {
    const sparkleIntensity = (Math.sin(star.sparklePhase) + 1) * 0.5;
    const centerX = star.position.x;
    const centerY = star.position.y;
    const size = star.size * (1 + sparkleIntensity * 0.5);

    // Draw center
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw sparkle rays
    const rayLength = size * 2;
    const rayWidth = 0.5;

    ctx.globalAlpha *= sparkleIntensity;

    // Draw 4 rays (cross pattern)
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(centerX - cos * rayLength, centerY - sin * rayLength);
      ctx.lineTo(centerX + cos * rayLength, centerY + sin * rayLength);
      ctx.lineWidth = rayWidth;
      ctx.strokeStyle = star.color;
      ctx.stroke();
    }

    // Draw diagonal rays (smaller)
    ctx.globalAlpha *= 0.7;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const smallRayLength = rayLength * 0.6;

      ctx.beginPath();
      ctx.moveTo(
        centerX - cos * smallRayLength,
        centerY - sin * smallRayLength
      );
      ctx.lineTo(
        centerX + cos * smallRayLength,
        centerY + sin * smallRayLength
      );
      ctx.lineWidth = rayWidth * 0.7;
      ctx.strokeStyle = star.color;
      ctx.stroke();
    }
  }

  // Add more stars dynamically
  addStars(count: number): void {
    for (let i = 0; i < count; i++) {
      const isSparkle = Math.random() < 0.05;
      const star: Star = {
        position: {
          x: Math.random() * this.canvasWidth,
          y: Math.random() * this.canvasHeight,
        },
        brightness: Math.random() * 0.8 + 0.2,
        size: isSparkle ? Math.random() * 2 + 1 : Math.random() * 1.5 + 0.5,
        twinkleSpeed: Math.random() * 2 + 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        isSparkle,
        sparklePhase: Math.random() * Math.PI * 2,
        color: this.getStarColor(),
      };
      this.stars.push(star);
    }
  }

  getStarCount(): number {
    return this.stars.length;
  }
}
