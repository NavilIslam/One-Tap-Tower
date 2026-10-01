import { GAME_CONFIG } from '../data/Constants.ts';
import { SaveManager } from '../systems/SaveManager.ts';
import { isDesktopBrowser } from '../entities/Player.ts';

export class TutorialOverlay {
  private animTimer = 0;

  public update(dt: number): void {
    this.animTimer += dt;
  }

  public render(ctx: CanvasRenderingContext2D, currentFloor: number): void {
    const save = SaveManager.getInstance().getData();
    if (save.hasSeenTutorial) return;

    if (currentFloor >= 5) {
      SaveManager.getInstance().markTutorialComplete();
      return;
    }

    ctx.save();
    const w = GAME_CONFIG.CANVAS_WIDTH;
    const isDesktop = isDesktopBrowser();

    const boxW = 380;
    const boxH = 50;
    const boxX = (w - boxW) / 2;
    const boxY = 580;

    // 2px Black Outline
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(boxX - 2, boxY - 2, boxW + 4, boxH + 4);

    // Box Background
    ctx.fillStyle = '#16162a';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.font = `8px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textY = boxY + boxH / 2;

    if (currentFloor <= 1) {
      ctx.fillText(isDesktop ? 'SPACE / CLICK TO JUMP' : 'TAP SCREEN TO JUMP', w / 2, textY);
    } else if (currentFloor === 2) {
      ctx.fillText('PRO TIP: JUMP ON WALLS TO WALL-JUMP!', w / 2, textY);
    } else if (currentFloor <= 3) {
      ctx.fillText('COLLECT COINS FOR COMBOS', w / 2, textY);
    } else if (currentFloor === 4) {
      ctx.fillText('DODGE HAZARDS & CLIMB HIGH!', w / 2, textY);
    }

    ctx.restore();
  }
}
