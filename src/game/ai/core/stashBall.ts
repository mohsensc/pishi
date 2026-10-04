import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { placeInStash } from '../helpers/ball'
import { boxFront, emergeFrom, hideIn, isBoxFree } from '../helpers/hiding'
import { isPerchSpotTaken, perchSpotFor } from '../helpers/perch'
import { canHideMore, findProp, randomTimer, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { threatened, topSpeed } from '../helpers/threat'
import { beginClimb, endBehavior, resumeAfterAction } from '../helpers/transitions'

export const stashBallBehavior: Behavior = {
  id: 'stashBall',
  intent: 'stashBall',
  interruptible: false,
  ownsTimer: true,
  withBall: true,
  minDuration: 7,
  maxDuration: 7,
  weight: () => 0,
  start() {},
  update(cat, mind, context) {
    const box = findProp(context, mind.propTargetId)
    if (!box) {
      resumeAfterAction(cat, mind, context)
      return zeroVector
    }
    if (mind.phase === 'inside') {
      mind.idlePose = 'loaf'
      const scared = threatened(cat, mind, context, 0.8)
      if (mind.phaseTimer > mind.holdDuration && (!scared || mind.phaseTimer > mind.holdDuration + 1.5)) {
        emergeFrom(cat, box, context)
        const plan = context.memory.random.chance(0.45) && !isPerchSpotTaken(context, box.id, 0, cat.id) ? perchSpotFor(box, 0, context.world.height) : null
        if (plan) beginClimb(cat, mind, context, plan)
        else endBehavior(cat, mind, context)
      }
      return zeroVector
    }
    if (mind.phase === 'lean') {
      mind.idlePose = 'crouch'
      if (mind.phaseTimer > 0.5) {
        placeInStash(cat, mind, box, context)
        endBehavior(cat, mind, context)
      }
      return zeroVector
    }
    if (!cat.heldBallId || cat.intentTimer <= 0 || !isBoxFree(box, context, cat.id)) {
      resumeAfterAction(cat, mind, context)
      return zeroVector
    }
    const front = boxFront(box, cat)
    if (distance(cat.position, front) < 16 * cat.coat.scale) {
      placeInStash(cat, mind, box, context)
      if (canHideMore(context)) {
        hideIn(cat, mind, box, randomTimer(context, 1.2, 2.6), context)
      } else {
        mind.phase = 'lean'
        mind.phaseTimer = 0
      }
      return zeroVector
    }
    return arrive(cat, front, topSpeed(cat, mind, context), 30)
  },
}
