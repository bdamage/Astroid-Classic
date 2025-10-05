import type {MusicManager} from "../audio/MusicManager";
import type {SoundManager} from "../audio/SoundManager";
import type {DifficultyManager} from "../systems/DifficultyManager";

export interface OptionsMenuItem {
  label: string;
  type: "toggle" | "slider" | "action" | "cycle";
  getValue?: () => string;
  action?: () => void;
}

export class OptionsUI {
  private canvas: HTMLCanvasElement;
  private menuItems: OptionsMenuItem[] = [];
  private selectedIndex: number = 0;
  private musicManager: MusicManager;
  private soundManager: SoundManager;
  private difficultyManager: DifficultyManager;

  constructor(
    canvas: HTMLCanvasElement,
    musicManager: MusicManager,
    soundManager: SoundManager,
    difficultyManager: DifficultyManager
  ) {
    this.canvas = canvas;
    this.musicManager = musicManager;
    this.soundManager = soundManager;
    this.difficultyManager = difficultyManager;
    this.setupMenuItems();
  }

  private setupMenuItems(): void {
    this.menuItems = [
      {
        label: "Difficulty",
        type: "cycle",
        getValue: () => this.difficultyManager.getCurrentDifficulty(),
        action: () => {
          this.difficultyManager.cycleDifficulty();
        },
      },
      {
        label: "Music",
        type: "toggle",
        getValue: () => (this.musicManager.isEnabledState() ? "ON" : "OFF"),
        action: () => {
          const currentState = this.musicManager.isEnabledState();
          this.musicManager.setEnabled(!currentState);
          if (!currentState) {
            // If turning music on, start menu music
            this.musicManager.playMenuMusic();
          }
        },
      },
      {
        label: "Sound Effects",
        type: "toggle",
        getValue: () => (this.soundManager.getEnabled() ? "ON" : "OFF"),
        action: () => {
          const currentState = this.soundManager.getEnabled();
          this.soundManager.setEnabled(!currentState);
        },
      },
      {
        label: "Music Volume",
        type: "slider",
        getValue: () =>
          `${Math.round(this.musicManager.getMasterVolume() * 100)}%`,
        action: () => {
          const currentVolume = this.musicManager.getMasterVolume();
          const newVolume = currentVolume >= 1 ? 0 : currentVolume + 0.1;
          this.musicManager.setMasterVolume(newVolume);
        },
      },
      {
        label: "Master Volume",
        type: "slider",
        getValue: () =>
          `${Math.round(this.soundManager.getMasterVolume() * 100)}%`,
        action: () => {
          const currentVolume = this.soundManager.getMasterVolume();
          const newVolume = currentVolume >= 1 ? 0 : currentVolume + 0.1;
          this.soundManager.setMasterVolume(newVolume);
        },
      },
    ];
  }

  public moveUp(): void {
    this.selectedIndex =
      this.selectedIndex > 0
        ? this.selectedIndex - 1
        : this.menuItems.length - 1;
  }

  public moveDown(): void {
    this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
  }

  public selectCurrentItem(): void {
    const item = this.menuItems[this.selectedIndex];
    if (item.action) {
      item.action();
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const startY = this.canvas.height / 2 - 150;

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("OPTIONS", centerX, startY);

    // Menu items
    ctx.font = "24px Arial";
    for (let i = 0; i < this.menuItems.length; i++) {
      const y = startY + 100 + i * 60;
      const item = this.menuItems[i];

      // Highlight selected item
      if (i === this.selectedIndex) {
        ctx.fillStyle = "#ffff00";
        ctx.fillText("►", centerX - 200, y);
      }

      // Item label
      ctx.fillStyle = i === this.selectedIndex ? "#ffff00" : "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(item.label, centerX - 180, y);

      // Item value
      if (item.getValue) {
        ctx.textAlign = "right";
        ctx.fillStyle = i === this.selectedIndex ? "#ffff00" : "#cccccc";
        ctx.fillText(item.getValue(), centerX + 180, y);
      }

      // Slider visual for volume controls
      if (item.type === "slider") {
        const sliderWidth = 200;
        const sliderHeight = 8;
        const sliderX = centerX - 50;
        const sliderY = y + 15;

        // Background
        ctx.fillStyle = "#333333";
        ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);

        // Fill
        let fillPercentage = 0;
        if (item.label.includes("Music")) {
          fillPercentage = this.musicManager.getMasterVolume();
        } else if (item.label.includes("Master")) {
          fillPercentage = this.soundManager.getMasterVolume();
        }

        ctx.fillStyle = i === this.selectedIndex ? "#ffff00" : "#ffffff";
        ctx.fillRect(
          sliderX,
          sliderY,
          sliderWidth * fillPercentage,
          sliderHeight
        );
      }
    }

    // Show difficulty description for selected difficulty item
    if (this.selectedIndex === 0) {
      // Assuming difficulty is first item
      ctx.fillStyle = "#888888";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      const description = this.difficultyManager.getDifficultyDescription();
      ctx.fillText(
        description,
        centerX,
        startY + 100 + this.menuItems.length * 60 + 20
      );
    }

    // Instructions
    ctx.fillStyle = "#666666";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Use UP/DOWN arrows to navigate",
      centerX,
      this.canvas.height - 100
    );
    ctx.fillText(
      "Press ENTER to change setting",
      centerX,
      this.canvas.height - 75
    );
    ctx.fillText(
      "Press ESC to return to menu",
      centerX,
      this.canvas.height - 50
    );
  }
}
