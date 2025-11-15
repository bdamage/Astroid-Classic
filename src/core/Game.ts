import {GameManager} from "../managers/GameManager";
import {SoundManager} from "../audio/SoundManager";
import {MusicManager} from "../audio/MusicManager";
import {ScreenShake} from "../effects/ScreenShake";
import {Starfield} from "../effects/Starfield";
import {AchievementDisplay} from "../effects/AchievementDisplay";
import {TimeScale} from "../effects/TimeScale";
import {HUD} from "../ui/HUD";
import {MenuUI} from "../ui/MenuUI";
import {NameEntryUI} from "../ui/NameEntryUI";
import {LeaderboardUI} from "../ui/LeaderboardUI";
import {OptionsUI} from "../ui/OptionsUI";
import {LeaderboardManager} from "../systems/LeaderboardManager";
import {AchievementTracker} from "../systems/AchievementTracker";
import {DifficultyManager} from "../systems/DifficultyManager";
import type {IGameContext} from "./GameTypes";
import type {MenuItem} from "../ui/MenuUI";
import {GameState} from "./GameTypes";

export class InputManager {
  private keys: Set<string> = new Set();
  private keyPressed: Set<string> = new Set();
  private characterInput: string[] = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) {
        this.keyPressed.add(e.code);
      }
      this.keys.add(e.code);

      // Capture character input for name entry
      if (e.key.length === 1) {
        this.characterInput.push(e.key);
      } else if (
        e.key === "Backspace" ||
        e.key === "Enter" ||
        e.key === "Escape"
      ) {
        this.characterInput.push(e.key);
      }
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

  getCharacterInput(): string[] {
    return [...this.characterInput];
  }

  clearPressed(): void {
    this.keyPressed.clear();
    this.characterInput.length = 0;
  }
}

export class Game implements IGameContext {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private gameState: GameState = GameState.MENU;
  private inputManager: InputManager;
  private gameManager: GameManager;
  private soundManager: SoundManager;
  private musicManager: MusicManager;
  private screenShake: ScreenShake;
  private timeScale: TimeScale;
  private starfield: Starfield;
  private hud: HUD;
  private leaderboard: LeaderboardManager;
  private leaderboardUI: LeaderboardUI;
  private menuUI: MenuUI;
  private nameEntryUI: NameEntryUI;
  private optionsUI: OptionsUI;
  private difficultyManager: DifficultyManager;
  private achievementTracker: AchievementTracker;
  private achievementDisplay: AchievementDisplay;

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
    this.musicManager = new MusicManager();
    this.screenShake = new ScreenShake();
    this.timeScale = new TimeScale();
    this.starfield = new Starfield(250); // 250 stars
    this.leaderboard = new LeaderboardManager();
    this.difficultyManager = new DifficultyManager();
    this.hud = new HUD(canvas);
    this.leaderboardUI = new LeaderboardUI(canvas, this.ctx);
    this.menuUI = new MenuUI(canvas);
    this.nameEntryUI = new NameEntryUI(canvas);
    this.optionsUI = new OptionsUI(
      canvas,
      this.musicManager,
      this.soundManager,
      this.difficultyManager
    );
    this.achievementTracker = new AchievementTracker();
    this.achievementDisplay = new AchievementDisplay(canvas);
    this.gameManager = new GameManager(this);

