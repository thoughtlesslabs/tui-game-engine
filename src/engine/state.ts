import { getDB } from "../db/client";

export interface PlayerSession {
  sessionId: string;
  accountId: string;
  username: string;
  renderer: any;
  cols: number;
  rows: number;
  onStateUpdate?: () => void;
  end: () => void;
  customData?: any; // To store game-specific state (like player location, class, etc.)
}

export interface ChatMessage {
  sender: string;
  recipient?: string;
  text: string;
  scope: "local" | "global" | "whisper";
  roomId?: string;
  time: string;
}

// In-Memory Shared Engine State
export const activeSessions = new Map<string, PlayerSession>(); // sessionId -> PlayerSession
export const activeAccounts = new Map<string, any>(); // accountId -> Custom Player Object/State
export const recentChats: ChatMessage[] = [];

// Admin Session Event Feeds
export const activeAdminSessions = new Set<(msg: string) => void>();
export const globalAdminHistory: string[] = ["\x1b[35m--- Admin Console Event Feed Initialized ---\x1b[0m"];

export function logAdminWorldEvent(msg: string) {
  const lines = msg.split("\n");
  
  try {
    const db = getDB();
    const createdAt = new Date().toISOString();
    db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO admin_console_logs (message, created_at)
        VALUES ($message, $createdAt)
      `);
      for (const l of lines) {
        stmt.run({
          $message: l,
          $createdAt: createdAt
        });
      }
    })();
    for (const l of lines) {
      globalAdminHistory.push(l);
    }
  } catch (err) {
    console.error("Failed to save admin console log to DB:", err);
    for (const l of lines) {
      globalAdminHistory.push(l);
    }
  }

  while (globalAdminHistory.length > 50) {
    globalAdminHistory.shift();
  }

  for (const logFn of activeAdminSessions) {
    try {
      logFn(msg);
    } catch (e) {
      // ignore
    }
  }
}

export function loadRecentAdminConsoleLogs() {
  try {
    const db = getDB();
    const rows = db.query(`
      SELECT message FROM admin_console_logs
      ORDER BY id DESC
      LIMIT 50
    `).all() as { message: string }[];
    rows.reverse();

    globalAdminHistory.length = 0;
    if (rows.length === 0) {
      globalAdminHistory.push("\x1b[35m--- Admin Console Event Feed Initialized ---\x1b[0m");
    } else {
      for (const row of rows) {
        globalAdminHistory.push(row.message);
      }
    }
    console.log(`Loaded ${globalAdminHistory.length} admin console logs from database.`);
  } catch (err) {
    console.error("Failed to load admin console logs from DB:", err);
  }
}
