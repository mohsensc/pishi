import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { BALL_GROUND_FRICTION } from '../../constants'
import { add, distance, normalize, pointToward, scale, subtract } from '../../vector'
import { releaseBall } from '../helpers/ball'
import { chooseEscape } from '../helpers/escape'
import { startLeap } from '../helpers/leap'
import { lockPose } from '../helpers/pose'
import { findBall, mouthPoint, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { cursorDistance, fleeRadius, topSpeed } from '../helpers/threat'
import { beginChase, beginFlee, endBehavior, resumeAfterAction } from '../helpers/transitions'

export const teaseCursorBehavior: Behavior = {
  id: 'teaseCursor',
  intent: 'teaseCursor',
  interruptible: false,
  ownsTimer: true,
  minDuration: 3,
  maxDuration: 5,
  weight: (cat, mind, context) => (context.pointer.active && cursorDistance(cat, context) < 460 * context.memory.sizeScale ? mind.personality.boldness * 0.14 : 0),
  start() {},
  update(cat, mind, context) {
    if (!context.pointer.active) {
      resumeAfterAction(cat, mind, context)
      return zeroVector
    }
    const speed = topSpeed(cat, mind, context)
    const radius = fleeRadius(cat, mind, context)
    const gap = cursorDistance(cat, context)
    const cursor = context.pointer.position
    if (mind.phase === 'watch') {
      mind.idlePose = 'crouch'
      const ball = findBall(context, mind.ballId)
      if (!ball || ball.status !== 'loose') {
        resumeAfterAction(cat, mind, context)
        return zeroVector
      }
      if (distance(cursor, ball.position) < 120 * context.memory.sizeScale || mind.phaseTimer > 1.4) {
        const ballGap = distance(cat.position, ball.position)
        beginChase(cat, mind, context, ball, 1.3)
        mind.regrabUntil = 0
        if (ballGap < 170 * context.memory.sizeScale) {
          startLeap(cat, mind, context, add(ball.position, scale(ball.velocity, 0.25)), 0, 26 * mind.personality.jumpPower, 0.32, 'pounce', 'grab')
        }
      }
      return brake(cat)
    }
    if (gap < radius * 0.5) {
      if (cat.heldBallId) chooseEscape(cat, mind, context, true)
      else beginFlee(cat, mind, context, 1.2)
      return zeroVector
    }
    const teaseDistance = radius * 0.95
    const spot = clampToBounds(pointToward(cursor, cat.position, teaseDistance), context.bounds)
    if (mind.phase === 'start' || mind.phase === 'approach') {
      mind.phase = 'approach'
      if (distance(cat.position, spot) < 16 || mind.phaseTimer > 3) {
        mind.phase = 'sit'
        mind.phaseTimer = 0
        mind.holdDuration = randomTimer(context, 0.7, 1.6)
      }
      return arrive(cat, spot, speed * 0.62, 40)
    }
    mind.idlePose = 'sit'
    if (mind.phase !== 'sit') return zeroVector
    const backOff = gap < teaseDistance * 0.75 ? arrive(cat, spot, speed * 0.5, 30) : zeroVector
    if (mind.phaseTimer <= mind.holdDuration) return backOff
    if (cat.heldBallId) {
      const mouth = mouthPoint(cat)
      const toward = normalize(subtract(cursor, mouth))
      const rollDistance = distance(cursor, mouth) * 0.45
      const released = releaseBall(cat, mind, context, scale(toward, rollDistance * BALL_GROUND_FRICTION), 80, 0)
      if (released) {
        mind.ballId = released.id
        mind.phase = 'watch'
        mind.phaseTimer = 0
        lockPose(mind, 'bat', 0.22)
      }
    } else if (cat.intentTimer <= 0) {
      endBehavior(cat, mind, context)
    }
    return backOff
  },
}
