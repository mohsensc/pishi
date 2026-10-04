import type { Behavior } from '../behavior'
import { add, distance } from '../../vector'
import { enterPhase, finishBehavior, lateralWiggle, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { randomOpenPoint, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'

export const bellyCrawlBehavior: Behavior = {
  id: 'bellyCrawl',
  intent: 'play',
  interruptible: true,
  minDuration: 8,
  maxDuration: 12,
  weight: (_cat, mind) => 0.06 + mind.personality.curiosity * 0.08,
  start(cat, mind, context) {
    mind.target = randomOpenPoint(context, cat.position, sizeScaled(context, 150), 30)
    mind.scratchPoints.gaze = mind.target
    mind.movePose = 'crouch'
    mind.idlePose = 'crouch'
  },
  update(cat, mind, context) {
    const target = mind.target
    if (!target) return finishBehavior(cat, mind, context)
    if (mind.phase === 'wiggle') {
      if (phaseDone(mind)) {
        startLeap(cat, mind, context, target, 0, 26, 0.38, 'pounce', 'none')
        setEmote(cat, 'playful')
        mind.idlePose = 'sit'
        enterPhase(mind, 'landed', 1.2)
        return zeroVector
      }
      return add(brake(cat, 2), lateralWiggle(cat, 16, 3.2))
    }
    if (mind.phase === 'landed') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (distance(cat.position, target) < sizeScaled(context, 60) || mind.phaseTimer > 7) {
      enterPhase(mind, 'wiggle', randomTimer(context, 0.6, 1.1))
      return zeroVector
    }
    return arrive(cat, target, paceSpeed(cat, mind, context, 0.075), 10)
  },
}
