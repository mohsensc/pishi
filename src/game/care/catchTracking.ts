import { STEAL_WINDOW_SECONDS } from './careCatalog'
import type { CatchKind } from './careTypes'
import type { BallState, World } from '../types'

interface HolderRecord {
  catId: string
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

export function trackBallHolders(world: World): void {
  const records = recordsOf(world)
  world.balls.forEach((ball) => {
    if (ball.status === 'held' && ball.holderId) records.set(ball.id, { catId: ball.holderId, time: world.time })
  })
  records.forEach((_record, ballId) => {
    if (!world.balls.some((ball) => ball.id === ballId)) records.delete(ballId)
  })
}

export function lastHolderOf(world: World, ball: BallState): string | null {
  const record = recordsOf(world).get(ball.id)
  if (!record || world.time - record.time > STEAL_WINDOW_SECONDS) return null
  return record.catId
}

export function classifyCatch(world: World, ball: BallState): CatchKind {
  return lastHolderOf(world, ball) ? 'stolen' : 'loose'
}
