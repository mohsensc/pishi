import { clampToBounds } from '../../bounds'
import { perchLevelsOf } from '../../layout'
import type { CatMind, PerchSpot, StepContext } from '../../memory'
import type { CatState, PropState, Vec } from '../../types'
import { perchSpotFor } from '../helpers/perch'
import { spotFree } from '../helpers/propSpots'
import { catRadius } from '../helpers/queries'

export function reachableLevels(tree: PropState, mind: CatMind, context: StepContext): number {
  return Math.min(perchLevelsOf(tree, context.world.height).length, mind.personality.climbLevels)
}

export function levelSpot(tree: PropState, level: number, context: StepContext): PerchSpot | null {
  return perchSpotFor(tree, level, context.world.height)
}

export function isLevelFree(tree: PropState, level: number, cat: CatState, context: StepContext): boolean {
  const spot = levelSpot(tree, level, context)
  return spot !== null && spotFree(context, spot, cat.id)
}

export function treeBase(tree: PropState, cat: CatState, context: StepContext, level: number): Vec {
  const spot = levelSpot(tree, level, context)
  const x = spot ? spot.spot.x : tree.position.x
  return clampToBounds({ x, y: tree.position.y + tree.radius + catRadius(cat) + 6 }, context.bounds)
}

export function levelOccupant(tree: PropState, level: number, cat: CatState, context: StepContext): CatState | undefined {
  return context.world.cats.find((other) => {
    if (other.id === cat.id || other.hidden) return false
    const perch = context.memory.minds.get(other.id)?.perch
    return perch?.propId === tree.id && perch.level === level
  })
}
