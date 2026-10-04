import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { randomOpenPoint, randomTimer, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'

export const strollBehavior: Behavior = {
  id: 'stroll',
  intent: 'wander',
  interruptible: true,
  minDuration: 3,
  maxDuration: 7,
  weight: () => 0.5,
  start(cat, mind, context) {
    mind.phase = 'stroll'
    mind.target = randomOpenPoint(context, cat.position, 260 * context.memory.sizeScale, 24)
  },
  update(cat, mind, context) {
    if (mind.phase === 'stroll' && mind.target) {
      if (distance(cat.position, mind.target) >= 10) return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.42)
      mind.phase = 'rest'
      mind.phaseTimer = 0
      mind.holdDuration = randomTimer(context, 0.4, 1.4)
      mind.idlePose = context.memory.random.chance(0.7) ? 'sit' : 'loaf'
      return zeroVector
    }
    if (mind.phaseTimer > mind.holdDuration) endBehavior(cat, mind, context)
    return zeroVector
  },
}
