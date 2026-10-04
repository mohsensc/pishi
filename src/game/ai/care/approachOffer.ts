import type { Behavior } from '../behavior'
import { careOfferOf, type CareOffer } from '../../care/careOffer'
import { requestEagerness } from '../../happiness/happiness'
import type { CatMind, StepContext } from '../../memory'
import { fulfillsNeed } from '../../needs/needCare'
import type { CatState, Vec } from '../../types'
import { distance } from '../../vector'
import { dropHeldBall } from '../helpers/ball'
import { setEmote } from '../helpers/pose'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { every, gazeAt } from '../tools/support/phases'

export const approachOfferId = 'approachOffer'

const offerReach = 640
const protectedBehaviorIds = new Set(['enjoyCareItem', 'celebrate', approachOfferId])
const lostOfferSeconds = 0.9
const groundDrop = 26

function offerGround(cat: CatState, offer: CareOffer): Vec {
  return { x: offer.point.x - cat.facing * 4, y: offer.point.y + groundDrop * cat.coat.scale }
}

export function wantedOffer(cat: CatState, context: StepContext): CareOffer | null {
  const offer = careOfferOf(context.world)
  if (!offer || offer.kind === 'collar' || !cat.need || !fulfillsNeed(cat.need, offer.kind)) return null
  if (distance(cat.position, offerGround(cat, offer)) > offerReach * context.memory.sizeScale) return null
  return offer
}

function isAvailable(cat: CatState, mind: CatMind): boolean {
  return !cat.hidden && !cat.asleep && !mind.leap && cat.height <= 1 && !cat.propId && !protectedBehaviorIds.has(cat.behavior)
}

export const approachOfferBehavior: Behavior = {
  id: approachOfferId,
  intent: 'socialize',
  interruptible: true,
  ownsTimer: true,
  overridesCommitment: true,
  recencyPenalty: 0,
  minDuration: 6,
  maxDuration: 10,
  weight: () => 0,
  urgency(cat, mind, context) {
    if (!isAvailable(cat, mind) || !wantedOffer(cat, context)) return 0
    return context.memory.random.chance(Math.min(1, 0.8 * requestEagerness(cat))) ? 7.5 : 0
  },
  start(cat, mind, context) {
    if (cat.heldBallId) dropHeldBall(cat, mind, context, null, 1.5)
    setEmote(cat, 'love')
    mind.movePose = 'run'
    mind.speedBoost = 1.1 + (requestEagerness(cat) - 0.75) * 0.4
  },
  update(cat, mind, context) {
    const offer = wantedOffer(cat, context)
    if (!offer) {
      mind.scratchNumbers.lost = (mind.scratchNumbers.lost ?? 0) + context.dt
      if (mind.scratchNumbers.lost > lostOfferSeconds || !cat.need) endBehavior(cat, mind, context)
      return brake(cat)
    }
    mind.scratchNumbers.lost = 0
    gazeAt(cat, mind, offer.point, 0.3)
    const spot = offerGround(cat, offer)
    const gap = distance(cat.position, spot)
    if (every(mind, context, 'plead', 1.8)) setEmote(cat, 'love')
    if (gap < 18 * cat.coat.scale) {
      mind.idlePose = 'beg'
      return brake(cat, 6)
    }
    mind.movePose = gap > 70 * context.memory.sizeScale ? 'run' : 'walk'
    return arrive(cat, spot, topSpeed(cat, mind, context) * (gap > 70 * context.memory.sizeScale ? 1 : 0.5), 36)
  },
}
