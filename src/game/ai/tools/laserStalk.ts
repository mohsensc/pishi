import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { laserDot, laserSpeed } from './support/laser'
import { chain, gazeAt } from './support/phases'

export const laserStalkBehavior: Behavior = {
  id: 'laserStalk',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  minDuration: 4,
  maxDuration: 6,
  weight: () => 0,
  start(_cat, mind) {
    mind.movePose = 'stalk'
    mind.idlePose = 'stalk'
  },
  update(cat, mind, context) {
    const dot = laserDot(context)
    if (!dot) {
      chain(cat, mind, context, 'searchForLaser', 2.4)
      return zeroVector
    }
    gazeAt(cat, mind, dot, 0.4)
    if (laserSpeed(context) > 380) {
      chain(cat, mind, context, 'chaseLaser', 3.4)
      return zeroVector
    }
    const gap = distance(cat.position, dot)
    if (gap < 60 * context.memory.sizeScale || mind.behaviorElapsed > 5) {
      chain(cat, mind, context, 'pounceLaser', 3.5)
      return zeroVector
    }
    const creep = Math.sin(mind.behaviorElapsed * 5) > -0.2 ? 0.14 : 0
    return creep > 0 ? arrive(cat, dot, topSpeed(cat, mind, context) * creep, 30) : brake(cat, 8)
  },
}
