import { contestIds } from '../ai/tools/support/toolQueries'
import type { StepContext } from '../memory'
import { clamp } from '../vector'
import type { Vec } from '../types'
import { LIFT_EASING, LIFT_SEARCH_WIDTH, MAX_TOY_LIFT } from './toolConstants'

function referenceGround(screen: Vec, context: StepContext): number | null {
  const width = LIFT_SEARCH_WIDTH * context.memory.sizeScale
  let best: number | null = null
  let bestScore = Number.POSITIVE_INFINITY
  context.world.cats.forEach((cat) => {
    if (cat.hidden) return
    const sideways = Math.abs(cat.position.x - screen.x)
    const above = cat.position.y - screen.y
    if (sideways > width || above < -12 || above > MAX_TOY_LIFT) return
    const score = sideways + Math.abs(above) * 0.15 - (contestIds.has(cat.behavior) ? 70 : 0)
    if (score < bestScore) {
      bestScore = score
      best = cat.position.y
    }
  })
  return best
}

export function easeLift(screen: Vec, current: number, context: StepContext): number {
  const ground = referenceGround(screen, context)
  const target = ground === null ? current : ground - screen.y
  const eased = current + (target - current) * Math.min(1, context.dt * LIFT_EASING)
  const minimum = Math.max(0, context.bounds.top - screen.y)
  const maximum = Math.max(minimum, context.bounds.bottom - screen.y)
  return clamp(eased, minimum, Math.min(maximum, MAX_TOY_LIFT))
}

export function groundUnder(screen: Vec, lift: number): Vec {
  return { x: screen.x, y: screen.y + lift }
}
