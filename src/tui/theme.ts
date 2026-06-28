import { fg, type StylableInput, type TextChunk } from "@opentui/core";

export interface GameTheme {
  name: string;
  description: string;
  cyan: string;
  blue: string;
  magenta: string;
  green: string;
  red: string;
  yellow: string;
  defaultFg: string;
}

export const THEMES: Record<string, GameTheme> = {
  default: {
    name: "Default (Dynamic)",
    description: "Automatically switches between Classic (Dark) and Light Mode based on terminal background.",
    cyan: "#00e5ff",
    blue: "#58a6ff",
    magenta: "#ff7bd9",
    green: "#56e39f",
    red: "#ff5555",
    yellow: "#ffcc00",
    defaultFg: "#ffffff",
  },
  classic: {
    name: "Classic Dark",
    description: "Classic styling with an improved, highly readable light blue.",
    cyan: "#00e5ff",
    blue: "#58a6ff",
    magenta: "#ff7bd9",
    green: "#56e39f",
    red: "#ff5555",
    yellow: "#ffcc00",
    defaultFg: "#ffffff",
  },
  light: {
    name: "Light Mode",
    description: "A clean, high-contrast theme optimized for light terminal backgrounds.",
    cyan: "#006677",
    blue: "#0044cc",
    magenta: "#990088",
    green: "#117722",
    red: "#cc1111",
    yellow: "#996600",
    defaultFg: "#121212",
  },
  tokyonight: {
    name: "Tokyo Night",
    description: "A clean, dark theme with vibrant neon pastels.",
    cyan: "#73d0ff",
    blue: "#7aa2f7",
    magenta: "#bb9af7",
    green: "#9ece6a",
    red: "#f7768e",
    yellow: "#e0af68",
    defaultFg: "#a9b1d6",
  },
  dracula: {
    name: "Dracula",
    description: "The classic vampire color scheme.",
    cyan: "#8be9fd",
    blue: "#bd93f9",
    magenta: "#ff79c6",
    green: "#50fa7b",
    red: "#ff5555",
    yellow: "#f1fa8c",
    defaultFg: "#f8f8f2",
  },
  cyberpunk: {
    name: "Cyberpunk Neon",
    description: "High-contrast neon colors from the dark future.",
    cyan: "#00f0ff",
    blue: "#70a1ff",
    magenta: "#ff007f",
    green: "#39ff14",
    red: "#ff3838",
    yellow: "#fff200",
    defaultFg: "#ffffff",
  },
  monokai: {
    name: "Monokai",
    description: "The classic programmer's beloved palette.",
    cyan: "#66d9ef",
    blue: "#ae81ff",
    magenta: "#f92672",
    green: "#a6e22e",
    red: "#f92672",
    yellow: "#e6db74",
    defaultFg: "#f8f8f2",
  }
};

export function getTheme(themeName?: string | null, themeMode?: "light" | "dark" | null): GameTheme {
  const selected = themeName || "default";
  if (selected === "default") {
    return (themeMode === "light" ? THEMES.light : THEMES.classic) || THEMES.classic!;
  }
  return THEMES[selected] || THEMES.classic || THEMES.default!;
}

export function createThemeStyles(themeName?: string | null, themeMode?: "light" | "dark" | null) {
  const theme = getTheme(themeName, themeMode);
  return {
    cyan: (input: StylableInput): TextChunk => fg(theme.cyan)(input),
    blue: (input: StylableInput): TextChunk => fg(theme.blue)(input),
    magenta: (input: StylableInput): TextChunk => fg(theme.magenta)(input),
    green: (input: StylableInput): TextChunk => fg(theme.green)(input),
    red: (input: StylableInput): TextChunk => fg(theme.red)(input),
    yellow: (input: StylableInput): TextChunk => fg(theme.yellow)(input),
    defaultFg: (input: StylableInput): TextChunk => fg(theme.defaultFg)(input),
  };
}
