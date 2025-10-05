import type {LeaderboardEntry} from "../systems/LeaderboardManager";

export class LeaderboardUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scores: LeaderboardEntry[] = [];

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  public setScores(scores: LeaderboardEntry[]): void {
    this.scores = scores;
  }

  public render(): void {
    const centerX = this.canvas.width / 2;
    const startY = 120;

    // Title
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("LEADERBOARD", centerX, 80);

    // Header
    this.ctx.font = "24px Arial";
    this.ctx.fillStyle = "#cccccc";
    this.ctx.textAlign = "left";
    this.ctx.fillText("RANK", centerX - 300, startY);
    this.ctx.fillText("NAME", centerX - 200, startY);
    this.ctx.fillText("SCORE", centerX - 50, startY);
    this.ctx.fillText("DATE", centerX + 100, startY);

    // Draw line under header
    this.ctx.strokeStyle = "#666666";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 320, startY + 10);
    this.ctx.lineTo(centerX + 320, startY + 10);
    this.ctx.stroke();

    // Scores
    this.ctx.font = "20px Arial";
    const maxScores = Math.min(this.scores.length, 10); // Show top 10

    for (let i = 0; i < maxScores; i++) {
      const y = startY + 50 + i * 35;
      const score = this.scores[i];

      // Highlight top 3
      if (i < 3) {
        const colors = ["#FFD700", "#C0C0C0", "#CD7F32"]; // Gold, Silver, Bronze
        this.ctx.fillStyle = colors[i];
      } else {
        this.ctx.fillStyle = "#ffffff";
      }

      // Rank
      this.ctx.textAlign = "center";
      this.ctx.fillText(`${i + 1}`, centerX - 300, y);

      // Name
      this.ctx.textAlign = "left";
      this.ctx.fillText(score.name, centerX - 200, y);

      // Score
      this.ctx.textAlign = "right";
      this.ctx.fillText(score.score.toLocaleString(), centerX + 50, y);

      // Date
      this.ctx.textAlign = "left";
      this.ctx.fillText(score.date, centerX + 100, y);
    }

    // No scores message
    if (this.scores.length === 0) {
      this.ctx.fillStyle = "#888888";
      this.ctx.font = "24px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("No scores yet!", centerX, startY + 100);
      this.ctx.fillText(
        "Play a game to set your first score!",
        centerX,
        startY + 140
      );
    }

    // Instructions
    this.ctx.fillStyle = "#666666";
    this.ctx.font = "18px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Press ESC to return to menu",
      centerX,
      this.canvas.height - 50
    );
  }
}
