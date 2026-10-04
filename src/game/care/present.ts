import { startCareEnjoyment } from '../ai/care/enjoyCareItem'
import { dropHeldBall } from '../ai/helpers/ball'
import { setEmote } from '../ai/helpers/pose'
import { mindOf } from '../ai/helpers/queries'
import { beginBehavior } from '../ai/helpers/transitions'
import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import type { CatState } from '../types'
import { careItemNeeds } from './careCatalog'
import type { CareItemKind, CarePresentedListener } from './careTypes'
import { settleCareMeter, takeCareItem } from './inventory'

const presentedListeners: CarePresentedListener[] = []

export function onCareItemPresented(listener: CarePresentedListener): () => void {
  presentedListeners.push(listener)
  return () => {
    const index = presentedListeners.indexOf(listener)
    if (index >= 0) presentedListeners.splice(index, 1)
  }
}

export function canReceiveCareItem(cat: CatState | undefined): cat is CatState {
  return cat !== undefined && !cat.hidden
}

function reactToCareItem(cat: CatState, context: StepContext, kind: CareItemKind): void {
  const mind = mindOf(cat, context)
  if (cat.heldBallId) dropHeldBall(cat, mind, context, null, 1.2)
  if (mind.leap) {
    setEmote(cat, 'love')
    spawnEffect(context.world, 'hearts', cat.position, cat.height + 34 * cat.coat.scale, null, 0.8)
    return
  }
  beginBehavior(cat, mind, context, 'enjoyCareItem', { urgency: 8 })
  startCareEnjoyment(cat, mind, context, kind)
}

export function presentCareItem(context: StepContext, catId: string, itemKind: CareItemKind): boolean {
  const cat = context.world.cats.find((candidate) => candidate.id === catId)
  if (!canReceiveCareItem(cat)) return false
  if (!takeCareItem(context.world, itemKind)) return false
  reactToCareItem(cat, context, itemKind)
  settleCareMeter(context)
  const presentation = { context, cat, kind: itemKind, needs: careItemNeeds[itemKind] }
  presentedListeners.slice().forEach((listener) => listener(presentation))
  return true
}
