import type { CatState, World } from '../types'
import { DROWSY_PACE, ZEST_FADE_SECONDS, ZEST_PACE } from './needCatalog'
import { peekNeedRecord } from './needState'

export function needPace(world: World, cat: CatState): number {
  const record = peekNeedRecord(world, cat.id)
  const zestLeft = record ? record.zestUntil - world.time : 0
  const zest = zestLeft > 0 ? ZEST_PACE * Math.min(1, zestLeft / ZEST_FADE_SECONDS) : 0
  const drowsy = cat.asleep ? 0 : (cat.drowsiness ?? 0) * DROWSY_PACE
  return (1 + zest) * (1 - drowsy)
}
