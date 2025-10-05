import type {Achievement} from "../systems/AchievementTracker";

export interface AnimatedText {
  text: string;
  x: number;
  y: number;
  scale: number;
  targetScale: number;
  alpha: number;
  color: string;
  duration: number;
  elapsed: number;
  vx: number;
  vy: number;
  type: string;
}

export class AchievementDisplay {
  private activeTexts: AnimatedText[] = [];
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  showAchievement(achievement: Achievement): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const animatedText: AnimatedText = {
      text: achievement.text,
      x: centerX,
      y: centerY - 100,
      scale: 0.1,
      targetScale: achievement.scale,
      alpha: 1.0,
      color: achievement.color,
      duration: achievement.duration,
      elapsed: 0,
      vx: 0,
      vy: -20, // Drift upward
      type: achievement.type,
    };

    this.activeTexts.push(animatedText);

    // Add bonus points text
    if (achievement.points > 0) {
      const pointsText: AnimatedText = {
        text: `+${achievement.points.toLocaleString()}`,
        x: centerX,
        y: centerY - 50,
        scale: 0.1,
        targetScale: 1.0,
        alpha: 1.0,
        color: "#ffff00",
        duration: 2000,
        elapsed: 0,
        vx: 0,
        vy: -30,
        type: "points",
      };

      this.activeTexts.push(pointsText);
    }
  }

  showFloatingScore(points: number, x: number, y: number): void {
    const animatedText: AnimatedText = {
      text: `+${points}`,
      x: x,
      y: y,
      scale: 1.0,
      targetScale: 1.2,
      alpha: 1.0,
      color: "#ffffff",
      duration: 1500,
      elapsed: 0,
      vx: (Math.random() - 0.5) * 40,
      vy: -60,
      type: "floating_score",
    };

    this.activeTexts.push(animatedText);
  }

  showKillStreakCounter(streak: number, x: number, y: number): void {
    if (streak < 3) return; // Only show for streaks of 3+

    const animatedText: AnimatedText = {
      text: `${streak}x`,
      x: x,
      y: y - 30,
      scale: 0.8,
      targetScale: 1.5,
      alpha: 1.0,
      color: "#ff4444",
      duration: 1000,
      elapsed: 0,
      vx: 0,
      vy: -20,
      type: "streak_counter",
    };

    this.activeTexts.push(animatedText);
  }

  showComboMultiplier(multiplier: number): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const animatedText: AnimatedText = {
      text: `COMBO x${multiplier}`,
      x: centerX + 200,
      y: centerY - 150,
      scale: 0.5,
      targetScale: 1.2,
      alpha: 1.0,
      color: "#00ff88",
      duration: 2000,
      elapsed: 0,
      vx: 0,
      vy: -10,
      type: "combo",
    };

    this.activeTexts.push(animatedText);
  }

  update(deltaTime: number): void {
    for (let i = this.activeTexts.length - 1; i >= 0; i--) {
      const text = this.activeTexts[i];
      text.elapsed += deltaTime;

      // Animation phases
      const progress = text.elapsed / text.duration;

      // Scale animation (ease out)
      const scaleProgress = Math.min(progress * 3, 1);
      text.scale = text.targetScale * this.easeOut(scaleProgress);

      // Movement
      text.x += text.vx * (deltaTime / 1000);
      text.y += text.vy * (deltaTime / 1000);

      // Fade out in the last 25% of duration
      if (progress > 0.75) {
        const fadeProgress = (progress - 0.75) / 0.25;
        text.alpha = 1 - this.easeIn(fadeProgress);
      }

      // Remove expired texts
      if (text.elapsed >= text.duration) {
        this.activeTexts.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const text of this.activeTexts) {
      ctx.save();

      // Set up text rendering
      ctx.globalAlpha = text.alpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Different font sizes for different types
      let fontSize = 24;
      if (
        text.type === "kill_streak" ||
        text.type === "wave_clear" ||
        text.type === "boss_kill"
      ) {
        fontSize = 36;
      } else if (text.type === "points") {
        fontSize = 20;
      } else if (text.type === "floating_score") {
        fontSize = 16;
      } else if (text.type === "streak_counter") {
        fontSize = 18;
      }

      ctx.font = `bold ${fontSize * text.scale}px Arial`;

      // Add text shadow for better visibility
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillText(text.text, text.x + 2, text.y + 2);

      // Main text
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y);

      // Add glow effect for achievements
      if (
        text.type === "kill_streak" ||
        text.type === "wave_clear" ||
        text.type === "boss_kill"
      ) {
        ctx.shadowColor = text.color;
        ctx.shadowBlur = 20;
        ctx.fillText(text.text, text.x, text.y);
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    ctx.restore();
  }

  clear(): void {
    this.activeTexts.length = 0;
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeIn(t: number): number {
    return t * t * t;
  }
}
