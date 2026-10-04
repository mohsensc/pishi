import type { StepContext } from '../../../memory'
import { distance } from '../../../vector'
import type { CatState, TreatState } from '../../../types'

export function findTreat(context: StepContext, id: string | undefined): TreatState | undefined {
  return id ? context.world.treats.find((treat) => treat.id === id) : undefined
}

export function isTreatAvailable(treat: TreatState, catId: string): boolean {
  return treat.eatenAt === null && (treat.claimedByCatId === null || treat.claimedByCatId === catId)
}

function racersFor(context: StepContext, treatId: string, excludeId: string): number {
  return context.world.cats.filter((cat) => cat.id !== excludeId && cat.behavior === 'raceForDroppedTreat' && context.memory.minds.get(cat.id)?.scratchIds.treat === treatId).length
}

export function nearestOpenTreat(cat: CatState, context: StepContext, radius: number): TreatState | undefined {
  let best: TreatState | undefined
  let bestGap = radius
  context.world.treats.forEach((treat) => {
    if (!isTreatAvailable(treat, cat.id) || treat.claimedByCatId) return
    const gap = distance(cat.position, treat.position)
    if (gap < bestGap && racersFor(context, treat.id, cat.id) < 3) {
      bestGap = gap
      best = treat
    }
  })
  return best
}
