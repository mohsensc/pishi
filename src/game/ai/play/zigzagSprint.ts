import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { distance, perpendicular, scale } from '../../vector'
import { directionTo, enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { randomOpenPoint, zeroVector } from '../helpers/queries'
import { brake, seek } from '../helpers/steering'

export const zigzagSprintBehavior: Behavior = {
  id: 'zigzagSprint',
  intent: 'play',
  interruptible: true,
  minDuration: 5,
  maxDuration: 9,
  weight: (_cat, mind) => mind.personality.zoominess * 0.2,
  start(cat, mind, context) {
    const goal = randomOpenPoint(context, null, 0, 30)
    mind.scratchPoints.heading = directionTo(cat.position, goal)
    mind.scratchNumbers.legs = context.memory.random.integer(5, 8)
    mind.scratchNumbers.side = context.memory.random.sign()
    mind.speedBoost = 1.1
    mind.idlePose = 'crouch'
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (mind.phase === 'done') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (!mind.target || distance(cat.position, mind.target) < sizeScaled(context, 14) || mind.phaseTimer > 1.4) {
      if (mind.attempts >= mind.scratchNumbers.legs) {
        mind.speedBoost = 1
        mind.idlePose = 'sit'
        setEmote(cat, 'proud')
        enterPhase(mind, 'done', 1.2)
        return zeroVector
      }
      mind.attempts += 1
      mind.phaseTimer = 0
      mind.scratchNumbers.side *= -1
      const heading = mind.scratchPoints.heading
      const leg = scale(heading, sizeScaled(context, 70))
      const swing = scale(perpendicular(heading), sizeScaled(context, 55) * mind.scratchNumbers.side)
      const next = clampToBounds({ x: cat.position.x + leg.x + swing.x, y: cat.position.y + (leg.y + swing.y) * 0.8 }, context.bounds)
      if (distance(next, cat.position) < sizeScaled(context, 30)) mind.scratchPoints.heading = scale(heading, -1)
      mind.target = next
      cat.velocity = scale(cat.velocity, 0.25)
    }
    return seek(cat, mind.target, paceSpeed(cat, mind, context, 1))
  },
}
