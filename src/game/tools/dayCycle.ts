import { DAY_LENGTH_SECONDS } from '../constants'
import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import type { World } from '../types'
import { FIREFLY_INTERVAL } from './toolConstants'
import { toolMemoryOf } from './toolState'

function nightAmount(dayTime: number): number {
  const fromMidnight = Math.min(dayTime, 1 - dayTime)
  return Math.min(1, Math.max(0, (0.24 - fromMidnight) / 0.06))
}

export function isNight(dayTime: number): boolean {
  return nightAmount(dayTime) > 0.5
}

export function isDusk(dayTime: number): boolean {
  return dayTime > 0.68 && dayTime < 0.8
}

export function isMorning(dayTime: number): boolean {
  return dayTime > 0.24 && dayTime < 0.34
}

function syncLamps(world: World, night: boolean): void {
  const memory = toolMemoryOf(world)
  if (memory.wasNight === night) return
  memory.wasNight = night
  world.props.forEach((prop) => {
    if (prop.kind === 'lamppost') prop.lit = night
  })
}

function spawnFireflies(context: StepContext, dt: number): void {
  const { world } = context
  const memory = toolMemoryOf(world)
  memory.fireflyTimer -= dt
  if (memory.fireflyTimer > 0) return
  memory.fireflyTimer = FIREFLY_INTERVAL * context.memory.random.range(0.6, 1.4)
  const random = context.memory.random
  const point = { x: random.range(context.bounds.left, context.bounds.right), y: random.range(context.bounds.top, context.bounds.bottom) }
  spawnEffect(world, 'sparkle', point, random.range(18, 90), null, 0.45)
}

export function advanceDay(context: StepContext, dt: number): void {
  const { world } = context
  world.dayTime = (world.dayTime + dt / DAY_LENGTH_SECONDS) % 1
  const night = isNight(world.dayTime)
  syncLamps(world, night)
  if (night) spawnFireflies(context, dt)
}
