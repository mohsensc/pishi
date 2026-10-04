import type { Behavior } from '../behavior'
import { lockPose, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { orbit } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { hopInPlace } from '../helpers/leap'
import { laserDot, lastLaserSpot } from './support/laser'
import { chain, every } from './support/phases'

export const laserZoomiesBehavior: Behavior = {
  id: 'laserZoomies',
  intent: 'play',
  interruptible: false,
  minDuration: 3,
  maxDuration: 5,
  weight: () => 0,
  start(cat, mind, context) {
    mind.speedBoost = 1.25
    mind.scratchNumbers.direction = context.memory.random.sign()
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const center = laserDot(context) ?? lastLaserSpot(context)
    if (!center) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (cat.intentTimer < 0.3) {
      if (laserDot(context)) chain(cat, mind, context, 'chaseLaser', 3.4)
      else {
        lockPose(mind, 'flop', 0.7)
        endBehavior(cat, mind, context)
      }
      return zeroVector
    }
    if (every(mind, context, 'flip', 1.3)) mind.scratchNumbers.direction = -(mind.scratchNumbers.direction ?? 1)
    if (every(mind, context, 'hop', 1.7)) hopInPlace(cat, mind, context, 22 * cat.coat.scale, 0.3, 'hop')
    const direction: 1 | -1 = (mind.scratchNumbers.direction ?? 1) > 0 ? 1 : -1
    mind.scratchPoints.gaze = { x: center.x, y: center.y }
    return orbit(cat, center, 90 * context.memory.sizeScale, topSpeed(cat, mind, context), direction)
  },
}
