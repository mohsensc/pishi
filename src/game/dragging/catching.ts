import type { StepContext } from '../memory'
import { isPoppable } from '../pointer'
import { interactionContext } from '../engine'
import { popBall } from '../upkeep'
import type { BallState, World } from '../types'
import { handlingOf, isBallOffered } from './handlingMemory'
import { beginDrag } from './session'

export function holdsPop(context: StepContext, ball: BallState): boolean {
  const { world, pointer } = context
  const handling = handlingOf(world)
  if (world.drag?.target === 'ball' && world.drag.id === ball.id) return true
  if (handling.guardedBallId === ball.id) return true
  if (handling.ballCatching && pointer.pressed) {
    if (!world.drag) beginDrag(world, 'ball', ball.id, pointer.position)
    return true
  }
  return !pointer.pressed && isBallOffered(world, ball.id)
}

export function tapBall(world: World, ballId: string): boolean {
  const handling = handlingOf(world)
  if (handling.guardedBallId === ballId) handling.guardedBallId = null
  const ball = world.balls.find((candidate) => candidate.id === ballId)
  if (!ball || !isPoppable(ball)) return false
  popBall(interactionContext(world), ball)
  return true
}
