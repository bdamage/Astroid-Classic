export class NameEntryUI {
  private canvas: HTMLCanvasElement;
  private playerName: string = "";
  private score: number = 0;
  private rank: number = 0;
  private onSubmit: (name: string) => void = () => {};
  private onCancel: () => void = () => {};
  private cursorVisible: boolean = true;
  private cursorTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  show(
    score: number,
    rank: number,
    onSubmit: (name: string) => void,
    onCancel: () => void
  ): void {
    this.score = score;
    this.rank = rank;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.playerName = "";
    this.cursorTimer = 0;
    this.cursorVisible = true;
  }

  handleInput(key: string): boolean {
    if (key === "Enter") {
      if (this.playerName.trim().length > 0) {
        this.onSubmit(this.playerName.trim());
        return true;
      }
    } else if (key === "Escape") {
      this.onCancel();
      return true;
    } else if (key === "Backspace") {
      this.playerName = this.playerName.slice(0, -1);
    } else if (key.length === 1 && this.playerName.length < 15) {
      // Only allow alphanumeric characters and spaces
      if (/[a-zA-Z0-9 ]/.test(key)) {
        this.playerName += key;
      }
    }
    return false;
  }

  update(deltaTime: number): void {
    this.cursorTimer += deltaTime;
    if (this.cursorTimer >= 500) {
      this.cursorVisible = !this.cursorVisible;
      this.cursorTimer = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Title
    ctx.fillStyle = "#ffff00";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("NEW HIGH SCORE!", centerX, centerY - 120);

    // Score and rank info
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Arial";
    ctx.fillText(
      `Score: ${this.score.toLocaleString()}`,
      centerX,
      centerY - 70
    );
    ctx.fillText(`Rank: #${this.rank}`, centerX, centerY - 40);

    // Name prompt
    ctx.font = "20px Arial";
    ctx.fillText("Enter your name:", centerX, centerY + 10);

    // Name input box
    const boxWidth = 300;
    const boxHeight = 40;
    const boxX = centerX - boxWidth / 2;
    const boxY = centerY + 30;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Name text
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.textAlign = "left";
    const nameText = this.playerName + (this.cursorVisible ? "|" : "");
    ctx.fillText(nameText, boxX + 10, boxY + 25);

    // Instructions
    ctx.fillStyle = "#888888";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ENTER to submit, ESC to skip", centerX, centerY + 120);
  }
}
