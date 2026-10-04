import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setAction, setEmote } from '../helpers/pose'
import { randomOpenPoint, zeroVector } from '../helpers/queries'
import { seek } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { every } from './support/phases'

export const catnipZoomiesBehavior: Behavior = {
  id: 'catnipZoomies',
  intent: 'play',
  interruptible: false,
  minDuration: 3,
  maxDuration: 5,
  weight: () => 0,
  start(cat, mind) {
    mind.speedBoost = 1.25
    setAction(cat, 'catnipHigh')
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (cat.intentTimer < 0.25) {
      lockPose(mind, 'flop', 0.8)
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (!mind.target || distance(cat.position, mind.target) < 24 || every(mind, context, 'zig', 0.65)) {
      mind.target = randomOpenPoint(context, cat.position, 200 * context.memory.sizeScale, 20)
    }
    if (every(mind, context, 'spook', 1.4) && context.memory.random.chance(0.5)) {
      hopInPlace(cat, mind, context, 26 * cat.coat.scale, 0.32, 'startle')
      setEmote(cat, 'startled')
    }
    return seek(cat, mind.target, topSpeed(cat, mind, context))
  },
}
