import { behaviorLibrary } from './ai/registry'
import { lawnBounds, viewportScale } from './bounds'
import { breedProfiles } from './catalog'
import { WORLD_SEED } from './constants'
import { createMind, type EngineMemory, type StepContext } from './memory'
import { createIdlePointer } from './pointer'
import { createRandom } from './random'
import type { PointerState, World } from './types'

const engineMemory = new WeakMap<World, EngineMemory>()

export function registerMemory(world: World, memory: EngineMemory): void {
  engineMemory.set(world, memory)
}

export function idleContext(world: World, memory: EngineMemory, pointer: PointerState = createIdlePointer()): StepContext {
  return {
    world,
    memory,
    dt: 0,
    pointer,
    bounds: lawnBounds(world.width, world.height),
    library: behaviorLibrary,
  }
}

export function createMemory(seed: number, width: number, height: number): EngineMemory {
  const sizeScale = viewportScale(width, height)
  return {
    random: createRandom(seed),
    minds: new Map(),
    stashes: new Map(),
    popSerial: 0,
    ballSerial: 0,
    lastPointer: createIdlePointer(),
    sizeScale,
    speedScale: Math.pow(sizeScale, 0.7),
  }
}

export function memoryFor(world: World): EngineMemory {
  let memory = engineMemory.get(world)
  if (!memory) {
    memory = createMemory(WORLD_SEED, world.width, world.height)
    const { random, minds } = memory
    world.cats.forEach((cat) => {
      minds.set(cat.id, createMind({ ...breedProfiles[cat.coat.breed], breed: cat.coat.breed, seed: random.next() }))
    })
    engineMemory.set(world, memory)
  }
  return memory
}

export function interactionContext(world: World): StepContext {
  const memory = memoryFor(world)
  return idleContext(world, memory, memory.lastPointer)
}
