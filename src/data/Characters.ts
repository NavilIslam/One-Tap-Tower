export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  price: number;
  unlockedByDefault?: boolean;
  description: string;
  perkDescription: string;
  speedMultiplier: number;
  jumpMultiplier: number;
  gravityMultiplier: number;
  coyoteBonus: number;
  magnetBonus: number;
  luckyCoinChance: number;
  primaryColor: string;
  secondaryColor: string;
  eyeColor: string;
  outlineColor: string;
  hatType?: 'none' | 'ninja_band' | 'crown' | 'visor' | 'ears' | 'horns' | 'skull' | 'halo';
  trailType: 'pixel' | 'puff' | 'ember' | 'fade' | 'none';
}

const CHAR_DEFAULTS = {
  speedMultiplier: 1.0,
  jumpMultiplier: 1.0,
  gravityMultiplier: 1.0,
  coyoteBonus: 0,
  magnetBonus: 0,
  luckyCoinChance: 0,
};

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'classic',
    name: 'Classic',
    title: 'Arcade Hopper',
    price: 0,
    unlockedByDefault: true,
    description: 'The iconic pixel runner. Perfectly balanced.',
    perkDescription: 'Standard physics.',
    ...CHAR_DEFAULTS,
    primaryColor: '#4ecdc4',
    secondaryColor: '#2ea8a0',
    eyeColor: '#ffffff',
    outlineColor: '#2a7a74',
    hatType: 'none',
    trailType: 'pixel'
  },
  {
    id: 'robot',
    name: 'Bolt-8',
    title: 'Titan Mech',
    price: 150,
    description: 'Heavy titanium chassis.',
    perkDescription: 'Heavier descent for fast locking.',
    ...CHAR_DEFAULTS,
    jumpMultiplier: 1.02,
    gravityMultiplier: 1.08,
    primaryColor: '#8e9eab',
    secondaryColor: '#5a6a78',
    eyeColor: '#2ecc71',
    outlineColor: '#4a5a68',
    hatType: 'visor',
    trailType: 'puff'
  },
  {
    id: 'ninja',
    name: 'Kage',
    title: 'Shadow Shinobi',
    price: 350,
    description: 'Master of swift movement.',
    perkDescription: '+6% horizontal speed.',
    ...CHAR_DEFAULTS,
    speedMultiplier: 1.06,
    coyoteBonus: 0.02,
    primaryColor: '#2c3e50',
    secondaryColor: '#c0392b',
    eyeColor: '#e74c3c',
    outlineColor: '#1a252f',
    hatType: 'ninja_band',
    trailType: 'puff'
  },
  {
    id: 'alien',
    name: 'Zox',
    title: 'Cosmic Drifter',
    price: 600,
    description: 'Anti-gravity specialist.',
    perkDescription: '+5% jump height, floatier.',
    ...CHAR_DEFAULTS,
    speedMultiplier: 0.98,
    jumpMultiplier: 1.05,
    gravityMultiplier: 0.95,
    coyoteBonus: 0.02,
    primaryColor: '#2ecc71',
    secondaryColor: '#1abc9c',
    eyeColor: '#111111',
    outlineColor: '#1a8a4e',
    hatType: 'horns',
    trailType: 'pixel'
  },
  {
    id: 'cat',
    name: 'Mochi',
    title: 'Acrobatic Feline',
    price: 900,
    description: 'Always lands on four paws.',
    perkDescription: '+40ms coyote time.',
    ...CHAR_DEFAULTS,
    speedMultiplier: 1.02,
    coyoteBonus: 0.04,
    luckyCoinChance: 0.05,
    primaryColor: '#e88ca0',
    secondaryColor: '#d4708a',
    eyeColor: '#4a2040',
    outlineColor: '#a05a6a',
    hatType: 'ears',
    trailType: 'pixel'
  },
  {
    id: 'skeleton',
    name: 'Skully',
    title: 'Crypt Gambler',
    price: 1300,
    description: 'Reanimated bones, supernatural fortune.',
    perkDescription: '15% chance double coins.',
    ...CHAR_DEFAULTS,
    luckyCoinChance: 0.15,
    primaryColor: '#ecf0f1',
    secondaryColor: '#bdc3c7',
    eyeColor: '#2ecc71',
    outlineColor: '#95a5a6',
    hatType: 'skull',
    trailType: 'fade'
  },
  {
    id: 'frog',
    name: 'Hoppy',
    title: 'Lilypad Champion',
    price: 1800,
    description: 'Powerful leg springs.',
    perkDescription: 'Crisp bounce impulse.',
    ...CHAR_DEFAULTS,
    speedMultiplier: 1.03,
    jumpMultiplier: 1.03,
    gravityMultiplier: 1.02,
    coyoteBonus: 0.02,
    primaryColor: '#27ae60',
    secondaryColor: '#1abc9c',
    eyeColor: '#145a30',
    outlineColor: '#1a7a42',
    hatType: 'ears',
    trailType: 'pixel'
  },
  {
    id: 'king',
    name: 'Aurelius',
    title: 'Golden Monarch',
    price: 2500,
    description: 'Royalty with magnetized riches.',
    perkDescription: '+35% magnet radius.',
    ...CHAR_DEFAULTS,
    speedMultiplier: 0.99,
    magnetBonus: 50,
    luckyCoinChance: 0.10,
    primaryColor: '#e67e22',
    secondaryColor: '#f1c40f',
    eyeColor: '#3d2600',
    outlineColor: '#a05a10',
    hatType: 'crown',
    trailType: 'pixel'
  },
  {
    id: 'cyber',
    name: 'Glitch-X',
    title: 'Quantum Runner',
    price: 3500,
    description: 'Raw cyberspace code energy.',
    perkDescription: 'Power-ups last +20% longer.',
    ...CHAR_DEFAULTS,
    speedMultiplier: 1.04,
    jumpMultiplier: 1.02,
    coyoteBonus: 0.02,
    magnetBonus: 20,
    luckyCoinChance: 0.05,
    primaryColor: '#8e44ad',
    secondaryColor: '#3498db',
    eyeColor: '#ecf0f1',
    outlineColor: '#6a2e82',
    hatType: 'visor',
    trailType: 'pixel'
  },
  {
    id: 'shadow',
    name: 'Umbra',
    title: 'Void Wraith',
    price: 5000,
    description: 'Entity from the tower abyss.',
    perkDescription: 'Generous platform leeway.',
    ...CHAR_DEFAULTS,
    speedMultiplier: 1.05,
    jumpMultiplier: 1.04,
    gravityMultiplier: 0.98,
    coyoteBonus: 0.03,
    magnetBonus: 30,
    luckyCoinChance: 0.12,
    primaryColor: '#2c3e50',
    secondaryColor: '#7f8c8d',
    eyeColor: '#e74c3c',
    outlineColor: '#1a252f',
    hatType: 'halo',
    trailType: 'fade'
  }
];

export function getCharacterById(id: string): CharacterDef {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}
