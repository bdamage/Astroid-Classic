export interface Achievement {
  type: string;
  text: string;
  points: number;
  color: string;
  scale: number;
  duration: number;
}

export class AchievementTracker {
  private killStreak: number = 0;
  private powerUpStreak: number = 0;
  private lastKillTime: number = 0;

  // Streak thresholds
  private readonly KILL_STREAK_THRESHOLDS = [10, 20, 30, 50, 80, 100];
  private readonly POWER_UP_STREAK_THRESHOLDS = [3, 5, 8];
  private readonly STREAK_TIMEOUT = 5000; // 5 seconds

  onKill(currentTime: number): Achievement | null {
    // Reset streak if too much time has passed
    if (currentTime - this.lastKillTime > this.STREAK_TIMEOUT) {
      this.killStreak = 0;
    }

    this.killStreak++;
    this.lastKillTime = currentTime;

    // Check for kill streak achievements
    for (const threshold of this.KILL_STREAK_THRESHOLDS) {
      if (this.killStreak === threshold) {
        return this.createKillStreakAchievement(threshold);
      }
    }

    return null;
  }

  onPowerUpCollected(): Achievement | null {
    this.powerUpStreak++;

    // Check for power-up streak achievements
    for (const threshold of this.POWER_UP_STREAK_THRESHOLDS) {
      if (this.powerUpStreak === threshold) {
        return this.createPowerUpStreakAchievement(threshold);
      }
    }

    return null;
  }

  onWaveCleared(waveNumber: number): Achievement {
    return {
      type: "wave_clear",
      text: `WAVE ${waveNumber} CLEARED!`,
      points: waveNumber * 100,
      color: "#00ff00",
      scale: 1.5,
      duration: 3000,
    };
  }

  onBossKilled(): Achievement {
    return {
      type: "boss_kill",
      text: "BOSS ELIMINATED!",
      points: 1000,
      color: "#ff6600",
      scale: 2.0,
      duration: 4000,
    };
  }

  onPerfectAccuracy(): Achievement {
    return {
      type: "perfect_accuracy",
      text: "PERFECT ACCURACY!",
      points: 500,
      color: "#ffff00",
      scale: 1.3,
      duration: 3000,
    };
  }

  resetStreaks(): void {
    this.killStreak = 0;
    this.powerUpStreak = 0;
  }

  private createKillStreakAchievement(streak: number): Achievement {
    const titles = {
      10: "KILLING SPREE!",
      20: "RAMPAGE!",
      30: "DOMINATING!",
      50: "UNSTOPPABLE!",
      80: "GODLIKE!",
      100: "LEGENDARY!",
    };

    const colors = {
      3: "#ff4444",
      5: "#ff6600",
      8: "#ffaa00",
      12: "#ffff00",
      20: "#00ff00",
      30: "#00ffff",
    };

    return {
      type: "kill_streak",
      text: titles[streak as keyof typeof titles] || `${streak} KILL STREAK!`,
      points: streak * 50,
      color: colors[streak as keyof typeof colors] || "#ff4444",
      scale: Math.min(1.2 + streak / 10, 2.5),
      duration: 3000 + streak * 100,
    };
  }

  private createPowerUpStreakAchievement(streak: number): Achievement {
    const titles = {
      3: "POWER-UP MANIAC!",
      5: "COLLECTOR!",
      8: "POWER MASTER!",
    };

    return {
      type: "powerup_streak",
      text: titles[streak as keyof typeof titles] || `POWER STREAK x${streak}!`,
      points: streak * 25,
      color: "#00aaff",
      scale: 1.3,
      duration: 2500,
    };
  }

  getCurrentKillStreak(): number {
    return this.killStreak;
  }

  getCurrentPowerUpStreak(): number {
    return this.powerUpStreak;
  }
}
