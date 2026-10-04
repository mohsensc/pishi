import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { faceToward } from '../helpers/pose'
import { findProp, pointBeside, propsWithin } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'

export const restByPropBehavior: Behavior = {
  id: 'restByProp',
  intent: 'useProp',
  interruptible: true,
  minDuration: 5,
  maxDuration: 9,
  weight: (cat, _mind, context) => (propsWithin(cat.position, context, 320 * context.memory.sizeScale, (prop) => prop.solid).length > 0 ? 0.1 : 0),
  start(cat, mind, context) {
    const nearby = propsWithin(cat.position, context, 320 * context.memory.sizeScale, (prop) => prop.solid)
    if (nearby.length === 0) return
    const prop = context.memory.random.pick(nearby)
    mind.propTargetId = prop.id
    mind.target = pointBeside(prop, cat, context, context.memory.random.sign())
    mind.idlePose = context.memory.random.chance(0.5) ? 'loaf' : 'sit'
  },
  update(cat, mind, context) {
    if (!mind.target || distance(cat.position, mind.target) < 10) {
      const prop = findProp(context, mind.propTargetId)
      if (prop) faceToward(cat, mind, prop.position, 0.5)
      return brake(cat)
    }
    return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.34)
  },
}
