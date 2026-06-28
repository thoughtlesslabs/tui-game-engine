export interface PlayerAction {
  playerId: string;
  type: string;
  payload: any;
}

export type ActionHandler = (action: PlayerAction) => void | Promise<void>;
export type TickHandler = (tickCount: number) => void | Promise<void>;

export class GameLoopManager {
  private loopInterval: Timer | null = null;
  private tickCount = 0;
  private tickRateMs = 300;
  private actionQueue: PlayerAction[] = [];
  private actionHandlers = new Map<string, ActionHandler>();
  private tickHandlers: TickHandler[] = [];
  private onAutosave: (() => void) | null = null;

  constructor(tickRateMs = 300) {
    this.tickRateMs = tickRateMs;
  }

  /**
   * Queues an action to be processed on the next server tick.
   */
  public queueAction(playerId: string, type: string, payload: any = {}) {
    this.actionQueue.push({ playerId, type, payload });
  }

  /**
   * Registers a callback for a specific player action type.
   */
  public registerActionHandler(type: string, handler: ActionHandler) {
    this.actionHandlers.set(type, handler);
  }

  /**
   * Registers a callback that runs on every tick.
   */
  public registerTickHandler(handler: TickHandler) {
    this.tickHandlers.push(handler);
  }

  /**
   * Registers a callback that runs periodically (every 100 ticks).
   */
  public registerAutosaveHandler(handler: () => void) {
    this.onAutosave = handler;
  }

  /**
   * Starts the authoritative server loop.
   */
  public start() {
    if (this.loopInterval) return;

    this.loopInterval = setInterval(async () => {
      try {
        this.tickCount++;

        // 1. Process all player actions in the queue
        await this.processActions();

        // 2. Run registered tick handlers
        for (const handler of this.tickHandlers) {
          try {
            await handler(this.tickCount);
          } catch (e) {
            console.error("Error in tick handler:", e);
          }
        }

        // 3. Run periodic autosave (every 100 ticks)
        if (this.tickCount % 100 === 0 && this.onAutosave) {
          try {
            this.onAutosave();
          } catch (e) {
            console.error("Error in autosave handler:", e);
          }
        }
      } catch (err) {
        console.error("Critical error in game loop tick:", err);
      }
    }, this.tickRateMs);

    console.log(`Authoritative game loop started with ${this.tickRateMs}ms ticks.`);
  }

  /**
   * Stops the authoritative server loop.
   */
  public stop() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
      console.log("Authoritative game loop stopped.");
    }
  }

  private async processActions() {
    while (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift();
      if (!action) continue;

      const handler = this.actionHandlers.get(action.type);
      if (handler) {
        try {
          await handler(action);
        } catch (e) {
          console.error(`Error processing action type '${action.type}':`, e);
        }
      } else {
        console.warn(`No action handler registered for action type: ${action.type}`);
      }
    }
  }
}
