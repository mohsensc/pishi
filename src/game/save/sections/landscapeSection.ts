import { createLandscapeState } from '../../landscape/landscapeState'
import { PATH_CELL_COUNT, pathStyles, pathStyleCodes } from '../../landscape/pathGrid'
import { MAX_TREES } from '../../economy/economyConstants'
import type { World } from '../../types'
import { isRecord } from '../fieldReaders'
import type { ParkSection } from '../parkSaveTypes'

const validCodes = new Set<number>([0, ...pathStyles.map((style) => pathStyleCodes[style])])

function encodeCells(cells: readonly number[]): string {
  return cells.map((cell) => String(cell)).join('')
}

function decodeCells(raw: unknown): number[] | null {
  if (typeof raw !== 'string' || raw.length !== PATH_CELL_COUNT) return null
  const cells = [...raw].map((digit) => Number(digit))
  return cells.every((cell) => validCodes.has(cell)) ? cells : null
}

function trimExcessTrees(world: World): void {
  let trees = 0
  world.props = world.props.filter((prop) => {
    if (prop.kind !== 'tree') return true
    trees += 1
    return trees <= MAX_TREES
  })
}

export const landscapeSection: ParkSection = {
  key: 'landscape',
  capture: (world) => ({ pathCells: encodeCells(world.landscape.pathCells) }),
  restore: (raw, { world }) => {
    const landscape = createLandscapeState()
    const cells = isRecord(raw) ? decodeCells(raw.pathCells) : null
    world.landscape = cells ? { ...landscape, pathCells: cells } : landscape
    trimExcessTrees(world)
  },
}
