export const DifficultyLevel = {
  EASY: "Easy",
  NORMAL: "Normal",
  HARD: "Hard",
  INSANE: "Insane",
} as const;

export type DifficultyLevel =
  (typeof DifficultyLevel)[keyof typeof DifficultyLevel];

export interface DifficultySettings {
  level: DifficultyLevel;
  asteroidSpeedMultiplier: number;
  asteroidSpawnRate: number;
  enemySpawnRate: number;
  enemySpeedMultiplier: number;
  playerHealthMultiplier: number;
  scoreMultiplier: number;
  powerUpSpawnRate: number;
  maxAsteroidsOnScreen: number;
  waveProgressionSpeed: number;
  shieldDurationMultiplier: number;
}

export class DifficultyManager {
  private static readonly STORAGE_KEY = "asteroids_difficulty";
  private currentDifficulty: DifficultyLevel = DifficultyLevel.NORMAL;

  private readonly difficultySettings: Record<
    DifficultyLevel,
    DifficultySettings
  > = {
    [DifficultyLevel.EASY]: {
      level: DifficultyLevel.EASY,
      asteroidSpeedMultiplier: 0.7,
      asteroidSpawnRate: 0.8,
      enemySpawnRate: 0.6,
      enemySpeedMultiplier: 0.8,
      playerHealthMultiplier: 1.5,
      scoreMultiplier: 0.8,
      powerUpSpawnRate: 1.3,
      maxAsteroidsOnScreen: 8,
      waveProgressionSpeed: 0.8,
      shieldDurationMultiplier: 1.3,
    },
    [DifficultyLevel.NORMAL]: {
      level: DifficultyLevel.NORMAL,
      asteroidSpeedMultiplier: 1.0,
      asteroidSpawnRate: 1.0,
      enemySpawnRate: 1.0,
      enemySpeedMultiplier: 1.0,
      playerHealthMultiplier: 1.0,
      scoreMultiplier: 1.0,
      powerUpSpawnRate: 1.0,
      maxAsteroidsOnScreen: 12,
      waveProgressionSpeed: 1.0,
      shieldDurationMultiplier: 1.0,
    },
    [DifficultyLevel.HARD]: {
      level: DifficultyLevel.HARD,
      asteroidSpeedMultiplier: 1.3,
      asteroidSpawnRate: 1.2,
      enemySpawnRate: 1.4,
      enemySpeedMultiplier: 1.2,
      playerHealthMultiplier: 0.8,
      scoreMultiplier: 1.3,
      powerUpSpawnRate: 0.8,
      maxAsteroidsOnScreen: 16,
      waveProgressionSpeed: 1.2,
      shieldDurationMultiplier: 0.8,
    },
    [DifficultyLevel.INSANE]: {
      level: DifficultyLevel.INSANE,
      asteroidSpeedMultiplier: 1.6,
      asteroidSpawnRate: 1.5,
      enemySpawnRate: 1.8,
      enemySpeedMultiplier: 1.5,
      playerHealthMultiplier: 0.6,
      scoreMultiplier: 1.8,
      powerUpSpawnRate: 0.6,
      maxAsteroidsOnScreen: 20,
      waveProgressionSpeed: 1.4,
      shieldDurationMultiplier: 0.6,
    },
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(DifficultyManager.STORAGE_KEY);
      if (
        stored &&
        Object.values(DifficultyLevel).includes(stored as DifficultyLevel)
      ) {
        this.currentDifficulty = stored as DifficultyLevel;
      }
    } catch (error) {
      console.warn("Failed to load difficulty from storage:", error);
      this.currentDifficulty = DifficultyLevel.NORMAL;
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        DifficultyManager.STORAGE_KEY,
        this.currentDifficulty
      );
    } catch (error) {
      console.warn("Failed to save difficulty to storage:", error);
    }
  }

  public setDifficulty(difficulty: DifficultyLevel): void {
    this.currentDifficulty = difficulty;
    this.saveToStorage();
  }

  public getCurrentDifficulty(): DifficultyLevel {
    return this.currentDifficulty;
  }

  public getCurrentSettings(): DifficultySettings {
    return this.difficultySettings[this.currentDifficulty];
  }

  public getNextDifficulty(): DifficultyLevel {
    const levels = Object.values(DifficultyLevel);
    const currentIndex = levels.indexOf(this.currentDifficulty);
    const nextIndex = (currentIndex + 1) % levels.length;
    return levels[nextIndex];
  }

  public cycleDifficulty(): void {
    this.setDifficulty(this.getNextDifficulty());
  }

  public getDifficultyDescription(difficulty?: DifficultyLevel): string {
    const level = difficulty || this.currentDifficulty;
    switch (level) {
      case DifficultyLevel.EASY:
        return "Slower asteroids, more health, frequent power-ups";
      case DifficultyLevel.NORMAL:
        return "Balanced gameplay experience";
      case DifficultyLevel.HARD:
        return "Faster enemies, less health, better rewards";
      case DifficultyLevel.INSANE:
        return "Extreme challenge, maximum rewards";
      default:
        return "Unknown difficulty";
    }
  }

  public getAllDifficulties(): DifficultyLevel[] {
    return Object.values(DifficultyLevel);
  }

  // Helper methods for game systems
  public getAsteroidSpeed(baseSpeed: number): number {
    return baseSpeed * this.getCurrentSettings().asteroidSpeedMultiplier;
  }

  public getScoreValue(baseScore: number): number {
    return Math.round(baseScore * this.getCurrentSettings().scoreMultiplier);
  }

  public shouldSpawnPowerUp(baseChance: number): boolean {
    const adjustedChance =
      baseChance * this.getCurrentSettings().powerUpSpawnRate;
    return Math.random() < adjustedChance;
  }

  public getPlayerMaxHealth(baseHealth: number): number {
    return Math.round(
      baseHealth * this.getCurrentSettings().playerHealthMultiplier
    );
  }

  public getShieldDuration(baseDuration: number): number {
    return baseDuration * this.getCurrentSettings().shieldDurationMultiplier;
  }

  public getWaveProgressionRate(baseRate: number): number {
    return baseRate * this.getCurrentSettings().waveProgressionSpeed;
  }
}
