import { GAME_CONFIG } from '../data/Constants.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { SaveManager } from './SaveManager.ts';

export class ScoreManager {
  private static instance: ScoreManager;

  public currentFloor = 0;
  public highestFloorThisRun = 0;
  public score = 0;

  public combo = 1;
  public comboTimer = 0;
  public maxComboThisRun = 1;

  public previousBestFloor = 0;
  public hasTriggeredRecordFanfare = false;

  private constructor() {
    this.reset();
  }

  public static getInstance(): ScoreManager {
    if (!ScoreManager.instance) {
      ScoreManager.instance = new ScoreManager();
    }
    return ScoreManager.instance;
  }

  public reset(): void {
    this.currentFloor = 0;
    this.highestFloorThisRun = 0;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxComboThisRun = 1;
    this.hasTriggeredRecordFanfare = false;
    this.previousBestFloor = SaveManager.getInstance().getData().bestFloor;
  }

  public update(dt: number): void {
    if (this.combo > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }

  public registerFloorReached(floor: number): void {
    if (floor > this.highestFloorThisRun) {
      const isFirstTime = this.highestFloorThisRun === 0;
      this.highestFloorThisRun = floor;
      this.currentFloor = floor;
      this.score = this.calculateScore();

      if (!isFirstTime) {
        EventBus.getInstance().emit(Events.FLOOR_CLEARED, floor);

        if (this.previousBestFloor > 0 && floor > this.previousBestFloor && !this.hasTriggeredRecordFanfare) {
          this.hasTriggeredRecordFanfare = true;
          EventBus.getInstance().emit(Events.NEW_RECORD, {
            floor,
            previousBest: this.previousBestFloor
          });
        }

        if (floor % GAME_CONFIG.BOSS_FLOOR_INTERVAL === 0) {
          EventBus.getInstance().emit(Events.MILESTONE_REACHED, { floor, isBoss: true });
        } else if (floor % GAME_CONFIG.MILESTONE_INTERVAL === 0) {
          EventBus.getInstance().emit(Events.MILESTONE_REACHED, { floor, isBoss: false });
        }
      }
    }
  }

  public incrementCombo(): number {
    this.combo = Math.min(GAME_CONFIG.COMBO_MAX_MULTIPLIER, this.combo + 1);
    this.comboTimer = GAME_CONFIG.COMBO_TIMEOUT;
    if (this.combo > this.maxComboThisRun) {
      this.maxComboThisRun = this.combo;
    }
    EventBus.getInstance().emit(Events.COMBO_UPDATED, this.combo);
    return this.combo;
  }

  public resetCombo(): void {
    if (this.combo > 1) {
      this.combo = 1;
      this.comboTimer = 0;
      EventBus.getInstance().emit(Events.COMBO_RESET);
    }
  }

  public calculateScore(): number {
    return this.highestFloorThisRun * 100;
  }

  public getComboProgress(): number {
    if (this.combo <= 1 || this.comboTimer <= 0) return 0;
    return this.comboTimer / GAME_CONFIG.COMBO_TIMEOUT;
  }
}

