export interface LeaderboardEntry {
  name: string;
  score: number;
  wave: number;
  date: string;
  timestamp: number;
}

export class LeaderboardManager {
  private static readonly STORAGE_KEY = "asteroids_leaderboard";
  private static readonly MAX_ENTRIES = 10;
  private entries: LeaderboardEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(LeaderboardManager.STORAGE_KEY);
      if (stored) {
        this.entries = JSON.parse(stored);
        // Ensure entries are sorted by score (highest first)
        this.entries.sort((a, b) => b.score - a.score);
      }
    } catch (error) {
      console.warn("Failed to load leaderboard from storage:", error);
      this.entries = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        LeaderboardManager.STORAGE_KEY,
        JSON.stringify(this.entries)
      );
    } catch (error) {
      console.warn("Failed to save leaderboard to storage:", error);
    }
  }

  addScore(
    score: number,
    wave: number,
    playerName: string = "Anonymous"
  ): boolean {
    const entry: LeaderboardEntry = {
      name: playerName.substring(0, 20), // Limit name length
      score,
      wave,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
    };

    // Add entry
    this.entries.push(entry);

    // Sort by score (highest first)
    this.entries.sort((a, b) => b.score - a.score);

    // Keep only top entries
    this.entries = this.entries.slice(0, LeaderboardManager.MAX_ENTRIES);

    // Save to storage
    this.saveToStorage();

    // Return true if this score made it into the top entries
    return this.entries.includes(entry);
  }

  getHighScore(): number {
    return this.entries.length > 0 ? this.entries[0].score : 0;
  }

  isHighScore(score: number): boolean {
    return score > this.getHighScore();
  }

  getRank(score: number): number {
    const rank = this.entries.findIndex((entry) => score > entry.score);
    return rank === -1 ? this.entries.length + 1 : rank + 1;
  }

  getScoreRank(score: number): number {
    // Returns the rank if the score qualifies for leaderboard, 0 if it doesn't
    const rank = this.getRank(score);
    if (
      this.entries.length < LeaderboardManager.MAX_ENTRIES ||
      rank <= LeaderboardManager.MAX_ENTRIES
    ) {
      return rank;
    }
    return 0; // Doesn't qualify for leaderboard
  }

  getEntries(): LeaderboardEntry[] {
    return [...this.entries]; // Return copy to prevent external modification
  }

  clearLeaderboard(): void {
    this.entries = [];
    this.saveToStorage();
  }

  exportLeaderboard(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  importLeaderboard(data: string): boolean {
    try {
      const imported = JSON.parse(data);
      if (Array.isArray(imported)) {
        // Validate entries
        const validEntries = imported.filter(
          (entry) =>
            typeof entry.name === "string" &&
            typeof entry.score === "number" &&
            typeof entry.wave === "number" &&
            typeof entry.date === "string" &&
            typeof entry.timestamp === "number"
        );

        this.entries = validEntries;
        this.entries.sort((a, b) => b.score - a.score);
        this.entries = this.entries.slice(0, LeaderboardManager.MAX_ENTRIES);
        this.saveToStorage();
        return true;
      }
    } catch (error) {
      console.warn("Failed to import leaderboard:", error);
    }
    return false;
  }

  getScoreStatistics(): {
    averageScore: number;
    totalGames: number;
    bestWave: number;
    averageWave: number;
  } {
    if (this.entries.length === 0) {
      return {averageScore: 0, totalGames: 0, bestWave: 0, averageWave: 0};
    }

    const totalScore = this.entries.reduce(
      (sum, entry) => sum + entry.score,
      0
    );
    const totalWave = this.entries.reduce((sum, entry) => sum + entry.wave, 0);
    const bestWave = Math.max(...this.entries.map((entry) => entry.wave));

    return {
      averageScore: Math.round(totalScore / this.entries.length),
      totalGames: this.entries.length,
      bestWave,
      averageWave: Math.round(totalWave / this.entries.length),
    };
  }
}

