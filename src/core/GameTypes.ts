export interface IGameContext {
  canvasWidth: number;
  canvasHeight: number;
  level: number;
  lives: number;
  state: string;
  input: {
    isKeyDown(key: string): boolean;
    isKeyPressed(key: string): boolean;
  };
  sound: {
    playSound(type: string, volume?: number, pitch?: number): void;
  };
  shake: {
    shake(intensity: number, duration: number): void;
  };
  achievements: {
    onKill(currentTime: number): any;
    onPowerUpCollected(): any;
    onWaveCleared(waveNumber: number): any;
    resetStreaks(): void;
    getCurrentKillStreak(): number;
  };
  achievementUI: {
    showAchievement(achievement: any): void;
    showFloatingScore(points: number, x: number, y: number): void;
    showKillStreakCounter(streak: number, x: number, y: number): void;
    showComboMultiplier(multiplier: number): void;
  };
  addScore(points: number): void;
  loseLife(): void;
  gameOver(): void;
  difficulty: {
    getCurrentSettings(): any;
    getAsteroidSpeed(baseSpeed: number): number;
    getScoreValue(baseScore: number): number;
    shouldSpawnPowerUp(baseChance: number): boolean;
    getPlayerMaxHealth(baseHealth: number): number;
    getShieldDuration(baseDuration: number): number;
  };
}

export const GameState = {
  MENU: "menu",
  PLAYING: "playing",
  GAME_OVER: "game_over",
  PAUSED: "paused",
  LEADERBOARD: "leaderboard",
  OPTIONS: "options",
  NAME_ENTRY: "name_entry",
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];
