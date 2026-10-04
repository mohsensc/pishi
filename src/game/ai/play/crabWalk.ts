import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { enterPhase, finishBehavior, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const crabWalkBehavior: Behavior = {
  id: 'crabWalk',
  intent: 'play',
  interruptible: true,
  minDuration: 5,
  maxDuration: 8,
  weight: (_cat, mind) => 0.06 + mind.personality.zoominess * 0.12,
  start(cat, mind, context) {
    const random = context.memory.random
    mind.scratchNumbers.side = random.sign()
    mind.scratchNumbers.facing = random.sign()
    mind.scratchNumbers.hops = random.integer(6, 10)
    mind.idlePose = 'arch'
    mind.movePose = 'arch'
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const facing: 1 | -1 = mind.scratchNumbers.facing > 0 ? 1 : -1
    cat.facing = facing
    mind.facingHold = 0.4
    mind.scratchPoints.gaze = { x: cat.position.x + facing * 90, y: cat.position.y - 12 }
    if (mind.phase === 'done') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (mind.phaseTimer < 0.12) return brake(cat)
    mind.attempts += 1
    if (mind.attempts > mind.scratchNumbers.hops) {
      mind.idlePose = 'sit'
      enterPhase(mind, 'done', 0.8)
      return zeroVector
    }
    if (mind.attempts === Math.ceil(mind.scratchNumbers.hops / 2)) mind.scratchNumbers.side *= -1
    const step = sizeScaled(context, 16)
    let landing = clampToBounds({ x: cat.position.x - facing * step * 0.25, y: cat.position.y + mind.scratchNumbers.side * step }, context.bounds)
    if (Math.abs(landing.y - cat.position.y) < 2) {
      mind.scratchNumbers.side *= -1
      landing = clampToBounds({ x: landing.x, y: cat.position.y + mind.scratchNumbers.side * step }, context.bounds)
    }
    startLeap(cat, mind, context, landing, 0, 10, 0.24, 'arch', 'none')
    cat.facing = facing
    enterPhase(mind, 'hop')
    return zeroVector
  },
}
