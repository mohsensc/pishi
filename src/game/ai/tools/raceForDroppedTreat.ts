import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { setEmote } from '../helpers/pose'
import { mouthPoint, zeroVector } from '../helpers/queries'
import { seek } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { chain, gazeAt } from './support/phases'
import { isFreeForTools } from './support/toolQueries'
import { findTreat, isTreatAvailable, nearestOpenTreat } from './support/treatQueries'

export const raceForDroppedTreatBehavior: Behavior = {
  id: 'raceForDroppedTreat',
  intent: 'play',
  interruptible: true,
  minDuration: 5,
  maxDuration: 7,
  recencyPenalty: 0,
  weight: () => 0,
  urgency(cat, mind, context) {
    if (!isFreeForTools(cat, mind, context) || cat.behavior === 'eatDroppedTreat' || cat.behavior === 'batTreatAround') return 0
    const treat = nearestOpenTreat(cat, context, 460 * context.memory.sizeScale)
    if (!treat) return 0
    return context.memory.random.chance(0.3 + (1 - cat.fullness) * 0.4) ? 3.2 : 0
  },
  start(cat, mind, context) {
    const treat = nearestOpenTreat(cat, context, 900 * context.memory.sizeScale)
    if (treat) mind.scratchIds.treat = treat.id
    mind.speedBoost = 1.12
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const treat = findTreat(context, mind.scratchIds.treat)
    if (!treat || !isTreatAvailable(treat, cat.id)) {
      const spot = treat?.position ?? mind.target
      if (spot) {
        chain(cat, mind, context, 'sniffForCrumbs', 2.4)
        mind.scratchPoints.spot = { x: spot.x, y: spot.y }
      } else endBehavior(cat, mind, context)
      return zeroVector
    }
    mind.target = { ...treat.position }
    gazeAt(cat, mind, treat.position, 0.2)
    if (distance(mouthPoint(cat), treat.position) < 16 * cat.coat.scale && treat.height < 8) {
      treat.claimedByCatId = cat.id
      const playful = context.memory.random.chance(mind.personality.zoominess * 0.5)
      chain(cat, mind, context, playful ? 'batTreatAround' : 'eatDroppedTreat', 3.4)
      mind.scratchIds.treat = treat.id
      return zeroVector
    }
    const approach = { x: treat.position.x - cat.facing * 22 * cat.coat.scale, y: treat.position.y }
    return seek(cat, distance(cat.position, treat.position) < 40 ? treat.position : approach, topSpeed(cat, mind, context))
  },
}
