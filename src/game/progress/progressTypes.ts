import type { BallKind, SpawnablePropKind } from '../handlingTypes'

export type UnlockableItemKind = SpawnablePropKind | BallKind

export interface ProgressState {
  collars: number
}
