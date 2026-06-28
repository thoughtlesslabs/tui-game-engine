import { BoxRenderable, TextRenderable, type RenderContext } from "@opentui/core";

export class LayoutSizer {
  private minCols: number;
  private minRows: number;
  private sizeErrorBox: BoxRenderable | null = null;
  private sizeErrorText: TextRenderable | null = null;

  constructor(minCols = 100, minRows = 30) {
    this.minCols = minCols;
    this.minRows = minRows;
  }

  /**
   * Returns true if terminal size is valid. Otherwise, displays size error box on root.
   */
  public checkSize(ctx: RenderContext, root: BoxRenderable, cols: number, rows: number): boolean {
    const isSmall = cols < this.minCols || rows < this.minRows;

    if (isSmall) {
      if (!this.sizeErrorBox) {
        // Clear all elements to prevent ghost rendering
        root.getChildren().forEach(child => root.remove(child.id));

        this.sizeErrorBox = new BoxRenderable(ctx, {
          width: "100%",
          height: "100%",
          border: true,
          borderColor: "#FF0000",
          title: " Error: Terminal Window Too Small ",
          titleAlignment: "center"
        });

        this.sizeErrorText = new TextRenderable(ctx, {
          width: "100%",
          height: "100%",
          paddingLeft: 2,
          paddingTop: 2
        });
        this.sizeErrorText.fg = "#FFFFFF";

        this.sizeErrorBox.add(this.sizeErrorText);
        root.add(this.sizeErrorBox);
      }

      if (this.sizeErrorText) {
        this.sizeErrorText.content = `
Your terminal window is too small to display the interface.
Please resize your terminal window.

Minimum Size Required: ${this.minCols} columns x ${this.minRows} rows
Current Window Size  : ${cols} columns x ${rows} rows

Resize your terminal now to continue.
        `;
      }
      return false;
    } else {
      if (this.sizeErrorBox) {
        root.remove(this.sizeErrorBox.id);
        this.sizeErrorBox = null;
        this.sizeErrorText = null;
      }
      return true;
    }
  }
}
