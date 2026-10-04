import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import type { PropKind } from '../types'
import { clamp } from '../vector'
import { shopItemMemoryOf } from './shopItemMemory'

const silentRemovals = new Set<PropKind>(['tree', 'feedingStation'])

export function watchPlacedProps(context: StepContext): void {
  const { world } = context
  const memory = shopItemMemoryOf(world)
  const present = new Set<string>()
  world.props.forEach((prop) => {
    present.add(prop.id)
    const known = memory.known.get(prop.id)
    if (known) {
      known.position.x = prop.position.x
      known.position.y = prop.position.y
      known.radius = prop.radius
    } else memory.known.set(prop.id, { kind: prop.kind, position: { ...prop.position }, radius: prop.radius })
    if (!memory.dropping.has(prop.id) || prop.droppedAt === null || prop.lift > 0) return
    memory.dropping.delete(prop.id)
    spawnEffect(world, 'bounce', prop.position, 0, prop.id, clamp(prop.radius / 26, 0.8, 1.6))
    spawnEffect(world, 'sparkle', prop.position, prop.radius * 0.8, prop.id, 0.5)
  })
  memory.known.forEach((known, propId) => {
    if (present.has(propId)) return
    memory.known.delete(propId)
    memory.dropping.delete(propId)
    if (!silentRemovals.has(known.kind)) spawnEffect(world, 'poof', known.position, 0, null, clamp(known.radius / 28, 0.7, 1.5))
  })
}
