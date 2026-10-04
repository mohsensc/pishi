import type { Behavior } from '../behavior'
import { add, normalize, scale } from '../../vector'
import { edgeBounce, enterPhase, finishBehavior, headingVelocity, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const pinballBounceBehavior: Behavior = {
  id: 'pinballBounce',
  intent: 'play',
  interruptible: true,
  minDuration: 7,
  maxDuration: 11,
  weight: (_cat, mind) => mind.personality.zoominess * 0.17,
  start(cat, mind, context) {
    const random = context.memory.random
    mind.scratchPoints.heading = normalize({ x: random.sign() * random.range(0.6, 1), y: random.sign() * random.range(0.5, 0.9) })
    mind.scratchNumbers.bounces = random.integer(4, 7)
    mind.idlePose = 'sit'
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (mind.phase === 'done') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    const result = edgeBounce(cat, mind.scratchPoints.heading, context, sizeScaled(context, 26))
    mind.scratchPoints.heading = result.heading
    if (result.bounced) {
      mind.attempts += 1
      if (mind.attempts >= mind.scratchNumbers.bounces) {
        lockPose(mind, 'flop', 0.7)
        mind.idlePose = 'loaf'
        enterPhase(mind, 'done', 1.3)
        return zeroVector
      }
      const landing = add(cat.position, scale(result.heading, sizeScaled(context, 34)))
      startLeap(cat, mind, context, landing, 0, 16, 0.26, 'hop', 'none')
      return zeroVector
    }
    return headingVelocity(mind.scratchPoints.heading, paceSpeed(cat, mind, context, 0.85))
  },
}
