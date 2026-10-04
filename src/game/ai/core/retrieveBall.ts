import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { grabBall } from '../helpers/ball'
import { boxFront, emergeFrom, hideIn } from '../helpers/hiding'
import { lockPose } from '../helpers/pose'
import { canHideMore, findBall, findProp, randomTimer, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior, resumeAfterAction } from '../helpers/transitions'

export const retrieveBallBehavior: Behavior = {
  id: 'retrieveBall',
  intent: 'retrieveBall',
  interruptible: false,
  ownsTimer: true,
  minDuration: 6,
  maxDuration: 6,
  weight: () => 0,
  start() {},
  update(cat, mind, context) {
    const record = mind.ballId ? context.memory.stashes.get(mind.ballId) : undefined
    const ball = findBall(context, mind.ballId)
    const box = findProp(context, record?.propId ?? cat.propId)
    if (mind.phase === 'inside' && box) {
      mind.idlePose = 'loaf'
      if (mind.phaseTimer > mind.holdDuration) {
        emergeFrom(cat, box, context)
        if (ball && ball.status === 'stashed') {
          context.memory.stashes.delete(ball.id)
          grabBall(cat, mind, ball, context)
          mind.decisionTimer = 0.1
        } else {
          endBehavior(cat, mind, context)
        }
      }
      return zeroVector
    }
    if (!record || !ball || ball.status !== 'stashed' || !box) {
      if (record) record.retrieverId = null
      resumeAfterAction(cat, mind, context)
      return zeroVector
    }
    record.retrieverId = cat.id
    const front = boxFront(box, cat)
    if (distance(cat.position, front) < 18 * cat.coat.scale) {
      if (canHideMore(context) && box.occupantIds.length === 0) {
        hideIn(cat, mind, box, randomTimer(context, 0.4, 0.8), context)
      } else {
        context.memory.stashes.delete(ball.id)
        grabBall(cat, mind, ball, context)
        lockPose(mind, 'crouch', 0.3)
      }
      return zeroVector
    }
    return arrive(cat, front, topSpeed(cat, mind, context) * 0.9, 30)
  },
}
