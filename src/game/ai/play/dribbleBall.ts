import type { Behavior } from '../behavior'
import { launchBall } from '../../physics'
import { add, distance, normalize, rotate, scale, subtract } from '../../vector'
import { blockRegrab, releaseBall } from '../helpers/ball'
import { finishBehavior, paceSpeed } from '../helpers/playSteering'
import { lockPose, setEmote } from '../helpers/pose'
import { findBall, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { holdBallQuietly } from './shared/ballPlay'

export const dribbleBallBehavior: Behavior = {
  id: 'dribbleBall',
  intent: 'play',
  interruptible: true,
  withBall: true,
  minDuration: 5,
  maxDuration: 8,
  weight: (_cat, mind) => 0.12 + mind.personality.zoominess * 0.18,
  start(cat, mind, context) {
    mind.behaviorUrgency = 3
    mind.scratchNumbers.touches = context.memory.random.integer(4, 7)
    mind.scratchPoints.heading = normalize({ x: cat.facing, y: context.memory.random.range(-0.5, 0.5) })
    const released = releaseBall(cat, mind, context, scale(mind.scratchPoints.heading, 110), 40, 0)
    mind.ballId = released?.id ?? null
    mind.movePose = 'walk'
    mind.idlePose = 'crouch'
    lockPose(mind, 'bat', 0.2)
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const ball = findBall(context, mind.ballId)
    if (!ball || ball.status !== 'loose') return finishBehavior(cat, mind, context)
    mind.scratchPoints.gaze = ball.position
    const gap = distance(cat.position, ball.position)
    const reach = 24 * cat.coat.scale
    if (gap < reach && ball.height < 12) {
      if (mind.attempts >= mind.scratchNumbers.touches) {
        if (context.memory.random.chance(0.5)) {
          blockRegrab(mind, ball, context, 4)
          setEmote(cat, 'playful')
          return finishBehavior(cat, mind, context)
        }
        holdBallQuietly(cat, mind, ball)
        setEmote(cat, 'proud')
        return finishBehavior(cat, mind, context)
      }
      if (mind.batCooldown <= 0) {
        mind.attempts += 1
        const random = context.memory.random
        const bounds = context.bounds
        let heading = rotate(mind.scratchPoints.heading, random.range(-40, 40))
        const ahead = add(ball.position, scale(heading, 90))
        if (ahead.x < bounds.left || ahead.x > bounds.right || ahead.y < bounds.top || ahead.y > bounds.bottom) heading = scale(heading, -1)
        mind.scratchPoints.heading = heading
        launchBall(ball, scale(heading, random.range(110, 170)), random.range(20, 70))
        mind.batCooldown = 0.35
        lockPose(mind, 'bat', 0.2)
        return zeroVector
      }
    }
    const behind = subtract(ball.position, scale(mind.scratchPoints.heading, reach * 0.6))
    return arrive(cat, behind, paceSpeed(cat, mind, context, 0.62), 16)
  },
}
