import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { spawnEffect } from '../../effects'
import { hopInPlace } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { inFrontOf } from '../helpers/propSpots'
import { bumpAgitation, commit, enterPhase, hasProp, isPropBusy, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { findProp, mouthPoint, randomTimer } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const sniffFlowersBehavior: Behavior = {
  id: 'sniffFlowers',
  intent: 'explore',
  interruptible: true,
  minDuration: 7,
  maxDuration: 12,
  weight: (cat, mind, context) => (hasProp(cat, context, ['flowerBed'], 620, (bed) => !isPropBusy(context, bed, cat.id, 2)) ? 0.05 + mind.personality.curiosity * 0.09 : 0),
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['flowerBed'], 620, (bed) => !isPropBusy(context, bed, cat.id, 2))?.id ?? null
    mind.scratchNumbers.sniffs = context.memory.random.integer(3, 5)
  },
  update(cat, mind, context) {
    const bed = findProp(context, mind.propTargetId)
    if (!bed) return quit(cat, mind, context)
    const random = context.memory.random
    if (mind.phase === 'start') {
      mind.scratchPoints.spot = inFrontOf(bed, cat, context)
      enterPhase(mind, 'wander')
    }
    if (mind.phase === 'wander') {
      mind.movePose = 'sniff'
      const spot = mind.scratchPoints.spot
      const velocity = spot ? travel(cat, mind, context, spot, 0.17, 8) : null
      if (velocity) return velocity
      enterPhase(mind, 'smell', randomTimer(context, 0.8, 1.7))
      commit(mind)
      cat.intentTimer = Math.max(cat.intentTimer, 2)
      mind.idlePose = 'sniff'
      bumpAgitation(bed, 0.2)
      if (random.chance(0.25)) {
        hopInPlace(cat, mind, context, 10, 0.22, 'startle', 'none')
        spawnEffect(context.world, 'petals', mouthPoint(cat), 6, bed.id, 0.35)
        setEmote(cat, 'startled')
      } else if (random.chance(0.3)) setEmote(cat, 'love')
      return brake(cat)
    }
    if (mind.phaseTimer < mind.holdDuration) return brake(cat)
    const remaining = (mind.scratchNumbers.sniffs ?? 0) - 1
    mind.scratchNumbers.sniffs = remaining
    if (remaining <= 0) return quit(cat, mind, context)
    const angle = random.range(0, Math.PI * 2)
    const reach = bed.radius * random.range(0.2, 0.6)
    mind.scratchPoints.spot = clampToBounds({ x: bed.position.x + Math.cos(angle) * reach, y: bed.position.y + Math.sin(angle) * reach * 0.6 }, context.bounds)
    enterPhase(mind, 'wander')
    return brake(cat)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
