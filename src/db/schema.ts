import { Database } from "bun:sqlite";
import { getDB } from "./client";

export function initializeDatabase(onDatabaseInit?: (db: Database) => void) {
  const db = getDB();

  // Create core tables using a transaction
  db.transaction(() => {
    // Accounts Table
    db.run(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // SSH Keys Table
    db.run(`
      CREATE TABLE IF NOT EXISTS ssh_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id TEXT NOT NULL,
        fingerprint TEXT NOT NULL UNIQUE,
        public_key TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );
    `);

    // Bans Table
    db.run(`
      CREATE TABLE IF NOT EXISTS bans (
        account_id TEXT PRIMARY KEY,
        banned_at TEXT NOT NULL,
        reason TEXT NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );
    `);

    // Admin Audit Logs Table
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_fingerprint TEXT NOT NULL,
        action TEXT NOT NULL,
        target_account_id TEXT,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Chat Logs Table
    db.run(`
      CREATE TABLE IF NOT EXISTS chat_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_account_id TEXT,
        sender_name TEXT,
        message TEXT NOT NULL,
        scope TEXT NOT NULL, -- 'local' or 'global' or 'whisper:username'
        room_id TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // Admin Console Logs Table
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_console_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Server State Table (Key-Value Store)
    db.run(`
      CREATE TABLE IF NOT EXISTS server_state (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Session Tokens Table for Web Terminal session resumption
    db.run(`
      CREATE TABLE IF NOT EXISTS session_tokens (
        token TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );
    `);

    // Analytics Snapshots Table
    db.run(`
      CREATE TABLE IF NOT EXISTS analytics_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        active_players INTEGER NOT NULL,
        active_sessions INTEGER NOT NULL
      );
    `);

    // Run custom game database initialization callback (e.g. for creating custom characters, items, scoreboards)
    if (onDatabaseInit) {
      try {
        onDatabaseInit(db);
      } catch (err) {
        console.error("Error during custom database initialization callback:", err);
      }
    }
  })();
  console.log("Database initialized.");
}
