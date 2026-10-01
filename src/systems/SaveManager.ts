import { GAME_CONFIG } from '../data/Constants.ts';

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  quality: 'auto' | 'high' | 'low';
  showFps: boolean;
}

export interface SaveData {
  version: number;
  coins: number;
  totalCoinsEarned: number;
  unlockedCharacters: string[];
  selectedCharacter: string;
  bestFloor: number;
  bestScore: number;
  bestCombo: number;
  totalRuns: number;
  totalDeaths: number;
  hasSeenTutorial: boolean;
  lastDailyDate: string;
  dailyBestFloor: number;
  dailyClaimed: boolean;
  settings: GameSettings;
}

const DEFAULT_SAVE: SaveData = {
  version: 1,
  coins: 0,
  totalCoinsEarned: 0,
  unlockedCharacters: ['classic'],
  selectedCharacter: 'classic',
  bestFloor: 0,
  bestScore: 0,
  bestCombo: 0,
  totalRuns: 0,
  totalDeaths: 0,
  hasSeenTutorial: false,
  lastDailyDate: '',
  dailyBestFloor: 0,
  dailyClaimed: false,
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    quality: 'high',
    showFps: false
  }
};

export class SaveManager {
  private static instance: SaveManager;
  private data: SaveData = { ...DEFAULT_SAVE };

  private constructor() {
    this.load();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public load(): SaveData {
    try {
      const raw = localStorage.getItem(GAME_CONFIG.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = this.sanitizeData(parsed);
      } else {
        this.data = { ...DEFAULT_SAVE };
        this.save();
      }
    } catch (e) {
      console.warn('[SaveManager] Failed to read save data, using default:', e);
      this.data = { ...DEFAULT_SAVE };
    }
    return this.data;
  }

  public save(): boolean {
    try {
      localStorage.setItem(GAME_CONFIG.STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.error('[SaveManager] Failed to persist data:', e);
      return false;
    }
  }

  public getData(): SaveData {
    return this.data;
  }

  private sanitizeData(raw: any): SaveData {
    const clean: SaveData = { ...DEFAULT_SAVE };

    if (typeof raw === 'object' && raw !== null) {
      clean.coins = Math.max(0, Math.min(999999, Number(raw.coins) || 0));
      clean.totalCoinsEarned = Math.max(0, Number(raw.totalCoinsEarned) || clean.coins);
      clean.bestFloor = Math.max(0, Math.min(10000, Number(raw.bestFloor) || 0));
      clean.bestScore = Math.max(0, Number(raw.bestScore) || 0);
      clean.bestCombo = Math.max(0, Math.min(500, Number(raw.bestCombo) || 0));
      clean.totalRuns = Math.max(0, Number(raw.totalRuns) || 0);
      clean.totalDeaths = Math.max(0, Number(raw.totalDeaths) || 0);
      clean.hasSeenTutorial = Boolean(raw.hasSeenTutorial);
      clean.lastDailyDate = typeof raw.lastDailyDate === 'string' ? raw.lastDailyDate : '';
      clean.dailyBestFloor = Math.max(0, Number(raw.dailyBestFloor) || 0);
      clean.dailyClaimed = Boolean(raw.dailyClaimed);

      if (Array.isArray(raw.unlockedCharacters) && raw.unlockedCharacters.length > 0) {
        clean.unlockedCharacters = Array.from(new Set(['classic', ...raw.unlockedCharacters]));
      }

      if (typeof raw.selectedCharacter === 'string' && clean.unlockedCharacters.includes(raw.selectedCharacter)) {
        clean.selectedCharacter = raw.selectedCharacter;
      }

      if (typeof raw.settings === 'object' && raw.settings !== null) {
        clean.settings.soundEnabled = raw.settings.soundEnabled !== false;
        clean.settings.musicEnabled = raw.settings.musicEnabled !== false;
        clean.settings.vibrationEnabled = raw.settings.vibrationEnabled !== false;
        clean.settings.quality = raw.settings.quality === 'low' ? 'low' : 'high';
        clean.settings.showFps = Boolean(raw.settings.showFps);
      }
    }

    return clean;
  }

  public addCoins(amount: number): number {
    if (amount <= 0) return this.data.coins;
    this.data.coins = Math.min(999999, this.data.coins + amount);
    this.data.totalCoinsEarned += amount;
    this.save();
    return this.data.coins;
  }

  public spendCoins(amount: number): boolean {
    if (amount <= 0 || this.data.coins < amount) return false;
    this.data.coins -= amount;
    this.save();
    return true;
  }

  public unlockCharacter(characterId: string): boolean {
    if (!this.data.unlockedCharacters.includes(characterId)) {
      this.data.unlockedCharacters.push(characterId);
      this.save();
      return true;
    }
    return false;
  }

  public selectCharacter(characterId: string): boolean {
    if (this.data.unlockedCharacters.includes(characterId)) {
      this.data.selectedCharacter = characterId;
      this.save();
      return true;
    }
    return false;
  }

  public recordRun(floor: number, score: number, combo: number): { isNewFloorRecord: boolean; isNewScoreRecord: boolean } {
    this.data.totalRuns++;
    this.data.totalDeaths++;

    let isNewFloorRecord = false;
    let isNewScoreRecord = false;

    if (floor > this.data.bestFloor) {
      this.data.bestFloor = floor;
      isNewFloorRecord = true;
    }

    if (score > this.data.bestScore) {
      this.data.bestScore = score;
      isNewScoreRecord = true;
    }

    if (combo > this.data.bestCombo) {
      this.data.bestCombo = combo;
    }

    this.save();
    return { isNewFloorRecord, isNewScoreRecord };
  }

  public markTutorialComplete(): void {
    this.data.hasSeenTutorial = true;
    this.save();
  }

  public updateSettings(settings: Partial<GameSettings>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  public resetAllData(): void {
    this.data = { ...DEFAULT_SAVE };
    this.save();
  }
}