export class LeaderboardUI {
  private leaderboard: LeaderboardManager;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isVisible: boolean = false;

  constructor(canvas: HTMLCanvasElement, leaderboard: LeaderboardManager) {
    this.canvas = canvas;
    this.leaderboard = leaderboard;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get 2D context for LeaderboardUI");
    }
    this.ctx = context;
  }

  show(): void {
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }

  isShowing(): boolean {
    return this.isVisible;
  }

  render(): void {
    if (!this.isVisible) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.ctx.save();

    // Semi-transparent overlay
    this.ctx.fillStyle = "rgba(0, 0, 20, 0.9)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Title
    this.ctx.fillStyle = "#ffff00";
    this.ctx.font = "bold 36px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("LEADERBOARD", centerX, centerY - 200);

    // Entries
    const entries = this.leaderboard.getEntries();
    this.ctx.font = "18px monospace";

    // Headers
    this.ctx.fillStyle = "#ffffff";
    this.ctx.textAlign = "left";
    this.ctx.fillText("RANK", centerX - 200, centerY - 150);
    this.ctx.fillText("NAME", centerX - 140, centerY - 150);
    this.ctx.fillText("SCORE", centerX - 20, centerY - 150);
    this.ctx.fillText("WAVE", centerX + 80, centerY - 150);
    this.ctx.fillText("DATE", centerX + 130, centerY - 150);

    // Draw separator line
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 210, centerY - 140);
    this.ctx.lineTo(centerX + 210, centerY - 140);
    this.ctx.stroke();

    // Entries
    for (let i = 0; i < Math.min(entries.length, 10); i++) {
      const entry = entries[i];
      const y = centerY - 120 + i * 25;

      // Highlight top 3
      if (i < 3) {
        const colors = ["#ffff00", "#c0c0c0", "#cd7f32"]; // Gold, Silver, Bronze
        this.ctx.fillStyle = colors[i];
      } else {
        this.ctx.fillStyle = "#ffffff";
      }

      // Rank
      this.ctx.textAlign = "right";
      this.ctx.fillText(`${i + 1}.`, centerX - 150, y);

      // Name
      this.ctx.textAlign = "left";
      this.ctx.fillText(entry.name, centerX - 140, y);

      // Score
      this.ctx.textAlign = "right";
      this.ctx.fillText(entry.score.toLocaleString(), centerX + 70, y);

      // Wave
      this.ctx.textAlign = "center";
      this.ctx.fillText(entry.wave.toString(), centerX + 100, y);

      // Date
      this.ctx.textAlign = "left";
      this.ctx.fillText(entry.date, centerX + 130, y);
    }

    // Statistics
    const stats = this.leaderboard.getScoreStatistics();
    if (stats.totalGames > 0) {
      this.ctx.fillStyle = "#888888";
      this.ctx.font = "14px Arial";
      this.ctx.textAlign = "center";

      const statsY = centerY + 120;
      this.ctx.fillText(
        `Games Played: ${stats.totalGames}`,
        centerX - 100,
        statsY
      );
      this.ctx.fillText(
        `Average Score: ${stats.averageScore.toLocaleString()}`,
        centerX + 100,
        statsY
      );
      this.ctx.fillText(
        `Best Wave: ${stats.bestWave}`,
        centerX - 100,
        statsY + 20
      );
      this.ctx.fillText(
        `Average Wave: ${stats.averageWave}`,
        centerX + 100,
        statsY + 20
      );
    }

    // Instructions
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Press ESC to close", centerX, this.canvas.height - 30);

    this.ctx.restore();
  }

  promptForName(score: number, wave: number): Promise<string> {
    return new Promise((resolve) => {
      const name =
        prompt(
          `New High Score! ${score.toLocaleString()} points\nEnter your name:`
        ) || "Anonymous";
      this.leaderboard.addScore(score, wave, name);
      resolve(name);
    });
  }
}
