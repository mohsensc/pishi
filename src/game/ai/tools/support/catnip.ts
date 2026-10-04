import type { StepContext } from '../../../memory'
import { distance } from '../../../vector'
import type { CatnipPatch, CatState } from '../../../types'

export function findPatch(context: StepContext, id: string | undefined): CatnipPatch | undefined {
  return id ? context.world.catnip.find((patch) => patch.id === id) : undefined
}

function patchVisitors(context: StepContext, patchId: string, excludeId: string): number {
  return context.world.cats.filter((cat) => cat.id !== excludeId && context.memory.minds.get(cat.id)?.scratchIds.patch === patchId).length
}

export function nearestPatch(cat: CatState, context: StepContext, radius: number): CatnipPatch | undefined {
  let best: CatnipPatch | undefined
  let bestGap = radius
  context.world.catnip.forEach((patch) => {
    if (patch.potency < 0.15) return
    const gap = distance(cat.position, patch.position)
    if (gap < bestGap && patchVisitors(context, patch.id, cat.id) < 3) {
      bestGap = gap
      best = patch
    }
  })
  return best
}
