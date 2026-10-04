import type { Behavior } from '../behavior'
import { add, distance } from '../../vector'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { enterPhase, gazeAt, phaseDone } from './support/phases'

export const sniffForCrumbsBehavior: Behavior = {
  id: 'sniffForCrumbs',
  intent: 'explore',
  interruptible: true,
  minDuration: 2.5,
  maxDuration: 4,
  weight: () => 0,
  start(cat, mind, context) {
    mind.movePose = 'sniff'
    setEmote(cat, context.memory.random.chance(0.5) ? 'annoyed' : 'curious')
    enterPhase(mind, 'walk')
  },
  update(cat, mind, context) {
    const spot = mind.scratchPoints.spot
    if (!spot) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (mind.phase === 'sniff') {
      mind.idlePose = 'sniff'
      if (phaseDone(mind)) enterPhase(mind, 'walk')
      return brake(cat)
    }
    const random = context.memory.random
    const target = mind.target ?? add(spot, { x: random.range(-24, 24), y: random.range(-14, 14) })
    mind.target = target
    gazeAt(cat, mind, { x: target.x, y: target.y + 6 }, 0.3)
    if (distance(cat.position, target) < 8) {
      mind.target = null
      enterPhase(mind, 'sniff', random.range(0.4, 0.9))
      return zeroVector
    }
    return arrive(cat, target, topSpeed(cat, mind, context) * 0.16, 16)
  },
}
