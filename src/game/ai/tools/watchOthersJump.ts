import type { Behavior } from '../behavior'
import { add, distance, normalize, scale, subtract } from '../../vector'
import { clampToBounds } from '../../bounds'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { canJoinToyAttention, contestIsFull, dropBallFor, contestToy, isToyReady } from './support/contest'
import { chain, gazeAtToy } from './support/phases'
import { checkChance } from './support/toolQueries'

export const watchOthersJumpBehavior: Behavior = {
  id: 'watchOthersJump',
  intent: 'play',
  interruptible: true,
  minDuration: 4,
  maxDuration: 9,
  recencyPenalty: 0.3,
  weight: () => 0,
  urgency(cat, mind, context) {
    const toy = canJoinToyAttention(cat, mind, context, 460)
    if (!toy || !contestIsFull(context, cat.id)) return 0
    return checkChance(context, 0.3 + mind.personality.curiosity * 0.5) ? 2.2 : 0
  },
  start(cat, mind, context) {
    dropBallFor(cat, mind, context)
    mind.idlePose = context.memory.random.chance(0.5) ? 'loaf' : 'sit'
    mind.scratchNumbers.ring = context.memory.random.range(95, 140)
  },
  update(cat, mind, context) {
    const toy = contestToy(context)
    if (!toy) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAtToy(cat, mind, toy)
    if (mind.behaviorElapsed > 1 && isToyReady(toy) && !contestIsFull(context, cat.id) && context.memory.random.chance(context.dt * 1.5)) {
      chain(cat, mind, context, 'gatherAround', 2.6)
      return zeroVector
    }
    if (mind.phaseTimer > 2.2) {
      mind.phaseTimer = 0
      mind.idlePose = mind.idlePose === 'loaf' ? 'crouch' : 'loaf'
    }
    const ring = (mind.scratchNumbers.ring ?? 110) * context.memory.sizeScale
    const outward = normalize(subtract(cat.position, toy.position))
    const spot = clampToBounds(add(toy.position, scale(outward.x === 0 && outward.y === 0 ? { x: 1, y: 0 } : outward, ring)), context.bounds)
    return distance(cat.position, spot) > 12 ? arrive(cat, spot, topSpeed(cat, mind, context) * 0.35, 30) : brake(cat)
  },
}
