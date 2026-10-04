import type { Behavior } from '../behavior'
import { recentRefill } from '../../tools/feeding'
import { distance } from '../../vector'
import { dropHeldBall } from '../helpers/ball'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { chain, commit } from './support/phases'
import { freeKibbleSlot, queueSpot } from './support/stationSlots'
import { checkChance, feedingIds, isFreeForTools } from './support/toolQueries'

export const runToRefillBehavior: Behavior = {
  id: 'runToRefill',
  intent: 'useProp',
  interruptible: true,
  recencyPenalty: 0,
  overridesCommitment: true,
  minDuration: 5,
  maxDuration: 7,
  weight: () => 0,
  urgency(cat, mind, context) {
    if (!recentRefill(context, 3) || cat.fullness > 0.95 || feedingIds.has(cat.behavior) || !isFreeForTools(cat, mind, context, true)) return 0
    return checkChance(context, 0.35 + 1.4 * (1 - cat.fullness)) ? 2.4 : 0
  },
  start(cat, mind, context) {
    dropHeldBall(cat, mind, context, null)
    commit(mind)
    setEmote(cat, 'playful')
    mind.speedBoost = 1.1
  },
  update(cat, mind, context) {
    const station = recentRefill(context, 30)
    if (!station) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const spot = queueSpot(station, cat, 0, context)
    if (distance(cat.position, spot) < 60 * context.memory.sizeScale || distance(cat.position, station.position) < station.radius * 2.2) {
      chain(cat, mind, context, freeKibbleSlot(context, cat.id) ? 'goEat' : 'queueForFood', 0)
      return zeroVector
    }
    return arrive(cat, spot, topSpeed(cat, mind, context), 40)
  },
}
