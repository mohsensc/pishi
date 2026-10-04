import type { CatMind, StepContext } from '../../../memory'
import { isToolCooling } from '../../../tools/toolState'
import type { CatState, HeldToyState, ToolKind } from '../../../types'

export const contestIds = new Set(['gatherAround', 'beg', 'reachUp', 'jumpForTreat', 'jumpForToy', 'swatAtToy', 'sneakyApproach', 'tugOfWar'])

export const toyAttentionIds = new Set([...contestIds, 'watchOthersJump', 'munchTreat', 'carryToyAway', 'sulkAfterMisses', 'embarrassedGroom'])

export const laserIds = new Set(['chaseLaser', 'pounceLaser', 'laserZoomies', 'laserStalk', 'laserHeadTilt', 'searchForLaser'])

export const catnipIds = new Set(['approachCatnip', 'catnipRoll', 'catnipZoomies', 'catnipStare', 'catnipKnead'])

export const brushIds = new Set(['comeForBrushing', 'getBrushed', 'avoidBrush'])

export const feedingIds = new Set(['goEat', 'queueForFood', 'drinkWater', 'runToRefill', 'begForRefill'])

export function isFreeForTools(cat: CatState, mind: CatMind, context: StepContext, allowCarrier = false): boolean {
  if (cat.hidden || (cat.heldBallId && !allowCarrier) || cat.height > 1 || cat.propId || mind.leap) return false
  return !isToolCooling(context.world, cat.id)
}

export function activeHeldToy(context: StepContext, tool: ToolKind): HeldToyState | null {
  const toy = context.world.heldToy
  if (!toy || toy.tool !== tool || !context.pointer.active) return null
  return toy
}

export function contestants(context: StepContext, excludeId: string | null = null): CatState[] {
  return context.world.cats.filter((cat) => cat.id !== excludeId && contestIds.has(cat.behavior))
}

export function countDoing(context: StepContext, ids: Set<string>, excludeId: string | null = null): number {
  return context.world.cats.reduce((count, cat) => (cat.id !== excludeId && ids.has(cat.behavior) ? count + 1 : count), 0)
}

export function contestSlotOffset(cat: CatState, context: StepContext): number {
  const order = contestants(context)
    .map((other) => other.id)
    .sort()
  const index = Math.max(0, order.indexOf(cat.id))
  const offsets = [0, -1, 1]
  return offsets[index % offsets.length] * 30 * cat.coat.scale
}

export function checkChance(context: StepContext, probabilityPerSecond: number): boolean {
  return context.memory.random.chance(Math.min(1, probabilityPerSecond * 0.25))
}
