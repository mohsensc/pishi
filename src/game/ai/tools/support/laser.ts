import type { StepContext } from '../../../memory'
import { toolMemoryOf } from '../../../tools/toolState'
import { length } from '../../../vector'
import type { Vec } from '../../../types'

export function laserDot(context: StepContext): Vec | null {
  const toy = context.world.heldToy
  if (!toy || toy.tool !== 'laser' || !context.pointer.active) return null
  return toy.position
}

export function lastLaserSpot(context: StepContext): Vec | null {
  return toolMemoryOf(context.world).laserLast
}

export function laserSpeed(context: StepContext): number {
  return length(context.pointer.velocity)
}
