import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { add, length, normalize, scale, subtract } from '../../vector'
import { enterPhase, finishBehavior, headingVelocity, paceSpeed, phaseDone } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { startleHop } from '../helpers/reactions'
import { arrive } from '../helpers/steering'
import { cursorDistance, fleeRadius } from '../helpers/threat'

export const sneakBehindCursorBehavior: Behavior = {
  id: 'sneakBehindCursor',
  intent: 'play',
  interruptible: true,
  minDuration: 8,
  maxDuration: 12,
  weight: (cat, mind, context) => {
    if (!context.pointer.active) return 0
    const gap = cursorDistance(cat, context)
    return gap > fleeRadius(cat, mind, context) * 1.2 && gap < 600 * context.memory.sizeScale ? 0.14 + mind.personality.boldness * 0.2 : 0
  },
  start(_cat, mind) {
    mind.movePose = 'stalk'
    mind.idlePose = 'crouch'
  },
  update(cat, mind, context) {
    if (!context.pointer.active) return finishBehavior(cat, mind, context)
    const cursor = context.pointer.position
    if (mind.phase === 'escape') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return headingVelocity(subtract(cat.position, cursor), paceSpeed(cat, mind, context, 0.9))
    }
    mind.scratchPoints.gaze = cursor
    const radius = fleeRadius(cat, mind, context)
    if (cursorDistance(cat, context) < radius * 0.78) {
      startleHop(cat, mind, context, cursor, 26)
      enterPhase(mind, 'escape', 0.9)
      return zeroVector
    }
    const motion = context.pointer.velocity
    const behind = length(motion) > 40 ? normalize(scale(motion, -1)) : normalize(subtract(cat.position, cursor))
    const spot = clampToBounds(add(cursor, scale(behind, radius * 0.7)), context.bounds)
    if (mind.phaseTimer > 1.5 && cat.emote === null && mind.attempts === 0) {
      mind.attempts = 1
      setEmote(cat, 'playful')
    }
    return arrive(cat, spot, paceSpeed(cat, mind, context, 0.3), 30)
  },
}
