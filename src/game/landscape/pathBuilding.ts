import { returnPathTiles, takePathTiles } from '../economy/pathStock'
import type { StepContext } from '../memory'
import { landscapeOf } from './landscapeState'
import { STAMP_MEMORY_SECONDS, type PathStyle } from './landscapeTypes'
import { PATH_CELL_COUNT, pathStyleCodes, pathStyleOfCode } from './pathGrid'

export interface PathPaintResult {
  painted: number[]
  short: boolean
}

function recordStamp(context: StepContext, cells: number[], style: PathStyle | null, erasedStyles: PathStyle[] = []): void {
  if (cells.length === 0) return
  const { world } = context
  const landscape = landscapeOf(world)
  landscape.serial += 1
  landscape.stamps = [
    ...landscape.stamps.filter((stamp) => world.time - stamp.time < STAMP_MEMORY_SECONDS),
    { id: `stamp-${landscape.serial}`, cells, style, erasedStyles, time: world.time },
  ]
}

function validCells(cells: readonly number[]): number[] {
  return [...new Set(cells)].filter((cell) => Number.isInteger(cell) && cell >= 0 && cell < PATH_CELL_COUNT)
}

export function paintPath(context: StepContext, style: PathStyle, cells: readonly number[]): PathPaintResult {
  const landscape = landscapeOf(context.world)
  const code = pathStyleCodes[style]
  const wanted = validCells(cells).filter((cell) => landscape.pathCells[cell] !== code)
  const next = [...landscape.pathCells]
  const painted: number[] = []
  for (const cell of wanted) {
    const previous = pathStyleOfCode(next[cell])
    if (takePathTiles(context, style, 1) < 1) break
    if (previous) returnPathTiles(context.world, previous, 1)
    next[cell] = code
    painted.push(cell)
  }
  if (painted.length > 0) landscape.pathCells = next
  recordStamp(context, painted, style)
  return { painted, short: painted.length < wanted.length }
}

export function erasePath(context: StepContext, cells: readonly number[]): number[] {
  const landscape = landscapeOf(context.world)
  const next = [...landscape.pathCells]
  const erased: number[] = []
  const erasedStyles: PathStyle[] = []
  validCells(cells).forEach((cell) => {
    const style = pathStyleOfCode(next[cell])
    if (!style) return
    returnPathTiles(context.world, style, 1)
    next[cell] = 0
    erased.push(cell)
    erasedStyles.push(style)
  })
  if (erased.length > 0) landscape.pathCells = next
  recordStamp(context, erased, null, erasedStyles)
  return erased
}
