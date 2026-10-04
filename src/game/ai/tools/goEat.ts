import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { distance } from '../../vector'
import { setAction, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { feed } from './support/affection'
import { chain, every, gazeAt } from './support/phases'
import { feedingStationOf, freeKibbleSlot, slotSpot, type StationSlot } from './support/stationSlots'

const hungerLine = 0.62

function isStationSlot(value: string | undefined): value is StationSlot {
  return value === 'kibbleSide' || value === 'kibbleTop' || value === 'water'
}

export const goEatBehavior: Behavior = {
  id: 'goEat',
  intent: 'useProp',
  interruptible: true,
  ownsTimer: true,
  recencyPenalty: 0.2,
  minDuration: 6,
  maxDuration: 10,
  weight(cat, _mind, context) {
    const station = feedingStationOf(context)
    if (!station || station.foodLevel < 0.05 || cat.fullness > hungerLine) return 0
    if (!freeKibbleSlot(context, cat.id)) return 0
    return (hungerLine - cat.fullness) * 5
  },
  start(cat, mind, context) {
    mind.behaviorUrgency = 3.1
    const slot = freeKibbleSlot(context, cat.id)
    if (slot) mind.scratchIds.slot = slot
    mind.speedBoost = cat.fullness < 0.25 ? 1.1 : 1
  },
  update(cat, mind, context) {
    const station = feedingStationOf(context)
    const slot = mind.scratchIds.slot
    if (!station || !isStationSlot(slot)) {
      chain(cat, mind, context, 'queueForFood', 0)
      return zeroVector
    }
    const spot = slotSpot(station, slot, cat, context)
    if (distance(cat.position, spot.point) > 10 && mind.phase !== 'eating') {
      if (mind.behaviorElapsed > 12) chain(cat, mind, context, 'queueForFood', 0)
      return arrive(cat, spot.point, topSpeed(cat, mind, context) * (cat.fullness < 0.3 ? 0.7 : 0.45), 30)
    }
    if (mind.phase !== 'eating') {
      mind.phase = 'eating'
      mind.phaseTimer = 0
      setAction(cat, 'munch')
    }
    cat.facing = spot.facing
    mind.facingHold = 0.5
    gazeAt(cat, mind, spot.bowl, 0.5)
    mind.idlePose = 'eat'
    feed(cat, 0.09 * context.dt)
    station.foodLevel = Math.max(0, station.foodLevel - 0.03 * context.dt)
    if (every(mind, context, 'munch', 1.5)) setAction(cat, 'munch')
    if (every(mind, context, 'crumbs', 0.9)) spawnEffect(context.world, 'crumbs', spot.bowl, 6, station.id, 0.4)
    if (station.foodLevel <= 0.01 && cat.fullness < 0.6) {
      setEmote(cat, 'annoyed')
      chain(cat, mind, context, 'begForRefill', 0)
      return zeroVector
    }
    if (cat.fullness > 0.96 || mind.phaseTimer > 9) {
      setEmote(cat, 'proud')
      chain(cat, mind, context, context.memory.random.chance(0.4) ? 'drinkWater' : 'postMealGroom', 0)
      return zeroVector
    }
    return brake(cat)
  },
}
