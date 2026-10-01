export type EventCallback<T = any> = (data: T) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => this.off(event, callback);
  }

  public off<T = any>(event: string, callback: EventCallback<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<T = any>(event: string, data?: T): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`[EventBus] Error in listener for "${event}":`, e);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const Events = {
  STATE_CHANGE: 'STATE_CHANGE',
  GAME_START: 'GAME_START',
  GAME_OVER: 'GAME_OVER',
  GAME_PAUSE: 'GAME_PAUSE',
  GAME_RESUME: 'GAME_RESUME',
  GAME_RESTART: 'GAME_RESTART',
  REVIVE_ACCEPTED: 'REVIVE_ACCEPTED',

  PLAYER_JUMP: 'PLAYER_JUMP',
  PLAYER_DOUBLE_JUMP: 'PLAYER_DOUBLE_JUMP',
  PLAYER_WALL_JUMP: 'PLAYER_WALL_JUMP',
  PLAYER_LAND: 'PLAYER_LAND',
  PLAYER_WALL_BOUNCE: 'PLAYER_WALL_BOUNCE',
  PLAYER_DEATH: 'PLAYER_DEATH',

  FLOOR_CLEARED: 'FLOOR_CLEARED',
  MILESTONE_REACHED: 'MILESTONE_REACHED',
  BIOME_CHANGED: 'BIOME_CHANGED',
  RISK_CHOSEN: 'RISK_CHOSEN',
  SAFE_CHOSEN: 'SAFE_CHOSEN',
  BOSS_COMPLETED: 'BOSS_COMPLETED',

  COIN_COLLECTED: 'COIN_COLLECTED',
  POWERUP_COLLECTED: 'POWERUP_COLLECTED',
  POWERUP_EXPIRED: 'POWERUP_EXPIRED',
  SHIELD_BROKEN: 'SHIELD_BROKEN',
  COMBO_UPDATED: 'COMBO_UPDATED',
  COMBO_RESET: 'COMBO_RESET',

  PLAY_SFX: 'PLAY_SFX',
  SCREEN_SHAKE: 'SCREEN_SHAKE',
  NEW_RECORD: 'NEW_RECORD',

  CHARACTER_PURCHASED: 'CHARACTER_PURCHASED',
  CHARACTER_SELECTED: 'CHARACTER_SELECTED',
  COINS_UPDATED: 'COINS_UPDATED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED'
} as const;
