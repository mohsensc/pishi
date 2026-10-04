import { interactionContext } from '../engine'
import { toScreen } from '../projection'
import { distance } from '../vector'
import type { Vec, World } from '../types'
import { CARE_REACH } from './careCatalog'
import type { CareItemKind } from './careTypes'
import { presentCareItem } from './present'

export function careTargetAt(world: World, point: Vec): string | null {
  let bestId: string | null = null
  let bestGap = Number.POSITIVE_INFINITY
  world.cats.forEach((cat) => {
    if (cat.hidden) return
    const gap = distance(toScreen(cat.position, cat.height + 16 * cat.coat.scale), point)
    if (gap < CARE_REACH * cat.coat.scale && gap < bestGap) {
      bestGap = gap
      bestId = cat.id
    }
  })
  return bestId
}

export function offerCareItem(world: World, catId: string, itemKind: CareItemKind): boolean {
  return presentCareItem(interactionContext(world), catId, itemKind)
}
