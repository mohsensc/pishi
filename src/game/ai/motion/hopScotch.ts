import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { rotate, scale } from '../../vector'
import { directionTo, edgeBounce, enterPhase, finishBehavior, isNight, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { catRadius, isOpenGround, randomOpenPoint, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const hopScotchBehavior: Behavior = {
  id: 'hopScotch',
  intent: 'play',
  interruptible: true,
  minDuration: 4,
  maxDuration: 8,
  weight: (cat, mind, context) => (cat.coat.breed === 'persian' ? 0.03 : 0.08 + mind.personality.zoominess * 0.14) * (isNight(context) ? 0.4 : 1),
  start(cat, mind, context) {
    mind.scratchPoints.heading = directionTo(cat.position, randomOpenPoint(context, cat.position, sizeScaled(context, 300), 30))
    mind.scratchNumbers.leaps = context.memory.random.integer(4, 7)
    mind.scratchNumbers.curve = context.memory.random.sign() * context.memory.random.range(18, 55)
    mind.idlePose = 'walk'
    if (context.memory.random.chance(0.5)) setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const random = context.memory.random
    if (mind.phase === 'done') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (mind.phase === 'pause' && !phaseDone(mind)) return brake(cat, 7)
    if (mind.attempts >= mind.scratchNumbers.leaps) {
      mind.idlePose = 'sit'
      enterPhase(mind, 'done', random.range(0.4, 0.8))
      return zeroVector
    }
    const bounced = edgeBounce(cat, mind.scratchPoints.heading, context, sizeScaled(context, 60))
    let heading = rotate(bounced.heading, mind.scratchNumbers.curve * (random.chance(0.25) ? -1.6 : 1))
    const stride = sizeScaled(context, cat.coat.breed === 'munchkin' ? 40 : random.range(52, 78))
    let landing = clampToBounds({ x: cat.position.x + heading.x * stride, y: cat.position.y + heading.y * stride * 0.7 }, context.bounds)
    if (!isOpenGround(landing, context, catRadius(cat))) {
      heading = scale(heading, -1)
      landing = clampToBounds({ x: cat.position.x + heading.x * stride, y: cat.position.y + heading.y * stride * 0.7 }, context.bounds)
    }
    mind.scratchPoints.heading = heading
    const peak = (cat.coat.breed === 'munchkin' ? 16 : 26) + random.range(0, 14)
    startLeap(cat, mind, context, landing, 0, peak, 0.34 + stride / 900, mind.attempts % 3 === 2 ? 'pounce' : 'jump', 'none')
    mind.attempts += 1
    enterPhase(mind, 'pause', random.range(0.05, 0.3))
    return zeroVector
  },
}
