import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { lockPose } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { endBehavior } from '../helpers/transitions'
import { laserDot } from './support/laser'
import { every, gazeAt } from './support/phases'
import { checkChance, isFreeForTools, laserIds } from './support/toolQueries'

export const laserHeadTiltBehavior: Behavior = {
  id: 'laserHeadTilt',
  intent: 'play',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight: () => 0,
  urgency(cat, mind, context) {
    const dot = laserDot(context)
    if (!dot || laserIds.has(cat.behavior) || !isFreeForTools(cat, mind, context)) return 0
    if (distance(cat.position, dot) > 500 * context.memory.sizeScale) return 0
    return checkChance(context, 0.25 + mind.personality.laziness * 0.6) ? 2.3 : 0
  },
  start(_cat, mind, context) {
    mind.idlePose = context.memory.random.chance(0.6) ? 'loaf' : 'sit'
  },
  update(cat, mind, context) {
    const dot = laserDot(context)
    if (!dot) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAt(cat, mind, dot, 0.3)
    if (distance(cat.position, dot) < 44 * context.memory.sizeScale && every(mind, context, 'swat', 0.7)) {
      lockPose(mind, 'bat', 0.25)
      mind.idlePose = 'crouch'
    }
    return brake(cat)
  },
}
