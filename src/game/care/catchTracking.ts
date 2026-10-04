import { STEAL_MIN_HOLD_SECONDS } from '../economy/economyConstants'
import { STEAL_WINDOW_SECONDS } from './careCatalog'
import type { CatchKind } from './careTypes'
import type { BallState, World } from '../types'

interface HolderRecord {
  catId: string
  since: number
  time: number
}

const holderRecords = new WeakMap<World, Map<string, HolderRecord>>()

function recordsOf(world: World): Map<string, HolderRecord> {
  let records = holderRecords.get(world)
  if (!records) {
    records = new Map()
    holderRecords.set(world, records)
  }
  return records
}

function continuesHold(record: HolderRecord | undefined, catId: string, time: number, step: number): record is HolderRecord {
  return record !== undefined && record.catId === catId && time - record.time <= step
}

export function trackBallHolders(world: World, step = 1 / 20): void {
  const records = recordsOf(world)
  const liveIds = new Set(world.balls.map((ball) => ball.id))
  world.balls.forEach((ball) => {
    if (ball.status !== 'held' || !ball.holderId) return
    const previous = records.get(ball.id)
    const since = continuesHold(previous, ball.holderId, world.time, step) ? previous.since : world.time
    records.set(ball.id, { catId: ball.holderId, since, time: world.time })
  })
  records.forEach((_record, ballId) => {
    if (!liveIds.has(ballId)) records.delete(ballId)
  })
}

export function forgetBallHolder(world: World, ballId: string): void {
  recordsOf(world).delete(ballId)
}

export function lastHolderOf(world: World, ball: BallState): string | null {
  const record = recordsOf(world).get(ball.id)
  if (!record || world.time - record.time > STEAL_WINDOW_SECONDS) return null
  return record.catId
}

export function heldSecondsOf(world: World, ball: BallState): number {
  const record = recordsOf(world).get(ball.id)
  if (!record || world.time - record.time > STEAL_WINDOW_SECONDS) return 0
  return record.time - record.since
}

export function classifyCatch(world: World, ball: BallState): CatchKind {
  return lastHolderOf(world, ball) && heldSecondsOf(world, ball) >= STEAL_MIN_HOLD_SECONDS ? 'stolen' : 'loose'
}
