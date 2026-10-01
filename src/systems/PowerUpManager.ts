import { GAME_CONFIG } from '../data/Constants.ts';
import { PowerUpType } from '../entities/PowerUp.ts';
import { Player } from '../entities/Player.ts';
import { EventBus, Events } from '../core/EventBus.ts';

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
  maxTime: number;
}

export class PowerUpManager {
  private static instance: PowerUpManager;
  private activeTimers = new Map<PowerUpType, ActivePowerUp>();

  private constructor() {
    this.reset();
  }

  public static getInstance(): PowerUpManager {
    if (!PowerUpManager.instance) {
      PowerUpManager.instance = new PowerUpManager();
    }
    return PowerUpManager.instance;
  }

  public reset(): void {
    this.activeTimers.clear();
  }

  public activate(type: PowerUpType, player: Player): void {
    let duration = 5.0;

    switch (type) {
      case 'shield':
        player.hasShield = true;
        EventBus.getInstance().emit(Events.POWERUP_COLLECTED, { type, duration: 0 });
        return;

      case 'double_jump':
        player.hasDoubleJump = true;
        EventBus.getInstance().emit(Events.POWERUP_COLLECTED, { type, duration: 0 });
        return;

      case 'magnet':
        duration = GAME_CONFIG.POWERUP_DURATIONS.MAGNET;
        break;

      case 'slow_mo':
        duration = GAME_CONFIG.POWERUP_DURATIONS.SLOW_MO;
        break;

      case 'speed_boost':
        duration = GAME_CONFIG.POWERUP_DURATIONS.SPEED_BOOST;
        break;
    }

    if (player.charDef.id === 'cyber') {
      duration *= 1.2;
    }

    this.activeTimers.set(type, {
      type,
      remainingTime: duration,
      maxTime: duration
    });

    EventBus.getInstance().emit(Events.POWERUP_COLLECTED, { type, duration });
  }

  public update(dt: number, _player: Player): void {
    this.activeTimers.forEach((buff, type) => {
      buff.remainingTime -= dt;
      if (buff.remainingTime <= 0) {
        this.activeTimers.delete(type);
        EventBus.getInstance().emit(Events.POWERUP_EXPIRED, type);
      }
    });
  }

  public isMagnetActive(): boolean {
    return this.activeTimers.has('magnet');
  }

  public isSlowMoActive(): boolean {
    return this.activeTimers.has('slow_mo');
  }

  public isSpeedBoostActive(): boolean {
    return this.activeTimers.has('speed_boost');
  }

  public getActiveBuffs(): ActivePowerUp[] {
    return Array.from(this.activeTimers.values());
  }
}

