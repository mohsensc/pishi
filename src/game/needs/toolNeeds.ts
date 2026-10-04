import type { CareItemKind } from '../care/careTypes'
import { catCenter } from '../ai/helpers/queries'
import { requestEagerness } from '../happiness/happiness'
import type { StepContext } from '../memory'
import type { CatState, ToolKind, World } from '../types'
import { distance } from '../vector'
import { fulfillsNeed, satisfyNeed } from './needCare'

const toolRequestKinds: Partial<Record<ToolKind, CareItemKind>> = {
  treat: 'fish',
  brush: 'brush',
  wand: 'yarn',
  laser: 'yarn',
}

const toolDwellSeconds = 1.1
const toolDwellReach = 54

const dwellRecords = new WeakMap<World, Map<string, number>>()

function dwellOf(world: World): Map<string, number> {
  let records = dwellRecords.get(world)
  if (!records) {
    records = new Map()
    dwellRecords.set(world, records)
  }
  return records
}

export function requestKindOfTool(tool: ToolKind): CareItemKind | null {
  return toolRequestKinds[tool] ?? null
}

export function wantsTool(cat: CatState, tool: ToolKind): boolean {
  const kind = requestKindOfTool(tool)
  return kind !== null && Boolean(cat.need) && fulfillsNeed(cat.need as CareItemKind, kind)
}

export function satisfyByTool(cat: CatState, context: StepContext, tool: ToolKind): boolean {
  const kind = requestKindOfTool(tool)
  return kind !== null && satisfyNeed(cat, context, kind)
}

export function stepToolNeeds(context: StepContext): void {
  const { world, pointer, dt } = context
  const dwell = dwellOf(world)
  const tool = pointer.tool
  world.cats.forEach((cat) => {
    const reach = toolDwellReach * cat.coat.scale
    const near = pointer.active && !cat.hidden && wantsTool(cat, tool) && distance(pointer.position, catCenter(cat)) < reach
    if (!near) {
      dwell.delete(cat.id)
      return
    }
    const held = (dwell.get(cat.id) ?? 0) + dt * requestEagerness(cat)
    if (held < toolDwellSeconds) {
      dwell.set(cat.id, held)
      return
    }
    dwell.delete(cat.id)
    satisfyByTool(cat, context, tool)
  })
}
