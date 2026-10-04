import type { StepContext } from '../memory'
import type { CatState, World } from '../types'
import { NEED_FIRST_DELAY, NEED_PATIENCE } from './needCatalog'
import type { NeedRecord } from './needTypes'

const needRecords = new WeakMap<World, Map<string, NeedRecord>>()

function createRecord(nextNeedAt: number, patience: number): NeedRecord {
  return { nextNeedAt, patience, napEndsAt: 0, rousedUntil: 0, zestUntil: 0, zestPending: false, stirCooldownUntil: 0, lastNeed: null }
}

function seedRecords(context: StepContext): Map<string, NeedRecord> {
  const { world, memory } = context
  const [earliest, latest] = NEED_FIRST_DELAY
  const order = world.cats.map((cat) => ({ cat, roll: memory.random.next() })).sort((first, second) => first.roll - second.roll)
  const slot = (latest - earliest) / Math.max(1, order.length)
  const records = new Map<string, NeedRecord>()
  order.forEach(({ cat }, index) => {
    const firstNeedAt = world.time + earliest + slot * (index + memory.random.next() * 0.8)
    records.set(cat.id, createRecord(firstNeedAt, memory.random.range(NEED_PATIENCE[0], NEED_PATIENCE[1])))
  })
  return records
}

export function needRecordsOf(context: StepContext): Map<string, NeedRecord> {
  let records = needRecords.get(context.world)
  if (!records) {
    records = seedRecords(context)
    needRecords.set(context.world, records)
  }
  return records
}

export function needRecordOf(context: StepContext, cat: CatState): NeedRecord {
  const records = needRecordsOf(context)
  let record = records.get(cat.id)
  if (!record) {
    const random = context.memory.random
    record = createRecord(context.world.time + random.range(NEED_FIRST_DELAY[0], NEED_FIRST_DELAY[1]), random.range(NEED_PATIENCE[0], NEED_PATIENCE[1]))
    records.set(cat.id, record)
  }
  return record
}

export function peekNeedRecord(world: World, catId: string): NeedRecord | undefined {
  return needRecords.get(world)?.get(catId)
}
