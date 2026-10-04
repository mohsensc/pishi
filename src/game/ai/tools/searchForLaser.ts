import type { Behavior } from '../behavior'
import { add, distance } from '../../vector'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { lastLaserSpot } from './support/laser'
import { enterPhase, every, gazeAt, phaseDone } from './support/phases'

export const searchForLaserBehavior: Behavior = {
  id: 'searchForLaser',
  intent: 'explore',
  interruptible: true,
  minDuration: 3,
  maxDuration: 5,
  weight: () => 0,
  start(cat, mind) {
    setEmote(cat, 'curious')
    mind.movePose = 'sniff'
    enterPhase(mind, 'walk')
  },
  update(cat, mind, context) {
    const spot = lastLaserSpot(context)
    if (!spot) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const random = context.memory.random
    if (mind.phase === 'look') {
      mind.idlePose = mind.phaseTimer < 0.5 ? 'peek' : 'sit'
      if (every(mind, context, 'glance', 0.6)) mind.scratchPoints.gaze = add(cat.position, { x: random.range(-120, 120), y: random.range(-80, 20) })
      if (phaseDone(mind)) enterPhase(mind, 'walk')
      return brake(cat)
    }
    const target = mind.target ?? add(spot, { x: random.range(-40, 40), y: random.range(-24, 24) })
    mind.target = target
    gazeAt(cat, mind, target, 0.2)
    if (distance(cat.position, target) < 10) {
      mind.target = null
      enterPhase(mind, 'look', random.range(0.8, 1.4))
      return zeroVector
    }
    return arrive(cat, target, topSpeed(cat, mind, context) * 0.22, 18)
  },
}
