import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, phaseDone } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const bellyUpWiggleBehavior: Behavior = {
  id: 'bellyUpWiggle',
  intent: 'play',
  interruptible: true,
  minDuration: 5,
  maxDuration: 8,
  weight: (cat, mind) => 0.05 + cat.affection * 0.08 + mind.personality.zoominess * 0.05,
  start(cat, mind, context) {
    lockPose(mind, 'flop', 0.5)
    mind.idlePose = 'bellyUp'
    mind.scratchNumbers.flipAt = 0.8
    enterPhase(mind, 'wiggle', randomTimer(context, 3, 4.5))
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (mind.phase === 'wiggle') {
      if (mind.phaseTimer > mind.scratchNumbers.flipAt) {
        mind.scratchNumbers.flipAt = mind.phaseTimer + randomTimer(context, 0.45, 0.9)
        cat.facing = cat.facing === 1 ? -1 : 1
        mind.facingHold = 0.5
      }
      if (phaseDone(mind)) {
        mind.idlePose = 'sit'
        hopInPlace(cat, mind, context, 12, 0.26, 'hop')
        enterPhase(mind, 'done', 0.8)
        return zeroVector
      }
      return brake(cat)
    }
    if (phaseDone(mind)) return finishBehavior(cat, mind, context)
    return brake(cat)
  },
}
