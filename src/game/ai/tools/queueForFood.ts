import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { chain, gazeAt } from './support/phases'
import { feedingStationOf, freeKibbleSlot, queueSpot } from './support/stationSlots'

export const queueForFoodBehavior: Behavior = {
  id: 'queueForFood',
  intent: 'useProp',
  interruptible: true,
  minDuration: 8,
  maxDuration: 12,
  weight(cat, _mind, context) {
    const station = feedingStationOf(context)
    if (!station || station.foodLevel < 0.05 || cat.fullness > 0.5) return 0
    return freeKibbleSlot(context, cat.id) ? 0 : 1.4
  },
  start(_cat, mind) {
    mind.idlePose = 'sit'
    mind.movePose = 'walk'
  },
  update(cat, mind, context) {
    const station = feedingStationOf(context)
    if (!station) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (station.foodLevel > 0.05 && freeKibbleSlot(context, cat.id) && cat.fullness < 0.9) {
      chain(cat, mind, context, 'goEat', 0)
      return zeroVector
    }
    const ahead = context.world.cats.filter((other) => other.behavior === 'queueForFood' && other.id < cat.id).length
    const spot = queueSpot(station, cat, ahead, context)
    gazeAt(cat, mind, station.position, 0.5)
    mind.idlePose = mind.phaseTimer % 4 < 2.5 ? 'sit' : 'loaf'
    return distance(cat.position, spot) > 8 ? arrive(cat, spot, topSpeed(cat, mind, context) * 0.4, 30) : brake(cat)
  },
}
