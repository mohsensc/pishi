import type { StepContext } from '../memory'
import type { BallState, CatIntent, CatState } from '../types'
import { dismount } from './helpers/perch'
import { mindOf } from './helpers/queries'
import { beginBehavior, beginChase } from './helpers/transitions'

const busyForRetrieve: CatIntent[] = ['stashBall', 'retrieveBall', 'tunnelRun', 'passBall', 'climb', 'celebrate', 'hide']

export function isAvailableForRetrieve(cat: CatState, context: StepContext): boolean {
  const mind = mindOf(cat, context)
  return !cat.hidden && !cat.asleep && !cat.heldBallId && !mind.leap && !busyForRetrieve.includes(cat.intent)
}

export function beginRetrieve(cat: CatState, context: StepContext, ballId: string): void {
  const mind = mindOf(cat, context)
  const wasPerched = mind.perch
  beginBehavior(cat, mind, context, 'retrieveBall', { duration: 6 })
  mind.ballId = ballId
  if (wasPerched) dismount(cat, mind, context, 'none')
}

export function assignReceiver(cat: CatState, context: StepContext, ball: BallState): void {
  const mind = mindOf(cat, context)
  beginChase(cat, mind, context, ball, 1.05)
  mind.phase = 'receive'
  cat.intentTimer = 4
}
