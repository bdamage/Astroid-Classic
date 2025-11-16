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
  time: {
    freeze(duration: number, scale?: number): void;
    setScale(scale: number, duration?: number): void;
    reset(): void;
    getScale(): number;
  };
  achievements: {
    update(deltaTime: number, currentTime: number): void;
    onKill(currentTime: number): any;
    onPowerUpCollected(): any;
    onWaveCleared(waveNumber: number): any;
    resetStreaks(): void;
    getCurrentKillStreak(): number;
    getComboCount(): number;
    getComboMultiplier(): number;
    getComboProgress(): number;
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
  enterWarpTunnel(): void;
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
  WARP_TUNNEL: "warp_tunnel",
  GAME_OVER: "game_over",
  PAUSED: "paused",
  LEADERBOARD: "leaderboard",
  OPTIONS: "options",
  NAME_ENTRY: "name_entry",
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];
