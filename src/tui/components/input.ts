import { BoxRenderable, InputRenderable, type RenderContext, type BoxOptions } from "@opentui/core";
import { getTheme } from "../theme";

interface InputComponentOptions extends BoxOptions {
  placeholder?: string;
  onEnter?: (text: string) => void;
}

export class ChatInputComponent extends BoxRenderable {
  private inputField: InputRenderable;

  constructor(ctx: RenderContext, options: InputComponentOptions, onCommand: (text: string) => void) {
    super(ctx, {
      ...options,
      border: true,
      title: options.title || " Chat & Commands (Type /help for tips) ",
      titleAlignment: options.titleAlignment || "left"
    });

    this.inputField = new InputRenderable(ctx, {
      width: "100%",
      placeholder: options.placeholder || "Type message or /command here..."
    });
    this.inputField.focusable = true;
    this.add(this.inputField);

    // Bind Enter event
    this.inputField.on("enter", () => {
      const text = this.inputField.value.trim();
      try {
        this.inputField.value = ""; // Clear input field
      } catch (e) {
        // Input field might have been destroyed
      }
      onCommand(text);
    });
  }

  // Force focus onto the text field
  focusInput(prefill?: string) {
    if (prefill !== undefined) {
      this.inputField.setText(prefill);
      this.inputField.cursorOffset = prefill.length;
    }
    this.inputField.focus();
    this.requestRender();
  }

  clearInput() {
    this.inputField.value = "";
  }

  get inputValue(): string {
    return this.inputField.value;
  }

  set inputValue(val: string) {
    this.inputField.value = val;
  }

  get isInputFocused(): boolean {
    return this.inputField.focused;
  }

  blurInput() {
    this.inputField.blur();
  }

  // Dynamically update foreground color based on selected theme/themeMode
  updateColors(themeName: string, themeMode?: "light" | "dark" | null) {
    const theme = getTheme(themeName, themeMode);
    this.inputField.textColor = theme.defaultFg;
    this.inputField.focusedTextColor = theme.defaultFg;
    this.inputField.placeholderColor = themeMode === "light" ? "#888888" : "#666666";
    this.requestRender();
  }
}
