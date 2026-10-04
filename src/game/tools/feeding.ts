import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import type { PropState } from '../types'
import { AFFECTION_BASELINE, AFFECTION_DRIFT, FEEDING_REFILL_SECONDS, FULLNESS_DECAY_PER_SECOND } from './toolConstants'
import { toolMemoryOf } from './toolState'

function refillStation(station: PropState, context: StepContext): void {
  const { world } = context
  const memory = toolMemoryOf(world)
  station.foodLevel = 1
  station.agitation = Math.max(station.agitation, 0.6)
  memory.refillAt = world.time
  memory.refillStationId = station.id
  memory.refillTimers.set(station.id, FEEDING_REFILL_SECONDS)
  spawnEffect(world, 'kibble', { x: station.position.x - station.radius * 0.48, y: station.position.y }, 26, station.id, 1)
}

function tendStation(station: PropState, context: StepContext): void {
  const memory = toolMemoryOf(context.world)
  const seen = memory.seenPokes.get(station.id)
  if (seen === undefined) memory.seenPokes.set(station.id, station.pokedAt)
  else if (station.pokedAt !== seen) {
    memory.seenPokes.set(station.id, station.pokedAt)
    refillStation(station, context)
    return
  }
  const timer = (memory.refillTimers.get(station.id) ?? FEEDING_REFILL_SECONDS) - context.dt
  if (timer > 0) {
    memory.refillTimers.set(station.id, timer)
    return
  }
  if (station.foodLevel < 0.95) refillStation(station, context)
  else memory.refillTimers.set(station.id, FEEDING_REFILL_SECONDS)
}

export function updateFeeding(context: StepContext): void {
  const { world, dt } = context
  world.props.forEach((prop) => {
    if (prop.kind === 'feedingStation') tendStation(prop, context)
  })
  world.cats.forEach((cat) => {
    cat.fullness = Math.max(0, Math.min(1, cat.fullness - dt * FULLNESS_DECAY_PER_SECOND))
    cat.affection = Math.max(0, Math.min(1, cat.affection + (AFFECTION_BASELINE - cat.affection) * dt * AFFECTION_DRIFT))
  })
}

export function recentRefill(context: StepContext, withinSeconds: number): PropState | undefined {
  const memory = toolMemoryOf(context.world)
  if (memory.refillAt === null || context.world.time - memory.refillAt > withinSeconds) return undefined
  return context.world.props.find((prop) => prop.id === memory.refillStationId)
}
