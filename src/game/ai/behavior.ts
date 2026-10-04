import type { CatMind, StepContext } from '../memory'
import type { CatIntent, CatState, Vec } from '../types'

export interface Behavior {
  id: string
  intent: CatIntent
  weight(cat: CatState, mind: CatMind, context: StepContext): number
  urgency?(cat: CatState, mind: CatMind, context: StepContext): number
  start(cat: CatState, mind: CatMind, context: StepContext): void
  update(cat: CatState, mind: CatMind, context: StepContext): Vec
  finish?(cat: CatState, mind: CatMind, context: StepContext): void
  interruptible: boolean
  minDuration: number
  maxDuration: number
  ownsTimer?: boolean
  elevated?: boolean
  withBall?: boolean
  recencyPenalty?: number
  overridesCommitment?: boolean
}

export interface BehaviorLibrary {
  all: Behavior[]
  byId: Map<string, Behavior>
  chooseNext(cat: CatState, mind: CatMind, context: StepContext): Behavior
  chooseUrgent(cat: CatState, mind: CatMind, context: StepContext, overridesOnly: boolean): { behavior: Behavior; urgency: number } | null
}
