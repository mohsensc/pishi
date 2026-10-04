import type { Behavior } from '../behavior'
import { add, normalize, scale, subtract } from '../../vector'
import { emergeFrom, hideIn } from '../helpers/hiding'
import { setEmote } from '../helpers/pose'
import { inFrontOf } from '../helpers/propSpots'
import { bumpAgitation, enterPhase, finishUse, hasProp, isOvertime, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { canHideMore, catRadius, findProp, randomTimer, settleOnGround, zeroVector } from '../helpers/queries'

export const bushHideBehavior: Behavior = {
  id: 'bushHide',
  intent: 'hide',
  interruptible: false,
  ownsTimer: true,
  minDuration: 8,
  maxDuration: 13,
  weight: (cat, mind, context) =>
    canHideMore(context) && hasProp(cat, context, ['bush'], 560, (bush) => bush.occupantIds.length === 0) ? 0.14 + (1 - mind.personality.boldness) * 0.14 : 0,
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['bush'], 560, (bush) => bush.occupantIds.length === 0)?.id ?? null
    mind.movePose = 'stalk'
  },
  update(cat, mind, context) {
    const bush = findProp(context, mind.propTargetId)
    if (!bush) return finishUse(cat, mind, context)
    if (mind.phase === 'start' || mind.phase === 'go') {
      if (mind.phase === 'start') enterPhase(mind, 'go')
      const velocity = travel(cat, mind, context, inFrontOf(bush, cat, context), 0.4)
      if (velocity) return velocity
      if (!canHideMore(context) || bush.occupantIds.length > 0) return quit(cat, mind, context)
      hideIn(cat, mind, bush, randomTimer(context, 4, 8), context)
      bumpAgitation(bush, 0.6)
      return zeroVector
    }
    if (mind.phase === 'inside') {
      if (context.memory.random.chance(context.dt * 0.5)) bumpAgitation(bush, 0.3)
      if (mind.phaseTimer < mind.holdDuration && !isOvertime(cat)) return zeroVector
      emergeFrom(cat, bush, context)
      bumpAgitation(bush, 0.5)
      setEmote(cat, 'curious')
      const outward = normalize(subtract(cat.position, bush.position))
      mind.scratchPoints.exit = settleOnGround(add(cat.position, scale(outward, 70 * context.memory.sizeScale)), context, catRadius(cat))
      enterPhase(mind, 'sneak')
      return zeroVector
    }
    if (mind.phase === 'sneak') {
      const exit = mind.scratchPoints.exit
      const velocity = exit ? travel(cat, mind, context, exit, 0.3) : null
      return velocity ?? quit(cat, mind, context)
    }
    return finishUse(cat, mind, context)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
