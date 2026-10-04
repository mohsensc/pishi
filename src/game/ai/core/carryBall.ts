import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { MAX_CARRY_SECONDS, REGRAB_COOLDOWN } from '../../constants'
import { add, distance, normalize, scale, subtract } from '../../vector'
import type { CatState, Vec } from '../../types'
import { releaseBall } from '../helpers/ball'
import { chooseEscape, pickTeammate } from '../helpers/escape'
import { isBoxFree } from '../helpers/hiding'
import { findPerchPlan } from '../helpers/perch'
import { lockPose } from '../helpers/pose'
import { findBall, nearestProp, randomOpenPoint, randomTimer, weightedPick, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { cursorDistance, fleeRadius, threatened, topSpeed } from '../helpers/threat'
import { beginBehavior, beginChase, beginClimb, beginPass, beginStash, endBehavior } from '../helpers/transitions'

type CarryChoice = 'tease' | 'pass' | 'stash' | 'climb' | 'play' | 'improvise' | 'trot'

function decideWhileCarrying(cat: CatState, mind: CatMind, context: StepContext): boolean {
  const random = context.memory.random
  const personality = mind.personality
  const scaleFactor = context.memory.sizeScale
  const tooLong = mind.carryTime > MAX_CARRY_SECONDS * randomTimer(context, 0.55, 1)
  const teammate = random.chance(0.5) ? pickTeammate(cat, context) : undefined
  const box = nearestProp(cat, context, 'cardboardBox', 320 * scaleFactor, (prop) => isBoxFree(prop, context))
  const plan = random.chance(0.3) ? findPerchPlan(cat, mind, context, true, 360 * scaleFactor) : null
  const choice = weightedPick<CarryChoice>(context, [
    ['tease', context.pointer.active ? personality.boldness * 0.22 : 0],
    ['pass', teammate ? 0.22 : 0],
    ['stash', box ? 0.1 : 0],
    ['climb', plan ? 0.12 : 0],
    ['play', 0.12 + (tooLong ? 3 : 0)],
    ['improvise', tooLong ? 0 : 0.55],
    ['trot', tooLong ? 0 : 1],
  ])
  if (choice === 'tease') beginBehavior(cat, mind, context, 'teaseCursor', { duration: randomTimer(context, 2.5, 4) })
  else if (choice === 'pass' && teammate) beginPass(cat, mind, context, teammate)
  else if (choice === 'stash' && box) beginStash(cat, mind, context, box)
  else if (choice === 'climb' && plan) beginClimb(cat, mind, context, plan)
  else if (choice === 'play') {
    const direction = normalize({ x: cat.facing * random.range(0.6, 1), y: random.range(-0.6, 0.6) })
    const released = releaseBall(cat, mind, context, scale(direction, random.range(160, 260) * context.memory.speedScale), random.range(120, 260), REGRAB_COOLDOWN)
    lockPose(mind, 'bat', 0.3)
    if (released) beginChase(cat, mind, context, released)
  } else if (choice === 'improvise') endBehavior(cat, mind, context)
  else return false
  return true
}

function pickTrotTarget(cat: CatState, mind: CatMind, context: StepContext): Vec {
  let anchor = cat.position
  if (context.pointer.active && cursorDistance(cat, context) < fleeRadius(cat, mind, context) * 1.8) {
    anchor = add(cat.position, scale(normalize(subtract(cat.position, context.pointer.position)), 120))
  }
  return randomOpenPoint(context, anchor, 220 * context.memory.sizeScale, 24)
}

export const carryBallBehavior: Behavior = {
  id: 'carryBall',
  intent: 'carryBall',
  interruptible: false,
  ownsTimer: true,
  withBall: true,
  recencyPenalty: 0.5,
  minDuration: 3,
  maxDuration: 6,
  weight: () => 0.35,
  start() {},
  update(cat, mind, context) {
    if (!findBall(context, cat.heldBallId)) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (threatened(cat, mind, context) && mind.decisionTimer <= 0) {
      mind.decisionTimer = 0.3
      chooseEscape(cat, mind, context, true)
      return zeroVector
    }
    if (mind.decisionTimer <= 0) {
      mind.decisionTimer = randomTimer(context, 0.8, 1.5) / cat.speedMultiplier
      if (decideWhileCarrying(cat, mind, context)) return zeroVector
      if (mind.phase !== 'trot' || !mind.target || distance(cat.position, mind.target) < 14) {
        mind.phase = 'trot'
        mind.target = pickTrotTarget(cat, mind, context)
      }
    }
    if (mind.phase === 'start' && mind.phaseTimer > 0.25) {
      mind.phase = 'trot'
      mind.target = pickTrotTarget(cat, mind, context)
    }
    if (mind.phase === 'trot' && mind.target) {
      if (distance(cat.position, mind.target) < 12 * cat.coat.scale + 10) {
        if (context.memory.random.chance(0.55)) {
          mind.target = pickTrotTarget(cat, mind, context)
          return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.58)
        }
        mind.idlePose = context.memory.random.chance(0.35) ? 'sit' : 'crouch'
        mind.phase = 'pause'
        mind.phaseTimer = 0
        mind.holdDuration = randomTimer(context, 0.12, 0.45)
        return zeroVector
      }
      return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.58)
    }
    if (mind.phase === 'pause' && mind.phaseTimer > mind.holdDuration) {
      mind.phase = 'trot'
      mind.target = pickTrotTarget(cat, mind, context)
    }
    return zeroVector
  },
}
