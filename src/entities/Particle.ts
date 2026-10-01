import { IPoolable, ObjectPool } from '../core/ObjectPool.ts';
import { GAME_CONFIG } from '../data/Constants.ts';

export type ParticleType = 'square' | 'spark' | 'ring' | 'text';

export class Particle implements IPoolable {
  public active = false;
  public x = 0;
  public y = 0;
  public vx = 0;
  public vy = 0;
  public size = 4;
  public initialSize = 4;
  public color = '#ffffff';
  public alpha = 1.0;
  public life = 1.0;
  public maxLife = 1.0;
  public gravity = 0;
  public drag = 0.98;
  public type: ParticleType = 'square';
  public text = '';

  public reset(
    x: number = 0,
    y: number = 0,
    vx: number = 0,
    vy: number = 0,
    color: string = '#ffffff',
    size: number = 4,
    life: number = 0.6,
    type: ParticleType = 'square',
    gravity: number = 0,
    text: string = ''
  ): void {
    this.x = Math.floor(x);
    this.y = Math.floor(y);
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = Math.floor(size);
    this.initialSize = this.size;
    this.life = life;
    this.maxLife = life;
    this.type = type;
    this.gravity = gravity;
    this.drag = 0.96;
    this.text = text;
    this.alpha = 1.0;
  }

  public update(dt: number): void {
    if (!this.active) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    const progress = 1 - (this.life / this.maxLife);

    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.type === 'ring') {
      this.size = Math.floor(this.initialSize + (progress * 30));
      this.alpha = (1 - progress);
    } else if (this.type === 'text') {
      this.alpha = Math.min(1.0, this.life / (this.maxLife * 0.4));
      this.y -= 25 * dt;
    } else {
      this.alpha = this.life / this.maxLife;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));

    const drawX = Math.floor(this.x);
    const drawY = Math.floor(this.y);

    if (this.type === 'text') {
      ctx.font = `9px ${GAME_CONFIG.PIXEL_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Black 1px text shadow
      ctx.fillStyle = '#0a0a14';
      ctx.fillText(this.text, drawX + 1, drawY + 1);
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, drawX, drawY);
    } else if (this.type === 'ring') {
      // Expanding Pixel Square Outline
      const s = Math.max(4, this.size);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX - Math.floor(s / 2), drawY - Math.floor(s / 2), s, s);
    } else if (this.type === 'spark') {
      // 2x4 directional pixel spark
      ctx.fillStyle = this.color;
      ctx.fillRect(drawX, drawY, 3, 3);
    } else {
      // Flat Pixel Square
      ctx.fillStyle = this.color;
      ctx.fillRect(drawX - Math.floor(this.size / 2), drawY - Math.floor(this.size / 2), this.size, this.size);
    }

    ctx.restore();
  }
}

export class ParticleManager {
  private pool: ObjectPool<Particle>;

  constructor() {
    this.pool = new ObjectPool<Particle>(() => new Particle(), 50, 400);
  }

  public update(dt: number): void {
    this.pool.forEachActive(p => p.update(dt));
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.pool.forEachActive(p => p.render(ctx));
  }

  public clear(): void {
    this.pool.releaseAll();
  }

  public emitJumpDust(x: number, y: number, color: string = '#ffffff'): void {
    for (let i = 0; i < 6; i++) {
      const vx = (Math.random() * 2 - 1) * 50;
      const vy = -Math.random() * 40 - 10;
      this.pool.get(
        x + (Math.random() * 16 - 8),
        y,
        vx,
        vy,
        color,
        Math.random() > 0.5 ? 4 : 2,
        0.3 + Math.random() * 0.2,
        'square',
        80
      );
    }
  }

  public emitWallJumpKick(x: number, y: number, wallSide: 'left' | 'right', color: string = '#4ecdc4'): void {
    const dir = wallSide === 'left' ? 1 : -1;
    this.pool.get(x, y, 0, 0, color, 8, 0.3, 'ring', 0);

    for (let i = 0; i < 8; i++) {
      const vx = (20 + Math.random() * 80) * dir;
      const vy = -Math.random() * 70 - 20;
      this.pool.get(x, y, vx, vy, color, 3, 0.35, 'spark', 120);
    }
  }

  public emitCoinCollect(x: number, y: number, color: string = '#f1c40f'): void {
    this.pool.get(x, y, 0, 0, color, 6, 0.3, 'ring', 0);

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 60 + Math.random() * 60;
      this.pool.get(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        3,
        0.35,
        'square',
        60
      );
    }
  }

  public emitDeathShatter(x: number, y: number, color: string = '#4ecdc4'): void {
    this.pool.get(x, y, 0, 0, '#e74c3c', 10, 0.5, 'ring', 0);

    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const c = Math.random() > 0.5 ? color : (Math.random() > 0.5 ? '#e74c3c' : '#ffffff');
      this.pool.get(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        c,
        Math.random() > 0.5 ? 6 : 4,
        0.6 + Math.random() * 0.4,
        'square',
        300
      );
    }
  }

  public emitFloatingText(x: number, y: number, text: string, color: string = '#f1c40f'): void {
    this.pool.get(x, y, 0, -25, color, 10, 0.8, 'text', 0, text);
  }

  public emitMilestoneConfetti(x: number, y: number): void {
    const colors = ['#4ecdc4', '#e74c3c', '#f1c40f', '#2ecc71', '#ffffff', '#9b59b6'];
    for (let i = 0; i < 36; i++) {
      const angle = (Math.random() * 2 - 1) * Math.PI;
      const speed = 120 + Math.random() * 180;
      const col = colors[Math.floor(Math.random() * colors.length)];
      this.pool.get(
        x + (Math.random() * 80 - 40),
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 80,
        col,
        Math.random() > 0.5 ? 5 : 3,
        0.8 + Math.random() * 0.5,
        'square',
        200
      );
    }
  }

  public emitTrail(x: number, y: number, color: string, type: 'pixel' | 'puff' | 'ember' | 'fade' | 'none'): void {
    if (type === 'none') return;
    if (type === 'puff') {
      this.pool.get(x, y, (Math.random() * 2 - 1) * 8, -6, '#95a5a6', 4, 0.3, 'square', -10);
    } else if (type === 'ember') {
      const col = Math.random() > 0.5 ? '#e74c3c' : '#f39c12';
      this.pool.get(x, y, (Math.random() * 2 - 1) * 12, -10, col, 3, 0.25, 'spark', -20);
    } else if (type === 'fade') {
      this.pool.get(x, y, 0, 0, color, 6, 0.2, 'square', 0);
    } else {
      this.pool.get(x, y, (Math.random() * 2 - 1) * 10, (Math.random() * 2 - 1) * 10, color, 3, 0.2, 'square', 0);
    }
  }
}
