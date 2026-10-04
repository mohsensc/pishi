import type { Behavior } from '../behavior'
import { finishBehavior, pointerCalm } from '../helpers/playSteering'
import { faceToward, setEmote } from '../helpers/pose'
import { brake } from '../helpers/steering'
import { cursorDistance, fleeRadius } from '../helpers/threat'

export const slowBlinkBehavior: Behavior = {
  id: 'slowBlink',
  intent: 'socialize',
  interruptible: true,
  minDuration: 3,
  maxDuration: 5,
  weight: (cat, mind, context) => {
    if (!pointerCalm(context)) return 0
    const gap = cursorDistance(cat, context)
    return gap > fleeRadius(cat, mind, context) && gap < 480 * context.memory.sizeScale ? 0.1 + cat.affection * 0.5 : 0
  },
  start(_cat, mind) {
    mind.idlePose = 'sit'
    mind.scratchNumbers.nextBlink = 0.8
  },
  update(cat, mind, context) {
    if (!context.pointer.active) return finishBehavior(cat, mind, context)
    const cursor = context.pointer.position
    mind.scratchPoints.gaze = cursor
    faceToward(cat, mind, cursor, 0.4)
    if (mind.behaviorElapsed > mind.scratchNumbers.nextBlink) {
      mind.scratchNumbers.nextBlink = mind.behaviorElapsed + context.memory.random.range(1.6, 2.6)
      setEmote(cat, 'love')
      mind.idlePose = mind.idlePose === 'sit' ? 'loaf' : 'sit'
      cat.affection = Math.min(1, cat.affection + 0.01)
    }
    return brake(cat)
  },
}
