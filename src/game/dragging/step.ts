import { clampToBounds } from '../bounds'
import type { StepContext } from '../memory'
import { add, scale, subtract } from '../vector'
import type { DragState, Vec } from '../types'
import { draggedTreatClaim } from './grabbing'
import { stepCarriedProp, stepSettlingProps } from './propCarry'

const liftEase = 12

function easeLift(current: number, target: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-liftEase * dt))
}

function groundUnder(drag: DragState, lift: number, context: StepContext): Vec {
  const screen = subtract(drag.pointer, drag.grabOffset)
  return clampToBounds(add(screen, { x: 0, y: lift }), context.bounds)
}

function holdCat(drag: DragState, context: StepContext): boolean {
  const cat = context.world.cats.find((candidate) => candidate.id === drag.id && !candidate.hidden)
  if (!cat) return false
  const lift = easeLift(cat.height, drag.lift, context.dt)
  const ground = groundUnder(drag, lift, context)
  const moved = subtract(ground, cat.position)
  cat.velocity = context.dt > 0 ? scale(moved, 1 / context.dt) : { x: 0, y: 0 }
  cat.position = ground
  cat.height = lift
  cat.verticalSpeed = 0
  cat.pose = 'dangle'
  if (Math.abs(drag.velocity.x) > 60) cat.facing = drag.velocity.x > 0 ? 1 : -1
  return true
}

function holdBall(drag: DragState, context: StepContext): boolean {
  const ball = context.world.balls.find((candidate) => candidate.id === drag.id && candidate.status === 'loose')
  if (!ball) return false
  const lift = easeLift(ball.height, drag.lift, context.dt)
  ball.position = groundUnder(drag, lift, context)
  ball.height = lift
  ball.velocity = { x: 0, y: 0 }
  ball.verticalSpeed = 0
  ball.spin += drag.velocity.x * context.dt * 0.02
  return true
}

function holdTreat(drag: DragState, context: StepContext): boolean {
  const treat = context.world.treats.find((candidate) => candidate.id === drag.id && candidate.eatenAt === null)
  if (!treat) return false
  const lift = easeLift(treat.height, drag.lift, context.dt)
  treat.position = groundUnder(drag, lift, context)
  treat.height = lift
  treat.velocity = { x: 0, y: 0 }
  treat.verticalSpeed = 0
  treat.claimedByCatId = draggedTreatClaim
  return true
}

function holdProp(drag: DragState, context: StepContext): boolean {
  const prop = context.world.props.find((candidate) => candidate.id === drag.id)
  if (!prop) return false
  stepCarriedProp(prop, groundUnder(drag, prop.lift, context), drag.lift, context)
  return true
}

function holdDragged(drag: DragState, context: StepContext): boolean {
  if (drag.target === 'cat') return holdCat(drag, context)
  if (drag.target === 'ball') return holdBall(drag, context)
  if (drag.target === 'treat') return holdTreat(drag, context)
  return holdProp(drag, context)
}

export function stepDrag(context: StepContext): void {
  const { world } = context
  const drag = world.drag
  if (drag && !holdDragged(drag, context)) world.drag = null
  const carriedPropId = world.drag?.target === 'prop' ? world.drag.id : null
  stepSettlingProps(context, carriedPropId)
}
