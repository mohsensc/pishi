import type { Behavior } from '../behavior'
import type { CatMind, PerchSpot, StepContext } from '../../memory'
import type { CatState } from '../../types'
import { isPerchSpotTaken } from '../helpers/perch'
import { setEmote } from '../helpers/pose'
import { holdSpot, hopToGround, inFrontOf } from '../helpers/propSpots'
import { bailIfThreatened, enterPhase, finishUse, isOvertime, quit, releaseProp, travel } from '../helpers/propUse'
import { findProp, randomOpenPoint, randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { isNight } from '../helpers/playSteering'
import { hasParkourRoute, leapToSpot, planParkourRoute } from './parkourRoute'

const routes = new WeakMap<CatMind, PerchSpot[]>()

function nextStop(cat: CatState, mind: CatMind, context: StepContext): PerchSpot | null {
  const route = routes.get(mind) ?? []
  const stop = route[mind.attempts]
  if (!stop || isPerchSpotTaken(context, stop.propId, stop.level, cat.id)) return null
  const prop = findProp(context, stop.propId)
  if (!prop || prop.lift > 0 || prop.occupantIds.some((id) => id !== cat.id)) return null
  return stop
}

function landingSpot(cat: CatState, mind: CatMind, context: StepContext) {
  const prop = findProp(context, mind.perch?.propId ?? cat.propId)
  const around = prop?.position ?? cat.position
  return randomOpenPoint(context, around, (prop?.radius ?? 20) + 60 * context.memory.sizeScale, 20)
}

export const parkourChainBehavior: Behavior = {
  id: 'parkourChain',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 6,
  maxDuration: 11,
  weight(cat, mind, context) {
    if (cat.height > 1 || cat.heldBallId || !hasParkourRoute(cat, context)) return 0
    return (0.08 + mind.personality.jumpPower * 0.18 + mind.personality.zoominess * 0.06) * (isNight(context) ? 0.4 : 1)
  },
  start(cat, mind, context) {
    routes.set(mind, planParkourRoute(cat, mind, context, context.memory.random.integer(2, 4)))
    mind.idlePose = 'crouch'
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (mind.phase === 'start') {
      const first = nextStop(cat, mind, context)
      const prop = findProp(context, first?.propId ?? null)
      if (!first || !prop) return quit(cat, mind, context)
      if (bailIfThreatened(cat, mind, context)) return zeroVector
      const velocity = travel(cat, mind, context, inFrontOf(prop, cat, context), 0.9, 18)
      if (velocity) return velocity
      leapToSpot(cat, mind, context, first, 'jump')
      mind.attempts = 1
      enterPhase(mind, 'balance', randomTimer(context, 0.2, 0.55))
      return zeroVector
    }
    if (mind.phase === 'down') return finishUse(cat, mind, context)
    if (!holdSpot(cat, mind)) return finishUse(cat, mind, context)
    if (bailIfThreatened(cat, mind, context, 0.6)) return zeroVector
    if (mind.phase === 'balance') {
      mind.idlePose = 'crouch'
      if (mind.phaseTimer < mind.holdDuration) return brake(cat)
      const next = isOvertime(cat) ? null : nextStop(cat, mind, context)
      if (next) {
        leapToSpot(cat, mind, context, next, mind.attempts % 2 === 0 ? 'jump' : 'pounce')
        mind.attempts += 1
        enterPhase(mind, 'balance', randomTimer(context, 0.15, 0.5))
        return zeroVector
      }
      mind.idlePose = 'sit'
      setEmote(cat, 'proud')
      enterPhase(mind, 'summit', randomTimer(context, 0.5, 1.1))
      return zeroVector
    }
    if (mind.phaseTimer < mind.holdDuration) return brake(cat)
    hopToGround(cat, mind, context, landingSpot(cat, mind, context))
    enterPhase(mind, 'down')
    return zeroVector
  },
  finish(cat, mind, context) {
    routes.delete(mind)
    releaseProp(cat, mind, context)
  },
}
