import { createSeededRandom, hashString } from '../../game/random'

export type RandomSource = () => number

export function between(random: RandomSource, minimum: number, maximum: number): number {
  return minimum + random() * (maximum - minimum)
}

export function pickFrom<Item>(random: RandomSource, items: readonly Item[]): Item {
  return items[Math.floor(random() * items.length) % items.length]
}

export function scaledCount(base: number, intensity: number, minimum = 2): number {
  return Math.max(minimum, Math.round(base * Math.min(1.6, Math.max(0.3, intensity))))
}

export function buildParticles<Particle>(
  effectId: string,
  count: number,
  build: (random: RandomSource, index: number) => Particle,
  salt = 0,
): Particle[] {
  const random = createSeededRandom(hashString(effectId) + salt)
  return Array.from({ length: count }, (_, index) => build(random, index))
}
