import type { Behavior } from '../behavior'
import { pickTeammate } from '../helpers/escape'
import { dismount } from '../helpers/perch'
import { randomTimer, zeroVector } from '../helpers/queries'
import { beginPass, resumeAfterAction } from '../helpers/transitions'

export const perchBehavior: Behavior = {
  id: 'perch',
  intent: 'perch',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 3.5,
  maxDuration: 7,
  weight: () => 0,
  start() {},
  update(cat, mind, context) {
    const spot = mind.perch
    if (!spot) {
      resumeAfterAction(cat, mind, context)
      return zeroVector
    }
    cat.position = { x: spot.spot.x, y: spot.spot.y }
    cat.height = spot.height
    cat.velocity = { x: 0, y: 0 }
    mind.idlePose = !cat.heldBallId && mind.phaseTimer > 1.6 ? 'loaf' : 'sit'
    if (cat.heldBallId && mind.decisionTimer <= 0) {
      mind.decisionTimer = randomTimer(context, 0.8, 1.4)
      const underneath = context.pointer.active && Math.abs(context.pointer.position.x - cat.position.x) < 120 * context.memory.sizeScale
      if (underneath && context.memory.random.chance(0.3)) {
        const teammate = pickTeammate(cat, context)
        if (teammate) {
          beginPass(cat, mind, context, teammate)
          return zeroVector
        }
      }
    }
    if (cat.intentTimer <= 0) dismount(cat, mind, context, 'ground')
    return zeroVector
  },
}
