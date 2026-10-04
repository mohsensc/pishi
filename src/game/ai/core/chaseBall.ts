import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { BALL_GRAB_RADIUS, GRAVITY } from '../../constants'
import { add, clamp, distance, length, scale } from '../../vector'
import { batBall, blockRegrab, grabBall, isRegrabBlocked, pickBallFor } from '../helpers/ball'
import { startLeap } from '../helpers/leap'
import { lockPose } from '../helpers/pose'
import { findBall, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { threatened, topSpeed } from '../helpers/threat'
import { beginFlee, endBehavior } from '../helpers/transitions'

export const chaseBallBehavior: Behavior = {
  id: 'chaseBall',
  intent: 'chaseBall',
  interruptible: false,
  ownsTimer: true,
  recencyPenalty: 0.2,
  minDuration: 6,
  maxDuration: 9,
  weight: (cat, mind, context) => (pickBallFor(cat, mind, context) ? 0.5 + mind.personality.boldness * 0.7 : 0),
  urgency(cat, mind, context) {
    if (cat.heldBallId || cat.hidden) return 0
    const ball = pickBallFor(cat, mind, context)
    if (!ball) return 0
    const random = context.memory.random
    const near = distance(ball.position, cat.position) < 280 * context.memory.sizeScale
    const eagerness = context.pointer.active ? 1 : 0.3
    if (near) return random.chance((0.4 + mind.personality.boldness * 0.5) * eagerness) ? 3 : 0
    return random.chance(0.05 * (0.5 + mind.personality.boldness) * eagerness) ? 1 : 0
  },
  start(cat, mind, context) {
    mind.ballId = pickBallFor(cat, mind, context)?.id ?? null
  },
  update(cat, mind, context) {
    const random = context.memory.random
    const ball = findBall(context, mind.ballId)
    if (!ball || ball.status !== 'loose' || cat.intentTimer <= 0) {
      const next = pickBallFor(cat, mind, context)
      if (next && cat.intentTimer > 0 && ball?.status !== 'loose') {
        mind.ballId = next.id
        mind.phase = 'start'
        return zeroVector
      }
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const scaleFactor = context.memory.sizeScale
    const speed = topSpeed(cat, mind, context)
    const gap = distance(cat.position, ball.position)
    const grabRadius = BALL_GRAB_RADIUS * cat.coat.scale
    if (mind.phase === 'crouch') {
      mind.idlePose = 'crouch'
      if (mind.phaseTimer > mind.holdDuration) {
        const lead = add(ball.position, scale(ball.velocity, 0.3))
        startLeap(cat, mind, context, lead, 0, 22 * mind.personality.jumpPower, 0.34, 'pounce', 'grab')
        mind.phase = 'chase'
      }
      return brake(cat, 3)
    }
    if (threatened(cat, mind, context, 0.4) && random.chance((1 - mind.personality.boldness) * context.dt * 3)) {
      beginFlee(cat, mind, context, 1)
      return zeroVector
    }
    const canGrab = !isRegrabBlocked(mind, ball, context)
    if (canGrab && mind.phase === 'receive' && gap < 46 * cat.coat.scale && ball.height < 80 && ball.height > 8 && ball.verticalSpeed < 0) {
      if (random.chance(0.12)) {
        ball.velocity = scale(ball.velocity, -0.35)
        ball.verticalSpeed = Math.abs(ball.verticalSpeed) * 0.35 + 140
        blockRegrab(mind, ball, context, 0.3)
        lockPose(mind, 'bat', 0.25)
        mind.phase = 'chase'
        return zeroVector
      }
      const lift = Math.min(ball.height, 30 + 30 * mind.personality.jumpPower)
      grabBall(cat, mind, ball, context)
      startLeap(cat, mind, context, cat.position, 0, lift, 0.34, 'jump', 'none')
      return zeroVector
    }
    if (canGrab && gap < grabRadius && ball.height < 26 * cat.coat.scale) {
      if (mind.phase !== 'receive' && mind.batCooldown <= 0 && random.chance(0.22 * mind.personality.zoominess)) {
        batBall(cat, mind, context, ball)
        return zeroVector
      }
      grabBall(cat, mind, ball, context)
      return zeroVector
    }
    if (canGrab && ball.height > 16 && ball.height < 80 * mind.personality.jumpPower + 10 && gap < 40 * cat.coat.scale && ball.verticalSpeed < 200) {
      const lift = Math.min(ball.height + 6, 70 * mind.personality.jumpPower)
      startLeap(cat, mind, context, add(ball.position, scale(ball.velocity, 0.12)), 0, lift, 0.36, 'jump', 'grab')
      return zeroVector
    }
    let target = add(ball.position, scale(ball.velocity, clamp(gap / Math.max(1, speed), 0, 0.6)))
    if (ball.height > 4 || ball.verticalSpeed > 0) {
      const landing = (ball.verticalSpeed + Math.sqrt(Math.max(0, ball.verticalSpeed * ball.verticalSpeed + 2 * GRAVITY * ball.height))) / GRAVITY
      target = add(ball.position, scale(ball.velocity, landing))
    }
    const groundRolling = ball.height < 6 && length(ball.velocity) < 170
    if (mind.pounceReady && groundRolling && gap > 48 * scaleFactor && gap < 125 * scaleFactor && mind.phase !== 'receive') {
      mind.pounceReady = false
      if (random.chance(0.5)) {
        mind.phase = 'crouch'
        mind.phaseTimer = 0
        mind.holdDuration = randomTimer(context, 0.18, 0.4) / cat.speedMultiplier
        return zeroVector
      }
    }
    if (gap > 150 * scaleFactor) mind.pounceReady = true
    const urgency = mind.phase === 'receive' ? 1 : 0.95
    return arrive(cat, clampToBounds(target, context.bounds), speed * urgency, 24)
  },
}
