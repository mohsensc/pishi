import { startLeap } from '../ai/helpers/leap'
import { mindOf } from '../ai/helpers/queries'
import { beginBehavior } from '../ai/helpers/transitions'
import { clampToBounds } from '../bounds'
import type { StepContext } from '../memory'
import { launchBall } from '../physics'
import { add, length, limit, scale } from '../vector'
import type { DragState, Vec } from '../types'
import { recruitFetchers } from './recruiting'
import { freeSpotFor } from './freeSpot'
import { offerBall } from './handlingMemory'
import { releaseProp } from './propCarry'

const maxThrowSpeed = 1250
const throwThreshold = 160
const catFlingReach = 260
const handledLandingId = 'handledLanding'
const releaseGraceSeconds = 0.8

function releaseCat(id: string, fling: Vec, context: StepContext): void {
  const cat = context.world.cats.find((candidate) => candidate.id === id)
  if (!cat) return
  const mind = mindOf(cat, context)
  const speed = length(fling)
  const reach = limit(scale(fling, 0.3), catFlingReach * context.memory.sizeScale)
  const landing = clampToBounds(add(cat.position, reach), context.bounds)
  const peak = Math.min(70, 6 + speed * 0.045)
  const duration = 0.26 + cat.height / 520 + length(reach) / 1500
  beginBehavior(cat, mind, context, handledLandingId, { urgency: 4 })
  startLeap(cat, mind, context, landing, 0, peak, duration, 'jump', 'none')
}

function releaseBallOf(id: string, fling: Vec, context: StepContext): void {
  const ball = context.world.balls.find((candidate) => candidate.id === id)
  if (!ball) return
  const velocity = limit(fling, maxThrowSpeed * context.memory.speedScale)
  const speed = length(velocity)
  const upward = speed > 80 ? Math.min(460, 120 + speed * 0.24) : 0
  launchBall(ball, velocity, upward)
  ball.thrownAt = speed > throwThreshold ? context.world.time : null
  offerBall(context.world, ball.id, releaseGraceSeconds)
  if (ball.thrownAt !== null) recruitFetchers(ball, context)
}

function releaseTreat(id: string, fling: Vec, context: StepContext): void {
  const treat = context.world.treats.find((candidate) => candidate.id === id)
  if (!treat) return
  treat.claimedByCatId = null
  treat.velocity = limit(scale(fling, 0.5), 700)
  treat.verticalSpeed = Math.min(260, length(fling) * 0.12)
}

function releasePropOf(id: string, fling: Vec, context: StepContext): void {
  const prop = context.world.props.find((candidate) => candidate.id === id)
  if (!prop) return
  const wanted = add(prop.position, limit(scale(fling, 0.08), 90 * context.memory.sizeScale))
  const spot = freeSpotFor(prop, wanted, context.world.props, context.bounds, context.memory.sizeScale)
  releaseProp(prop, spot, fling, context)
}

export function releaseDragged(drag: DragState, fling: Vec, context: StepContext): void {
  if (drag.target === 'cat') releaseCat(drag.id, fling, context)
  else if (drag.target === 'ball') releaseBallOf(drag.id, fling, context)
  else if (drag.target === 'treat') releaseTreat(drag.id, fling, context)
  else releasePropOf(drag.id, fling, context)
}
