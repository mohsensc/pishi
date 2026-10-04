import type { CatState } from '../types'
import type { StepContext } from '../memory'

export type CareItemKind = 'fish' | 'milk' | 'yarn' | 'brush' | 'treat'

export type CareNeed = 'hunger' | 'thirst' | 'play' | 'affection'

export type CatchKind = 'loose' | 'stolen'

export interface CareItem {
  id: string
  kind: CareItemKind
  unlockedAt: number
}

export interface CareReward {
  id: string
  catchKind: CatchKind
  points: number
  unlockedKind: CareItemKind | null
  time: number
}

export interface CareState {
  meter: number
  inventory: CareItem[]
  lastReward: CareReward | null
  serial: number
}

export interface CarePresentation {
  context: StepContext
  cat: CatState
  kind: CareItemKind
  needs: readonly CareNeed[]
}

export type CarePresentedListener = (presentation: CarePresentation) => void

export type CareDemandProvider = (context: StepContext) => Partial<Record<CareItemKind, number>>
