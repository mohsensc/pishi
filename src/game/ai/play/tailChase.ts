import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, phaseDone, sizeScaled } from '../helpers/playSteering'
import { lockPose, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake, orbit } from '../helpers/steering'

export const tailChaseBehavior: Behavior = {
  id: 'tailChase',
  intent: 'play',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight: (_cat, mind) => 0.05 + mind.personality.zoominess * 0.12,
  start(cat, mind, context) {
    mind.scratchPoints.center = { x: cat.position.x, y: cat.position.y }
    mind.scratchNumbers.flipAt = 0
    mind.movePose = 'crouch'
    mind.idlePose = 'crouch'
    enterPhase(mind, 'spin', randomTimer(context, 2.4, 3.6))
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (mind.phase === 'dizzy') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (phaseDone(mind)) {
      lockPose(mind, 'flop', 0.9)
      mind.idlePose = 'loaf'
      enterPhase(mind, 'dizzy', 1.6)
      return zeroVector
    }
    if (mind.phaseTimer > mind.scratchNumbers.flipAt) {
      mind.scratchNumbers.flipAt = mind.phaseTimer + randomTimer(context, 0.14, 0.22)
      cat.facing = cat.facing === 1 ? -1 : 1
      mind.facingHold = 0.24
      if (context.memory.random.chance(0.12)) lockPose(mind, 'bat', 0.16)
    }
    return orbit(cat, mind.scratchPoints.center, sizeScaled(context, 8), sizeScaled(context, 70), 1)
  },
}
