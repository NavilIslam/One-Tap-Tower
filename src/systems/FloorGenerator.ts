import { GAME_CONFIG, BiomeTheme } from '../data/Constants.ts';
import { Platform } from '../entities/Platform.ts';
import { Hazard } from '../entities/Hazard.ts';
import { Enemy } from '../entities/Enemy.ts';
import { Coin } from '../entities/Coin.ts';
import { PowerUp, PowerUpType } from '../entities/PowerUp.ts';
import { DifficultyManager, FloorDifficultyProfile } from './DifficultyManager.ts';

export interface GeneratedFloor {
  floorNumber: number;
  y: number;
  platforms: Platform[];
  hazards: Hazard[];
  enemies: Enemy[];
  coins: Coin[];
  powerUps: PowerUp[];
  isBoss: boolean;
}

export class FloorGenerator {
  private rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
  }

  public setRng(rng: () => number): void {
    this.rng = rng;
  }

  public generateFloor(floorNumber: number, y: number, biome: BiomeTheme): GeneratedFloor {
    const diff = DifficultyManager.getInstance().getProfileForFloor(floorNumber);
    const isBoss = floorNumber > 0 && floorNumber % GAME_CONFIG.BOSS_FLOOR_INTERVAL === 0;

    const floor: GeneratedFloor = {
      floorNumber,
      y,
      platforms: [],
      hazards: [],
      enemies: [],
      coins: [],
      powerUps: [],
      isBoss
    };

    if (floorNumber === 0) {
      const ground = new Platform(0);
      ground.reset(
        0,
        GAME_CONFIG.WALL_THICKNESS,
        y,
        GAME_CONFIG.CANVAS_WIDTH - (GAME_CONFIG.WALL_THICKNESS * 2),
        'normal',
        biome.platformColor
      );
      floor.platforms.push(ground);
      return floor;
    }

    if (isBoss) {
      this.generateBossFloor(floor, biome);
      return floor;
    }

    const roll = this.rng();

    if (roll < diff.riskFloorChance && floorNumber >= 10) {
      this.generateRiskFloor(floor, biome, diff);
    } else if (roll < diff.riskFloorChance + 0.12 && floorNumber >= 15) {
      this.generateMultiPlatformFloor(floor, biome, diff);
    } else if (roll < diff.riskFloorChance + 0.22 && floorNumber >= 28 && diff.laserChance > 0) {
      this.generateLaserFloor(floor, biome, diff);
    } else if (roll < diff.riskFloorChance + 0.35 && floorNumber >= 38 && diff.enemyChance > 0) {
      this.generateEnemyFloor(floor, biome, diff);
    } else if (roll < diff.riskFloorChance + 0.50 && floorNumber >= 12 && diff.movingPlatformChance > 0) {
      this.generateMovingFloor(floor, biome, diff);
    } else if (roll < diff.riskFloorChance + 0.65 && floorNumber >= 20 && diff.fallingPlatformChance > 0) {
      this.generateFallingFloor(floor, biome, diff);
    } else if (roll < diff.riskFloorChance + 0.78 && floorNumber >= 15 && diff.spikeChance > 0) {
      this.generateSpikeFloor(floor, biome, diff);
    } else if (roll < diff.riskFloorChance + 0.88 && floorNumber >= 45) {
      this.generateNarrowFloor(floor, biome, diff);
    } else {
      this.generateNormalFloor(floor, biome, diff);
    }

    if (floor.powerUps.length === 0 && this.rng() < diff.powerupChance && floor.platforms.length > 0) {
      const p = floor.platforms[0];
      const types: PowerUpType[] = ['shield', 'double_jump', 'magnet', 'slow_mo', 'speed_boost'];
      const puType = types[Math.floor(this.rng() * types.length)];
      const pu = new PowerUp(floorNumber * 100);
      pu.reset(floorNumber * 100, p.x + p.width / 2, p.y - 28, puType);
      floor.powerUps.push(pu);
    }

    return floor;
  }

  private generateNormalFloor(floor: GeneratedFloor, biome: BiomeTheme, diff: FloorDifficultyProfile): void {
    const width = diff.platformWidth;
    const minX = GAME_CONFIG.WALL_THICKNESS + 20;
    const maxX = GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS - width - 20;
    const x = minX + this.rng() * Math.max(10, maxX - minX);

    const plat = new Platform(floor.floorNumber);
    plat.reset(floor.floorNumber, x, floor.y, width, 'normal', biome.platformColor);
    floor.platforms.push(plat);

    if (this.rng() < 0.40) {
      this.spawnCoinsOnPlatform(floor, plat, 1);
    }
  }

  private generateMovingFloor(floor: GeneratedFloor, biome: BiomeTheme, diff: FloorDifficultyProfile): void {
    const width = Math.max(70, diff.platformWidth - 15);
    const minX = GAME_CONFIG.WALL_THICKNESS + 10;
    const maxX = GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS - 10;
    const x = minX + this.rng() * (maxX - minX - width);

    const plat = new Platform(floor.floorNumber);
    plat.reset(
      floor.floorNumber,
      x,
      floor.y,
      width,
      'moving',
      biome.platformColor,
      diff.movingPlatformSpeed,
      minX,
      maxX
    );
    floor.platforms.push(plat);

    if (this.rng() < 0.45) {
      this.spawnCoinsOnPlatform(floor, plat, 1);
    }
  }

  private generateSpikeFloor(floor: GeneratedFloor, biome: BiomeTheme, diff: FloorDifficultyProfile): void {
    const width = diff.platformWidth + 20;
    const minX = GAME_CONFIG.WALL_THICKNESS + 20;
    const maxX = GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS - width - 20;
    const x = minX + this.rng() * Math.max(10, maxX - minX);

    const plat = new Platform(floor.floorNumber);
    plat.reset(floor.floorNumber, x, floor.y, width, 'normal', biome.platformColor);
    floor.platforms.push(plat);

    const spike = new Hazard(floor.floorNumber * 10);
    if (this.rng() > 0.5) {
      const side = this.rng() > 0.5 ? 'left' : 'right';
      const sx = side === 'left' ? GAME_CONFIG.WALL_THICKNESS : GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS - 20;
      spike.resetSpike(floor.floorNumber * 10, sx, floor.y - 10, 20, 20, true, side, biome.hazardColor);
    } else {
      const spikeW = Math.floor(width * 0.35);
      const spikeX = plat.x + (this.rng() > 0.5 ? 0 : width - spikeW);
      spike.resetSpike(floor.floorNumber * 10, spikeX, floor.y - 14, spikeW, 14, false, 'left', biome.hazardColor);
    }
    floor.hazards.push(spike);

    if (this.rng() < 0.30) {
      this.spawnCoinsOnPlatform(floor, plat, 1);
    }
  }

  private generateFallingFloor(floor: GeneratedFloor, _biome: BiomeTheme, diff: FloorDifficultyProfile): void {
    const width = diff.platformWidth;
    const minX = GAME_CONFIG.WALL_THICKNESS + 20;
    const maxX = GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS - width - 20;
    const x = minX + this.rng() * Math.max(10, maxX - minX);

    const plat = new Platform(floor.floorNumber);
    plat.reset(floor.floorNumber, x, floor.y, width, 'falling', '#e74c3c');
    floor.platforms.push(plat);

    if (this.rng() < 0.35) {
      this.spawnCoinsOnPlatform(floor, plat, 1);
    }
  }

  private generateLaserFloor(floor: GeneratedFloor, biome: BiomeTheme, diff: FloorDifficultyProfile): void {
    const width = diff.platformWidth;
    const x = (GAME_CONFIG.CANVAS_WIDTH - width) / 2;

    const plat = new Platform(floor.floorNumber);
    plat.reset(floor.floorNumber, x, floor.y, width, 'normal', biome.platformColor);
    floor.platforms.push(plat);

    const laser = new Hazard(floor.floorNumber * 10);
    laser.resetLaser(
      floor.floorNumber * 10,
      GAME_CONFIG.WALL_THICKNESS,
      floor.y - 45,
      GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS * 2,
      1.1,
      0.9,
      1.4,
      this.rng() * 2
    );
    floor.hazards.push(laser);

    if (this.rng() < 0.40) {
      this.spawnCoinsOnPlatform(floor, plat, 1);
    }
  }

  private generateNarrowFloor(floor: GeneratedFloor, _biome: BiomeTheme, _diff: FloorDifficultyProfile): void {
    const width = 60;
    const minX = GAME_CONFIG.WALL_THICKNESS + 30;
    const maxX = GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS - width - 30;
    const x = minX + this.rng() * (maxX - minX);

    const plat = new Platform(floor.floorNumber);
    plat.reset(floor.floorNumber, x, floor.y, width, 'normal', '#f1c40f');
    floor.platforms.push(plat);

    if (this.rng() < 0.50) {
      this.spawnCoinsOnPlatform(floor, plat, 1);
    }
  }

  private generateMultiPlatformFloor(floor: GeneratedFloor, biome: BiomeTheme, _diff: FloorDifficultyProfile): void {
    const pWidth = 80;
    const plat1 = new Platform(floor.floorNumber);
    plat1.reset(floor.floorNumber, 60, floor.y, pWidth, 'normal', biome.platformColor);

    const plat2 = new Platform(floor.floorNumber + 5000);
    plat2.reset(floor.floorNumber + 5000, GAME_CONFIG.CANVAS_WIDTH - 60 - pWidth, floor.y - 12, pWidth, 'bouncy', '#f1c40f');

    floor.platforms.push(plat1, plat2);

    if (this.rng() < 0.45) {
      this.spawnCoinsOnPlatform(floor, plat2, 1);
    }
  }

  private generateEnemyFloor(floor: GeneratedFloor, biome: BiomeTheme, diff: FloorDifficultyProfile): void {
    const width = diff.platformWidth + 40;
    const minX = GAME_CONFIG.WALL_THICKNESS + 15;
    const maxX = GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS - width - 15;
    const x = minX + this.rng() * Math.max(10, maxX - minX);

    const plat = new Platform(floor.floorNumber);
    plat.reset(floor.floorNumber, x, floor.y, width, 'normal', biome.platformColor);
    floor.platforms.push(plat);

    const enemy = new Enemy(floor.floorNumber * 10);
    enemy.reset(
      floor.floorNumber * 10,
      x + 10,
      floor.y - 42,
      'drone',
      120,
      x,
      x + width,
      biome.accentColor
    );
    floor.enemies.push(enemy);

    if (this.rng() < 0.40) {
      this.spawnCoinsOnPlatform(floor, plat, 1);
    }
  }

  private generateRiskFloor(floor: GeneratedFloor, biome: BiomeTheme, _diff: FloorDifficultyProfile): void {
    const safePlat = new Platform(floor.floorNumber);
    safePlat.reset(floor.floorNumber, 45, floor.y, 110, 'risk_choice', '#2ecc71');
    safePlat.isRiskPlatform = true;
    safePlat.riskTag = 'SAFE';
    floor.platforms.push(safePlat);

    const riskPlat = new Platform(floor.floorNumber + 5000);
    riskPlat.reset(floor.floorNumber + 5000, GAME_CONFIG.CANVAS_WIDTH - 155, floor.y - 10, 65, 'risk_choice', '#e74c3c');
    riskPlat.isRiskPlatform = true;
    riskPlat.riskTag = 'RISK';
    floor.platforms.push(riskPlat);

    const spike = new Hazard(floor.floorNumber * 10);
    spike.resetSpike(floor.floorNumber * 10, riskPlat.x - 24, floor.y - 20, 20, 20, false, 'left', biome.hazardColor);
    floor.hazards.push(spike);

    for (let i = 0; i < 2; i++) {
      const cRisk = new Coin(floor.floorNumber * 10 + i + 1);
      cRisk.reset(floor.floorNumber * 10 + i + 1, riskPlat.x + 18 + i * 20, riskPlat.y - 24, 1);
      floor.coins.push(cRisk);
    }
  }

  private generateBossFloor(floor: GeneratedFloor, _biome: BiomeTheme): void {
    const bossType = (floor.floorNumber / GAME_CONFIG.BOSS_FLOOR_INTERVAL) % 4;

    const centerPlat = new Platform(floor.floorNumber);
    centerPlat.reset(
      floor.floorNumber,
      (GAME_CONFIG.CANVAS_WIDTH - 160) / 2,
      floor.y,
      160,
      'bouncy',
      '#f1c40f'
    );
    floor.platforms.push(centerPlat);

    if (bossType === 1) {
      const saw = new Hazard(floor.floorNumber * 10);
      saw.resetSaw(
        floor.floorNumber * 10,
        GAME_CONFIG.CANVAS_WIDTH / 2,
        floor.y - 55,
        30,
        140,
        70,
        410
      );
      floor.hazards.push(saw);
    } else if (bossType === 2) {
      const laser1 = new Hazard(floor.floorNumber * 10);
      laser1.resetLaser(
        floor.floorNumber * 10,
        GAME_CONFIG.WALL_THICKNESS,
        floor.y - 30,
        GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.WALL_THICKNESS * 2,
        0.9,
        0.8,
        1.1,
        0
      );
      floor.hazards.push(laser1);
    } else {
      const enemy1 = new Enemy(floor.floorNumber * 10);
      enemy1.reset(floor.floorNumber * 10, 80, floor.y - 45, 'drone', 140, 50, 430, '#e74c3c');
      floor.enemies.push(enemy1);
    }

    for (let i = 0; i < 3; i++) {
      const c = new Coin(floor.floorNumber * 10 + i);
      c.reset(floor.floorNumber * 10 + i, centerPlat.x + 35 + i * 36, centerPlat.y - 32, 1);
      floor.coins.push(c);
    }
  }

  private spawnCoinsOnPlatform(floor: GeneratedFloor, plat: Platform, count: number): void {
    const spacing = plat.width / (count + 1);
    for (let i = 0; i < count; i++) {
      const cx = plat.x + spacing * (i + 1);
      const cy = plat.y - 20;
      const coin = new Coin(floor.floorNumber * 10 + i);
      coin.reset(floor.floorNumber * 10 + i, cx, cy, 1);
      floor.coins.push(coin);
    }
  }
}
