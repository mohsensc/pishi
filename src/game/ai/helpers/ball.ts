import { MAX_CHASERS_PER_BALL, STASH_RETRIEVE_MAX, STASH_RETRIEVE_MIN } from '../../constants'
import type { CatMind, StepContext } from '../../memory'
import { isInPond, launchBall } from '../../physics'
import { add, distance, normalize, scale, subtract } from '../../vector'
import type { BallState, CatState, PropState, Vec } from '../../types'
import { lockPose } from './pose'
import { findBall, mouthPoint, randomTimer } from './queries'
import { beginCarry } from './transitions'

export function isRegrabBlocked(mind: CatMind, ball: BallState, context: StepContext): boolean {
  return mind.regrabBallId === ball.id && context.world.time < mind.regrabUntil
}

export function blockRegrab(mind: CatMind, ball: BallState, context: StepContext, seconds: number): void {
  mind.regrabBallId = ball.id
  mind.regrabUntil = context.world.time + seconds
}

export function grabBall(cat: CatState, mind: CatMind, ball: BallState, context: StepContext): void {
  ball.status = 'held'
  ball.holderId = cat.id
  ball.stashPropId = null
  ball.velocity = { x: 0, y: 0 }
  ball.verticalSpeed = 0
  cat.heldBallId = ball.id
  mind.carryTime = 0
  if (cat.intent !== 'perch') beginCarry(cat, mind, context, randomTimer(context, 6, 10), 0.15)
  mind.decisionTimer = 0.15
}

export function releaseBall(cat: CatState, mind: CatMind, context: StepContext, velocity: Vec, verticalSpeed: number, cooldown: number): BallState | undefined {
  const ball = findBall(context, cat.heldBallId)
  cat.heldBallId = null
  mind.carryTime = 0
  if (!ball) return undefined
  ball.position = mouthPoint(cat)
  ball.height = Math.max(ball.height, cat.height + 10)
  launchBall(ball, velocity, verticalSpeed)
  blockRegrab(mind, ball, context, cooldown)
  return ball
}

export function dropHeldBall(cat: CatState, mind: CatMind, context: StepContext, awayFrom: Vec | null, cooldown = 0.8): BallState | undefined {
  if (!cat.heldBallId) return undefined
  const random = context.memory.random
  const direction = awayFrom ? normalize(subtract(cat.position, awayFrom)) : { x: cat.facing, y: 0 }
  const toss = add(scale(direction, random.range(70, 130)), { x: random.range(-40, 40), y: random.range(-25, 25) })
  return releaseBall(cat, mind, context, toss, random.range(260, 380), cooldown)
}

export function chasersOf(context: StepContext, ballId: string, excludeId: string): number {
  return context.world.cats.filter((other) => {
    if (other.id === excludeId || other.intent !== 'chaseBall') return false
    return context.memory.minds.get(other.id)?.ballId === ballId
  }).length
}

export function pickBallFor(cat: CatState, mind: CatMind, context: StepContext): BallState | undefined {
  let best: BallState | undefined
  let bestScore = Number.POSITIVE_INFINITY
  context.world.balls.forEach((ball) => {
    if (ball.status !== 'loose' || isRegrabBlocked(mind, ball, context)) return
    if (isInPond(context.world.props, ball.position, 0.8)) return
    if (chasersOf(context, ball.id, cat.id) >= MAX_CHASERS_PER_BALL) return
    const gap = distance(cat.position, ball.position)
    const cursorGap = context.pointer.active ? distance(context.pointer.position, ball.position) : Number.POSITIVE_INFINITY
    const risk = cursorGap < 150 ? (1 - mind.personality.boldness) * 420 : 0
    const score = gap + risk
    if (score < bestScore) {
      bestScore = score
      best = ball
    }
  })
  return best
}

export function batBall(cat: CatState, mind: CatMind, context: StepContext, ball: BallState): void {
  const random = context.memory.random
  let direction = normalize({ x: cat.facing, y: random.range(-0.8, 0.8) })
  if (context.pointer.active) {
    const away = normalize(subtract(ball.position, context.pointer.position))
    direction = normalize(add(away, scale(direction, 0.6)))
  }
  const power = randomTimer(context, 180, 300) * context.memory.speedScale
  launchBall(ball, scale(direction, power), randomTimer(context, 90, 240))
  blockRegrab(mind, ball, context, 0.35)
  lockPose(mind, 'bat', 0.28)
  mind.batCooldown = randomTimer(context, 1.2, 2.5)
  mind.pounceReady = true
}

export function placeInStash(cat: CatState, mind: CatMind, box: PropState, context: StepContext): void {
  const ball = findBall(context, cat.heldBallId)
  cat.heldBallId = null
  mind.carryTime = 0
  if (!ball) return
  ball.status = 'stashed'
  ball.holderId = null
  ball.stashPropId = box.id
  ball.position = { x: box.position.x, y: box.position.y }
  ball.height = 0
  ball.velocity = { x: 0, y: 0 }
  ball.verticalSpeed = 0
  const since = context.world.time
  context.memory.stashes.set(ball.id, {
    ballId: ball.id,
    propId: box.id,
    since,
    retrieveAt: since + randomTimer(context, STASH_RETRIEVE_MIN - 2.5, STASH_RETRIEVE_MAX - 3.5),
    stasherId: cat.id,
    retrieverId: null,
  })
}

export function ejectStashedBall(ball: BallState, prop: PropState | undefined, context: StepContext, power = 1): void {
  const { memory } = context
  memory.stashes.delete(ball.id)
  const angle = memory.random.range(0, Math.PI * 2)
  ball.position = { x: prop ? prop.position.x : ball.position.x, y: prop ? prop.position.y + prop.radius * 0.6 : ball.position.y }
  ball.height = Math.max(20, prop && prop.kind === 'tree' ? 120 : 20)
  launchBall(ball, { x: Math.cos(angle) * 140 * power, y: Math.abs(Math.sin(angle)) * 110 * power }, 380 * power)
}

export function ejectStashesIn(prop: PropState, context: StepContext): number {
  let ejected = 0
  context.world.balls.forEach((ball) => {
    if (ball.status !== 'stashed' || ball.stashPropId !== prop.id) return
    const record = context.memory.stashes.get(ball.id)
    if (record?.retrieverId) {
      const retriever = context.world.cats.find((cat) => cat.id === record.retrieverId)
      if (retriever && retriever.intent === 'retrieveBall' && !retriever.hidden) retriever.intentTimer = 0
    }
    ejectStashedBall(ball, prop, context)
    ejected += 1
  })
  return ejected
}
