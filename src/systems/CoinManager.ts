import { GAME_CONFIG } from '../data/Constants.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { SaveManager } from './SaveManager.ts';
import { ScoreManager } from './ScoreManager.ts';
import { Player } from '../entities/Player.ts';

export class CoinManager {
  private static instance: CoinManager;
  public coinsThisRun = 0;

  private constructor() {
    this.reset();
  }

  public static getInstance(): CoinManager {
    if (!CoinManager.instance) {
      CoinManager.instance = new CoinManager();
    }
    return CoinManager.instance;
  }

  public reset(): void {
    this.coinsThisRun = 0;
  }

  public collectCoin(baseValue: number = 1, player: Player): number {
    let earned = baseValue;

    if (player.charDef.luckyCoinChance > 0 && Math.random() < player.charDef.luckyCoinChance) {
      earned += 1;
    }

    this.coinsThisRun += earned;
    SaveManager.getInstance().addCoins(earned);

    EventBus.getInstance().emit(Events.COIN_COLLECTED, {
      amount: earned,
      totalThisRun: this.coinsThisRun,
      combo: ScoreManager.getInstance().combo
    });

    return earned;
  }

  public rewardMilestoneCoins(isBoss: boolean = false): number {
    const amount = isBoss ? GAME_CONFIG.BOSS_COIN_BONUS : GAME_CONFIG.MILESTONE_COIN_BONUS;
    this.coinsThisRun += amount;
    SaveManager.getInstance().addCoins(amount);
    return amount;
  }

  public rewardRiskFloorCoins(): number {
    const amount = GAME_CONFIG.RISK_FLOOR_REWARD;
    this.coinsThisRun += amount;
    SaveManager.getInstance().addCoins(amount);
    return amount;
  }
}

