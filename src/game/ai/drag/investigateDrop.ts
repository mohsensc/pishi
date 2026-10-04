import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { add, distance, scale } from '../../vector'
import type { CatState, PropState, Vec } from '../../types'
import { findPerchPlan } from '../helpers/perch'
import { setEmote } from '../helpers/pose'
import { catRadius, findProp, isOpenGround, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { beginClimb, endBehavior } from '../helpers/transitions'
import { enterPhase, gazeAt, phaseDone } from '../tools/support/phases'
import { doingWith, freshDrop, isFreeForHandling } from './handlingQueries'

const noticeRadius = 420
const maxInvestigators = 2

function perimeterPoint(prop: PropState, cat: CatState, context: StepContext): Vec {
  const random = context.memory.random
  const reach = prop.radius + catRadius(cat) + 8
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const angle = random.range(0, Math.PI * 2)
    const point = add(prop.position, scale({ x: Math.cos(angle), y: Math.sin(angle) * 0.7 }, reach))
    if (isOpenGround(point, context, catRadius(cat) * 0.6)) return point
  }
  return { x: prop.position.x + random.sign() * reach, y: prop.position.y + 6 }
}

function tryHopOn(cat: CatState, mind: CatMind, prop: PropState, context: StepContext): boolean {
  if (!context.memory.random.chance(0.25 + mind.personality.jumpPower * 0.2)) return false
  const plan = findPerchPlan(cat, mind, context, false, prop.radius * 4)
  if (!plan || plan.propId !== prop.id) return false
  beginClimb(cat, mind, context, plan)
  return true
}

export const investigateDropBehavior: Behavior = {
  id: 'investigateDrop',
  intent: 'explore',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  recencyPenalty: 0.4,
  weight: () => 0,
  urgency(cat, mind, context) {
    if (!isFreeForHandling(cat, mind, context)) return 0
    const prop = freshDrop(cat, context, noticeRadius * context.memory.sizeScale)
    if (!prop || doingWith(context, 'investigateDrop', 'prop', prop.id, cat.id) >= maxInvestigators) return 0
    return context.memory.random.chance(mind.personality.curiosity * 0.5) ? 1.9 : 0
  },
  start(cat, mind, context) {
    const prop = freshDrop(cat, context, noticeRadius * context.memory.sizeScale)
    if (prop) mind.scratchIds.prop = prop.id
    mind.scratchNumbers.visits = 0
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    const prop = findProp(context, mind.scratchIds.prop ?? null)
    if (!prop || (context.world.drag?.target === 'prop' && context.world.drag.id === prop.id)) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAt(cat, mind, prop.position, 0.3)
    if (mind.phase === 'sniff') {
      mind.idlePose = 'sniff'
      if (!phaseDone(mind)) return brake(cat)
      mind.scratchNumbers.visits = (mind.scratchNumbers.visits ?? 0) + 1
      if (mind.scratchNumbers.visits >= 3 || tryHopOn(cat, mind, prop, context)) {
        if (cat.behavior === 'investigateDrop') endBehavior(cat, mind, context)
        return zeroVector
      }
      enterPhase(mind, 'start')
    }
    if (mind.phase === 'start' || !mind.target) {
      mind.target = perimeterPoint(prop, cat, context)
      enterPhase(mind, 'approach')
    }
    mind.movePose = mind.scratchNumbers.visits === 0 ? 'walk' : 'sniff'
    if (distance(cat.position, mind.target) < 10) {
      enterPhase(mind, 'sniff', randomTimer(context, 0.7, 1.4))
      return brake(cat)
    }
    const pace = mind.scratchNumbers.visits === 0 ? 0.55 : 0.22
    return arrive(cat, mind.target, topSpeed(cat, mind, context) * pace, 24)
  },
}
