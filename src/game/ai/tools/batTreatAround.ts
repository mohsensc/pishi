import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { startLeap } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { mouthPoint, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { chain, enterPhase, gazeAt, phaseDone } from './support/phases'
import { findTreat } from './support/treatQueries'

export const batTreatAroundBehavior: Behavior = {
  id: 'batTreatAround',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  minDuration: 4,
  maxDuration: 5,
  weight: () => 0,
  start(cat, mind, context) {
    setEmote(cat, 'playful')
    mind.scratchNumbers.bats = context.memory.random.integer(2, 4)
    enterPhase(mind, 'settle', 0.2)
  },
  update(cat, mind, context) {
    const treat = findTreat(context, mind.scratchIds.treat)
    if (!treat || treat.eatenAt !== null || treat.claimedByCatId !== cat.id || mind.behaviorElapsed > 8) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAt(cat, mind, treat.position, 0.3)
    const close = distance(mouthPoint(cat), treat.position) < 20 * cat.coat.scale
    if (!close) return arrive(cat, treat.position, topSpeed(cat, mind, context) * 0.55, 20)
    if (!phaseDone(mind)) return brake(cat)
    if ((mind.scratchNumbers.bats ?? 0) <= 0) {
      chain(cat, mind, context, 'eatDroppedTreat', 3.4)
      mind.scratchIds.treat = treat.id
      return zeroVector
    }
    mind.scratchNumbers.bats = (mind.scratchNumbers.bats ?? 1) - 1
    const random = context.memory.random
    treat.velocity = { x: cat.facing * random.range(90, 170), y: random.range(-60, 60) }
    treat.verticalSpeed = random.range(80, 180)
    lockPose(mind, 'bat', 0.25)
    if (random.chance(0.5)) {
      const landing = { x: treat.position.x + treat.velocity.x * 0.35, y: treat.position.y + treat.velocity.y * 0.35 }
      startLeap(cat, mind, context, landing, 0, 22 * cat.coat.scale, 0.34, 'pounce', 'none')
    }
    enterPhase(mind, 'settle', random.range(0.35, 0.7))
    return brake(cat)
  },
}
