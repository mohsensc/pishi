import type { Behavior } from '../behavior'
import { boundsCenter } from '../../bounds'
import { add, dot, length, normalize, perpendicular, scale, subtract } from '../../vector'
import { chooseEscape } from '../helpers/escape'
import { catCenter, randomTimer, zeroVector } from '../helpers/queries'
import { cursorDistance, fleeRadius, threatened, topSpeed } from '../helpers/threat'
import { beginCarry, endBehavior, resumeAfterAction } from '../helpers/transitions'

export const fleeCursorBehavior: Behavior = {
  id: 'fleeCursor',
  intent: 'fleeCursor',
  interruptible: false,
  ownsTimer: true,
  recencyPenalty: 0,
  minDuration: 1.2,
  maxDuration: 2,
  weight: () => 0,
  urgency(cat, mind, context) {
    if (cat.heldBallId || cat.hidden) return 0
    if (!threatened(cat, mind, context, 0.55)) return 0
    return context.memory.random.chance((1 - mind.personality.spookResistance) * 0.45) ? 5 : 0
  },
  start(_cat, mind) {
    mind.speedBoost = 1.08
  },
  update(cat, mind, context) {
    if (!context.pointer.active || cat.intentTimer <= 0) {
      resumeAfterAction(cat, mind, context)
      return zeroVector
    }
    const radius = fleeRadius(cat, mind, context)
    const gap = cursorDistance(cat, context)
    if (gap > radius * 1.5) {
      mind.calmTimer += context.dt
      if (mind.calmTimer > 0.5) {
        if (cat.heldBallId) beginCarry(cat, mind, context, randomTimer(context, 5, 9), 0.6)
        else endBehavior(cat, mind, context)
        return zeroVector
      }
    } else {
      mind.calmTimer = 0
      cat.intentTimer = Math.max(cat.intentTimer, 0.6)
    }
    if (cat.heldBallId && mind.decisionTimer <= 0) {
      mind.decisionTimer = randomTimer(context, 0.35, 0.7) / cat.speedMultiplier
      if (context.memory.random.chance(0.3)) {
        chooseEscape(cat, mind, context, false)
        if (cat.intent !== 'fleeCursor') return zeroVector
      }
    }
    let away = normalize(subtract(catCenter(cat), context.pointer.position))
    if (length(away) < 0.5) away = { x: cat.facing, y: 0 }
    const bounds = context.bounds
    const margin = 90 * context.memory.sizeScale
    const edgeCloseness = Math.max(
      1 - (cat.position.x - bounds.left) / margin,
      1 - (bounds.right - cat.position.x) / margin,
      1 - (cat.position.y - bounds.top) / margin,
      1 - (bounds.bottom - cat.position.y) / margin,
      0,
    )
    if (edgeCloseness > 0) {
      const toCenter = normalize(subtract(boundsCenter(bounds), cat.position))
      const sideways = perpendicular(away)
      const slide = dot(sideways, toCenter) >= 0 ? sideways : scale(sideways, -1)
      away = normalize(add(away, add(scale(toCenter, edgeCloseness * 0.9), scale(slide, edgeCloseness * 1.2))))
    }
    return scale(away, topSpeed(cat, mind, context))
  },
}
