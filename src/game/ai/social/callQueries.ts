import type { CatMind, StepContext } from '../../memory'
import { hashToUnit } from '../../random'
import { clampToBounds } from '../../bounds'
import type { CatState, Vec } from '../../types'

export const followSummonerId = 'followSummoner'
export const treatBagCallId = 'treatBagCall'

export function isGrounded(cat: CatState, mind: CatMind): boolean {
  return !cat.hidden && cat.height <= 1 && !mind.leap && !mind.perch
}

export function isHeldByPointer(cat: CatState, context: StepContext): boolean {
  const drag = context.world.drag
  return drag !== null && drag.target === 'cat' && drag.id === cat.id
}

export function isSummoned(cat: CatState, context: StepContext): boolean {
  return cat.followUntil !== null && context.world.time < cat.followUntil
}

export function answeredSince(mind: CatMind, behaviorId: string, since: number): boolean {
  return mind.recentBehaviors.some((record) => record.id === behaviorId && record.startedAt >= since)
}

export function ringSpot(cat: CatState, center: Vec, radius: number, context: StepContext): Vec {
  const angle = hashToUnit(cat.id) * Math.PI * 2
  return clampToBounds({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius * 0.55 }, context.bounds)
}
