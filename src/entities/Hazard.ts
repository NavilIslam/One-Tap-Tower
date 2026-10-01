export type HazardType = 'spike' | 'laser' | 'crusher' | 'saw';

export class Hazard {
  public id = 0;
  public type: HazardType = 'spike';
  public x = 0;
  public y = 0;
  public width = 24;
  public height = 24;
  public radius = 14;

  public isActive = true;
  public cycleTimer = 0;
  public chargeDuration = 1.2;
  public fireDuration = 1.0;
  public cooldownDuration = 1.5;
  public phase: 'charge' | 'firing' | 'cooldown' = 'cooldown';

  public moveSpeed = 0;
  public moveDir = 1;
  public minX = 0;
  public maxX = 0;
  public rotation = 0;
  public rotSpeed = 6;

  public color = '#e74c3c';
  public isWallSpike = false;
  public wallSide: 'left' | 'right' = 'left';

  constructor(id: number = 0) {
    this.id = id;
  }

  public resetSpike(
    id: number,
    x: number,
    y: number,
    width: number = 30,
    height: number = 16,
    isWall: boolean = false,
    wallSide: 'left' | 'right' = 'left',
    color: string = '#e74c3c'
  ): void {
    this.id = id;
    this.type = 'spike';
    this.x = Math.floor(x);
    this.y = Math.floor(y);
    this.width = width;
    this.height = height;
    this.isWallSpike = isWall;
    this.wallSide = wallSide;
    this.color = color;
    this.isActive = true;
  }

  public resetLaser(
    id: number,
    x: number,
    y: number,
    width: number = 420,
    chargeTime: number = 1.2,
    fireTime: number = 0.9,
    cooldownTime: number = 1.4,
    startOffset: number = 0
  ): void {
    this.id = id;
    this.type = 'laser';
    this.x = Math.floor(x);
    this.y = Math.floor(y);
    this.width = width;
    this.height = 10;
    this.chargeDuration = chargeTime;
    this.fireDuration = fireTime;
    this.cooldownDuration = cooldownTime;
    this.cycleTimer = startOffset % (chargeTime + fireTime + cooldownTime);
    this.updateLaserPhase();
  }

  public resetSaw(
    id: number,
    x: number,
    y: number,
    radius: number = 24,
    moveSpeed: number = 120,
    minX: number = 80,
    maxX: number = 400
  ): void {
    this.id = id;
    this.type = 'saw';
    this.x = Math.floor(x);
    this.y = Math.floor(y);
    this.radius = radius;
    this.width = radius * 2;
    this.height = radius * 2;
    this.moveSpeed = moveSpeed;
    this.minX = minX;
    this.maxX = maxX;
    this.moveDir = Math.random() > 0.5 ? 1 : -1;
    this.rotSpeed = 8;
    this.isActive = true;
  }

  public update(dt: number): void {
    if (this.type === 'laser') {
      const totalCycle = this.cooldownDuration + this.chargeDuration + this.fireDuration;
      this.cycleTimer = (this.cycleTimer + dt) % totalCycle;
      this.updateLaserPhase();
    } else if (this.type === 'saw') {
      this.rotation += this.rotSpeed * dt;
      if (this.moveSpeed > 0) {
        this.x += this.moveSpeed * this.moveDir * dt;
        if (this.x - this.radius <= this.minX) {
          this.x = this.minX + this.radius;
          this.moveDir = 1;
        } else if (this.x + this.radius >= this.maxX) {
          this.x = this.maxX - this.radius;
          this.moveDir = -1;
        }
      }
    }
  }

  private updateLaserPhase(): void {
    if (this.cycleTimer < this.cooldownDuration) {
      this.phase = 'cooldown';
      this.isActive = false;
    } else if (this.cycleTimer < this.cooldownDuration + this.chargeDuration) {
      this.phase = 'charge';
      this.isActive = false;
    } else {
      this.phase = 'firing';
      this.isActive = true;
    }
  }

