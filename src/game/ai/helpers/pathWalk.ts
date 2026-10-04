import { PATH_COLUMNS, PATH_ROWS, pathCellCenter } from '../../landscape/pathGrid'
import type { StepContext } from '../../memory'
import type { Vec } from '../../types'
import { distance } from '../../vector'
import { isOpenGround } from './queries'

const neighborOffsets: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
]

function isWalkableCell(context: StepContext, cell: number): boolean {
  if ((context.world.landscape?.pathCells[cell] ?? 0) <= 0) return false
  return isOpenGround(pathCellCenter(context.world.width, context.world.height, cell), context, 8)
}

export function nearbyPathCell(context: StepContext, from: Vec, reach: number): number | null {
  const cells = context.world.landscape?.pathCells
  if (!cells) return null
  const candidates: number[] = []
  cells.forEach((code, cell) => {
    if (code <= 0) return
    if (distance(pathCellCenter(context.world.width, context.world.height, cell), from) <= reach && isWalkableCell(context, cell)) candidates.push(cell)
  })
  return candidates.length > 0 ? context.memory.random.pick(candidates) : null
}

export function nextPathCell(context: StepContext, cell: number, previous: number): number | null {
  if (cell < 0) return null
  const column = cell % PATH_COLUMNS
  const row = Math.floor(cell / PATH_COLUMNS)
  const options: number[] = []
  neighborOffsets.forEach(([stepX, stepY]) => {
    const nextColumn = column + stepX
    const nextRow = row + stepY
    if (nextColumn < 0 || nextColumn >= PATH_COLUMNS || nextRow < 0 || nextRow >= PATH_ROWS) return
    const next = nextRow * PATH_COLUMNS + nextColumn
    if (next !== previous && isWalkableCell(context, next)) options.push(next)
  })
  if (options.length === 0) return null
  const straight = previous >= 0 ? options.find((option) => option - cell === cell - previous) : undefined
  return straight !== undefined && context.memory.random.chance(0.6) ? straight : context.memory.random.pick(options)
}
