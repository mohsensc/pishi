import { CAT_WALK_RUN_THRESHOLD } from '../../constants'
import type { CatMind, StepContext } from '../../memory'
import { length } from '../../vector'
import type { CatAction, CatEmote, CatPose, CatState, Vec } from '../../types'
import { findBall, findButterfly, findCat } from './queries'
import { threatened } from './threat'

export function lockPose(mind: CatMind, pose: CatPose, duration: number): void {
  mind.poseLock = pose
  mind.poseTimer = duration
}

export function setEmote(cat: CatState, emote: CatEmote): void {
  cat.emote = emote
  cat.emoteAge = 0
}

export function setAction(cat: CatState, action: CatAction): void {
  cat.action = action
  cat.actionAge = 0
}

export function faceToward(cat: CatState, mind: CatMind, point: Vec, hold = 0.6): void {
  if (Math.abs(point.x - cat.position.x) < 2) return
  cat.facing = point.x >= cat.position.x ? 1 : -1
  mind.facingHold = Math.max(mind.facingHold, hold)
}

export function lookAt(cat: CatState, point: Vec): void {
  cat.gaze = { x: point.x, y: point.y }
}

const turnCommitSeconds = 0.1
const fastTurnSpeed = 150

export function updateFacing(cat: CatState, mind: CatMind, dt: number): void {
  if (mind.facingHold > 0) return
  if (Math.abs(cat.velocity.x) > 26) {
    const wanted: 1 | -1 = cat.velocity.x > 0 ? 1 : -1
    if (wanted === cat.facing) {
      mind.facingPressure = 0
      return
    }
    mind.facingPressure += dt
    if (mind.facingPressure >= turnCommitSeconds || Math.abs(cat.velocity.x) > fastTurnSpeed) {
      cat.facing = wanted
      mind.facingHold = 0.3
      mind.facingPressure = 0
    }
    return
  }
  mind.facingPressure = 0
  if (length(cat.velocity) < 12) {
    const offset = cat.gaze.x - cat.position.x
    if (Math.abs(offset) > 50) {
      const wanted: 1 | -1 = offset > 0 ? 1 : -1
      if (wanted !== cat.facing) {
        cat.facing = wanted
        mind.facingHold = 0.6
      }
    }
  }
}

export function updateGaze(cat: CatState, mind: CatMind, context: StepContext): void {
  const override = mind.scratchPoints.gaze
  if (override) {
    cat.gaze = { x: override.x, y: override.y }
    return
  }
  if (context.pointer.active && (threatened(cat, mind, context, 1.4) || cat.intent === 'teaseCursor' || cat.intent === 'celebrate')) {
    cat.gaze = { x: context.pointer.position.x, y: context.pointer.position.y }
    return
  }
  const ball = findBall(context, mind.ballId)
  if ((cat.intent === 'chaseBall' || cat.intent === 'teaseCursor') && ball) {
    cat.gaze = { x: ball.position.x, y: ball.position.y - ball.height }
    return
  }
  const butterfly = findButterfly(context, mind.butterflyId)
  if (cat.intent === 'chaseButterfly' && butterfly) {
    cat.gaze = { x: butterfly.position.x, y: butterfly.position.y - butterfly.height }
    return
  }
  const teammate = findCat(context, mind.teammateId)
  if (cat.intent === 'passBall' && teammate) {
    cat.gaze = { x: teammate.position.x, y: teammate.position.y }
    return
  }
  const loose = context.world.balls.find((candidate) => candidate.status === 'loose' && Math.hypot(candidate.position.x - cat.position.x, candidate.position.y - cat.position.y) < 220)
  if (loose) {
    cat.gaze = { x: loose.position.x, y: loose.position.y - loose.height }
    return
  }
  cat.gaze = { x: cat.position.x + cat.facing * 80, y: cat.position.y - 10 }
}

export function updatePose(cat: CatState, mind: CatMind, context: StepContext): void {
  if (mind.leap) {
    cat.pose = mind.leap.windup > 0 ? 'crouch' : mind.leap.pose
    return
  }
  if (mind.poseLock) {
    cat.pose = mind.poseLock
    return
  }
  if (cat.hidden) {
    cat.pose = 'loaf'
    return
  }
  const speed = length(cat.velocity)
  const runThreshold = Math.max(90 * context.memory.speedScale, mind.personality.maxSpeed * context.memory.speedScale * CAT_WALK_RUN_THRESHOLD)
  if (speed > runThreshold) cat.pose = 'run'
  else if (speed > 14) cat.pose = mind.movePose ?? 'walk'
  else cat.pose = mind.idlePose
}
