export type EnemyType = 'drone' | 'slime';

export class Enemy {
  public id = 0;
  public x = 0;
  public y = 0;
  public type: EnemyType = 'drone';
  public width = 26;
  public height = 26;
  public moveSpeed = 100;
  public moveDir = 1;
  public minX = 60;
  public maxX = 420;
  public animTimer = 0;
  public active = true;
  public color = '#e74c3c';

  constructor(id: number = 0) {
    this.id = id;
  }

  public reset(
    id: number,
    x: number,
    y: number,
    type: EnemyType = 'drone',
    speed: number = 110,
    minX: number = 60,
    maxX: number = 420,
    color: string = '#e74c3c'
  ): void {
    this.id = id;
    this.x = Math.floor(x);
    this.y = Math.floor(y);
    this.type = type;
    this.moveSpeed = speed;
    this.minX = minX;
    this.maxX = maxX;
    this.moveDir = Math.random() > 0.5 ? 1 : -1;
    this.active = true;
    this.color = color;
    this.animTimer = Math.random() * 5;
  }

  public update(dt: number): void {
    if (!this.active) return;

    this.animTimer += dt;
    this.x += this.moveSpeed * this.moveDir * dt;

    if (this.x <= this.minX) {
      this.x = this.minX;
      this.moveDir = 1;
    } else if (this.x + this.width >= this.maxX) {
      this.x = this.maxX - this.width;
      this.moveDir = -1;
    }
  }

  public checkCollision(px: number, py: number, psize: number): boolean {
    if (!this.active) return false;
    return (
      px + psize - 3 > this.x &&
      px + 3 < this.x + this.width &&
      py + psize - 3 > this.y &&
      py + 3 < this.y + this.height
    );
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    const bob = Math.floor(Math.sin(this.animTimer * 5) * 3);
    const drawX = Math.floor(this.x);
    const drawY = Math.floor(this.y + bob);

    if (this.type === 'drone') {
      // 2px Outline
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(drawX - 2, drawY - 2, this.width + 4, this.height + 4);

      // Cyber Drone Chassis
      ctx.fillStyle = '#2d2d44';
      ctx.fillRect(drawX, drawY, this.width, this.height);

      // Accent color corner sensors
      ctx.fillStyle = this.color;
      ctx.fillRect(drawX, drawY, 4, 4);
      ctx.fillRect(drawX + this.width - 4, drawY, 4, 4);
      ctx.fillRect(drawX, drawY + this.height - 4, 4, 4);
      ctx.fillRect(drawX + this.width - 4, drawY + this.height - 4, 4, 4);

      // Glowing Eye (Square pixel)
      const eyeX = drawX + Math.floor(this.width / 2) - 3 + (this.moveDir * 3);
      ctx.fillStyle = this.color;
      ctx.fillRect(eyeX, drawY + Math.floor(this.height / 2) - 3, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(eyeX + 1, drawY + Math.floor(this.height / 2) - 2, 2, 2);

      // Top antenna
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(drawX + Math.floor(this.width / 2) - 1, drawY - 4, 2, 4);
    } else {
      // Stepped Pixel Slime
      const w = this.width;
      const h = this.height;

      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(drawX + 2, drawY - 2, w - 4, h + 4);
      ctx.fillRect(drawX - 2, drawY + 6, w + 4, h - 4);

      ctx.fillStyle = this.color;
      // Upper dome
      ctx.fillRect(drawX + 4, drawY, w - 8, h);
      // Lower wide body
      ctx.fillRect(drawX, drawY + 8, w, h - 8);

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(drawX + 6, drawY + 2, 4, 4);

      // Slime Eye (Pixel square)
      const eyeX = drawX + Math.floor(w / 2) - 3 + (this.moveDir * 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(eyeX, drawY + 6, 4, 4);
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(eyeX + 1, drawY + 7, 2, 2);
    }

    ctx.restore();
  }
}
