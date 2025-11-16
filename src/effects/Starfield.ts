import type {Vector2} from "../utils/Vector2";

export interface Star {
  position: Vector2;
  z: number; // Z-depth for 3D effect
  originalX: number; // Store original position for rotation
  originalY: number;
  originalZ: number;
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
  private rotationX: number = 0; // Rotation around X-axis
  private rotationY: number = 0; // Rotation around Y-axis
  private rotationZ: number = 0; // Rotation around Z-axis
  private rotationSpeedX: number = 0.015; // Very slow rotation
  private rotationSpeedY: number = 0.025;
  private rotationSpeedZ: number = 0.01;

  constructor(starCount: number = 200) {
    this.generateStars(starCount);
  }

  private generateStars(count: number): void {
    this.stars = [];
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    const depth = Math.max(this.canvasWidth, this.canvasHeight);

    for (let i = 0; i < count; i++) {
      const isSparkle = Math.random() < 0.02; // 2% chance for sparkle stars (reduced from 5%)

      // Generate stars in a wider 3D sphere that extends beyond borders
      const x = (Math.random() - 0.5) * this.canvasWidth * 1.5;
      const y = (Math.random() - 0.5) * this.canvasHeight * 1.5;
      const z = (Math.random() - 0.5) * depth * 0.8;

      const star: Star = {
        position: {x: centerX + x, y: centerY + y},
        z: z,
        originalX: x,
        originalY: y,
        originalZ: z,
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

      // Regenerate stars for new canvas size
      const starCount = this.stars.length;
      this.generateStars(starCount);
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime / 1000;

    // Update rotation angles
    this.rotationX += this.rotationSpeedX * (deltaTime / 1000);
    this.rotationY += this.rotationSpeedY * (deltaTime / 1000);
    this.rotationZ += this.rotationSpeedZ * (deltaTime / 1000);

    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;

    this.stars.forEach((star) => {
      // Update twinkle phase
      star.twinklePhase += star.twinkleSpeed * (deltaTime / 1000);

      // Update sparkle phase for special stars
      if (star.isSparkle) {
        star.sparklePhase += 1.5 * (deltaTime / 1000); // Slower sparkle animation
      }

      // Apply 3D rotation
      let x = star.originalX;
      let y = star.originalY;
      let z = star.originalZ;

      // Rotate around X-axis
      const cosX = Math.cos(this.rotationX);
      const sinX = Math.sin(this.rotationX);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      y = y1;
      z = z1;

      // Rotate around Y-axis
      const cosY = Math.cos(this.rotationY);
      const sinY = Math.sin(this.rotationY);
      const x1 = x * cosY + z * sinY;
      const z2 = -x * sinY + z * cosY;
      x = x1;
      z = z2;

      // Rotate around Z-axis
      const cosZ = Math.cos(this.rotationZ);
      const sinZ = Math.sin(this.rotationZ);
      const x2 = x * cosZ - y * sinZ;
      const y2 = x * sinZ + y * cosZ;
      x = x2;
      y = y2;

      // Update star position with rotation
      star.position.x = centerX + x;
      star.position.y = centerY + y;
      star.z = z;
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Sort stars by Z-depth (far to near) for proper layering
    const sortedStars = [...this.stars].sort((a, b) => a.z - b.z);

    sortedStars.forEach((star) => {
      // Calculate perspective scale based on Z-depth
      const depth = Math.max(this.canvasWidth, this.canvasHeight);
      const perspective = 1 + (star.z / depth) * 0.5; // Stars closer = bigger
      const scaledSize = star.size * perspective;

      // Calculate current brightness with twinkling and depth
      const twinkle = (Math.sin(star.twinklePhase) + 1) * 0.5; // 0 to 1
      const depthFade = 0.3 + perspective * 0.7; // Far stars dimmer
      const currentBrightness =
        star.brightness * (0.3 + twinkle * 0.7) * depthFade;

      ctx.globalAlpha = currentBrightness;
      ctx.fillStyle = star.color;

      if (star.isSparkle) {
        // Draw sparkle effect
        this.drawSparkle(ctx, star, scaledSize);
      } else {
        // Draw regular star
        ctx.beginPath();
        ctx.arc(star.position.x, star.position.y, scaledSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  private drawSparkle(
    ctx: CanvasRenderingContext2D,
    star: Star,
    scaledSize?: number
  ): void {
    const sparkleIntensity = (Math.sin(star.sparklePhase) + 1) * 0.5;
    const centerX = star.position.x;
    const centerY = star.position.y;
    const baseSize = scaledSize || star.size;
    const size = baseSize * (1 + sparkleIntensity * 0.3); // Reduced from 0.5

    // Draw center
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw sparkle rays - shorter and more subtle
    const rayLength = size * 1.2; // Reduced from 2
    const rayWidth = 0.3; // Reduced from 0.5

    ctx.globalAlpha *= sparkleIntensity * 0.5; // More subtle

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

    // Draw diagonal rays (smaller and more subtle)
    ctx.globalAlpha *= 0.5; // Reduced from 0.7
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const smallRayLength = rayLength * 0.5; // Reduced from 0.6

      ctx.beginPath();
      ctx.moveTo(
        centerX - cos * smallRayLength,
        centerY - sin * smallRayLength
      );
      ctx.lineTo(
        centerX + cos * smallRayLength,
        centerY + sin * smallRayLength
      );
      ctx.lineWidth = rayWidth * 0.5; // Reduced from 0.7
      ctx.strokeStyle = star.color;
      ctx.stroke();
    }
  }

  // Add more stars dynamically
  addStars(count: number): void {
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    const depth = Math.max(this.canvasWidth, this.canvasHeight);

    for (let i = 0; i < count; i++) {
      const isSparkle = Math.random() < 0.05;

      const x = (Math.random() - 0.5) * this.canvasWidth * 1.5;
      const y = (Math.random() - 0.5) * this.canvasHeight * 1.5;
      const z = (Math.random() - 0.5) * depth * 0.8;

      const star: Star = {
        position: {x: centerX + x, y: centerY + y},
        z: z,
        originalX: x,
        originalY: y,
        originalZ: z,
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
