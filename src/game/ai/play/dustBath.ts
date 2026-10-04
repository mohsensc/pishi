import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { enterPhase, finishBehavior, phaseDone } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const dustBathBehavior: Behavior = {
  id: 'dustBath',
  intent: 'play',
  interruptible: true,
  minDuration: 4,
  maxDuration: 6,
  weight: (_cat, mind) => 0.05 + mind.personality.zoominess * 0.06 + mind.personality.laziness * 0.04,
  start(cat, mind, context) {
    lockPose(mind, 'flop', 0.5)
    mind.idlePose = 'bellyUp'
    mind.scratchNumbers.flipAt = 0.6
    enterPhase(mind, 'roll', randomTimer(context, 1.8, 2.6))
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (mind.phase === 'roll') {
      if (mind.phaseTimer > mind.scratchNumbers.flipAt) {
        mind.scratchNumbers.flipAt = mind.phaseTimer + 0.55
        cat.facing = cat.facing === 1 ? -1 : 1
        mind.facingHold = 0.6
        spawnEffect(context.world, 'dust', cat.position, 0, null, 0.6)
      }
      if (phaseDone(mind)) {
        mind.idlePose = 'sit'
        hopInPlace(cat, mind, context, 10, 0.22, 'startle')
        spawnEffect(context.world, 'dust', cat.position, 4, null, 1)
        enterPhase(mind, 'shake', 0.6)
      }
      return brake(cat)
    }
    if (mind.phase === 'shake') {
      if (phaseDone(mind)) {
        mind.idlePose = 'groom'
        enterPhase(mind, 'groom', randomTimer(context, 1.2, 2))
      }
      return brake(cat)
    }
    if (phaseDone(mind)) return finishBehavior(cat, mind, context)
    return mind.phase === 'groom' ? brake(cat) : zeroVector
  },
}
