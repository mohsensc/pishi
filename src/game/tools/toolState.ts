import type { ToolKind, Vec, World } from '../types'

export type JumpTool = 'treat' | 'wand'

interface ToolJump {
  tool: JumpTool
  checkAt: number
  checkUntil: number
  reachTop: number
  reachBottom: number
  resolved: boolean
}

export interface ToolMemory {
  wasPressed: boolean
  lastTool: ToolKind
  treatSerial: number
  catnipSerial: number
  featherScreen: Vec | null
  featherVelocity: Vec
  refillTimers: Map<string, number>
  seenPokes: Map<string, number | null>
  refillAt: number | null
  refillStationId: string | null
  wasNight: boolean | null
  fireflyTimer: number
  misses: Map<string, number>
  cooldowns: Map<string, number>
  petDwell: Map<string, number>
  jumps: Map<string, ToolJump>
  laserSeenAt: number
  laserLast: Vec | null
}

const toolMemories = new WeakMap<World, ToolMemory>()

function createToolMemory(): ToolMemory {
  return {
    wasPressed: false,
    lastTool: 'hand',
    treatSerial: 0,
    catnipSerial: 0,
    featherScreen: null,
    featherVelocity: { x: 0, y: 0 },
    refillTimers: new Map(),
    seenPokes: new Map(),
    refillAt: null,
    refillStationId: null,
    wasNight: null,
    fireflyTimer: 0,
    misses: new Map(),
    cooldowns: new Map(),
    petDwell: new Map(),
    jumps: new Map(),
    laserSeenAt: -Infinity,
    laserLast: null,
  }
}

export function toolMemoryOf(world: World): ToolMemory {
  let memory = toolMemories.get(world)
  if (!memory) {
    memory = createToolMemory()
    toolMemories.set(world, memory)
  }
  return memory
}

export function missesOf(world: World, catId: string): number {
  return toolMemoryOf(world).misses.get(catId) ?? 0
}

export function addMiss(world: World, catId: string): number {
  const memory = toolMemoryOf(world)
  const next = (memory.misses.get(catId) ?? 0) + 1
  memory.misses.set(catId, next)
  return next
}

export function clearMisses(world: World, catId: string): void {
  toolMemoryOf(world).misses.delete(catId)
}

export function coolDownTools(world: World, catId: string, seconds: number): void {
  toolMemoryOf(world).cooldowns.set(catId, world.time + seconds)
}

export function isToolCooling(world: World, catId: string): boolean {
  return (toolMemoryOf(world).cooldowns.get(catId) ?? -Infinity) > world.time
}
