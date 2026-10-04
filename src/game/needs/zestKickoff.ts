import { pickBallFor } from '../ai/helpers/ball'
import { setEmote } from '../ai/helpers/pose'
import { mindOf } from '../ai/helpers/queries'
import { beginBehavior, beginChase } from '../ai/helpers/transitions'
import type { StepContext } from '../memory'
import type { CatState } from '../types'
import type { NeedRecord } from './needTypes'
import { engagedBehaviorIds } from '../happiness/happinessCatalog'

const waitingBehaviorIds = new Set(['enjoyCareItem', 'celebrate'])
const zestChaseBoost = 1.2

export function kickOffZest(cat: CatState, context: StepContext, record: NeedRecord): void {
  if (!record.zestPending) return
  if (context.world.time > record.zestUntil) {
    record.zestPending = false
    return
  }
  if (waitingBehaviorIds.has(cat.behavior) || engagedBehaviorIds.has(cat.behavior)) return
  const mind = mindOf(cat, context)
  if (cat.hidden || mind.leap || cat.height > 1 || cat.propId) return
  record.zestPending = false
  if (cat.heldBallId) return
  setEmote(cat, 'playful')
  const ball = pickBallFor(cat, mind, context)
  if (ball) beginChase(cat, mind, context, ball, zestChaseBoost)
  else beginBehavior(cat, mind, context, 'zoomies')
}