  public checkCollision(px: number, py: number, psize: number): boolean {
    if (!this.isActive) return false;

    if (this.type === 'spike') {
      return (
        px + psize - 4 > this.x &&
        px + 4 < this.x + this.width &&
        py + psize - 4 > this.y &&
        py + 4 < this.y + this.height
      );
    } else if (this.type === 'laser') {
      if (this.phase !== 'firing') return false;
      return (
        px + psize - 4 > this.x &&
        px + 4 < this.x + this.width &&
        py + psize - 4 > this.y - 2 &&
        py + 4 < this.y + this.height + 2
      );
    } else if (this.type === 'saw') {
      const cx = px + psize / 2;
      const cy = py + psize / 2;
      const dx = cx - this.x;
      const dy = cy - this.y;
      const distSq = dx * dx + dy * dy;
      const collideDist = this.radius * 0.8 + (psize / 2) * 0.8;
      return distSq < collideDist * collideDist;
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (this.type === 'spike') {
      const drawX = Math.floor(this.x);
      const drawY = Math.floor(this.y);

      if (this.isWallSpike) {
        // Pixel Horizontal Wall Spike
        const spikeCount = Math.max(1, Math.floor(this.height / 14));
        const segH = this.height / spikeCount;

        for (let i = 0; i < spikeCount; i++) {
          const sy = Math.floor(drawY + i * segH);
          ctx.fillStyle = '#0a0a14';
          // Outline
          if (this.wallSide === 'left') {
            ctx.fillRect(drawX, sy, this.width + 2, Math.floor(segH));
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(drawX, sy);
            ctx.lineTo(drawX + this.width, sy + segH / 2);
            ctx.lineTo(drawX, sy + segH);
            ctx.fill();
          } else {
            ctx.fillRect(drawX - 2, sy, this.width + 2, Math.floor(segH));
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(drawX + this.width, sy);
            ctx.lineTo(drawX, sy + segH / 2);
            ctx.lineTo(drawX + this.width, sy + segH);
            ctx.fill();
          }
        }
      } else {
        // Pixel Floor Spike
        const spikeCount = Math.max(1, Math.floor(this.width / 14));
        const segW = this.width / spikeCount;

        for (let i = 0; i < spikeCount; i++) {
          const sx = Math.floor(drawX + i * segW);
          // Dark 1px base line
          ctx.fillStyle = '#0a0a14';
          ctx.fillRect(sx, drawY + this.height - 2, Math.floor(segW), 2);

          // Solid pixel spike triangle
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.moveTo(sx, drawY + this.height);
          ctx.lineTo(sx + segW / 2, drawY);
          ctx.lineTo(sx + segW, drawY + this.height);
          ctx.fill();

          // Highlight pixel
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.floor(sx + segW / 2) - 1, drawY + 2, 2, 3);
        }
      }
    } else if (this.type === 'laser') {
      const drawX = Math.floor(this.x);
      const drawY = Math.floor(this.y);

      // Pixel laser side emitter blocks
      ctx.fillStyle = '#2d2d44';
      ctx.fillRect(drawX, drawY - 6, 12, 22);
      ctx.fillRect(drawX + this.width - 12, drawY - 6, 12, 22);
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(drawX + 8, drawY - 2, 4, 14);
      ctx.fillRect(drawX + this.width - 12, drawY - 2, 4, 14);

      if (this.phase === 'charge') {
        // Flashing dotted retro laser line
        ctx.fillStyle = Math.floor(this.cycleTimer * 12) % 2 === 0 ? '#e74c3c' : 'rgba(231, 76, 60, 0.2)';
        for (let lx = drawX + 16; lx < drawX + this.width - 16; lx += 12) {
          ctx.fillRect(lx, drawY + 4, 6, 2);
        }
      } else if (this.phase === 'firing') {
        // Solid pixel beam with white core
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(drawX + 12, drawY, this.width - 24, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(drawX + 12, drawY + 3, this.width - 24, 4);
      }
    } else if (this.type === 'saw') {
      const cx = Math.floor(this.x);
      const cy = Math.floor(this.y);
      ctx.translate(cx, cy);
      ctx.rotate(this.rotation);

      const r = this.radius;

      // 8-point Pixel Saw Blade
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(-r - 1, -r - 1, (r * 2) + 2, (r * 2) + 2);

      ctx.fillStyle = this.color;
      ctx.fillRect(-r, -r, r * 2, r * 2);

      // Stepped teeth corners
      ctx.save();
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = this.color;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.restore();

      // Center dark pixel hub
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(-Math.floor(r * 0.4), -Math.floor(r * 0.4), Math.floor(r * 0.8), Math.floor(r * 0.8));

      // Center white rivet
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -2, 4, 4);
    }

    ctx.restore();
  }
}
