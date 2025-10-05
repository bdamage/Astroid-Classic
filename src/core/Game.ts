import {GameManager} from "../managers/GameManager";
import {SoundManager} from "../audio/SoundManager";
import {ScreenShake} from "../effects/ScreenShake";
import {Starfield} from "../effects/Starfield";
import {HUD} from "../ui/HUD";
import {LeaderboardManager, LeaderboardUI} from "../systems/LeaderboardManager";

export const GameState = {
  MENU: "menu",
  PLAYING: "playing",
  GAME_OVER: "game_over",
  PAUSED: "paused",
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

export class InputManager {
  private keys: Set<string> = new Set();
  private keyPressed: Set<string> = new Set();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) {
        this.keyPressed.add(e.code);
      }
      this.keys.add(e.code);
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });

    // Prevent arrow keys from scrolling
    window.addEventListener("keydown", (e) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }
    });
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key);
  }

  isKeyPressed(key: string): boolean {
    return this.keyPressed.has(key);
  }

  clearPressed(): void {
    this.keyPressed.clear();
  }
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private gameState: GameState = GameState.MENU;
  private inputManager: InputManager;
  private gameManager: GameManager;
  private soundManager: SoundManager;
  private screenShake: ScreenShake;
  private starfield: Starfield;
  private hud: HUD;
  private leaderboard: LeaderboardManager;
  private leaderboardUI: LeaderboardUI;

  public score: number = 0;
  public lives: number = 3;
  public level: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get 2D context from canvas");
    }
    this.ctx = context;
    this.inputManager = new InputManager();
    this.soundManager = new SoundManager();
    this.screenShake = new ScreenShake();
    this.starfield = new Starfield(250); // 250 stars
    this.leaderboard = new LeaderboardManager();
    this.hud = new HUD(canvas);
    this.leaderboardUI = new LeaderboardUI(canvas, this.leaderboard);
    this.gameManager = new GameManager(this);

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.starfield.updateCanvasSize(this.canvas.width, this.canvas.height);
  }

  start(): void {
    this.gameLoop(0);
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();
    this.inputManager.clearPressed();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(deltaTime: number): void {
    // Update screen shake
    this.screenShake.update(deltaTime);

    // Update starfield
    this.starfield.update(deltaTime);

    // Handle global input
    if (this.inputManager.isKeyPressed("Escape")) {
      if (this.gameState === GameState.PLAYING) {
        this.gameState = GameState.PAUSED;
      } else if (this.gameState === GameState.PAUSED) {
        this.gameState = GameState.PLAYING;
      }
    }

    switch (this.gameState) {
      case GameState.MENU:
        this.updateMenu();
        break;
      case GameState.PLAYING:
        this.updateGame(deltaTime);
        break;
      case GameState.GAME_OVER:
        this.updateGameOver();
        break;
    }
  }

  private updateMenu(): void {
    if (
      this.inputManager.isKeyPressed("Space") ||
      this.inputManager.isKeyPressed("Enter")
    ) {
      this.startNewGame();
    }
  }

  private updateGame(deltaTime: number): void {
    this.gameManager.update(deltaTime);
  }

  private updateGameOver(): void {
    if (
      this.inputManager.isKeyPressed("Space") ||
      this.inputManager.isKeyPressed("Enter")
    ) {
      this.gameState = GameState.MENU;
      this.resetGame();
    }
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render starfield background
    this.starfield.render(this.ctx);

    // Apply screen shake
    this.ctx.save();
    const shakeOffset = this.screenShake.getOffset();
    this.ctx.translate(shakeOffset.x, shakeOffset.y);

    switch (this.gameState) {
      case GameState.MENU:
        this.renderMenu();
        break;
      case GameState.PLAYING:
        this.renderGame();
        break;
      case GameState.PAUSED:
        this.renderGame();
        this.renderPauseOverlay();
        break;
      case GameState.GAME_OVER:
        this.renderGameOver();
        break;
    }

    // Restore context after screen shake
    this.ctx.restore();
  }

  private renderMenu(): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "ASTEROIDS",
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    this.ctx.font = "24px Arial";
    this.ctx.fillText(
      "Press SPACE to start",
      this.canvas.width / 2,
      this.canvas.height / 2 + 50
    );

    this.ctx.font = "16px Arial";
    this.ctx.fillText(
      "Arrow Keys or WASD to move, SPACE to shoot, ESC to pause",
      this.canvas.width / 2,
      this.canvas.height / 2 + 100
    );
  }

  private renderGame(): void {
    this.gameManager.render(this.ctx);
    this.renderUI();
  }

  private renderPauseOverlay(): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);

    this.ctx.font = "24px Arial";
    this.ctx.fillText(
      "Press ESC to resume",
      this.canvas.width / 2,
      this.canvas.height / 2 + 50
    );
  }

  private renderGameOver(): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "GAME OVER",
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    this.ctx.font = "24px Arial";
    this.ctx.fillText(
      `Final Score: ${this.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
    this.ctx.fillText(
      "Press SPACE to return to menu",
      this.canvas.width / 2,
      this.canvas.height / 2 + 50
    );
  }

  private renderUI(): void {
    // Use the new HUD system for enhanced UI
    this.hud.render({
      score: this.score,
      lives: this.lives,
      level: this.level,
      weaponSystem: this.gameManager.currentWeaponSystem,
      waveManager: this.gameManager.currentWaveManager,
      shieldHealth: this.gameManager.shieldHealth,
      maxShieldHealth: this.gameManager.maxShieldHealth
    });
  }

  private startNewGame(): void {
    this.gameState = GameState.PLAYING;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameManager.startNewGame();
  }

  private resetGame(): void {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
  }

  public get canvasWidth(): number {
    return this.canvas.width;
  }

  public get canvasHeight(): number {
    return this.canvas.height;
  }

  public get input(): InputManager {
    return this.inputManager;
  }

  public get state(): GameState {
    return this.gameState;
  }

  public gameOver(): void {
    this.gameState = GameState.GAME_OVER;
    // Add score to leaderboard
    this.leaderboard.addScore(this.score, this.gameManager.currentWave, "Player");
  }

  public addScore(points: number): void {
    this.score += points;
  }

  public loseLife(): void {
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  public get sound(): SoundManager {
    return this.soundManager;
  }

  public get shake(): ScreenShake {
    return this.screenShake;
  }
}
