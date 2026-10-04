import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { groggyWakeId } from '../../needs/needIds'
import { distance } from '../../vector'
import type { BallState, CatState } from '../../types'
import { batBall } from '../helpers/ball'
import { faceToward, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { endBehavior } from '../helpers/transitions'
import { every, gazeAt } from '../tools/support/phases'

const swatReach = 48
const swatMaxHeight = 16
const yawnInterval = 2.4

function swattableBall(cat: CatState, context: StepContext): BallState | undefined {
  const reach = swatReach * cat.coat.scale * context.memory.sizeScale
  return context.world.balls.find((ball) => ball.status === 'loose' && ball.height < swatMaxHeight && distance(ball.position, cat.position) < reach)
}

function lazySwat(cat: CatState, mind: CatMind, context: StepContext): boolean {
  if (mind.batCooldown > 0 || mind.poseLock) return false
  const ball = swattableBall(cat, context)
  if (!ball) return false
  faceToward(cat, mind, ball.position, 0.8)
  batBall(cat, mind, context, ball)
  mind.batCooldown += 0.8
  return true
}

export const groggyWakeBehavior: Behavior = {
  id: groggyWakeId,
  intent: 'wander',
  interruptible: true,
  ownsTimer: true,
  recencyPenalty: 0,
  minDuration: 4,
  maxDuration: 5,
  weight: () => 0,
  start(_cat, mind) {
    mind.idlePose = 'sit'
    mind.movePose = 'walk'
  },
  update(cat, mind, context) {
    if (!cat.asleep) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    mind.idlePose = 'sit'
    if (lazySwat(cat, mind, context)) return brake(cat)
    if (context.pointer.active) gazeAt(cat, mind, context.pointer.position, 0.3)
    if (every(mind, context, 'yawn', yawnInterval) && context.memory.random.chance(0.55)) setEmote(cat, 'sleepy')
    return brake(cat)
  },
}
