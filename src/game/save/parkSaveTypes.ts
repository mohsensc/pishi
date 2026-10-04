import type { ParkOwner } from '../../../shared/parkName'
import type { EngineMemory, StepContext } from '../memory'
import type { Vec, World } from '../types'

export const PARK_SAVE_VERSION = 3
export const LAST_LEGACY_SAVE_VERSION = 2

export interface SavedViewport {
  width: number
  height: number
}

export interface ParkIdentity {
  owner: ParkOwner
  seed: number
}

export interface ParkSave extends ParkIdentity {
  version: number
  updatedAt: number
  viewport: SavedViewport
  sections: Record<string, unknown>
}

export interface RestoreScene {
  world: World
  memory: EngineMemory
  context: StepContext
  save: ParkSave
  mapPoint: (point: Vec) => Vec
  sizeRatio: number
  catScaleRatio: number
}

export interface ParkSection {
  key: string
  capture: (world: World) => unknown
  restore: (raw: unknown, scene: RestoreScene) => void
}
