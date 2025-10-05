export interface MenuItem {
  label: string;
  action: () => void;
  selected?: boolean;
}

export class MenuUI {
  private canvas: HTMLCanvasElement;
  private selectedIndex: number = 0;
  private items: MenuItem[] = [];
  private title: string = "";

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  setMenu(title: string, items: MenuItem[]): void {
    this.title = title;
    this.items = items;
    this.selectedIndex = 0;
  }

  moveUp(): void {
    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
  }

  moveDown(): void {
    this.selectedIndex = Math.min(
      this.items.length - 1,
      this.selectedIndex + 1
    );
  }

  selectCurrentItem(): void {
    if (this.items[this.selectedIndex]) {
      this.items[this.selectedIndex].action();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(this.title, centerX, centerY - 100);

    // Menu items
    ctx.font = "24px Arial";
    this.items.forEach((item, index) => {
      const y = centerY + index * 60 - 20;

      // Highlight selected item
      if (index === this.selectedIndex) {
        ctx.fillStyle = "#ffff00"; // Yellow for selected
        ctx.fillText("→ " + item.label + " ←", centerX, y);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillText(item.label, centerX, y);
      }
    });

    // Instructions
    ctx.fillStyle = "#888888";
    ctx.font = "16px Arial";
    ctx.fillText(
      "Use UP/DOWN arrows to navigate, ENTER to select",
      centerX,
      this.canvas.height - 50
    );
  }
}
