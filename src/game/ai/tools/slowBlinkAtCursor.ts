import type { Behavior } from '../behavior'
import { distance, pointToward } from '../../vector'
import { clampToBounds } from '../../bounds'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { cursorGround } from './support/cursorGround'
import { every, gazeAt } from './support/phases'

export const slowBlinkAtCursorBehavior: Behavior = {
  id: 'slowBlinkAtCursor',
  intent: 'socialize',
  interruptible: true,
  minDuration: 3,
  maxDuration: 6,
  weight(cat, _mind, context) {
    if (context.pointer.tool !== 'hand' || !context.pointer.active || cat.affection < 0.3) return 0
    return distance(cat.position, context.pointer.position) < 520 * context.memory.sizeScale ? cat.affection * 0.4 : 0
  },
  start(_cat, mind, context) {
    mind.idlePose = 'loaf'
    mind.scratchNumbers.ring = context.memory.random.range(90, 140)
  },
  update(cat, mind, context) {
    if (!context.pointer.active) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const center = cursorGround(cat, context)
    gazeAt(cat, mind, context.pointer.position, 0.6)
    if (every(mind, context, 'blink', 1.6)) setEmote(cat, 'love')
    const ring = (mind.scratchNumbers.ring ?? 110) * context.memory.sizeScale
    const gap = distance(cat.position, center)
    if (gap > ring * 1.6 || gap < ring * 0.5) {
      const spot = clampToBounds(pointToward(center, cat.position, ring), context.bounds)
      return arrive(cat, spot, topSpeed(cat, mind, context) * 0.3, 30)
    }
    return brake(cat)
  },
}
