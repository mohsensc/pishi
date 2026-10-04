import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { lockPose, setEmote } from '../helpers/pose'
import { randomOpenPoint, randomTimer, zeroVector } from '../helpers/queries'
import { seek } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'

export const zoomiesBehavior: Behavior = {
  id: 'zoomies',
  intent: 'wander',
  interruptible: false,
  ownsTimer: true,
  minDuration: 6,
  maxDuration: 12,
  weight: (_cat, mind) => mind.personality.zoominess * 0.09,
  start(cat, mind) {
    mind.phase = 'zoom'
    mind.target = null
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const random = context.memory.random
    if (mind.phase === 'settle') {
      if (mind.phaseTimer > mind.holdDuration) endBehavior(cat, mind, context)
      return zeroVector
    }
    mind.speedBoost = 1.12
    if (!mind.target || distance(cat.position, mind.target) < 30) {
      mind.attempts += 1
      if (mind.attempts > random.integer(3, 5)) {
        mind.speedBoost = 1
        if (random.chance(0.55)) lockPose(mind, 'flop', 0.7)
        mind.phase = 'settle'
        mind.phaseTimer = 0
        mind.holdDuration = randomTimer(context, 1, 2)
        mind.idlePose = 'sit'
        return zeroVector
      }
      mind.target = randomOpenPoint(context, null, 0, 24)
    }
    return seek(cat, mind.target, topSpeed(cat, mind, context))
  },
}
