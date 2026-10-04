import type { Behavior } from '../behavior'
import { MAX_LASER_CHASERS } from '../../tools/toolConstants'
import { add, distance, scale } from '../../vector'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { seek } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { dropBallFor } from './support/contest'
import { laserDot, laserSpeed } from './support/laser'
import { chain, gazeAt } from './support/phases'
import { checkChance, countDoing, isFreeForTools, laserIds } from './support/toolQueries'

export const chaseLaserBehavior: Behavior = {
  id: 'chaseLaser',
  intent: 'play',
  interruptible: true,
  ownsTimer: true,
  recencyPenalty: 0,
  minDuration: 6,
  maxDuration: 10,
  weight: () => 0,
  urgency(cat, mind, context) {
    const dot = laserDot(context)
    if (!dot || laserIds.has(cat.behavior) || !isFreeForTools(cat, mind, context, true)) return 0
    if (distance(cat.position, dot) > 560 * context.memory.sizeScale || mind.personality.zoominess < 0.3) return 0
    if (countDoing(context, laserIds, cat.id) >= MAX_LASER_CHASERS) return 0
    return checkChance(context, (cat.heldBallId ? 0.4 : 1) * (0.6 + mind.personality.zoominess * 1.6)) ? 3.4 : 0
  },
  start(cat, mind, context) {
    dropBallFor(cat, mind, context)
    mind.speedBoost = 1.15
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const dot = laserDot(context)
    if (!dot) {
      chain(cat, mind, context, 'searchForLaser', 2.4)
      return zeroVector
    }
    gazeAt(cat, mind, dot, 0.2)
    const gap = distance(cat.position, dot)
    const speed = laserSpeed(context)
    mind.scratchNumbers.still = speed < 60 ? (mind.scratchNumbers.still ?? 0) + context.dt : 0
    if (mind.scratchNumbers.still > 0.7 && gap < 220 * context.memory.sizeScale && gap > 70 * context.memory.sizeScale) {
      chain(cat, mind, context, 'laserStalk', 3.5)
      return zeroVector
    }
    if (gap < 80 * context.memory.sizeScale && mind.behaviorElapsed > 0.5 && context.memory.random.chance(context.dt * 2.5)) {
      chain(cat, mind, context, 'pounceLaser', 3.5)
      return zeroVector
    }
    if (mind.behaviorElapsed > 14) {
      chain(cat, mind, context, 'laserZoomies', 3.5)
      return zeroVector
    }
    const lead = add(dot, scale(context.pointer.velocity, 0.12))
    return seek(cat, gap < 10 ? dot : lead, topSpeed(cat, mind, context) * (gap < 40 ? 0.5 : 1))
  },
}
