import type { Vec } from './types'

export type ToolKind = 'hand' | 'treat' | 'wand' | 'laser' | 'brush' | 'catnip'

export interface HeldToyState {
  tool: ToolKind
  position: Vec
  height: number
  grabbedByCatId: string | null
  tugProgress: number
  snatchedAt: number | null
}

export interface TreatState {
  id: string
  position: Vec
  height: number
  verticalSpeed: number
  velocity: Vec
  claimedByCatId: string | null
  eatenAt: number | null
}

export interface CatnipPatch {
  id: string
  position: Vec
  radius: number
  createdAt: number
  potency: number
}
