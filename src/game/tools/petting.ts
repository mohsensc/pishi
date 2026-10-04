import { catCenter } from '../ai/helpers/queries'
import type { StepContext } from '../memory'
import { distance, length } from '../vector'
import { PET_SPEED_LIMIT } from './toolConstants'
import { toolMemoryOf } from './toolState'

export function trackPetting(context: StepContext): void {
  const { world, pointer } = context
  const memory = toolMemoryOf(world)
  const gentle = pointer.active && pointer.tool === 'hand' && length(pointer.velocity) < PET_SPEED_LIMIT
  world.cats.forEach((cat) => {
    const touching = gentle && !cat.hidden && distance(pointer.position, catCenter(cat)) < 30 * cat.coat.scale
    memory.petDwell.set(cat.id, touching ? (memory.petDwell.get(cat.id) ?? 0) + context.dt : 0)
  })
}

export function petDwellOf(context: StepContext, catId: string): number {
  return toolMemoryOf(context.world).petDwell.get(catId) ?? 0
}
