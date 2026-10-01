export interface FloorDifficultyProfile {
  platformWidth: number;
  movingPlatformChance: number;
  movingPlatformSpeed: number;
  fallingPlatformChance: number;
  spikeChance: number;
  laserChance: number;
  enemyChance: number;
  riskFloorChance: number;
  powerupChance: number;
}

export class DifficultyManager {
  private static instance: DifficultyManager;

  private constructor() {}

  public static getInstance(): DifficultyManager {
    if (!DifficultyManager.instance) {
      DifficultyManager.instance = new DifficultyManager();
    }
    return DifficultyManager.instance;
  }

  public getProfileForFloor(floor: number): FloorDifficultyProfile {
    // 1. Platform Width: Generous 260px on floor 1, scaling down gradually to 85px for endless high floors
    let width: number;
    if (floor <= 10) {
      width = 260 - (floor - 1) * 4;           // Fl 1-10: 260px -> 224px (super wide & forgiving)
    } else if (floor <= 30) {
      width = 224 - (floor - 10) * 3;          // Fl 11-30: 224px -> 164px (comfortable arcade)
    } else if (floor <= 70) {
      width = 164 - (floor - 30) * 1.25;       // Fl 31-70: 164px -> 114px (moderate challenge)
    } else {
      width = Math.max(85, 114 - (floor - 70) * 0.35); // Fl 71+: 114px -> 85px (endless precision)
    }
    const platformWidth = Math.round(width);

    // 2. Moving Platforms: None before floor 12, slow start, scaling smoothly
    const movingPlatformChance = floor < 12 ? 0 : Math.min(0.45, 0.08 + (floor - 12) * 0.007);
    const movingPlatformSpeed = Math.round(Math.min(150, 45 + Math.max(0, floor - 12) * 1.3));

    // 3. Falling Platforms: None before floor 20
    const fallingPlatformChance = floor < 20 ? 0 : Math.min(0.28, 0.06 + (floor - 20) * 0.005);

    // 4. Spikes: None before floor 15, mild introduction
    const spikeChance = floor < 15 ? 0 : Math.min(0.38, 0.08 + (floor - 15) * 0.006);

    // 5. Lasers: None before floor 28
    const laserChance = floor < 28 ? 0 : Math.min(0.24, 0.05 + (floor - 28) * 0.004);

    // 6. Enemies (Drones): None before floor 38
    const enemyChance = floor < 38 ? 0 : Math.min(0.26, 0.06 + (floor - 38) * 0.004);

    // 7. Risk vs Reward Floors: Starts at floor 10
    const riskFloorChance = floor < 10 ? 0 : 0.12;

    // 8. Power-ups: High on early floors (25%) for shields & jumps, settling to 16% later
    const powerupChance = floor <= 15 ? 0.25 : 0.16;

    return {
      platformWidth,
      movingPlatformChance,
      movingPlatformSpeed,
      fallingPlatformChance,
      spikeChance,
      laserChance,
      enemyChance,
      riskFloorChance,
      powerupChance
    };
  }
}
