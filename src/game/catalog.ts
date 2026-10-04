import type { Random } from './random'
import type { CatBreed, CatCoat } from './types'

export interface BreedProfile {
  maxSpeed: number
  acceleration: number
  jumpPower: number
  fleeRadius: number
  laziness: number
  boldness: number
  zoominess: number
  curiosity: number
  climbLevels: number
  spookResistance: number
}

export interface Personality extends BreedProfile {
  breed: CatBreed
  seed: number
}

interface CatProfile {
  name: string
  coat: CatCoat
  personality: Personality
}

export const breedProfiles: Record<CatBreed, BreedProfile> = {
  tuxedo: {
    maxSpeed: 250,
    acceleration: 950,
    jumpPower: 1,
    fleeRadius: 150,
    laziness: 0.3,
    boldness: 0.55,
    zoominess: 0.45,
    curiosity: 0.55,
    climbLevels: 3,
    spookResistance: 0.35,
  },
  munchkin: {
    maxSpeed: 200,
    acceleration: 1500,
    jumpPower: 0.62,
    fleeRadius: 135,
    laziness: 0.25,
    boldness: 0.6,
    zoominess: 0.65,
    curiosity: 0.6,
    climbLevels: 2,
    spookResistance: 0.3,
  },
  persian: {
    maxSpeed: 165,
    acceleration: 620,
    jumpPower: 0.72,
    fleeRadius: 100,
    laziness: 0.78,
    boldness: 0.45,
    zoominess: 0.12,
    curiosity: 0.3,
    climbLevels: 2,
    spookResistance: 0.8,
  },
  egyptianMau: {
    maxSpeed: 320,
    acceleration: 1150,
    jumpPower: 1.4,
    fleeRadius: 175,
    laziness: 0.15,
    boldness: 0.5,
    zoominess: 0.7,
    curiosity: 0.75,
    climbLevels: 3,
    spookResistance: 0.2,
  },
}

interface RosterEntry {
  name: string
  breed: CatBreed
  look: 'tuxedo' | 'ginger' | 'cream' | 'silver' | 'white' | 'bronze' | 'silverSpotted'
}

const roster: RosterEntry[] = [
  { name: 'Oreo', breed: 'tuxedo', look: 'tuxedo' },
  { name: 'Biscuit', breed: 'munchkin', look: 'ginger' },
  { name: 'Duchess', breed: 'persian', look: 'cream' },
  { name: 'Cleo', breed: 'egyptianMau', look: 'silverSpotted' },
  { name: 'Tux', breed: 'tuxedo', look: 'tuxedo' },
  { name: 'Pepper', breed: 'munchkin', look: 'tuxedo' },
  { name: 'Domino', breed: 'tuxedo', look: 'tuxedo' },
  { name: 'Sylvester', breed: 'tuxedo', look: 'tuxedo' },
  { name: 'Mochi', breed: 'persian', look: 'silver' },
  { name: 'Ramses', breed: 'egyptianMau', look: 'bronze' },
  { name: 'Penguin', breed: 'tuxedo', look: 'tuxedo' },
  { name: 'Figaro', breed: 'tuxedo', look: 'tuxedo' },
  { name: 'Nugget', breed: 'munchkin', look: 'ginger' },
  { name: 'Snowball', breed: 'persian', look: 'white' },
  { name: 'Nefertiti', breed: 'egyptianMau', look: 'silverSpotted' },
  { name: 'Bandit', breed: 'tuxedo', look: 'tuxedo' },
]

const tuxedoEyes = ['#c9d64b', '#b4cf3c', '#dcc84a', '#a9c94a']

function randomSocks(random: Random, probability: number): [boolean, boolean, boolean, boolean] {
  return [random.chance(probability), random.chance(probability), random.chance(probability), random.chance(probability)]
}

