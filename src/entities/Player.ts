import { GAME_CONFIG } from '../data/Constants.ts';
import { CharacterDef, getCharacterById } from '../data/Characters.ts';
import { Platform } from './Platform.ts';
import { EventBus, Events } from '../core/EventBus.ts';

export function isDesktopBrowser(): boolean {
  if (typeof window === 'undefined') return true;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasTouchOnly = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;
  return !isMobileUA && !hasTouchOnly;
}

export class Player {
  public x = 240;
  public y = 688;
  public vx = 0;
  public vy = 0;
  public size = GAME_CONFIG.PLAYER_SIZE;
  public moveDir = 1;

  public isDesktop = true;

  public isGrounded = true;
  public isDead = false;
  public hasDoubleJump = false;
  public hasShield = false;
  public isInvulnerable = false;
  public invulnerableTimer = 0;

  public coyoteTimer = 0;
  public jumpCount = 0;
  public currentPlatform: Platform | null = null;

  public wallGraceTimer = 0;
  public wallSide: 'left' | 'right' = 'left';
  public isWallSliding = false;

  public scaleX = 1.0;
  public scaleY = 1.0;
  public animTimer = 0;

  public charDef: CharacterDef;
  public trailTimer = 0;

  constructor(characterId: string = 'classic') {
    this.charDef = getCharacterById(characterId);
    this.isDesktop = isDesktopBrowser();
    this.reset(240, 688);
  }

  public setCharacter(characterId: string): void {
    this.charDef = getCharacterById(characterId);
  }

  public reset(startX: number = 240, startY: number = 688): void {
    this.x = startX;
    this.y = startY;
    this.moveDir = 1;
    this.vx = GAME_CONFIG.BASE_RUN_SPEED * this.charDef.speedMultiplier;
    this.vy = 0;
    this.isGrounded = true;
    this.isDead = false;
    this.hasDoubleJump = false;
    this.hasShield = false;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.coyoteTimer = GAME_CONFIG.COYOTE_TIME + this.charDef.coyoteBonus;
    this.jumpCount = 0;
    this.currentPlatform = null;
    this.wallGraceTimer = 0;
    this.isWallSliding = false;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.animTimer = 0;
    this.isDesktop = isDesktopBrowser();
  }

  public revive(safeX: number, safeY: number): void {
    this.x = safeX;
    this.y = safeY;
    this.vy = 0;
    this.vx = GAME_CONFIG.BASE_RUN_SPEED * this.charDef.speedMultiplier * this.moveDir;
    this.isDead = false;
    this.isGrounded = true;
    this.isInvulnerable = true;
    this.invulnerableTimer = 2.0;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
  }

  public update(dt: number, speedBoostActive: boolean = false): void {
    if (this.isDead) return;

    this.animTimer += dt;

    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    const speedMult = (speedBoostActive ? GAME_CONFIG.SPEED_BOOST_SCALE : 1.0) * this.charDef.speedMultiplier;
    this.vx = GAME_CONFIG.BASE_RUN_SPEED * speedMult * this.moveDir;
    this.x += this.vx * dt;

    const minX = GAME_CONFIG.WALL_THICKNESS;
    const maxX = GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS - this.size;

    let hitWallThisFrame = false;
    if (this.x <= minX) {
      this.x = minX;
      this.moveDir = 1;
      this.wallSide = 'left';
      hitWallThisFrame = true;
      this.onWallBounce();
    } else if (this.x >= maxX) {
      this.x = maxX;
      this.moveDir = -1;
      this.wallSide = 'right';
      hitWallThisFrame = true;
      this.onWallBounce();
    }

    if (!this.isGrounded) {
      if (hitWallThisFrame || this.x <= minX + 4 || this.x >= maxX - 4) {
        this.wallGraceTimer = 0.28;
        this.isWallSliding = true;

        if (this.vy > 0) {
          this.vy = Math.min(this.vy, 220);
        }
      } else {
        this.isWallSliding = false;
        if (this.wallGraceTimer > 0) {
          this.wallGraceTimer = Math.max(0, this.wallGraceTimer - dt);
        }
      }
    } else {
      this.wallGraceTimer = 0;
      this.isWallSliding = false;
    }

    if (this.isGrounded && this.currentPlatform) {
      this.vy = 0;
      this.y = this.currentPlatform.y - this.size;

      const platLeft = this.currentPlatform.x - this.size * 0.7;
      const platRight = this.currentPlatform.x + this.currentPlatform.width - this.size * 0.3;
      if (this.x < platLeft || this.x > platRight || this.currentPlatform.isDestroyed) {
        this.isGrounded = false;
        this.currentPlatform = null;
        this.coyoteTimer = GAME_CONFIG.COYOTE_TIME + this.charDef.coyoteBonus;
      }
    } else {
      const grav = GAME_CONFIG.GRAVITY * this.charDef.gravityMultiplier;
      const fallMult = this.vy > 0 ? GAME_CONFIG.FALL_GRAVITY_SCALE : 1.0;
      this.vy += grav * fallMult * dt;
      this.y += this.vy * dt;

      if (this.coyoteTimer > 0) {
        this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      }
    }

    this.scaleX += (1.0 - this.scaleX) * Math.min(1.0, 15 * dt);
    this.scaleY += (1.0 - this.scaleY) * Math.min(1.0, 15 * dt);

    this.trailTimer += dt;
  }

