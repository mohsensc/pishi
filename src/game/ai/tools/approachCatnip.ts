import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { add, distance } from '../../vector'
import { setEmote } from '../helpers/pose'
import { weightedPick, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { findPatch, nearestPatch } from './support/catnip'
import { chain, commit, gazeAt } from './support/phases'
import { catnipIds, checkChance, isFreeForTools } from './support/toolQueries'

export const approachCatnipBehavior: Behavior = {
  id: 'approachCatnip',
  intent: 'explore',
  interruptible: true,
  minDuration: 6,
  maxDuration: 9,
  weight: () => 0,
  urgency(cat, mind, context) {
    if (catnipIds.has(cat.behavior) || !isFreeForTools(cat, mind, context)) return 0
    if (!nearestPatch(cat, context, 420 * context.memory.sizeScale)) return 0
    return checkChance(context, 0.4 + mind.personality.curiosity * 0.6) ? 2.3 : 0
  },
  start(cat, mind, context) {
    commit(mind)
    const patch = nearestPatch(cat, context, 900 * context.memory.sizeScale)
    if (!patch) return
    const random = context.memory.random
    mind.scratchIds.patch = patch.id
    mind.scratchPoints.spot = add(patch.position, { x: random.range(-0.5, 0.5) * patch.radius, y: random.range(-0.3, 0.3) * patch.radius })
    mind.movePose = 'walk'
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    const patch = findPatch(context, mind.scratchIds.patch)
    const spot = mind.scratchPoints.spot
    if (!patch || !spot) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAt(cat, mind, { x: spot.x, y: spot.y + 8 }, 0.3)
    if (distance(cat.position, spot) > 10) {
      if (distance(cat.position, spot) < 60) mind.movePose = 'sniff'
      return arrive(cat, spot, topSpeed(cat, mind, context) * 0.4, 30)
    }
    mind.idlePose = 'sniff'
    if (mind.phase !== 'sniffing') {
      mind.phase = 'sniffing'
      mind.phaseTimer = 0
      spawnEffect(context.world, 'catnipPuff', patch.position, 4, null, 0.5)
    }
    if (mind.phaseTimer < 0.7) return brake(cat)
    const { laziness, zoominess } = mind.personality
    const next =
      weightedPick(context, [
        ['catnipRoll', 1 + laziness],
        ['catnipZoomies', zoominess * 2],
        ['catnipStare', 0.6],
        ['catnipKnead', 0.3 + cat.affection],
      ]) ?? 'catnipRoll'
    chain(cat, mind, context, next)
    mind.scratchIds.patch = patch.id
    return zeroVector
  },
}
