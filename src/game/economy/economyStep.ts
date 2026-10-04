import { isDragging } from '../dragging'
import type { StepContext } from '../memory'
import { needRecordOf } from '../needs/needState'
import { wakeNaturally } from '../needs/sleepControl'
import type { CatState, World } from '../types'
import { MIN_AWAKE_CATS } from './economyConstants'
import { pruneSupplyBalls } from './minting'

const wakeGapSeconds = 6
const lastFloorWakes = new WeakMap<World, number>()

function awakeVisibleCount(world: World): number {
  return world.cats.filter((cat) => !cat.hidden && !cat.asleep).length
}

function longestNapper(context: StepContext): CatState | null {
  const { world } = context
  let chosen: CatState | null = null
  let soonest = Number.POSITIVE_INFINITY
  for (const cat of world.cats) {
    if (!cat.asleep || cat.hidden || isDragging(world, 'cat', cat.id)) continue
    const remaining = needRecordOf(context, cat).napEndsAt - world.time
    if (remaining < soonest) {
      soonest = remaining
      chosen = cat
    }
  }
  return chosen
}

function keepCatsAwake(context: StepContext): void {
  const { world } = context
  const visible = world.cats.filter((cat) => !cat.hidden).length
  if (awakeVisibleCount(world) >= Math.min(MIN_AWAKE_CATS, visible)) return
  const last = lastFloorWakes.get(world)
  if (last !== undefined && world.time - last < wakeGapSeconds && world.time >= last) return
  const sleeper = longestNapper(context)
  if (!sleeper) return
  wakeNaturally(sleeper, context)
  lastFloorWakes.set(world, world.time)
}

export function stepEconomy(context: StepContext): void {
  keepCatsAwake(context)
  pruneSupplyBalls(context.world)
}
