import type { CatMind, StepContext } from '../../../memory'
import { dropHeldBall } from '../../helpers/ball'
import type { JumpTool } from '../../../tools/toolState'
import { MAX_CONTESTANTS } from '../../../tools/toolConstants'
import { distance } from '../../../vector'
import type { CatState, HeldToyState } from '../../../types'
import { contestSlotOffset, contestants, isFreeForTools, toyAttentionIds } from './toolQueries'

export function contestTool(context: StepContext): JumpTool | null {
  const toy = context.world.heldToy
  if (!toy || !context.pointer.active) return null
  return toy.tool === 'treat' || toy.tool === 'wand' ? toy.tool : null
}

export function contestToy(context: StepContext): HeldToyState | null {
  return contestTool(context) ? context.world.heldToy : null
}

export function isToyReady(toy: HeldToyState): boolean {
  return toy.snatchedAt === null && toy.grabbedByCatId === null
}

export function contestIsFull(context: StepContext, selfId: string): boolean {
  return contestants(context, selfId).length >= MAX_CONTESTANTS
}

export function canJoinToyAttention(cat: CatState, mind: CatMind, context: StepContext, radius: number): HeldToyState | null {
  const toy = contestToy(context)
  if (!toy || toyAttentionIds.has(cat.behavior) || !isFreeForTools(cat, mind, context, true)) return null
  if (distance(cat.position, toy.position) > radius * context.memory.sizeScale) return null
  return toy
}

export function spotUnderToy(cat: CatState, toy: HeldToyState, context: StepContext): { x: number; y: number } {
  return { x: toy.position.x + contestSlotOffset(cat, context), y: toy.position.y + 3 }
}

export function dropBallFor(cat: CatState, mind: CatMind, context: StepContext): void {
  if (!cat.heldBallId) return
  dropHeldBall(cat, mind, context, null, 1.5)
  mind.behaviorUrgency = Math.max(mind.behaviorUrgency, 3.05)
}

export function toyInterest(cat: CatState, mind: CatMind, tool: JumpTool): number {
  const carrying = cat.heldBallId ? 0.6 : 1
  if (tool === 'treat') return carrying * (0.6 + (1 - cat.fullness) * 0.9 + cat.affection * 0.5)
  return carrying * (0.5 + mind.personality.zoominess * 1.1 + mind.personality.boldness * 0.3)
}
