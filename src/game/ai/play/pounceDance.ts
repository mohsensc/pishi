import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const pounceDanceBehavior: Behavior = {
  id: 'pounceDance',
  intent: 'play',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight: (_cat, mind) => 0.05 + mind.personality.zoominess * 0.14,
  start(cat, mind, context) {
    mind.scratchPoints.home = { x: cat.position.x, y: cat.position.y }
    mind.scratchNumbers.hops = context.memory.random.integer(4, 7)
    mind.idlePose = 'crouch'
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (mind.phase === 'done') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (mind.phaseTimer < 0.22) return brake(cat, 8)
    mind.attempts += 1
    if (mind.attempts > mind.scratchNumbers.hops) {
      lockPose(mind, 'bat', 0.3)
      mind.idlePose = 'sit'
      enterPhase(mind, 'done', 0.9)
      return zeroVector
    }
    const home = mind.scratchPoints.home
    const side = mind.attempts % 2 === 0 ? 1 : -1
    const landing = { x: home.x + side * sizeScaled(context, 22), y: home.y + (mind.attempts % 3 === 0 ? sizeScaled(context, 6) : 0) }
    startLeap(cat, mind, context, landing, 0, 22, 0.28, mind.attempts % 2 === 0 ? 'pounce' : 'hop', 'none')
    cat.facing = side > 0 ? -1 : 1
    enterPhase(mind, 'dance')
    return zeroVector
  },
}
