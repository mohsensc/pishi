import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake, fleeFrom } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { beginBehavior, endBehavior } from '../helpers/transitions'
import { gazeAt } from '../tools/support/phases'
import { carriedGroundPoint, carriedScreenPoint, freshDrop, isFreeForHandling } from './handlingQueries'

const noticeRadius = 340
const shyRadius = 110
const curiousStop = 80

export const watchCarriedBehavior: Behavior = {
  id: 'watchCarried',
  intent: 'explore',
  interruptible: true,
  minDuration: 2.5,
  maxDuration: 5,
  recencyPenalty: 0.3,
  weight: () => 0,
  urgency(cat, mind, context) {
    const ground = carriedGroundPoint(context)
    if (!ground || !isFreeForHandling(cat, mind, context)) return 0
    if (distance(ground, cat.position) > noticeRadius * context.memory.sizeScale) return 0
    return context.memory.random.chance(0.2 + mind.personality.curiosity * 0.35) ? 1.7 : 0
  },
  start(cat, mind) {
    mind.scratchNumbers.shy = mind.personality.boldness < 0.45 ? 1 : 0
    setEmote(cat, mind.scratchNumbers.shy === 1 ? 'startled' : 'curious')
  },
  update(cat, mind, context) {
    const screen = carriedScreenPoint(context)
    const ground = carriedGroundPoint(context)
    if (!screen || !ground) {
      const dropped = freshDrop(cat, context, noticeRadius * context.memory.sizeScale)
      if (dropped && mind.scratchNumbers.shy !== 1) {
        beginBehavior(cat, mind, context, 'investigateDrop', { urgency: 1.9 })
        mind.scratchIds.prop = dropped.id
      } else endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAt(cat, mind, screen, 0.3)
    const gap = distance(ground, cat.position)
    const scaleFactor = context.memory.sizeScale
    if (mind.scratchNumbers.shy === 1) {
      mind.movePose = 'stalk'
      mind.idlePose = 'crouch'
      if (gap < shyRadius * scaleFactor) return fleeFrom(cat, ground, topSpeed(cat, mind, context) * 0.55)
      return brake(cat)
    }
    mind.movePose = 'stalk'
    mind.idlePose = gap < curiousStop * scaleFactor * 1.3 ? 'crouch' : 'sit'
    if (gap > curiousStop * scaleFactor) return arrive(cat, ground, topSpeed(cat, mind, context) * 0.32, 50)
    return brake(cat)
  },
}
