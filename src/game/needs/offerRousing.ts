import { careOfferOf } from '../care/careOffer'
import type { StepContext } from '../memory'
import { distance } from '../vector'
import { fulfillsNeed } from './needCare'
import { needRecordOf } from './needState'
import { rouseCat } from './sleepControl'

const rouseReach = 190
const rouseSeconds = 3.2

export function rouseForOffer(context: StepContext): void {
  const { world } = context
  const offer = careOfferOf(world)
  const kind = offer?.kind
  if (!offer || !kind || kind === 'collar') return
  world.cats.forEach((cat) => {
    if (!cat.asleep || cat.hidden || !cat.need || !fulfillsNeed(cat.need, kind)) return
    if (needRecordOf(context, cat).rousedUntil > world.time) return
    if (distance(cat.position, offer.point) > rouseReach * context.memory.sizeScale) return
    rouseCat(cat, context, rouseSeconds, false, offer.point)
  })
}
