import { GAME_CONFIG } from '../data/Constants.ts';
import { ScoreManager } from '../systems/ScoreManager.ts';
import { CoinManager } from '../systems/CoinManager.ts';
import { SaveManager } from '../systems/SaveManager.ts';

export class GameOverView {
  public restartButtonRect = {
    x: 60,
    y: 515,
    width: 360,
    height: 60
  };

  public homeButtonRect = {
    x: 60,
    y: 590,
    width: 360,
    height: 50
  };

  private animTimer = 0;

  public update(dt: number): void {
    this.animTimer += dt;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const w = GAME_CONFIG.CANVAS_WIDTH;
    const scoreMgr = ScoreManager.getInstance();
    const coinMgr = CoinManager.getInstance();
    const save = SaveManager.getInstance().getData();

    // Dark backdrop overlay
    ctx.fillStyle = 'rgba(10, 10, 20, 0.92)';
    ctx.fillRect(0, 0, w, GAME_CONFIG.CANVAS_HEIGHT);

    // Title: GAME OVER with 3D pixel shadow
    ctx.textAlign = 'center';
    ctx.font = `bold 24px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#0a0a14';
    ctx.fillText('GAME OVER', w / 2 + 3, 113);
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('GAME OVER', w / 2, 110);

    // Run Summary Container
    const cardX = 40;
    const cardY = 140;
    const cardW = w - 80;
    const cardH = 340;

    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(cardX + 3, cardY + 3, cardW, cardH);
    ctx.fillStyle = '#16162a';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Floor Reached Stat
    ctx.font = `bold 12px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('FLOOR REACHED', w / 2, cardY + 36);

    ctx.font = `bold 36px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${scoreMgr.highestFloorThisRun}`, w / 2, cardY + 82);

    // Stats Grid
    const statY1 = cardY + 120;
    const statY2 = cardY + 220;
    const col1X = cardX + 20;
    const col2X = cardX + (cardW / 2) + 10;
    const statW = (cardW / 2) - 30;
    const statH = 75;

    this.renderStatBox(ctx, col1X, statY1, statW, statH, 'BEST FLOOR', `FL ${save.bestFloor}`, '#4ecdc4');
    this.renderStatBox(ctx, col2X, statY1, statW, statH, 'COINS EARNED', `+${coinMgr.coinsThisRun}`, '#f1c40f');
    this.renderStatBox(ctx, col1X, statY2, statW, statH, 'TOTAL COINS', `[C] ${save.coins}`, '#f39c12');
    this.renderStatBox(ctx, col2X, statY2, statW, statH, 'BEST COMBO', `x${scoreMgr.maxComboThisRun}`, '#e74c3c');

    // Action Buttons
    this.renderRestartButton(ctx);
    this.renderHomeButton(ctx);

    ctx.restore();
  }

  private renderStatBox(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, label: string, value: string, color: string): void {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    ctx.font = `bold 11px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y + 24);

    ctx.font = `bold 14px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = color;
    ctx.fillText(value, x + width / 2, y + 54);
  }

  private renderRestartButton(ctx: CanvasRenderingContext2D): void {
    const btn = this.restartButtonRect;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(btn.x + 3, btn.y + 3, btn.width, btn.height);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    ctx.fillStyle = '#0a0a14';
    ctx.font = `bold 14px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('> PLAY AGAIN <', btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  private renderHomeButton(ctx: CanvasRenderingContext2D): void {
    const btn = this.homeButtonRect;
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 12px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MAIN MENU', btn.x + btn.width / 2, btn.y + btn.height / 2);
  }
}
