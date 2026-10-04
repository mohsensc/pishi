import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { clampToBounds } from '../../bounds'
import { BALL_GRAB_RADIUS, GRAVITY } from '../../constants'
import { isInPond } from '../../physics'
import { add, clamp, distance, length, scale } from '../../vector'
import type { BallState, CatState, Vec } from '../../types'
import { grabBall } from '../helpers/ball'
import { startLeap } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { findBall, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { beginBehavior, endBehavior } from '../helpers/transitions'
import { gazeAt } from '../tools/support/phases'
import { doingWith, freshThrownBall, isFreeForHandling } from '../drag/handlingQueries'

const raceRadius = 720
const maxRacers = 3
const fetchUrgency = 3.6

function landingSpot(ball: BallState, cat: CatState, speed: number): Vec {
  if (ball.height > 4 || ball.verticalSpeed > 0) {
    const airtime = (ball.verticalSpeed + Math.sqrt(Math.max(0, ball.verticalSpeed * ball.verticalSpeed + 2 * GRAVITY * ball.height))) / GRAVITY
    return add(ball.position, scale(ball.velocity, airtime))
  }
  const gap = distance(cat.position, ball.position)
  return add(ball.position, scale(ball.velocity, clamp(gap / Math.max(1, speed), 0, 0.6)))
}

function wantsToReturn(cat: CatState, mind: CatMind, context: StepContext): boolean {
  if (!context.pointer.active) return false
  return context.memory.random.chance(0.4 + cat.affection * 0.45 + mind.personality.curiosity * 0.1)
}

function claim(cat: CatState, mind: CatMind, ball: BallState, context: StepContext): void {
  grabBall(cat, mind, ball, context)
  if (wantsToReturn(cat, mind, context)) {
    beginBehavior(cat, mind, context, 'fetchReturn', { urgency: fetchUrgency })
    return
  }
  setEmote(cat, 'proud')
}

function tryLeapFor(cat: CatState, mind: CatMind, ball: BallState, context: StepContext): boolean {
  const gap = distance(cat.position, ball.position)
  const scaleFactor = cat.coat.scale * context.memory.sizeScale
  const airborne = ball.height > 18 && ball.height < 70 * mind.personality.jumpPower + 12 && ball.verticalSpeed < 150
  if (airborne && gap < 46 * scaleFactor) {
    startLeap(cat, mind, context, add(ball.position, scale(ball.velocity, 0.14)), 0, Math.min(ball.height + 8, 72 * mind.personality.jumpPower), 0.36, 'jump', 'none')
    return true
  }
  const rolling = ball.height < 6 && length(ball.velocity) < 220
  if (rolling && mind.scratchNumbers.pounced !== 1 && gap > 44 * scaleFactor && gap < 120 * scaleFactor) {
    mind.scratchNumbers.pounced = 1
    lockPose(mind, 'crouch', 0.14)
    startLeap(cat, mind, context, add(ball.position, scale(ball.velocity, 0.3)), 0, 20 * mind.personality.jumpPower, 0.34, 'pounce', 'none')
    return true
  }
  return false
}

export const fetchRaceBehavior: Behavior = {
  id: 'fetchRace',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  recencyPenalty: 0,
  minDuration: 6,
  maxDuration: 6,
  weight: () => 0,
  urgency(cat, mind, context) {
    if (!isFreeForHandling(cat, mind, context)) return 0
    const ball = freshThrownBall(cat, context, raceRadius * context.memory.sizeScale)
    if (!ball || doingWith(context, 'fetchRace', 'ball', ball.id, cat.id) >= maxRacers) return 0
    const eagerness = 0.3 + mind.personality.zoominess * 0.35 + mind.personality.curiosity * 0.2 + cat.affection * 0.2
    return context.memory.random.chance(eagerness) ? fetchUrgency : 0
  },
  start(cat, mind, context) {
    const ball = freshThrownBall(cat, context, raceRadius * context.memory.sizeScale * 1.4)
    if (ball) mind.scratchIds.ball = ball.id
    mind.speedBoost = 1.22
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const ball = findBall(context, mind.scratchIds.ball ?? null)
    const lost = !ball || ball.status !== 'loose' || mind.behaviorElapsed > 7 || isInPond(context.world.props, ball.position, 0.9)
    if (!ball || lost) {
      if (ball && ball.status === 'held' && ball.holderId !== cat.id) setEmote(cat, 'annoyed')
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAt(cat, mind, { x: ball.position.x, y: ball.position.y - ball.height }, 0.2)
    const grabReach = BALL_GRAB_RADIUS * cat.coat.scale * 1.1
    if (distance(cat.position, ball.position) < grabReach && ball.height < 30 * cat.coat.scale) {
      claim(cat, mind, ball, context)
      return zeroVector
    }
    if (tryLeapFor(cat, mind, ball, context)) return zeroVector
    const speed = topSpeed(cat, mind, context)
    return arrive(cat, clampToBounds(landingSpot(ball, cat, speed), context.bounds), speed, 20)
  },
}
