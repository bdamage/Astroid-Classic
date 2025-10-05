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
  addScore(points: number): void;
  loseLife(): void;
  gameOver(): void;
}

export const GameState = {
  MENU: "menu",
  PLAYING: "playing",
  GAME_OVER: "game_over",
  PAUSED: "paused",
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];
