import type { Vec } from './types'

export type BallKind = 'tennis' | 'mouse'

export type DragTarget = 'prop' | 'cat' | 'ball' | 'treat'

export interface DragState {
  target: DragTarget
  id: string
  grabOffset: Vec
  startedAt: number
  pointer: Vec
  velocity: Vec
  lift: number
}

export interface DragHit {
  target: DragTarget
  id: string
}

export type SpawnablePropKind =
  | 'cardboardBox'
  | 'catTree'
  | 'bench'
  | 'yarnBasket'
  | 'scratchingPost'
  | 'foodBowl'
  | 'rock'
  | 'bush'
  | 'flowerBed'
  | 'cushion'

export type SpawnableItem = { category: 'prop'; kind: SpawnablePropKind } | { category: 'toy'; kind: BallKind }

export interface TreatBagShake {
  position: Vec
  time: number
}
