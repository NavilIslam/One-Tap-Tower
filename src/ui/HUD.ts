import { GAME_CONFIG } from '../data/Constants.ts';
import { ScoreManager } from '../systems/ScoreManager.ts';
import { CoinManager } from '../systems/CoinManager.ts';
import { PowerUpManager } from '../systems/PowerUpManager.ts';
import { EventBus, Events } from '../core/EventBus.ts';

const MILESTONE_DURATION = 2.4;
const RECORD_DURATION = 2.8;
const BANNER_POP_IN = 0.18;
const BANNER_FADE_OUT = 0.3;

export class HUD {
  public pauseButtonRect = {
    x: GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS - 38,
    y: 18,
    width: 32,
    height: 32
  };

  private milestoneBannerText = '';
  private milestoneBannerTimer = 0;
  private recordBannerTimer = 0;
  private comboPulseTimer = 0;

  constructor() {
    EventBus.getInstance().on(Events.COMBO_UPDATED, () => {
      this.comboPulseTimer = 0.18;
    });
  }

  public showMilestoneBanner(text: string): void {
    this.milestoneBannerText = text;
    this.milestoneBannerTimer = MILESTONE_DURATION;
  }

  public showRecordBanner(): void {
    this.recordBannerTimer = RECORD_DURATION;
  }

  public update(dt: number): void {
    if (this.milestoneBannerTimer > 0) {
      this.milestoneBannerTimer -= dt;
    }
    if (this.recordBannerTimer > 0) {
      this.recordBannerTimer -= dt;
    }
    if (this.comboPulseTimer > 0) {
      this.comboPulseTimer = Math.max(0, this.comboPulseTimer - dt);
    }
  }

  /**
   * Returns a 0-1 progress value for a banner given its remaining time and
   * total duration, easing in with a quick pop then fading out at the end,
   * so banners don't just hard-cut in and out.
   */
  private bannerProgress(remaining: number, duration: number): { scale: number; alpha: number } {
    const elapsed = duration - remaining;
    if (elapsed < BANNER_POP_IN) {
      const t = elapsed / BANNER_POP_IN;
      // Slight overshoot for a punchy pop-in.
      const eased = 1 - Math.pow(1 - t, 3);
      return { scale: 0.8 + eased * 0.24, alpha: t };
    }
    if (remaining < BANNER_FADE_OUT) {
      return { scale: 1.0, alpha: Math.max(0, remaining / BANNER_FADE_OUT) };
    }
    return { scale: 1.0, alpha: 1.0 };
  }

  public render(ctx: CanvasRenderingContext2D, currentFloor: number = 0): void {
    ctx.save();

    const w = GAME_CONFIG.CANVAS_WIDTH;
    const scoreMgr = ScoreManager.getInstance();
    const coinMgr = CoinManager.getInstance();
    const powerMgr = PowerUpManager.getInstance();

    const floorNum = currentFloor > 0 ? currentFloor : scoreMgr.currentFloor;

    // Top Bar Solid Dark Ribbon
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, w, 56);
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(0, 54, w, 2);

    // Coins Counter [C]
    ctx.font = `11px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`[C] ${coinMgr.coinsThisRun}`, GAME_CONFIG.WALL_THICKNESS + 6, 28);

    // Center: Floor Badge (e.g. FL-042)
    ctx.font = `13px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#4ecdc4';
    ctx.textAlign = 'center';
    const flStr = String(floorNum).padStart(3, '0');
    ctx.fillText(`FL-${flStr}`, w / 2, 22);

    // Combo Multiplier & Progress Bar
    const combo = scoreMgr.combo;
    if (combo > 1) {
      // Quick punch-scale every time the combo ticks up, decaying back to 1.
      const pulseT = this.comboPulseTimer / 0.18;
      const pulseScale = 1 + pulseT * pulseT * 0.35;

      ctx.save();
      ctx.translate(w / 2, 38);
      ctx.scale(pulseScale, pulseScale);
      ctx.font = `8px ${GAME_CONFIG.PIXEL_FONT}`;
      ctx.fillStyle = '#e74c3c';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${combo}`, 0, 0);
      ctx.restore();

      const comboProgress = scoreMgr.getComboProgress();
      const barW = 60;
      const barH = 4;
      const bx = (w - barW) / 2;
      const by = 44;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(bx, by, Math.floor(barW * comboProgress), barH);
    }

    // Top-Right: Pause Button [II]
    const pb = this.pauseButtonRect;
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(pb.x, pb.y, pb.width, pb.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pb.x + 2, pb.y + 2, pb.width - 4, 1);

    ctx.font = `10px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('II', pb.x + pb.width / 2, pb.y + pb.height / 2);

    // Active Power-Ups Row
    const activeBuffs = powerMgr.getActiveBuffs();
    if (activeBuffs.length > 0) {
      const startX = GAME_CONFIG.WALL_THICKNESS + 8;
      const buffY = 64;

      activeBuffs.forEach((buff, i) => {
        const iconX = startX + i * 36;
        const color = this.getBuffColor(buff.type);
        const glyph = this.getBuffGlyph(buff.type);

        // 2px border box
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(iconX - 1, buffY - 1, 26, 26);
        ctx.fillStyle = '#2d2d44';
        ctx.fillRect(iconX, buffY, 24, 24);

        // Powerup glyph
        ctx.font = `8px ${GAME_CONFIG.PIXEL_FONT}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(glyph, iconX + 12, buffY + 12);
      });
    }

    // Milestone Banner Announcement — pops in with a slight overshoot,
    // holds, then fades rather than hard-cutting on and off.
    if (this.milestoneBannerTimer > 0) {
      const { scale, alpha } = this.bannerProgress(this.milestoneBannerTimer, MILESTONE_DURATION);
      const cy = 185;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(w / 2, cy);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -cy);

      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 160, w, 50);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(0, 160, w, 2);
      ctx.fillRect(0, 208, w, 2);

      ctx.font = `10px ${GAME_CONFIG.PIXEL_FONT}`;
      ctx.fillStyle = '#f1c40f';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.milestoneBannerText.replace(/[★🪙⭐⚡]/g, '*'), w / 2, cy);
      ctx.restore();
    }

    // New Record Announcement
    if (this.recordBannerTimer > 0) {
      const { scale, alpha } = this.bannerProgress(this.recordBannerTimer, RECORD_DURATION);
      const cy = 240;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(w / 2, cy);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -cy);

      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 220, w, 40);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(0, 220, w, 2);
      ctx.fillRect(0, 258, w, 2);

      ctx.font = `10px ${GAME_CONFIG.PIXEL_FONT}`;
      ctx.fillStyle = '#2ecc71';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('* NEW BEST RECORD! *', w / 2, cy);
      ctx.restore();
    }

    ctx.restore();
  }

  private getBuffColor(type: string): string {
    switch (type) {
      case 'shield': return '#3498db';
      case 'double_jump': return '#2ecc71';
      case 'magnet': return '#f1c40f';
      case 'slow_mo': return '#9b59b6';
      case 'speed_boost': return '#e74c3c';
      default: return '#ffffff';
    }
  }

  private getBuffGlyph(type: string): string {
    switch (type) {
      case 'shield': return 'S';
      case 'double_jump': return '2X';
      case 'magnet': return 'M';
      case 'slow_mo': return '~';
      case 'speed_boost': return '>>';
      default: return '?';
    }
  }
}
