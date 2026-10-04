import type { Behavior } from '../behavior'
import { add, clamp, distance, lerpVec, perpendicular, scale } from '../../vector'
import { setEmote } from '../helpers/pose'
import { bailIfThreatened, bumpAgitation, enterPhase, finishUse, hasProp, isOvertime, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { canHideMore, findProp, randomOpenPoint, zeroVector } from '../helpers/queries'
import { topSpeed } from '../helpers/threat'
import { isTunnelFree, mouthApproach, outwardAt, routeFrom } from './tunnelMouths'

export const tunnelShuttleBehavior: Behavior = {
  id: 'tunnelShuttle',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  minDuration: 9,
  maxDuration: 15,
  weight: (cat, mind, context) =>
    canHideMore(context) && hasProp(cat, context, ['tunnel'], 650, (tunnel) => isTunnelFree(tunnel, cat)) ? 0.03 + mind.personality.zoominess * 0.1 : 0,
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['tunnel'], 650, (tunnel) => isTunnelFree(tunnel, cat))?.id ?? null
    mind.scratchNumbers.passes = context.memory.random.integer(2, 3)
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const tunnel = findProp(context, mind.propTargetId)
    const route = tunnel ? routeFrom(tunnel, cat.position) : null
    if (!tunnel || !route) return finishUse(cat, mind, context)
    if (mind.phase === 'start' || mind.phase === 'go') {
      if (mind.phase === 'start') enterPhase(mind, 'go')
      if (bailIfThreatened(cat, mind, context, 0.8)) return zeroVector
      const velocity = travel(cat, mind, context, mouthApproach(tunnel, route, cat, context, 'from'), 0.95, 16)
      if (velocity) return velocity
      if (!canHideMore(context) || !isTunnelFree(tunnel, cat)) return quit(cat, mind, context)
      cat.hidden = true
      cat.propId = tunnel.id
      cat.position = { ...route.from }
      mind.scratchPoints.from = route.from
      mind.scratchPoints.to = route.to
      mind.scratchNumbers.duration = clamp(distance(route.from, route.to) / (topSpeed(cat, mind, context) * 0.8), 0.5, 1.6)
      enterPhase(mind, 'inside')
      return zeroVector
    }
    if (mind.phase === 'inside') {
      const from = mind.scratchPoints.from ?? route.from
      const to = mind.scratchPoints.to ?? route.to
      const progress = clamp(mind.phaseTimer / (mind.scratchNumbers.duration ?? 1), 0, 1)
      cat.position = lerpVec(from, to, progress)
      bumpAgitation(tunnel, 0.35)
      if (progress < 1) return zeroVector
      const exitRoute = { from, to }
      const outward = outwardAt(exitRoute, 'to')
      cat.hidden = false
      cat.propId = null
      cat.position = mouthApproach(tunnel, exitRoute, cat, context, 'to')
      cat.velocity = scale(outward, topSpeed(cat, mind, context))
      const passes = (mind.scratchNumbers.passes ?? 1) - 1
      mind.scratchNumbers.passes = passes
      if (passes <= 0 || isOvertime(cat)) return quit(cat, mind, context)
      const swing = scale(perpendicular(outward), context.memory.random.sign() * 50 * context.memory.sizeScale)
      mind.scratchPoints.loop = randomOpenPoint(context, add(add(cat.position, scale(outward, 80 * context.memory.sizeScale)), swing), 20, 16)
      enterPhase(mind, 'loop')
      return zeroVector
    }
    if (mind.phase === 'loop') {
      const loop = mind.scratchPoints.loop
      const velocity = loop ? travel(cat, mind, context, loop, 0.9, 18) : null
      if (velocity) return velocity
      enterPhase(mind, 'go')
      return zeroVector
    }
    return finishUse(cat, mind, context)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
