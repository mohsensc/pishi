import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { randomOpenPoint, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake, seek } from '../helpers/steering'

export const stopAndGoStalkBehavior: Behavior = {
  id: 'stopAndGoStalk',
  intent: 'play',
  interruptible: true,
  minDuration: 8,
  maxDuration: 12,
  weight: (_cat, mind) => 0.08 + mind.personality.curiosity * 0.1,
  start(cat, mind, context) {
    mind.target = randomOpenPoint(context, cat.position, sizeScaled(context, 230), 30)
    mind.scratchPoints.gaze = mind.target
    mind.movePose = 'stalk'
    mind.idlePose = 'crouch'
    enterPhase(mind, 'creep', randomTimer(context, 0.8, 1.4))
  },
  update(cat, mind, context) {
    const target = mind.target
    if (!target) return finishBehavior(cat, mind, context)
    if (mind.phase === 'landed') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    const gap = distance(cat.position, target)
    if (mind.phase === 'sprint') {
      if (gap < sizeScaled(context, 60)) {
        startLeap(cat, mind, context, target, 0, 24, 0.34, 'pounce', 'none')
        setEmote(cat, 'proud')
        mind.idlePose = 'sit'
        enterPhase(mind, 'landed', 1)
        return zeroVector
      }
      return seek(cat, target, paceSpeed(cat, mind, context, 1))
    }
    if (mind.phase === 'freeze') {
      if (phaseDone(mind)) enterPhase(mind, 'creep', randomTimer(context, 0.8, 1.4))
      return brake(cat, 8)
    }
    if (phaseDone(mind)) {
      mind.attempts += 1
      if (mind.attempts >= 3 || gap < sizeScaled(context, 110)) {
        setEmote(cat, 'playful')
        enterPhase(mind, 'sprint')
      } else enterPhase(mind, 'freeze', randomTimer(context, 0.5, 1))
      return zeroVector
    }
    return arrive(cat, target, paceSpeed(cat, mind, context, 0.14), 20)
  },
}
