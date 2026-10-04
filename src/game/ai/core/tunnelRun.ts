import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { add, clamp, distance, lerpVec, normalize, scale, subtract } from '../../vector'
import { canHideMore, catRadius, findProp, nearestProp, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { beginBehavior, beginCarry, planTunnelRun, resumeAfterAction } from '../helpers/transitions'

export const tunnelRunBehavior: Behavior = {
  id: 'tunnelRun',
  intent: 'tunnelRun',
  interruptible: false,
  ownsTimer: true,
  minDuration: 7,
  maxDuration: 7,
  weight: (cat, mind, context) => {
    if (!canHideMore(context)) return 0
    const tunnel = nearestProp(cat, context, 'tunnel', 600 * context.memory.sizeScale, (prop) => prop.occupantIds.length === 0)
    return tunnel ? mind.personality.zoominess * 0.07 : 0
  },
  start(cat, mind, context) {
    const tunnel = nearestProp(cat, context, 'tunnel', 600 * context.memory.sizeScale, (prop) => prop.occupantIds.length === 0)
    if (tunnel) planTunnelRun(cat, mind, context, tunnel)
  },
  update(cat, mind, context) {
    const tunnel = findProp(context, mind.propTargetId)
    const from = mind.tunnelFrom
    const to = mind.tunnelTo
    if (!tunnel || !from || !to) {
      resumeAfterAction(cat, mind, context)
      return zeroVector
    }
    const direction = normalize(subtract(to, from))
    if (mind.phase === 'inside') {
      mind.tunnelProgress += context.dt / Math.max(0.3, mind.tunnelDuration)
      cat.position = lerpVec(from, to, clamp(mind.tunnelProgress, 0, 1))
      cat.velocity = scale(direction, 1)
      if (mind.tunnelProgress < 1) return zeroVector
      cat.hidden = false
      cat.propId = null
      cat.position = clampToBounds(add(to, scale(direction, tunnel.radius + catRadius(cat) + 6)), context.bounds)
      cat.velocity = scale(direction, topSpeed(cat, mind, context))
      cat.facing = direction.x >= 0 ? 1 : -1
      mind.facingHold = 0.5
      if (cat.heldBallId) {
        beginCarry(cat, mind, context, context.memory.random.range(4, 8), 0.5)
        mind.phase = 'trot'
        mind.target = clampToBounds(add(cat.position, scale(direction, 160)), context.bounds)
      } else if (context.memory.random.chance(0.5)) {
        beginBehavior(cat, mind, context, 'zoomies')
      } else {
        resumeAfterAction(cat, mind, context)
      }
      return zeroVector
    }
    if (cat.intentTimer <= 0 || tunnel.occupantIds.some((id) => id !== cat.id)) {
      resumeAfterAction(cat, mind, context)
      return zeroVector
    }
    const mouth = add(from, scale(direction, -(tunnel.radius + catRadius(cat) + 2)))
    if (distance(cat.position, mouth) < 16 * cat.coat.scale) {
      if (!canHideMore(context)) {
        resumeAfterAction(cat, mind, context)
        return zeroVector
      }
      cat.hidden = true
      cat.propId = tunnel.id
      cat.position = { x: from.x, y: from.y }
      mind.phase = 'inside'
      mind.tunnelProgress = 0
      mind.tunnelDuration = clamp(distance(from, to) / (topSpeed(cat, mind, context) * 0.7), 0.6, 1.8)
      return zeroVector
    }
    return arrive(cat, mouth, topSpeed(cat, mind, context), 20)
  },
}
