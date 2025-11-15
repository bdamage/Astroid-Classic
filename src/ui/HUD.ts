import {WeaponSystem} from "../systems/WeaponSystem";
import {WaveManager} from "../systems/WaveManager";
import {PowerUpType} from "../entities/PowerUp";

export class HUD {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get 2D context for HUD");
    }
    this.ctx = context;
  }

  render(gameData: {
    score: number;
    lives: number;
    level: number;
    weaponSystem: WeaponSystem;
    waveManager: WaveManager;
    shieldHealth?: number;
    maxShieldHealth?: number;
    comboCount?: number;
    comboMultiplier?: number;
    comboProgress?: number;
  }): void {
    // Top-left: Score and Lives
    this.renderScoreAndLives(gameData.score, gameData.lives);

    // Top-center: Wave information
    this.renderWaveInfo(gameData.waveManager);

    // Top-right: Active power-ups
    this.renderActivePowerUps(gameData.weaponSystem);

    // Center-right: Combo display (if active)
    if (
      gameData.comboCount !== undefined &&
      gameData.comboMultiplier !== undefined &&
      gameData.comboProgress !== undefined &&
      gameData.comboCount >= 3
    ) {
      this.renderComboDisplay(
        gameData.comboCount,
        gameData.comboMultiplier,
        gameData.comboProgress
      );
    }

    // Bottom-left: Shield status (if active)
    if (
      gameData.shieldHealth !== undefined &&
      gameData.maxShieldHealth !== undefined
    ) {
      this.renderShieldStatus(gameData.shieldHealth, gameData.maxShieldHealth);
    }

    // Bottom-right: Weapon status
    this.renderWeaponStatus(gameData.weaponSystem);
  }

  private renderScoreAndLives(score: number, lives: number): void {
    const x = 20;
    const y = 30;

    this.ctx.save();

    // Score
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 20px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`SCORE: ${score.toLocaleString()}`, x, y);

    // Lives
    this.ctx.font = "16px Arial";
    this.ctx.fillText(`LIVES: ${lives}`, x, y + 25);

    // Draw life icons
    for (let i = 0; i < lives; i++) {
      this.drawLifeIcon(x + 70 + i * 20, y + 15);
    }

    this.ctx.restore();
  }

  private drawLifeIcon(x: number, y: number): void {
    this.ctx.save();
    this.ctx.translate(x, y);

    // Small spaceship icon
    this.ctx.strokeStyle = "#00ff00";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(8, 0);
    this.ctx.lineTo(-4, -3);
    this.ctx.lineTo(-2, 0);
    this.ctx.lineTo(-4, 3);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.restore();
  }

  private renderWaveInfo(waveManager: WaveManager): void {
    const centerX = this.canvas.width / 2;
    const y = 30;

    this.ctx.save();
    this.ctx.fillStyle = "#ffff00";
    this.ctx.font = "bold 24px Arial";
    this.ctx.textAlign = "center";

    const waveText = `WAVE ${waveManager.getCurrentWave()}`;
    this.ctx.fillText(waveText, centerX, y);

    // Enemy counter
    if (waveManager.isActive()) {
      this.ctx.font = "16px Arial";
      this.ctx.fillStyle = "#ffffff";
      const enemiesText = `Enemies: ${waveManager.getEnemiesRemaining()}`;
      this.ctx.fillText(enemiesText, centerX, y + 25);

      // Progress bar
      this.renderWaveProgressBar(centerX, y + 35, waveManager);
    }

    this.ctx.restore();
  }

  private renderWaveProgressBar(
    centerX: number,
    y: number,
    waveManager: WaveManager
  ): void {
    const barWidth = 200;
    const barHeight = 6;
    const progress = waveManager.getWaveProgress();

    // Background
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.fillRect(centerX - barWidth / 2, y, barWidth, barHeight);

    // Progress
    this.ctx.fillStyle =
      progress < 0.3 ? "#ff0000" : progress < 0.7 ? "#ffff00" : "#00ff00";
    this.ctx.fillRect(
      centerX - barWidth / 2,
      y,
      barWidth * progress,
      barHeight
    );

    // Border
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(centerX - barWidth / 2, y, barWidth, barHeight);
  }

  private renderActivePowerUps(weaponSystem: WeaponSystem): void {
    const x = this.canvas.width - 20;
    const y = 30;

    this.ctx.save();
    this.ctx.textAlign = "right";
    this.ctx.font = "14px Arial";

    let yOffset = 0;
    const powerUps = weaponSystem["activePowerUps"] || []; // Access private property for display

    if (powerUps.length > 0) {
      this.ctx.fillStyle = "#ffff00";
      this.ctx.fillText("ACTIVE POWER-UPS:", x, y + yOffset);
      yOffset += 20;
    }

    for (const powerUp of powerUps) {
      const timeLeft = Math.ceil(powerUp.timeRemaining / 1000);
      let displayText = "";
      let color = "#ffffff";

      switch (powerUp.type) {
        case PowerUpType.RAPID_FIRE:
          displayText = `Rapid Fire (${timeLeft}s)`;
          color = "#ff6600";
          break;
        case PowerUpType.TRIPLE_SHOT:
          displayText = `Triple Shot (${timeLeft}s)`;
          color = "#00ff00";
          break;
        case PowerUpType.SPREAD_SHOT:
          displayText = `Spread Shot (${timeLeft}s)`;
          color = "#0088ff";
          break;
        case PowerUpType.POWER_SHOT:
          displayText = `Power Shot (${timeLeft}s)`;
          color = "#ff00ff";
          break;
        case PowerUpType.SHIELD:
          displayText = `Shield (${timeLeft}s)`;
          color = "#00ffff";
          break;
        case PowerUpType.SLOW_MOTION:
          displayText = `Slow Motion (${timeLeft}s)`;
          color = "#ffff00";
          break;
        case PowerUpType.HOMING_MISSILE:
          const uses = powerUp.usesRemaining || 0;
          displayText = `Homing Missiles (${uses})`;
          color = "#ff9900";
          break;
      }

      this.ctx.fillStyle = color;
      this.ctx.fillText(displayText, x, y + yOffset);
      yOffset += 18;
    }

    this.ctx.restore();
  }

  private renderComboDisplay(
    comboCount: number,
    comboMultiplier: number,
    comboProgress: number
  ): void {
    const x = this.canvas.width - 200;
    const y = 200;

    // Combo count and multiplier text
    this.ctx.save();

    // Pulsing effect for high combos
    const pulseScale =
      comboCount >= 15 ? 1 + Math.sin(Date.now() / 100) * 0.1 : 1;
    this.ctx.translate(x, y);
    this.ctx.scale(pulseScale, pulseScale);
    this.ctx.translate(-x, -y);

    // Main combo text
    this.ctx.font = "bold 24px Arial";
    this.ctx.textAlign = "right";

    // Color based on combo level
    let comboColor = "#00ff00"; // Green
    if (comboCount >= 50) comboColor = "#ff00ff"; // Purple
    else if (comboCount >= 25) comboColor = "#ff0000"; // Red
    else if (comboCount >= 15) comboColor = "#ff6600"; // Orange
    else if (comboCount >= 10) comboColor = "#ffaa00"; // Yellow-orange

    this.ctx.fillStyle = comboColor;
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(`COMBO x${comboCount}`, x, y);
    this.ctx.fillText(`COMBO x${comboCount}`, x, y);

    // Multiplier badge
    this.ctx.font = "bold 18px Arial";
    this.ctx.fillStyle = "#ffff00";
    this.ctx.strokeText(`${comboMultiplier.toFixed(1)}x SCORE`, x, y + 25);
    this.ctx.fillText(`${comboMultiplier.toFixed(1)}x SCORE`, x, y + 25);

    this.ctx.restore();

    // Progress bar
    const barWidth = 150;
    const barHeight = 8;
    const barX = x - barWidth;
    const barY = y + 35;

    // Background
    this.ctx.fillStyle = "rgba(50, 50, 50, 0.8)";
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress fill - color transitions from green to yellow to red
    const progress = comboProgress;
    let progressColor;
    if (progress > 0.6) {
      progressColor = "#00ff00"; // Green
    } else if (progress > 0.3) {
      progressColor = "#ffff00"; // Yellow
    } else {
      progressColor = "#ff0000"; // Red
    }

    this.ctx.fillStyle = progressColor;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Border
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  private renderShieldStatus(health: number, maxHealth: number): void {
    const x = 20;
    const y = this.canvas.height - 60;

    this.ctx.save();

    // Shield label
    this.ctx.fillStyle = "#00ffff";
    this.ctx.font = "bold 16px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText("SHIELD", x, y);

    // Shield bar
    const barWidth = 100;
    const barHeight = 12;
    const healthPercentage = health / maxHealth;

    // Background
    this.ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
    this.ctx.fillRect(x, y + 5, barWidth, barHeight);

    // Health
    this.ctx.fillStyle = healthPercentage > 0.5 ? "#00ffff" : "#ffff00";
    if (healthPercentage <= 0.25) this.ctx.fillStyle = "#ff0000";

    this.ctx.fillRect(x, y + 5, barWidth * healthPercentage, barHeight);

    // Border
    this.ctx.strokeStyle = "#00ffff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y + 5, barWidth, barHeight);

    // Health text
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "12px Arial";
    this.ctx.fillText(`${health}/${maxHealth}`, x + barWidth + 10, y + 15);

    this.ctx.restore();
  }

  private renderWeaponStatus(weaponSystem: WeaponSystem): void {
    const x = this.canvas.width - 20;
    const y = this.canvas.height - 40;

    this.ctx.save();
    this.ctx.textAlign = "right";
    this.ctx.font = "14px Arial";

    // Current weapon
    let weaponText = "Standard Laser";
    let weaponColor = "#ffffff";

    if (weaponSystem.hasPowerUp(PowerUpType.RAPID_FIRE)) {
      weaponText = "Rapid Fire Laser";
      weaponColor = "#ff6600";
    } else if (weaponSystem.hasPowerUp(PowerUpType.TRIPLE_SHOT)) {
      weaponText = "Triple Laser";
      weaponColor = "#00ff00";
    } else if (weaponSystem.hasPowerUp(PowerUpType.SPREAD_SHOT)) {
      weaponText = "Spread Laser";
      weaponColor = "#0088ff";
    } else if (weaponSystem.hasPowerUp(PowerUpType.POWER_SHOT)) {
      weaponText = "Power Laser";
      weaponColor = "#ff00ff";
    }

    this.ctx.fillStyle = weaponColor;
    this.ctx.fillText(`WEAPON: ${weaponText}`, x, y);

    // Homing missiles count
    const homingCount = weaponSystem.getHomingMissileCount();
    if (homingCount > 0) {
      this.ctx.fillStyle = "#ff9900";
      this.ctx.fillText(`MISSILES: ${homingCount}`, x, y + 16);
    }

    this.ctx.restore();
  }

  renderGameOverScreen(score: number, highScore: number): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.ctx.save();

    // Semi-transparent overlay
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Game Over text
    this.ctx.fillStyle = "#ff0000";
    this.ctx.font = "bold 48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("GAME OVER", centerX, centerY - 60);

    // Score
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "24px Arial";
    this.ctx.fillText(
      `Final Score: ${score.toLocaleString()}`,
      centerX,
      centerY - 10
    );

    // High score
    if (score >= highScore) {
      this.ctx.fillStyle = "#ffff00";
      this.ctx.fillText("NEW HIGH SCORE!", centerX, centerY + 20);
    } else {
      this.ctx.fillStyle = "#888888";
      this.ctx.fillText(
        `High Score: ${highScore.toLocaleString()}`,
        centerX,
        centerY + 20
      );
    }

    // Instructions
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px Arial";
    this.ctx.fillText("Press SPACE to restart", centerX, centerY + 60);

    this.ctx.restore();
  }
}
