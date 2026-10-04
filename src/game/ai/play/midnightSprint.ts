import type { Behavior } from '../behavior'
import { distance, scale } from '../../vector'
import { enterPhase, finishBehavior, isNight, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { randomOpenPoint, randomTimer, zeroVector } from '../helpers/queries'
import { brake, seek } from '../helpers/steering'

export const midnightSprintBehavior: Behavior = {
  id: 'midnightSprint',
  intent: 'play',
  interruptible: true,
  minDuration: 6,
  maxDuration: 9,
  weight: (_cat, mind, context) => mind.personality.zoominess * 0.12 * (isNight(context) ? 3 : 1),
  start(cat, mind, context) {
    let goal = randomOpenPoint(context, null, 0, 30)
    for (let attempt = 0; attempt < 4 && distance(goal, cat.position) < sizeScaled(context, 260); attempt += 1) goal = randomOpenPoint(context, null, 0, 30)
    mind.target = goal
    mind.idlePose = 'sit'
    mind.speedBoost = 1.25
    hopInPlace(cat, mind, context, 18, 0.24, 'hop')
  },
  update(cat, mind, context) {
    if (mind.phase === 'innocent') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      mind.idlePose = mind.phaseTimer > 0.9 ? 'groom' : 'sit'
      return brake(cat, 6)
    }
    if (!mind.target || distance(cat.position, mind.target) < sizeScaled(context, 20) || mind.phaseTimer > 3.5) {
      mind.speedBoost = 1
      cat.velocity = scale(cat.velocity, 0.15)
      enterPhase(mind, 'innocent', randomTimer(context, 2.2, 3.4))
      return zeroVector
    }
    return seek(cat, mind.target, paceSpeed(cat, mind, context, 1))
  },
}
