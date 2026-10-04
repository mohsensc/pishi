import type { CareItemKind } from '../care/careTypes'

export interface NeedRecord {
  nextNeedAt: number
  patience: number
  napEndsAt: number
  rousedUntil: number
  zestUntil: number
  zestPending: boolean
  stirCooldownUntil: number
  lastNeed: CareItemKind | null
}
