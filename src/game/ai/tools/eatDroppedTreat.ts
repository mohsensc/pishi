import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { setAction, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { endBehavior } from '../helpers/transitions'
import { feed, raiseAffection } from './support/affection'
import { gazeAt } from './support/phases'
import { findTreat } from './support/treatQueries'

export const eatDroppedTreatBehavior: Behavior = {
  id: 'eatDroppedTreat',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  minDuration: 2,
  maxDuration: 2,
  weight: () => 0,
  start(cat, mind) {
    mind.idlePose = 'eat'
    setAction(cat, 'munch')
  },
  finish(cat, mind, context) {
    const treat = findTreat(context, mind.scratchIds.treat)
    if (treat && treat.claimedByCatId === cat.id && treat.eatenAt === null) treat.claimedByCatId = null
  },
  update(cat, mind, context) {
    const treat = findTreat(context, mind.scratchIds.treat)
    if (!treat || (treat.claimedByCatId !== cat.id && treat.eatenAt === null)) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (treat.eatenAt === null) {
      gazeAt(cat, mind, treat.position, 0.3)
      treat.claimedByCatId = cat.id
      if (mind.behaviorElapsed > 1.1) {
        treat.eatenAt = context.world.time
        spawnEffect(context.world, 'crumbs', treat.position, 3, null, 0.8)
        feed(cat, 0.06)
        raiseAffection(cat, 0.04)
        setEmote(cat, 'proud')
      }
      return brake(cat)
    }
    mind.idlePose = 'groom'
    if (mind.behaviorElapsed > 2.2) endBehavior(cat, mind, context)
    return brake(cat)
  },
}
