import { clampToBounds, pushOutOfDock } from '../../bounds'
import { BALL_GRAB_RADIUS } from '../../constants'
import type { CatMind, LandAction, StepContext } from '../../memory'
import { clamp, distance, lerp, lerpVec, scale, subtract } from '../../vector'
import type { CatPose, CatState, Vec } from '../../types'
import { anticipationSeconds } from './anticipation'
import { grabBall, isRegrabBlocked } from './ball'
import { lockPose, setEmote } from './pose'
import { catRadius, findBall, settleOnGround } from './queries'
import { beginBehavior, resumeAfterAction } from './transitions'

export function startLeap(
  cat: CatState,
  mind: CatMind,
  context: StepContext,
  to: Vec,
  toHeight: number,
  peak: number,
  duration: number,
  pose: CatPose,
  onLand: LandAction,
): void {
  const bounded = toHeight > 0.5 ? clampToBounds(to, context.bounds) : pushOutOfDock(clampToBounds(to, context.bounds), context.world.width, context.world.height)
  const target = toHeight > 0.5 ? bounded : settleOnGround(bounded, context, catRadius(cat))
  const flightSeconds = Math.max(0.12, duration)
  const launchVelocity = scale(subtract(target, cat.position), 1 / flightSeconds)
  const windup = anticipationSeconds(cat, mind, pose, onLand, peak)
  mind.leap = {
    from: { x: cat.position.x, y: cat.position.y },
    to: target,
    fromHeight: cat.height,
    toHeight,
    peak,
    duration: flightSeconds,
    elapsed: 0,
    pose,
    onLand,
    windup,
    launchVelocity,
  }
  cat.velocity = windup > 0 ? scale(cat.velocity, 0.35) : launchVelocity
  if (Math.abs(target.x - cat.position.x) > 4) cat.facing = target.x > cat.position.x ? 1 : -1
  mind.facingHold = flightSeconds + windup
}

export function hopInPlace(cat: CatState, mind: CatMind, context: StepContext, peak: number, duration: number, pose: CatPose, onLand: LandAction = 'none'): void {
  startLeap(cat, mind, context, cat.position, cat.height, peak, duration, pose, onLand)
}

export function updateLeap(cat: CatState, mind: CatMind, context: StepContext): void {
  const leap = mind.leap
  if (!leap) return
  if (leap.windup > 0) {
    leap.windup -= context.dt
    cat.velocity = scale(cat.velocity, Math.exp(-14 * context.dt))
    if (leap.windup > 0) return
    cat.velocity = leap.launchVelocity
  }
  leap.elapsed += context.dt
  const progress = clamp(leap.elapsed / leap.duration, 0, 1)
  const previousHeight = cat.height
  cat.position = lerpVec(leap.from, leap.to, progress)
  cat.height = lerp(leap.fromHeight, leap.toHeight, progress) + leap.peak * 4 * progress * (1 - progress)
  cat.verticalSpeed = (cat.height - previousHeight) / Math.max(1e-4, context.dt)
  const ball = cat.intent === 'chaseBall' ? findBall(context, mind.ballId) : undefined
  if (ball && ball.status === 'loose' && !isRegrabBlocked(mind, ball, context)) {
    const horizontal = distance(ball.position, cat.position)
    const vertical = Math.abs(ball.height - (cat.height + 12 * cat.coat.scale))
    if (horizontal < BALL_GRAB_RADIUS * cat.coat.scale * 1.3 && vertical < 26) grabBall(cat, mind, ball, context)
  }
  if (progress < 1) return
  mind.leap = null
  cat.height = leap.toHeight
  cat.verticalSpeed = 0
  land(cat, mind, context, leap.onLand, leap.to)
}

function land(cat: CatState, mind: CatMind, context: StepContext, action: LandAction, spot: Vec): void {
  if (action === 'grab') {
    cat.velocity = scale(cat.velocity, 0.3)
    const ball = findBall(context, mind.ballId)
    if (ball && ball.status === 'loose' && cat.intent === 'chaseBall' && !isRegrabBlocked(mind, ball, context)) {
      if (distance(ball.position, spot) < BALL_GRAB_RADIUS * cat.coat.scale * 1.6 && ball.height < 30) grabBall(cat, mind, ball, context)
    }
    return
  }
  if (action === 'perch') {
    const plan = mind.climbPlan
    cat.velocity = { x: 0, y: 0 }
    if (!plan) return
    mind.climbPlan = null
    cat.propId = plan.propId
    const carrying = Boolean(cat.heldBallId)
    const lazyBonus = mind.personality.laziness * 1.2
    const duration = carrying ? context.memory.random.range(2, 3.5) : context.memory.random.range(1.6, 3.4) + lazyBonus
    beginBehavior(cat, mind, context, 'perch', { duration })
    mind.perch = plan
    mind.decisionTimer = 0.8
    return
  }
  if (action === 'climb') {
    cat.velocity = { x: 0, y: 0 }
    return
  }
  if (action === 'startle') {
    cat.velocity = scale(cat.velocity, 0.2)
    lockPose(mind, 'startle', 0.35)
    return
  }
  if (action === 'ground') {
    cat.height = 0
    cat.propId = null
    mind.perch = null
    resumeAfterAction(cat, mind, context)
    return
  }
  if (action === 'butterfly') {
    cat.velocity = scale(cat.velocity, 0.2)
    const missed = context.memory.random.chance(0.3)
    lockPose(mind, missed ? 'arch' : 'sit', 0.35)
    if (missed) setEmote(cat, 'annoyed')
    return
  }
  if (cat.height < 1) cat.velocity = scale(cat.velocity, 0.6)
}
