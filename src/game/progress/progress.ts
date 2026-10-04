import type { ToolKind } from '../toolTypes'
import type { World } from '../types'
import { economyOf } from '../economy/economyState'
import type { ProgressState } from './progressTypes'

export function createProgressState(): ProgressState {
  return { collars: 0 }
}

export function progressOf(world: World): ProgressState {
  if (!world.progress) world.progress = createProgressState()
  return world.progress
}

export function isToolOwned(world: World, tool: ToolKind): boolean {
  return tool === 'hand' || economyOf(world).ownedTools.includes(tool)
}

export function usableTool(world: World, tool: ToolKind): ToolKind {
  return isToolOwned(world, tool) ? tool : 'hand'
}

export function takeCollar(world: World): boolean {
  const progress = progressOf(world)
  if (progress.collars <= 0) return false
  progress.collars -= 1
  return true
}
