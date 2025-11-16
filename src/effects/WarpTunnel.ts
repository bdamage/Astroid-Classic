import type {Vector2} from "../utils/Vector2";

interface TunnelSegment {
  z: number;
  radius: number;
  rotation: number;
  color: string;
}

interface TunnelObstacle {
  z: number;
  angle: number;
  size: number;
  type: "ring" | "block" | "spinner";
  rotation: number;
  rotationSpeed: number;
  hit: boolean;
  shapePoints?: {angle: number; distance: number; baseShade: number}[];
}

export class WarpTunnel {
  private segments: TunnelSegment[] = [];
  private obstacles: TunnelObstacle[] = [];
  private speed: number = 300; // Units per second
  private tunnelLength: number = 5000;
  private currentZ: number = 0;
  private segmentSpacing: number = 100;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerVelX: number = 0;
  private playerVelY: number = 0;
  private tunnelRadius: number = 300;
  private complete: boolean = false;
  private score: number = 0;
  private time: number = 0;

  constructor() {
    this.generateTunnel();
  }

  private generateTunnel(): void {
    this.segments = [];
    this.obstacles = [];

    // Generate tunnel segments
    for (let z = 0; z < this.tunnelLength; z += this.segmentSpacing) {
      const segment: TunnelSegment = {
        z: z,
        radius: this.tunnelRadius + Math.sin(z / 500) * 50,
        rotation: z / 200,
        color: this.getTunnelColor(z),
      };
      this.segments.push(segment);
    }

    // Generate obstacles
    const obstacleCount = 15;
    for (let i = 0; i < obstacleCount; i++) {
      const z = (i + 1) * (this.tunnelLength / (obstacleCount + 1));
      const types: ("ring" | "block" | "spinner")[] = [
        "ring",
        "block",
        "spinner",
      ];
      const type = types[Math.floor(Math.random() * types.length)];

      // Generate consistent asteroid shape
      const numPoints = 12 + Math.floor(Math.random() * 8);
      const shapePoints: {
        angle: number;
        distance: number;
        baseShade: number;
      }[] = [];
      const irregularity = 0.55;

      for (let j = 0; j < numPoints; j++) {
        const angle = (j / numPoints) * Math.PI * 2;
        const distance = 1 + (Math.random() - 0.5) * irregularity;
        // Base shade for each vertex (simulate 3D surface normal)
        const baseShade = Math.cos(angle - Math.PI * 0.7) * 0.4 + 0.6;
        shapePoints.push({angle, distance, baseShade});
      }

      this.obstacles.push({
        z: z,
        angle: Math.random() * Math.PI * 2,
        size: 25 + Math.random() * 15,
        type: type,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 3,
        hit: false,
        shapePoints: shapePoints,
      });
    }
  }

  private getTunnelColor(z: number): string {
    const hue = (z / 50) % 360;
    return `hsl(${hue}, 50%, 45%)`;
  }

  update(deltaTime: number, input: {x: number; y: number}): void {
    this.time += deltaTime;

    // Move through tunnel
    this.currentZ += this.speed * (deltaTime / 1000);

    // Update player velocity with acceleration and damping for smooth movement
    const acceleration = 800;
    const damping = 0.88;
    const dt = deltaTime / 1000;

    this.playerVelX += input.x * acceleration * dt;
    this.playerVelY += input.y * acceleration * dt;

    // Apply damping for smooth deceleration
    this.playerVelX *= damping;
    this.playerVelY *= damping;

    // Update position
    this.playerX += this.playerVelX * dt;
    this.playerY += this.playerVelY * dt;

    // Constrain player within tunnel with smooth bounce back
    const maxDistance = this.tunnelRadius * 0.75;
    const distance = Math.sqrt(
      this.playerX * this.playerX + this.playerY * this.playerY
    );
    if (distance > maxDistance) {
      const angle = Math.atan2(this.playerY, this.playerX);
      this.playerX = Math.cos(angle) * maxDistance;
      this.playerY = Math.sin(angle) * maxDistance;
      // Bounce velocity
      this.playerVelX *= -0.3;
      this.playerVelY *= -0.3;
    }

    // Update obstacles - slow rotation for asteroids
    this.obstacles.forEach((obstacle) => {
      obstacle.rotation += obstacle.rotationSpeed * 0.3 * (deltaTime / 1000);
    });

    // Check if tunnel is complete
    if (this.currentZ >= this.tunnelLength) {
      this.complete = true;
    }
  }

