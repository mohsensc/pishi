import type { CatMind, StepContext } from '../../memory'
import { clamp, distance, dot, normalize, subtract } from '../../vector'
import type { CatState } from '../../types'
import { catCenter } from './queries'

const gentlePointerSpeed = 140

function isGentlePointer(context: StepContext): boolean {
  const { pointer } = context
  return pointer.tool !== 'hand' || Math.hypot(pointer.velocity.x, pointer.velocity.y) < gentlePointerSpeed
}

export function topSpeed(cat: CatState, mind: CatMind, context: StepContext): number {
  return mind.personality.maxSpeed * context.memory.speedScale * cat.speedMultiplier * mind.speedBoost
}

export function fleeRadius(cat: CatState, mind: CatMind, context: StepContext): number {
  return mind.personality.fleeRadius * context.memory.sizeScale * (1 + (cat.speedMultiplier - 1) * 0.8)
}

export function cursorDistance(cat: CatState, context: StepContext): number {
  if (!context.pointer.active) return Number.POSITIVE_INFINITY
  return distance(context.pointer.position, catCenter(cat))
}

export function threatened(cat: CatState, mind: CatMind, context: StepContext, factor = 1): boolean {
  if (!context.pointer.active || cat.hidden) return false
  if (!cat.heldBallId && isGentlePointer(context)) return false
  const gap = cursorDistance(cat, context)
  const toward = normalize(subtract(catCenter(cat), context.pointer.position))
  const approach = clamp(dot(context.pointer.velocity, toward) / 900, 0, 0.6)
  return gap < fleeRadius(cat, mind, context) * factor * (1 + approach)
}
