export interface Random {
  next: () => number
  range: (minimum: number, maximum: number) => number
  integer: (minimum: number, maximum: number) => number
  chance: (probability: number) => boolean
  pick: <Item>(items: readonly Item[]) => Item
  sign: () => 1 | -1
}

type RandomSource = () => number

export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = state
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

export function randomBetween(random: RandomSource, minimum: number, maximum: number): number {
  return minimum + random() * (maximum - minimum)
}

export function createRandom(seed: number): Random {
  const next = createSeededRandom(seed >>> 0 || 0x9e3779b9)
  return {
    next,
    range: (minimum, maximum) => minimum + (maximum - minimum) * next(),
    integer: (minimum, maximum) => Math.floor(minimum + (maximum - minimum + 1) * next()),
    chance: (probability) => next() < probability,
    pick: (items) => items[Math.floor(next() * items.length) % items.length],
    sign: () => (next() < 0.5 ? -1 : 1),
  }
}

export function hashString(text: string): number {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function hashToUnit(text: string): number {
  return hashString(text) / 4294967295
}