  checkCollisions(bulletPositions: Vector2[]): boolean[] {
    const hits: boolean[] = new Array(bulletPositions.length).fill(false);

    bulletPositions.forEach((bullet, index) => {
      this.obstacles.forEach((obstacle) => {
        if (obstacle.hit) return;

        const relativeZ = obstacle.z - this.currentZ;
        if (relativeZ > 0 && relativeZ < 500) {
          // Check if bullet hits obstacle (simplified)
          const distance = Math.sqrt(
            Math.pow(bullet.x - this.playerX, 2) +
              Math.pow(bullet.y - this.playerY, 2)
          );
          if (distance < obstacle.size && relativeZ < 100) {
            obstacle.hit = true;
            hits[index] = true;
            this.score += 100;
          }
        }
      });
    });

    return hits;
  }

  checkPlayerCollision(): boolean {
    // Check if player hits tunnel walls or obstacles
    const playerDistance = Math.sqrt(
      this.playerX * this.playerX + this.playerY * this.playerY
    );

    // Check tunnel wall collision
    if (playerDistance > this.tunnelRadius * 0.9) {
      return true;
    }

    // Check obstacle collisions
    for (const obstacle of this.obstacles) {
      if (obstacle.hit) continue;

      const relativeZ = obstacle.z - this.currentZ;
      if (relativeZ > 0 && relativeZ < 100) {
        if (obstacle.type === "block" || obstacle.type === "spinner") {
          // Calculate obstacle screen position
          const scale = 1000 / relativeZ;
          const obstacleRadius = obstacle.size * scale * 0.01;
          const obstacleAngle = obstacle.angle + obstacle.rotation;
          const obstacleX = Math.cos(obstacleAngle) * this.tunnelRadius * 0.6;
          const obstacleY = Math.sin(obstacleAngle) * this.tunnelRadius * 0.6;

          const distance = Math.sqrt(
            Math.pow(this.playerX - obstacleX, 2) +
              Math.pow(this.playerY - obstacleY, 2)
          );

          if (distance < obstacleRadius + 20) {
            return true;
          }
        }
      }
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.save();

    // Draw tunnel segments
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];
      const relativeZ = segment.z - this.currentZ;

      if (relativeZ < 0 || relativeZ > 2000) continue;

      const scale = 1000 / relativeZ;
      const screenRadius = segment.radius * scale * 0.5;

      if (screenRadius < 5) continue;

      // Draw tunnel ring
      ctx.globalAlpha = Math.max(0.2, 1 - relativeZ / 2500);
      ctx.strokeStyle = segment.color;
      ctx.lineWidth = Math.max(0.8, 1.5 * scale);
      ctx.beginPath();
      ctx.arc(centerX, centerY, screenRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw grid lines
      const gridLines = 8;
      ctx.lineWidth = Math.max(0.5, 1 * scale);
      for (let j = 0; j < gridLines; j++) {
        const angle = (j / gridLines) * Math.PI * 2 + segment.rotation;
        const x1 = centerX + Math.cos(angle) * screenRadius;
        const y1 = centerY + Math.sin(angle) * screenRadius;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }

    // Draw obstacles as rotating asteroids
    this.obstacles.forEach((obstacle) => {
      if (obstacle.hit) return;

      const relativeZ = obstacle.z - this.currentZ;
      if (relativeZ < 0 || relativeZ > 2000) return;

      const scale = 1000 / relativeZ;
      const screenSize = obstacle.size * scale * 0.6;

      ctx.globalAlpha = Math.max(0.5, 1 - relativeZ / 2500);

      // Add subtle glow to asteroids
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(120, 120, 120, 0.6)";

      const obstacleAngle = obstacle.angle + obstacle.rotation;
      const tunnelScreenRadius = this.tunnelRadius * scale * 0.5;
      const obstacleX =
        centerX + Math.cos(obstacleAngle) * tunnelScreenRadius * 0.6;
      const obstacleY =
        centerY + Math.sin(obstacleAngle) * tunnelScreenRadius * 0.6;

      // Draw 3D rotating asteroid with consistent shape
      if (!obstacle.shapePoints) return;

      ctx.save();
      ctx.translate(obstacleX, obstacleY);

      const shapePoints = obstacle.shapePoints;
      const numPoints = shapePoints.length;

      // Calculate rotated points with 3D lighting
      const points: {x: number; y: number; shade: number}[] = [];
      for (let i = 0; i < numPoints; i++) {
        const sp = shapePoints[i];
        const rotatedAngle = sp.angle + obstacle.rotation;
        const distance = screenSize * sp.distance;
        const x = Math.cos(rotatedAngle) * distance;
        const y = Math.sin(rotatedAngle) * distance;

        // Calculate lighting with rotation (light from upper-left)
        const lightAngle = rotatedAngle - Math.PI * 0.7;
        const rotationShade = Math.cos(lightAngle) * 0.35 + 0.65;
        const finalShade = sp.baseShade * rotationShade;

        points.push({x, y, shade: finalShade});
      }

      // Create rocky gourad-shaded asteroid with multiple light sources
      // Find brightest point for main light source
      let brightestIdx = 0;
      let maxShade = points[0].shade;
      for (let i = 1; i < points.length; i++) {
        if (points[i].shade > maxShade) {
          maxShade = points[i].shade;
          brightestIdx = i;
        }
      }

      const lightX = points[brightestIdx].x * 0.7;
      const lightY = points[brightestIdx].y * 0.7;

      // Create main radial gradient from light source
      const gradient = ctx.createRadialGradient(
        lightX,
        lightY,
        screenSize * 0.05,
        0,
        0,
        screenSize * 1.5
      );

      const lightGray = Math.floor(130 + maxShade * 70);
      const midGray = Math.floor(70 + maxShade * 50);
      const darkGray = Math.floor(35 + maxShade * 40);

      gradient.addColorStop(0, `rgb(${lightGray}, ${lightGray}, ${lightGray})`);
      gradient.addColorStop(0.3, `rgb(${midGray}, ${midGray}, ${midGray})`);
      gradient.addColorStop(
        0.7,
        `rgb(${Math.floor((midGray + darkGray) / 2)}, ${Math.floor(
          (midGray + darkGray) / 2
        )}, ${Math.floor((midGray + darkGray) / 2)})`
      );
      gradient.addColorStop(1, `rgb(${darkGray}, ${darkGray}, ${darkGray})`);

      // Draw filled asteroid shape
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();

      // Add subtle edge definition
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.lineWidth = Math.max(1, screenSize * 0.04);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Add highlights on bright edges
      ctx.strokeStyle = "rgba(220, 220, 220, 0.4)";
      ctx.lineWidth = Math.max(0.8, screenSize * 0.025);
      ctx.beginPath();
      let drawing = false;
      for (let i = 0; i < numPoints; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % numPoints];

        if (p1.shade > 0.75 && p2.shade > 0.75) {
          if (!drawing) {
            ctx.moveTo(p1.x, p1.y);
            drawing = true;
          }
          ctx.lineTo(p2.x, p2.y);
        } else {
          drawing = false;
        }
      }
      ctx.stroke();

      ctx.restore();
    });

    // Draw player ship in 3D pointing into tunnel
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    const shipX = centerX + this.playerX;
    const shipY = centerY + this.playerY;

    ctx.save();
    ctx.translate(shipX, shipY);

    // 3D ship with perspective - pointing into screen
    const shipScale = 1.0;
    const noseSize = 8 * shipScale; // Tip pointing into screen (smallest)
    const midSize = 20 * shipScale; // Middle section
    const backSize = 25 * shipScale; // Back wings (largest)

    // Draw engine glow
    const glowIntensity = 0.5 + Math.sin(this.time * 0.01) * 0.3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(0, 255, 255, ${glowIntensity})`;

    // Back wings (furthest from viewer)
    ctx.fillStyle = "#006666";
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-backSize, backSize * 0.6);
    ctx.lineTo(-midSize, midSize * 0.4);
    ctx.lineTo(-noseSize, 0);
    ctx.lineTo(-midSize, midSize * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(backSize, backSize * 0.6);
    ctx.lineTo(midSize, midSize * 0.4);
    ctx.lineTo(noseSize, 0);
    ctx.lineTo(midSize, midSize * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Main body (center)
    ctx.fillStyle = "#008888";
    ctx.beginPath();
    ctx.moveTo(0, -noseSize); // Nose pointing into screen
    ctx.lineTo(-midSize * 0.8, midSize * 0.3);
    ctx.lineTo(-midSize * 0.5, backSize * 0.5);
    ctx.lineTo(0, backSize * 0.4);
    ctx.lineTo(midSize * 0.5, backSize * 0.5);
    ctx.lineTo(midSize * 0.8, midSize * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit highlight
    ctx.fillStyle = "#00ffff";
    ctx.beginPath();
    ctx.arc(0, noseSize * 0.5, noseSize * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Engine trails
    ctx.shadowBlur = 10;
    ctx.strokeStyle = `rgba(0, 255, 255, ${glowIntensity})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-midSize * 0.4, backSize * 0.5);
    ctx.lineTo(-midSize * 0.4, backSize * 0.8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(midSize * 0.4, backSize * 0.5);
    ctx.lineTo(midSize * 0.4, backSize * 0.8);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();

    // Draw HUD
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`WARP TUNNEL`, 20, 40);
    ctx.fillText(`Score: ${this.score}`, 20, 70);

    const progress = (this.currentZ / this.tunnelLength) * 100;
    ctx.fillText(`Progress: ${Math.floor(progress)}%`, 20, 100);

    ctx.restore();
  }

  isComplete(): boolean {
    return this.complete;
  }

  getScore(): number {
    return this.score;
  }

  reset(): void {
    this.currentZ = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerVelX = 0;
    this.playerVelY = 0;
    this.complete = false;
    this.score = 0;
    this.time = 0;
    this.generateTunnel();
  }
}
