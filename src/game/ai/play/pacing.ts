import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { distance } from '../../vector'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'

export const pacingBehavior: Behavior = {
  id: 'pacing',
  intent: 'wander',
  interruptible: true,
  minDuration: 7,
  maxDuration: 11,
  weight: (_cat, mind) => 0.06 + (1 - mind.personality.laziness) * 0.08,
  start(cat, mind, context) {
    const random = context.memory.random
    const reach = sizeScaled(context, random.range(70, 110))
    const angle = random.range(-0.35, 0.35)
    mind.scratchPoints.from = clampToBounds(cat.position, context.bounds)
    mind.scratchPoints.to = clampToBounds({ x: cat.position.x + Math.cos(angle) * reach * random.sign(), y: cat.position.y + Math.sin(angle) * reach }, context.bounds)
    mind.scratchNumbers.turns = random.integer(4, 6)
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    if (mind.phase === 'turn') {
      if (phaseDone(mind)) enterPhase(mind, 'walk')
      return brake(cat)
    }
    const goal = mind.attempts % 2 === 0 ? mind.scratchPoints.to : mind.scratchPoints.from
    if (distance(cat.position, goal) < sizeScaled(context, 8)) {
      mind.attempts += 1
      if (mind.attempts === 2) setEmote(cat, 'annoyed')
      if (mind.attempts >= mind.scratchNumbers.turns) return finishBehavior(cat, mind, context)
      enterPhase(mind, 'turn', 0.35)
      return zeroVector
    }
    return arrive(cat, goal, paceSpeed(cat, mind, context, 0.34), 16)
  },
}
