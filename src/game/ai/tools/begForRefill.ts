import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { lockPose, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { chain, every, gazeAt } from './support/phases'
import { feedingStationOf, slotSpot } from './support/stationSlots'

export const begForRefillBehavior: Behavior = {
  id: 'begForRefill',
  intent: 'useProp',
  interruptible: true,
  minDuration: 6,
  maxDuration: 9,
  weight(cat, _mind, context) {
    const station = feedingStationOf(context)
    return station && station.foodLevel < 0.05 && cat.fullness < 0.5 ? 1.2 : 0
  },
  start(cat, mind) {
    mind.idlePose = 'sit'
    mind.movePose = 'walk'
    setEmote(cat, 'annoyed')
  },
  update(cat, mind, context) {
    const station = feedingStationOf(context)
    if (!station) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (station.foodLevel > 0.3) {
      chain(cat, mind, context, 'goEat', 0)
      return zeroVector
    }
    const spot = slotSpot(station, 'kibbleSide', cat, context)
    gazeAt(cat, mind, spot.bowl, 0.5)
    if (distance(cat.position, spot.point) > 30) return arrive(cat, spot.point, topSpeed(cat, mind, context) * 0.4, 30)
    if (every(mind, context, 'complain', 2.2)) setEmote(cat, 'annoyed')
    if (every(mind, context, 'paw', 1.6)) lockPose(mind, 'bat', 0.3)
    mind.idlePose = 'sit'
    return brake(cat)
  },
}
