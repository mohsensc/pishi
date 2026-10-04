import type { Behavior } from '../behavior'
import { isDusk } from '../../tools/dayCycle'
import { distance } from '../../vector'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { randomOpenPoint, zeroVector } from '../helpers/queries'
import { seek } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'

export const duskZoomiesBehavior: Behavior = {
  id: 'duskZoomies',
  intent: 'play',
  interruptible: false,
  minDuration: 5,
  maxDuration: 8,
  weight: (_cat, mind, context) => (isDusk(context.world.dayTime) ? mind.personality.zoominess * 2.4 : 0),
  start(cat, mind, context) {
    mind.speedBoost = 1.2
    mind.scratchNumbers.laps = context.memory.random.integer(3, 5)
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (!mind.target || distance(cat.position, mind.target) < 30) {
      mind.scratchNumbers.laps = (mind.scratchNumbers.laps ?? 1) - 1
      if (mind.scratchNumbers.laps < 0 || cat.intentTimer < 0.3) {
        lockPose(mind, context.memory.random.chance(0.5) ? 'flop' : 'stretch', 0.8)
        endBehavior(cat, mind, context)
        return zeroVector
      }
      if (mind.target) hopInPlace(cat, mind, context, 26 * cat.coat.scale, 0.3, 'hop')
      mind.target = randomOpenPoint(context, null, 0, 30)
    }
    return seek(cat, mind.target, topSpeed(cat, mind, context))
  },
}
