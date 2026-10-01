import { GAME_CONFIG } from '../data/Constants.ts';
import { CHARACTERS, CharacterDef } from '../data/Characters.ts';
import { SaveManager } from '../systems/SaveManager.ts';
import { EventBus, Events } from '../core/EventBus.ts';

export class ShopView {
  public currentIndex = 0;
  private animTimer = 0;

  public backButtonRect = {
    x: 24,
    y: 20,
    width: 80,
    height: 36
  };

  public prevButtonRect = {
    x: 30,
    y: 280,
    width: 44,
    height: 44
  };

  public nextButtonRect = {
    x: GAME_CONFIG.CANVAS_WIDTH - 74,
    y: 280,
    width: 44,
    height: 44
  };

  public actionButtonRect = {
    x: 90,
    y: 660,
    width: 300,
    height: 56
  };

  public update(dt: number): void {
    this.animTimer += dt;
  }

  public nextCharacter(): void {
    this.currentIndex = (this.currentIndex + 1) % CHARACTERS.length;
  }

  public prevCharacter(): void {
    this.currentIndex = (this.currentIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
  }

  public handleAction(): boolean {
    return this.selectCurrentCharacter();
  }

  public selectCurrentCharacter(): boolean {
    const char = CHARACTERS[this.currentIndex];
    const save = SaveManager.getInstance().getData();

    if (save.selectedCharacter === char.id) {
      return false;
    }

    if (save.unlockedCharacters.includes(char.id)) {
      SaveManager.getInstance().selectCharacter(char.id);
      EventBus.getInstance().emit(Events.CHARACTER_SELECTED, char);
      return true;
    }

    if (save.coins >= char.price) {
      SaveManager.getInstance().spendCoins(char.price);
      SaveManager.getInstance().unlockCharacter(char.id);
      SaveManager.getInstance().selectCharacter(char.id);
      EventBus.getInstance().emit(Events.CHARACTER_PURCHASED, char);
      EventBus.getInstance().emit(Events.CHARACTER_SELECTED, char);
      return true;
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const w = GAME_CONFIG.CANVAS_WIDTH;
    const save = SaveManager.getInstance().getData();
    const char = CHARACTERS[this.currentIndex];
    const isUnlocked = save.unlockedCharacters.includes(char.id);
    const isSelected = save.selectedCharacter === char.id;
    const canAfford = save.coins >= char.price;

    // Dark backdrop overlay
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

    // Coin Count Top Right
    ctx.fillStyle = '#f1c40f';
    ctx.font = `bold 14px ${GAME_CONFIG.UI_FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`[C] ${save.coins}`, w - 24, backBtn.y + backBtn.height / 2);

    // Shop Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 16px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('CHARACTER SHOP', w / 2, 78);

    ctx.font = `600 13px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${this.currentIndex + 1} OF ${CHARACTERS.length}`, w / 2, 100);

    // Character Card Frame
    const cardX = 40;
    const cardY = 120;
    const cardW = w - 80;
    const cardH = 340;

    // Shadow
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(cardX + 3, cardY + 3, cardW, cardH);

    // Body
    ctx.fillStyle = '#16162a';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Live Animated Character Avatar (60x60)
    const avatarY = cardY + 110;
    const half = 30;

    ctx.save();
    ctx.translate(w / 2, avatarY);

    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(-half - 2, -half - 2, half * 2 + 4, half * 2 + 4);

    ctx.fillStyle = char.primaryColor;
    ctx.fillRect(-half, -half, half * 2, half * 2);

    ctx.fillStyle = char.secondaryColor;
    ctx.fillRect(-half, half - 10, half * 2, 8);

    ctx.fillStyle = char.eyeColor;
    ctx.fillRect(-10, -6, 6, 8);
    ctx.fillRect(5, -6, 6, 8);
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(-8, -4, 3, 4);
    ctx.fillRect(7, -4, 3, 4);

    ctx.restore();

    // Arrows < >
    this.renderArrowButton(ctx, this.prevButtonRect, '<');
    this.renderArrowButton(ctx, this.nextButtonRect, '>');

    // Character Info Card Text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 16px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(char.name.toUpperCase(), w / 2, cardY + 215);

    ctx.font = `bold 14px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText(char.title.toUpperCase(), w / 2, cardY + 240);

    ctx.font = `500 13px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(char.description, w / 2, cardY + 268);

    // Perk Box
    const perkY = 480;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(40, perkY, w - 80, 72);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(42, perkY + 2, w - 84, 68);
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 1;
    ctx.strokeRect(42, perkY + 2, w - 84, 68);

    ctx.font = `bold 10px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#f39c12';
    ctx.fillText('★ SPECIAL PERK ★', w / 2, perkY + 24);

    ctx.font = `600 14px ${GAME_CONFIG.UI_FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(char.perkDescription, w / 2, perkY + 50);

    // Action Button (Select / Buy)
    this.renderActionButton(ctx, isSelected, isUnlocked, canAfford, char);

    ctx.restore();
  }

  private renderArrowButton(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }, glyph: string): void {
    ctx.save();
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 16px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, rect.x + rect.width / 2, rect.y + rect.height / 2);
    ctx.restore();
  }

  private renderActionButton(ctx: CanvasRenderingContext2D, isSelected: boolean, isUnlocked: boolean, canAfford: boolean, char: CharacterDef): void {
    const btn = this.actionButtonRect;

    let bg = '#2ecc71';
    let text = 'EQUIP';
    let textColor = '#0a0a14';

    if (isSelected) {
      bg = '#2d2d44';
      text = '[ SELECTED ]';
      textColor = '#ffffff';
    } else if (isUnlocked) {
      bg = '#4ecdc4';
      text = 'EQUIP';
      textColor = '#0a0a14';
    } else if (canAfford) {
      bg = '#f1c40f';
      text = `UNLOCK ([C] ${char.price})`;
      textColor = '#0a0a14';
    } else {
      bg = '#2c1810';
      text = `NEED [C] ${char.price}`;
      textColor = '#7f8c8d';
    }

    ctx.save();
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(btn.x + 3, btn.y + 3, btn.width, btn.height);

    ctx.fillStyle = bg;
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    ctx.fillStyle = textColor;
    ctx.font = `bold 12px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2);

    ctx.restore();
  }
}
