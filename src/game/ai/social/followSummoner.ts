import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { distance } from '../../vector'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { raiseAffection } from '../tools/support/affection'
import { cursorGround, pointerSpeed } from '../tools/support/cursorGround'
import { every, gazeAt } from '../tools/support/phases'
import { followSummonerId, isGrounded, isHeldByPointer, isSummoned } from './callQueries'

const summonUrgency = 6.5

export const followSummonerBehavior: Behavior = {
  id: followSummonerId,
  intent: 'socialize',
  interruptible: true,
  ownsTimer: true,
  recencyPenalty: 0,
  overridesCommitment: true,
  minDuration: 10,
  maxDuration: 10,
  weight: () => 0,
  urgency(cat, mind, context) {
    if (!isSummoned(cat, context) || !isGrounded(cat, mind) || isHeldByPointer(cat, context)) return 0
    return summonUrgency
  },
  start(cat, mind) {
    setEmote(cat, 'love')
    mind.speedBoost = 1.12
    mind.idlePose = 'sit'
    mind.movePose = null
  },
  update(cat, mind, context) {
    if (!isSummoned(cat, context)) {
      cat.followUntil = null
      setEmote(cat, 'love')
      endBehavior(cat, mind, context)
      return zeroVector
    }
    mind.behaviorUrgency = summonUrgency
    if (!context.pointer.active) {
      mind.idlePose = 'sit'
      return brake(cat)
    }
    const center = cursorGround(cat, context)
    gazeAt(cat, mind, context.pointer.position, 0.25)
    const gap = distance(cat.position, center)
    const trail = 58 * context.memory.sizeScale * cat.coat.scale
    if (every(mind, context, 'love', 2.6)) setEmote(cat, 'love')
    if (gap < trail) {
      mind.scratchNumbers.settled = (mind.scratchNumbers.settled ?? 0) + context.dt
      if (pointerSpeed(context) < 60 && every(mind, context, 'rub', 1.8)) {
        lockPose(mind, 'purr', 0.7)
        raiseAffection(cat, 0.01)
        spawnEffect(context.world, 'hearts', cat.position, cat.height + 30 * cat.coat.scale, null, 0.45)
      }
      mind.idlePose = mind.scratchNumbers.settled > 1.4 ? 'loaf' : 'sit'
      return brake(cat)
    }
    mind.scratchNumbers.settled = 0
    if (gap > trail * 5 && context.memory.random.chance(context.dt * 0.5)) {
      hopInPlace(cat, mind, context, 16, 0.26, 'hop')
      return zeroVector
    }
    const pace = gap > trail * 3.5 ? 1 : gap > trail * 1.8 ? 0.7 : 0.42
    return arrive(cat, center, topSpeed(cat, mind, context) * pace, trail * 1.5)
  },
}
