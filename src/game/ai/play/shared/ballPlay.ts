import type { CatMind, StepContext } from '../../../memory'
import { distance } from '../../../vector'
import type { BallState, CatState } from '../../../types'
import { blockRegrab, releaseBall } from '../../helpers/ball'
import { lockPose } from '../../helpers/pose'

export function holdBallQuietly(cat: CatState, mind: CatMind, ball: BallState): void {
  ball.status = 'held'
  ball.holderId = cat.id
  ball.stashPropId = null
  ball.velocity = { x: 0, y: 0 }
  ball.verticalSpeed = 0
  cat.heldBallId = ball.id
  mind.carryTime = 0
}

export function nearestLooseBall(cat: CatState, context: StepContext, radius: number): BallState | undefined {
  let best: BallState | undefined
  let bestGap = radius
  context.world.balls.forEach((ball) => {
    if (ball.status !== 'loose') return
    const gap = distance(ball.position, cat.position)
    if (gap < bestGap) {
      bestGap = gap
      best = ball
    }
  })
  return best
}

export function setBallDown(cat: CatState, mind: CatMind, context: StepContext): BallState | undefined {
  const ball = releaseBall(cat, mind, context, { x: cat.facing * 30, y: 0 }, 40, 0)
  if (!ball) return undefined
  blockRegrab(mind, ball, context, 6)
  lockPose(mind, 'bat', 0.2)
  return ball
}
