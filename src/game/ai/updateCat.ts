import { ACTION_LIFETIME, EMOTE_LIFETIME, URGENCY_CHECK_INTERVAL } from '../constants'
import type { CatMind, StepContext } from '../memory'
import type { CatPose, CatState } from '../types'
import type { Behavior } from './behavior'
import { maybeJumpOver } from './helpers/jumpOver'
import { updateLeap } from './helpers/leap'
import { freeIfStuck } from './helpers/unstick'
import { dismount } from './helpers/perch'
import { updateFacing, updateGaze, updatePose } from './helpers/pose'
import { mindOf } from './helpers/queries'
import { checkFumble } from './helpers/reactions'
import { applySteering, coast } from './helpers/steering'
import { beginBehavior, endBehavior } from './helpers/transitions'

const freezingPoses = new Set<CatPose>(['startle', 'arch', 'bat', 'stretch', 'scratch', 'flop'])

function tickTimers(cat: CatState, mind: CatMind, dt: number): void {
  cat.clock += dt
  cat.intentTimer -= dt
  mind.phaseTimer += dt
  mind.decisionTimer -= dt
  mind.urgencyTimer -= dt
  mind.behaviorElapsed += dt
  mind.facingHold = Math.max(0, mind.facingHold - dt)
  mind.jumpOverCooldown = Math.max(0, mind.jumpOverCooldown - dt)
  mind.batCooldown = Math.max(0, mind.batCooldown - dt)
  mind.fumbleCooldown = Math.max(0, mind.fumbleCooldown - dt)
  mind.napCooldown = Math.max(0, mind.napCooldown - dt)
  mind.pokeCooldown = Math.max(0, mind.pokeCooldown - dt)
  if (cat.heldBallId) mind.carryTime += dt
  if (mind.poseLock) {
    mind.poseTimer -= dt
    if (mind.poseTimer <= 0) mind.poseLock = null
  }
  if (cat.emote) {
    cat.emoteAge += dt
    if (cat.emoteAge > EMOTE_LIFETIME) cat.emote = null
  }
  if (cat.action) {
    cat.actionAge += dt
    if (cat.actionAge > ACTION_LIFETIME) cat.action = null
  }
}

function currentBehavior(cat: CatState, mind: CatMind, context: StepContext): Behavior {
  const behavior = context.library.byId.get(cat.behavior)
  if (behavior && mind.activeBehaviorId === cat.behavior) return behavior
  if (mind.activeBehaviorId !== cat.behavior) cat.behavior = ''
  endBehavior(cat, mind, context)
  return context.library.byId.get(cat.behavior) ?? context.library.chooseNext(cat, mind, context)
}

function considerUrgent(cat: CatState, mind: CatMind, context: StepContext, behavior: Behavior): void {
  if (mind.urgencyTimer > 0) return
  mind.urgencyTimer = URGENCY_CHECK_INTERVAL * context.memory.random.range(0.8, 1.2)
  const urgent = context.library.chooseUrgent(cat, mind, context, !behavior.interruptible)
  if (urgent && urgent.urgency > mind.behaviorUrgency) beginBehavior(cat, mind, context, urgent.behavior.id, { urgency: urgent.urgency })
}

function finishTimedBehavior(cat: CatState, mind: CatMind, context: StepContext, behavior: Behavior): void {
  const expired = behavior.ownsTimer ? mind.behaviorElapsed > Math.max(behavior.maxDuration * 3, 30) && behavior.interruptible : cat.intentTimer <= 0
  if (expired) endBehavior(cat, mind, context)
}

function settleView(cat: CatState, mind: CatMind, context: StepContext): void {
  updateGaze(cat, mind, context)
  updateFacing(cat, mind, context.dt)
  updatePose(cat, mind, context)
}

export function updateCat(cat: CatState, context: StepContext): void {
  const mind = mindOf(cat, context)
  tickTimers(cat, mind, context.dt)
  if (mind.leap) {
    updateLeap(cat, mind, context)
    updateGaze(cat, mind, context)
    updatePose(cat, mind, context)
    return
  }
  if (mind.poseLock && freezingPoses.has(mind.poseLock)) {
    if (!cat.hidden && cat.intent !== 'perch') coast(cat, context)
    updateGaze(cat, mind, context)
    updatePose(cat, mind, context)
    return
  }
  let behavior = currentBehavior(cat, mind, context)
  if (!cat.hidden && cat.height > 1 && !mind.perch && !behavior.elevated) {
    dismount(cat, mind, context, 'ground')
    updatePose(cat, mind, context)
    return
  }
  checkFumble(cat, mind, context)
  behavior = currentBehavior(cat, mind, context)
  considerUrgent(cat, mind, context, behavior)
  behavior = currentBehavior(cat, mind, context)
  finishTimedBehavior(cat, mind, context, behavior)
  behavior = currentBehavior(cat, mind, context)
  const desired = behavior.update(cat, mind, context)
  const stationary = cat.hidden || cat.intent === 'perch' || mind.leap !== null || cat.height > 1
  if (!stationary) {
    applySteering(cat, mind, context, desired)
    if (!freeIfStuck(cat, mind, context, desired)) maybeJumpOver(cat, mind, context)
  }
  settleView(cat, mind, context)
}
