import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, paceSpeed, phaseDone } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { randomTimer } from '../helpers/queries'
import { brake, orbit } from '../helpers/steering'
import { cursorDistance, fleeRadius } from '../helpers/threat'

export const orbitCursorBehavior: Behavior = {
  id: 'orbitCursor',
  intent: 'play',
  interruptible: true,
  minDuration: 6,
  maxDuration: 10,
  weight: (cat, mind, context) => {
    if (!context.pointer.active) return 0
    const gap = cursorDistance(cat, context)
    return gap > fleeRadius(cat, mind, context) * 1.1 && gap < 520 * context.memory.sizeScale ? 0.16 + mind.personality.boldness * 0.2 : 0
  },
  start(cat, mind, context) {
    mind.scratchNumbers.direction = context.memory.random.sign()
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
    enterPhase(mind, 'orbit', randomTimer(context, 4, 7))
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    if (!context.pointer.active) return finishBehavior(cat, mind, context)
    const cursor = context.pointer.position
    mind.scratchPoints.gaze = cursor
    if (phaseDone(mind)) return finishBehavior(cat, mind, context)
    const radius = fleeRadius(cat, mind, context) * 1.5
    const direction: 1 | -1 = mind.scratchNumbers.direction > 0 ? 1 : -1
    if (cursorDistance(cat, context) < radius * 0.7) return brake(cat)
    return orbit(cat, cursor, radius, paceSpeed(cat, mind, context, 0.4), direction)
  },
}
