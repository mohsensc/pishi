import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { PET_DWELL_SECONDS } from '../../tools/toolConstants'
import { petDwellOf } from '../../tools/petting'
import { lockPose, setAction, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { endBehavior } from '../helpers/transitions'
import { isSummoned } from '../social/callQueries'
import { raiseAffection } from './support/affection'
import { cursorOnBody, pointerSpeed } from './support/cursorGround'
import { chain, every, gazeAt } from './support/phases'

export const getPettedBehavior: Behavior = {
  id: 'getPetted',
  intent: 'socialize',
  interruptible: false,
  ownsTimer: true,
  recencyPenalty: 0,
  minDuration: 4,
  maxDuration: 10,
  weight: () => 0,
  urgency(cat, mind, context) {
    if (context.pointer.tool !== 'hand' || cat.hidden || cat.heldBallId || mind.leap || cat.height > 1) return 0
    if (cat.behavior === 'presentBelly' || isSummoned(cat, context)) return 0
    return petDwellOf(context, cat.id) > PET_DWELL_SECONDS ? 6 : 0
  },
  start(cat, mind) {
    mind.idlePose = 'purr'
    setEmote(cat, 'love')
    setAction(cat, 'purr')
  },
  update(cat, mind, context) {
    const touching = context.pointer.tool === 'hand' && cursorOnBody(cat, context, 50) && pointerSpeed(context) < 420
    mind.scratchNumbers.away = touching ? 0 : (mind.scratchNumbers.away ?? 0) + context.dt
    if (mind.scratchNumbers.away > 0.7 || mind.behaviorElapsed > 25) {
      if (cat.affection > 0.6 && context.memory.random.chance(0.5)) chain(cat, mind, context, 'followCursor', 0)
      else {
        lockPose(mind, 'stretch', 0.8)
        endBehavior(cat, mind, context)
      }
      return zeroVector
    }
    mind.idlePose = 'purr'
    gazeAt(cat, mind, context.pointer.position, 0.3)
    if (touching) raiseAffection(cat, 0.06 * context.dt)
    if (every(mind, context, 'hearts', 0.9)) spawnEffect(context.world, 'hearts', cat.position, cat.height + 34 * cat.coat.scale, null, 0.7)
    if (every(mind, context, 'purr', 1.4)) setAction(cat, 'purr')
    if (every(mind, context, 'love', 3)) setEmote(cat, 'love')
    return brake(cat)
  },
}
