import { GAME_CONFIG } from '../data/Constants.ts';
import { SaveManager } from '../systems/SaveManager.ts';
import { AudioManager } from '../systems/AudioManager.ts';

export class PauseView {
  public resumeButtonRect = {
    x: 90,
    y: 300,
    width: 300,
    height: 52
  };

  public restartButtonRect = {
    x: 90,
    y: 366,
    width: 300,
    height: 52
  };

  public homeButtonRect = {
    x: 90,
    y: 432,
    width: 300,
    height: 48
  };

  public soundToggleRect = {
    x: 90,
    y: 504,
    width: 140,
    height: 44
  };

  public musicToggleRect = {
    x: 250,
    y: 504,
    width: 140,
    height: 44
  };

  public toggleSound(): void {
    const s = SaveManager.getInstance().getData().settings;
    SaveManager.getInstance().updateSettings({ soundEnabled: !s.soundEnabled });
    AudioManager.getInstance().updateVolumes();
  }

  public toggleMusic(): void {
    const s = SaveManager.getInstance().getData().settings;
    SaveManager.getInstance().updateSettings({ musicEnabled: !s.musicEnabled });
    AudioManager.getInstance().updateVolumes();
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const w = GAME_CONFIG.CANVAS_WIDTH;
    const save = SaveManager.getInstance().getData();
    const s = save.settings;

    ctx.fillStyle = 'rgba(10, 10, 20, 0.88)';
    ctx.fillRect(0, 0, w, GAME_CONFIG.CANVAS_HEIGHT);

    // Title
    ctx.font = `bold 24px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#0a0a14';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', w / 2 + 2, 222);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PAUSED', w / 2, 220);

    // Buttons
    this.renderMenuButton(ctx, this.resumeButtonRect, '> RESUME <', '#2ecc71', '#0a0a14');
    this.renderMenuButton(ctx, this.restartButtonRect, 'RESTART', '#4ecdc4', '#0a0a14');
    this.renderMenuButton(ctx, this.homeButtonRect, 'MAIN MENU', '#2d2d44', '#ffffff');

    // Quick Audio Toggles
    this.renderAudioToggle(ctx, this.soundToggleRect, `SFX: ${s.soundEnabled ? 'ON' : 'OFF'}`, s.soundEnabled);
    this.renderAudioToggle(ctx, this.musicToggleRect, `BGM: ${s.musicEnabled ? 'ON' : 'OFF'}`, s.musicEnabled);

    ctx.restore();
  }

  private renderMenuButton(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }, text: string, bg: string, textColor: string): void {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(rect.x + 3, rect.y + 3, rect.width, rect.height);

    ctx.fillStyle = bg;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    ctx.fillStyle = textColor;
    ctx.font = `bold 13px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, rect.x + rect.width / 2, rect.y + rect.height / 2);
  }

  private renderAudioToggle(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }, text: string, active: boolean): void {
    ctx.fillStyle = active ? '#2d2d44' : '#16162a';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = active ? '#2ecc71' : '#7f8c8d';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    ctx.fillStyle = active ? '#2ecc71' : '#7f8c8d';
    ctx.font = `bold 12px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, rect.x + rect.width / 2, rect.y + rect.height / 2);
  }
}
