import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { distance } from '../../vector'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { every, gazeAt } from './support/phases'
import { feedingStationOf, slotSpot, slotTakenBy } from './support/stationSlots'

export const drinkWaterBehavior: Behavior = {
  id: 'drinkWater',
  intent: 'useProp',
  interruptible: true,
  ownsTimer: true,
  minDuration: 3,
  maxDuration: 5,
  weight(cat, _mind, context) {
    const station = feedingStationOf(context)
    if (!station || slotTakenBy(context, 'water', cat.id)) return 0
    return 0.07 + (distance(cat.position, station.position) < 300 * context.memory.sizeScale ? 0.06 : 0)
  },
  start(_cat, mind) {
    mind.scratchIds.slot = 'water'
    mind.movePose = 'walk'
  },
  update(cat, mind, context) {
    const station = feedingStationOf(context)
    if (!station || mind.behaviorElapsed > 14) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const spot = slotSpot(station, 'water', cat, context)
    if (mind.phase !== 'lapping') {
      if (distance(cat.position, spot.point) > 10) return arrive(cat, spot.point, topSpeed(cat, mind, context) * 0.4, 30)
      mind.phase = 'lapping'
      mind.phaseTimer = 0
    }
    cat.facing = spot.facing
    mind.facingHold = 0.5
    gazeAt(cat, mind, spot.bowl, 0.5)
    mind.idlePose = 'eat'
    if (every(mind, context, 'lap', 1.1)) spawnEffect(context.world, 'splash', spot.bowl, 2, station.id, 0.25)
    if (mind.phaseTimer > 3.5) endBehavior(cat, mind, context)
    return brake(cat)
  },
}
