import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { rotate, scale } from '../../vector'
import { directionTo, enterPhase, finishBehavior, isNight, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { lockPose, lookAt, setEmote } from '../helpers/pose'
import { randomOpenPoint, randomTimer } from '../helpers/queries'
import { brake, seek } from '../helpers/steering'

const skidDamping = 3.6

export const sprintBurstBehavior: Behavior = {
  id: 'sprintBurst',
  intent: 'play',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight: (_cat, mind, context) => (0.08 + mind.personality.zoominess * 0.3) * (isNight(context) ? 0.35 : 1),
  start(cat, mind, context) {
    mind.scratchPoints.heading = directionTo(cat.position, randomOpenPoint(context, null, 0, 30))
    mind.scratchNumbers.bursts = context.memory.random.integer(2, 4)
    mind.idlePose = 'crouch'
    enterPhase(mind, 'burst', randomTimer(context, 0.5, 1.1))
    if (context.memory.random.chance(0.5)) setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const random = context.memory.random
    if (mind.phase === 'burst') {
      mind.speedBoost = 1.5
      const heading = mind.scratchPoints.heading
      const goal = clampToBounds({ x: cat.position.x + heading.x * sizeScaled(context, 200), y: cat.position.y + heading.y * sizeScaled(context, 140) }, context.bounds)
      if (!phaseDone(mind) && Math.hypot(goal.x - cat.position.x, goal.y - cat.position.y) > sizeScaled(context, 30)) return seek(cat, goal, paceSpeed(cat, mind, context, 1))
      mind.speedBoost = 1
      lockPose(mind, 'crouch', 0.32)
      enterPhase(mind, 'skid', 0.32)
      return cat.velocity
    }
    if (mind.phase === 'skid') {
      cat.velocity = scale(cat.velocity, Math.exp(-skidDamping * context.dt))
      if (!phaseDone(mind)) return cat.velocity
      mind.attempts += 1
      const turn = random.sign() * random.range(100, 170)
      mind.scratchPoints.heading = rotate(mind.scratchPoints.heading, turn)
      const glance = { x: cat.position.x + mind.scratchPoints.heading.x * 80, y: cat.position.y + mind.scratchPoints.heading.y * 40 }
      lookAt(cat, glance)
      mind.scratchPoints.gaze = glance
      enterPhase(mind, 'glance', randomTimer(context, 0.15, 0.45))
      return brake(cat, 6)
    }
    if (mind.phase === 'glance') {
      if (!phaseDone(mind)) return brake(cat, 6)
      delete mind.scratchPoints.gaze
      if (mind.attempts >= mind.scratchNumbers.bursts) return finishBehavior(cat, mind, context)
      enterPhase(mind, 'burst', randomTimer(context, 0.45, 1))
      return brake(cat)
    }
    return finishBehavior(cat, mind, context)
  },
  finish(_cat, mind) {
    mind.speedBoost = 1
    delete mind.scratchPoints.gaze
  },
}
