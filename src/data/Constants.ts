export const GAME_CONFIG = {
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 854,

  TOWER_WIDTH: 420,
  FLOOR_HEIGHT: 120,
  WALL_THICKNESS: 30,

  PLAYER_SIZE: 32,
  BASE_RUN_SPEED: 210,
  JUMP_IMPULSE: -560,
  GRAVITY: 1350,
  FALL_GRAVITY_SCALE: 1.25,
  WALL_BOUNCE_FACTOR: 1.0,
  COYOTE_TIME: 0.15,           // 150ms generous grace period
  INPUT_BUFFER_TIME: 0.16,     // 160ms input buffer

  CAMERA_SMOOTHING: 0.12,
  CAMERA_LOOKAHEAD_Y: 280,

  MAX_ACTIVE_FLOORS: 18,
  FLOORS_PER_BIOME: 25,
  BOSS_FLOOR_INTERVAL: 25,
  MILESTONE_INTERVAL: 10,

  POWERUP_DURATIONS: {
    MAGNET: 8.0,
    SLOW_MO: 5.0,
    SPEED_BOOST: 5.0,
    DOUBLE_JUMP: 999.0,
    SHIELD: 999.0
  },
  MAGNET_RADIUS: 160,
  SLOW_MO_SCALE: 0.45,
  SPEED_BOOST_SCALE: 1.35,

  COIN_BASE_VALUE: 1,
  RISK_FLOOR_REWARD: 6,
  SAFE_FLOOR_REWARD: 1,
  MILESTONE_COIN_BONUS: 5,
  BOSS_COIN_BONUS: 15,

  COMBO_TIMEOUT: 2.8,
  COMBO_MAX_MULTIPLIER: 5,

  MAX_SHAKE_OFFSET: 14,
  SHAKE_DECAY: 0.88,

  STORAGE_KEY: 'ONE_TAP_TOWER_SAVE_V1',

  PIXEL_FONT: '"Press Start 2P", monospace',
  UI_FONT: '"Chakra Petch", "Press Start 2P", sans-serif'
};

export interface BiomeTheme {
  id: number;
  name: string;
  subname: string;
  bgColor: string;
  bgColorAlt: string;
  wallColor: string;
  brickColor: string;
  platformColor: string;
  accentColor: string;
  hazardColor: string;
  gridColor: string;
  particleColor: string;
  musicBpm: number;
}

export const BIOMES: BiomeTheme[] = [
  {
    id: 1,
    name: 'DUNGEON',
    subname: 'Floors 1 - 25',
    bgColor: '#1a1a2e',
    bgColorAlt: '#16213e',
    wallColor: '#2d2d44',
    brickColor: '#3a3a55',
    platformColor: '#4ecdc4',
    accentColor: '#f39c12',
    hazardColor: '#e74c3c',
    gridColor: '#222244',
    particleColor: '#4ecdc4',
    musicBpm: 124
  },
  {
    id: 2,
    name: 'CASTLE',
    subname: 'Floors 26 - 50',
    bgColor: '#2c1810',
    bgColorAlt: '#3d2417',
    wallColor: '#4a3728',
    brickColor: '#5c4a38',
    platformColor: '#e67e22',
    accentColor: '#3498db',
    hazardColor: '#c0392b',
    gridColor: '#3a2a1a',
    particleColor: '#e67e22',
    musicBpm: 130
  },
  {
    id: 3,
    name: 'SKY FORT',
    subname: 'Floors 51 - 75',
    bgColor: '#1a0a2e',
    bgColorAlt: '#250e40',
    wallColor: '#3d1f5c',
    brickColor: '#4e2e6e',
    platformColor: '#9b59b6',
    accentColor: '#1abc9c',
    hazardColor: '#e91e63',
    gridColor: '#2a1444',
    particleColor: '#9b59b6',
    musicBpm: 136
  },
  {
    id: 4,
    name: 'LAVA CORE',
    subname: 'Floors 76 - 100',
    bgColor: '#2e0a0a',
    bgColorAlt: '#3e1010',
    wallColor: '#5c1a1a',
    brickColor: '#6e2828',
    platformColor: '#e74c3c',
    accentColor: '#f1c40f',
    hazardColor: '#ff0033',
    gridColor: '#441414',
    particleColor: '#e74c3c',
    musicBpm: 142
  },
  {
    id: 5,
    name: 'VOID',
    subname: 'Floors 101+ (INSANE)',
    bgColor: '#0a1a1a',
    bgColorAlt: '#0e2424',
    wallColor: '#1a3a3a',
    brickColor: '#2a4a4a',
    platformColor: '#2ecc71',
    accentColor: '#ecf0f1',
    hazardColor: '#e91e63',
    gridColor: '#142a2a',
    particleColor: '#2ecc71',
    musicBpm: 150
  }
];
