import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { enterPhase, finishBehavior, phaseDone, pointToward, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { randomOpenPoint, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const bunnyHopsBehavior: Behavior = {
  id: 'bunnyHops',
  intent: 'play',
  interruptible: true,
  minDuration: 6,
  maxDuration: 10,
  weight: (cat, mind) => (cat.coat.breed === 'munchkin' ? 0.22 : 0.1) * (0.5 + mind.personality.zoominess),
  start(cat, mind, context) {
    mind.target = randomOpenPoint(context, cat.position, sizeScaled(context, 260), 30)
    mind.scratchNumbers.hops = context.memory.random.integer(6, 10)
    mind.idlePose = 'crouch'
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (mind.phase === 'done') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (mind.phaseTimer < 0.1) return brake(cat, 8)
    const target = mind.target
    mind.attempts += 1
    if (!target || mind.attempts > mind.scratchNumbers.hops || distance(cat.position, target) < sizeScaled(context, 20)) {
      mind.idlePose = 'sit'
      enterPhase(mind, 'done', 0.9)
      return zeroVector
    }
    const stride = sizeScaled(context, cat.coat.breed === 'munchkin' ? 26 : 38)
    const landing = pointToward(cat.position, target, Math.min(stride, distance(cat.position, target)))
    startLeap(cat, mind, context, landing, 0, cat.coat.breed === 'munchkin' ? 12 : 20, 0.3, 'hop', 'none')
    enterPhase(mind, 'hop')
    return zeroVector
  },
}
