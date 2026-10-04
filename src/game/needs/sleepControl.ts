import { dropHeldBall } from '../ai/helpers/ball'
import { faceToward, lockPose, setEmote } from '../ai/helpers/pose'
import { mindOf } from '../ai/helpers/queries'
import { beginBehavior } from '../ai/helpers/transitions'
import { isDragging } from '../dragging'
import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import type { CatState, Vec } from '../types'
import { NAP_SECONDS, NAP_WAKE_URGE, REPOKE_EXTENSION, ROUSE_SECONDS, type SecondsRange } from './needCatalog'
import { groggyWakeId, needSleepId } from './needIds'
import { needRecordOf } from './needState'

const protectedBehaviorIds = new Set(['enjoyCareItem', 'celebrate'])
const sleepUrgency = 7
const groggyUrgency = 3.6
const dropCooldown = 1.5

function rangeOf(context: StepContext, range: SecondsRange): number {
  return context.memory.random.range(range[0], range[1])
}

function isGrounded(cat: CatState, context: StepContext): boolean {
  const mind = mindOf(cat, context)
  return !cat.hidden && !mind.leap && cat.height <= 1 && !cat.propId && !mind.perch && !isDragging(context.world, 'cat', cat.id)
}

export function canSettleToSleep(cat: CatState, context: StepContext): boolean {
  return isGrounded(cat, context) && !protectedBehaviorIds.has(cat.behavior)
}

export function settleToSleep(cat: CatState, context: StepContext): void {
  const mind = mindOf(cat, context)
  if (cat.heldBallId) dropHeldBall(cat, mind, context, null, dropCooldown)
  beginBehavior(cat, mind, context, needSleepId, { urgency: sleepUrgency })
}

export function fallAsleep(cat: CatState, context: StepContext): void {
  const record = needRecordOf(context, cat)
  cat.asleep = true
  record.napEndsAt = context.world.time + rangeOf(context, NAP_SECONDS)
  record.rousedUntil = 0
  if (cat.heldBallId) dropHeldBall(cat, mindOf(cat, context), context, null, dropCooldown)
  if (canSettleToSleep(cat, context)) settleToSleep(cat, context)
}

export function rouseCat(cat: CatState, context: StepContext, seconds: number, grumpy: boolean, toward: Vec | null): void {
  const record = needRecordOf(context, cat)
  const mind = mindOf(cat, context)
  record.rousedUntil = Math.max(record.rousedUntil, context.world.time + seconds)
  if (toward) faceToward(cat, mind, toward, 1.2)
  setEmote(cat, grumpy ? 'annoyed' : 'sleepy')
  if (isGrounded(cat, context) && !protectedBehaviorIds.has(cat.behavior)) beginBehavior(cat, mind, context, groggyWakeId, { urgency: groggyUrgency })
}

export function pokeSleeper(cat: CatState, context: StepContext, point: Vec): boolean {
  if (!cat.asleep) return false
  const { world } = context
  const record = needRecordOf(context, cat)
  const mind = mindOf(cat, context)
  if (record.rousedUntil > world.time) {
    record.rousedUntil = Math.min(record.rousedUntil + REPOKE_EXTENSION, world.time + ROUSE_SECONDS[1])
    faceToward(cat, mind, point, 1)
    setEmote(cat, 'annoyed')
    if (!mind.leap) lockPose(mind, 'arch', 0.35)
    return true
  }
  rouseCat(cat, context, rangeOf(context, ROUSE_SECONDS), context.memory.random.chance(0.6), point)
  if (!mind.leap) lockPose(mind, 'stretch', 0.9)
  spawnEffect(world, 'furTuft', cat.position, cat.height + 14 * cat.coat.scale, null, 0.4)
  return true
}

export function wakeNaturally(cat: CatState, context: StepContext): void {
  const record = needRecordOf(context, cat)
  cat.asleep = false
  cat.needUrge = Math.min(cat.needUrge ?? 0, NAP_WAKE_URGE)
  record.rousedUntil = 0
  record.napEndsAt = 0
  const mind = mindOf(cat, context)
  setEmote(cat, 'sleepy')
  if (canSettleToSleep(cat, context)) beginBehavior(cat, mind, context, 'stretchIdle')
}

export function wakeFully(cat: CatState, context: StepContext): void {
  const record = needRecordOf(context, cat)
  cat.asleep = false
  record.rousedUntil = 0
  record.napEndsAt = 0
}