  private onWallBounce(): void {
    this.scaleX = 0.8;
    this.scaleY = 1.2;
    EventBus.getInstance().emit(Events.PLAYER_WALL_BOUNCE, { x: this.x + this.size / 2, y: this.y + this.size / 2 });
  }

  public canWallJump(): boolean {
    return !this.isGrounded && this.wallGraceTimer > 0;
  }

  public canJump(): boolean {
    if (this.isDead) return false;
    if (this.isGrounded) return true;
    if (this.coyoteTimer > 0) return true;
    if (this.canWallJump()) return true;
    if (this.hasDoubleJump && this.jumpCount < 2) return true;
    return false;
  }

  public jump(): boolean {
    if (!this.canJump()) return false;

    if (!this.isGrounded && this.coyoteTimer <= 0 && this.canWallJump()) {
      const jumpForce = GAME_CONFIG.JUMP_IMPULSE * 1.04 * this.charDef.jumpMultiplier;
      this.vy = jumpForce;
      this.moveDir = this.wallSide === 'left' ? 1 : -1;
      this.vx = GAME_CONFIG.BASE_RUN_SPEED * this.charDef.speedMultiplier * this.moveDir * 1.15;
      this.wallGraceTimer = 0;
      this.isWallSliding = false;

      this.scaleX = 0.7;
      this.scaleY = 1.35;

      EventBus.getInstance().emit(Events.PLAYER_WALL_JUMP, {
        x: this.x + this.size / 2,
        y: this.y + this.size / 2,
        wallSide: this.wallSide
      });
      return true;
    }

    const isDouble = !this.isGrounded && this.coyoteTimer <= 0 && this.hasDoubleJump;
    const jumpForce = GAME_CONFIG.JUMP_IMPULSE * this.charDef.jumpMultiplier;
    this.vy = jumpForce;
    this.isGrounded = false;
    this.coyoteTimer = 0;
    this.currentPlatform = null;

    this.scaleX = 0.72;
    this.scaleY = 1.35;

    if (isDouble) {
      this.jumpCount = 2;
      this.hasDoubleJump = false; // Consumed
      EventBus.getInstance().emit(Events.PLAYER_DOUBLE_JUMP, { x: this.x + this.size / 2, y: this.y + this.size });
    } else {
      this.jumpCount = 1;
      EventBus.getInstance().emit(Events.PLAYER_JUMP, { x: this.x + this.size / 2, y: this.y + this.size });
    }

    return true;
  }

  public landOnPlatform(platform: Platform): void {
    const impactVy = this.vy;
    const impactRatio = Math.min(1, Math.max(0, impactVy / 900));

    this.isGrounded = true;
    this.currentPlatform = platform;
    this.y = platform.y - this.size;
    this.vy = 0;
    this.jumpCount = 0;
    this.wallGraceTimer = 0;
    this.isWallSliding = false;
    this.coyoteTimer = GAME_CONFIG.COYOTE_TIME + this.charDef.coyoteBonus;

    // Squash scales with how hard the landing was — a gentle hop barely
    // dents the sprite, a long fall really smacks it flat.
    this.scaleX = 1.0 + 0.5 * impactRatio;
    this.scaleY = 1.0 - 0.42 * impactRatio;

    platform.onPlayerLand();

    if (platform.isBouncy) {
      this.vy = GAME_CONFIG.JUMP_IMPULSE * 1.25 * this.charDef.jumpMultiplier;
      this.isGrounded = false;
      this.currentPlatform = null;
      this.scaleX = 0.65;
      this.scaleY = 1.45;
    }

    EventBus.getInstance().emit(Events.PLAYER_LAND, {
      x: this.x + this.size / 2,
      y: this.y + this.size,
      platform,
      impactRatio
    });
  }

