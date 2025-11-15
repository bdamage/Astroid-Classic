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
  
  // Combo system
  private comboCount: number = 0;
  private comboMultiplier: number = 1;
  private lastComboTime: number = 0;
  private comboDecayTimer: number = 0;

  // Streak thresholds
  private readonly KILL_STREAK_THRESHOLDS = [10, 20, 30, 50, 80, 100];
  private readonly POWER_UP_STREAK_THRESHOLDS = [3, 5, 8];
  private readonly STREAK_TIMEOUT = 5000; // 5 seconds
  private readonly COMBO_TIMEOUT = 3000; // 3 seconds to maintain combo
  private readonly MAX_COMBO_MULTIPLIER = 10;
  private readonly COMBO_THRESHOLDS = [5, 10, 15, 25, 50, 100];

  update(deltaTime: number, currentTime: number): void {
    // Decay combo if no kills
    if (currentTime - this.lastComboTime > this.COMBO_TIMEOUT) {
      this.comboDecayTimer += deltaTime;
      if (this.comboDecayTimer >= 100) { // Decay every 100ms
        if (this.comboCount > 0) {
          this.comboCount = Math.max(0, this.comboCount - 1);
          this.updateComboMultiplier();
        }
        this.comboDecayTimer = 0;
      }
    }
  }

  onKill(currentTime: number): Achievement | null {
    // Reset streak if too much time has passed
    if (currentTime - this.lastKillTime > this.STREAK_TIMEOUT) {
      this.killStreak = 0;
    }

    this.killStreak++;
    this.lastKillTime = currentTime;
    
    // Update combo
    this.comboCount++;
    this.lastComboTime = currentTime;
    this.comboDecayTimer = 0;
    this.updateComboMultiplier();

    // Check for combo achievements
    for (const threshold of this.COMBO_THRESHOLDS) {
      if (this.comboCount === threshold) {
        return this.createComboAchievement(threshold);
      }
    }

    // Check for kill streak achievements
    for (const threshold of this.KILL_STREAK_THRESHOLDS) {
      if (this.killStreak === threshold) {
        return this.createKillStreakAchievement(threshold);
      }
    }

    return null;
  }

  onMiss(): void {
    // Missing breaks combo
    if (this.comboCount >= 5) {
      // Only break combo if it was significant
      this.comboCount = 0;
      this.comboMultiplier = 1;
    }
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
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.lastComboTime = 0;
  }

  private updateComboMultiplier(): void {
    // Combo multiplier increases every 5 kills
    this.comboMultiplier = Math.min(
      1 + Math.floor(this.comboCount / 5) * 0.5,
      this.MAX_COMBO_MULTIPLIER
    );
  }

  private createComboAchievement(combo: number): Achievement {
    const titles = {
      5: "COMBO x5!",
      10: "COMBO x10!",
      15: "COMBO x15!",
      25: "MEGA COMBO x25!",
      50: "ULTRA COMBO x50!",
      100: "GODLY COMBO x100!",
    };

    const colors = {
      5: "#ffff00",
      10: "#ffaa00",
      15: "#ff6600",
      25: "#ff00ff",
      50: "#00ffff",
      100: "#ffffff",
    };

    return {
      type: "combo",
      text: titles[combo as keyof typeof titles] || `COMBO x${combo}!`,
      points: combo * 10,
      color: colors[combo as keyof typeof colors] || "#ffff00",
      scale: Math.min(1.0 + combo / 20, 2.5),
      duration: 2000,
    };
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

  getComboCount(): number {
    return this.comboCount;
  }

  getComboMultiplier(): number {
    return this.comboMultiplier;
  }

  getComboProgress(): number {
    // Returns 0-1 progress until combo breaks
    const timeSinceLastKill = Date.now() - this.lastComboTime;
    return Math.max(0, 1 - timeSinceLastKill / this.COMBO_TIMEOUT);
  }
}
