import { spawnEffect } from '../../../effects'
import type { StepContext } from '../../../memory'
import { addMiss, clearMisses, type JumpTool } from '../../../tools/toolState'
import type { CatState, HeldToyState } from '../../../types'
import { setAction, setEmote } from '../../helpers/pose'
import { raiseAffection } from './affection'
import { grabRadius } from './reach'
import { satisfyByTool } from '../../../needs/toolNeeds'

export function usableToy(context: StepContext, tool: JumpTool): HeldToyState | null {
  const toy = context.world.heldToy
  if (!toy || toy.tool !== tool || !context.pointer.active) return null
  if (toy.snatchedAt !== null || toy.grabbedByCatId) return null
  return toy
}

export function toyHeightAbove(cat: CatState, toy: HeldToyState): number {
  return cat.position.y - (toy.position.y - toy.height)
}

function toyWithinReach(cat: CatState, toy: HeldToyState, topOffset: number, bottomOffset: number): boolean {
  if (Math.abs(cat.position.x - toy.position.x) > grabRadius(cat)) return false
  const above = toyHeightAbove(cat, toy)
  return above <= cat.height + topOffset + 6 && above >= cat.height + bottomOffset - 6
}

function claimToy(cat: CatState, toy: HeldToyState, context: StepContext): void {
  const { world } = context
  clearMisses(world, cat.id)
  satisfyByTool(cat, context, toy.tool)
  if (toy.tool === 'treat') {
    toy.snatchedAt = world.time
    setAction(cat, 'catchTreat')
    raiseAffection(cat, 0.05)
    spawnEffect(world, 'crumbs', cat.position, cat.height + 22 * cat.coat.scale, null, 0.5)
    return
  }
  toy.grabbedByCatId = cat.id
  toy.tugProgress = 0
  setAction(cat, 'catchToy')
  setEmote(cat, 'playful')
}

export function registerMissOf(cat: CatState, tool: JumpTool, context: StepContext): number {
  setAction(cat, tool === 'treat' ? 'missTreat' : 'missToy')
  return addMiss(context.world, cat.id)
}

export function attemptGrab(cat: CatState, tool: JumpTool, context: StepContext, topOffset: number, bottomOffset: number): boolean {
  const toy = usableToy(context, tool)
  if (!toy || !toyWithinReach(cat, toy, topOffset, bottomOffset)) return false
  claimToy(cat, toy, context)
  return true
}
