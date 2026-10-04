import type { CatMind, PerchSpot, StepContext } from '../../memory'
import type { BallState, CatState, PropState } from '../../types'
import { distance } from '../../vector'
import { randomTimer } from './queries'
import { threatened } from './threat'

const recentHistoryLength = 10

export interface BeginOptions {
  duration?: number
  urgency?: number
}

function resetMindForBehavior(cat: CatState, mind: CatMind, context: StepContext): void {
  mind.phase = 'start'
  mind.phaseTimer = 0
  mind.attempts = 0
  mind.pounceReady = true
  mind.speedBoost = 1
  mind.calmTimer = 0
  mind.decisionTimer = randomTimer(context, 0.2, 0.6) / cat.speedMultiplier
  mind.behaviorElapsed = 0
  mind.movePose = null
  mind.scratchNumbers = {}
  mind.scratchPoints = {}
  mind.scratchIds = {}
}

export function beginBehavior(cat: CatState, mind: CatMind, context: StepContext, behaviorId: string, options: BeginOptions = {}): void {
  const behavior = context.library.byId.get(behaviorId)
  if (!behavior) throw new Error(`unknown behavior ${behaviorId}`)
  const previous = context.library.byId.get(cat.behavior)
  if (previous?.finish) previous.finish(cat, mind, context)
  cat.behavior = behavior.id
  mind.activeBehaviorId = behavior.id
  cat.intent = behavior.intent
  cat.intentTimer = options.duration ?? randomTimer(context, behavior.minDuration, behavior.maxDuration)
  resetMindForBehavior(cat, mind, context)
  mind.behaviorUrgency = options.urgency ?? 0
  mind.recentBehaviors.push({ id: behavior.id, startedAt: context.world.time })
  if (mind.recentBehaviors.length > recentHistoryLength) mind.recentBehaviors.shift()
  behavior.start(cat, mind, context)
}

export function endBehavior(cat: CatState, mind: CatMind, context: StepContext): void {
  const next = context.library.chooseNext(cat, mind, context)
  beginBehavior(cat, mind, context, next.id)
}

export function beginFlee(cat: CatState, mind: CatMind, context: StepContext, seconds: number): void {
  beginBehavior(cat, mind, context, 'fleeCursor', { duration: seconds, urgency: 5 })
}

export function beginCarry(cat: CatState, mind: CatMind, context: StepContext, seconds = randomTimer(context, 5, 9), decisionDelay = 0.2): void {
  beginBehavior(cat, mind, context, 'carryBall', { duration: seconds })
  mind.decisionTimer = decisionDelay
}

export function resumeAfterAction(cat: CatState, mind: CatMind, context: StepContext): void {
  if (cat.heldBallId) beginCarry(cat, mind, context)
  else if (threatened(cat, mind, context, 0.8)) beginFlee(cat, mind, context, 1.2)
  else endBehavior(cat, mind, context)
}

export function beginChase(cat: CatState, mind: CatMind, context: StepContext, ball: BallState, boost = 1): void {
  beginBehavior(cat, mind, context, 'chaseBall', { duration: randomTimer(context, 6, 9), urgency: 3 })
  mind.ballId = ball.id
  mind.speedBoost = boost
}

export function beginClimb(cat: CatState, mind: CatMind, context: StepContext, plan: PerchSpot): void {
  beginBehavior(cat, mind, context, 'climb', { duration: 8 })
  mind.climbPlan = plan
  mind.climbStep = 0
}

export function beginTunnel(cat: CatState, mind: CatMind, context: StepContext, tunnel: PropState): void {
  if (!tunnel.tunnelExit) return
  beginBehavior(cat, mind, context, 'tunnelRun', { duration: 7 })
  planTunnelRun(cat, mind, context, tunnel)
}

export function planTunnelRun(cat: CatState, mind: CatMind, context: StepContext, tunnel: PropState): void {
  if (!tunnel.tunnelExit) return
  const nearStart = distance(cat.position, tunnel.position) <= distance(cat.position, tunnel.tunnelExit)
  let from = nearStart ? tunnel.position : tunnel.tunnelExit
  let to = nearStart ? tunnel.tunnelExit : tunnel.position
  if (context.pointer.active) {
    const fromRisk = distance(context.pointer.position, from)
    const toRisk = distance(context.pointer.position, to)
    if (toRisk < fromRisk && toRisk < 160) {
      const swap = from
      from = to
      to = swap
    }
  }
  mind.propTargetId = tunnel.id
  mind.tunnelFrom = { x: from.x, y: from.y }
  mind.tunnelTo = { x: to.x, y: to.y }
  mind.tunnelProgress = 0
}

export function beginPass(cat: CatState, mind: CatMind, context: StepContext, teammate: CatState): void {
  beginBehavior(cat, mind, context, 'passBall', { duration: 2 })
  mind.teammateId = teammate.id
}

export function beginStash(cat: CatState, mind: CatMind, context: StepContext, box: PropState): void {
  beginBehavior(cat, mind, context, 'stashBall', { duration: 7 })
  mind.propTargetId = box.id
}
