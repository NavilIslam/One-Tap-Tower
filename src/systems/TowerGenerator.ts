import { GAME_CONFIG } from '../data/Constants.ts';
import { BiomeManager } from './BiomeManager.ts';
import { FloorGenerator, GeneratedFloor } from './FloorGenerator.ts';

export class TowerGenerator {
  private static instance: TowerGenerator;
  private floorGenerator: FloorGenerator;
  private activeFloors: GeneratedFloor[] = [];
  private highestGeneratedFloor = 0;
  private currentY = 720;

  private constructor() {
    this.floorGenerator = new FloorGenerator();
  }

  public static getInstance(): TowerGenerator {
    if (!TowerGenerator.instance) {
      TowerGenerator.instance = new TowerGenerator();
    }
    return TowerGenerator.instance;
  }

  public setRng(rng: () => number): void {
    this.floorGenerator.setRng(rng);
  }

  public reset(rng: () => number = Math.random): void {
    this.floorGenerator.setRng(rng);
    this.activeFloors = [];
    this.highestGeneratedFloor = 0;
    this.currentY = 720;

    for (let i = 0; i <= 12; i++) {
      this.generateNextFloor();
    }
  }

  private generateNextFloor(): void {
    const floorNum = this.highestGeneratedFloor;
    const biome = BiomeManager.getInstance().getCurrentBiome();

    const floor = this.floorGenerator.generateFloor(floorNum, this.currentY, biome);
    this.activeFloors.push(floor);

    this.highestGeneratedFloor++;
    this.currentY -= GAME_CONFIG.FLOOR_HEIGHT;
  }

  public update(cameraY: number): void {
    const spawnThresholdY = cameraY - 400;
    while (this.currentY > spawnThresholdY) {
      this.generateNextFloor();
    }

    const cleanupThresholdY = cameraY + GAME_CONFIG.CANVAS_HEIGHT + 250;
    this.activeFloors = this.activeFloors.filter(floor => floor.y < cleanupThresholdY);
  }

  public getActiveFloors(): GeneratedFloor[] {
    return this.activeFloors;
  }

  public getFloorByNumber(floorNumber: number): GeneratedFloor | undefined {
    return this.activeFloors.find(f => f.floorNumber === floorNumber);
  }
}

