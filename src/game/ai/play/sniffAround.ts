import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { randomOpenPoint, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'

export const sniffAroundBehavior: Behavior = {
  id: 'sniffAround',
  intent: 'explore',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight: (_cat, mind) => mind.personality.curiosity * 0.12,
  start(cat, mind, context) {
    mind.movePose = 'sniff'
    mind.target = randomOpenPoint(context, cat.position, 90 * context.memory.sizeScale, 20)
  },
  update(cat, mind, context) {
    if (mind.phase === 'sniff') {
      mind.idlePose = 'sniff'
      if (mind.phaseTimer > mind.holdDuration) mind.phase = 'start'
      return brake(cat)
    }
    if (!mind.target || distance(cat.position, mind.target) < 8) {
      mind.phase = 'sniff'
      mind.phaseTimer = 0
      mind.holdDuration = randomTimer(context, 0.6, 1.4)
      mind.target = randomOpenPoint(context, cat.position, 90 * context.memory.sizeScale, 20)
      return zeroVector
    }
    return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.18, 20)
  },
}
