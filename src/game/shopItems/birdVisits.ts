import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import type { PropState, World } from '../types'
import { distance, length } from '../vector'
import { shopItemMemoryOf } from './shopItemMemory'

export const BIRD_RETURN_SECONDS = 9

const birdPerches: Partial<Record<PropState['kind'], number>> = { birdFeeder: 96, birdbath: 44 }

export function hasBirdPerch(prop: PropState): boolean {
  return birdPerches[prop.kind] !== undefined
}

export function birdsPresent(world: World, prop: PropState): boolean {
  if (!hasBirdPerch(prop)) return false
  return (shopItemMemoryOf(world).birdsBack.get(prop.id) ?? 0) <= world.time
}

export function scatterBirds(context: StepContext, prop: PropState): boolean {
  const { world } = context
  if (!birdsPresent(world, prop)) return false
  const perch = birdPerches[prop.kind] ?? 40
  prop.pokedAt = world.time
  shopItemMemoryOf(world).birdsBack.set(prop.id, world.time + BIRD_RETURN_SECONDS)
  spawnEffect(world, 'birds', prop.position, perch * context.memory.sizeScale, prop.id, prop.kind === 'birdFeeder' ? 1.2 : 0.8)
  return true
}

function disturbed(prop: PropState, context: StepContext): boolean {
  const scale = context.memory.sizeScale
  const reach = prop.radius + 54 * scale
  const catNear = context.world.cats.some((cat) => !cat.hidden && distance(cat.position, prop.position) < reach && (length(cat.velocity) > 70 || cat.height > 8))
  if (catNear) return true
  const pointer = context.pointer
  return pointer.active && length(pointer.velocity) > 900 && distance(pointer.position, { x: prop.position.x, y: prop.position.y - (birdPerches[prop.kind] ?? 40) * scale }) < 70 * scale
}

export function stepBirdVisits(context: StepContext): void {
  context.world.props.forEach((prop) => {
    if (hasBirdPerch(prop) && disturbed(prop, context)) scatterBirds(context, prop)
  })
}
