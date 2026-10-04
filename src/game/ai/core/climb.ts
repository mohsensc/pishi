import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { distance, length } from '../../vector'
import type { CatState } from '../../types'
import { startLeap } from '../helpers/leap'
import { dismount, findPerchPlan, isPerchSpotTaken, perchSpotFor } from '../helpers/perch'
import { catRadius, findProp, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { threatened, topSpeed } from '../helpers/threat'
import { resumeAfterAction } from '../helpers/transitions'

function abandonClimb(cat: CatState, mind: CatMind, context: StepContext): void {
  mind.climbPlan = null
  if (cat.height > 1) dismount(cat, mind, context, 'ground')
  else resumeAfterAction(cat, mind, context)
}

export const climbBehavior: Behavior = {
  id: 'climb',
  intent: 'climb',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 8,
  maxDuration: 8,
  weight: (cat, mind, context) => (cat.height < 1 && findPerchPlan(cat, mind, context, false, 420 * context.memory.sizeScale) ? 0.08 : 0),
  start(cat, mind, context) {
    mind.climbPlan = findPerchPlan(cat, mind, context, false, 420 * context.memory.sizeScale)
    mind.climbStep = 0
  },
  update(cat, mind, context) {
    const plan = mind.climbPlan
    const prop = plan ? findProp(context, plan.propId) : undefined
    if (!plan || !prop || cat.intentTimer <= 0) {
      abandonClimb(cat, mind, context)
      return zeroVector
    }
    if (isPerchSpotTaken(context, prop.id, plan.level, cat.id)) {
      const alternative = findPerchPlan(cat, mind, context, prop.kind === 'catTree', 60)
      if (!alternative || alternative.propId !== prop.id) {
        abandonClimb(cat, mind, context)
        return zeroVector
      }
      mind.climbPlan = alternative
    }
    const activePlan = mind.climbPlan ?? plan
    if (mind.phase === 'start' || mind.phase === 'approach') {
      mind.phase = 'approach'
      const base = { x: activePlan.spot.x, y: prop.position.y + prop.radius + catRadius(cat) + 6 }
      const gap = distance(cat.position, base)
      if (gap < 20 * cat.coat.scale || (gap < 40 && length(cat.velocity) < 20)) {
        mind.phase = 'hop'
        mind.climbStep = prop.kind === 'catTree' ? 0 : activePlan.level
        return zeroVector
      }
      const hurry = cat.heldBallId && threatened(cat, mind, context, 1.2) ? 1 : 0.7
      return arrive(cat, base, topSpeed(cat, mind, context) * hurry, 30)
    }
    if (mind.phase === 'hop') {
      const finalStep = mind.climbStep >= activePlan.level
      const step = finalStep ? activePlan : perchSpotFor(prop, mind.climbStep, context.world.height)
      if (!step) return zeroVector
      const rise = Math.max(0, step.height - cat.height)
      const duration = (0.3 + rise / 500) / Math.pow(mind.personality.jumpPower, 0.3)
      startLeap(cat, mind, context, step.spot, step.height, 18 + rise * 0.25, duration, 'jump', finalStep ? 'perch' : 'climb')
      mind.climbStep += 1
      cat.intentTimer = Math.max(cat.intentTimer, 2)
    }
    return zeroVector
  },
}
