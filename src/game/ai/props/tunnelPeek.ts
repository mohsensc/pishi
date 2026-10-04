import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { add, lerpVec, scale } from '../../vector'
import type { CatState, PropState } from '../../types'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { bumpAgitation, enterPhase, finishUse, hasProp, isOvertime, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { canHideMore, findProp, randomTimer, zeroVector } from '../helpers/queries'
import { threatened } from '../helpers/threat'
import { isTunnelFree, mouthApproach, outwardAt, routeFrom, type TunnelRoute } from './tunnelMouths'

function storedRoute(mind: CatMind): TunnelRoute | null {
  const { from, to } = mind.scratchPoints
  return from && to ? { from, to } : null
}

function retreat(cat: CatState, mind: CatMind, context: StepContext, tunnel: PropState, route: TunnelRoute, minimum: number, maximum: number): void {
  cat.hidden = true
  cat.height = 0
  cat.propId = tunnel.id
  cat.position = lerpVec(route.from, route.to, 0.5)
  cat.velocity = { x: 0, y: 0 }
  bumpAgitation(tunnel, 0.4)
  enterPhase(mind, 'inside', randomTimer(context, minimum, maximum))
}

function peek(cat: CatState, mind: CatMind, context: StepContext, tunnel: PropState, route: TunnelRoute): void {
  const mouth = context.memory.random.chance(0.5) ? 'from' : 'to'
  const outward = outwardAt(route, mouth)
  const point = mouth === 'from' ? route.from : route.to
  cat.hidden = false
  cat.height = 2
  cat.position = add(point, scale(outward, 4))
  cat.velocity = { x: 0, y: 0 }
  cat.facing = outward.x >= 0 ? 1 : -1
  mind.facingHold = 1
  mind.idlePose = 'peek'
  mind.scratchNumbers.mouth = mouth === 'from' ? 0 : 1
  mind.scratchPoints.gaze = add(point, scale(outward, 120))
  bumpAgitation(tunnel, 0.2)
  enterPhase(mind, 'peek', randomTimer(context, 1.5, 3))
}

function burstOut(cat: CatState, mind: CatMind, context: StepContext, tunnel: PropState, route: TunnelRoute): void {
  const mouth = mind.scratchNumbers.mouth === 1 ? 'to' : 'from'
  cat.hidden = false
  cat.propId = null
  cat.height = 0
  const landing = add(mouthApproach(tunnel, route, cat, context, mouth), scale(outwardAt(route, mouth), 50 * context.memory.sizeScale))
  setEmote(cat, 'playful')
  startLeap(cat, mind, context, landing, 0, 24, 0.4, 'pounce', 'ground')
}

export const tunnelPeekBehavior: Behavior = {
  id: 'tunnelPeek',
  intent: 'hide',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 8,
  maxDuration: 13,
  weight: (cat, mind, context) =>
    canHideMore(context) && hasProp(cat, context, ['tunnel'], 620, (tunnel) => isTunnelFree(tunnel, cat)) ? 0.04 + mind.personality.curiosity * 0.06 : 0,
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['tunnel'], 620, (tunnel) => isTunnelFree(tunnel, cat))?.id ?? null
    mind.scratchNumbers.peeks = context.memory.random.integer(2, 3)
  },
  update(cat, mind, context) {
    const tunnel = findProp(context, mind.propTargetId)
    if (!tunnel) return finishUse(cat, mind, context)
    if (mind.phase === 'start' || mind.phase === 'go') {
      const route = routeFrom(tunnel, cat.position)
      if (!route) return quit(cat, mind, context)
      if (mind.phase === 'start') enterPhase(mind, 'go')
      const velocity = travel(cat, mind, context, mouthApproach(tunnel, route, cat, context, 'from'), 0.55, 16)
      if (velocity) return velocity
      if (!canHideMore(context) || !isTunnelFree(tunnel, cat)) return quit(cat, mind, context)
      mind.scratchPoints.from = route.from
      mind.scratchPoints.to = route.to
      retreat(cat, mind, context, tunnel, route, 1, 2)
      return zeroVector
    }
    const route = storedRoute(mind)
    if (!route) return finishUse(cat, mind, context)
    const peeks = mind.scratchNumbers.peeks ?? 0
    if (mind.phase === 'inside') {
      if (mind.phaseTimer < mind.holdDuration && !isOvertime(cat)) return zeroVector
      if (peeks > 0 && !isOvertime(cat)) peek(cat, mind, context, tunnel, route)
      else burstOut(cat, mind, context, tunnel, route)
      return zeroVector
    }
    if (mind.phase === 'peek') {
      if (threatened(cat, mind, context, 0.8) && canHideMore(context)) {
        setEmote(cat, 'startled')
        retreat(cat, mind, context, tunnel, route, 1, 2)
        return zeroVector
      }
      if (mind.phaseTimer < mind.holdDuration) return zeroVector
      mind.scratchNumbers.peeks = peeks - 1
      if (peeks - 1 > 0 && canHideMore(context)) retreat(cat, mind, context, tunnel, route, 0.8, 1.6)
      else burstOut(cat, mind, context, tunnel, route)
      return zeroVector
    }
    return finishUse(cat, mind, context)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
    if (cat.propId && !cat.hidden && cat.height <= 2) {
      cat.propId = null
      cat.height = 0
    }
  },
}
