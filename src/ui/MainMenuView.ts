import { GAME_CONFIG } from '../data/Constants.ts';
import { SaveManager } from '../systems/SaveManager.ts';
import { getCharacterById } from '../data/Characters.ts';

export class MainMenuView {
  private animTimer = 0;

  public characterCardRect = {
    x: 50,
    y: 185,
    width: 380,
    height: 232
  };

  public playButtonRect = {
    x: 50,
    y: 436,
    width: 380,
    height: 64
  };

  public shopButtonRect = {
    x: 50,
    y: 518,
    width: 180,
    height: 54
  };

  public charactersButtonRect = this.shopButtonRect;

  public settingsButtonRect = {
    x: 250,
    y: 518,
    width: 180,
    height: 54
  };

  public update(dt: number): void {
    this.animTimer += dt;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const w = GAME_CONFIG.CANVAS_WIDTH;
    const save = SaveManager.getInstance().getData();
    const char = getCharacterById(save.selectedCharacter);

    // Subtle dark backdrop to keep the menu UI ultra-crisp and legible
    ctx.fillStyle = 'rgba(10, 10, 20, 0.4)';
    ctx.fillRect(0, 0, w, GAME_CONFIG.CANVAS_HEIGHT);

    // 1. Top Badges: Coin Count & Best Record
    this.renderTopBadge(ctx, 36, 22, 120, 30, `[C] ${save.coins}`, '#f1c40f');
    this.renderTopBadge(ctx, w - 156, 22, 120, 30, `BEST: FL ${save.bestFloor}`, '#4ecdc4');

    // 2. Title: ONE TAP TOWER with retro arcade typography & 3D shadow
    ctx.textAlign = 'center';

    // Title 3D Shadow
    ctx.font = `bold 24px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#0a0a14';
    ctx.fillText('ONE TAP', (w / 2) + 2, 88);
    ctx.fillText('TOWER', (w / 2) + 2, 124);

    // Title Foreground
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ONE TAP', w / 2, 86);
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText('TOWER', w / 2, 122);

    // Subtitle Tag
    ctx.font = `bold 13px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#f39c12';
    ctx.fillText('>> ENDLESS ARCADE CLIMBER <<', w / 2, 154);

    // 3. Hero Showcase Card
    this.renderHeroCard(ctx, char);

    // 4. Primary [PLAY] Button
    this.renderPlayButton(ctx);

    // 5. Sub-Menu Buttons: HEROES & SETTINGS
    this.renderSubButton(ctx, this.charactersButtonRect, 'HEROES', '#9b59b6');
    this.renderSubButton(ctx, this.settingsButtonRect, 'SETTINGS', '#3498db');

    // 6. Bottom Controls Guide Box
    this.renderControlsGuide(ctx);

    ctx.restore();
  }

  private renderTopBadge(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, text: string, color: string): void {
    ctx.save();
    // Shadow
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(x + 2, y + 2, width, height);

    // Badge Body
    ctx.fillStyle = '#16162a';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Text
    ctx.font = `bold 13px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2);
    ctx.restore();
  }

  private renderHeroCard(ctx: CanvasRenderingContext2D, char: any): void {
    const card = this.characterCardRect;
    const w = GAME_CONFIG.CANVAS_WIDTH;

    ctx.save();
    // Shadow
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(card.x + 3, card.y + 3, card.width, card.height);

    // Background
    ctx.fillStyle = '#16162a';
    ctx.fillRect(card.x, card.y, card.width, card.height);

    // Border
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 2;
    ctx.strokeRect(card.x, card.y, card.width, card.height);

    // Platform Pedestal under Character
    const platY = card.y + 112;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(w / 2 - 52, platY - 2, 104, 16);
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(w / 2 - 50, platY, 100, 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(w / 2 - 50, platY, 100, 2);

    // Idle Bobbing Animation for Character
    const bobOffset = Math.sin(this.animTimer * 3.5) * 3;
    const charY = card.y + 70 + bobOffset;
    const half = 18;

    ctx.save();
    ctx.translate(w / 2, charY);

    // Black outline
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(-half - 2, -half - 2, half * 2 + 4, half * 2 + 4);

    // Body
    ctx.fillStyle = char.primaryColor;
    ctx.fillRect(-half, -half, half * 2, half * 2);

    // Belt
    ctx.fillStyle = char.secondaryColor;
    ctx.fillRect(-half, half - 7, half * 2, 5);

    // Eyes
    ctx.fillStyle = char.eyeColor;
    ctx.fillRect(-6, -4, 4, 5);
    ctx.fillRect(3, -4, 4, 5);
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(-5, -3, 2, 3);
    ctx.fillRect(4, -3, 2, 3);

    ctx.restore();

    // Character Name
    ctx.font = `bold 16px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(char.name.toUpperCase(), w / 2, card.y + 150);

    // Character Perk Description
    ctx.font = `600 14px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText(char.perkDescription, w / 2, card.y + 176);

    // Tap to Change Hero hint
    ctx.font = `bold 11px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('[ TAP TO SWITCH HERO ]', w / 2, card.y + 204);

    ctx.restore();
  }

  private renderPlayButton(ctx: CanvasRenderingContext2D): void {
    const btn = this.playButtonRect;

    ctx.save();
    // 3px Black Shadow
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(btn.x + 3, btn.y + 3, btn.width, btn.height);

    // Solid Green Button
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    // Top Highlight Bevel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(btn.x + 2, btn.y + 2, btn.width - 4, 3);

    // 2px Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    // Text
    ctx.fillStyle = '#0a0a14';
    ctx.font = `bold 18px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('> PLAY <', btn.x + btn.width / 2, btn.y + btn.height / 2);

    ctx.restore();
  }

  private renderSubButton(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }, text: string, color: string): void {
    ctx.save();
    // Shadow
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.width, rect.height);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // Left color indicator bar
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, 6, rect.height);

    // 2px Border
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 11px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, rect.x + rect.width / 2 + 3, rect.y + rect.height / 2);

    ctx.restore();
  }

  private renderControlsGuide(ctx: CanvasRenderingContext2D): void {
    const w = GAME_CONFIG.CANVAS_WIDTH;
    const boxX = 50;
    const boxY = 598;
    const boxW = 380;
    const boxH = 64;

    ctx.save();
    // Box shadow
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(boxX + 2, boxY + 2, boxW, boxH);

    // Box background
    ctx.fillStyle = '#121224';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Box border
    ctx.strokeStyle = '#252538';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Controls text
    ctx.font = `600 13px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPACE / CLICK / TAP TO JUMP', w / 2, boxY + 22);

    ctx.font = `bold 13px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText('PRO TIP: JUMP ON WALLS TO WALL-JUMP!', w / 2, boxY + 44);

    ctx.restore();
  }
}
