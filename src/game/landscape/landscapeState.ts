import type { World } from '../types'
import type { LandscapeState } from './landscapeTypes'
import { createEmptyPathCells } from './pathGrid'

export function createLandscapeState(): LandscapeState {
  return { pathCells: createEmptyPathCells(), felled: [], stamps: [], serial: 0 }
}

export function landscapeOf(world: World): LandscapeState {
  if (!world.landscape) world.landscape = createLandscapeState()
  return world.landscape
}
