import { clampToBounds } from '../../bounds'
import { spawnEffect } from '../../effects'
import { nightness } from '../helpers/propUse'
import { createPropVisit } from '../helpers/propVisit'
import { setEmote } from '../helpers/pose'
import { orbit } from '../helpers/steering'
import { every } from '../tools/support/phases'

const circleSeconds = 1.3
const kneadSeconds = 3.2

export const cushionNapBehavior = createPropVisit({
  id: 'cushionNap',
  intent: 'napping',
  kinds: ['cushion'],
  range: 900,
  minDuration: 8,
  maxDuration: 14,
  useDuration: [6, 11],
  capacity: 2,
  speed: 0.42,
  idlePose: 'knead',
  weight: (cat, mind, context) => (mind.napCooldown > 0 ? 0 : (0.3 + mind.personality.laziness * 0.5 + cat.affection * 0.15) * (1 + nightness(context.world))),
  spotFor(cushion, cat, context) {
    const side = context.world.cats.some((other) => other.id !== cat.id && other.behavior === 'cushionNap') ? 1 : -1
    return clampToBounds({ x: cushion.position.x + side * cushion.radius * 0.32, y: cushion.position.y - cushion.radius * 0.12 }, context.bounds)
  },
  onArrive(cat, mind) {
    setEmote(cat, 'love')
    mind.scratchPoints.bed = { x: cat.position.x, y: cat.position.y }
  },
  onUse(cat, mind, context, cushion) {
    const bed = mind.scratchPoints.bed ?? cat.position
    if (mind.phaseTimer < circleSeconds) {
      mind.idlePose = 'walk'
      return orbit(cat, bed, 7 * context.memory.sizeScale, 36 * context.memory.sizeScale, cat.facing)
    }
    if (mind.phaseTimer < kneadSeconds) {
      mind.idlePose = 'knead'
      if (every(mind, context, 'puff', 0.9)) cushion.agitation = Math.max(cushion.agitation, 0.15)
      return undefined
    }
    if (mind.idlePose !== 'sleep') {
      mind.idlePose = 'sleep'
      setEmote(cat, 'sleepy')
      mind.napCooldown = 14
    }
    if (every(mind, context, 'zz', 3.5)) setEmote(cat, 'sleepy')
    if (every(mind, context, 'dream', 6) && context.memory.random.chance(0.3)) spawnEffect(context.world, 'hearts', cat.position, 26, null, 0.3)
    return undefined
  },
})
