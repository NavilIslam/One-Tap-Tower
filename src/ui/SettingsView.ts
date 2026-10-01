import { GAME_CONFIG } from '../data/Constants.ts';
import { SaveManager, GameSettings } from '../systems/SaveManager.ts';
import { AudioManager } from '../systems/AudioManager.ts';

export class SettingsView {
  public backButtonRect = {
    x: 24,
    y: 20,
    width: 80,
    height: 36
  };

  public soundToggleRect = { x: 320, y: 150, width: 100, height: 36 };
  public musicToggleRect = { x: 320, y: 210, width: 100, height: 36 };
  public vibrationToggleRect = { x: 320, y: 270, width: 100, height: 36 };
  public qualityToggleRect = { x: 320, y: 330, width: 100, height: 36 };
  public fpsToggleRect = { x: 320, y: 390, width: 100, height: 36 };

  public resetDataButtonRect = {
    x: 60,
    y: 500,
    width: 360,
    height: 48
  };

  public isConfirmingReset = false;

  public toggleSound(): void { this.toggleSetting('soundEnabled'); }
  public toggleMusic(): void { this.toggleSetting('musicEnabled'); }
  public toggleVibration(): void { this.toggleSetting('vibrationEnabled'); }
  public toggleQuality(): void { this.toggleSetting('quality'); }
  public toggleFps(): void { this.toggleSetting('showFps'); }
  public handleReset(): boolean { return this.handleResetClick(); }

  public toggleSetting(key: keyof GameSettings): void {
    const save = SaveManager.getInstance().getData();
    const current = save.settings[key];

    if (typeof current === 'boolean') {
      SaveManager.getInstance().updateSettings({ [key]: !current });
    } else if (key === 'quality') {
      const nextQuality = current === 'high' ? 'low' : 'high';
      SaveManager.getInstance().updateSettings({ quality: nextQuality });
    }

    AudioManager.getInstance().updateVolumes();
  }

  public handleResetClick(): boolean {
    if (!this.isConfirmingReset) {
      this.isConfirmingReset = true;
      return false;
    } else {
      SaveManager.getInstance().resetAllData();
      this.isConfirmingReset = false;
      return true;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const w = GAME_CONFIG.CANVAS_WIDTH;
    const save = SaveManager.getInstance().getData();
    const s = save.settings;

    ctx.fillStyle = 'rgba(10, 10, 20, 0.95)';
    ctx.fillRect(0, 0, w, GAME_CONFIG.CANVAS_HEIGHT);

    // [BACK] Button
    const backBtn = this.backButtonRect;
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 10px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('< BACK', backBtn.x + backBtn.width / 2, backBtn.y + backBtn.height / 2);

    // Title
    ctx.font = `bold 16px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillText('SETTINGS', w / 2, 75);

    // Setting Rows
    this.renderSettingRow(ctx, 'SOUND FX', s.soundEnabled ? 'ON' : 'OFF', s.soundEnabled, this.soundToggleRect);
    this.renderSettingRow(ctx, 'MUSIC', s.musicEnabled ? 'ON' : 'OFF', s.musicEnabled, this.musicToggleRect);
    this.renderSettingRow(ctx, 'VIBRATION', s.vibrationEnabled ? 'ON' : 'OFF', s.vibrationEnabled, this.vibrationToggleRect);
    this.renderSettingRow(ctx, 'GRAPHICS', s.quality.toUpperCase(), s.quality === 'high', this.qualityToggleRect);
    this.renderSettingRow(ctx, 'SHOW FPS', s.showFps ? 'ON' : 'OFF', s.showFps, this.fpsToggleRect);

    // Reset Data Button
    const rBtn = this.resetDataButtonRect;
    ctx.fillStyle = this.isConfirmingReset ? '#e74c3c' : '#2c1810';
    ctx.fillRect(rBtn.x, rBtn.y, rBtn.width, rBtn.height);
    ctx.strokeStyle = this.isConfirmingReset ? '#ffffff' : '#c0392b';
    ctx.lineWidth = 1;
    ctx.strokeRect(rBtn.x, rBtn.y, rBtn.width, rBtn.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 11px ${GAME_CONFIG.PIXEL_FONT}`;
    const rText = this.isConfirmingReset ? 'CONFIRM: CLICK TO WIPE' : 'RESET ALL PROGRESS';
    ctx.fillText(rText, rBtn.x + rBtn.width / 2, rBtn.y + rBtn.height / 2);

    ctx.restore();
  }

  private renderSettingRow(ctx: CanvasRenderingContext2D, label: string, valueStr: string, isActive: boolean, rect: { x: number; y: number; width: number; height: number }): void {
    ctx.save();

    // Label
    ctx.font = `bold 15px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 60, rect.y + rect.height / 2);

    // Toggle Button
    ctx.fillStyle = isActive ? '#2ecc71' : '#2d2d44';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    ctx.fillStyle = isActive ? '#0a0a14' : '#bdc3c7';
    ctx.font = `bold 12px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(valueStr, rect.x + rect.width / 2, rect.y + rect.height / 2);

    ctx.restore();
  }
}
