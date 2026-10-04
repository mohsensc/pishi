import type { Behavior } from '../behavior'
import { boundsCenter, clampToBounds } from '../../bounds'
import { finishBehavior, paceSpeed } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { arrive } from '../helpers/steering'
import { cursorDistance, fleeRadius } from '../helpers/threat'

export const mirrorCursorBehavior: Behavior = {
  id: 'mirrorCursor',
  intent: 'play',
  interruptible: true,
  minDuration: 6,
  maxDuration: 10,
  weight: (cat, mind, context) => {
    if (!context.pointer.active) return 0
    return cursorDistance(cat, context) > fleeRadius(cat, mind, context) * 1.6 ? 0.14 + mind.personality.curiosity * 0.18 : 0
  },
  start(cat, mind) {
    mind.movePose = 'stalk'
    mind.idlePose = 'crouch'
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (!context.pointer.active) return finishBehavior(cat, mind, context)
    const cursor = context.pointer.position
    const center = boundsCenter(context.bounds)
    const mirrored = clampToBounds({ x: center.x * 2 - cursor.x, y: cursor.y }, context.bounds)
    mind.scratchPoints.gaze = cursor
    if (Math.abs(mirrored.x - cursor.x) < fleeRadius(cat, mind, context) * 1.2) return finishBehavior(cat, mind, context)
    return arrive(cat, mirrored, paceSpeed(cat, mind, context, 0.8), 50)
  },
}
