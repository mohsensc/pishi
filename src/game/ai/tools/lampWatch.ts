import type { Behavior } from '../behavior'
import { isNight } from '../../tools/dayCycle'
import { distance } from '../../vector'
import { lockPose } from '../helpers/pose'
import { findProp, nearestProp, pointBeside, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { every, gazeAt } from './support/phases'

export const lampWatchBehavior: Behavior = {
  id: 'lampWatch',
  intent: 'explore',
  interruptible: true,
  minDuration: 5,
  maxDuration: 9,
  weight(cat, mind, context) {
    const lamp = nearestProp(cat, context, 'lamppost', 520 * context.memory.sizeScale, (prop) => prop.lit)
    if (!lamp) return 0
    return (isNight(context.world.dayTime) ? 0.3 : 0.08) * (0.5 + mind.personality.curiosity)
  },
  start(cat, mind, context) {
    const lamp = nearestProp(cat, context, 'lamppost', 520 * context.memory.sizeScale, (prop) => prop.lit)
    if (!lamp) return
    mind.propTargetId = lamp.id
    mind.target = pointBeside(lamp, cat, context, context.memory.random.sign())
    mind.movePose = 'walk'
  },
  update(cat, mind, context) {
    const lamp = findProp(context, mind.propTargetId)
    if (!lamp || !lamp.lit || !mind.target) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (distance(cat.position, mind.target) > 10) return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.35, 30)
    gazeAt(cat, mind, { x: lamp.position.x, y: lamp.position.y - 150 * context.memory.sizeScale }, 0.6)
    mind.idlePose = 'sit'
    if (every(mind, context, 'moth', 2.2) && context.memory.random.chance(0.5)) lockPose(mind, 'bat', 0.3)
    return brake(cat)
  },
}
