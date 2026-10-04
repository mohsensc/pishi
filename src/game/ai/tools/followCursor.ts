import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { cursorGround } from './support/cursorGround'
import { gazeAt } from './support/phases'

export const followCursorBehavior: Behavior = {
  id: 'followCursor',
  intent: 'socialize',
  interruptible: true,
  minDuration: 5,
  maxDuration: 9,
  weight(cat, _mind, context) {
    if (context.pointer.tool !== 'hand' || !context.pointer.active || cat.affection < 0.4) return 0
    return cat.affection * 0.35
  },
  start(cat, mind) {
    setEmote(cat, 'curious')
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    if (!context.pointer.active) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const center = cursorGround(cat, context)
    gazeAt(cat, mind, context.pointer.position, 0.2)
    const gap = distance(cat.position, center)
    const trail = 80 * context.memory.sizeScale
    if (gap < trail) return brake(cat)
    const pace = gap > trail * 3 ? 0.7 : 0.38
    return arrive(cat, center, topSpeed(cat, mind, context) * pace, trail)
  },
}
