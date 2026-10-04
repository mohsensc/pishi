import type { StepContext } from './memory'
import type { PointerState, World } from './types'
import { handleToolClicks } from './tools/clicks'
import { advanceDay } from './tools/dayCycle'
import { updateFeeding } from './tools/feeding'
import { updateHeldToy } from './tools/heldToy'
import { resolveToolJumps } from './tools/leapChecks'
import { trackPetting } from './tools/petting'
import { CATNIP_LIFETIME } from './tools/toolConstants'
import { toolMemoryOf } from './tools/toolState'
import { updateCatnip, updateTreats } from './tools/treats'

export function updateTools(world: World, context: StepContext, _dt: number, pointer: PointerState): void {
  toolMemoryOf(world).lastTool = pointer.tool
  advanceDay(context, context.dt)
  updateHeldToy(context)
  handleToolClicks(context)
  resolveToolJumps(context)
  trackPetting(context)
  updateTreats(context)
  updateCatnip(context, CATNIP_LIFETIME)
  updateFeeding(context)
}