  public triggerDeath(): void {
    if (this.isDead || this.isInvulnerable) return;

    if (this.hasShield) {
      this.hasShield = false;
      this.isInvulnerable = true;
      this.invulnerableTimer = 1.2;
      EventBus.getInstance().emit(Events.SHIELD_BROKEN, { x: this.x + this.size / 2, y: this.y + this.size / 2 });
      return;
    }

    this.isDead = true;
    this.isGrounded = false;
    this.currentPlatform = null;
    this.wallGraceTimer = 0;

    EventBus.getInstance().emit(Events.PLAYER_DEATH, {
      x: this.x + this.size / 2,
      y: this.y + this.size / 2,
      charDef: this.charDef
    });
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    if (this.isInvulnerable && Math.floor(this.animTimer * 16) % 2 === 0) {
      return;
    }

    ctx.save();

    const cx = Math.floor(this.x + this.size / 2);
    const cy = Math.floor(this.y + this.size / 2);

    ctx.translate(cx, cy);
    ctx.scale(this.scaleX, this.scaleY);

    const s = this.size;
    const half = Math.floor(s / 2);

    // Pixel Black Outline (2px border)
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(-half - 2, -half - 2, s + 4, s + 4);

    // Character Primary Body (Flat pixel box)
    ctx.fillStyle = this.charDef.primaryColor;
    ctx.fillRect(-half, -half, s, s);

    // Secondary Accent Lower Stripe (Pixel belt)
    ctx.fillStyle = this.charDef.secondaryColor;
    ctx.fillRect(-half, half - 8, s, 6);

    // Top Highlight Pixel Line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(-half + 2, -half + 2, s - 4, 3);

    // Pixel Eyes (Square 4x4 pixels)
    const eyeOffsetX = this.moveDir * 4;
    ctx.fillStyle = this.charDef.eyeColor;
    ctx.fillRect(-6 + eyeOffsetX, -4, 4, 5);
    ctx.fillRect(4 + eyeOffsetX, -4, 4, 5);

    // Pixel Pupil (Black 2x2)
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(-5 + eyeOffsetX + (this.moveDir > 0 ? 1 : 0), -3, 2, 3);
    ctx.fillRect(5 + eyeOffsetX + (this.moveDir > 0 ? 1 : 0), -3, 2, 3);

    // Pixel Accessories
    this.renderPixelAccessory(ctx, eyeOffsetX, half);

    // Pixel Shield Effect (Flashing 2px outer border)
    if (this.hasShield) {
      const shieldColor = Math.floor(this.animTimer * 8) % 2 === 0 ? '#4ecdc4' : '#ffffff';
      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-half - 5, -half - 5, s + 10, s + 10);
    }

    ctx.restore();
  }

  private renderPixelAccessory(ctx: CanvasRenderingContext2D, eyeOffsetX: number, half: number): void {
    const hat = this.charDef.hatType;
    if (!hat || hat === 'none') return;

    if (hat === 'ninja_band') {
      ctx.fillStyle = this.charDef.secondaryColor;
      ctx.fillRect(-half, -half + 4, this.size, 4);
      // Pixel headband tails
      const tailX = -this.moveDir * half;
      ctx.fillRect(tailX - this.moveDir * 4, -half + 5, 4, 3);
      ctx.fillRect(tailX - this.moveDir * 8, -half + 7, 4, 3);
    } else if (hat === 'crown') {
      ctx.fillStyle = '#f1c40f';
      // 3 pixel crown peaks
      ctx.fillRect(-9, -half - 8, 4, 8);
      ctx.fillRect(-2, -half - 10, 4, 10);
      ctx.fillRect(5, -half - 8, 4, 8);
      ctx.fillRect(-10, -half - 2, 20, 3);
    } else if (hat === 'visor') {
      ctx.fillStyle = this.charDef.eyeColor;
      ctx.fillRect(-half + 2 + eyeOffsetX, -5, this.size - 4, 6);
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(-half + 4 + eyeOffsetX, -4, this.size - 8, 2);
    } else if (hat === 'horns') {
      ctx.fillStyle = this.charDef.secondaryColor;
      ctx.fillRect(-10, -half - 6, 4, 6);
      ctx.fillRect(-8, -half - 9, 3, 4);
      ctx.fillRect(6, -half - 6, 4, 6);
      ctx.fillRect(5, -half - 9, 3, 4);
    } else if (hat === 'ears') {
      ctx.fillStyle = this.charDef.primaryColor;
      ctx.fillRect(-11, -half - 7, 6, 7);
      ctx.fillRect(-9, -half - 9, 3, 3);
      ctx.fillRect(5, -half - 7, 6, 7);
      ctx.fillRect(6, -half - 9, 3, 3);
      ctx.fillStyle = this.charDef.secondaryColor;
      ctx.fillRect(-9, -half - 5, 3, 4);
      ctx.fillRect(6, -half - 5, 3, 4);
    } else if (hat === 'halo') {
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-12, -half - 8, 24, 3);
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(-8, -half - 8, 16, 1);
    }
  }
}
