import { clampToBounds } from '../../../bounds'
import type { StepContext } from '../../../memory'
import type { CatState, Vec } from '../../../types'
import { catCenter } from '../../helpers/queries'
import { distance } from '../../../vector'

export function cursorGround(cat: CatState, context: StepContext): Vec {
  const pointer = context.pointer.position
  return clampToBounds({ x: pointer.x, y: pointer.y + 28 * cat.coat.scale }, context.bounds)
}

export function cursorOnBody(cat: CatState, context: StepContext, reach: number): boolean {
  return context.pointer.active && distance(context.pointer.position, catCenter(cat)) < reach * cat.coat.scale
}

export function pointerSpeed(context: StepContext): number {
  return Math.hypot(context.pointer.velocity.x, context.pointer.velocity.y)
}
