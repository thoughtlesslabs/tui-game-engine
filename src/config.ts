import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export interface AppConfig {
  gamePort: number;
  adminPort: number;
  webPort: number;
  databasePath: string;
  adminFingerprints: string[];
  gameTitle: string;
  gameDescription: string;
}

const CONFIG_PATH = process.env.CONFIG_PATH || join(process.cwd(), "config.json");

export function loadConfig(): AppConfig {
  const defaultConfig: AppConfig = {
    gamePort: 2222,
    adminPort: 2223,
    webPort: 3000,
    databasePath: "game.db",
    adminFingerprints: [],
    gameTitle: "TuiEngine",
    gameDescription: "Multiplayer SSH Terminal Game Framework",
  };

  if (!existsSync(CONFIG_PATH)) {
    try {
      writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    } catch (e) {
      console.error("Failed to write default config.json:", e);
    }
    return defaultConfig;
  }
  
  try {
    const data = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return { ...defaultConfig, ...parsed } as AppConfig;
  } catch (err) {
    console.error("Failed to read config.json, using defaults:", err);
    return defaultConfig;
  }
}

export function saveConfig(config: AppConfig) {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error("Failed to save config.json:", err);
  }
}