    this.setupMainMenu();
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    // Start menu music
    this.musicManager.playMenuMusic();
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.starfield.updateCanvasSize(this.canvas.width, this.canvas.height);
  }

  start(): void {
    this.gameLoop(0);
  }

  private setupMainMenu(): void {
    const menuItems: MenuItem[] = [
      {
        label: "New Game",
        action: () => this.startNewGame(),
      },
      {
        label: "Leaderboard",
        action: () => this.showLeaderboard(),
      },
      {
        label: "Options",
        action: () => this.showOptions(),
      },
    ];
    this.menuUI.setMenu("ASTEROIDS", menuItems);
  }

  private showLeaderboard(): void {
    this.gameState = GameState.LEADERBOARD;
    // Load scores into the UI
    const scores = this.leaderboard.getEntries();
    this.leaderboardUI.setScores(scores);
  }

  private showOptions(): void {
    this.gameState = GameState.OPTIONS;
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
    // Update time scale (unaffected by time dilation)
    this.timeScale.update(deltaTime);
    
    // Apply time scale to delta time for game systems
    const scaledDeltaTime = this.timeScale.applyScale(deltaTime);
    
    // Update screen shake
    this.screenShake.update(scaledDeltaTime);

    // Update starfield
    this.starfield.update(scaledDeltaTime);

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
      case GameState.LEADERBOARD:
        this.updateLeaderboard();
        break;
      case GameState.OPTIONS:
        this.updateOptions();
        break;
      case GameState.NAME_ENTRY:
        this.updateNameEntry(deltaTime);
        break;
    }
  }

  private updateMenu(): void {
    if (this.inputManager.isKeyPressed("ArrowUp")) {
      this.menuUI.moveUp();
    } else if (this.inputManager.isKeyPressed("ArrowDown")) {
      this.menuUI.moveDown();
    } else if (this.inputManager.isKeyPressed("Enter")) {
      this.menuUI.selectCurrentItem();
    }
  }

  private updateLeaderboard(): void {
    if (
      this.inputManager.isKeyPressed("Escape") ||
      this.inputManager.isKeyPressed("Enter")
    ) {
      // Check if we came from a game over (has a score set)
      if (this.score > 0) {
        this.gameState = GameState.GAME_OVER;
      } else {
        this.gameState = GameState.MENU;
        this.setupMainMenu();
        // Return to menu music
        this.musicManager.playMenuMusic();
      }
    }
  }

  private updateOptions(): void {
    if (this.inputManager.isKeyPressed("ArrowUp")) {
      this.optionsUI.moveUp();
    }
    if (this.inputManager.isKeyPressed("ArrowDown")) {
      this.optionsUI.moveDown();
    }
    if (this.inputManager.isKeyPressed("Enter")) {
      this.optionsUI.selectCurrentItem();
    }
    if (this.inputManager.isKeyPressed("Escape")) {
      this.gameState = GameState.MENU;
      this.setupMainMenu();
      // Return to menu music
      this.musicManager.playMenuMusic();
    }
  }

  private updateNameEntry(deltaTime: number): void {
    // Use scaled delta time for UI updates
    const scaledDeltaTime = this.timeScale.applyScale(deltaTime);
    this.nameEntryUI.update(scaledDeltaTime);

    // Handle character input
    const chars = this.inputManager.getCharacterInput();
    for (const char of chars) {
      if (this.nameEntryUI.handleInput(char)) {
        // Name entry completed or cancelled
        break;
      }
    }
  }

  private updateGame(deltaTime: number): void {
    // Use scaled delta time for game systems
    const scaledDeltaTime = this.timeScale.applyScale(deltaTime);
    this.gameManager.update(scaledDeltaTime);
    this.achievementDisplay.update(scaledDeltaTime);
  }

  private updateGameOver(): void {
    if (
      this.inputManager.isKeyPressed("Space") ||
      this.inputManager.isKeyPressed("Enter")
    ) {
      this.gameState = GameState.MENU;
      this.resetGame();
      this.setupMainMenu();
      // Return to menu music
      this.musicManager.playMenuMusic();
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
      case GameState.LEADERBOARD:
        this.renderLeaderboard();
        break;
      case GameState.OPTIONS:
        this.renderOptions();
        break;
      case GameState.NAME_ENTRY:
        this.renderNameEntry();
        break;
    }

    // Restore context after screen shake
    this.ctx.restore();
  }

  private renderMenu(): void {
    this.starfield.render(this.ctx);
    this.menuUI.render(this.ctx);
  }

  private renderLeaderboard(): void {
    this.starfield.render(this.ctx);
    this.leaderboardUI.render();
  }

  private renderOptions(): void {
    this.starfield.render(this.ctx);
    this.optionsUI.render(this.ctx);
  }

  private renderNameEntry(): void {
    this.starfield.render(this.ctx);
    this.nameEntryUI.render(this.ctx);
  }

  private renderGame(): void {
    this.gameManager.render(this.ctx);
    this.renderUI();
    this.achievementDisplay.render(this.ctx);
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
      this.canvas.height / 2 - 150
    );

    this.ctx.font = "24px Arial";
    this.ctx.fillText(
      `Final Score: ${this.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2 - 100
    );

    // Render leaderboard
    this.leaderboardUI.render();

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Press SPACE to return to menu",
      this.canvas.width / 2,
      this.canvas.height - 50
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
      maxShieldHealth: this.gameManager.maxShieldHealth,
      comboCount: this.achievementTracker.getComboCount(),
      comboMultiplier: this.achievementTracker.getComboMultiplier(),
      comboProgress: this.achievementTracker.getComboProgress(),
    });
  }

  private startNewGame(): void {
    this.gameState = GameState.PLAYING;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameManager.startNewGame();
    // Start game music
    this.musicManager.playGameMusic();
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
    // Check if this is a high score that qualifies for leaderboard
    const rank = this.leaderboard.getScoreRank(this.score);
    if (rank > 0) {
      // High score! Prompt for name entry
      this.gameState = GameState.NAME_ENTRY;
      this.nameEntryUI.show(
        this.score,
        rank,
        (name: string) => {
          // Submit score with name
          this.leaderboard.addScore(
            this.score,
            this.gameManager.currentWave,
            name
          );
          // Show leaderboard after name entry
          this.showLeaderboard();
          // Play game over music
          this.musicManager.playGameOverMusic();
        },
        () => {
          // Skip name entry
          this.leaderboard.addScore(
            this.score,
            this.gameManager.currentWave,
            "Anonymous"
          );
          // Show leaderboard after skipping
          this.showLeaderboard();
          // Play game over music
          this.musicManager.playGameOverMusic();
        }
      );
    } else {
      // Regular game over
      this.gameState = GameState.GAME_OVER;
      this.leaderboard.addScore(
        this.score,
        this.gameManager.currentWave,
        "Player"
      );
      // Play game over music
      this.musicManager.playGameOverMusic();
    }
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

  public get time(): TimeScale {
    return this.timeScale;
  }

  public get achievements(): AchievementTracker {
    return this.achievementTracker;
  }

  public get achievementUI(): AchievementDisplay {
    return this.achievementDisplay;
  }

  public get difficulty(): DifficultyManager {
    return this.difficultyManager;
  }
}
