import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { hopInPlace } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { findBall, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { endBehavior } from '../helpers/transitions'
import { gazeAt } from '../tools/support/phases'
import { freshThrownBall, isFreeForHandling, isThrownBall } from './handlingQueries'

const noticeRadius = 520

export const watchThrowBehavior: Behavior = {
  id: 'watchThrow',
  intent: 'explore',
  interruptible: true,
  minDuration: 1.2,
  maxDuration: 2.2,
  recencyPenalty: 0.2,
  weight: () => 0,
  urgency(cat, mind, context) {
    if (!isFreeForHandling(cat, mind, context)) return 0
    const ball = freshThrownBall(cat, context, noticeRadius * context.memory.sizeScale)
    if (!ball) return 0
    return context.memory.random.chance(0.5) ? 2.2 : 0
  },
  start(cat, mind, context) {
    const ball = freshThrownBall(cat, context, noticeRadius * context.memory.sizeScale * 1.5)
    if (ball) mind.scratchIds.ball = ball.id
    mind.scratchNumbers.hopped = 0
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    const ball = findBall(context, mind.scratchIds.ball ?? null)
    if (!ball || ball.status !== 'loose') {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAt(cat, mind, { x: ball.position.x, y: ball.position.y - ball.height }, 0.2)
    const close = distance(ball.position, cat.position) < 90 * context.memory.sizeScale
    mind.idlePose = close ? 'crouch' : 'sit'
    if (close && ball.height > 20 && mind.scratchNumbers.hopped === 0) {
      mind.scratchNumbers.hopped = 1
      hopInPlace(cat, mind, context, 18 + 14 * mind.personality.jumpPower, 0.34, 'reach')
    }
    if (!isThrownBall(ball, context) && mind.behaviorElapsed > 1.4) endBehavior(cat, mind, context)
    return brake(cat)
  },
}
