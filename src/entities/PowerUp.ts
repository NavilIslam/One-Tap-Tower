import { GAME_CONFIG } from '../data/Constants.ts';

export type PowerUpType = 'shield' | 'double_jump' | 'magnet' | 'slow_mo' | 'speed_boost';

export class PowerUp {
  public id = 0;
  public x = 0;
  public y = 0;
  public radius = 14;
  public type: PowerUpType = 'shield';
  public active = true;
  public collected = false;
  public animTimer = 0;

  constructor(id: number = 0) {
    this.id = id;
  }

  public reset(id: number, x: number, y: number, type: PowerUpType): void {
    this.id = id;
    this.x = Math.floor(x);
    this.y = Math.floor(y);
    this.type = type;
    this.active = true;
    this.collected = false;
    this.animTimer = Math.random() * 5;
  }

  public update(dt: number): void {
    if (!this.active || this.collected) return;
    this.animTimer += dt * 3;
  }

  public checkCollision(px: number, py: number, psize: number): boolean {
    if (!this.active || this.collected) return false;
    const cx = px + psize / 2;
    const cy = py + psize / 2;
    const dx = cx - this.x;
    const dy = cy - this.y;
    const distSq = dx * dx + dy * dy;
    const hitDist = this.radius + psize / 2;
    return distSq < hitDist * hitDist;
  }

  public getColor(): string {
    switch (this.type) {
      case 'shield': return '#3498db';
      case 'double_jump': return '#2ecc71';
      case 'magnet': return '#f1c40f';
      case 'slow_mo': return '#9b59b6';
      case 'speed_boost': return '#e74c3c';
    }
  }

  public getGlyph(): string {
    switch (this.type) {
      case 'shield': return 'S';
      case 'double_jump': return '2X';
      case 'magnet': return 'M';
      case 'slow_mo': return '~';
      case 'speed_boost': return '>>';
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.collected) return;

    ctx.save();
    const bob = Math.floor(Math.sin(this.animTimer) * 3);
    const drawX = Math.floor(this.x);
    const drawY = Math.floor(this.y + bob);
    const color = this.getColor();
    const s = 24;
    const half = s / 2;

    // 2px Black Outline Box
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(drawX - half - 2, drawY - half - 2, s + 4, s + 4);

    // Colored PowerUp Box
    ctx.fillStyle = color;
    ctx.fillRect(drawX - half, drawY - half, s, s);

    // 2px Inner Bevel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(drawX - half + 2, drawY - half + 2, s - 4, 2);

    // Power-up Pixel Letter Glyph
    ctx.font = `9px ${GAME_CONFIG.PIXEL_FONT}`;
    ctx.fillStyle = '#0a0a14';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.getGlyph(), drawX + 1, drawY + 1);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.getGlyph(), drawX, drawY);

    ctx.restore();
  }
}
