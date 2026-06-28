# TuiEngine Agent Guidelines

You are an AI coding agent pair programming with the user to build multiplayer terminal games on top of TuiEngine. Adhere to these instructions strictly to maintain codebase integrity and build a premium, user-friendly terminal game.

---

## 1. Codebase Isolation Policy (CRITICAL)

* **Engine Core (`src/`)**: Never modify any files inside the `src/` directory. This is the engine's core infrastructure. Modifying it breaks upgrades and compatibility.
* **Game Workspace (`game/`)**: All game logic, custom screens, widgets, databases, and assets MUST reside strictly in the `game/` directory. Treat `src/` as a read-only library.

---

## 2. User Experience (UX) Guidelines

Terminal games must be intuitive and highly responsive. Build these interaction defaults into your game designs:

### 💬 Chat & Input Focus
* **The `/` Shortcut**: Always register a global key listener so that pressing `/` automatically focuses the chat/command input field.
* **The `ESC` Blur**: Pressing `escape` must blur the input field, hide the cursor, and return focus to game controls (steering/movement).

### 🕹️ Real-Time Steering
* **Direct Controls**: When the chat input is blurred, bind **W/A/S/D** and **Arrow Keys** to steer the game elements (e.g. movement, car navigation, cursor grids) in real time.
* **Prevent Defaults**: Call `key.preventDefault()` on registered keys to prevent them from echoing to the terminal screen.

### 📐 Window Layout Sizing
* **Size Validation**: Check the terminal dimensions on session start and on resize using `LayoutSizer`. Show a clean, centered box warning the user if their window is too small, clearing other widgets to prevent ghost artifacts.

---

## 3. Database & Concurrency Performance

SQLite can be a significant bottleneck in real-time environments if not handled correctly.

### 💾 Async Autosaves (Memory vs. Disk)
* **The Rule**: **NEVER run synchronous SQL write queries inside the tick loop or on rapid key events (like player movement).**
* **The Pattern**:
  1. Hold all active coordinates, positions, and stats in-memory in the `activeAccounts` map.
  2. Perform real-time physics, boundary checks, and updates purely in memory.
  3. Register an autosave callback (`engine.loopManager.registerAutosaveHandler`) to periodically flush the active memory state to the database (e.g., every 100 ticks).

### ⚡ Query Optimization
* **Prepared Statements**: Prepare and compile SQL statements at startup instead of dynamically building raw SQL strings on every transaction.
* **Concurrency**: Rely on Bun's SQLite WAL mode and busy timeouts configured by the client. Keep transactions database-only and modify in-memory game states outside the transaction block to prevent state desyncs on lock failures.
