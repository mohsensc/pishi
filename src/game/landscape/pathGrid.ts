import { lawnBounds } from '../bounds'
import type { Vec } from '../types'
import type { PathStyle } from './landscapeTypes'
import { PATH_CELL_COUNT, PATH_COLUMNS, PATH_ROWS } from '../../../shared/parkLimits'

export { PATH_CELL_COUNT, PATH_COLUMNS, PATH_ROWS } from '../../../shared/parkLimits'

export const pathStyleCodes: Record<PathStyle, number> = { gravel: 1, stone: 2 }
export const pathStyles: readonly PathStyle[] = ['gravel', 'stone']

export function pathStyleOfCode(code: number): PathStyle | null {
  return pathStyles.find((style) => pathStyleCodes[style] === code) ?? null
}

export function createEmptyPathCells(): number[] {
  return Array.from({ length: PATH_CELL_COUNT }, () => 0)
}

export function pathCellIndexAt(width: number, height: number, point: Vec): number | null {
  const bounds = lawnBounds(width, height)
  const column = Math.floor(((point.x - bounds.left) / Math.max(1, bounds.right - bounds.left)) * PATH_COLUMNS)
  const row = Math.floor(((point.y - bounds.top) / Math.max(1, bounds.bottom - bounds.top)) * PATH_ROWS)
  if (column < 0 || column >= PATH_COLUMNS || row < 0 || row >= PATH_ROWS) return null
  return row * PATH_COLUMNS + column
}

export function pathCellCenter(width: number, height: number, index: number): Vec {
  const bounds = lawnBounds(width, height)
  const column = index % PATH_COLUMNS
  const row = Math.floor(index / PATH_COLUMNS)
  return {
    x: bounds.left + ((column + 0.5) / PATH_COLUMNS) * (bounds.right - bounds.left),
    y: bounds.top + ((row + 0.5) / PATH_ROWS) * (bounds.bottom - bounds.top),
  }
}

export function pathCellSize(width: number, height: number): Vec {
  const bounds = lawnBounds(width, height)
  return { x: (bounds.right - bounds.left) / PATH_COLUMNS, y: (bounds.bottom - bounds.top) / PATH_ROWS }
}

export function pathCellsAlong(width: number, height: number, from: Vec, to: Vec): number[] {
  const size = pathCellSize(width, height)
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(to.x - from.x) / size.x, Math.abs(to.y - from.y) / size.y) * 2))
  const cells: number[] = []
  for (let step = 0; step <= steps; step += 1) {
    const amount = step / steps
    const index = pathCellIndexAt(width, height, { x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount })
    if (index !== null && !cells.includes(index)) cells.push(index)
  }
  return cells
}

export function countPathCells(cells: readonly number[], style: PathStyle): number {
  const code = pathStyleCodes[style]
  return cells.reduce((count, cell) => (cell === code ? count + 1 : count), 0)
}

export function pathStyleAt(cells: readonly number[], width: number, height: number, point: Vec): PathStyle | null {
  const index = pathCellIndexAt(width, height, point)
  return index === null ? null : pathStyleOfCode(cells[index] ?? 0)
}
