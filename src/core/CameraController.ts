import { GAME_CONFIG } from '../data/Constants.ts';

export class CameraController {
  public y = 0;
  private targetY = 0;
  private highestY = 0;

  private trauma = 0;
  private shakeOffset = { x: 0, y: 0 };
  private shakeAngle = 0;

  constructor() {
    this.reset();
  }

  public reset(startY: number = 0): void {
    this.y = startY;
    this.targetY = startY;
    this.highestY = startY;
    this.trauma = 0;
    this.shakeOffset.x = 0;
    this.shakeOffset.y = 0;
    this.shakeAngle = 0;
  }

  public update(playerY: number, dt: number): void {
    const desiredY = playerY - (GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.CAMERA_LOOKAHEAD_Y);

    if (desiredY < this.highestY) {
      this.highestY = desiredY;
      this.targetY = desiredY;
    }

    this.y += (this.targetY - this.y) * Math.min(1.0, GAME_CONFIG.CAMERA_SMOOTHING * (dt * 60));

    this.updateShake(dt);
  }

  public addTrauma(amount: number): void {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  private updateShake(dt: number): void {
    if (this.trauma > 0) {
      const shakePower = Math.pow(this.trauma, 2);
      const angle = (Math.random() * 2 - 1) * Math.PI;
      const distance = (Math.random() * 2 - 1) * GAME_CONFIG.MAX_SHAKE_OFFSET * shakePower;

      this.shakeOffset.x = Math.cos(angle) * distance;
      this.shakeOffset.y = Math.sin(angle) * distance;
      this.shakeAngle = (Math.random() * 2 - 1) * 0.04 * shakePower;

      this.trauma = Math.max(0, this.trauma - GAME_CONFIG.SHAKE_DECAY * dt);
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      this.shakeAngle = 0;
    }
  }

  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const cx = GAME_CONFIG.CANVAS_WIDTH / 2;
    const cy = GAME_CONFIG.CANVAS_HEIGHT / 2;

    ctx.translate(cx + this.shakeOffset.x, cy + this.shakeOffset.y);
    if (this.shakeAngle !== 0) {
      ctx.rotate(this.shakeAngle);
    }
    ctx.translate(-cx, -cy);

    ctx.translate(0, -this.y);
  }

  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  public worldToScreenY(worldY: number): number {
    return worldY - this.y;
  }

  public screenToWorldY(screenY: number): number {
    return screenY + this.y;
  }

  public getVisibleBounds(): { top: number; bottom: number } {
    return {
      top: this.y - 100,
      bottom: this.y + GAME_CONFIG.CANVAS_HEIGHT + 100
    };
  }
}
