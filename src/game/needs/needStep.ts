import { mindOf } from '../ai/helpers/queries'
import { dropHeldBall } from '../ai/helpers/ball'
import { isDragging } from '../dragging'
import type { StepContext } from '../memory'
import { distance } from '../vector'
import type { CatState } from '../types'
import {
  BALL_STIR_COOLDOWN,
  BALL_STIR_RADIUS,
  BALL_STIR_RATE,
  BALL_STIR_SECONDS,
  DRAG_ROUSE_SECONDS,
  DROWSY_START_URGE,
  MAX_AWAKE_DROWSINESS,
  MAX_AWAKE_NEEDY_CATS,
  MIN_AWAKE_CATS,
  NEED_RETRY_DELAY,
} from './needCatalog'
import { assignNeed } from './needAssignment'
import { ensureNeedHooks } from './needCare'
import { needRecordOf } from './needState'
import type { NeedRecord } from './needTypes'
import { kickOffZest } from './zestKickoff'
import { needSleepId } from './needIds'
import { canSettleToSleep, fallAsleep, rouseCat, settleToSleep, wakeNaturally } from './sleepControl'

const stirMaxHeight = 14
const rousedDrowsiness = 0.75
const dozingDrowsiness = 0.9

interface NeedTally {
  awake: number
  awakeNeedy: number
}

function tallyCats(context: StepContext): NeedTally {
  return context.world.cats.reduce(
    (tally, cat) => {
      if (cat.hidden || cat.asleep) return tally
      return { awake: tally.awake + 1, awakeNeedy: tally.awakeNeedy + (cat.need ? 1 : 0) }
    },
    { awake: 0, awakeNeedy: 0 },
  )
}

function smoothstep(value: number): number {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * (3 - 2 * clamped)
}

function drowsinessOf(cat: CatState, record: NeedRecord, time: number): number {
  if (cat.asleep) return record.rousedUntil > time ? rousedDrowsiness : dozingDrowsiness
  if (!cat.need) return 0
  return smoothstep(((cat.needUrge ?? 0) - DROWSY_START_URGE) / (1 - DROWSY_START_URGE)) * MAX_AWAKE_DROWSINESS
}

function progressNeed(cat: CatState, context: StepContext, record: NeedRecord, tally: NeedTally): void {
  const { world, memory, dt } = context
  if (!cat.need) {
    if (world.time < record.nextNeedAt || cat.asleep) return
    if (tally.awakeNeedy >= MAX_AWAKE_NEEDY_CATS) {
      record.nextNeedAt = world.time + memory.random.range(NEED_RETRY_DELAY[0], NEED_RETRY_DELAY[1])
      return
    }
    assignNeed(cat, context, record)
    tally.awakeNeedy += 1
    return
  }
  if (cat.asleep) return
  cat.needUrge = Math.min(1, (cat.needUrge ?? 0) + dt / record.patience)
  if (cat.needUrge < 1 || tally.awake <= MIN_AWAKE_CATS || !canSettleToSleep(cat, context)) return
  fallAsleep(cat, context)
  tally.awake -= 1
  tally.awakeNeedy -= 1
}

function stirNearBall(cat: CatState, context: StepContext, record: NeedRecord): void {
  const { world, memory, dt } = context
  if (world.time < record.stirCooldownUntil) return
  const reach = BALL_STIR_RADIUS * cat.coat.scale * memory.sizeScale
  const ball = world.balls.find((candidate) => candidate.status === 'loose' && candidate.height < stirMaxHeight && distance(candidate.position, cat.position) < reach)
  if (!ball || !memory.random.chance(dt * BALL_STIR_RATE)) return
  record.stirCooldownUntil = world.time + BALL_STIR_COOLDOWN
  rouseCat(cat, context, memory.random.range(BALL_STIR_SECONDS[0], BALL_STIR_SECONDS[1]), false, ball.position)
}

function tendSleeper(cat: CatState, context: StepContext, record: NeedRecord): void {
  const { world } = context
  if (record.rousedUntil > world.time) return
  if (cat.behavior === needSleepId) {
    if (world.time >= record.napEndsAt) {
      wakeNaturally(cat, context)
      return
    }
    if (cat.heldBallId) dropHeldBall(cat, mindOf(cat, context), context, null, 1.5)
    stirNearBall(cat, context, record)
    return
  }
  if (canSettleToSleep(cat, context)) settleToSleep(cat, context)
}

export function stepNeeds(context: StepContext): void {
  ensureNeedHooks()
  const { world } = context
  const tally = tallyCats(context)
  world.cats.forEach((cat) => {
    const record = needRecordOf(context, cat)
    const dragged = isDragging(world, 'cat', cat.id)
    if (dragged && cat.asleep) record.rousedUntil = Math.max(record.rousedUntil, world.time + DRAG_ROUSE_SECONDS)
    if (!cat.hidden && !dragged) {
      progressNeed(cat, context, record, tally)
      if (cat.asleep) tendSleeper(cat, context, record)
      else kickOffZest(cat, context, record)
    }
    cat.drowsiness = drowsinessOf(cat, record, world.time)
  })
}
