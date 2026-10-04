import type { PropKind, Vec, World } from '../types'

export interface KnownProp {
  kind: PropKind
  position: Vec
  radius: number
}

export interface ShopItemMemory {
  known: Map<string, KnownProp>
  dropping: Set<string>
  nextButterflyAt: Map<string, number>
  releasedButterflies: Map<string, string[]>
  birdsBack: Map<string, number>
  soakedUntil: Map<string, number>
  nextBubbleAt: Map<string, number>
}

const memories = new WeakMap<World, ShopItemMemory>()

export function shopItemMemoryOf(world: World): ShopItemMemory {
  let memory = memories.get(world)
  if (!memory) {
    memory = {
      known: new Map(),
      dropping: new Set(),
      nextButterflyAt: new Map(),
      releasedButterflies: new Map(),
      birdsBack: new Map(),
      soakedUntil: new Map(),
      nextBubbleAt: new Map(),
    }
    memories.set(world, memory)
  }
  return memory
}