function createCoat(entry: RosterEntry, random: Random, sizeScale: number): CatCoat {
  const jitter = random.range(0.95, 1.05)
  if (entry.breed === 'persian') {
    const palette =
      entry.look === 'silver'
        ? { baseColor: '#b8bcc4', patchColor: '#e9eaee', spotColor: '#8d929b' }
        : entry.look === 'white'
          ? { baseColor: '#f6f3ee', patchColor: '#ffffff', spotColor: '#e4ddd2' }
          : { baseColor: '#ecdcbc', patchColor: '#f8f0e0', spotColor: '#d7c29a' }
    return {
      breed: 'persian',
      pattern: entry.look === 'silver' ? 'bicolor' : 'solid',
      ...palette,
      eyeColor: entry.look === 'silver' ? '#d9822b' : random.chance(0.5) ? '#5b9fd8' : '#d0782c',
      fluffiness: random.range(0.9, 1),
      legLength: 0.78,
      whiteBib: entry.look === 'silver' ? 0.5 : 0,
      whiteSocks: [false, false, false, false],
      whiteMuzzle: entry.look === 'silver',
      tailTip: false,
      earNotch: false,
      scale: 1.08 * jitter * sizeScale,
    }
  }
  if (entry.breed === 'egyptianMau') {
    const bronze = entry.look === 'bronze'
    return {
      breed: 'egyptianMau',
      pattern: 'spotted',
      baseColor: bronze ? '#c29563' : '#c8c7c0',
      patchColor: bronze ? '#e3c49a' : '#e6e5df',
      spotColor: bronze ? '#5b3a1f' : '#3d3c3a',
      eyeColor: '#9ccf45',
      fluffiness: 0.08,
      legLength: 1.16,
      whiteBib: 0,
      whiteSocks: [false, false, false, false],
      whiteMuzzle: false,
      tailTip: true,
      earNotch: false,
      scale: 1 * jitter * sizeScale,
    }
  }
  if (entry.look === 'ginger') {
    return {
      breed: entry.breed,
      pattern: random.chance(0.5) ? 'solid' : 'bicolor',
      baseColor: '#d98b3f',
      patchColor: '#f4e2c6',
      spotColor: '#b76a28',
      eyeColor: '#d8a53a',
      fluffiness: 0.3,
      legLength: entry.breed === 'munchkin' ? 0.5 : 1,
      whiteBib: 0.45,
      whiteSocks: randomSocks(random, 0.4),
      whiteMuzzle: random.chance(0.5),
      tailTip: false,
      earNotch: random.chance(0.2),
      scale: (entry.breed === 'munchkin' ? 0.92 : 1) * jitter * sizeScale,
    }
  }
  return {
    breed: entry.breed,
    pattern: 'tuxedo',
    baseColor: random.pick(['#1c1c21', '#202026', '#18181c']),
    patchColor: '#f7f4ee',
    spotColor: '#1c1c21',
    eyeColor: random.pick(tuxedoEyes),
    fluffiness: random.range(0.15, 0.35),
    legLength: entry.breed === 'munchkin' ? 0.5 : random.range(0.95, 1.05),
    whiteBib: random.range(0.55, 1),
    whiteSocks: randomSocks(random, 0.7),
    whiteMuzzle: random.chance(0.8),
    tailTip: random.chance(0.35),
    earNotch: random.chance(0.15),
    scale: (entry.breed === 'munchkin' ? 0.92 : 1) * jitter * sizeScale,
  }
}

function createPersonality(breed: CatBreed, random: Random): Personality {
  const base = breedProfiles[breed]
  const vary = (value: number, spread: number) => Math.max(0.02, Math.min(1, value + random.range(-spread, spread)))
  return {
    ...base,
    breed,
    seed: random.next(),
    maxSpeed: base.maxSpeed * random.range(0.94, 1.06),
    fleeRadius: base.fleeRadius * random.range(0.9, 1.1),
    laziness: vary(base.laziness, 0.12),
    boldness: vary(base.boldness, 0.3),
    zoominess: vary(base.zoominess, 0.2),
    curiosity: vary(base.curiosity, 0.2),
  }
}

export function createCatProfiles(count: number, random: Random, sizeScale: number): CatProfile[] {
  return Array.from({ length: count }, (_, index) => {
    const entry = roster[index % roster.length]
    const suffix = index >= roster.length ? ` ${Math.floor(index / roster.length) + 1}` : ''
    return {
      name: `${entry.name}${suffix}`,
      coat: createCoat(entry, random, sizeScale),
      personality: createPersonality(entry.breed, random),
    }
  })
}
