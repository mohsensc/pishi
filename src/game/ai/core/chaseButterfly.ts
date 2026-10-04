import type { Behavior } from '../behavior'
import { scareButterfly } from '../../butterflies'
import { add, distance } from '../../vector'
import { startLeap } from '../helpers/leap'
import { findButterfly, nearestButterfly, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { threatened, topSpeed } from '../helpers/threat'
import { beginFlee, endBehavior } from '../helpers/transitions'

export const chaseButterflyBehavior: Behavior = {
  id: 'chaseButterfly',
  intent: 'chaseButterfly',
  interruptible: false,
  ownsTimer: true,
  minDuration: 5,
  maxDuration: 8,
  weight: (cat, mind, context) => (nearestButterfly(cat, context, 380 * context.memory.sizeScale) ? mind.personality.curiosity * 0.3 : 0),
  start(cat, mind, context) {
    mind.butterflyId = nearestButterfly(cat, context, 380 * context.memory.sizeScale)?.id ?? null
  },
  update(cat, mind, context) {
    const butterfly = findButterfly(context, mind.butterflyId)
    if (!butterfly || cat.intentTimer <= 0 || mind.attempts >= 3) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (threatened(cat, mind, context, 0.6)) {
      beginFlee(cat, mind, context, 1)
      return zeroVector
    }
    const scaleFactor = context.memory.sizeScale
    const gap = distance(cat.position, butterfly.position)
    if (mind.phase === 'crouch') {
      mind.idlePose = 'crouch'
      if (mind.phaseTimer > mind.holdDuration) {
        const lead = add(butterfly.position, { x: Math.cos(butterfly.heading) * 24, y: Math.sin(butterfly.heading) * 16 })
        const lift = Math.min(butterfly.height, 30 + 60 * mind.personality.jumpPower)
        startLeap(cat, mind, context, lead, 0, lift, 0.38 + lift / 600, 'pounce', 'butterfly')
        scareButterfly(butterfly, cat.position)
        mind.attempts += 1
        mind.phase = 'stalk'
      }
      return brake(cat)
    }
    mind.phase = 'stalk'
    mind.movePose = 'stalk'
    if (gap < 90 * scaleFactor && butterfly.height < 40 + 70 * mind.personality.jumpPower) {
      mind.phase = 'crouch'
      mind.phaseTimer = 0
      mind.holdDuration = randomTimer(context, 0.3, 0.6)
      return zeroVector
    }
    const speed = topSpeed(cat, mind, context) * (gap > 200 * scaleFactor ? 0.75 : 0.42)
    return arrive(cat, butterfly.position, speed, 30)
  },
}
