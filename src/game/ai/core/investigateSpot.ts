import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { faceToward, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'

export const investigateSpotBehavior: Behavior = {
  id: 'investigateSpot',
  intent: 'explore',
  interruptible: true,
  minDuration: 3,
  maxDuration: 5,
  weight: () => 0,
  start(cat, mind) {
    mind.movePose = 'walk'
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    const spot = mind.scratchPoints.spot
    if (!spot) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    mind.scratchPoints.gaze = spot
    if (mind.phase === 'sniff') {
      mind.idlePose = 'sniff'
      if (mind.phaseTimer > mind.holdDuration) endBehavior(cat, mind, context)
      return brake(cat)
    }
    const stopDistance = 22 * cat.coat.scale
    if (distance(cat.position, spot) < stopDistance + 4) {
      faceToward(cat, mind, spot, 1)
      mind.phase = 'sniff'
      mind.phaseTimer = 0
      mind.holdDuration = randomTimer(context, 0.8, 1.6)
      return zeroVector
    }
    const approach = { x: spot.x - Math.sign(spot.x - cat.position.x) * stopDistance, y: spot.y }
    return arrive(cat, approach, topSpeed(cat, mind, context) * 0.3, 30)
  },
}
