export class Coin {
  public id = 0;
  public x = 0;
  public y = 0;
  public radius = 10;
  public value = 1;
  public active = true;
  public collected = false;

  public animTimer = 0;
  public baseColor = '#f1c40f';

  public vx = 0;
  public vy = 0;

  constructor(id: number = 0) {
    this.id = id;
  }

  public reset(id: number, x: number, y: number, value: number = 1): void {
    this.id = id;
    this.x = Math.floor(x);
    this.y = Math.floor(y);
    this.value = value;
    this.radius = value > 1 ? 12 : 10;
    this.active = true;
    this.collected = false;
    this.animTimer = Math.random() * 10;
    this.vx = 0;
    this.vy = 0;
  }

  public update(dt: number, magnetTarget?: { x: number; y: number } | null, magnetRadius: number = 0): void {
    if (!this.active || this.collected) return;

    this.animTimer += dt * 5;

    if (magnetTarget && magnetRadius > 0) {
      const dx = magnetTarget.x - this.x;
      const dy = magnetTarget.y - this.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < magnetRadius * magnetRadius && distSq > 4) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / magnetRadius) * 650;
        this.vx += (dx / dist) * force * dt;
        this.vy += (dy / dist) * force * dt;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
      }
    }
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

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.collected) return;

    ctx.save();

    const drawX = Math.floor(this.x);
    // Gentle idle bob so coins feel alive instead of pinned in place.
    const bob = Math.sin(this.animTimer * 0.5) * 3;
    const drawY = Math.floor(this.y + bob);

    // Retro 4-Frame Coin Spin Animation
    const frame = Math.floor(this.animTimer) % 4;
    const color = this.value > 1 ? '#e91e63' : this.baseColor;
    const size = this.radius;

    ctx.fillStyle = '#0a0a14';

    if (frame === 0 || frame === 2) {
      // Full Width Frame (Square Coin with clipped corners)
      const s = size * 1.5;
      const half = Math.floor(s / 2);

      // Black outline
      ctx.fillRect(drawX - half - 1, drawY - half - 1, s + 2, s + 2);

      // Gold fill
      ctx.fillStyle = color;
      ctx.fillRect(drawX - half, drawY - half, s, s);

      // Inner highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(drawX - half + 2, drawY - half + 2, 3, 3);

      // Inner dark accent
      ctx.fillStyle = '#d35400';
      ctx.fillRect(drawX + half - 4, drawY + half - 4, 3, 3);
    } else if (frame === 1) {
      // 3/4 Perspective Frame
      const w = Math.floor(size * 0.9);
      const h = Math.floor(size * 1.5);
      const halfW = Math.floor(w / 2);
      const halfH = Math.floor(h / 2);

      ctx.fillRect(drawX - halfW - 1, drawY - halfH - 1, w + 2, h + 2);
      ctx.fillStyle = color;
      ctx.fillRect(drawX - halfW, drawY - halfH, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(drawX - halfW + 1, drawY - halfH + 2, 2, 2);
    } else {
      // Edge-on Thin Frame
      const w = 4;
      const h = Math.floor(size * 1.5);
      ctx.fillRect(drawX - 3, drawY - Math.floor(h / 2) - 1, w + 2, h + 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(drawX - 2, drawY - Math.floor(h / 2), w, h);
    }

    ctx.restore();
  }
}
