import { dropHeldBall } from '../ai/helpers/ball'
import { setEmote } from '../ai/helpers/pose'
import { mindOf } from '../ai/helpers/queries'
import { startleCat } from '../ai/helpers/reactions'
import { endBehavior } from '../ai/helpers/transitions'
import type { StepContext } from '../memory'
import { distance } from '../vector'
import type { CatEmote, CatState, DragTarget, PropState, Vec } from '../types'
import { forgetOffer } from './handlingMemory'
import { ridersOf, shakeOffRiders } from './riders'

export const draggedTreatClaim = 'handDragged'

const pickupStartleRadius = 80

function dangleEmoteFor(cat: CatState): CatEmote {
  if (cat.affection > 0.6) return 'love'
  if (cat.affection < 0.3) return 'annoyed'
  return 'startled'
}

function startleBystanders(point: Vec, context: StepContext, excludedIds: Set<string>): void {
  context.world.cats.forEach((cat) => {
    if (excludedIds.has(cat.id) || cat.hidden || cat.height > 1) return
    if (distance(cat.position, point) < pickupStartleRadius * context.memory.sizeScale) startleCat(cat, context, point)
  })
}

function grabCat(cat: CatState, point: Vec, context: StepContext): void {
  const mind = mindOf(cat, context)
  dropHeldBall(cat, mind, context, point)
  mind.leap = null
  mind.perch = null
  mind.climbPlan = null
  mind.poseLock = null
  cat.propId = null
  cat.followUntil = null
  endBehavior(cat, mind, context)
  setEmote(cat, dangleEmoteFor(cat))
  const toy = context.world.heldToy
  if (toy && toy.grabbedByCatId === cat.id) toy.grabbedByCatId = null
}

function grabProp(prop: PropState, context: StepContext): void {
  const riders = ridersOf(prop, context)
  shakeOffRiders(riders, context)
  startleBystanders(prop.position, context, new Set(riders.map(({ cat }) => cat.id)))
}

export function prepareGrab(target: DragTarget, id: string, point: Vec, context: StepContext): void {
  const { world } = context
  if (target === 'cat') {
    const cat = world.cats.find((candidate) => candidate.id === id)
    if (cat) grabCat(cat, point, context)
    return
  }
  if (target === 'prop') {
    const prop = world.props.find((candidate) => candidate.id === id)
    if (prop) grabProp(prop, context)
    return
  }
  if (target === 'ball') {
    forgetOffer(world, id)
    const ball = world.balls.find((candidate) => candidate.id === id)
    if (ball) ball.thrownAt = null
    return
  }
  const treat = world.treats.find((candidate) => candidate.id === id)
  if (treat) treat.claimedByCatId = draggedTreatClaim
}
