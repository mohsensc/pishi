import type { Behavior } from '../behavior'
import { distance, pointToward } from '../../vector'
import { clampToBounds } from '../../bounds'
import { petDwellOf } from '../../tools/petting'
import { lockPose, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { cursorGround } from './support/cursorGround'
import { chain, gazeAt } from './support/phases'

export const presentBellyBehavior: Behavior = {
  id: 'presentBelly',
  intent: 'socialize',
  interruptible: false,
  ownsTimer: true,
  minDuration: 4,
  maxDuration: 7,
  weight(cat, _mind, context) {
    if (context.pointer.tool !== 'hand' || !context.pointer.active || cat.affection < 0.55) return 0
    return distance(cat.position, context.pointer.position) < 320 * context.memory.sizeScale ? 0.22 : 0
  },
  start(_cat, mind) {
    mind.movePose = 'walk'
  },
  update(cat, mind, context) {
    if (!context.pointer.active || mind.behaviorElapsed > 9) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const center = cursorGround(cat, context)
    if (mind.phase === 'start') {
      const spot = clampToBounds(pointToward(center, cat.position, 50 * cat.coat.scale), context.bounds)
      if (distance(cat.position, spot) > 12 && mind.phaseTimer < 4) return arrive(cat, spot, topSpeed(cat, mind, context) * 0.35, 20)
      mind.phase = 'belly'
      mind.phaseTimer = 0
      setEmote(cat, 'love')
    }
    mind.idlePose = 'bellyUp'
    gazeAt(cat, mind, context.pointer.position, 0.4)
    if (petDwellOf(context, cat.id) > 0.25) {
      if (context.memory.random.chance(0.5)) {
        lockPose(mind, 'wrestle', 0.9)
        setEmote(cat, 'playful')
        endBehavior(cat, mind, context)
      } else chain(cat, mind, context, 'getPetted', 6)
      return zeroVector
    }
    if (mind.phaseTimer > 5) endBehavior(cat, mind, context)
    return brake(cat)
  },
}
