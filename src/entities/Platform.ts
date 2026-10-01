import { GAME_CONFIG } from '../data/Constants.ts';

export type PlatformType = 'normal' | 'moving' | 'falling' | 'narrow' | 'bouncy' | 'risk_choice';

export class Platform {
  public id = 0;
  public x = 0;
  public y = 0;
  public width = 140;
  public height = 18;
  public type: PlatformType = 'normal';

  public startX = 0;
  public minX = 0;
  public maxX = 0;
  public moveSpeed = 0;
  public moveDir = 1;

  public isTriggered = false;
  public triggerTimer = 0;
  public fallDelay = 0.45;
  public isFalling = false;
  public fallSpeed = 0;
  public isDestroyed = false;

  public color = '#4ecdc4';
  public isBouncy = false;
  public isRiskPlatform = false;
  public riskTag: 'SAFE' | 'RISK' | '' = '';
  public shakeOffset = 0;

  // Brief compress-on-impact when the player lands, purely visual.
  public squashAmount = 0;

  constructor(id: number = 0) {
    this.id = id;
  }

  public reset(
    id: number,
    x: number,
    y: number,
    width: number,
    type: PlatformType = 'normal',
    color: string = '#4ecdc4',
    moveSpeed: number = 0,
    minX: number = 50,
    maxX: number = 370
  ): void {
    this.id = id;
    this.x = Math.floor(x);
    this.y = Math.floor(y);
    this.startX = this.x;
    this.width = Math.floor(width);
    this.height = 18;
    this.type = type;
    this.color = color;

    this.minX = minX;
    this.maxX = maxX;
    this.moveSpeed = moveSpeed;
    this.moveDir = Math.random() > 0.5 ? 1 : -1;

    this.isTriggered = false;
    this.triggerTimer = 0;
    this.isFalling = false;
    this.fallSpeed = 0;
    this.isDestroyed = false;
    this.isBouncy = type === 'bouncy';
    this.shakeOffset = 0;
    this.riskTag = '';
    this.isRiskPlatform = false;
    this.squashAmount = 0;
  }

  public update(dt: number): void {
    if (this.isDestroyed) return;

    if (this.type === 'moving' && this.moveSpeed > 0) {
      this.x += this.moveSpeed * this.moveDir * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.moveDir = 1;
      } else if (this.x + this.width >= this.maxX) {
        this.x = this.maxX - this.width;
        this.moveDir = -1;
      }
    }

    if (this.isTriggered && !this.isFalling) {
      this.triggerTimer += dt;
      this.shakeOffset = (Math.random() > 0.5 ? 2 : -2);

      if (this.triggerTimer >= this.fallDelay) {
        this.isFalling = true;
      }
    }

    if (this.isFalling) {
      this.fallSpeed += 1600 * dt;
      this.y += this.fallSpeed * dt;
      if (this.fallSpeed > 1000) {
        this.isDestroyed = true;
      }
    }

    if (this.squashAmount > 0) {
      this.squashAmount = Math.max(0, this.squashAmount - dt * 6);
    }
  }

  public onPlayerLand(): void {
    this.squashAmount = 1;

    if (this.type === 'falling' && !this.isTriggered) {
      this.isTriggered = true;
      this.triggerTimer = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.isDestroyed) return;

    ctx.save();

    const drawX = Math.floor(this.x + this.shakeOffset);
    // Squash flattens toward the bottom edge (where the impact happened)
    // and bulges the width slightly, easing back out over a few frames.
    const squashEase = this.squashAmount * this.squashAmount;
    const squashH = Math.round(4 * squashEase);
    const squashW = Math.round(this.width * 0.04 * squashEase);
    const drawY = Math.floor(this.y + squashH);
    const w = this.width + squashW * 2;
    const h = this.height - squashH;
    const x = Math.floor(this.x - squashW + this.shakeOffset);

    // 2px Black Outline
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(x - 2, drawY - 2, w + 4, h + 4);

    // Platform Main Body
    ctx.fillStyle = this.color;
    ctx.fillRect(x, drawY, w, h);

    // Top Highlight Pixel Stripe (2px)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(x, drawY, w, 2);

    // Bottom Dark Shadow Pixel Stripe (3px)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x, drawY + h - 3, w, 3);

    // Archetype Specific Pixel Patterns
    if (this.type === 'falling') {
      // Pixel crack pattern
      ctx.fillStyle = '#e74c3c';
      for (let i = 0; i < Math.floor(w / 16); i++) {
        const cx = drawX + 6 + i * 16;
        ctx.fillRect(cx, drawY + 4, 3, 3);
        ctx.fillRect(cx + 2, drawY + 7, 3, 4);
        ctx.fillRect(cx + 4, drawY + 11, 3, 3);
      }
    } else if (this.type === 'bouncy') {
      // Pixel spring chevron pattern
      ctx.fillStyle = '#f1c40f';
      for (let i = 0; i < Math.floor(w / 18); i++) {
        const bx = drawX + 6 + i * 18;
        ctx.fillRect(bx, drawY + 10, 2, 4);
        ctx.fillRect(bx + 2, drawY + 6, 2, 4);
        ctx.fillRect(bx + 4, drawY + 4, 2, 2);
        ctx.fillRect(bx + 6, drawY + 6, 2, 4);
        ctx.fillRect(bx + 8, drawY + 10, 2, 4);
      }
    }

    // Risk / Safe Pixel Badge
    if (this.riskTag) {
      ctx.font = `8px ${GAME_CONFIG.PIXEL_FONT}`;
      ctx.fillStyle = this.riskTag === 'RISK' ? '#e74c3c' : '#2ecc71';
      ctx.textAlign = 'center';
      ctx.fillText(this.riskTag, drawX + w / 2, drawY - 6);
    }

    ctx.restore();
  }
}
