import { interactionContext } from '../engine'
import { toScreen } from '../projection'
import { distance } from '../vector'
import type { CatState, Vec, World } from '../types'
import { fulfillsNeed } from '../needs/needCare'
import { CARE_REACH, WANTED_CARE_REACH } from './careCatalog'
import type { CareItemKind, TrayItemKind } from './careTypes'
import { presentCareItem } from './present'

function gapTo(cat: CatState, point: Vec): number {
  return distance(toScreen(cat.position, cat.height + 16 * cat.coat.scale), point)
}

function nearestCat(world: World, point: Vec, reach: number, accepts: (cat: CatState) => boolean): string | null {
  let bestId: string | null = null
  let bestGap = Number.POSITIVE_INFINITY
  world.cats.forEach((cat) => {
    if (cat.hidden || !accepts(cat)) return
    const gap = gapTo(cat, point)
    if (gap < reach * cat.coat.scale && gap < bestGap) {
      bestGap = gap
      bestId = cat.id
    }
  })
  return bestId
}

function wantsItem(cat: CatState, kind: TrayItemKind): boolean {
  if (kind === 'collar') return !cat.collar
  return Boolean(cat.need) && fulfillsNeed(cat.need as CareItemKind, kind)
}

export function careTargetAt(world: World, point: Vec, kind: TrayItemKind | null = null): string | null {
  if (kind) {
    const wanting = nearestCat(world, point, WANTED_CARE_REACH, (cat) => wantsItem(cat, kind))
    if (wanting) return wanting
  }
  return nearestCat(world, point, CARE_REACH, (cat) => kind !== 'collar' || !cat.collar)
}

export function offerCareItem(world: World, catId: string, itemKind: CareItemKind): boolean {
  return presentCareItem(interactionContext(world), catId, itemKind)
}
