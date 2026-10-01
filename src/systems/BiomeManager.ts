import { BIOMES, BiomeTheme, GAME_CONFIG } from '../data/Constants.ts';
import { EventBus, Events } from '../core/EventBus.ts';

interface AmbientParticle {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
}

export class BiomeManager {
  private static instance: BiomeManager;
  private currentBiome = BIOMES[0];
  private previousBiomeId = 1;
  private ambientParticles: AmbientParticle[] = [];
  private gridOffset = 0;

  private constructor() {
    this.initAmbientParticles();
  }

  public static getInstance(): BiomeManager {
    if (!BiomeManager.instance) {
      BiomeManager.instance = new BiomeManager();
    }
    return BiomeManager.instance;
  }

  private initAmbientParticles(): void {
    this.ambientParticles = [];
    for (let i = 0; i < 20; i++) {
      this.ambientParticles.push({
        x: Math.floor(Math.random() * GAME_CONFIG.CANVAS_WIDTH),
        y: Math.floor(Math.random() * GAME_CONFIG.CANVAS_HEIGHT),
        speed: 15 + Math.random() * 30,
        size: Math.random() > 0.5 ? 2 : 4,
        alpha: 0.3 + Math.random() * 0.4
      });
    }
  }

  public updateForFloor(floor: number): void {
    const cycle = Math.floor((Math.max(1, floor) - 1) / GAME_CONFIG.FLOORS_PER_BIOME);
    const biomeIndex = cycle % BIOMES.length;
    const baseBiome = BIOMES[biomeIndex];

    const cycleSuffix = cycle > 0 ? ` ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][cycle] || `+${cycle}`}` : '';
    const newBiome: BiomeTheme = {
      ...baseBiome,
      name: `${baseBiome.name}${cycleSuffix}`,
      subname: `Floor ${floor}`
    };

    if (baseBiome.id !== this.previousBiomeId || cycle > 0) {
      this.currentBiome = newBiome;
      this.previousBiomeId = baseBiome.id;
      EventBus.getInstance().emit(Events.BIOME_CHANGED, newBiome);
    }
  }

  public getCurrentBiome(): BiomeTheme {
    return this.currentBiome;
  }

  public update(dt: number, cameraY: number): void {
    this.ambientParticles.forEach(p => {
      p.y -= p.speed * dt;
      if (p.y < 0) {
        p.y = GAME_CONFIG.CANVAS_HEIGHT;
        p.x = Math.floor(Math.random() * GAME_CONFIG.CANVAS_WIDTH);
      }
    });

    this.gridOffset = Math.floor((-cameraY * 0.5) % 32);
  }

  public renderBackground(ctx: CanvasRenderingContext2D): void {
    const w = GAME_CONFIG.CANVAS_WIDTH;
    const h = GAME_CONFIG.CANVAS_HEIGHT;

    // Solid flat background
    ctx.fillStyle = this.currentBiome.bgColor;
    ctx.fillRect(0, 0, w, h);

    // Retro Pixel Dot Grid
    ctx.fillStyle = this.currentBiome.gridColor;
    const step = 32;
    const startY = this.gridOffset - step;
    for (let y = startY; y < h + step; y += step) {
      for (let x = GAME_CONFIG.WALL_THICKNESS + 16; x < w - GAME_CONFIG.WALL_THICKNESS; x += step) {
        ctx.fillRect(x, Math.floor(y), 2, 2);
      }
    }

    // Ambient floating pixel dust squares
    ctx.fillStyle = this.currentBiome.particleColor;
    this.ambientParticles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    });
    ctx.globalAlpha = 1.0;
  }

  public renderWalls(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const w = GAME_CONFIG.CANVAS_WIDTH;
    const h = GAME_CONFIG.CANVAS_HEIGHT;
    const wallW = GAME_CONFIG.WALL_THICKNESS;

    ctx.save();

    // Solid base wall fill
    ctx.fillStyle = this.currentBiome.wallColor;
    ctx.fillRect(0, 0, wallW, h);
    ctx.fillRect(w - wallW, 0, wallW, h);

    // Retro Brick Texture on Left & Right Walls
    const brickH = 14;
    const brickW = wallW - 4;
    const scrollY = Math.floor((-cameraY) % (brickH * 2));

    ctx.fillStyle = this.currentBiome.brickColor;
    for (let y = scrollY - brickH * 2; y < h + brickH * 2; y += brickH) {
      const rowIndex = Math.floor(y / brickH);
      const isAlt = Math.abs(rowIndex) % 2 === 1;

      // Left Wall Bricks
      if (isAlt) {
        ctx.fillRect(2, y + 2, brickW, brickH - 4);
      } else {
        ctx.fillRect(2, y + 2, (brickW / 2) - 2, brickH - 4);
        ctx.fillRect((brickW / 2) + 2, y + 2, (brickW / 2) - 2, brickH - 4);
      }

      // Right Wall Bricks
      const rightX = w - wallW + 2;
      if (isAlt) {
        ctx.fillRect(rightX, y + 2, brickW, brickH - 4);
      } else {
        ctx.fillRect(rightX, y + 2, (brickW / 2) - 2, brickH - 4);
        ctx.fillRect(rightX + (brickW / 2) + 2, y + 2, (brickW / 2) - 2, brickH - 4);
      }
    }

    // 2px Solid Inner Wall Border
    ctx.fillStyle = this.currentBiome.platformColor;
    ctx.fillRect(wallW - 2, 0, 2, h);
    ctx.fillRect(w - wallW, 0, 2, h);

    // Retro Rivets / Wall Accents
    ctx.fillStyle = this.currentBiome.accentColor;
    const rivetSpacing = 48;
    const rivetOffset = Math.floor((-cameraY * 0.7) % rivetSpacing);
    for (let y = rivetOffset - rivetSpacing; y < h + rivetSpacing; y += rivetSpacing) {
      ctx.fillRect(wallW - 6, Math.floor(y), 4, 4);
      ctx.fillRect(w - wallW + 2, Math.floor(y), 4, 4);
    }

    ctx.restore();
  }
}
