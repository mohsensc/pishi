import { BALL_RADIUS, POP_EXTRA_RADIUS, POP_MAX_HEIGHT, POP_PRESSED_BONUS } from './constants'
import { depthScale } from './projection'
import type { BallState, PointerState } from './types'

export function createIdlePointer(): PointerState {
  return { position: { x: -9999, y: -9999 }, velocity: { x: 0, y: 0 }, active: false, pressed: false, tool: 'hand' }
}

export function isPoppable(ball: BallState): boolean {
  return ball.kind === 'tennis' && ball.status === 'loose' && ball.height < POP_MAX_HEIGHT
}

export function isTennisBall(ball: BallState): boolean {
  return ball.kind === 'tennis'
}

export function popReach(ball: BallState, worldHeight: number, pressed: boolean): number {
  return BALL_RADIUS * depthScale(ball.position.y, worldHeight) + POP_EXTRA_RADIUS + (pressed ? POP_PRESSED_BONUS : 0)
}
