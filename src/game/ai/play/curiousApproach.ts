import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, headingVelocity, paceSpeed, phaseDone, pointerCalm } from '../helpers/playSteering'
import { faceToward, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { cursorDistance, fleeRadius } from '../helpers/threat'
import { subtract } from '../../vector'

export const curiousApproachBehavior: Behavior = {
  id: 'curiousApproach',
  intent: 'explore',
  interruptible: true,
  minDuration: 7,
  maxDuration: 11,
  weight: (cat, mind, context) => {
    if (!pointerCalm(context)) return 0
    const gap = cursorDistance(cat, context)
    return gap > fleeRadius(cat, mind, context) && gap < 500 * context.memory.sizeScale ? 0.14 + mind.personality.curiosity * 0.2 : 0
  },
  start(cat, mind) {
    mind.movePose = 'sniff'
    mind.idlePose = 'sniff'
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    if (!context.pointer.active) return finishBehavior(cat, mind, context)
    const cursor = context.pointer.position
    mind.scratchPoints.gaze = cursor
    const radius = fleeRadius(cat, mind, context)
    if (mind.phase === 'sniff') {
      if (phaseDone(mind)) {
        enterPhase(mind, 'backOff', randomTimer(context, 0.8, 1.2))
        if (context.memory.random.chance(0.4)) setEmote(cat, 'startled')
      }
      return brake(cat)
    }
    if (mind.phase === 'backOff') {
      faceToward(cat, mind, cursor, 0.3)
      if (phaseDone(mind)) {
        mind.idlePose = 'sit'
        enterPhase(mind, 'done', 1)
        return zeroVector
      }
      return headingVelocity(subtract(cat.position, cursor), paceSpeed(cat, mind, context, 0.22))
    }
    if (mind.phase === 'done') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (cursorDistance(cat, context) < radius * 0.85 || !pointerCalm(context, 500)) {
      enterPhase(mind, 'sniff', randomTimer(context, 0.8, 1.5))
      return zeroVector
    }
    return arrive(cat, cursor, paceSpeed(cat, mind, context, 0.16), 20)
  },
}
